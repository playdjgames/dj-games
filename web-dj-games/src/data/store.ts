/**
 * ============================================================================
 * DJ GAMES STORE — CATALOG SOURCE
 * ============================================================================
 * The Store page IS the merch catalog, synced from PRESS HOUSE
 * (https://shop.playdjgames.com) by `scripts/sync-presshouse.mjs` into
 * `presshouse.generated.ts`. Browsing, the bag and checkout all happen on
 * /store; the backend (`/~api/shop/*`) runs the store's OWN checkout — Stripe
 * takes payment on the store page, then the order goes straight to the
 * Printify shop for printing. Re-run the sync after catalog changes.
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
  /** Added to the base price when picked (e.g. XXL +$3). */
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
  /** Material / construction bullets from the catalog. */
  details?: string[];
  /** Catalog listing id — required for an item to be buyable. */
  pressHouseId?: string;
  /** Exact printable variants (color x size) with their Printify ids. */
  variants?: ProductVariant[];
  /** Type-your-own-text sticker — built on the product sheet, printed from the rendered art. */
  custom?: CustomStickerType;
  /** Fixed house art printed on a sheet of four die-cut stickers. */
  pack?: PackDesign;
  featured?: boolean;
}

/* ----------------------------- custom stickers ---------------------------- */

export type StickerShape = "text" | "circle" | "square" | "star" | "heart";
export type StickerFont = "block" | "condensed" | "rounded" | "script";

/** What the shopper built — sent to checkout alongside the rendered print file. */
export interface CustomSticker {
  typeId: string;
  sizeId: string;
  shape: StickerShape;
  font: StickerFont;
  color: string;
  text: string;
}

export interface StickerSize {
  id: string;
  label: string;
  price: number;
  /** Print-file pixel size PRESS HOUSE expects for this size. */
  printPx: [number, number];
}

export interface CustomStickerType {
  typeId: string;
  sizes: StickerSize[];
  /** Cut-vinyl lettering: text only, glass-friendly colors. */
  cutVinyl?: boolean;
}

export interface StickerColor {
  id: string;
  label: string;
  hex: string;
  textHex: string;
  glass?: boolean;
}

export const STICKER_COLORS: StickerColor[] = [
  { id: "black", label: "Black", hex: "#14171F", textHex: "#F4F1E8" },
  { id: "white", label: "White", hex: "#F4F1E8", textHex: "#14171F", glass: true },
  { id: "silver", label: "Silver", hex: "#C9CDD4", textHex: "#14171F", glass: true },
  { id: "yellow", label: "Yellow", hex: "#FFD42E", textHex: "#14171F", glass: true },
  { id: "red", label: "Red", hex: "#D63A2F", textHex: "#FBF6EC" },
  { id: "blue", label: "Blue", hex: "#1E90D6", textHex: "#FBF6EC" },
  { id: "gold", label: "Gold", hex: "#F2A81E", textHex: "#14171F" },
  { id: "pink", label: "Pink", hex: "#E86AA0", textHex: "#14171F" },
  { id: "green", label: "Green", hex: "#3E9B63", textHex: "#FBF6EC" },
];

export const STICKER_SHAPES: { id: StickerShape; label: string }[] = [
  { id: "text", label: "Text only" },
  { id: "circle", label: "Circle" },
  { id: "square", label: "Rounded square" },
  { id: "star", label: "Star" },
  { id: "heart", label: "Heart" },
];

export const STICKER_FONTS: { id: StickerFont; label: string }[] = [
  { id: "block", label: "Bold Block" },
  { id: "condensed", label: "Heavy Condensed" },
  { id: "rounded", label: "Rounded" },
  { id: "script", label: "Script" },
];

export const stickerColor = (id: string): StickerColor =>
  STICKER_COLORS.find((color) => color.id === id) ?? STICKER_COLORS[0];

/** Same rule PRESS HOUSE uses: one line, collapsed spaces, 24 characters max. */
export const normalizeStickerText = (text: string): string => text.replace(/\s+/g, " ").trim().slice(0, 24);

  /** The checkout's variant id for a custom sticker size, e.g. prod_custom_standard_os_3x3in. */
export const stickerVariantId = (typeId: string, size: StickerSize): string =>
  `prod_custom_${typeId}_os_${size.label.replace(/[^\dA-Za-z]/g, "")}`.toLowerCase();

export const findStickerSize = (spec: CustomSticker): StickerSize | undefined =>
  Object.values(CUSTOM_STICKERS)
    .find((type) => type.typeId === spec.typeId)
    ?.sizes.find((size) => size.id === spec.sizeId);

/** Sizes, prices and print dimensions exactly as PRESS HOUSE sells them. */
export const CUSTOM_STICKERS: Record<string, CustomStickerType> = {
  prod_custom_tiny: {
    typeId: "tiny",
    sizes: [{ id: "2x2", label: "2 × 2 in", price: 4, printPx: [600, 600] }],
  },
  prod_custom_standard: {
    typeId: "standard",
    sizes: [
      { id: "3x3", label: "3 × 3 in", price: 6, printPx: [900, 900] },
      { id: "4x4", label: "4 × 4 in", price: 7, printPx: [1200, 1200] },
    ],
  },
  prod_custom_large: {
    typeId: "large",
    sizes: [
      { id: "5x5", label: "5 × 5 in", price: 8, printPx: [1500, 1500] },
      { id: "6x6", label: "6 × 6 in", price: 9, printPx: [1800, 1800] },
    ],
  },
  prod_custom_bumper: {
    typeId: "bumper",
    sizes: [
      { id: "11x3", label: "11 × 3 in", price: 9, printPx: [3371, 971] },
      { id: "15x375", label: "15 × 3.75 in", price: 11, printPx: [4571, 1196] },
    ],
  },
  prod_custom_window: {
    typeId: "window",
    cutVinyl: true,
    sizes: [
      { id: "3x4", label: "3 × 4 in", price: 10, printPx: [600, 800] },
      { id: "4x6", label: "4 × 6 in", price: 12, printPx: [800, 1200] },
      { id: "6x8", label: "6 × 8 in", price: 15, printPx: [1200, 1600] },
      { id: "8x10", label: "8 × 10 in", price: 19, printPx: [1600, 2000] },
    ],
  },
};

/* ------------------------------- sticker pack ----------------------------- */

export interface PackDesign {
  imageId: string;
  x: number;
  y: number;
  scale: number;
}

/** PRESS HOUSE sticker-sheet product the pack prints on (four die-cuts, 11 × 8.5 in). */
export const STICKER_PACK_PRODUCT = "prod_design_sticker_sheet";
export const STICKER_PACK_VARIANT = "prod_design_sticker_sheet_os_os";

/** The goofy turntable print file, already uploaded to the print provider. */
const STICKER_PACK_DESIGN: PackDesign = { imageId: "6aba6884b17b322bb69c3752", x: 0.5, y: 0.5, scale: 0.74 };

const ART = "https://2s7937nfb5j5e0l2chd6r.rork.app/~assets/img";

const sizeOptions = (type: CustomStickerType): ProductOptionGroup[] => [
  {
    id: "size",
    name: "Size",
    values: type.sizes.map((size) => ({
      id: size.id,
      label: size.label,
      available: true,
      priceDelta: size.price - type.sizes[0].price,
    })),
  },
];

/** Art + checkout wiring for the items PRESS HOUSE has no house listing for. */
const RACK_EXTRAS: Record<string, Partial<StoreProduct>> = {
  prod_sticker_pack: {
    images: [`${ART}/cb62d095-00c5-4fad-9392-d7087a6a59c5.png`, `${ART}/a97d1802-322f-4bd9-a4d3-9c1d9d7bb29c.png`],
    price: 14,
    tagline: "Four die-cut turntable goons on one sheet",
    description:
      "Four die-cut vinyl stickers of the DJ Games turntable goon on one 11 × 8.5 in sheet. Slap them on a laptop, a bottle or a case.",
    details: ["Four die-cut stickers per sheet", "11 × 8.5 in sheet", "Durable vinyl"],
    options: [],
    pack: STICKER_PACK_DESIGN,
  },
  prod_custom_tiny: { images: [`${ART}/b9cd2bf6-84c3-473d-9da5-6e310f0b3f71.png`] },
  prod_custom_standard: { images: [`${ART}/b2aaee02-20a9-4219-9f6c-cbce27f038a7.png`] },
  prod_custom_large: { images: [`${ART}/7b5d8381-1749-4b39-be0f-ae2e18302d19.png`] },
  prod_custom_bumper: { images: [`${ART}/eda496db-e732-46e4-af49-8327a22a076e.png`] },
  prod_custom_window: { images: [`${ART}/9600ace8-ae98-47da-955e-8373746d4ad7.png`] },
};

const withExtras = (product: StoreProduct): StoreProduct => {
  const custom = CUSTOM_STICKERS[product.id];
  const extras = RACK_EXTRAS[product.id] ?? {};
  return {
    ...product,
    ...(custom ? { custom, price: custom.sizes[0].price, options: sizeOptions(custom) } : {}),
    ...extras,
    status: "available",
    statusLabel: "In stock",
  };
};

export interface ProductVariant {
  id: number;
  color: string;
  size: string;
}

/** True when the item can go in the bag and through checkout. */
export const isBuyable = (product: StoreProduct): boolean =>
  product.status === "available" &&
  (Boolean(product.custom) ||
    Boolean(product.pack) ||
    (Boolean(product.pressHouseId) && (product.variants?.length ?? 0) > 0));

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

/**
 * True when this combination of Color/Size labels is actually printable —
 * an option that can't be fulfilled never becomes selectable.
 * Products without variants (custom stickers, the pack) are always pickable.
 */
export const isPickable = (product: StoreProduct, picked: Record<string, string>): boolean =>
  product.variants === undefined ? true : findVariant(product, picked) !== undefined;

/** Sum of the picked options' price deltas (e.g. 2XL +$3), in dollars. */
export const pickedPriceDelta = (product: StoreProduct, picked: Record<string, string>): number =>
  product.options.reduce(
    (total, group) =>
      total + (group.values.find((value) => value.label === picked[group.id])?.priceDelta ?? 0),
    0,
  );

/* ------------------------------ the house rack ---------------------------- */

/**
 * PRESS HOUSE is live (Stripe checkout + Printify fulfilment), so the rack is
 * open. Set to false to force every card back to "Out of stock" in one move.
 */
export const STORE_IS_STOCKED = true;

/** The rack as the page shows it — the synced PRESS HOUSE catalog, featured first. */
export const rackProducts = (): StoreProduct[] => {
  const ordered = PRESS_HOUSE_PRODUCTS.map(withExtras).sort(
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
  /** What checkout sends to PRESS HOUSE for this line. */
  kind?: LineKind;
  pressHouseId?: string;
  variantId?: number | string;
  custom?: CustomSticker;
  design?: PackDesign;
}

export type LineKind = "listing" | "custom" | "design";

/** Everything the product sheet hands the bag for one add. */
export interface LineCheckout {
  kind: LineKind;
  pressHouseId: string;
  variantId: number | string;
  price: number;
  /** Bag thumbnail override — the rendered preview for custom stickers. */
  image?: string;
  custom?: CustomSticker;
  design?: PackDesign;
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
