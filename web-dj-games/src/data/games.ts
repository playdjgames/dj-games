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

import type { DivisionId } from "@/data/divisions";

export type GameStatus = "available" | "submitted" | "concept";
export type GameCategory = "utilities" | "maze" | "arcade" | "productivity" | "concept";
export type Platform = "iOS" | "Android" | "Web";

export interface GameFaq {
  question: string;
  answer: string;
}

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
  /** Render the tagline on the detail hero as a big white statement instead of the small accent line. */
  taglineStatement?: boolean;
  /** Full description shown on the detail page. First paragraph must say what the product IS, in plain language. */
  description: string;
  genre: string;
  status: GameStatus;
  /** Label shown on the status badge, e.g. "Available now". */
  statusLabel: string;
  /** Coarse bucket used by the /games filter chips. */
  category: GameCategory;
  /**
   * Which side of the studio this belongs to — apps, mobile games, PC games or
   * web work. This is the primary separation across the whole site.
   */
  division: DivisionId;
  /** Per-game accent (hex) — keeps cards from all looking identical. */
  accent: string;
  platforms: Platform[];
  /** Show this app in the homepage Featured grid. */
  featured: boolean;
  /** Release date (ISO), or a target such as "2026". */
  releaseDate: string;
  /** Unique search-engine title for this game's page. */
  seoTitle: string;
  /** Unique search-engine description for this game's page. */
  seoDescription: string;
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
  /** Shown on the detail page when set, e.g. "FREE". */
  price?: string;
  /** Apple age rating, e.g. "12+". */
  ageRating?: string;
  /** One-line example jobs (Everything DIY hero + detail page). */
  jobs?: string[];
  /** FAQ shown on the detail page when set. */
  faq?: GameFaq[];
  /**
   * Your App Store numeric id. When set, the site matches this entry to your
   * live app and keeps price, version, screenshots and the store link in sync
   * automatically — including flipping it from "Submitted" to "Available now"
   * the moment Apple publishes it.
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
    division: "apps",
    title: "Everything DIY",
    tagline: "Every DIY project, explained step by step — tools, where to get them, and a camera that helps identify what you're looking at.",
    description:
      "Everything DIY is a free iOS app from DJ Games. Get step-by-step instructions for everyday projects, see the tools you need and where to get them, and use the camera to help identify tools and materials.",
    genre: "DIY & Utilities",
    status: "available",
    statusLabel: "Available now",
    category: "utilities",
    accent: "#8BE1FF",
    platforms: ["iOS"],
    featured: true,
    releaseDate: "2026-09-10",
    seoTitle: "Everything DIY — Step-by-Step DIY Projects for iPhone | DJ Games",
    seoDescription:
      "Everything DIY for iPhone: step-by-step project guides, camera tool identification, where to get tools and materials. Free on the App Store.",
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
    jobs: ["Replace a faucet.", "Mount a TV.", "Identify this tool."],
    faq: [
      {
        question: "Does it work offline?",
        answer:
          "Everything DIY looks up project guides, videos and price info for you, so you'll get the best experience with an internet connection.",
      },
      {
        question: "Is there a subscription?",
        answer:
          "No. Everything DIY is free. No subscription, no ads.",
      },
      {
        question: "What's included?",
        answer:
          "Step-by-step project guides with video walkthroughs, camera-based tool and material identification, price estimates, and where-to-buy info for everything a job needs.",
      },
    ],
    price: "FREE",
    appStoreId: 6803175688,
    appStoreUrl: "https://apps.apple.com/us/app/everything-diy/id6803175688",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "run-dummy",
    division: "mobile-games",
    title: "Run Dummy",
    tagline: "Run. Remember. Escape.",
    description:
      "Run Dummy is a 3D maze runner for iPhone starring a crash-test dummy on the loose in a neon laboratory. Steer with simple tank controls, memorize the corridors, and reach the reward well before the clock runs out.\n\nEvery trial hides hazards between you and the exit: spinning blades, floor spikes, dart launchers, crumbling tiles, moving walls, teleporters and pressure switches. Chain clean wall streaks to unlock new runners, stock power-ups before a run, and chase up to 3 stars per trial for speed and flawless runs.\n\nOnly the traps can stop you. How far can you run?",
    genre: "Maze Runner",
    status: "submitted",
    statusLabel: "Submitted to Apple",
    category: "maze",
    accent: "#FFB020",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "2026",
    ageRating: "12+",
    seoTitle: "Run Dummy — 3D Maze Runner for iPhone | DJ Games",
    seoDescription:
      "Run Dummy is a 3D maze runner for iPhone: 35 trials across 5 chapters, booby-trapped labs, star ratings and crew unlocks. Submitted to Apple — coming soon.",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/74b7731b-abaa-4f03-a756-155d3d402b85.png",
    coverFit: "cover",
    screenshots: [],
    features: [
      {
        icon: "zap",
        title: "The lab is booby-trapped",
        description: "Blades, spikes, dart launchers, crumbling floors, moving walls, teleporters and pressure switches — the walls can't hurt you, the traps will.",
      },
      {
        icon: "map",
        title: "35 trials across 5 chapters",
        description: "From gentle warm-up lattices to the deep lab, each trial rated on speed and flawless runs — up to 3 stars apiece.",
      },
      {
        icon: "users",
        title: "Unlock the crew",
        description: "Chain wall streaks — clean runs without kissing the walls — to unlock new runners, each with its own look.",
      },
    ],
    appStoreId: 6805272943,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "vexara",
    division: "mobile-games",
    title: "Vexara",
    tagline: "Neon fire, endless waves, one thumb.",
    description:
      "Vexara is a pick-up-and-play neon arcade space shooter for iPhone. Pilot a lone starfighter against descending alien formations that never stop escalating — relative drag steering keeps your thumb off the ship, auto-fire is on by default, and a tap unleashes a screen-clearing blast charge when the swarm closes in.\n\nAliens lock into tight formations, then peel off into seven distinct dive attacks. Every fifth wave puts a multi-phase boss in your path with glowing weak-point cores, and every fourth wave is a no-shooting challenge route worth a massive score bonus. Stack consecutive kills for a combo multiplier up to x10, add perfect-wave bonuses, and fight your way out of the Void Siphon — destroy the warden's tractor beam and your fighter returns with two escort wing-mates.\n\nFree. No ads, no in-app purchases, no account — everything runs offline and on-device.",
    genre: "Arcade Shooter",
    status: "submitted",
    statusLabel: "Submitted to Apple",
    category: "arcade",
    accent: "#4DE1FF",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "2026",
    ageRating: "9+",
    seoTitle: "Vexara — Neon Arcade Space Shooter for iPhone | DJ Games",
    seoDescription:
      "Vexara is a one-thumb neon arcade space shooter for iPhone. Free — no ads, no in-app purchases, no account. Submitted to Apple — coming soon.",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/b24909ff-52af-406e-abd7-432a8e7c69a3.png",
    coverFit: "cover",
    screenshots: [],
    features: [
      {
        icon: "zap",
        title: "One thumb. That's the controls.",
        description: "Drag anywhere to steer, auto-fire is on by default, and a tap clears the screen when the swarm closes in.",
      },
      {
        icon: "swords",
        title: "Boss fights every fifth wave",
        description: "Three unique multi-phase bosses guard the deep sectors, each with weak-point cores that take triple damage.",
      },
      {
        icon: "sparkles",
        title: "The Void Siphon",
        description: "Get snared by a warden's tractor beam, destroy it, and your fighter returns as two escort wing-mates with extra guns.",
      },
    ],
    appStoreId: 6812449073,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "astronix",
    division: "mobile-games",
    /** App Store Connect record confirmed as "Astronix" — title matches the store. */
    title: "Astronix",
    tagline: "One thumb. Endless waves. Everything earned by play.",
    description:
      "Astronix is a one-thumb space shooter for iPhone built for real play sessions — drag to fly, flick to dodge, and let optional auto-fire keep your bolts flowing while you focus on survival. Every wave hits harder, every fifth wave puts a boss in your path.\n\nCredits are earned purely through play. Bank them in the hangar to unlock six starfighter hulls with genuinely different stats, catch seven power-ups with live on-screen timers, and chain combos for skill-based scoring. One fixed-length Daily Global Challenge — identical for every player worldwide, resetting at 00:00 UTC — puts you on the Game Center leaderboards.\n\nFree. No ads, no in-app purchases, no energy meters — every hull and paint scheme is earned by flying.",
    genre: "Arcade Shooter",
    status: "submitted",
    statusLabel: "Submitted to Apple",
    category: "arcade",
    accent: "#FFC93C",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "2026",
    ageRating: "4+",
    seoTitle: "Astronix — One-Thumb Space Shooter for iPhone | DJ Games",
    seoDescription:
      "Astronix is a one-thumb endless-wave space shooter for iPhone: hangar unlocks earned by play and a daily global challenge. Submitted to Apple — coming soon.",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/52916db6-85d5-4918-8f4b-4f0d7d4cbe9d.png",
    coverFit: "cover",
    screenshots: [],
    features: [
      {
        icon: "wrench",
        title: "The hangar loop",
        description: "Credits earned purely through play unlock six starfighter hulls with genuinely different stats — faster fire, twin volleys, shields and more.",
      },
      {
        icon: "sparkles",
        title: "Seven power-ups, live timers",
        description: "Rapid fire, triple shot, shield, laser, invincibility, multiplier and extra life — each with an on-screen countdown.",
      },
      {
        icon: "trophy",
        title: "Daily global challenge",
        description: "One fixed wave set, identical for every player worldwide, resetting at 00:00 UTC — climb the Game Center leaderboards.",
      },
    ],
    appStoreId: 6811472188,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "thinksort",
    division: "apps",
    title: "Thinksort",
    tagline: "Get a little structure in your day of chaos.",
    taglineStatement: true,
    // Apple's store copy opens with an older line; the site shows the hook above.
    description:
      "Thinksort is an offline productivity app for iPhone that gives your daily chaos one place to land. Speak or type one long, messy ramble and it sorts it into dated tasks, prep items, shopping and ideas — showing a confirm screen before anything is saved.\n\nThe organizer is rule-based and runs entirely on your device: it never invents dates, times or places. The Today screen shows a single NEXT UP card with a plain-language reason why it's next, One Thing Mode hides everything else when a list feels like too much, and 'I am Stuck' hands back one tiny first step when a task has you frozen.\n\nA built-in focus timer, store-grouped shopping lists, Siri and Shortcuts capture — and no account, no cloud, no analytics, no ads, no subscriptions. Everything stays on your device.",
    genre: "Productivity",
    status: "submitted",
    statusLabel: "Submitted to Apple",
    category: "productivity",
    accent: "#9D7BFF",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "2026",
    seoTitle: "ThinkSort — Offline Productivity, One Next Step | DJ Games",
    seoDescription:
      "ThinkSort is an offline productivity app for iPhone: brain-dump sorting, one clear next step, no account and no cloud. Submitted to Apple — coming soon.",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/a654c904-58c9-4da5-8c3d-14e94603fa80.png",
    coverFit: "cover",
    screenshots: [],
    features: [
      {
        icon: "zap",
        title: "Brain dump, not data entry",
        description: "Speak or type one messy ramble — Thinksort sorts it into tasks, prep items, shopping and ideas before you confirm anything.",
      },
      {
        icon: "flag",
        title: "One next thing",
        description: "A single NEXT UP card with a plain-language reason why it's next — plus One Thing Mode for overwhelming days and 'I am Stuck' first steps.",
      },
      {
        icon: "shield",
        title: "It never guesses",
        description: "Rule-based and fully on-device: ambiguous thoughts become short clarifications, and nothing ever leaves your phone.",
      },
    ],
    appStoreId: 6812587639,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "valiant-kingdoms",
    division: "mobile-games",
    title: "Valiant Kingdoms",
    tagline: "Banners on the ridge. A crown that won't hold itself.",
    /** 👇 Teaser copy — REPLACE with the real store description once it's written in App Store Connect. */
    description:
      "Valiant Kingdoms is an upcoming iOS game from DJ Games, in development now.\n\nA realm of walled cities and mountain passes, of torch-lit harbors and long cold nights under the aurora. Somewhere down there a kingdom is waiting to be held — or taken.\n\nWe're not ready to talk about how it plays just yet. Screenshots, features and a release window will show up here first, and newsletter subscribers hear the horn before anyone else.",
    genre: "Early concept",
    status: "concept",
    statusLabel: "In development",
    category: "concept",
    accent: "#FF5C5C",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
    seoTitle: "Valiant Kingdoms — Upcoming iOS Game | DJ Games",
    seoDescription:
      "Valiant Kingdoms is an upcoming iOS game from DJ Games — banners on the ridge, a crown that won't hold itself. In development; follow along for the first look.",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/b4bff000-bed3-4737-93b7-9a8a2c2e9ece.png",
    coverFit: "cover",
    screenshots: [],
    features: [],
    appStoreId: 6813098751,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "neon-world",
    division: "mobile-games",
    title: "Neon World",
    tagline: "An unmapped planet, glowing in the dark.",
    /** 👇 Teaser copy — REPLACE with the real store description once it's written in App Store Connect. */
    description:
      "Neon World is an upcoming iOS game from DJ Games, in development now.\n\nBioluminescent forests wired with green light, rivers running molten under a ringed giant, and one explorer a very long way from home.\n\nWhat happens out there stays under wraps for now. Screenshots, features and a release window will show up here first — the newsletter gets them early.",
    genre: "Early concept",
    status: "concept",
    statusLabel: "In development",
    category: "concept",
    accent: "#64FFC8",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
    seoTitle: "Neon World — Upcoming iOS Game | DJ Games",
    seoDescription:
      "Neon World is an upcoming iOS game from DJ Games — an unmapped planet, glowing in the dark. In development; follow along for the first look.",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/21887f67-a8b2-46ed-930f-264d1a8f005f.png",
    coverFit: "cover",
    screenshots: [],
    features: [],
    appStoreId: 6813953306,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "neon-city-underground",
    division: "mobile-games",
    title: "Neon City: Underground",
    tagline: "Rain, neon, and whatever runs beneath the city.",
    /** 👇 Teaser copy — REPLACE with the real store description once it's written in App Store Connect. */
    description:
      "Neon City: Underground is an upcoming iOS game from DJ Games, in development now.\n\nWet asphalt under the overpass. An all-night arcade throwing pink and green across the puddles. Somebody walking somewhere they probably shouldn't, with the skyline burning cold behind them.\n\nThe rest stays in the dark a while longer. Screenshots, features and a release window will show up here first — the newsletter gets them early.",
    genre: "Early concept",
    status: "concept",
    statusLabel: "In development",
    category: "concept",
    accent: "#FF6AD5",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
    seoTitle: "Neon City: Underground — Upcoming iOS Game | DJ Games",
    seoDescription:
      "Neon City: Underground is an upcoming iOS game from DJ Games — rain, neon, and whatever runs beneath the city. In development; follow along for the first look.",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/3487ac9d-c50b-475e-b7db-cbcfb390b04b.png",
    coverFit: "cover",
    screenshots: [],
    features: [],
    appStoreId: 6813958854,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "blood-war",
    division: "pc-games",
    title: "Blood War",
    tagline: "Two sides. One field. No truce.",
    /** 👇 Teaser copy — REPLACE with the real store description once it's written in App Store Connect. */
    description:
      "Blood War is an upcoming iOS game from DJ Games, in development now.\n\nTwo war banners on two ridges, and a field between them that nobody means to share. It's early — too early to show how it plays — but the first battles are already being fought in prototypes.\n\nScreenshots, features and a release window will show up here first — the newsletter gets them before anyone else.",
    genre: "Early concept",
    status: "concept",
    statusLabel: "In development",
    category: "concept",
    accent: "#E23B3B",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
    seoTitle: "Blood War — Upcoming iOS Game | DJ Games",
    seoDescription:
      "Blood War is an upcoming iOS game from DJ Games — two sides, one field, no truce. In development; follow along for the first look.",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/44b0f9e7-68d1-463f-a813-9ef69fadd98e.png",
    coverFit: "cover",
    screenshots: [],
    features: [],
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
