/**
 * ============================================================================
 * LIVE APP STORE SYNC
 * ============================================================================
 * The site asks Apple directly which apps you have published, then merges that
 * with the entries in `games.ts`. This means:
 *
 *   • Publish a NEW app  → it appears on the site by itself.
 *   • Ship an update     → new version, price, screenshots and description
 *                          are picked up automatically.
 *   • An app goes live   → it moves itself out of "The Lab" and into
 *                          "Released", with real store buttons.
 *
 * You never have to edit this file. The only number that matters is your
 * Apple developer ID below, and it is already set.
 * ============================================================================
 */

/** Your Apple developer ID — every app published under it is discovered automatically. */
export const APPLE_DEVELOPER_ID = 6803175690;

/**
 * How long a result is trusted before the site checks Apple again (2 minutes).
 * Apple's own developer listing can lag a few hours behind a fresh release,
 * which is why we also ask about each known app by id — see `fetchPublishedApps`.
 */
export const APP_SYNC_STALE_MS = 1000 * 60 * 2;

/** While a tab stays open, re-check Apple this often (5 minutes). */
export const APP_SYNC_POLL_MS = 1000 * 60 * 5;

const LOOKUP_ENDPOINT = "https://itunes.apple.com/lookup";
const REQUEST_TIMEOUT_MS = 8000;

/** The subset of Apple's lookup response that the site actually uses. */
export interface AppStoreApp {
  trackId: number;
  trackName: string;
  description: string;
  version: string;
  formattedPrice: string | null;
  primaryGenreName: string;
  artworkUrl: string | null;
  screenshotUrls: string[];
  currentVersionReleaseDate: string;
  releaseDate: string;
  trackViewUrl: string;
  averageUserRating: number | null;
  userRatingCount: number;
  minimumOsVersion: string | null;
}

interface RawLookupResult {
  wrapperType?: string;
  kind?: string;
  trackId?: number;
  trackName?: string;
  description?: string;
  version?: string;
  formattedPrice?: string;
  primaryGenreName?: string;
  artworkUrl512?: string;
  artworkUrl100?: string;
  screenshotUrls?: string[];
  currentVersionReleaseDate?: string;
  releaseDate?: string;
  trackViewUrl?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  minimumOsVersion?: string;
}

/** Apple serves thumbnails — swap the size segment for a crisp full-size image. */
const upscaleArtwork = (url: string): string => url.replace(/\/\d+x\d+bb\.(jpg|png)$/, "/1024x1024bb.$1");

const upscaleScreenshot = (url: string): string => url.replace(/\/\d+x\d+bb\.(jpg|png)$/, "/1000x0w.$1");

const normalize = (raw: RawLookupResult): AppStoreApp | null => {
  if (raw.wrapperType !== "software" || typeof raw.trackId !== "number" || !raw.trackName) {
    return null;
  }

  const artwork = raw.artworkUrl512 ?? raw.artworkUrl100 ?? null;

  return {
    trackId: raw.trackId,
    trackName: raw.trackName,
    description: raw.description ?? "",
    version: raw.version ?? "",
    formattedPrice: raw.formattedPrice ?? null,
    primaryGenreName: raw.primaryGenreName ?? "App",
    artworkUrl: artwork ? upscaleArtwork(artwork) : null,
    screenshotUrls: (raw.screenshotUrls ?? []).map(upscaleScreenshot),
    currentVersionReleaseDate: raw.currentVersionReleaseDate ?? raw.releaseDate ?? "",
    releaseDate: raw.releaseDate ?? "",
    trackViewUrl: (raw.trackViewUrl ?? "").split("?")[0],
    averageUserRating: typeof raw.averageUserRating === "number" ? raw.averageUserRating : null,
    userRatingCount: raw.userRatingCount ?? 0,
    minimumOsVersion: raw.minimumOsVersion ?? null,
  };
};

/**
 * Fetches every app published under the developer account.
 *
 * Two lookups happen in a single request:
 *   1. The developer id — discovers apps we know nothing about yet.
 *   2. Each known app id — Apple's per-app record goes live the moment an app
 *      is released, while the developer listing can take hours to catch up.
 *      Without this, a just-released app stays stuck on "In development".
 *
 * Returns an empty list if Apple is unreachable so the site still renders
 * from the entries in `games.ts`.
 *
 * @param knownAppIds App Store ids from the curated library, released or not.
 */
export const fetchPublishedApps = async (knownAppIds: number[] = []): Promise<AppStoreApp[]> => {
  const ids = Array.from(new Set<number>([APPLE_DEVELOPER_ID, ...knownAppIds]));

  const params = new URLSearchParams({
    id: ids.join(","),
    entity: "software",
    country: "us",
    limit: "200",
  });

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${LOOKUP_ENDPOINT}?${params.toString()}`, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`App Store lookup failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { results?: RawLookupResult[] };

    // The same app can arrive twice (once via the developer listing, once via
    // its own id), so keep one record per app.
    const unique = new Map<number, AppStoreApp>();
    for (const raw of payload.results ?? []) {
      const app = normalize(raw);
      if (app) unique.set(app.trackId, app);
    }

    return Array.from(unique.values())
      .sort(
        (a, b) =>
          new Date(b.currentVersionReleaseDate).getTime() - new Date(a.currentVersionReleaseDate).getTime(),
      );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("App Store sync timed out — showing saved app details instead.");
    } else {
      console.warn("App Store sync unavailable — showing saved app details instead.");
    }
    return [];
  } finally {
    window.clearTimeout(timeout);
  }
};
