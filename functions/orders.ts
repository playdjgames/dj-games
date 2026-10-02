import { DurableObject } from "cloudflare:workers";

import {
  printify,
  printifyAddress,
  PrintifyError,
  stripe,
  type MadeJob,
  type PricedLine,
  type ShopAddress,
  type ShopEnv,
  type StripeSession,
} from "./_lib/shop";

type OrdersEnv = ShopEnv & {
  DO: Fetcher & { setAlarm(className: string, id: string, scheduledTime: number | Date): Promise<void> };
};

/** What gets stored per line — print files are uploaded at checkout, never stored. */
type StoredLine = Omit<PricedLine, "printFile">;

interface OrderRow {
  id: string;
  created_at: number;
  email: string;
  address: string;
  lines: string;
  merchandise_cents: number;
  shipping_cents: number;
  total_cents: number;
  session_id: string;
  payment_status: string;
  fulfillment_status: string;
  printify_order_id: string | null;
  attempts: number;
  last_error: string | null;
  updated_at: number;
}

export interface PublicOrder {
  id: string;
  payment_status: string;
  fulfillment_status: string;
  total_cents: number;
  email: string;
}

/** One shipment as Printify reports it once the parcel leaves the printer. */
export interface OrderShipment {
  carrier: string;
  number: string;
  url: string;
  delivered_at: string | null;
}

/** What a shopper sees on "Find my order" — no address beyond city/state. */
export interface OrderDetail extends PublicOrder {
  created_at: string;
  merchandise_cents: number;
  shipping_cents: number;
  lines: { title: string; size_label: string; color_label: string; qty: number; unit_cents: number }[];
  ship_to: string;
  printify_status: string | null;
  shipments: OrderShipment[];
}

const SWEEP_EVERY_MS = 5 * 60_000;
/** Checkout sessions expire after 2h; stop polling Stripe a little after that. */
const UNPAID_WINDOW_MS = 3 * 60 * 60_000;
const MAX_FULFIL_ATTEMPTS = 6;

const toPublic = (row: OrderRow): PublicOrder => ({
  id: row.id,
  payment_status: row.payment_status,
  fulfillment_status: row.fulfillment_status,
  total_cents: row.total_cents,
  email: row.email,
});

/**
 * Every DJ Games store order, in one global instance. A single Durable Object
 * serialises the return-page confirmation and the background sweep, so an
 * order is sent to Printify exactly once.
 *
 *   unpaid ──Stripe paid──▶ paid ──▶ fulfilment: pending → submitting → submitted | failed
 *          └─session expired──▶ expired
 */
export class Orders extends DurableObject<OrdersEnv> {
  constructor(ctx: DurableObjectState, env: OrdersEnv) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        email TEXT NOT NULL,
        address TEXT NOT NULL,
        lines TEXT NOT NULL,
        merchandise_cents INTEGER NOT NULL,
        shipping_cents INTEGER NOT NULL,
        total_cents INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        fulfillment_status TEXT NOT NULL,
        printify_order_id TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        updated_at INTEGER NOT NULL
      )
    `);
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/create") {
      const body = (await request.json()) as {
        id: string;
        email: string;
        address: ShopAddress;
        lines: StoredLine[];
        merchandise_cents: number;
        shipping_cents: number;
        total_cents: number;
        session_id: string;
      };
      const now = Date.now();
      this.ctx.storage.sql.exec(
        `INSERT INTO orders (id, created_at, email, address, lines, merchandise_cents, shipping_cents, total_cents,
           session_id, payment_status, fulfillment_status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', ?)`,
        body.id,
        now,
        body.email,
        JSON.stringify(body.address),
        JSON.stringify(body.lines),
        body.merchandise_cents,
        body.shipping_cents,
        body.total_cents,
        body.session_id,
        now,
      );
      await this.scheduleSweep();
      return Response.json({ ok: true });
    }

    const statusMatch = url.pathname.match(/^\/status\/([A-Z0-9-]{6,40})$/);
    if (request.method === "GET" && statusMatch) {
      const row = this.row(statusMatch[1]);
      if (!row) return Response.json({ error: "ORDER NOT FOUND" }, { status: 404 });
      const sessionId = url.searchParams.get("session_id");
      if (sessionId && sessionId !== row.session_id) {
        return Response.json({ error: "ORDER NOT FOUND" }, { status: 404 });
      }
      const refreshed = await this.advance(row);
      return Response.json({ order: toPublic(refreshed) });
    }

    if (request.method === "POST" && url.pathname === "/lookup") {
      const body = (await request.json().catch(() => null)) as { id?: string; email?: string } | null;
      const id = String(body?.id ?? "").trim().toUpperCase();
      const email = String(body?.email ?? "").trim().toLowerCase();
      const row = /^DJG-[A-Z0-9]{6,20}$/.test(id) ? this.row(id) : undefined;
      // Same answer for a wrong number and a wrong email, so neither can be probed.
      if (!row || row.email.trim().toLowerCase() !== email || email.length === 0) {
        return Response.json({ error: "NO ORDER MATCHES THAT NUMBER AND EMAIL" }, { status: 404 });
      }
      const refreshed = row.payment_status === "unpaid" ? await this.advance(row) : row;
      return Response.json({ order: await this.detail(refreshed, true) });
    }

    if (request.method === "GET" && url.pathname === "/list") {
      const withTracking = url.searchParams.get("tracking") === "1";
      const rows = this.ctx.storage.sql.exec<OrderRow>("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200").toArray();
      const orders = await Promise.all(
        rows.map(async (row) => {
          const address = JSON.parse(row.address) as ShopAddress;
          return {
            ...(await this.detail(row, withTracking)),
            name: address.name,
            printify_order_id: row.printify_order_id,
            attempts: row.attempts,
            last_error: row.last_error,
          };
        }),
      );
      return Response.json({ orders });
    }

    return new Response("not found", { status: 404 });
  }

  /**
   * Runs at least every 5 minutes: confirms Stripe payments and pushes paid
   * orders to Printify, covering shoppers who close the return tab. Retried
   * deliveries are fine — every step below is idempotent.
   */
  async onAlarm(): Promise<void> {
    const now = Date.now();
    const active = this.ctx.storage.sql
      .exec<OrderRow>(
        `SELECT * FROM orders WHERE (payment_status = 'unpaid' AND updated_at > ?) OR
           (payment_status IN ('paid', 'paid_test') AND fulfillment_status IN ('pending', 'submitting'))`,
        now - UNPAID_WINDOW_MS,
      )
      .toArray();
    for (const row of active) {
      try {
        await this.advance(row);
      } catch (error: unknown) {
        console.error("sweep advance failed", {
          orderId: row.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    await this.scheduleSweep();
  }

  /** Full order view; optionally asks Printify for live production/shipping status. */
  private async detail(row: OrderRow, withTracking: boolean): Promise<OrderDetail> {
    const address = JSON.parse(row.address) as ShopAddress;
    const lines = JSON.parse(row.lines) as StoredLine[];
    let printifyStatus: string | null = null;
    let shipments: OrderShipment[] = [];
    if (withTracking && row.printify_order_id) {
      const live = await printify<{
        status?: string;
        shipments?: { carrier?: string; number?: string; url?: string; delivered_at?: string | null }[];
      }>(this.env, `shops/{shop}/orders/${row.printify_order_id}.json`).catch((error: unknown) => {
        console.warn("printify status lookup failed", {
          orderId: row.id,
          message: error instanceof Error ? error.message : String(error),
        });
        return null;
      });
      printifyStatus = live?.status ?? null;
      shipments = (live?.shipments ?? []).map((shipment) => ({
        carrier: shipment.carrier ?? "",
        number: shipment.number ?? "",
        url: shipment.url ?? "",
        delivered_at: shipment.delivered_at ?? null,
      }));
    }
    return {
      ...toPublic(row),
      created_at: new Date(row.created_at).toISOString(),
      merchandise_cents: row.merchandise_cents,
      shipping_cents: row.shipping_cents,
      lines: lines.map(({ title, size_label, color_label, qty, unit_cents }) => ({
        title,
        size_label,
        color_label,
        qty,
        unit_cents,
      })),
      ship_to: [address.city, address.state].filter(Boolean).join(", "),
      printify_status: printifyStatus,
      shipments,
    };
  }

  private scheduleSweep(): Promise<void> {
    return this.env.DO.setAlarm("Orders", this.ctx.id.name ?? "global", Date.now() + SWEEP_EVERY_MS);
  }

  private row(id: string): OrderRow | undefined {
    return this.ctx.storage.sql.exec<OrderRow>("SELECT * FROM orders WHERE id = ?", id).toArray()[0];
  }

  private save(rows: Partial<OrderRow> & { id: string }): void {
    this.ctx.storage.sql.exec(
      `UPDATE orders SET payment_status = COALESCE(?, payment_status),
         fulfillment_status = COALESCE(?, fulfillment_status),
         printify_order_id = COALESCE(?, printify_order_id),
         attempts = COALESCE(?, attempts),
         last_error = ?,
         updated_at = ?
       WHERE id = ?`,
      rows.payment_status ?? null,
      rows.fulfillment_status ?? null,
      rows.printify_order_id ?? null,
      rows.attempts ?? null,
      rows.last_error ?? null,
      Date.now(),
      rows.id,
    );
  }

  /** Moves one order to its next state; safe to call any number of times. */
  private async advance(row: OrderRow): Promise<OrderRow> {
    if (row.payment_status === "unpaid") {
      const session = await stripe<StripeSession>(this.env, `checkout/sessions/${row.session_id}`);
      if (session.status === "expired") {
        this.save({ id: row.id, payment_status: "expired" });
        return this.row(row.id) ?? row;
      }
      if (session.payment_status !== "paid") return row;
      this.save({ id: row.id, payment_status: session.livemode ? "paid" : "paid_test" });
      row = this.row(row.id) ?? row;
    }

    if (row.fulfillment_status === "pending") {
      this.save({ id: row.id, fulfillment_status: "submitting", attempts: row.attempts + 1 });
      row = this.row(row.id) ?? row;
    }
    if (row.fulfillment_status !== "submitting") return row;

    try {
      await this.submitToPrintify(row);
      this.save({ id: row.id, fulfillment_status: "submitted", last_error: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const attempts = (this.row(row.id)?.attempts ?? row.attempts) + 1;
      // Printify sometimes needs print files to propagate — retry, then stop
      // and leave the order visible with its Printify id for manual follow-up.
      const status = attempts >= MAX_FULFIL_ATTEMPTS ? "failed" : "submitting";
      this.save({ id: row.id, fulfillment_status: status, attempts, last_error: message.slice(0, 400) });
      console.error("printify submit failed", { orderId: row.id, attempt: attempts, message });
    }
    return this.row(row.id) ?? row;
  }

  /** Sends the order to Printify. Idempotent per order id via the external id. */
  private async submitToPrintify(row: OrderRow): Promise<void> {
    const address = JSON.parse(row.address) as ShopAddress;
    const lines = JSON.parse(row.lines) as StoredLine[];
    let printifyOrderId = row.printify_order_id;

    if (!printifyOrderId) {
      const lineItems: Record<string, unknown>[] = [];
      let dirty = false;
      for (const line of lines) {
        const job = line.job;
        if (job.kind === "product") {
          lineItems.push({ product_id: job.productId, variant_id: job.variantId, quantity: line.qty });
          continue;
        }
        if (!job.createdProductId) {
          job.createdProductId = await this.createMadeProduct(row.id, job);
          dirty = true;
        }
        lineItems.push({ product_id: job.createdProductId, variant_id: job.variantId, quantity: line.qty });
      }
      if (dirty) {
        this.ctx.storage.sql.exec("UPDATE orders SET lines = ? WHERE id = ?", JSON.stringify(lines), row.id);
      }

      const order = await printify<{ id: string }>(this.env, "shops/{shop}/orders.json", {
        method: "POST",
        body: {
          external_id: row.id,
          label: row.id,
          line_items: lineItems,
          shipping_method: 1,
          send_shipping_notification: true,
          address_to: printifyAddress(address),
          metadata: { reason: "reprint", shop_order_id: row.id },
        },
      });
      printifyOrderId = order.id;
      this.save({ id: row.id, printify_order_id: order.id });
    }

    await this.sendToProduction(printifyOrderId);
  }

  /**
   * Moves the Printify order into production. If a previous attempt actually
   * sent it (the HTTP response was lost), the order is no longer a draft and
   * re-sending would error — so confirm the live status before failing.
   */
  private async sendToProduction(printifyOrderId: string): Promise<void> {
    try {
      await printify<unknown>(this.env, `shops/{shop}/orders/${printifyOrderId}/send_to_production.json`, {
        method: "POST",
        body: {},
      });
    } catch (error: unknown) {
      if (error instanceof PrintifyError && error.status >= 400 && error.status < 500) {
        const current = await printify<{ status?: string }>(
          this.env,
          `shops/{shop}/orders/${printifyOrderId}.json`,
        ).catch(() => null);
        if (current?.status && current.status !== "draft") return;
      }
      throw error;
    }
  }

  /** Creates the made-to-order Printify product for one custom sticker line. */
  private async createMadeProduct(orderId: string, job: MadeJob): Promise<string> {
    if (!job.imageId) throw new Error("missing print image");
    const made = await printify<{ id: string }>(this.env, "shops/{shop}/products.json", {
      method: "POST",
      body: {
        title: `Custom Sticker · ${orderId}`,
        blueprint_id: job.blueprintId,
        print_provider_id: job.printProviderId,
        variant_ids: [job.variantId],
        print_areas: [
          {
            variant_ids: [job.variantId],
            placeholders: [
              { position: "front", images: [{ id: job.imageId, x: job.x, y: job.y, scale: job.scale, angle: 0 }] },
            ],
          },
        ],
      },
    });
    return made.id;
  }
}
