/**
 * ============================================================================
 * DJ GAMES STORE — CATALOG SOURCE
 * ============================================================================
 * The Store page IS the merch catalog. /store shows the LAST CALL rack directly
 * — no shop home, no external product host, no checkout hand-off. The house
 * products below are the catalog's source of truth; the bag lives on the page
 * and checkout stays disabled until payments are actually wired.
 * ============================================================================
 */

/** Current drop / product line. */
export const DROP_NAME = "LAST CALL";

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
}

const STATUS_LABELS: Record<ProductStatus, string> = {
  available: "In stock",
  coming_soon: "Drop locked",
  sold_out: "Sold out",
};

const sizes = (...labels: string[]): ProductOptionGroup => ({
  id: "size",
  name: "Size",
  values: labels.map((label, index) => ({ id: `size-${index}`, label, available: true })),
});

const colors = (...labels: string[]): ProductOptionGroup => ({
  id: "color",
  name: "Color",
  values: labels.map((label, index) => ({ id: `color-${index}`, label, available: true })),
});

/* ------------------------------ the LAST CALL rack ------------------------ */

/**
 * The first house rack. Real UI, real add-to-bag — placeholder art renders as a
 * labeled dark panel until photography exists. Add to this list to put a new
 * item on the rack; nothing else needs to change.
 */
export const HOUSE_PRODUCTS: StoreProduct[] = [
  {
    id: "last-call-tee",
    name: "LAST CALL tee",
    tagline: "Nights don\u2019t end. They fade.",
    description:
      "Heavyweight cotton tee with the LAST CALL mark across the chest. Cut for the hours after the set.",
    price: 32,
    currency: "USD",
    images: [],
    category: "Tee",
    status: "available",
    statusLabel: STATUS_LABELS.available,
    options: [sizes("S", "M", "L", "XL", "XXL"), colors("Black", "Ice")],
  },
  {
    id: "last-call-hoodie",
    name: "LAST CALL hoodie",
    tagline: "House merch. Loud on purpose.",
    description:
      "Fleece-lined hoodie, boxy fit, big LAST CALL print. The one you reach for when the night runs long.",
    price: 58,
    currency: "USD",
    images: [],
    category: "Hoodie",
    status: "available",
    statusLabel: STATUS_LABELS.available,
    options: [sizes("S", "M", "L", "XL", "XXL"), colors("Black", "Ice")],
  },
  {
    id: "press-house-cap",
    name: "PRESS HOUSE cap",
    tagline: "Print it. Drop it.",
    description:
      "Six-panel cap with the PRESS HOUSE wordmark. Adjustable strap, one size fits the whole crew.",
    price: 28,
    currency: "USD",
    images: [],
    category: "Cap",
    status: "available",
    statusLabel: STATUS_LABELS.available,
    options: [colors("Black", "Ice")],
  },
  {
    id: "dj-games-tote",
    name: "DJ GAMES mark tote",
    tagline: "Built to play. Built to wear.",
    description:
      "Heavy canvas tote with the DJ GAMES mark. Records, cables, groceries — it carries all of it.",
    price: 24,
    currency: "USD",
    images: [],
    category: "Tote",
    status: "available",
    statusLabel: STATUS_LABELS.available,
    options: [colors("Natural", "Black")],
  },
];

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
  const products = HOUSE_PRODUCTS;

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
