/**
 * ============================================================================
 * THE LIVE NEWS FEED
 * ============================================================================
 * The news page is no longer only hand-written posts. It also reports what
 * Apple is doing with the apps, on its own:
 *
 *   • An app goes live      → a "launched on the App Store" entry appears.
 *   • You ship an update    → a "version X is out" entry appears, dated by
 *                             Apple's own release date for that version.
 *   • A build moves through
 *     review                → the pipeline board changes stage by itself.
 *
 * Nothing here is typed by hand. Store entries come from the live App Store
 * lookup (`library.ts`), pipeline stages come from the App Store Connect sync
 * (`prerelease.ts`). Hand-written posts always win a tie: when a post already
 * covers a launch on the same day, the automatic entry steps aside so the page
 * never says the same thing twice.
 * ============================================================================
 */

import { useMemo } from "react";

import { type LibraryGame, useGameLibrary } from "@/data/library";
import { type NewsPost, sortedPosts } from "@/data/news";
import { isWithApple, PRERELEASE_SYNCED_AT, type ReviewStage, STAGE_ORDER } from "@/data/prerelease";

/** A launch is the first release; everything after it is an update. */
export type StoreUpdateKind = "launch" | "update";

/** One automatically-detected App Store event. */
export interface StoreUpdate {
  id: string;
  kind: StoreUpdateKind;
  game: LibraryGame;
  title: string;
  summary: string;
  version: string;
  /** ISO date Apple reports for this release. */
  date: string;
}

/** One row in the news list: either a written post or a store event. */
export type FeedItem =
  | { key: string; date: string; kind: "post"; post: NewsPost }
  | { key: string; date: string; kind: "store"; update: StoreUpdate };

/** One unreleased app and how far along it is right now. */
export interface PipelineEntry {
  game: LibraryGame;
  stage: ReviewStage;
  label: string;
  version: string | null;
  /** True once Apple physically has the build (submitted / review / approved). */
  withApple: boolean;
}

export interface NewsFeedData {
  items: FeedItem[];
  pipeline: PipelineEntry[];
  /** How many entries on this page wrote themselves. */
  autoCount: number;
  isSyncing: boolean;
  isOffline: boolean;
  /** When App Store Connect was last read for unreleased apps. */
  prereleaseSyncedAt: string;
}

const dayOf = (iso: string): string => iso.slice(0, 10);

const isRealDate = (iso: string): boolean => iso.length > 0 && !Number.isNaN(new Date(iso).getTime());

/**
 * Turns a live app record into its newest store event.
 *
 * Apple reports two dates: when the app first shipped and when the current
 * version shipped. Same day means the app has never been updated, so the event
 * is the launch itself.
 */
const storeUpdateFor = (game: LibraryGame): StoreUpdate | null => {
  const app = game.live;
  if (!app) return null;

  const released = isRealDate(app.releaseDate) ? app.releaseDate : "";
  const current = isRealDate(app.currentVersionReleaseDate) ? app.currentVersionReleaseDate : released;
  if (!current) return null;

  const isLaunch = !released || dayOf(current) === dayOf(released);
  const version = app.version || "1.0";
  const price = app.formattedPrice?.toLowerCase() === "free" ? "Free" : app.formattedPrice;

  if (isLaunch) {
    return {
      id: `store-launch-${app.trackId}`,
      kind: "launch",
      game,
      title: `${game.title} is live on the App Store`,
      summary: price
        ? `${price} on iPhone — version ${version} is available to download now.`
        : `Version ${version} is available to download now.`,
      version,
      date: current,
    };
  }

  return {
    id: `store-update-${app.trackId}-${version}`,
    kind: "update",
    game,
    title: `${game.title} updated to ${version}`,
    summary: "The new build is rolling out on the App Store right now.",
    version,
    date: current,
  };
};

/**
 * The news page's single source of truth: written posts and App Store events,
 * merged into one timeline, plus the live review pipeline.
 */
export const useNewsFeed = (): NewsFeedData => {
  const { games, submitted, concepts, isSyncing, isOffline } = useGameLibrary();

  return useMemo<NewsFeedData>(() => {
    const posts = sortedPosts();

    // A written post about a game on a given day is the better story — skip the
    // generated entry rather than print both.
    const covered = new Set<string>(
      posts.filter((post) => post.gameSlug).map((post) => `${post.gameSlug}:${dayOf(post.date)}`),
    );

    const updates = games
      .map(storeUpdateFor)
      .filter((update): update is StoreUpdate => update !== null)
      .filter((update) => !covered.has(`${update.game.slug}:${dayOf(update.date)}`));

    const items: FeedItem[] = [
      ...posts.map<FeedItem>((post) => ({ key: `post-${post.slug}`, date: post.date, kind: "post", post })),
      ...updates.map<FeedItem>((update) => ({
        key: update.id,
        date: update.date,
        kind: "store",
        update,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const pipeline: PipelineEntry[] = [...submitted, ...concepts]
      .map((game) => {
        const stage: ReviewStage = game.reviewStage ?? (game.status === "submitted" ? "submitted" : "building");
        return {
          game,
          stage,
          label: game.prerelease?.reviewStateLabel ?? game.statusLabel,
          version: game.prerelease?.version ?? null,
          withApple: isWithApple(stage),
        };
      })
      .sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]);

    return {
      items,
      pipeline,
      autoCount: updates.length,
      isSyncing,
      isOffline,
      prereleaseSyncedAt: PRERELEASE_SYNCED_AT,
    };
  }, [games, submitted, concepts, isSyncing, isOffline]);
};
