/**
 * playdjgames.com -> Rork origin proxy
 * ============================================================================
 * WHY THIS EXISTS
 * Rork hosts the DJ Games site at `playdjgames-com.rork.app`. Attaching a
 * custom domain has to happen on Rork's side, and that option is missing from
 * the publish panel, so `playdjgames.com` currently fails TLS
 * (ERR_SSL_VERSION_OR_CIPHER_MISMATCH) because Rork's edge holds no
 * certificate for it.
 *
 * This Worker sidesteps that entirely: Cloudflare terminates TLS for
 * playdjgames.com with its own auto-renewing certificate, then this code
 * fetches the real page from the Rork origin and streams it back. Visitors see
 * playdjgames.com; the site is served by Rork exactly as it is today.
 *
 * DEPLOY: this runs in YOUR Cloudflare account, NOT in Rork. It is deliberately
 * kept out of `rork.json`, so Rork never deploys it. Paste it into a new Worker
 * (Workers & Pages -> Create -> Worker), or `wrangler deploy` from this folder.
 *
 * Paths, query strings, methods, bodies, and status codes all pass through
 * untouched, so /privacy and /support — the URLs on the six App Store listings
 * — keep working.
 * ============================================================================
 */

/** The Rork-hosted origin that actually serves the site. */
const ORIGIN_HOST = "playdjgames-com.rork.app";

/**
 * The project's Cloudflare Worker backend. `/media/*` must reach this instead
 * of the site origin, otherwise the SPA's catch-all route would answer a media
 * request with an HTML page — social publishers need the real bytes.
 */
const BACKEND_HOST = "dj-games-backend.rork.app";

/**
 * Send `www.playdjgames.com` to the bare domain with a permanent redirect.
 * Keeps one canonical URL for search engines. Set to false to serve both.
 */
const REDIRECT_WWW_TO_APEX = true;

/** Hop-by-hop and Cloudflare-internal headers that must not be forwarded. */
const STRIPPED_REQUEST_HEADERS = ["host", "connection", "keep-alive", "transfer-encoding", "upgrade"];

/**
 * Vite emits content-hashed filenames under /assets/, so those bytes can never
 * change behind a given URL and are safe to cache hard at the edge.
 */
const isImmutableAsset = (pathname) => /^\/assets\/.+\.[0-9a-zA-Z_-]{8,}\.(js|css|woff2?|png|jpe?g|svg|webp|avif)$/.test(pathname);

export default {
  /**
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  async fetch(request) {
    const url = new URL(request.url);

    // One canonical hostname: fold www. into the bare domain before any work.
    if (REDIRECT_WWW_TO_APEX && url.hostname.startsWith("www.")) {
      const apex = new URL(url.toString());
      apex.hostname = url.hostname.slice(4);
      return Response.redirect(apex.toString(), 301);
    }

    // Promotional media is served by the backend Worker straight out of R2.
    const isMediaPath = url.pathname.startsWith("/media/");
    const originHost = isMediaPath ? BACKEND_HOST : ORIGIN_HOST;

    // Rebuild the request against the origin, preserving path + query exactly.
    const target = new URL(url.pathname + url.search, `https://${originHost}`);

    const headers = new Headers(request.headers);
    for (const name of STRIPPED_REQUEST_HEADERS) headers.delete(name);
    // Let the origin (and the site's own canonical logic) know the real host.
    headers.set("X-Forwarded-Host", url.hostname);
    headers.set("X-Forwarded-Proto", "https");

    const hasBody = request.method !== "GET" && request.method !== "HEAD";

    const originRequest = new Request(target.toString(), {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // Handle redirects ourselves so Location headers can be rewritten to the
      // custom domain instead of leaking the .rork.app hostname.
      redirect: "manual",
    });

    let response;
    try {
      response = await fetch(originRequest);
    } catch (error) {
      console.error("origin fetch failed", {
        path: url.pathname,
        message: error instanceof Error ? error.message : String(error),
      });
      return new Response("The site is temporarily unreachable. Please try again in a moment.", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    const outHeaders = new Headers(response.headers);

    // Rewrite any redirect that points back at the origin host.
    const location = outHeaders.get("location");
    if (location) {
      try {
        const resolved = new URL(location, target.toString());
        if (resolved.hostname === originHost) {
          resolved.protocol = "https:";
          resolved.hostname = url.hostname;
          resolved.port = "";
          outHeaders.set("location", resolved.toString());
        }
      } catch {
        // A malformed Location is left exactly as the origin sent it.
      }
    }

    if (isImmutableAsset(url.pathname)) {
      outHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    // Don't advertise the upstream host.
    outHeaders.delete("x-powered-by");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: outHeaders,
    });
  },
};
