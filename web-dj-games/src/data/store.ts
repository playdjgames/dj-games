/**
 * ============================================================================
 * DJ GAMES STORE — CATALOG SOURCE
 * ============================================================================
 * The Store page IS the merch catalog, synced from PRESS HOUSE
 * (https://shop.playdjgames.com) by `scripts/sync-presshouse.mjs` into
 * `presshouse.generated.ts`. Browsing, the bag and checkout all happen on
 * /store; the backend (`/~api/shop/*`) hands the order to PRESS HOUSE for
 * Stripe payment + Printify printing. Re-run the sync after catalog changes.
 * ============================================================================
 */

import { PRESS_HOUSE_PRODUCTS } from "./presshouse.generated";

/** The in-app storefront route. */
export const STORE_ROUTE = "/store";

/* --------------------------------- types ---------------------------------- */

/** Item states, including "drop locked" for anything not addable yet. */
export type ProductStatus = "available" | "coming_soon" | "sold_out";

export interface ProductOptionValue {
  id: string;
  label: string;
  /** Out-of-stock values render struck through and unselectable. */
  available: boolean;
  /** Added to the base price when picked (e.g. XXL +$3), mirroring PRESS HOUSE. */
  priceDelta?: number;
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
  /**
   * Artwork URLs. Empty when art hasn't been produced yet — the card then
   * renders a clearly-labeled dark placeholder with the product name, and the
   * item stays fully add-to-bag.
   */
  images: string[];
  category: string;
  status: ProductStatus;
  statusLabel: string;
  options: ProductOptionGroup[];
  /** Material / construction bullets from PRESS HOUSE. */
  details?: string[];
  /** PRESS HOUSE listing id — required for an item to be buyable. */
  pressHouseId?: string;
  /** Exact printable variants (color x size) with their Printify ids. */
  variants?: ProductVariant[];
  featured?: boolean;
}

export interface ProductVariant {
  id: number;
  color: string;
  size: string;
}

/** True when the item can go in the bag and through checkout. */
export const isBuyable = (product: StoreProduct): boolean =>
  product.status === "available" && Boolean(product.pressHouseId) && (product.variants?.length ?? 0) > 0;

/**
 * The variant matching the picked Color/Size labels. Axes with a single value
 * have no option group, so they match anything.
 */
export const findVariant = (
  product: StoreProduct,
  picked: Record<string, string>,
): ProductVariant | undefined =>
  product.variants?.find(
    (variant) =>
      (picked.color === undefined || variant.color === picked.color) &&
      (picked.size === undefined || variant.size === picked.size),
  );

/* ------------------------------ the house rack ---------------------------- */

/**
 * PRESS HOUSE is live (Stripe checkout + Printify fulfilment), so the rack is
 * open. Set to false to force every card back to "Out of stock" in one move.
 */
export const STORE_IS_STOCKED = true;

/** The rack as the page shows it — the synced PRESS HOUSE catalog, featured first. */
export const rackProducts = (): StoreProduct[] => {
  const ordered = [...PRESS_HOUSE_PRODUCTS].sort(
    (a, b) => Number(b.featured === true) - Number(a.featured === true),
  );
  return STORE_IS_STOCKED
    ? ordered
    : ordered.map((product) => ({ ...product, status: "sold_out" as const, statusLabel: "Out of stock" }));
};

/** First available label of every variant axis — used by the one-tap card add. */
export const defaultSelections = (product: StoreProduct): string[] =>
  product.options
    .map((group) => group.values.find((value) => value.available)?.label)
    .filter((label): label is string => Boolean(label));

/* --------------------------------- catalog -------------------------------- */

export interface StoreCatalog {
  products: StoreProduct[];
  categories: string[];
  isLoading: boolean;
  /** True once a check finished and the rack came back genuinely empty. */
  isEmpty: boolean;
}

/** Single source of truth for the storefront. The rack IS the page — no fetch. */
export const useStoreCatalog = (): StoreCatalog => {
  const products = rackProducts();

  return {
    products,
    categories: Array.from(new Set(products.map((product) => product.category))),
    isLoading: false,
    isEmpty: products.length === 0,
  };
};

/* ----------------------------------- bag ---------------------------------- */

export interface CartLine {
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  /** Chosen variant labels, e.g. ["Black", "L"]. */
  selections: string[];
  /** PRESS HOUSE listing id + Printify variant id — what checkout sends. */
  pressHouseId?: string;
  variantId?: number;
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
