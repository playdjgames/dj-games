import { findStickerSize, type CartLine } from "@/data/store";
import { BACKEND_PATH } from "@/lib/backend";
import { renderStickerPng } from "@/lib/sticker-render";

/** Shipping address — US only, what Printify ships to. */
export interface MerchAddress {
  email: string;
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
}

export interface MerchQuote {
  merchandise_cents: number;
  shipping_cents: number;
  shipping_quoted: boolean;
  total_cents: number;
  lines: { title: string; size_label: string; color_label: string; qty: number; unit_cents: number }[];
}

export interface MerchOrder {
  order: {
    id?: string;
    payment_status: string;
    fulfillment_status?: string;
    total_cents?: number;
    email?: string;
  };
}

/** Thrown with the backend's own shopper-facing message (e.g. "ENTER A VALID EMAIL"). */
export class MerchError extends Error {}

const call = async <T>(path: string, body?: unknown): Promise<T> => {
  const response = await fetch(`${BACKEND_PATH}/shop${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok || !data) {
    throw new MerchError(data?.error ?? "CHECKOUT IS UNAVAILABLE RIGHT NOW");
  }
  return data;
};

/**
 * Bag lines in the store's checkout shape. Orders also carry the full-size
 * print file for every custom sticker, rendered right here from the preview.
 */
const toLines = (lines: CartLine[], withPrintFiles: boolean) =>
  Promise.all(
    lines
      .filter((line) => line.pressHouseId && line.variantId !== undefined)
      .map(async (line) => {
        const base = { productId: line.pressHouseId, variantId: line.variantId, qty: line.quantity };
        if (line.kind === "custom" && line.custom) {
          const custom = { kind: "custom" as const, ...base, custom: line.custom };
          if (!withPrintFiles) return custom;
          const [width, height] = findStickerSize(line.custom)?.printPx ?? [900, 900];
          return { ...custom, image: await renderStickerPng(line.custom, width, height) };
        }
        if (line.kind === "design" && line.design) return { kind: "design" as const, ...base, design: line.design };
        return { kind: "listing" as const, ...base };
      }),
  );

/** Merchandise + real shipping for this address. */
export const quoteMerch = async (lines: CartLine[], address: MerchAddress): Promise<MerchQuote> =>
  call<MerchQuote>("/quote", { lines: await toLines(lines, false), address });

/** Creates the order and returns the secure card-payment URL. */
export const placeMerchOrder = async (
  lines: CartLine[],
  address: MerchAddress,
): Promise<{ url?: string; orderId?: string }> =>
  call<{ url?: string; orderId?: string }>("/order", {
    lines: await toLines(lines, true),
    address,
    origin: window.location.origin,
  });

export const fetchMerchOrder = (orderId: string, sessionId: string | null): Promise<MerchOrder> =>
  call<MerchOrder>(
    `/orders/${encodeURIComponent(orderId)}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`,
  );

/** One parcel as Printify reports it once it leaves the printer. */
export interface OrderShipment {
  carrier: string;
  number: string;
  url: string;
  delivered_at: string | null;
}

/** Full order view returned by "Find my order" and the owner order list. */
export interface OrderDetail {
  id: string;
  payment_status: string;
  fulfillment_status: string;
  total_cents: number;
  email: string;
  created_at: string;
  merchandise_cents: number;
  shipping_cents: number;
  lines: { title: string; size_label: string; color_label: string; qty: number; unit_cents: number }[];
  ship_to: string;
  printify_status: string | null;
  shipments: OrderShipment[];
}

export interface AdminOrder extends OrderDetail {
  name: string;
  printify_order_id: string | null;
  attempts: number;
  last_error: string | null;
}

/** Guest lookup: order number + the email used at checkout. */
export const lookupMerchOrder = async (id: string, email: string): Promise<OrderDetail> =>
  (await call<{ order: OrderDetail }>("/lookup", { id, email })).order;

export class OrdersAuthError extends Error {}

/** Every store order, newest first. Needs the studio admin key. */
export const fetchAdminOrders = async (adminKey: string, withTracking: boolean): Promise<AdminOrder[]> => {
  const response = await fetch(`${BACKEND_PATH}/shop-admin/orders${withTracking ? "?tracking=1" : ""}`, {
    headers: { Authorization: `Bearer ${adminKey}` },
  });
  if (response.status === 401) throw new OrdersAuthError("That key didn't work.");
  if (response.status === 503) throw new OrdersAuthError("No admin key is configured on the server yet.");
  if (!response.ok) throw new Error(`request failed (${response.status})`);
  const data = (await response.json()) as { orders?: AdminOrder[] };
  return data.orders ?? [];
};

export type StageTone = "ok" | "wait" | "bad";

/** Plain-English stage for an order, from payment through delivery (step 0–4). */
export const orderStage = (
  order: Pick<OrderDetail, "payment_status" | "fulfillment_status" | "printify_status" | "shipments">,
): { label: string; step: number; tone: StageTone } => {
  if (order.payment_status === "expired") return { label: "Checkout not completed", step: 0, tone: "bad" };
  if (order.payment_status === "unpaid") return { label: "Waiting for payment", step: 0, tone: "wait" };
  if (order.shipments.some((shipment) => shipment.delivered_at)) return { label: "Delivered", step: 4, tone: "ok" };
  const printify = order.printify_status ?? "";
  if (/cancel/.test(printify)) return { label: "Cancelled", step: 0, tone: "bad" };
  if (order.shipments.length > 0 || /shipped|fulfilled|delivered/.test(printify)) {
    return { label: "Shipped", step: 3, tone: "ok" };
  }
  if (order.fulfillment_status === "failed") return { label: "Needs attention", step: 1, tone: "bad" };
  if (order.fulfillment_status === "submitted") return { label: "Printing", step: 2, tone: "ok" };
  return { label: "Paid — sending to print", step: 1, tone: "ok" };
};

export const centsToPrice = (cents: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
