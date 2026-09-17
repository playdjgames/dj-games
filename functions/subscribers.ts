import { DurableObject } from "cloudflare:workers";

export interface SubscriberRow {
  email: string;
  source: string;
  created_at: number;
}

interface SubscribePayload {
  email?: unknown;
  source?: unknown;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

/** Escapes a value for CSV, guarding against spreadsheet formula injection. */
const csvCell = (value: string): string => {
  const needsGuard = /^[=+\-@]/.test(value);
  const safe = needsGuard ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

/**
 * Single global store of newsletter subscribers.
 *
 * Emails are stored lowercased and deduplicated by primary key, so a repeat
 * signup refreshes nothing and never creates a second row.
 */
export class Subscribers extends DurableObject {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS subscribers (
        email TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/subscribe") {
      return this.handleSubscribe(request);
    }

    if (request.method === "GET" && url.pathname === "/list") {
      return Response.json({ subscribers: this.allSubscribers(), total: this.total() });
    }

    if (request.method === "GET" && url.pathname === "/export.csv") {
      return this.handleExport();
    }

    if (request.method === "POST" && url.pathname === "/remove") {
      const { email } = (await request.json()) as { email?: unknown };
      if (typeof email !== "string") {
        return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
      }
      this.ctx.storage.sql.exec("DELETE FROM subscribers WHERE email = ?", email.trim().toLowerCase());
      return Response.json({ ok: true });
    }

    return new Response("not found", { status: 404 });
  }

  private async handleSubscribe(request: Request): Promise<Response> {
    let payload: SubscribePayload;
    try {
      payload = (await request.json()) as SubscribePayload;
    } catch {
      return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }

    const rawEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (rawEmail.length === 0 || rawEmail.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(rawEmail)) {
      return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const source = typeof payload.source === "string" ? payload.source.slice(0, 40) : "site";

    const existing = this.ctx.storage.sql
      .exec<{ count: number }>("SELECT COUNT(*) AS count FROM subscribers WHERE email = ?", rawEmail)
      .toArray();
    const alreadySubscribed = (existing[0]?.count ?? 0) > 0;

    this.ctx.storage.sql.exec(
      `INSERT INTO subscribers (email, source, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(email) DO NOTHING`,
      rawEmail,
      source,
      Date.now(),
    );

    return Response.json({ ok: true, alreadySubscribed });
  }

  private handleExport(): Response {
    const rows = this.allSubscribers();
    const header = "email,source,subscribed_at";
    const body = rows
      .map((row) => [csvCell(row.email), csvCell(row.source), csvCell(new Date(row.created_at).toISOString())].join(","))
      .join("\n");
    const csv = rows.length > 0 ? `${header}\n${body}\n` : `${header}\n`;
    const stamp = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dj-games-subscribers-${stamp}.csv"`,
      },
    });
  }

  private allSubscribers(): SubscriberRow[] {
    return this.ctx.storage.sql
      .exec<SubscriberRow>("SELECT email, source, created_at FROM subscribers ORDER BY created_at DESC")
      .toArray();
  }

  private total(): number {
    const rows = this.ctx.storage.sql.exec<{ count: number }>("SELECT COUNT(*) AS count FROM subscribers").toArray();
    return rows[0]?.count ?? 0;
  }
}
