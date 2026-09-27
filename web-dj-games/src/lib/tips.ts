/**
 * Client for card tips (Stripe Checkout via the Cloudflare backend).
 * The Stripe secret key lives only on the server; the browser just asks the
 * backend for a hosted Checkout URL and redirects to it.
 */
import { BACKEND_PATH } from "@/lib/backend";

export type CardMode = "live" | "test" | "off";

/** Which Stripe mode the backend key is in. Only "live" takes real cards. */
export const fetchCardMode = async (): Promise<CardMode> => {
  const response = await fetch(`${BACKEND_PATH}/tip/status`);
  if (!response.ok) return "off";
  const data = (await response.json().catch(() => null)) as { mode?: string; card?: boolean } | null;
  if (data?.mode === "live" || data?.mode === "test") return data.mode;
  return data?.card ? "test" : "off";
};

/** Creates a Checkout session for a whole-dollar USD tip and returns its URL. */
export const createCardTipCheckout = async (amount: number): Promise<string> => {
  const response = await fetch(`${BACKEND_PATH}/tip/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, origin: window.location.origin }),
  });
  const data = (await response.json().catch(() => null)) as { ok?: boolean; url?: string; error?: string } | null;
  if (!response.ok || !data?.ok || !data.url) {
    throw new Error(data?.error ?? `request failed (${response.status})`);
  }
  return data.url;
};
