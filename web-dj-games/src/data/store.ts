/**
 * ============================================================================
 * DJ GAMES STORE — CATALOG SOURCE
 * ============================================================================
 * The storefront UI is a faithful port of the PRESS HOUSE (POD) store page:
 * catalog grid → product card → product detail with variants → cart →
 * checkout hand-off. Only the skin is DJ Games / LAST CALL.
 *
 * This file is the ONLY place that knows where products come from. Point
 * `CATALOG_URL` at the PRESS HOUSE catalog endpoint and the page binds to it
 * with no UI changes. Until that endpoint answers with real products, the page
 * shows its empty state — it NEVER invents placeholder merch.
 * ============================================================================
 */

import { useQuery } from "@tanstack/react-query";

/** The Rork-hosted shop. Store "back / home" links point here, not to a new app. */
export const SHOP_ORIGIN = "https://shop.playdjgames.com";

/** Coming-soon home of the shop host. */
export const SHOP_HOME_URL = SHOP_ORIGIN;

/** Catalog feed. Swap this path if PRESS HOUSE serves it elsewhere. */
export const CATALOG_URL = `${SHOP_ORIGIN}/api/catalog`;

/** Current drop / product line. */
export const DROP_NAME = "LAST CALL";

const REQUEST_TIMEOUT_MS = 8000;

/** Refetch cadence — a drop can go live at any moment. */
export const CATALOG_STALE_MS = 120_000;
export const CATALOG_POLL_MS = 300_000;

/* --------------------------------- types ---------------------------------- */

/** Mirrors the POD store's item states, including "drop locked". */
export type ProductStatus = "available" | "coming_soon" | "sold_out";

export interface ProductOptionValue {
  id: string;
  label: string;
  /** Out-of-stock values render struck through and unselectable. */
  available: boolean;
}

/** A variant axis — Size, Color, etc. */
export interface ProductOptionGroup {
  id: string;
  name: string;
  values: ProductOptionValue[];
}

export interface StoreProduct {
  id: string;
  name: string;
  /** One-line hook shown under the name on the card. */
  tagline?: string;
  description?: string;
  /** Integer-safe USD amount. */
  price: number;
  /** Original price, when the item is discounted. */
  compareAtPrice?: number;
  currency: string;
  images: string[];
  category: string;
  status: ProductStatus;
  statusLabel: string;
  options: ProductOptionGroup[];
  /** Product page on the shop host, used as the checkout hand-off. */
  url?: string;
}

/* ------------------------------ normalisation ------------------------------ */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
};

/** Accepts dollars (12.5) or integer cents (1250) and always returns dollars. */
const asPrice = (value: unknown, centsValue: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof centsValue === "number" && Number.isFinite(centsValue)) return centsValue / 100;
  return undefined;
};

const asStatus = (value: unknown, available: unknown): ProductStatus => {
  const raw = asString(value)?.toLowerCase() ?? "";
  if (raw.includes("sold")) return "sold_out";
  if (raw.includes("soon") || raw.includes("lock") || raw.includes("draft")) return "coming_soon";
  if (available === false) return "sold_out";
  return "available";
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  available: "In stock",
  coming_soon: "Drop locked",
  sold_out: "Sold out",
};

const asImages = (raw: Record<string, unknown>): string[] => {
  const list = raw.images ?? raw.photos;
  if (Array.isArray(list)) {
    const urls = list
      .map((item) => (isRecord(item) ? asString(item.url ?? item.src) : asString(item)))
      .filter((url): url is string => Boolean(url));
    if (urls.length > 0) return urls;
  }
  const single = asString(raw.image ?? raw.imageUrl ?? raw.thumbnail);
  return single ? [single] : [];
};

const asOptions = (raw: Record<string, unknown>): ProductOptionGroup[] => {
  const groups = raw.options ?? raw.variants ?? raw.variantGroups;
  if (!Array.isArray(groups)) return [];

  return groups
    .map((group, groupIndex): ProductOptionGroup | null => {
      if (!isRecord(group)) return null;
      const name = asString(group.name ?? group.title ?? group.label);
      const rawValues = group.values ?? group.options ?? group.choices;
      if (!name || !Array.isArray(rawValues)) return null;

      const values = rawValues
        .map((value, valueIndex): ProductOptionValue | null => {
          if (isRecord(value)) {
            const label = asString(value.label ?? value.name ?? value.value);
            if (!label) return null;
            return {
              id: asString(value.id) ?? `${name}-${valueIndex}`,
              label,
              available: value.available !== false && value.inStock !== false,
            };
          }
          const label = asString(value);
          return label ? { id: `${name}-${valueIndex}`, label, available: true } : null;
        })
        .filter((value): value is ProductOptionValue => value !== null);

      if (values.length === 0) return null;
      return { id: asString(group.id) ?? `group-${groupIndex}`, name, values };
    })
    .filter((group): group is ProductOptionGroup => group !== null);
};

/** Turns one catalog record into a product, or null when it is unusable. */
const toProduct = (raw: unknown, index: number): StoreProduct | null => {
  if (!isRecord(raw)) return null;

  const name = asString(raw.name ?? raw.title);
  const price = asPrice(raw.price ?? raw.amount, raw.priceCents ?? raw.price_cents);
  if (!name || price === undefined) return null;

  const status = asStatus(raw.status ?? raw.state, raw.available);
  const handle = asString(raw.handle ?? raw.slug);

  return {
    id: asString(raw.id ?? raw.productId) ?? handle ?? `product-${index}`,
    name,
    tagline: asString(raw.tagline ?? raw.subtitle),
    description: asString(raw.description ?? raw.body),
    price,
    compareAtPrice: asPrice(raw.compareAtPrice ?? raw.compare_at_price, raw.compareAtPriceCents),
    currency: asString(raw.currency) ?? "USD",
    images: asImages(raw),
    category: asString(raw.category ?? raw.collection ?? raw.productType) ?? "Merch",
    status,
    statusLabel: asString(raw.statusLabel) ?? STATUS_LABELS[status],
    options: asOptions(raw),
    url: asString(raw.url) ?? (handle ? `${SHOP_ORIGIN}/products/${handle}` : undefined),
  };
};

/** Unwraps the common response envelopes before normalising. */
const extractList = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload)) {
    for (const key of ["products", "items", "data", "results"]) {
      const value = payload[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
};

/* -------------------------------- fetching -------------------------------- */

/**
 * Reads the PRESS HOUSE catalog. A missing, unreachable, or non-JSON endpoint
 * resolves to an empty catalog so the page falls back to its empty state
 * instead of an error screen — the shop host may not be connected yet.
 */
export const fetchCatalog = async (): Promise<StoreProduct[]> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(CATALOG_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) return [];

    const payload: unknown = await response.json();
    return extractList(payload)
      .map(toProduct)
      .filter((product): product is StoreProduct => product !== null);
  } catch (error: unknown) {
    // Silent + non-blocking, exactly like the App Store sync.
    console.warn("store catalog unavailable", error);
    return [];
  } finally {
    window.clearTimeout(timeout);
  }
};

export interface StoreCatalog {
  products: StoreProduct[];
  categories: string[];
  isLoading: boolean;
  /** True once a check finished and the shop returned nothing. */
  isEmpty: boolean;
}

/** Single source of truth for the storefront. */
export const useStoreCatalog = (): StoreCatalog => {
  const { data, isLoading } = useQuery({
    queryKey: ["store-catalog"],
    queryFn: fetchCatalog,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_STALE_MS * 4,
    refetchOnWindowFocus: true,
    refetchInterval: CATALOG_POLL_MS,
    retry: 1,
    initialData: [] as StoreProduct[],
  });

  const products = data ?? [];

  return {
    products,
    categories: Array.from(new Set(products.map((product) => product.category))),
    isLoading,
    isEmpty: !isLoading && products.length === 0,
  };
};

/* -------------------------------- checkout -------------------------------- */

export interface CartLine {
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  /** Chosen variant labels, e.g. ["L", "Black"]. */
  selections: string[];
  url?: string;
}

/** USD formatting used everywhere in the store. */
export const formatPrice = (amount: number, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);

export const cartSubtotal = (lines: CartLine[]): number =>
  lines.reduce((total, line) => total + line.price * line.quantity, 0);

export const cartCount = (lines: CartLine[]): number =>
  lines.reduce((total, line) => total + line.quantity, 0);

/**
 * Checkout hand-off. Payment always happens on the shop host — this site never
 * takes card details. Single line item goes straight to its product page;
 * multi-item carts open the shop cart with the items encoded.
 */
export const checkoutUrl = (lines: CartLine[]): string => {
  if (lines.length === 0) return SHOP_HOME_URL;
  if (lines.length === 1 && lines[0].url) {
    const only = lines[0];
    const url = new URL(only.url);
    url.searchParams.set("quantity", String(only.quantity));
    only.selections.forEach((selection, index) => {
      url.searchParams.set(`option${index + 1}`, selection);
    });
    return url.toString();
  }

  const items = lines.map((line) => `${line.productId}:${line.quantity}`).join(",");
  return `${SHOP_ORIGIN}/cart?items=${encodeURIComponent(items)}`;
};
