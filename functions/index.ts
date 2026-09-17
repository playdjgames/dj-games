// functions/index.ts — the entrypoint for the DJ Games backend.
//
// Routes:
//   POST /newsletter/subscribe      public — stores an email from the site forms
//   GET  /newsletter/list           admin  — JSON list of subscribers
//   GET  /newsletter/export.csv     admin  — CSV download of subscribers
//   POST /newsletter/remove         admin  — delete one subscriber
//
// Admin routes require the NEWSLETTER_ADMIN_KEY project env, sent either as
// `Authorization: Bearer <key>` or a `?key=` query param (needed so a browser
// download link can carry it). Without the env set, admin routes stay closed.

export { Subscribers } from "./subscribers";

type Env = {
  DO: Fetcher;
  NEWSLETTER_ADMIN_KEY?: string;
};

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const SUBSCRIBERS_ID = "global";

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

/** Dispatches to the single global Subscribers Durable Object instance. */
const callStore = (env: Env, path: string, init?: RequestInit): Promise<Response> => {
  const request = new Request(`https://internal${path}`, init);
  request.headers.set("X-Rork-DO-Class", "Subscribers");
  request.headers.set("X-Rork-DO-Id", SUBSCRIBERS_ID);
  return env.DO.fetch(request);
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

      if (path === "/newsletter/subscribe" && request.method === "POST") {
        const body = await request.text();
        const result = await callStore(env, "/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        return withCors(result);
      }

      const isAdminRoute = path.startsWith("/newsletter/");
      if (isAdminRoute && !isAuthorized(request, env)) {
        const configured = Boolean(env.NEWSLETTER_ADMIN_KEY?.trim());
        return withCors(
          Response.json(
            { ok: false, error: configured ? "unauthorized" : "admin_key_not_configured" },
            { status: configured ? 401 : 503 },
          ),
        );
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
