/**
 * ============================================================================
 * THE LIVE GAME LIBRARY
 * ============================================================================
 * This merges two sources:
 *
 *   1. `games.ts`  — your hand-written descriptions, features and artwork.
 *   2. Apple       — what is actually published right now.
 *
 * Apple always wins on the facts that change (version, price, screenshots,
 * store link, release date, ratings). Your own writing always wins on the
 * parts that make the site feel like yours (tagline, features, key art).
 *
 * The result: ship an update or publish a brand-new app and this website
 * catches up on its own, without anyone editing code.
 * ============================================================================
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { APP_SYNC_POLL_MS, APP_SYNC_STALE_MS, type AppStoreApp, fetchPublishedApps } from "@/data/appStore";
import { GAMES, type Game } from "@/data/games";
import { PRERELEASE_APPS, type PrereleaseApp, type ReviewStage, STAGE_ORDER } from "@/data/prerelease";

/**
 * Every App Store id we know about, released or not. These are looked up
 * individually so an app appears here the moment Apple publishes it, instead of
 * waiting for the developer listing to catch up.
 */
const KNOWN_APP_IDS: number[] = GAMES.map((game) => game.appStoreId).filter(
  (id): id is number => typeof id === "number",
);

/** A game entry, enriched with whatever Apple currently reports. */
export interface LibraryGame extends Game {
  /** Present only when this app is live on the App Store right now. */
  live?: AppStoreApp;
  /**
   * Present only for apps that exist in App Store Connect but are not published
   * yet — real store copy, version and review status for unreleased projects.
   */
  prerelease?: PrereleaseApp;
  /** How close this app is to launching. */
  reviewStage?: ReviewStage;
  /** Age rating from App Store Connect, e.g. "12+". */
  ageRating?: string;
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Extracts the numeric App Store id out of a store URL, if there is one. */
const idFromStoreUrl = (url: string): number | null => {
  const match = /\/id(\d+)/.exec(url);
  return match ? Number(match[1]) : null;
};

const matchesApp = (game: Game, app: AppStoreApp): boolean => {
  if (game.appStoreId && game.appStoreId === app.trackId) return true;
  if (idFromStoreUrl(game.appStoreUrl) === app.trackId) return true;
  return slugify(game.title) === slugify(app.trackName);
};

/**
 * Apple's store copy often opens with an older one-line hook written before the
 * site had its own. The tagline is the line we show everywhere else, so it also
 * replaces that opening line here — the rest of the App Store Connect copy is
 * left exactly as written.
 */
const withSiteHook = (description: string, tagline: string): string => {
  const blocks = description.split("\n\n");
  const opener = blocks[0]?.trim() ?? "";
  const isShortHook = opener.length > 0 && opener.length <= 90 && !opener.includes("\n");
  if (!isShortHook || opener === tagline) return description;
  return [tagline, ...blocks.slice(1)].join("\n\n");
};

/** Builds an entry for an app that is live on the App Store but not yet in `games.ts`. */
const gameFromApp = (app: AppStoreApp): LibraryGame => ({
  slug: slugify(app.trackName),
  title: app.trackName,
  tagline: app.description.split(/[.\n]/)[0]?.trim().slice(0, 140) || "Available now on the App Store.",
  description: app.description,
  genre: app.primaryGenreName,
  status: "available",
  statusLabel: "Available now",
  category: "utilities",
  // Discovered straight from Apple: anything Apple files under Games is a
  // mobile game, everything else is an app.
  division: /game/i.test(app.primaryGenreName) ? "mobile-games" : "apps",
  accent: "#8BE1FF",
  platforms: ["iOS"],
  featured: true,
  releaseDate: app.releaseDate,
  seoTitle: `${app.trackName} — Live on iOS | DJ Games`,
  seoDescription: `${app.trackName} by DJ Games is available now on the App Store for iPhone.`,
  coverImage: app.artworkUrl ?? "",
  coverFit: "contain",
  screenshots: app.screenshotUrls,
  screenshotAspect: "portrait",
  features: [],
  price: app.formattedPrice ?? undefined,
  appStoreUrl: app.trackViewUrl,
  googlePlayUrl: "[GOOGLE_PLAY_URL]",
  websiteUrl: "[GAME_WEBSITE_URL]",
  trailerUrl: "[TRAILER_URL]",
  live: app,
});

/**
 * Folds App Store Connect data for an UNRELEASED app into a curated entry.
 *
 * Apple wins on facts it owns (review status, version, age rating) and on store
 * copy already written there (subtitle, description). The `games.ts` entry keeps
 * what Apple has no concept of — key art, features, genre — and keeps its own
 * title whenever the ASC record is still a working title.
 */
const enrichPrerelease = (game: Game, app: PrereleaseApp): LibraryGame => ({
  ...game,
  title: app.nameIsPlaceholder ? game.title : app.name,
  // The site's own hook line always wins — it is written to sell the game on
  // cards. Apple's description (real store copy) still wins below.
  tagline: game.tagline,
  description: app.description ? withSiteHook(app.description, game.tagline) : game.description,
  // Early concepts must always read as early: never let a review state like
  // "Preparing for submission" make a concept look close to launching.
  statusLabel: game.status === "concept" ? game.statusLabel : app.reviewStateLabel,
  prerelease: app,
  reviewStage: app.reviewStage,
  ageRating: app.ageRating ?? game.ageRating,
});

/** Folds live App Store data into a curated entry. */
const enrich = (game: Game, app: AppStoreApp): LibraryGame => ({
  ...game,
  // An app that Apple is serving is, by definition, released.
  status: "available",
  statusLabel: "Available now",
  // Facts that change on their own:
  price: app.formattedPrice ?? game.price,
  releaseDate: app.releaseDate || game.releaseDate,
  appStoreUrl: app.trackViewUrl,
  // Prefer the live screenshots so new ones show up after every update.
  screenshots: app.screenshotUrls.length > 0 ? app.screenshotUrls : game.screenshots,
  coverImage: game.coverImage || (app.artworkUrl ?? ""),
  genre: game.genre,
  live: app,
});

/** Merges the curated library with what Apple is publishing right now. */
export const mergeLibrary = (apps: AppStoreApp[]): LibraryGame[] => {
  const claimed = new Set<number>();

  const curated: LibraryGame[] = GAMES.map((game) => {
    const app = apps.find((candidate) => !claimed.has(candidate.trackId) && matchesApp(game, candidate));
    if (app) {
      claimed.add(app.trackId);
      return enrich(game, app);
    }

    // Not published yet — use whatever App Store Connect already knows.
    const pending = PRERELEASE_APPS.find((candidate) => candidate.appStoreId === game.appStoreId);
    return pending ? enrichPrerelease(game, pending) : { ...game };
  });

  // Anything published that we have no entry for gets added automatically.
  const discovered = apps.filter((app) => !claimed.has(app.trackId)).map(gameFromApp);

  return [...curated, ...discovered];
};

export interface GameLibrary {
  games: LibraryGame[];
  featured: LibraryGame[];
  released: LibraryGame[];
  /** In review / submitted to Apple — the launch pipeline. */
  submitted: LibraryGame[];
  /** Early concepts — announced, but nowhere near launching. */
  concepts: LibraryGame[];
  upcoming: LibraryGame[];
  latest: LibraryGame | undefined;
  genres: string[];
  bySlug: (slug: string | undefined) => LibraryGame | undefined;
  /** True while the first check with Apple is still in flight. */
  isSyncing: boolean;
  /** True when Apple could not be reached and saved details are showing. */
  isOffline: boolean;
}

const byNewest = (a: LibraryGame, b: LibraryGame): number => {
  const aTime = new Date(a.live?.currentVersionReleaseDate ?? a.releaseDate).getTime();
  const bTime = new Date(b.live?.currentVersionReleaseDate ?? b.releaseDate).getTime();
  if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
  return bTime - aTime;
};

/**
 * The single source of truth for every page that shows apps.
 * Renders instantly from `games.ts`, then upgrades itself once Apple answers.
 */
export const useGameLibrary = (): GameLibrary => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["app-store-apps"],
    queryFn: () => fetchPublishedApps(KNOWN_APP_IDS),
    staleTime: APP_SYNC_STALE_MS,
    gcTime: APP_SYNC_STALE_MS * 4,
    // Catch a release without needing a hard refresh.
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: APP_SYNC_POLL_MS,
    retry: 1,
    initialData: [] as AppStoreApp[],
  });

  return useMemo<GameLibrary>(() => {
    const games = mergeLibrary(data);
    const released = games.filter((game) => game.status === "available").sort(byNewest);

    // Closest to launch first, so "In review" outranks "Submitted".
    const withApple = games
      .filter((game) => game.status === "submitted")
      .sort((a, b) => STAGE_ORDER[a.reviewStage ?? "building"] - STAGE_ORDER[b.reviewStage ?? "building"]);

    return {
      games,
      released,
      featured: released.filter((game) => game.featured),
      submitted: withApple,
      concepts: games.filter((game) => game.status === "concept"),
      upcoming: withApple,
      latest: released[0],
      genres: Array.from(new Set(games.map((game) => game.genre))),
      bySlug: (slug) => games.find((game) => game.slug === slug),
      isSyncing: isLoading,
      isOffline: isError,
    };
  }, [data, isLoading, isError]);
};

/** "Updated Sep 10, 2026" style label used by the live sync badges. */
export const formatSyncDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
