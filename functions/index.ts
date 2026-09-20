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
// Admin routes require the NEWSLETTER_ADMIN_KEY project env, sent either as
// `Authorization: Bearer <key>` or a `?key=` query param (needed so a browser
// download link can carry it). Without the env set, admin routes stay closed.
//
// The /media/* route is deliberately unauthenticated: social publishers such as
// Windsor.ai and Meta must retrieve the file with no cookie, token or redirect.
// Only exact keys resolve — there is no public index of the library.

export { Subscribers } from "./subscribers";
export { MediaLibrary } from "./media";

import type { MediaRow } from "./media";
import { contentTypeForKey, safeFilename, safeSlug, specForContentType } from "./_lib/media-types";
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

/**
 * The permanent public base for media URLs. Prefers the custom hostname when
 * one is configured, and otherwise serves through this Worker's own /media
 * route — both forms are unauthenticated and stable.
 */
const publicBase = (env: Env, request: Request): string => {
  const custom = env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (custom && custom.length > 0) return custom;
  return `${new URL(request.url).origin}/media`;
};

const publicUrlFor = (env: Env, request: Request, storageKey: string): string =>
  `${publicBase(env, request)}/${storageKey}`;

const decorate = (env: Env, request: Request, row: MediaRow): MediaRow & { url: string } => ({
  ...row,
  url: publicUrlFor(env, request, row.storage_key),
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

  if (path === "/media-admin/config" && request.method === "GET") {
    return Response.json({
      ok: true,
      storageReady: config !== null,
      publicBase: publicBase(env, request),
      usingCustomDomain: Boolean(env.R2_PUBLIC_BASE_URL?.trim()),
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
      media: data.media.map((row) => decorate(env, request, row)),
      folders: data.folders,
      publicBase: publicBase(env, request),
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
      publicUrl: publicUrlFor(env, request, storageKey),
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
    return Response.json({ ok: true, item: decorate(env, request, data.item) });
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
      return Response.json({ ok: true, item: decorate(env, request, row) });
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

    return Response.json({ ok: true, item: decorate(env, request, updatedData.item) });
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

      if (path === "/newsletter/subscribe" && request.method === "POST") {
        const body = await request.text();
        const result = await callStore(env, "/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        return withCors(result);
      }

      const isAdminRoute = path.startsWith("/newsletter/") || path.startsWith("/media-admin/");
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
