/**
 * ============================================================================
 * PRESS HOUSE SYNC  —  run with:  node scripts/sync-presshouse.mjs
 * ============================================================================
 * PRESS HOUSE (https://shop.playdjgames.com) is a separate Rork project. Its
 * own origin is https://press-house.rork.app; shop.playdjgames.com is a
 * Cloudflare Worker proxy over it (see cloudflare-proxy/worker.js), so shoppers
 * stay on the DJ Games domain. Syncing through the proxy keeps the URLs here
 * identical to what shoppers click.
 * does not expose a catalog endpoint — its products are compiled into its
 * site bundle. This script downloads that live bundle, extracts the product
 * array (names, copy, prices, sizes, colors, per-size surcharges) and writes
 * `src/data/presshouse.generated.ts`, which /store renders directly.
 *
 * Each item is then matched (by title) to its real PRESS HOUSE listing from
 * `GET /~api/shops/house`, which supplies the mockup art, the listing id and
 * the exact Printify variants (color x size). Those ids let /store run the
 * whole bag + checkout in-page. Items with no live listing stay on the rack as
 * "Coming soon". Re-run after changing the PRESS HOUSE catalog.
 * ============================================================================
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "src/data/presshouse.generated.ts");
const PRESS_HOUSE = "https://shop.playdjgames.com";
const PRESS_HOUSE_API = "https://press-house.rork.app/~api";

/** Distinct values in first-seen order. */
const distinct = (values) => [...new Set(values)];

/** Builds Color/Size option groups straight from the listing's real variants. */
const optionsFromVariants = (variants) => {
  const groups = [];
  const colors = distinct(variants.map((variant) => variant.color));
  const sizes = distinct(variants.map((variant) => variant.size));
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

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
  return response.text();
};

/** Returns the bracket-balanced literal starting at `start`, skipping strings. */
const balanced = (source, start) => {
  const open = source[start];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let quote = null;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "`" || ch === '"' || ch === "'") quote = ch;
    else if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error("unbalanced literal in PRESS HOUSE bundle");
};

const titleCase = (value) =>
  value
    .split(/[\s-]+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");

const main = async () => {
  const html = await fetchText(`${PRESS_HOUSE}/`);
  const script = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
  if (!script) throw new Error("could not find the PRESS HOUSE bundle in its index.html");
  const bundle = await fetchText(`${PRESS_HOUSE}${script}`);

  const arrayStart = bundle.indexOf("[{productId:`");
  if (arrayStart < 0) throw new Error("product array not found — PRESS HOUSE catalog shape changed");
  const arrayLiteral = balanced(bundle, arrayStart);

  // Shared constants referenced by name inside the array (sizes/images lists).
  const refs = new Set(
    [...arrayLiteral.matchAll(/:([A-Za-z_$][\w$]*)(?=[,}])/g)]
      .map((m) => m[1])
      .filter((name) => !["true", "false", "null", "undefined"].includes(name)),
  );
  const defs = [];
  for (const name of refs) {
    const at = bundle.search(new RegExp(`[,;\\s{(]${name.replace(/\$/g, "\\$")}=\\[`));
    if (at < 0) throw new Error(`constant ${name} not found in bundle`);
    const literalStart = bundle.indexOf("[", at);
    defs.push(`const ${name}=${balanced(bundle, literalStart)};`);
  }

  // Per-size surcharge helper (e.g. XXL +$3). Falls back to no surcharge.
  const surchargeSrc = bundle.match(/function [\w$]+\(e\)\{return e===`XXL`\?[^}]*\}/)?.[0];
  // eslint-disable-next-line no-new-func
  const surcharge = surchargeSrc
    ? new Function(`return (${surchargeSrc.replace(/^function [\w$]+/, "function")});`)()
    : () => 0;

  // Evaluates our own storefront's data literal (not user input).
  // eslint-disable-next-line no-new-func
  const raw = new Function(`${defs.join("\n")}\nreturn ${arrayLiteral};`)();

  // "Your Design" items are PRESS HOUSE's own upload-your-art generator, not DJ Games merch.
  const products = raw.filter((item) => !/^your design\b/i.test(item.name ?? "")).map((item) => {
    const sizes = Array.isArray(item.sizes) ? item.sizes : [];
    const colors = Array.isArray(item.colors) ? item.colors : [];
    const options = [];
    if (sizes.length > 0) {
      options.push({
        id: "size",
        name: "Size",
        values: sizes.map((label, index) => ({
          id: `size-${index}`,
          label,
          available: true,
          priceDelta: Number(surcharge(label)) || 0,
        })),
      });
    }
    if (colors.length > 1) {
      options.push({
        id: "color",
        name: "Color",
        values: colors.map((label, index) => ({ id: `color-${index}`, label: titleCase(label), available: true })),
      });
    }
    return {
      id: item.productId,
      name: item.name,
      tagline: item.shortLine ?? undefined,
      description: item.description ?? undefined,
      details: Array.isArray(item.details) ? item.details : [],
      price: Number(item.basePrice),
      currency: "USD",
      images: [],
      category: titleCase(item.category ?? "Merch"),
      status: "available",
      statusLabel: "In stock",
      options,
      url: `${PRESS_HOUSE}/product/${item.slug}`,
      featured: item.featured === true,
    };
  });

  if (products.length === 0) throw new Error("PRESS HOUSE catalog came back empty — refusing to overwrite");

  const house = JSON.parse(await fetchText(`${PRESS_HOUSE_API}/shops/house`));
  const listings = new Map(
    (house.products ?? []).filter((listing) => listing.status === "live").map((listing) => [listing.title, listing]),
  );

  let matched = 0;
  for (const product of products) {
    delete product.url;
    const listing = listings.get(product.name);
    if (!listing) {
      product.status = "coming_soon";
      product.statusLabel = "Coming soon";
      continue;
    }
    matched += 1;
    const enabled = new Set(listing.enabled_variant_ids ?? listing.variants.map((variant) => variant.id));
    const variants = listing.variants
      .filter((variant) => enabled.has(variant.id))
      .map((variant) => ({ id: variant.id, color: variant.color, size: variant.size }));
    product.pressHouseId = listing.id;
    product.price = listing.price_cents / 100;
    product.images = listing.mockup_url ? [listing.mockup_url] : [];
    product.variants = variants;
    product.options = optionsFromVariants(variants);
  }
  if (matched === 0) throw new Error("no PRESS HOUSE listings matched — refusing to overwrite");

  const out = `/* AUTO-GENERATED by scripts/sync-presshouse.mjs — do not edit by hand. */
/* Source: ${PRESS_HOUSE} (live PRESS HOUSE catalog). */
import type { StoreProduct } from "./store";

export const PRESS_HOUSE_SYNCED_AT = ${JSON.stringify(new Date().toISOString())};

export const PRESS_HOUSE_PRODUCTS: StoreProduct[] = ${JSON.stringify(products, null, 2)};
`;
  writeFileSync(OUT_FILE, out);
  console.log(`synced ${products.length} products (${matched} buyable) → ${OUT_FILE}`);
};

main().catch((error) => {
  console.error("PRESS HOUSE sync failed:", error.message);
  process.exit(1);
});
