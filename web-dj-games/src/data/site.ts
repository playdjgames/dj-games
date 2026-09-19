/**
 * ============================================================================
 * DJ GAMES — SITE CONFIGURATION
 * ============================================================================
 * This is the single place to update studio-wide details.
 *
 * ⚠️  ANYTHING WRAPPED IN [SQUARE_BRACKETS] IS A PLACEHOLDER.
 *     Replace it with your real value. Until you do, the site automatically
 *     hides that link/button instead of pretending it works.
 * ============================================================================
 */

/** Returns true only when a link has been filled in with a real value. */
export const isLive = (url: string | undefined | null): url is string =>
  typeof url === "string" && url.trim().length > 0 && !url.trim().startsWith("[");

export type SocialKey = "discord" | "youtube" | "tiktok" | "x" | "instagram" | "facebook";

export interface SiteConfig {
  brandName: string;
  tagline: string;
  description: string;
  /** Canonical site URL. Used for the footer's domain line, and for SEO/share URLs
   *  once the domain actually serves the site — see `canonicalOrigin()`. */
  website: string;
  /** 👇 REPLACE with your real business email. */
  email: string;
  /** 👇 REPLACE each link you actually use. Untouched ones stay hidden site-wide. */
  socials: Record<SocialKey, string>;
  copyrightYear: number;
}

/** Your PayPal.me username — the part after paypal.me/ on your PayPal.me page. */
export const DONATIONS = {
  paypalMe: "dutt1",
} as const;

/**
 * Builds a paypal.me contribution URL for a whole-dollar amount (forced to USD).
 * Returns null when no username is configured, so the support CTA stays hidden
 * site-wide — same pattern as `isLive`. Tolerates a leading "@" if one is pasted in.
 */
export const paypalMeUrl = (amount: number): string | null => {
  if (!isLive(DONATIONS.paypalMe)) return null;
  const handle = DONATIONS.paypalMe.trim().replace(/^@+/, "");
  if (handle.length === 0) return null;
  return `https://paypal.me/${handle}/${amount}USD`;
};

export const SITE: SiteConfig = {
  brandName: "DJ Games",
  tagline: "Original games. Big ideas. Built to play.",
  description:
    "Discover original games and apps from DJ Games. Explore our latest releases, upcoming projects, and new interactive experiences.",
  website: "https://playdjgames.com",
  email: "dutter07@gmail.com",
  socials: {
    discord: "[DISCORD_URL]",
    youtube: "[YOUTUBE_URL]",
    tiktok: "[TIKTOK_URL]",
    x: "[X_URL]",
    instagram: "[INSTAGRAM_URL]",
    // 👇 Your Facebook PAGE url, e.g. https://www.facebook.com/PlayDJGames
    //    (facebook.com on its own is the login homepage, not a profile).
    facebook: "[FACEBOOK_URL]",
  },
  copyrightYear: 2026,
};

/** Bare hostname of the canonical domain, e.g. "playdjgames.com". */
export const websiteDomain = (): string => SITE.website.replace(/^https?:\/\//, "").replace(/\/$/, "");

/**
 * Origin to use for canonical URLs, og:url, and share links.
 *
 * `SITE.website` is only used when the visitor is ACTUALLY on that domain (or its
 * www variant). While the domain merely redirects here — or when browsing the
 * preview host — we fall back to the live origin, so we never advertise a URL
 * that redirects or 404s. Once the domain is served directly, this flips to the
 * custom domain on its own with no code change.
 */
export const canonicalOrigin = (): string => {
  if (typeof window === "undefined") return SITE.website;

  const host = window.location.hostname.toLowerCase();
  const canonicalHost = websiteDomain().toLowerCase();

  if (host === canonicalHost || host === `www.${canonicalHost}`) return SITE.website;
  return window.location.origin;
};

/** Absolute URL for a route path (e.g. "/games/run-dummy") on the best-known origin. */
export const canonicalUrl = (path: string): string => `${canonicalOrigin()}${path}`;

export const SOCIAL_LABELS: Record<SocialKey, string> = {
  discord: "Discord",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
};

/** Only the social platforms you have actually filled in. */
export const activeSocials = (): { key: SocialKey; label: string; url: string }[] =>
  (Object.keys(SITE.socials) as SocialKey[])
    .filter((key) => isLive(SITE.socials[key]))
    .map((key) => ({ key, label: SOCIAL_LABELS[key], url: SITE.socials[key] }));

export const NAV_LINKS: { label: string; to: string; accent?: "ember" }[] = [
  { label: "Home", to: "/" },
  { label: "Games", to: "/games" },
  { label: "Coming Soon", to: "/coming-soon" },
  { label: "About", to: "/about" },
  { label: "News", to: "/news" },
  { label: "Contact", to: "/contact" },
  { label: "Support", to: "/support", accent: "ember" },
];
