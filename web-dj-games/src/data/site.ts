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
  /** General / business contact. */
  email: string;
  /** Player support contact. */
  supportEmail: string;
  /** 👇 REPLACE each link you actually use. Untouched ones stay hidden site-wide. */
  socials: Record<SocialKey, string>;
  copyrightYear: number;
}

export const SITE: SiteConfig = {
  brandName: "DJ Games",
  tagline: "Original iOS games and apps.",
  description:
    "DJ Games is an independent iOS studio. Everything DIY is out now on the App Store — more games are on the way.",
  website: "https://playdjgames.com",
  email: "hello@playdjgames.com",
  supportEmail: "support@playdjgames.com",
  socials: {
    discord: "[DISCORD_URL]",
    youtube: "[YOUTUBE_URL]",
    tiktok: "https://www.tiktok.com/@djgamesgaming",
    x: "[X_URL]",
    instagram: "https://www.instagram.com/playdjgames/",
    facebook: "https://www.facebook.com/PlayDJGames",
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
  // The studio is no longer games-only — the library holds apps, mobile games,
  // PC games and web work. The route stays /games so old links keep working.
  { label: "Apps-n-Stuff", to: "/games" },
  { label: "Coming Soon", to: "/coming-soon" },
  { label: "About", to: "/about" },
  { label: "News", to: "/news" },
  { label: "Support", to: "/support", accent: "ember" },
  { label: "Store", to: "/store", accent: "ember" },
  { label: "Donate", to: "/donate", accent: "ember" },
];

/** The one live app, used by the sticky mobile CTA and anywhere an install link is needed. */
export const FEATURED_APP_URL = "https://apps.apple.com/us/app/everything-diy/id6803175688";
