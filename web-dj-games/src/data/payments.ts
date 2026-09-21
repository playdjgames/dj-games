/**
 * Tip-jar payment config. Adding a platform later = add one object here,
 * set `live: true`, and paste the real URL — the Donate screen needs no
 * UI changes.
 */

/** PayPal.me username — the only live provider today. */
export const PAYPAL_ME = "dutt1";

export interface PaymentMethod {
  id: string;
  name: string;
  /** Short status line, e.g. "Live now" or "Coming soon". */
  meta: string;
  /** Only live methods can be selected and checked out. */
  live: boolean;
  /** Primary CTA label, e.g. "Donate with PayPal". */
  cta: string;
  /** Returns the checkout / pay-me link for the given integer USD amount. */
  url: (amount: number) => string;
  /** Provider brand colors for the primary CTA pill. Defaults to lime-on-dark. */
  theme?: { bg: string; text: string };
  /** Small square mark shown next to the method name. */
  badge?: { bg: string; text: string; glyph: string };
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "paypal",
    name: "PayPal",
    meta: "Live now",
    live: true,
    cta: "Donate with PayPal",
    url: (amount) => `https://www.paypal.com/paypalme/${PAYPAL_ME}/${amount}`,
    theme: { bg: "#FFC439", text: "#003087" },
    badge: { bg: "#FFC439", text: "#003087", glyph: "P" },
  },
  {
    id: "card",
    name: "Card (Stripe)",
    meta: "Coming soon",
    live: false,
    cta: "Pay with card",
    url: () => "https://buy.stripe.com/YOUR_PAYMENT_LINK",
    theme: { bg: "#635BFF", text: "#FFFFFF" },
    badge: { bg: "#635BFF", text: "#FFFFFF", glyph: "C" },
  },
  {
    id: "venmo",
    name: "Venmo",
    meta: "Coming soon",
    live: false,
    cta: "Pay with Venmo",
    url: (amount) => `https://venmo.com/YOUR_VENMO?txn=pay&amount=${amount}`,
    theme: { bg: "#3D95CE", text: "#FFFFFF" },
    badge: { bg: "#3D95CE", text: "#FFFFFF", glyph: "V" },
  },
  {
    id: "cashapp",
    name: "Cash App",
    meta: "Coming soon",
    live: false,
    cta: "Pay with Cash App",
    url: (amount) => `https://cash.app/$YOUR_CASH_TAG/${amount}`,
    theme: { bg: "#00D632", text: "#FFFFFF" },
    badge: { bg: "#00D632", text: "#FFFFFF", glyph: "$" },
  },
];

/** Preset tip amounts (USD). */
export const AMOUNT_CHIPS: number[] = [5, 15, 40];

/** Amount preselected on load. */
export const DEFAULT_AMOUNT = 15;
