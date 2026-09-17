/**
 * Client for the newsletter backend (Cloudflare Worker + Durable Object).
 *
 * Subscribing is public. Reading the list and exporting CSV require the admin
 * key, which is never bundled into the site — it is typed once on /subscribers
 * and kept in that browser's localStorage.
 */

const BACKEND_URL: string = import.meta.env["EXPO_PUBLIC_RORK_FUNCTIONS_URL"] ?? "";

export const isNewsletterConnected = (): boolean => BACKEND_URL.length > 0;

export interface Subscriber {
  email: string;
  source: string;
  created_at: number;
}

export interface SubscribeResult {
  ok: boolean;
  alreadySubscribed: boolean;
}

/** Stores an email address. Throws on network/server failure so callers can toast. */
export const subscribeEmail = async (email: string, source: string): Promise<SubscribeResult> => {
  if (!isNewsletterConnected()) throw new Error("newsletter backend not configured");

  const response = await fetch(`${BACKEND_URL}/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source }),
  });

  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; alreadySubscribed?: boolean; error?: string }
    | null;

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? `request failed (${response.status})`);
  }

  return { ok: true, alreadySubscribed: Boolean(data.alreadySubscribed) };
};

export class NewsletterAuthError extends Error {}

const adminRequest = async (path: string, adminKey: string): Promise<Response> => {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${adminKey}` },
  });

  if (response.status === 401) throw new NewsletterAuthError("That key didn't work.");
  if (response.status === 503) {
    throw new NewsletterAuthError("No admin key is configured on the server yet.");
  }
  if (!response.ok) throw new Error(`request failed (${response.status})`);

  return response;
};

/** Fetches every subscriber, newest first. */
export const fetchSubscribers = async (adminKey: string): Promise<Subscriber[]> => {
  const response = await adminRequest("/newsletter/list", adminKey);
  const data = (await response.json()) as { subscribers?: Subscriber[] };
  return data.subscribers ?? [];
};

/** Downloads the CSV export through a blob so the key never lands in a URL. */
export const downloadSubscribersCsv = async (adminKey: string): Promise<void> => {
  const response = await adminRequest("/newsletter/export.csv", adminKey);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dj-games-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/** Removes one subscriber (unsubscribe requests, typos, spam). */
export const removeSubscriber = async (email: string, adminKey: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/newsletter/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminKey}` },
    body: JSON.stringify({ email }),
  });

  if (response.status === 401) throw new NewsletterAuthError("That key didn't work.");
  if (!response.ok) throw new Error(`request failed (${response.status})`);
};
