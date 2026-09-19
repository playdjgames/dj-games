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
    tagline: "Run. Remember. Escape. A 3D maze runner starring a crash-test dummy loose in a neon laboratory.",
    description:
      "Run Dummy is a 3D maze runner starring a crash-test dummy on the loose in a neon laboratory. Steer with simple tank controls, memorize the corridors, and reach the reward well before the clock runs out.\n\nEvery trial hides hazards between you and the exit: spinning blades, floor spikes, dart launchers, crumbling tiles, moving walls, teleporters and pressure switches. Chain clean wall streaks to unlock new runners, stock power-ups before a run, and chase up to 3 stars per trial for speed and flawless runs.\n\nOnly the traps can stop you. How far can you run?",
    genre: "Maze Runner",
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
    title: "Vexara",
    tagline: "Neon fire, endless waves, one thumb — a pick-up-and-play arcade space shooter.",
    description:
      "Vexara is a pick-up-and-play arcade space shooter built for the reflexes of coin-op veterans and the pace of a mobile commute. Pilot a lone starfighter against descending alien formations that never stop escalating — relative drag steering keeps your thumb off the ship, auto-fire is on by default, and a tap unleashes a screen-clearing blast charge when the swarm closes in.\n\nAliens lock into tight formations, then peel off into seven distinct dive attacks. Every fifth wave puts a multi-phase boss in your path with glowing weak-point cores, and every fourth wave is a no-shooting challenge route worth a massive score bonus. Stack consecutive kills for a combo multiplier up to x10, add perfect-wave bonuses, and fight your way out of the Void Siphon — destroy the warden's tractor beam and your fighter returns with two escort wing-mates.\n\nFree. No ads, no in-app purchases, no account — everything runs offline and on-device.",
    genre: "Arcade Shooter",
    status: "in-development",
    statusLabel: "In development",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "2026",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/b24909ff-52af-406e-abd7-432a8e7c69a3.png",
    coverFit: "cover",
    screenshots: [],
    features: [
      {
        icon: "zap",
        title: "Six enemy types, seven dive patterns",
        description: "Aliens lock into tight formations, then peel off into distinct dive attacks — learn the routes and thread the neon.",
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
    /** App Store Connect record confirmed as "Astronix" — title matches the store. */
    title: "Astronix",
    tagline: "One thumb. Endless neon. Unlockable hulls, live power-ups and a daily global challenge.",
    description:
      "Astronix is a portrait-first arcade space shooter built for real play sessions — drag to fly, flick to dodge, and let optional auto-fire keep your bolts flowing while you focus on survival. Every wave hits harder, every fifth wave puts a boss in your path.\n\nCredits are earned purely through play. Bank them in the hangar to unlock six starfighter hulls with genuinely different stats, catch seven power-ups with live on-screen timers, and chain combos for skill-based scoring. One fixed-length Daily Global Challenge — identical for every player worldwide, resetting at 00:00 UTC — puts you on the Game Center leaderboards.\n\nFree. No ads, no in-app purchases, no energy meters — every hull and paint scheme is earned by flying.",
    genre: "Arcade Shooter",
    status: "in-development",
    statusLabel: "In development",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "2026",
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
    title: "Thinksort",
    tagline: "Dump the daily chaos and get one clear answer: what do I do right now?",
    description:
      "Thinksort gives your daily chaos one place to land. Speak or type one long, messy ramble and it sorts it into dated tasks, prep items, shopping and ideas — showing a confirm screen before anything is saved.\n\nThe organizer is rule-based and runs entirely on your device: it never invents dates, times or places. The Today screen shows a single NEXT UP card with a plain-language reason why it's next, One Thing Mode hides everything else when a list feels like too much, and 'I am Stuck' hands back one tiny first step when a task has you frozen.\n\nA built-in focus timer, store-grouped shopping lists, Siri and Shortcuts capture — and no account, no cloud, no analytics, no ads, no subscriptions. Everything stays on your device.",
    genre: "Productivity",
    status: "in-development",
    statusLabel: "In development",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "2026",
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
    title: "Valiant Kingdoms",
    tagline: "A new strategy project in the works at the studio.",
    /** 👇 REPLACE this with the real store copy when it's written in App Store Connect. */
    description:
      "Valiant Kingdoms is currently in development. We'll share more about what it is — screenshots, features and a release window — once it's further along.",
    genre: "In development",
    status: "in-development",
    statusLabel: "In development",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
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
    title: "Neon World",
    tagline: "A brand-new project in the works at the studio.",
    /** 👇 REPLACE this with the real store copy when it's written in App Store Connect. */
    description:
      "Neon World is currently in development. We'll share more about what it is — screenshots, features and a release window — once it's further along.",
    genre: "In development",
    status: "in-development",
    statusLabel: "In development",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
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
    title: "Neon City: Underground",
    tagline: "A brand-new project in the works at the studio.",
    /** 👇 REPLACE this with the real store copy when it's written in App Store Connect. */
    description:
      "Neon City: Underground is currently in development. We'll share more about what it is — screenshots, features and a release window — once it's further along.",
    genre: "In development",
    status: "in-development",
    statusLabel: "In development",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
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
