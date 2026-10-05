// functions/index.ts — the entrypoint for the DJ Games backend.
//
// Routes:
//   POST /newsletter/subscribe      public — stores an email from the site forms
//   GET  /newsletter/list           admin  — JSON list of subscribers
//   GET  /newsletter/export.csv     admin  — CSV download of subscribers
//   POST /newsletter/remove         admin  — delete one subscriber
//
//   GET  /media/<folder>/<file>     PUBLIC — streams the actual media bytes with
//                                   the real MIME type and Range support, so
//                                   Meta/Windsor can fetch it with a plain GET.
//   GET  /media-admin/config        admin  — whether R2 storage is wired up
//   GET  /media-admin/health        admin  — live credential check against R2
//   GET  /media-admin/list          admin  — metadata for every stored file
//   POST /media-admin/upload-url    admin  — presigned R2 PUT for one upload
//   POST /media-admin/enable-uploads admin — writes the bucket CORS policy so the
//                                   browser is allowed to PUT directly to R2
//   POST /media-admin/record        admin  — save metadata after upload finishes
//   POST /media-admin/folder        admin  — create a game folder
//   POST /media-admin/remove-folder admin  — delete an empty folder
//   POST /media-admin/rename        admin  — copy to a new key, drop the old one
//   POST /media-admin/remove        admin  — delete from R2 and the index
//
//   POST /tip/checkout              public — creates a Stripe Checkout session for a
//                                   card tip; returns { url } to redirect to
//   GET  /tip/status                public — whether card tips are configured
//
//   POST /shop/lookup               public — guest "find my order": order number +
//                                   checkout email → status, items, tracking
//   GET  /shop-admin/orders         admin  — every store order (?tracking=1 adds
//                                   live Printify status + tracking)
//
// Admin routes require the NEWSLETTER_ADMIN_KEY project env, sent either as
// `Authorization: Bearer <key>` or a `?key=` query param (needed so a browser
// download link can carry it). Without the env set, admin routes stay closed.
//
// The /media/* route is deliberately unauthenticated: social publishers such as
// Windsor.ai and Meta must retrieve the file with no cookie, token or redirect.
// Only exact keys resolve — there is no public index of the library.

export { Subscribers } from "./subscribers";
export { MediaLibrary } from "./media";
export { Orders } from "./orders";

import type { MediaRow } from "./media";
import { contentTypeForKey, safeFilename, safeSlug, specForContentType } from "./_lib/media-types";
import {
  assertAddress,
  createCheckoutSession,
  newOrderId,
  priceLines,
  quote,
  shopErrorResponse,
  uploadPrintFile,
} from "./_lib/shop";
import {
  copyObject,
  createBucket,
  deleteObject,
  getBucketCors,
  getObject,
  headBucket,
  presignPut,
  putBucketCors,
  readR2Config,
  type R2Config,
} from "./_lib/r2";

type Env = {
  DO: Fetcher;
  NEWSLETTER_ADMIN_KEY?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
  /** Optional custom hostname (e.g. media.playdjgames.com) serving the bucket. */
  R2_PUBLIC_BASE_URL?: string;
  /** Stripe secret key — server-only, used to create card-tip Checkout sessions. */
  STRIPE_SECRET_KEY?: string;
  PRINTIFY_API_TOKEN?: string;
  PRINTIFY_SHOP_ID?: string;
};

/** Hosts allowed as Checkout success/cancel return targets. */
const TIP_RETURN_ORIGINS = new Set<string>([
  "https://playdjgames.com",
  "https://www.playdjgames.com",
  "https://2s7937nfb5j5e0l2chd6r-web-dj-games.rork.live",
]);
const TIP_DEFAULT_ORIGIN = "https://playdjgames.com";
const TIP_MIN_USD = 1;
const TIP_MAX_USD = 10_000;

/**
 * Creates a one-off Stripe Checkout session for a USD tip.
 * The amount is re-validated here; the client value is never trusted.
 */
const createTipCheckout = async (request: Request, env: Env): Promise<Response> => {
  const secret = env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return Response.json({ ok: false, error: "card_not_configured" }, { status: 503 });
  }

  const body = await jsonBody<{ amount?: number; origin?: string }>(request);
  const amount = Number(body?.amount);
  if (!Number.isInteger(amount) || amount < TIP_MIN_USD || amount > TIP_MAX_USD) {
    return Response.json({ ok: false, error: "invalid_amount" }, { status: 400 });
  }

  const requestedOrigin = String(body?.origin ?? "").replace(/\/+$/, "");
  const origin = TIP_RETURN_ORIGINS.has(requestedOrigin) ? requestedOrigin : TIP_DEFAULT_ORIGIN;

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("submit_type", "donate");
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", String(amount * 100));
  form.set("line_items[0][price_data][product_data][name]", "Tip for DJ Games LLC");
  form.set(
    "line_items[0][price_data][product_data][description]",
    "Thanks for keeping the house moving.",
  );
  form.set("success_url", `${origin}/donate?tip=thanks`);
  form.set("cancel_url", `${origin}/donate?tip=cancelled`);
  form.set("metadata[source]", "playdjgames-donate");

  const stripe = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const data = (await stripe.json().catch(() => null)) as
    | { url?: string; error?: { type?: string; code?: string; message?: string } }
    | null;

  if (!stripe.ok || !data?.url) {
    // Log Stripe's error type/code only — never the key or request body.
    console.error("stripe checkout failed", {
      status: stripe.status,
      type: data?.error?.type,
      code: data?.error?.code,
      message: data?.error?.message,
    });
    return Response.json({ ok: false, error: "checkout_failed" }, { status: 502 });
  }

  return Response.json({ ok: true, url: data.url });
};

/* ------------------------------ merch checkout ------------------------------ */

/**
 * The store's own checkout: Stripe takes payment on the DJ Games store page,
 * then the order goes straight to our Printify shop for printing and shipping.
 * PRESS HOUSE is not involved at any point. Prices, variants and shipping are
 * always resolved server-side from the live Printify shop — the browser only
 * says which item and variant it picked.
 */
const MERCH_MAX_LINES = 30;
const MERCH_MAX_QTY = 20;

type MerchLine =
  | { kind: "listing"; productId: string; variantId: number; qty: number }
  | {
      kind: "custom";
      productId: string;
      variantId: string;
      qty: number;
      custom: Record<string, string>;
      image?: string;
    }
  | {
      kind: "design";
      productId: string;
      variantId: string;
      qty: number;
      design: { imageId: string; x: number; y: number; scale: number };
    };

const CUSTOM_STICKER_TYPES = new Set(["tiny", "standard", "large", "bumper", "window"]);
const CUSTOM_STICKER_SHAPES = new Set(["text", "circle", "square", "star", "heart"]);
const CUSTOM_STICKER_FONTS = new Set(["block", "condensed", "rounded", "script"]);
const CUSTOM_STICKER_COLORS = new Set(["black", "white", "silver", "yellow", "red", "blue", "gold", "pink", "green"]);
/** The DJ Games sticker pack art — the only design the store prints on a sheet. */
const STICKER_PACK_IMAGE_IDS = new Set(["6aba6884b17b322bb69c3752"]);
/** Largest custom-sticker print file accepted (base64 chars, ~9 MB PNG). */
const MAX_PRINT_FILE_CHARS = 12_000_000;

const toMerchLine = (raw: unknown): MerchLine | null => {
  const line = (raw ?? {}) as Record<string, unknown>;
  const qty = Number(line.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > MERCH_MAX_QTY) return null;
  const productId = String(line.productId ?? "");

  if (line.kind === "custom") {
    const source = (line.custom ?? {}) as Record<string, unknown>;
    const typeId = String(source.typeId ?? "");
    const variantId = String(line.variantId ?? "");
    const text = String(source.text ?? "").replace(/\s+/g, " ").trim().slice(0, 24);
    if (!CUSTOM_STICKER_TYPES.has(typeId) || productId !== `prod_custom_${typeId}`) return null;
    if (!new RegExp(`^prod_custom_${typeId}_os_[a-z0-9]{2,12}$`).test(variantId)) return null;
    if (!text) return null;
    const custom = {
      typeId,
      sizeId: String(source.sizeId ?? "").slice(0, 12),
      shape: String(source.shape ?? ""),
      font: String(source.font ?? ""),
      color: String(source.color ?? ""),
      text,
    };
    if (!CUSTOM_STICKER_SHAPES.has(custom.shape) || !CUSTOM_STICKER_FONTS.has(custom.font)) return null;
    if (!CUSTOM_STICKER_COLORS.has(custom.color) || !/^[a-z0-9]{2,8}$/.test(custom.sizeId)) return null;
    const image = typeof line.image === "string" ? line.image : undefined;
    if (image !== undefined && (image.length > MAX_PRINT_FILE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(image))) return null;
    return { kind: "custom", productId, variantId, qty, custom, ...(image ? { image } : {}) };
  }

  if (line.kind === "design") {
    const source = (line.design ?? {}) as Record<string, unknown>;
    const design = {
      imageId: String(source.imageId ?? ""),
      x: Number(source.x),
      y: Number(source.y),
      scale: Number(source.scale),
    };
    if (productId !== "prod_design_sticker_sheet" || line.variantId !== "prod_design_sticker_sheet_os_os") return null;
    if (!STICKER_PACK_IMAGE_IDS.has(design.imageId)) return null;
    if (![design.x, design.y, design.scale].every((n) => Number.isFinite(n) && n > 0 && n <= 1)) return null;
    return { kind: "design", productId, variantId: "prod_design_sticker_sheet_os_os", qty, design };
  }

  const variantId = Number(line.variantId);
  if (!/^prd_[a-z0-9]+$/i.test(productId)) return null;
  if (!Number.isInteger(variantId) || variantId <= 0) return null;
  return { kind: "listing", productId, variantId, qty };
};

const toMerchLines = (value: unknown): MerchLine[] | null => {
  if (!Array.isArray(value) || value.length === 0 || value.length > MERCH_MAX_LINES) return null;
  const lines: MerchLine[] = [];
  for (const raw of value) {
    const line = toMerchLine(raw);
    if (!line) return null;
    lines.push(line);
  }
  return lines;
};

const toMerchAddress = (value: unknown): Record<string, string> => {
  const source = (value ?? {}) as Record<string, unknown>;
  const field = (key: string, max = 120): string => String(source[key] ?? "").trim().slice(0, max);
  return {
    email: field("email", 200),
    name: field("name"),
    address1: field("address1"),
    address2: field("address2"),
    city: field("city"),
    state: field("state", 40),
    zip: field("zip", 20),
    country: "US",
  };
};

const handleMerch = async (path: string, request: Request, env: Env): Promise<Response | null> => {
  if (path === "/shop/quote" && request.method === "POST") {
    const body = await jsonBody<{ lines?: unknown; address?: unknown }>(request);
    const lines = toMerchLines(body?.lines);
    if (!lines) return Response.json({ error: "YOUR BAG IS EMPTY" }, { status: 400 });
    const address = toMerchAddress(body?.address);
    try {
      assertAddress(address);
      const priced = await priceLines(env, lines);
      return Response.json(await quote(env, priced, address), { headers: { "Cache-Control": "no-store" } });
    } catch (error: unknown) {
      return shopErrorResponse(error);
    }
  }

  if (path === "/shop/order" && request.method === "POST") {
    const body = await jsonBody<{ lines?: unknown; address?: unknown; origin?: string }>(request);
    const lines = toMerchLines(body?.lines);
    if (!lines) return Response.json({ error: "YOUR BAG IS EMPTY" }, { status: 400 });
    const address = toMerchAddress(body?.address);
    const requestedOrigin = String(body?.origin ?? "").replace(/\/+$/, "");
    const origin = TIP_RETURN_ORIGINS.has(requestedOrigin) ? requestedOrigin : TIP_DEFAULT_ORIGIN;
    try {
      assertAddress(address);
      const priced = await priceLines(env, lines, true);
      const pricedQuote = await quote(env, priced, address);
      const orderId = newOrderId();

      // Upload custom print files now and record the image ids on the jobs, so
      // fulfilment never needs the (large) raw files. The stored lines carry
      // the authoritative server-side pricing — nothing from the request.
      for (const [index, line] of priced.entries()) {
        if (line.printFile && line.job.kind === "made") {
          line.job.imageId = await uploadPrintFile(env, `djg-${orderId}-${index}`, line.printFile);
        }
      }

      const session = await createCheckoutSession(env, {
        orderId,
        lines: priced,
        shippingCents: pricedQuote.shipping_cents,
        email: address.email,
        origin,
      });
      await callDO(env, "Orders", "global", "/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          email: address.email,
          address,
          lines: priced.map(({ printFile: _file, ...rest }) => rest),
          merchandise_cents: pricedQuote.merchandise_cents,
          shipping_cents: pricedQuote.shipping_cents,
          total_cents: pricedQuote.total_cents,
          session_id: session.id,
        }),
      });
      return Response.json({ url: session.url, orderId });
    } catch (error: unknown) {
      return shopErrorResponse(error);
    }
  }

  if (path === "/shop/lookup" && request.method === "POST") {
    const body = await jsonBody<{ id?: string; email?: string }>(request);
    return callDO(env, "Orders", "global", "/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: String(body?.id ?? ""), email: String(body?.email ?? "") }),
    });
  }

  const orderMatch = path.match(/^\/shop\/orders\/([A-Za-z0-9_-]{4,80})$/);
  if (orderMatch && request.method === "GET") {
    const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
    const query = /^[A-Za-z0-9_]{1,255}$/.test(sessionId) ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    return callDO(env, "Orders", "global", `/status/${encodeURIComponent(orderMatch[1])}${query}`, {
      method: "GET",
    });
  }

  return null;
};

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const SUBSCRIBERS_ID = "global";
const MEDIA_ID = "global";
const UPLOAD_URL_TTL_SECONDS = 900;

const withCors = (response: Response): Response => {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

/** Constant-time-ish comparison so the admin key can't be probed byte by byte. */
const keysMatch = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const isAuthorized = (request: Request, env: Env): boolean => {
  const configured = env.NEWSLETTER_ADMIN_KEY?.trim();
  if (!configured) return false;

  const header = request.headers.get("Authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const query = new URL(request.url).searchParams.get("key")?.trim() ?? "";
  const provided = bearer.length > 0 ? bearer : query;

  return provided.length > 0 && keysMatch(provided, configured);
};

const callDO = (env: Env, className: string, id: string, path: string, init?: RequestInit): Promise<Response> => {
  const request = new Request(`https://internal${path}`, init);
  request.headers.set("X-Rork-DO-Class", className);
  request.headers.set("X-Rork-DO-Id", id);
  return env.DO.fetch(request);
};

/** Dispatches to the single global Subscribers Durable Object instance. */
const callStore = (env: Env, path: string, init?: RequestInit): Promise<Response> =>
  callDO(env, "Subscribers", SUBSCRIBERS_ID, path, init);

/** Dispatches to the single global MediaLibrary Durable Object instance. */
const callMedia = (env: Env, path: string, init?: RequestInit): Promise<Response> =>
  callDO(env, "MediaLibrary", MEDIA_ID, path, init);

const jsonBody = async <T>(request: Request): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};

/** The short, canonical public hostname for media once its DNS is live. */
const MEDIA_HOST_BASE = "https://media.playdjgames.com";

/** How long a host liveness result is trusted before being re-probed. */
const HOST_PROBE_TTL_MS = 5 * 60_000;

/** Cached liveness of the short media host, so we probe once per 5 minutes. */
let mediaHostProbe: { live: boolean; checkedAt: number } | null = null;

/**
 * Is the short media hostname actually serving?
 *
 * This is the dynamic part: no hardcoded "the subdomain works now" flag to flip
 * by hand. A missing DNS record makes `fetch` throw, and a hostname that
 * resolves but has no origin behind it answers 5xx (Cloudflare 522/1014) — both
 * count as dead. Anything else (including a 404 for the probe path, which is the
 * correct answer for a key that doesn't exist) proves the host is reachable.
 */
const isMediaHostLive = async (): Promise<boolean> => {
  const now = Date.now();
  if (mediaHostProbe && now - mediaHostProbe.checkedAt < HOST_PROBE_TTL_MS) {
    return mediaHostProbe.live;
  }

  let live = false;
  try {
    const probe = await fetch(`${MEDIA_HOST_BASE}/__host-probe`, {
      method: "HEAD",
      redirect: "manual",
    });
    live = probe.status < 500;
  } catch {
    // Unresolvable hostname or TLS failure — treat as not live.
    live = false;
  }

  mediaHostProbe = { live, checkedAt: now };
  return live;
};

/**
 * The public base for media URLs, resolved per request.
 *
 * Order matters: the short host wins as soon as it genuinely answers, so links
 * upgrade themselves the moment the DNS record exists — nothing to redeploy.
 * Until then it falls back to an explicitly configured base, and finally to this
 * Worker's own `/media` route. Every form is unauthenticated and stable, and
 * because stored records keep only the storage key, existing files pick up the
 * new hostname automatically too.
 */
const resolveMediaBase = async (env: Env, request: Request): Promise<string> => {
  if (await isMediaHostLive()) return MEDIA_HOST_BASE;

  const configured = env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (configured && configured.length > 0) return configured;

  return `${new URL(request.url).origin}/media`;
};

const publicUrlFor = (base: string, storageKey: string): string => `${base}/${storageKey}`;

const decorate = (base: string, row: MediaRow): MediaRow & { url: string } => ({
  ...row,
  url: publicUrlFor(base, row.storage_key),
});

/**
 * PUBLIC: streams the real bytes for one object.
 *
 * Correct `Content-Type`, `Accept-Ranges` and 206 passthrough matter here —
 * Instagram/Meta reject media served as `application/octet-stream` or behind a
 * redirect, and video scrubbing needs byte ranges.
 */
const servePublicMedia = async (
  config: R2Config,
  storageKey: string,
  request: Request,
): Promise<Response> => {
  const upstream = await getObject(config, storageKey, request.headers.get("range"));

  if (upstream.status === 404 || upstream.status === 403) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  if (!upstream.ok && upstream.status !== 206) {
    console.error("r2 read failed", { storageKey, status: upstream.status });
    return new Response("Media temporarily unavailable", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? contentTypeForKey(storageKey));
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges, Content-Type");
  headers.set("X-Content-Type-Options", "nosniff");
  // Inline so a browser plays it instead of downloading it.
  headers.set("Content-Disposition", `inline; filename="${storageKey.split("/").pop() ?? "media"}"`);

  for (const name of ["content-length", "content-range", "etag", "last-modified"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  // A HEAD must carry the same headers but no body.
  const body = request.method === "HEAD" ? null : upstream.body;
  return new Response(body, { status: upstream.status, headers });
};

const handleMediaAdmin = async (path: string, request: Request, env: Env): Promise<Response> => {
  const config = readR2Config(env as unknown as Record<string, unknown>);
  const base = await resolveMediaBase(env, request);
  const workerBase = `${new URL(request.url).origin}/media`;

  if (path === "/media-admin/config" && request.method === "GET") {
    return Response.json({
      ok: true,
      storageReady: config !== null,
      publicBase: base,
      usingCustomDomain: base !== workerBase,
      shortHostLive: base === MEDIA_HOST_BASE,
    });
  }

  if (!config) {
    return Response.json({ ok: false, error: "storage_not_configured" }, { status: 503 });
  }

  // Live credential check: proves the keys sign correctly and the bucket is
  // reachable, rather than merely that the envs are present. Reports only a
  // status word — never the bucket, account or key material — and probes a
  // reserved key that can never collide with real media.
  if (path === "/media-admin/health" && request.method === "GET") {
    // Probe the BUCKET, not an object. A HEAD on a key returns 404 both when
    // the object is simply absent and when the bucket does not exist at all,
    // so an object probe reports a broken setup as healthy.
    const probe = await headBucket(config);
    if (probe.status === 200) {
      return Response.json({ ok: true, storage: "ready" });
    }
    if (probe.status === 404) {
      return Response.json({ ok: false, storage: "bucket_missing" }, { status: 503 });
    }
    if (probe.status === 401 || probe.status === 403) {
      return Response.json({ ok: false, storage: "credentials_rejected" }, { status: 503 });
    }
    console.error("r2 health probe failed", { status: probe.status });
    return Response.json({ ok: false, storage: "unavailable" }, { status: 503 });
  }

  if (path === "/media-admin/list" && request.method === "GET") {
    const response = await callMedia(env, "/list", { method: "GET" });
    const data = (await response.json()) as { media: MediaRow[]; folders: { slug: string; label: string }[] };
    return Response.json({
      ok: true,
      media: data.media.map((row) => decorate(base, row)),
      folders: data.folders,
      publicBase: base,
    });
  }

  if (path === "/media-admin/upload-url" && request.method === "POST") {
    const body = await jsonBody<{ folder?: string; filename?: string; contentType?: string; size?: number }>(request);
    if (!body) return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });

    const spec = specForContentType(String(body.contentType ?? ""));
    if (!spec) {
      return Response.json({ ok: false, error: "unsupported_type" }, { status: 415 });
    }

    const size = typeof body.size === "number" ? body.size : 0;
    if (size <= 0 || size > spec.maxBytes) {
      return Response.json({ ok: false, error: "file_too_large", maxBytes: spec.maxBytes }, { status: 413 });
    }

    const folder = safeSlug(String(body.folder ?? "")) || "general";
    const filename = safeFilename(String(body.filename ?? "file"), spec.extensions[0] ?? "bin");
    const storageKey = `${folder}/${filename}`;

    // Refuse to silently overwrite an existing file — the URL is permanent, so
    // replacing bytes behind a live social post would be a nasty surprise.
    const existing = await callMedia(env, `/by-key?key=${encodeURIComponent(storageKey)}`, { method: "GET" });
    const existingData = (await existing.json()) as { item: MediaRow | null };
    if (existingData.item) {
      return Response.json({ ok: false, error: "already_exists", filename }, { status: 409 });
    }

    const uploadUrl = await presignPut(config, storageKey, spec.contentType, UPLOAD_URL_TTL_SECONDS);

    return Response.json({
      ok: true,
      uploadUrl,
      storageKey,
      folder,
      filename,
      contentType: spec.contentType,
      publicUrl: publicUrlFor(base, storageKey),
    });
  }

  // Self-service bucket setup. A browser -> R2 upload is cross-origin, so R2
  // blocks it until the bucket carries a CORS policy naming the site. Rather
  // than make the studio hand-edit bucket settings in the Cloudflare dashboard,
  // the Worker writes the policy itself with the credentials it already holds.
  // The page calls this automatically the first time an upload is refused.
  if (path === "/media-admin/enable-uploads" && request.method === "POST") {
    const body = await jsonBody<{ origin?: string }>(request);
    const requested = String(body?.origin ?? "").trim();

    // Always authorise the caller's own origin, plus the known site hosts, so
    // uploads work from the live domain and the preview build alike.
    const origins = new Set<string>([
      "https://playdjgames.com",
      "https://www.playdjgames.com",
      "https://2s7937nfb5j5e0l2chd6r-web-dj-games.rork.live",
    ]);
    if (/^https:\/\/[a-z0-9.-]+$/i.test(requested)) origins.add(requested);

    // The configured bucket may not exist yet (R2 does not create one on first
    // write). Create it before writing the policy, otherwise every upload fails
    // with NoSuchBucket long before CORS is ever consulted.
    let created = false;
    const exists = await headBucket(config);
    if (exists.status === 404) {
      const made = await createBucket(config);
      if (!made.ok) {
        const detail = await made.text().catch(() => "");
        const code = /<Code>([^<]+)<\/Code>/.exec(detail)?.[1] ?? "unknown";
        console.error("r2 bucket create failed", { status: made.status, code });
        return Response.json(
          { ok: false, error: "bucket_create_failed", status: made.status, code },
          { status: 502 },
        );
      }
      created = true;
    }

    const applied = await putBucketCors(config, [...origins]);
    if (!applied.ok) {
      // R2 answers with an S3 XML error; surface just its <Code> so the studio
      // learns *why* (almost always a token lacking bucket-config permission)
      // without ever echoing bucket, account or key material.
      const detail = await applied.text().catch(() => "");
      const code = /<Code>([^<]+)<\/Code>/.exec(detail)?.[1] ?? "unknown";
      console.error("r2 cors write failed", { status: applied.status, code });
      return Response.json(
        { ok: false, error: "cors_write_failed", status: applied.status, code },
        { status: 502 },
      );
    }

    // Read it back so a success here really means uploads are unblocked.
    const verify = await getBucketCors(config);
    return Response.json({ ok: true, verified: verify.ok, bucketCreated: created, origins: [...origins] });
  }

  if (path === "/media-admin/record" && request.method === "POST") {
    const body = await request.text();
    const response = await callMedia(env, "/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = (await response.json()) as { ok: boolean; item?: MediaRow };
    if (!data.ok || !data.item) return Response.json(data, { status: response.status });
    return Response.json({ ok: true, item: decorate(base, data.item) });
  }

  if (path === "/media-admin/folder" && request.method === "POST") {
    const body = await jsonBody<{ label?: string }>(request);
    const label = String(body?.label ?? "").trim();
    const slug = safeSlug(label);
    if (label.length === 0 || slug.length === 0) {
      return Response.json({ ok: false, error: "invalid_folder" }, { status: 400 });
    }
    return callMedia(env, "/folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, label }),
    });
  }

  if (path === "/media-admin/remove-folder" && request.method === "POST") {
    const body = await request.text();
    return callMedia(env, "/remove-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  if (path === "/media-admin/rename" && request.method === "POST") {
    const body = await jsonBody<{ id?: string; filename?: string }>(request);
    if (!body?.id || !body.filename) {
      return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }

    const listResponse = await callMedia(env, "/list", { method: "GET" });
    const { media } = (await listResponse.json()) as { media: MediaRow[] };
    const row = media.find((item) => item.id === body.id);
    if (!row) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

    const extension = row.filename.split(".").pop() ?? "bin";
    const nextFilename = safeFilename(body.filename, extension);
    const nextKey = `${row.folder}/${nextFilename}`;

    if (nextKey === row.storage_key) {
      return Response.json({ ok: true, item: decorate(base, row) });
    }
    if (media.some((item) => item.storage_key === nextKey)) {
      return Response.json({ ok: false, error: "already_exists" }, { status: 409 });
    }

    const copied = await copyObject(config, row.storage_key, nextKey);
    if (!copied.ok) {
      console.error("r2 copy failed", { from: row.storage_key, to: nextKey, status: copied.status });
      return Response.json({ ok: false, error: "copy_failed" }, { status: 502 });
    }

    const updated = await callMedia(env, "/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, filename: nextFilename, storage_key: nextKey }),
    });
    const updatedData = (await updated.json()) as { ok: boolean; item?: MediaRow };
    if (!updatedData.ok || !updatedData.item) {
      return Response.json({ ok: false, error: "index_update_failed" }, { status: 500 });
    }

    // Old key only disappears once the index points at the new one.
    const removed = await deleteObject(config, row.storage_key);
    if (!removed.ok && removed.status !== 404) {
      console.warn("r2 delete of old key failed", { key: row.storage_key, status: removed.status });
    }

    return Response.json({ ok: true, item: decorate(base, updatedData.item) });
  }

  if (path === "/media-admin/remove" && request.method === "POST") {
    const body = await request.text();
    const response = await callMedia(env, "/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = (await response.json()) as { ok: boolean; item?: MediaRow; error?: string };
    if (!data.ok || !data.item) return Response.json(data, { status: response.status });

    const removed = await deleteObject(config, data.item.storage_key);
    if (!removed.ok && removed.status !== 404) {
      console.error("r2 delete failed", { key: data.item.storage_key, status: removed.status });
      return Response.json({ ok: false, error: "storage_delete_failed" }, { status: 502 });
    }

    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: "not_found" }, { status: 404 });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      if (path === "/ping") {
        return withCors(Response.json({ ok: true, now: new Date().toISOString() }));
      }

      // ---- PUBLIC media file serving (no auth, no cookies, no redirect) ----
      if (path.startsWith("/media/") && (request.method === "GET" || request.method === "HEAD")) {
        const config = readR2Config(env as unknown as Record<string, unknown>);
        if (!config) return new Response("Not found", { status: 404 });

        const storageKey = decodeURIComponent(path.slice("/media/".length));
        // Only `<folder>/<file>` keys resolve; no traversal, no listing.
        if (!/^[a-z0-9-]+\/[a-z0-9.-]+$/.test(storageKey) || storageKey.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        return servePublicMedia(config, storageKey, request);
      }

      if (path === "/tip/status" && request.method === "GET") {
        const key = env.STRIPE_SECRET_KEY?.trim() ?? "";
        // Reports only the key's mode, never any key material.
        const mode = key.startsWith("sk_live_") || key.startsWith("rk_live_")
          ? "live"
          : key.length > 0
            ? "test"
            : "off";
        return withCors(Response.json({ ok: true, card: mode !== "off", mode }));
      }

      if (path === "/tip/checkout" && request.method === "POST") {
        return withCors(await createTipCheckout(request, env));
      }

      if (path.startsWith("/shop/")) {
        const merch = await handleMerch(path, request, env);
        if (merch) return withCors(merch);
      }

      if (path === "/newsletter/subscribe" && request.method === "POST") {
        const body = await request.text();
        const result = await callStore(env, "/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        return withCors(result);
      }

      const isAdminRoute =
        path.startsWith("/newsletter/") || path.startsWith("/media-admin/") || path.startsWith("/shop-admin/");
      if (isAdminRoute && !isAuthorized(request, env)) {
        const configured = Boolean(env.NEWSLETTER_ADMIN_KEY?.trim());
        return withCors(
          Response.json(
            { ok: false, error: configured ? "unauthorized" : "admin_key_not_configured" },
            { status: configured ? 401 : 503 },
          ),
        );
      }

      if (path.startsWith("/media-admin/")) {
        return withCors(await handleMediaAdmin(path, request, env));
      }

      if (path === "/shop-admin/orders" && request.method === "GET") {
        const tracking = new URL(request.url).searchParams.get("tracking") === "1" ? "?tracking=1" : "";
        return withCors(await callDO(env, "Orders", "global", `/list${tracking}`, { method: "GET" }));
      }

      if (path === "/newsletter/list" && request.method === "GET") {
        return withCors(await callStore(env, "/list", { method: "GET" }));
      }

      if (path === "/newsletter/export.csv" && request.method === "GET") {
        return withCors(await callStore(env, "/export.csv", { method: "GET" }));
      }

      if (path === "/newsletter/remove" && request.method === "POST") {
        const body = await request.text();
        return withCors(
          await callStore(env, "/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          }),
        );
      }

      return withCors(Response.json({ ok: false, error: "not_found" }, { status: 404 }));
    } catch (error: unknown) {
      console.error("worker error", { path, message: error instanceof Error ? error.message : String(error) });
      return withCors(Response.json({ ok: false, error: "server_error" }, { status: 500 }));
    }
  },
} satisfies ExportedHandler<Env>;
