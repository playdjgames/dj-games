/**
 * ============================================================================
 * DJ GAMES — APP & GAME LIBRARY
 * ============================================================================
 * These entries are your REAL apps, pulled from your App Store Connect account.
 *
 * ADD A NEW APP: copy any entry below, paste it into the GAMES array, and
 * change the values. The homepage, /games, /coming-soon and every detail page
 * update automatically — no other file needs to be touched.
 *
 * ⚠️  ANYTHING WRAPPED IN [SQUARE_BRACKETS] IS A PLACEHOLDER.
 *     Store buttons and trailers only appear once you replace them with a real
 *     URL, so the site never claims an app is on a store before it is.
 * ============================================================================
 */

export type GameStatus = "available" | "in-development" | "concept";
export type Platform = "iOS" | "Android" | "Web";

export interface GameFeature {
  /** Icon name — one of: flag, brush, trophy, swords, shield, zap, map, users, music, sparkles, camera, wrench, search, tag */
  icon:
    | "flag"
    | "brush"
    | "trophy"
    | "swords"
    | "shield"
    | "zap"
    | "map"
    | "users"
    | "music"
    | "sparkles"
    | "camera"
    | "wrench"
    | "search"
    | "tag";
  title: string;
  description: string;
}

export interface Game {
  /** Used in the URL: /games/{slug} */
  slug: string;
  title: string;
  /** One-line hook shown on cards. */
  tagline: string;
  /** Full description shown on the detail page. */
  description: string;
  genre: string;
  status: GameStatus;
  /** Label shown on the status badge, e.g. "Available now". */
  statusLabel: string;
  platforms: Platform[];
  /** Show this app in the homepage Featured grid. */
  featured: boolean;
  /** Release date (ISO), or a target such as "2026". */
  releaseDate: string;
  /** Main artwork. */
  coverImage: string;
  /**
   * "contain" centres a square app icon on the card (use when you only have an
   * icon). "cover" fills the frame — use it once you have landscape key art.
   */
  coverFit?: "cover" | "contain";
  /** Screenshots — add as many as you like. */
  screenshots: string[];
  /** Phone screenshots are "portrait"; wide key art is "landscape". */
  screenshotAspect?: "portrait" | "landscape";
  features: GameFeature[];
  /** Shown on the detail page when set, e.g. "$5.99" or "Free". */
  price?: string;
  /**
   * Your App Store numeric id. When set, the site matches this entry to your
   * live app and keeps price, version, screenshots and the store link in sync
   * automatically — including flipping it from "In development" to "Available
   * now" the moment Apple publishes it.
   */
  appStoreId?: number;
  /** 👇 REPLACE these with your real links. */
  appStoreUrl: string;
  googlePlayUrl: string;
  websiteUrl: string;
  trailerUrl: string;
}

export const GAMES: Game[] = [
  {
    slug: "everything-diy",
    title: "Everything DIY",
    tagline: "Every DIY project, explained step by step — with the tools, the price, and where to get it.",
    description:
      "An app that helps the everyday person take on any DIY project they can think of. Everything DIY searches all the relevant information and gives you step-by-step instructions and videos. You can also use the camera to help identify tools and materials, and it will tell you where to get them along with an approximate price.",
    genre: "DIY & Utilities",
    status: "available",
    statusLabel: "Available now",
    platforms: ["iOS"],
    featured: true,
    releaseDate: "2026-09-10",
    coverImage: "/apps/everything-diy-icon.png",
    coverFit: "contain",
    screenshots: [
      "/apps/everything-diy-1.png",
      "/apps/everything-diy-2.png",
      "/apps/everything-diy-3.png",
    ],
    screenshotAspect: "portrait",
    features: [
      {
        icon: "wrench",
        title: "Step-by-step instructions",
        description: "Clear, ordered instructions for the project you're actually trying to do — plus video walkthroughs.",
      },
      {
        icon: "camera",
        title: "Identify tools with your camera",
        description: "Point your camera at a tool or part and the app helps work out what it is and what it's for.",
      },
      {
        icon: "tag",
        title: "Where to buy & price estimates",
        description: "Find out where to get what you need and roughly what the job is going to cost before you start.",
      },
    ],
    price: "$5.99",
    appStoreId: 6803175688,
    appStoreUrl: "https://apps.apple.com/us/app/everything-diy/id6803175688",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "run-dummy",
    title: "Run Dummy",
    tagline: "An addictive magnet maze — push and pull the ball to the goal before time runs out.",
    description:
      "A fun, addictive maze game that uses magnets to push and pull the ball toward the end goal before the timer runs out. Simple to pick up, rated for everyone, and built around quick runs you can squeeze in anywhere.",
    genre: "Maze Puzzle",
    status: "in-development",
    statusLabel: "In development",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "2026",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/74b7731b-abaa-4f03-a756-155d3d402b85.png",
    coverFit: "cover",
    screenshots: [],
    features: [
      {
        icon: "zap",
        title: "Magnet controls",
        description: "Push and pull the ball with magnetic force instead of steering it directly.",
      },
      {
        icon: "flag",
        title: "Beat the timer",
        description: "Every maze is a race — reach the goal before the clock hits zero.",
      },
    ],
    appStoreId: 6805272943,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "realmforge",
    title: "Realmforge",
    tagline: "A new project in the works at the studio.",
    /** 👇 REPLACE this with a real description when you're ready to announce it. */
    description:
      "Realmforge is currently in development. We'll share more about what it is — screenshots, features and a release window — once it's further along.",
    genre: "In development",
    status: "in-development",
    statusLabel: "In development",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/d85b2861-d9ac-44a3-9d32-84c05fcd9e82.png",
    coverFit: "cover",
    screenshots: [],
    features: [],
    appStoreId: 6809219557,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "arcade-project",
    /**
     * App Store Connect calls this one "Astronix" — the site keeps the neutral
     * "Arcade Project" title until you're ready to announce the name. Change
     * `title` (and `slug`) to announce it.
     */
    title: "Arcade Project",
    tagline: "A fast, polished arcade game in the works at the studio.",
    description:
      "An arcade title currently in development at DJ Games — built around quick, replayable runs and instant pick-up-and-play controls. We'll share the name, screenshots and a release window once it's further along.",
    genre: "Arcade",
    status: "in-development",
    statusLabel: "In development",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/e4bced3c-4351-4ecc-aeba-0502940af0d1.png",
    coverFit: "cover",
    screenshots: [],
    features: [],
    appStoreId: 6811472188,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
];

/**
 * Pages read the LIVE library via `useGameLibrary()` in `library.ts`, which
 * merges these entries with what Apple is publishing right now. These helpers
 * remain for any non-live use.
 */
export const releasedGames = (): Game[] => GAMES.filter((game) => game.status === "available");

export const upcomingGames = (): Game[] => GAMES.filter((game) => game.status !== "available");

export const gameBySlug = (slug: string | undefined): Game | undefined =>
  GAMES.find((game) => game.slug === slug);
