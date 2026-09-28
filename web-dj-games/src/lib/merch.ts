import { findStickerSize, type CartLine } from "@/data/store";
import { BACKEND_PATH } from "@/lib/backend";
import { renderStickerPng } from "@/lib/sticker-render";

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

/**
 * Bag lines in PRESS HOUSE's checkout shape. Orders also carry the full-size
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

export const centsToPrice = (cents: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
