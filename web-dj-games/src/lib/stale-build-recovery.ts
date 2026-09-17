/**
 * Recovers tabs that were left open across a deploy.
 *
 * Vite content-hashes every JS chunk, so after a new build the previously served
 * filenames stop existing (404). A tab still running the OLD page then fails the
 * moment it requests one of those chunks — on a lazy route, a preload, or the
 * entry module itself — surfacing as "Failed to fetch dynamically imported module".
 * The page is not broken; it is simply outdated.
 *
 * The only correct fix is to re-fetch index.html so the browser picks up the
 * current chunk names. A `sessionStorage` marker guarantees we reload at most
 * once per tab, so a genuinely offline or truly missing chunk surfaces the real
 * error instead of looping forever.
 */
const RELOAD_MARKER = "dj-games-stale-build-reloaded";

const isStaleChunkError = (message: string): boolean =>
  /Failed to fetch dynamically imported module/i.test(message) ||
  /error loading dynamically imported module/i.test(message) ||
  /Importing a module script failed/i.test(message) ||
  /dynamic import/i.test(message);

const reloadOnce = (): void => {
  try {
    if (sessionStorage.getItem(RELOAD_MARKER) === "1") return;
    sessionStorage.setItem(RELOAD_MARKER, "1");
  } catch {
    // Private-mode browsers can throw on sessionStorage; a single reload attempt
    // is still preferable to leaving the visitor on a dead page.
  }

  console.warn("Stale build detected — reloading to fetch the current assets.");
  window.location.reload();
};

/** Starts listening for stale-chunk failures. Safe to call once at startup. */
export const watchForStaleBuild = (): void => {
  // Vite fires this for failed chunk preloads.
  window.addEventListener("vite:preloadError", (event: Event) => {
    event.preventDefault();
    reloadOnce();
  });

  window.addEventListener("error", (event: ErrorEvent) => {
    if (typeof event.message === "string" && isStaleChunkError(event.message)) reloadOnce();
  });

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    const reason: unknown = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason ?? "");
    if (isStaleChunkError(message)) reloadOnce();
  });

  // A tab restored from the background is the most common stale case — clear the
  // marker on a healthy load so a future deploy can recover this tab too.
  window.addEventListener("load", () => {
    try {
      sessionStorage.removeItem(RELOAD_MARKER);
    } catch {
      // Ignore — the marker only guards against reload loops.
    }
  });
};
