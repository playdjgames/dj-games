/**
 * ============================================================================
 * PRESS HOUSE SYNC  —  run with:  node scripts/sync-presshouse.mjs
 * ============================================================================
 * Pulls PRESS HOUSE's live catalog from its shop API
 * (https://press-house.rork.app/~api/shops/house — the same backend that powers
 * shop.playdjgames.com) and writes `src/data/presshouse.generated.ts`, which
 * /store renders directly. Every listing carries its Printify product id, real
 * mockup art and the exact enabled variants (color x size), so /store can run
 * the whole bag + checkout in-page.
 *
 * The DJ Games checkout fulfils these listings through the SAME Printify
 * account (see HOUSE_PRODUCTS in functions/_lib/shop.ts) — the two maps must
 * stay in sync.
 *
 * LEGACY ITEMS: entries already present in the generated file whose listing id
 * is not part of the live PRESS HOUSE catalog (the studio's own archive
 * designs, custom text stickers, sticker pack) are preserved verbatim, so a
 * re-sync never drops merch the Printify shop still fulfils.
 *
 * Re-run after changing the PRESS HOUSE catalog.
 * ============================================================================
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "src/data/presshouse.generated.ts");
const PRESS_HOUSE_API = "https://press-house.rork.app/~api";

/** Distinct values in first-seen order. */
const distinct = (values) => [...new Set(values)];

/** Builds Color/Size option groups straight from the listing's real variants. */
const optionsFromVariants = (variants) => {
  const groups = [];
  const colors = distinct(variants.map((variant) => variant.color).filter((color) => color && color !== "Default"));
  const sizes = distinct(variants.map((variant) => variant.size).filter(Boolean));
  if (colors.length > 1) {
    groups.push({
      id: "color",
      name: "Color",
      values: colors.map((label, index) => ({ id: `color-${index}`, label, available: true })),
    });
  }
  if (sizes.length > 1) {
    groups.push({
      id: "size",
      name: "Size",
      values: sizes.map((label, index) => ({ id: `size-${index}`, label, available: true, priceDelta: 0 })),
    });
  }
  return groups;
};

/** Storefront category for a listing, from its Printify blueprint title. */
const categoryFor = (blueprintTitle) => {
  const title = (blueprintTitle ?? "").toLowerCase();
  if (title.includes("poster")) return "Posters";
  if (title.includes("sticker")) return "Stickers";
  if (title.includes("mug")) return "Mugs";
  if (title.includes("bottle")) return "Bottles";
  if (title.includes("cap")) return "Hats";
  if (title.includes("tote")) return "Bags";
  if (title.includes("hood")) return "Hoodies";
  if (title.includes("long sleeve")) return "Long Sleeves";
  if (title.includes("tee")) return "Tees";
  return "Merch";
};

/** Stable catalog id for a listing, e.g. "prod_house_registration-tee". */
const catalogIdFor = (title) =>
  `prod_house_${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;

/** Reads the current generated file's product array (machine-formatted JSON). */
const readExistingProducts = () => {
  try {
    const source = readFileSync(OUT_FILE, "utf8");
    const start = source.indexOf("= [");
    const end = source.lastIndexOf("];");
    if (start < 0 || end < 0) return [];
    return JSON.parse(source.slice(start + 2, end + 1));
  } catch {
    return [];
  }
};

const main = async () => {
  const response = await fetch(`${PRESS_HOUSE_API}/shops/house`);
  if (!response.ok) throw new Error(`PRESS HOUSE shop API → HTTP ${response.status}`);
  const house = await response.json();

  // Fresh items from the live catalog — live listings only.
  const listings = (house.products ?? []).filter((listing) => listing.status === "live");
  if (listings.length === 0) throw new Error("PRESS HOUSE catalog came back empty — refusing to overwrite");

  const fresh = listings.map((listing) => {
    const enabled = new Set(listing.enabled_variant_ids ?? listing.variants.map((variant) => variant.id));
    const variants = listing.variants
      .filter((variant) => enabled.has(variant.id))
      .map((variant) => ({ id: variant.id, color: variant.color, size: variant.size }));
    if (variants.length === 0) throw new Error(`${listing.title} has no enabled variants — refusing to overwrite`);
    return {
      id: catalogIdFor(listing.title),
      name: listing.title,
      description: listing.description || undefined,
      price: listing.price_cents / 100,
      currency: "USD",
      images: listing.mockup_url ? [listing.mockup_url] : [],
      category: categoryFor(listing.blueprint_title),
      status: "available",
      statusLabel: "In stock",
      options: optionsFromVariants(variants),
      pressHouseId: listing.id,
      variants,
    };
  });

  // Keep merch the live catalog no longer knows about (archive designs, custom
  // stickers, sticker pack) — their Printify listings still exist and still sell.
  const freshIds = new Set(fresh.map((product) => product.pressHouseId));
  const legacy = readExistingProducts().filter(
    (product) => !product.pressHouseId || !freshIds.has(product.pressHouseId),
  );

  const products = [...fresh, ...legacy];

  const out = `/* AUTO-GENERATED by scripts/sync-presshouse.mjs — do not edit by hand. */
/* Source: ${PRESS_HOUSE_API}/shops/house (live PRESS HOUSE catalog) + preserved archive items. */
import type { StoreProduct } from "./store";

export const PRESS_HOUSE_SYNCED_AT = ${JSON.stringify(new Date().toISOString())};

export const PRESS_HOUSE_PRODUCTS: StoreProduct[] = ${JSON.stringify(products, null, 2)};
`;
  writeFileSync(OUT_FILE, out);
  console.log(`synced ${fresh.length} live listings + kept ${legacy.length} archive items → ${OUT_FILE}`);
};

main().catch((error) => {
  console.error("PRESS HOUSE sync failed:", error.message);
  process.exit(1);
});
