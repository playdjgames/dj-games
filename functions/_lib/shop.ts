// DJ Games merch checkout — Stripe takes the money, Printify prints and ships.
//
// Every price, variant and shipping amount is resolved here on the server from
// the live Printify shop; nothing the browser sends is trusted except *which*
// item and variant the shopper picked.

export type ShopEnv = {
  STRIPE_SECRET_KEY?: string;
  PRINTIFY_API_TOKEN?: string;
  PRINTIFY_SHOP_ID?: string;
};

/** Error whose message is safe to show the shopper (the store's uppercase voice). */
export class ShopError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

const UNAVAILABLE = "CHECKOUT IS UNAVAILABLE RIGHT NOW";

/** Maps a checkout failure to a shopper-facing JSON response. */
export const shopErrorResponse = (error: unknown): Response => {
  if (error instanceof ShopError) return Response.json({ error: error.message }, { status: error.status });
  console.error("shop checkout failed", { message: error instanceof Error ? error.message : String(error) });
  return Response.json({ error: UNAVAILABLE }, { status: 502 });
};

/* ------------------------------- catalog map ------------------------------- */

/** Store listing id (from the synced catalog) → product in the Printify shop. */
export const LISTING_PRODUCTS: Record<string, string> = {
  prd_mukpeqbf32cbd2701c: "6ab92ea0a4fc0c9922093aa5", // House Mark Tee
  prd_mukpeqoyded617b075: "6ab92ea563d317ccfb0c76d0", // Wordmark Hoodie
  prd_mukper6hbf5dc93338: "6ab92ea9dcd154052a0154ef", // Grid Long Sleeve
  prd_mukperk07c709455e6: "6ab92eac313d78541609a09c", // House Tote
  prd_mukpervr0e0d0cca1b: "6ab92eaf63d317ccfb0c76d4", // Dad Hat
  prd_mukpes37aa2f12bbbe: "6ab92eb2a4fc0c9922093aaf", // Five-Panel Camp Cap
  prd_mukpesdn06c02beffc: "6ab92eb4313d78541609a0a2", // Enamel Mug
  prd_mukpespnf14c702060: "6ab92eb7b89b0ed60e0390c1", // Insulated Bottle
  prd_mukpet1fbe4b319ba7: "6ab92ebd4969eb2e8f085ccd", // Die-Cut Mark Sticker
  prd_mukpethze882c4d24b: "6ab92ec10d7900d72c070b74", // Press Poster
  prd_mukpetn5445d38101c: "6ab92ec3a4fc0c9922093abc", // Orbit Poster
  prd_mukpeqgw91c476a628: "6ab948ba7ffd41ee910caa27", // Cassette Tee
  prd_mukpeqv6a2e40b1178: "6ab948c57ffd41ee910caa31", // Bassline Hoodie
  prd_mukperca39dc9cb42e: "6ab948cad93c97b61d03328f", // Frequency Long Sleeve
  prd_mukpetafe0f2fc5d27: "6ab948d1d93c97b61d03329b", // Turntable Poster
};

/**
 * PRESS HOUSE's current line-up (shop.playdjgames.com, spring 2026 refresh).
 * The listings live in the same Printify account as this shop, so checkout
 * prices and fulfils them exactly like LISTING_PRODUCTS — only the map differs.
 * Keep in sync with `web-dj-games/scripts/sync-presshouse.mjs`.
 */
export const HOUSE_PRODUCTS: Record<string, string> = {
  prd_mulbxnec5e69e64ed8: "6aba7670241d6dce5c0411d5", // Proof No. 001 Poster
  prd_mulbxj4l82101e545f: "6aba766dd6029acfea09c47e", // Wood Type Poster
  prd_mulbxem7b759402c0a: "6aba766797ca418b5d0840e4", // CMYK Poster
  prd_mulbxbvidbfdc7755d: "6aba7664241d6dce5c0411cf", // Press Seal Sticker
  prd_mulbx4yqf0977712a7: "6aba765bd6029acfea09c471", // Registration Bottle
  prd_mulbx2yl69cd1852ed: "6aba765897ca418b5d0840dc", // Coffee Before Ink Mug
  prd_mulbx10000c66da16d: "6aba765690c8c7b20703de32", // Press House Camp Cap
  prd_mulbwz063bb01cdf4e: "6aba765387a1b356310d333a", // PH Dad Hat
  prd_mulbwx626402bbdc14: "6aba765197ca418b5d0840d3", // Made To Order Tote
  prd_mulbwoou245567e877: "6aba764697ca418b5d0840ca", // Proof Long Sleeve
  prd_mulbwm7jcbc05b8717: "6aba764297ca418b5d0840c7", // Halftone Long Sleeve
  prd_mulbwink3c9d54f04e: "6aba763e2d6e5e2ddc07164f", // Misprint Hoodie
  prd_mulbwfvof79a5cb40c: "6aba763a2abb560f7d09fed5", // Ink Roller Hoodie
  prd_mulbw7t722a1b6eee1: "6aba762f241d6dce5c0411af", // Registration Tee
  prd_mulbw4mga8042ccb71: "6aba762b2d6e5e2ddc071644", // Press Seal Tee
};

interface PrintSpec {
  blueprintId: number;
  printProviderId: number;
  variantId: number;
  cents: number;
  label: string;
}

/** Custom text stickers: blueprint + variant per size, at the store's prices. */
const CUSTOM_SIZES: Record<string, Record<string, PrintSpec>> = {
  tiny: { "2x2": { blueprintId: 600, printProviderId: 73, variantId: 72006, cents: 400, label: "2 × 2 in" } },
  standard: {
    "3x3": { blueprintId: 600, printProviderId: 73, variantId: 72007, cents: 600, label: "3 × 3 in" },
    "4x4": { blueprintId: 600, printProviderId: 73, variantId: 72008, cents: 700, label: "4 × 4 in" },
  },
  large: {
    "5x5": { blueprintId: 600, printProviderId: 73, variantId: 72009, cents: 800, label: "5 × 5 in" },
    "6x6": { blueprintId: 600, printProviderId: 73, variantId: 72010, cents: 900, label: "6 × 6 in" },
  },
  bumper: {
    "11x3": { blueprintId: 598, printProviderId: 73, variantId: 71930, cents: 900, label: "11 × 3 in" },
    "15x375": { blueprintId: 598, printProviderId: 73, variantId: 71931, cents: 1100, label: "15 × 3.75 in" },
  },
  window: {
    "3x4": { blueprintId: 1268, printProviderId: 215, variantId: 95743, cents: 1000, label: "3 × 4 in" },
    "4x6": { blueprintId: 1268, printProviderId: 215, variantId: 95744, cents: 1200, label: "4 × 6 in" },
    "6x8": { blueprintId: 1268, printProviderId: 215, variantId: 95745, cents: 1500, label: "6 × 8 in" },
    "8x10": { blueprintId: 1268, printProviderId: 215, variantId: 95746, cents: 1900, label: "8 × 10 in" },
  },
};

const CUSTOM_TITLES: Record<string, string> = {
  tiny: "Custom Text Sticker — Tiny",
  standard: "Custom Text Sticker — Standard",
  large: "Custom Text Sticker — Large",
  bumper: "Custom Text Sticker — Bumper",
  window: "Custom Car Window Decal",
};

const COLOR_LABELS: Record<string, string> = {
  black: "Black",
  white: "White",
  silver: "Silver",
  yellow: "Yellow",
  red: "Red",
  blue: "Blue",
  gold: "Gold",
  pink: "Pink",
  green: "Green",
};

/** The goon sticker pack: a finished product in the shop (four die-cuts, 11 × 8.5 in). */
const STICKER_PACK = { productId: "6ab94b977ffd41ee910cabcc", variantId: 72841, cents: 1400, label: "11 × 8.5 in sheet" };

/* ---------------------------------- types ---------------------------------- */

export type IncomingLine =
  | { kind: "listing"; productId: string; variantId: number; qty: number }
  | { kind: "custom"; productId: string; variantId: string; qty: number; custom: Record<string, string>; image?: string }
  | {
      kind: "design";
      productId: string;
      variantId: string;
      qty: number;
      design: { imageId: string; x: number; y: number; scale: number };
    };

export interface ShopAddress {
  email: string;
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

/** How a paid line becomes a Printify order line. */
export type PrintJob =
  | { kind: "product"; productId: string; variantId: number }
  | {
      kind: "made";
      blueprintId: number;
      printProviderId: number;
      variantId: number;
      /** Uploaded print-file image id — set at checkout, before the session opens. */
      imageId?: string;
      x: number;
      y: number;
      scale: number;
      /** Created on first fulfilment attempt so retries never duplicate it. */
      createdProductId?: string;
    };

export type MadeJob = Extract<PrintJob, { kind: "made" }>;

export interface PricedLine {
  title: string;
  size_label: string;
  color_label: string;
  qty: number;
  unit_cents: number;
  job: PrintJob;
  /** Base64 PNG print file (custom stickers only) — uploaded, never stored. */
  printFile?: string;
}

export interface ShopQuote {
  merchandise_cents: number;
  shipping_cents: number;
  shipping_quoted: boolean;
  total_cents: number;
  lines: Omit<PricedLine, "job" | "printFile">[];
}

/* -------------------------------- printify --------------------------------- */

const shopIdOf = (env: ShopEnv): string => {
  const raw = env.PRINTIFY_SHOP_ID?.trim() ?? "";
  return raw.match(/store\/(\d+)/)?.[1] ?? raw.match(/\d{4,}/)?.[0] ?? "";
};

export class PrintifyError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(`printify ${status}`);
  }
}

/** Authenticated Printify call. `{shop}` in the path becomes the shop id. */
export const printify = async <T>(env: ShopEnv, path: string, init?: { method: string; body?: unknown }): Promise<T> => {
  const token = env.PRINTIFY_API_TOKEN?.trim();
  const shopId = shopIdOf(env);
  if (!token || !shopId) throw new ShopError(UNAVAILABLE, 503);

  const response = await fetch(`https://api.printify.com/v1/${path.replace("{shop}", shopId)}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json;charset=utf-8",
      "User-Agent": "DJGamesStore/1.0",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const info = (data ?? {}) as { code?: unknown; message?: unknown; errors?: unknown };
    const detail = JSON.stringify({ code: info.code, message: info.message, errors: info.errors }).slice(0, 400);
    console.error("printify error", { path: path.split("?")[0].replace(/\d{6,}/, "{shop}"), status: response.status, detail });
    throw new PrintifyError(response.status, detail);
  }
  return data as T;
};

interface PrintifyProduct {
  id: string;
  title: string;
  variants: { id: number; title: string; price: number; is_enabled: boolean; is_available: boolean }[];
}

/* --------------------------------- pricing --------------------------------- */

/** Resolves every bag line to an authoritative price and print job. */
export const priceLines = async (env: ShopEnv, lines: IncomingLine[], requireFiles = false): Promise<PricedLine[]> => {
  const products = new Map<string, Promise<PrintifyProduct>>();
  const productFor = (id: string): Promise<PrintifyProduct> => {
    const cached = products.get(id);
    if (cached) return cached;
    const next = printify<PrintifyProduct>(env, `shops/{shop}/products/${id}.json`);
    products.set(id, next);
    return next;
  };

  return Promise.all(
    lines.map(async (line): Promise<PricedLine> => {
      if (line.kind === "custom") {
        const typeId = line.custom.typeId ?? "";
        const spec = CUSTOM_SIZES[typeId]?.[line.custom.sizeId ?? ""];
        if (!spec) throw new ShopError("THAT STICKER SIZE ISN'T AVAILABLE");
        if (requireFiles && !line.image) throw new ShopError("YOUR STICKER ART DIDN'T COME THROUGH — TRY AGAIN");
        return {
          title: `${CUSTOM_TITLES[typeId] ?? "Custom Sticker"} · “${line.custom.text}”`,
          size_label: spec.label,
          color_label: COLOR_LABELS[line.custom.color ?? ""] ?? "",
          qty: line.qty,
          unit_cents: spec.cents,
          printFile: line.image,
          job: {
            kind: "made",
            blueprintId: spec.blueprintId,
            printProviderId: spec.printProviderId,
            variantId: spec.variantId,
            x: 0.5,
            y: 0.5,
            scale: 1,
          },
        };
      }

      if (line.kind === "design") {
        return {
          title: "Sticker Pack",
          size_label: STICKER_PACK.label,
          color_label: "",
          qty: line.qty,
          unit_cents: STICKER_PACK.cents,
          job: { kind: "product", productId: STICKER_PACK.productId, variantId: STICKER_PACK.variantId },
        };
      }

      const printifyId = LISTING_PRODUCTS[line.productId] ?? HOUSE_PRODUCTS[line.productId];
      if (!printifyId) throw new ShopError("AN ITEM IN YOUR BAG IS NO LONGER SOLD — REMOVE IT TO CONTINUE");
      const product = await productFor(printifyId);
      const variant = product.variants.find((item) => item.id === line.variantId && item.is_enabled);
      if (!variant) throw new ShopError(`${product.title.toUpperCase()} IN THAT OPTION IS NO LONGER SOLD — REMOVE IT TO CONTINUE`);
      if (!variant.is_available) throw new ShopError(`${product.title.toUpperCase()} (${variant.title.toUpperCase()}) IS OUT OF STOCK`);
      return {
        title: product.title,
        size_label: variant.title,
        color_label: "",
        qty: line.qty,
        unit_cents: variant.price,
        job: { kind: "product", productId: product.id, variantId: variant.id },
      };
    }),
  );
};

/* -------------------------------- addresses -------------------------------- */

const US_STATES = new Set(
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR GU VI AS MP AA AE AP".split(
    " ",
  ),
);

/** Throws a shopper-facing error for the first missing or malformed field. */
export const assertAddress = (address: ShopAddress): void => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address.email)) throw new ShopError("ENTER A VALID EMAIL");
  if (address.name.length < 2) throw new ShopError("ENTER YOUR FULL NAME");
  if (address.address1.length < 3) throw new ShopError("ENTER YOUR STREET ADDRESS");
  if (address.city.length < 2) throw new ShopError("ENTER YOUR CITY");
  if (!US_STATES.has(address.state.toUpperCase())) throw new ShopError("ENTER A 2-LETTER US STATE (E.G. GA)");
  if (!/^\d{5}(-\d{4})?$/.test(address.zip)) throw new ShopError("ENTER A VALID ZIP CODE");
};

/** Printify's address shape. */
export const printifyAddress = (address: ShopAddress): Record<string, string> => {
  const parts = address.name.trim().split(/\s+/);
  const first = parts.shift() ?? address.name;
  return {
    first_name: first,
    last_name: parts.join(" ") || first,
    email: address.email,
    country: "US",
    region: address.state.toUpperCase(),
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    zip: address.zip,
  };
};

/* --------------------------------- shipping -------------------------------- */

const shippingItem = (line: PricedLine): Record<string, number | string> =>
  line.job.kind === "product"
    ? { product_id: line.job.productId, variant_id: line.job.variantId, quantity: line.qty }
    : {
        blueprint_id: line.job.blueprintId,
        print_provider_id: line.job.printProviderId,
        variant_id: line.job.variantId,
        quantity: line.qty,
      };

/** Merchandise + Printify's own standard shipping rate for this address. */
export const quote = async (env: ShopEnv, lines: PricedLine[], address: ShopAddress): Promise<ShopQuote> => {
  let shipping: { standard?: number };
  try {
    shipping = await printify<{ standard?: number }>(env, "shops/{shop}/orders/shipping.json", {
      method: "POST",
      body: { line_items: lines.map(shippingItem), address_to: printifyAddress(address) },
    });
  } catch (error: unknown) {
    if (error instanceof PrintifyError && error.status < 500) {
      throw new ShopError("WE COULDN'T SHIP TO THAT ADDRESS — DOUBLE-CHECK IT");
    }
    throw error;
  }
  const shippingCents = Number(shipping.standard);
  if (!Number.isInteger(shippingCents) || shippingCents < 0) throw new ShopError(UNAVAILABLE, 502);

  const merchandise = lines.reduce((total, line) => total + line.unit_cents * line.qty, 0);
  return {
    merchandise_cents: merchandise,
    shipping_cents: shippingCents,
    shipping_quoted: true,
    total_cents: merchandise + shippingCents,
    lines: lines.map(({ title, size_label, color_label, qty, unit_cents }) => ({ title, size_label, color_label, qty, unit_cents })),
  };
};

/* ---------------------------------- stripe --------------------------------- */

/** Form-encoded Stripe call; logs Stripe's error type/code only. */
export const stripe = async <T>(env: ShopEnv, path: string, form?: URLSearchParams): Promise<T> => {
  const secret = env.STRIPE_SECRET_KEY?.trim();
  if (!secret) throw new ShopError(UNAVAILABLE, 503);
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: form ? "POST" : "GET",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form?.toString(),
  });
  const data = (await response.json().catch(() => null)) as (T & { error?: { type?: string; code?: string; message?: string } }) | null;
  if (!response.ok || !data) {
    console.error("stripe error", {
      path: path.split("?")[0].replace(/cs_[A-Za-z0-9_]+/, "{session}"),
      status: response.status,
      type: data?.error?.type,
      code: data?.error?.code,
      message: data?.error?.message,
    });
    throw new ShopError(UNAVAILABLE, 502);
  }
  return data;
};

export interface StripeSession {
  id: string;
  url?: string;
  status?: string;
  payment_status?: string;
  amount_total?: number;
  livemode?: boolean;
  payment_intent?: string | null;
}

/** One-off Checkout session for the priced bag plus the quoted shipping. */
export const createCheckoutSession = (
  env: ShopEnv,
  params: { orderId: string; lines: PricedLine[]; shippingCents: number; email: string; origin: string },
): Promise<StripeSession> => {
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("customer_email", params.email);
  form.set("client_reference_id", params.orderId);
  form.set("metadata[order_id]", params.orderId);
  form.set("metadata[source]", "playdjgames-store");
  form.set("payment_intent_data[metadata][order_id]", params.orderId);
  form.set("payment_intent_data[description]", `DJ Games Store order ${params.orderId}`);
  form.set("expires_at", String(Math.floor(Date.now() / 1000) + 2 * 60 * 60));
  params.lines.forEach((line, index) => {
    const prefix = `line_items[${index}]`;
    const labels = [line.size_label, line.color_label].filter((label) => label && label !== "Default").join(" · ");
    form.set(`${prefix}[quantity]`, String(line.qty));
    form.set(`${prefix}[price_data][currency]`, "usd");
    form.set(`${prefix}[price_data][unit_amount]`, String(line.unit_cents));
    form.set(`${prefix}[price_data][product_data][name]`, line.title.slice(0, 250));
    if (labels) form.set(`${prefix}[price_data][product_data][description]`, labels.slice(0, 250));
  });
  form.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  form.set("shipping_options[0][shipping_rate_data][display_name]", "Standard shipping");
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(params.shippingCents));
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
  form.set("success_url", `${params.origin}/checkout/done/${params.orderId}?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${params.origin}/store?bag=open`);
  return stripe<StripeSession>(env, "checkout/sessions", form);
};

/* ------------------------------- print files ------------------------------- */

/** Uploads a custom sticker's print file to Printify and returns its image id. */
export const uploadPrintFile = async (env: ShopEnv, fileName: string, base64: string): Promise<string> => {
  const uploaded = await printify<{ id?: string }>(env, "uploads/images.json", {
    method: "POST",
    body: { file_name: fileName, contents: base64 },
  });
  if (!uploaded.id) throw new ShopError(UNAVAILABLE, 502);
  return uploaded.id;
};

/** Short, unguessable order number, e.g. DJG-7K2QX9M4TB. */
export const newOrderId = (): string => {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `DJG-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
};
