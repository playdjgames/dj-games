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
  /** Icon name — one of: flag, brush, trophy, swords, shield, zap, map, users, music, sparkles, camera, wrench, search, tag, ruler */
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
    | "tag"
    | "ruler";
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
    tagline: "Every DIY project, explained step by step — and now your camera is a tape measure.",
    description:
      "Everything DIY is a free iOS app from DJ Games. Get step-by-step instructions for everyday projects, see the tools you need and where to get them, and use the camera to identify tools and materials.\n\nNew in 2.1.4: measure with your camera. Point the phone at a shelf, a doorway, a board or an opening, tap two points, and get a length you can save straight to the project you're working on. Standing in front of the job? Use live measure. Already have a photo? Set the scale on the picture and measure it after the fact — useful for the wall you're not standing next to anymore.\n\nNo more hunting for a tape measure that's somewhere in the garage, and no more writing numbers on the back of a receipt. Measurements live with the project, next to the steps and the shopping list. Numbers are approximate, so confirm critical cuts with a real tape.",
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
      "Everything DIY for iPhone: measure with your camera, step-by-step project guides, camera tool identification, and where to get tools and materials. Free on the App Store.",
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
        icon: "ruler",
        title: "Measure with your camera",
        description:
          "Tap two points on a shelf, doorway or board and get a length you can save to the project. Live in front of the job, or on a photo you already took.",
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
    jobs: ["Measure a doorway.", "Replace a faucet.", "Mount a TV.", "Identify this tool."],
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
        question: "How accurate is camera measuring?",
        answer:
          "Close enough to plan with — shelf widths, doorways, rough openings, how much board you need. It is not a laser: confirm critical cuts with a real tape before you commit.",
      },
      {
        question: "What's included?",
        answer:
          "Camera measuring (live or on a saved photo), step-by-step project guides with video walkthroughs, camera-based tool and material identification, price estimates, and where-to-buy info for everything a job needs.",
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
    slug: "dj-games-website",
    division: "web",
    title: "The DJ Games Website",
    tagline: "You're looking at it — designed and built in-studio.",
    description:
      "The site you're on right now is a DJ Games production, made the same way as everything else here: from scratch, in-house, no templates.\n\nplaydjgames.com is the studio's home base — every game and app in the library, studio news, player support, and the PRESS HOUSE print-on-demand platform, all in one place. Fast, responsive, and honest: the release statuses on this site come straight from our App Store Connect account, so what you read is what's actually live.\n\nNeed a site like it? We design and build websites too — get in touch.",
    genre: "Website",
    status: "available",
    statusLabel: "Live now",
    category: "utilities",
    accent: "#E8FF47",
    platforms: ["Web"],
    featured: false,
    releaseDate: "2026",
    seoTitle: "The DJ Games Website — playdjgames.com | DJ Games",
    seoDescription:
      "playdjgames.com — the DJ Games studio site, designed and built in-house. Game library, studio news, player support and the PRESS HOUSE platform. We build websites too.",
    coverImage: "/apps/dj-games-website-home.png",
    coverFit: "cover",
    screenshots: [],
    features: [
      {
        icon: "wrench",
        title: "Built from scratch",
        description: "No templates, no site builders — every page, component and line of copy is ours.",
      },
      {
        icon: "zap",
        title: "Fast and responsive",
        description: "Lean and static, quick to load — it reads well on a phone and flies on a desktop.",
      },
      {
        icon: "sparkles",
        title: "Live statuses",
        description: "Release states sync from our App Store Connect account, so the library never claims a launch that hasn't happened.",
      },
    ],
    websiteUrl: "https://playdjgames.com",
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "run-dummy",
    division: "mobile-games",
    title: "Run Dummy",
    tagline: "Run. Remember. Escape.",
    description:
      "Run Dummy is a 3D maze runner for iPhone starring a crash-test dummy on the loose in a neon laboratory. Steer with simple tank controls, memorize the corridors, and reach the reward well before the clock runs out.\n\nEvery trial hides hazards between you and the exit: spinning blades, floor spikes, dart launchers, crumbling tiles, moving walls, teleporters and pressure switches. Chain clean wall streaks to unlock new runners, stock power-ups before a run, and chase up to 3 stars per trial for speed and flawless runs.\n\nEvery runner and every star is earned by playing. Every power-up is included free — no purchases, no subscriptions and no ads anywhere in the game.\n\nOnly the traps can stop you. How far can you run?",
    genre: "Maze Runner",
    status: "available",
    statusLabel: "Available now",
    category: "maze",
    accent: "#FFB020",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "2026",
    ageRating: "12+",
    seoTitle: "Run Dummy — 3D Maze Runner for iPhone | DJ Games",
    seoDescription:
      "Run Dummy is a 3D maze runner for iPhone: 35 trials across 5 chapters, booby-trapped labs, star ratings and crew unlocks. Free — no purchases, no ads. Available now on the App Store.",
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
    price: "FREE",
    appStoreUrl: "https://apps.apple.com/us/app/run-dummy/id6805272943",
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
    status: "available",
    statusLabel: "Available now",
    category: "arcade",
    accent: "#4DE1FF",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "2026",
    ageRating: "9+",
    seoTitle: "Vexara — Neon Arcade Space Shooter for iPhone | DJ Games",
    seoDescription:
      "Vexara is a one-thumb neon arcade space shooter for iPhone. Free — no ads, no in-app purchases, no account. Available now on the App Store.",
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
    appStoreUrl: "https://apps.apple.com/us/app/vexara/id6812449073",
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
    /**
     * Live on the App Store since 2026-09-22 — verified by the public iTunes
     * lookup resolving in the US, CA and GB storefronts, which is the bar for
     * "Available now" on this site (never just READY_FOR_SALE in ASC).
     */
    status: "available",
    statusLabel: "Available now",
    category: "arcade",
    accent: "#FFC93C",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "2026",
    ageRating: "4+",
    seoTitle: "Astronix — One-Thumb Space Shooter for iPhone | DJ Games",
    seoDescription:
      "Astronix is a one-thumb endless-wave space shooter for iPhone: hangar unlocks earned by play and a daily global challenge. Free — no ads, no in-app purchases. Available now on the App Store.",
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
    appStoreUrl: "https://apps.apple.com/us/app/astronix/id6811472188",
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
      "Thinksort is an offline productivity app for iPhone that gives your daily chaos one place to land. Speak or type one long, messy ramble and it sorts it into dated tasks, prep items, shopping and ideas — showing a confirm screen before anything is saved.\n\nThe organizer is rule-based and runs entirely on your device: it never invents dates, times or places. The Today screen shows a single NEXT UP card with a plain-language reason why it's next, One Thing Mode hides everything else when a list feels like too much, and 'I am Stuck' hands back one tiny first step when a task has you frozen.\n\nA built-in focus timer, store-grouped shopping lists, Siri and Shortcuts capture — and no account, no cloud, no analytics, no ads. Everything stays on your device.\n\nFree for the first 7 days, then one purchase unlocks it for good. No subscription, no monthly fee.",
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
      "ThinkSort is an offline productivity app for iPhone: brain-dump sorting, one clear next step, no account and no cloud. Free for 7 days, then a one-time purchase — no subscription. Submitted to Apple.",
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
      {
        icon: "tag",
        title: "Buy it once",
        description: "Free for 7 days with nothing locked off, then a single purchase keeps it forever — no subscription and no monthly fee.",
      },
    ],
    appStoreId: 6812587639,
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
    slug: "blood-war",
    division: "mobile-games",
    title: "Blood War",
    tagline: "It's the cost of the crown — you want gold — first you bleed.",
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
    seoTitle: "Blood War: The End of You — Upcoming iOS Game | DJ Games",
    seoDescription:
      "Blood War is an upcoming iOS game from DJ Games — it's the cost of the crown: you want gold — first you bleed. In development; follow along for the first look.",
    coverImage: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/44b0f9e7-68d1-463f-a813-9ef69fadd98e.png",
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
    slug: "order-in-the-court",
    division: "mobile-games",
    title: "Order in the Court",
    tagline: "First look coming soon.",
    description:
      "Order in the Court is an upcoming iOS game from DJ Games, in development now.\n\nThe first look — what it is, how it plays — lands here and in the newsletter before anywhere else.",
    genre: "Early concept",
    status: "concept",
    statusLabel: "In development",
    category: "concept",
    accent: "#FFB020",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
    seoTitle: "Order in the Court — Upcoming iOS Game | DJ Games",
    seoDescription:
      "Order in the Court is an upcoming iOS game from DJ Games — in development now. Follow along for the first look.",
    coverImage: "https://2s7937nfb5j5e0l2chd6r.rork.app/~assets/img/789f71a1-93bb-4816-8cd4-ea178877210c.png",
    coverFit: "cover",
    screenshots: [],
    features: [],
    appStoreId: 6814688740,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "city-limits",
    division: "mobile-games",
    title: "City Limits",
    tagline: "First look coming soon.",
    description:
      "City Limits is an upcoming iOS game from DJ Games, in development now.\n\nThe first look — what it is, how it plays — lands here and in the newsletter before anywhere else.",
    genre: "Early concept",
    status: "concept",
    statusLabel: "In development",
    category: "concept",
    accent: "#8BE1FF",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
    seoTitle: "City Limits — Upcoming iOS Game | DJ Games",
    seoDescription:
      "City Limits is an upcoming iOS game from DJ Games — in development now. Follow along for the first look.",
    coverImage: "https://2s7937nfb5j5e0l2chd6r.rork.app/~assets/img/45022b34-70c1-4755-a8af-903433430bbe.png",
    coverFit: "cover",
    screenshots: [],
    features: [],
    appStoreId: 6814600752,
    appStoreUrl: "[APP_STORE_URL]",
    googlePlayUrl: "[GOOGLE_PLAY_URL]",
    websiteUrl: "[GAME_WEBSITE_URL]",
    trailerUrl: "[TRAILER_URL]",
  },
  {
    slug: "dj-this",
    division: "apps",
    title: "DJ This",
    tagline: "Imagine it, make it.",
    description:
      "DJ This is an upcoming iOS app from DJ Games, in development now.\n\nImagine it, make it. The first look lands here and in the newsletter before anywhere else.",
    genre: "Early concept",
    status: "concept",
    statusLabel: "In development",
    category: "concept",
    accent: "#64FFC8",
    platforms: ["iOS"],
    featured: false,
    releaseDate: "TBA",
    seoTitle: "DJ This — Upcoming iOS App | DJ Games",
    seoDescription:
      "DJ This is an upcoming iOS app from DJ Games — imagine it, make it. In development now; follow along for the first look.",
    coverImage: "https://2s7937nfb5j5e0l2chd6r.rork.app/~assets/img/2d23284c-0a68-41af-81ce-7ac0bd9c25f7.png",
    coverFit: "cover",
    screenshots: [],
    features: [],
    appStoreId: 6814184644,
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
