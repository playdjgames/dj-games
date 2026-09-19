import { DurableObject } from "cloudflare:workers";

/**
 * Metadata index for the DJ Games media library.
 *
 * The bytes live in Cloudflare R2; this Durable Object only stores the small
 * record that describes each object (folder, filename, size, dimensions, ...)
 * so the admin page can list, filter and sort without touching S3 listing APIs.
 */

export interface MediaRow {
  id: string;
  folder: string;
  filename: string;
  storage_key: string;
  content_type: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  created_at: number;
}

interface FolderRow {
  slug: string;
  label: string;
  created_at: number;
}

const nowMs = (): number => Date.now();

export class MediaLibrary extends DurableObject {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        folder TEXT NOT NULL,
        filename TEXT NOT NULL,
        storage_key TEXT NOT NULL UNIQUE,
        content_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        duration REAL,
        created_at INTEGER NOT NULL
      )
    `);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        slug TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "GET" && path === "/list") {
      return Response.json({ media: this.allMedia(), folders: this.allFolders() });
    }

    if (request.method === "GET" && path === "/by-key") {
      const key = url.searchParams.get("key") ?? "";
      const row = this.findByKey(key);
      return Response.json({ item: row ?? null });
    }

    if (request.method === "POST" && path === "/record") {
      return this.handleRecord(request);
    }

    if (request.method === "POST" && path === "/folder") {
      return this.handleAddFolder(request);
    }

    if (request.method === "POST" && path === "/rename") {
      return this.handleRename(request);
    }

    if (request.method === "POST" && path === "/remove") {
      const { id } = (await request.json()) as { id?: unknown };
      if (typeof id !== "string") return Response.json({ ok: false, error: "invalid_id" }, { status: 400 });
      const row = this.findById(id);
      if (!row) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
      this.ctx.storage.sql.exec("DELETE FROM media WHERE id = ?", id);
      return Response.json({ ok: true, item: row });
    }

    if (request.method === "POST" && path === "/remove-folder") {
      const { slug } = (await request.json()) as { slug?: unknown };
      if (typeof slug !== "string") return Response.json({ ok: false, error: "invalid_slug" }, { status: 400 });
      const remaining = this.ctx.storage.sql
        .exec<{ count: number }>("SELECT COUNT(*) AS count FROM media WHERE folder = ?", slug)
        .toArray();
      if ((remaining[0]?.count ?? 0) > 0) {
        return Response.json({ ok: false, error: "folder_not_empty" }, { status: 409 });
      }
      this.ctx.storage.sql.exec("DELETE FROM folders WHERE slug = ?", slug);
      return Response.json({ ok: true });
    }

    return new Response("not found", { status: 404 });
  }

  /** Inserts the metadata row after the browser finished its presigned upload. */
  private async handleRecord(request: Request): Promise<Response> {
    const payload = (await request.json()) as Partial<MediaRow>;
    const { id, folder, filename, storage_key, content_type, size } = payload;

    if (
      typeof id !== "string" ||
      typeof folder !== "string" ||
      typeof filename !== "string" ||
      typeof storage_key !== "string" ||
      typeof content_type !== "string" ||
      typeof size !== "number"
    ) {
      return Response.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const width = typeof payload.width === "number" && payload.width > 0 ? Math.round(payload.width) : null;
    const height = typeof payload.height === "number" && payload.height > 0 ? Math.round(payload.height) : null;
    const duration = typeof payload.duration === "number" && payload.duration > 0 ? payload.duration : null;

    this.ctx.storage.sql.exec(
      `INSERT INTO media (id, folder, filename, storage_key, content_type, size, width, height, duration, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(storage_key) DO UPDATE SET
         size = excluded.size,
         content_type = excluded.content_type,
         width = excluded.width,
         height = excluded.height,
         duration = excluded.duration`,
      id,
      folder,
      filename,
      storage_key,
      content_type,
      size,
      width,
      height,
      duration,
      nowMs(),
    );

    return Response.json({ ok: true, item: this.findByKey(storage_key) });
  }

  private async handleAddFolder(request: Request): Promise<Response> {
    const { slug, label } = (await request.json()) as { slug?: unknown; label?: unknown };
    if (typeof slug !== "string" || slug.length === 0 || typeof label !== "string") {
      return Response.json({ ok: false, error: "invalid_folder" }, { status: 400 });
    }
    this.ctx.storage.sql.exec(
      `INSERT INTO folders (slug, label, created_at) VALUES (?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET label = excluded.label`,
      slug,
      label,
      nowMs(),
    );
    return Response.json({ ok: true, folders: this.allFolders() });
  }

  /** Points an existing record at its new key after the R2 copy succeeded. */
  private async handleRename(request: Request): Promise<Response> {
    const { id, filename, storage_key } = (await request.json()) as {
      id?: unknown;
      filename?: unknown;
      storage_key?: unknown;
    };
    if (typeof id !== "string" || typeof filename !== "string" || typeof storage_key !== "string") {
      return Response.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }
    this.ctx.storage.sql.exec("UPDATE media SET filename = ?, storage_key = ? WHERE id = ?", filename, storage_key, id);
    return Response.json({ ok: true, item: this.findById(id) });
  }

  private allMedia(): MediaRow[] {
    return this.ctx.storage.sql
      .exec<MediaRow>("SELECT * FROM media ORDER BY created_at DESC")
      .toArray();
  }

  private allFolders(): FolderRow[] {
    return this.ctx.storage.sql.exec<FolderRow>("SELECT * FROM folders ORDER BY label ASC").toArray();
  }

  private findById(id: string): MediaRow | undefined {
    return this.ctx.storage.sql.exec<MediaRow>("SELECT * FROM media WHERE id = ?", id).toArray()[0];
  }

  private findByKey(key: string): MediaRow | undefined {
    return this.ctx.storage.sql.exec<MediaRow>("SELECT * FROM media WHERE storage_key = ?", key).toArray()[0];
  }
}
