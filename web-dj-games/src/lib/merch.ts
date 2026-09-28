import type { CartLine } from "@/data/store";
import { BACKEND_PATH } from "@/lib/backend";

/** Shipping address — US only, the way PRESS HOUSE prints and ships. */
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

const toLines = (lines: CartLine[]) =>
  lines
    .filter((line) => line.pressHouseId && line.variantId)
    .map((line) => ({ productId: line.pressHouseId, variantId: line.variantId, qty: line.quantity }));

/** Merchandise + real shipping for this address. */
export const quoteMerch = (lines: CartLine[], address: MerchAddress): Promise<MerchQuote> =>
  call<MerchQuote>("/quote", { lines: toLines(lines), address });

/** Creates the order and returns the secure card-payment URL. */
export const placeMerchOrder = (lines: CartLine[], address: MerchAddress): Promise<{ url?: string; orderId?: string }> =>
  call<{ url?: string; orderId?: string }>("/order", {
    lines: toLines(lines),
    address,
    origin: window.location.origin,
  });

export const fetchMerchOrder = (orderId: string, sessionId: string | null): Promise<MerchOrder> =>
  call<MerchOrder>(
    `/orders/${encodeURIComponent(orderId)}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`,
  );

export const centsToPrice = (cents: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
