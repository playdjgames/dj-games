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
 * Dedicated hostname for promotional media, so a social publisher only ever
 * sees `media.playdjgames.com/<game>/<file.mp4>`. Requests arriving here are
 * rewritten onto the backend's `/media/` prefix, which keeps the short public
 * URL stable even if the storage behind it ever moves.
 */
const MEDIA_HOST = "media.playdjgames.com";

/**
 * PRESS HOUSE (the print-on-demand store) is a separate Rork project served at
 * `press-house.rork.app`. `shop.playdjgames.com` is proxied onto it exactly the
 * way the apex is proxied onto the DJ Games site, so shoppers stay on the
 * playdjgames.com domain end to end.
 */
const SHOP_HOST = "shop.playdjgames.com";
const SHOP_ORIGIN_HOST = "press-house.rork.app";

/**
 * Send `www.playdjgames.com` to the bare domain with a permanent redirect.
 * Keeps one canonical URL for search engines. Set to false to serve both.
 */
const REDIRECT_WWW_TO_APEX = true;

/**
 * Hop-by-hop headers plus every visitor-IP header Cloudflare stamps on the
 * incoming request. The origins (press-house.rork.app, playdjgames-com.rork.app)
 * sit on Cloudflare too, and a forwarded `CF-Connecting-IP` makes their edge
 * answer `403 error code: 1000` — the exact "Access denied" shoppers hit on
 * shop.playdjgames.com. Never forward them.
 */
const STRIPPED_REQUEST_HEADERS = [
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "x-forwarded-for",
  "x-real-ip",
  "true-client-ip",
  "forwarded",
  "cdn-loop",
];

/** Any `cf-*` header (cf-connecting-ip, cf-ray, cf-visitor, cf-ipcountry, ...). */
const isCloudflareHeader = (name) => name.toLowerCase().startsWith("cf-");

/** The shop's origin, used as a last-resort redirect so a shopper never sees a dead page. */
const SHOP_FALLBACK_ORIGIN = `https://${SHOP_ORIGIN_HOST}`;

/** Origin answers worth one retry before giving up (blocked or temporarily down). */
const isRetryableStatus = (status) => status === 403 || status >= 500;

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

    // The media hostname is its own thing: never redirect it, never send it to
    // the site origin. `media.example.com/vexara/clip.mp4` maps onto the
    // backend's `/media/vexara/clip.mp4`.
    const isMediaHost = url.hostname === MEDIA_HOST;
    const isShopHost = url.hostname === SHOP_HOST;

    // One canonical hostname: fold www. into the bare domain before any work.
    if (!isMediaHost && !isShopHost && REDIRECT_WWW_TO_APEX && url.hostname.startsWith("www.")) {
      const apex = new URL(url.toString());
      apex.hostname = url.hostname.slice(4);
      return Response.redirect(apex.toString(), 301);
    }

    // Promotional media is served by the backend Worker straight out of R2.
    // The shop hostname goes to PRESS HOUSE untouched, /media/ included.
    const isMediaPath = !isShopHost && (isMediaHost || url.pathname.startsWith("/media/"));
    const originHost = isShopHost ? SHOP_ORIGIN_HOST : isMediaPath ? BACKEND_HOST : ORIGIN_HOST;
    const originPath = isMediaHost ? `/media${url.pathname}` : url.pathname;

    // Rebuild the request against the origin, preserving path + query exactly.
    const target = new URL(originPath + url.search, `https://${originHost}`);

    const headers = new Headers();
    for (const [name, value] of request.headers) {
      if (isCloudflareHeader(name) || STRIPPED_REQUEST_HEADERS.includes(name.toLowerCase())) continue;
      headers.set(name, value);
    }
    // Let the origin (and the site's own canonical logic) know the real host.
    headers.set("X-Forwarded-Host", url.hostname);
    headers.set("X-Forwarded-Proto", "https");

    const hasBody = request.method !== "GET" && request.method !== "HEAD";

    const buildOriginRequest = () =>
      new Request(target.toString(), {
        method: request.method,
        headers,
        body: hasBody ? request.body : undefined,
        // Handle redirects ourselves so Location headers can be rewritten to the
        // custom domain instead of leaking the .rork.app hostname.
        redirect: "manual",
      });

    const shopFallback = () =>
      new Response(null, {
        status: 302,
        headers: {
          Location: SHOP_FALLBACK_ORIGIN + url.pathname + url.search,
          "Cache-Control": "no-store",
          "X-PlayDJGames-Proxy": "shop-fallback",
        },
      });

    let response;
    try {
      response = await fetch(buildOriginRequest());
      // Safe (bodiless) requests get one retry if the origin blocks or hiccups.
      if (!hasBody && isRetryableStatus(response.status)) {
        console.warn("origin retry", { host: originHost, path: url.pathname, status: response.status });
        response = await fetch(buildOriginRequest());
      }
    } catch (error) {
      console.error("origin fetch failed", {
        path: url.pathname,
        message: error instanceof Error ? error.message : String(error),
      });
      if (isShopHost && !hasBody) return shopFallback();
      return new Response("The site is temporarily unreachable. Please try again in a moment.", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    // Still blocked after the retry: send the shopper straight to PRESS HOUSE's
    // own address instead of leaving them on an "Access denied" page.
    if (isShopHost && !hasBody && isRetryableStatus(response.status)) {
      console.error("shop origin still failing, redirecting", { path: url.pathname, status: response.status });
      return shopFallback();
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
    // Marks responses that really came through this Worker (diagnostics: a 403
    // WITHOUT this header was blocked by the zone's own security settings).
    outHeaders.set("X-PlayDJGames-Proxy", isShopHost ? "shop" : isMediaPath ? "media" : "site");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: outHeaders,
    });
  },
};
