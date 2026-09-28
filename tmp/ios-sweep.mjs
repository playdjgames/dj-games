import fs from "node:fs";

const R = "/home/user/rork-app/web-dj-games";

// file -> [ [from, to], ... ]  Each "from" must match exactly once (or all:true).
const edits = {
  "index.html": [
    ["DJ Games — Original iOS Games and Apps", "DJ Games — Original Mobile Games and Apps", true],
    [
      "DJ Games is an independent iOS studio. Everything DIY, Run Dummy, Vexara and Astronix are live on the App Store — free for iPhone. More on the way.",
      "DJ Games is an independent studio. Everything DIY, Run Dummy, Vexara and Astronix are live now — free on mobile. More on the way.",
      true,
    ],
  ],
  "src/data/site.ts": [
    ["Original iOS games and apps — and the websites too.", "Original mobile games and apps — and the websites too."],
    [
      "are out now on the App Store — more on the way, and we design and build websites too.",
      "are out now on mobile — more on the way, and we design and build websites too.",
    ],
  ],
  "src/pages/Home.tsx": [
    ['"DJ Games — Original iOS Games, Apps and Websites"', '"DJ Games — Original Mobile Games, Apps and Websites"'],
    ["Original iOS games and apps. Built to play.", "Original mobile games and apps. Built to play."],
    ['note="Out now · iPhone"', 'note="Out now · Mobile"'],
    ['{live.price ?? "Free"} · iPhone', '{live.price ?? "Free"} · Mobile'],
    ['title="Submitted to Apple"', 'title="Launching next"'],
    ['note="In review — launching on the App Store next"', 'note="In review — launching on mobile next"'],
  ],
  "src/components/Footer.tsx": [["Original iOS games", "Original mobile games"]],
  "src/components/StatusBadge.tsx": [
    ['submitted: "Submitted to Apple",', 'submitted: "In review",'],
    ["TIER badge: LIVE NOW / SUBMITTED TO APPLE / IN DEVELOPMENT.", "TIER badge: LIVE NOW / IN REVIEW / IN DEVELOPMENT."],
  ],
  "src/components/LiveSyncNote.tsx": [
    ['isSyncing ? "Checking the App Store…" : "Synced live from the App Store"', 'isSyncing ? "Checking the store…" : "Synced live from the store"'],
    ["Pre-release details from App Store Connect", "Pre-release details from our developer console"],
  ],
  "src/data/games.ts": [
    ['export type Platform = "iOS" | "Android" | "Web";', 'export type Platform = "Mobile" | "Android" | "Web";'],
    ['platforms: ["iOS"]', 'platforms: ["Mobile"]', true],
    ["Everything DIY is a free iOS app from DJ Games.", "Everything DIY is a free mobile app from DJ Games."],
    ["Step-by-Step DIY Projects for iPhone | DJ Games", "Step-by-Step DIY Projects for Mobile | DJ Games"],
    ["Everything DIY for iPhone: measure with your camera", "Everything DIY for mobile: measure with your camera"],
    ["and where to get tools and materials. Free on the App Store.", "and where to get tools and materials. Free on mobile."],
    ["come straight from our App Store Connect account", "come straight from our developer console"],
    ["Release states sync from our App Store Connect account", "Release states sync from our developer console"],
    ["3D maze runner for iPhone starring", "3D maze runner for mobile starring"],
    ["3D Maze Runner for iPhone | DJ Games", "3D Maze Runner for Mobile | DJ Games"],
    ["3D maze runner for iPhone: 35 trials", "3D maze runner for mobile: 35 trials"],
    ["crew unlocks. Free — no purchases, no ads. Available now on the App Store.", "crew unlocks. Free — no purchases, no ads. Available now on mobile."],
    ["neon arcade space shooter for iPhone. Pilot", "neon arcade space shooter for mobile. Pilot"],
    ["Neon Arcade Space Shooter for iPhone | DJ Games", "Neon Arcade Space Shooter for Mobile | DJ Games"],
    ["arcade space shooter for iPhone. Free — no ads", "arcade space shooter for mobile. Free — no ads"],
    ["no account. Available now on the App Store.", "no account. Available now on mobile."],
    ["space shooter for iPhone built for real play sessions", "space shooter for mobile built for real play sessions"],
    ["One-Thumb Space Shooter for iPhone | DJ Games", "One-Thumb Space Shooter for Mobile | DJ Games"],
    ["endless-wave space shooter for iPhone: hangar", "endless-wave space shooter for mobile: hangar"],
    ["no in-app purchases. Available now on the App Store.", "no in-app purchases. Available now on mobile."],
    ["productivity app for iPhone that gives", "productivity app for mobile that gives"],
    ['statusLabel: "Submitted to Apple",', 'statusLabel: "In review",'],
    ["productivity app for iPhone: brain-dump sorting", "productivity app for mobile: brain-dump sorting"],
    ["Free for 7 days, then a one-time purchase — no subscription. In review with Apple.", "Free for 7 days, then a one-time purchase — no subscription. In review."],
    ["upcoming iOS game from DJ Games", "upcoming game from DJ Games", true],
    ["upcoming iOS app from DJ Games", "upcoming app from DJ Games", true],
    ["Upcoming iOS Game | DJ Games", "Upcoming Game | DJ Games", true],
    ["Upcoming iOS App | DJ Games", "Upcoming App | DJ Games", true],
  ],
  "src/data/library.ts": [
    ['"Available now on the App Store."', '"Available now on mobile."'],
    ['platforms: ["iOS"]', 'platforms: ["Mobile"]'],
    ["— Live on iOS | DJ Games", "— Live Now | DJ Games"],
    ["available now on the App Store for iPhone.", "available now on mobile."],
  ],
  "src/data/news.ts": [
    ["Everything DIY stays free on iPhone. Update from the App Store and the measure tool", "Everything DIY stays free on mobile. Update the app and the measure tool"],
    ["Everything DIY is free on iPhone.", "Everything DIY is free on mobile."],
  ],
  "src/data/newsFeed.ts": [["${price} on iPhone — version", "${price} on mobile — version"]],
  "src/data/divisions.ts": [
    ['note: "iOS tools and productivity"', 'note: "Mobile tools and productivity"'],
    ['note: "iPhone and iPad"', 'note: "In your pocket"'],
  ],
  "src/pages/About.tsx": [
    ["We build iOS games and apps", "We build mobile games and apps"],
    ["Original iOS games and apps — and we design", "Original mobile games and apps — and we design"],
    ["DJ Games is an independent iOS studio run as DJ Games LLC.", "DJ Games is an independent studio run as DJ Games LLC."],
    ["Four titles are live on the App\n                Store today — Everything DIY, Run Dummy, Vexara and Astronix, all free — with Thinksort in Apple\n                review and more in development right now.", "Four titles are live now — Everything DIY, Run Dummy, Vexara and Astronix, all free — with Thinksort in\n                review and more in development right now."],
    ["And it doesn't stop at the App Store: we design and build websites too", "And it doesn't stop at apps: we design and build websites too"],
  ],
  "src/pages/GameDetail.tsx": [
    ["Available now on the App Store for iPhone${game.price", "Available now on mobile${game.price"],
    ["A real build is in review with Apple. Get one email", "A real build is in review. Get one email"],
    ["pulled live from the App Store", "pulled live from the store listing"],
  ],
  "src/pages/News.tsx": [
    ["plus live App Store releases, version updates and review status", "plus live store releases, version updates and review status"],
    ["${autoCount} from the App Store", "${autoCount} from the stores"],
    ["plus every App Store release and update, posted the moment Apple publishes it.", "plus every release and update, posted the moment it goes live."],
    ["Status pulled from App Store Connect — these move on their own", "Status pulled from our developer console — these move on their own"],
  ],
  "src/pages/ComingSoon.tsx": [
    ["titles submitted to Apple and early concepts in development", "titles in review and early concepts in development"],
    ["Submitted to Apple up top — those are next through the door.", "In review up top — those are next through the door."],
    ['eyebrow="Submitted to Apple"', 'eyebrow="In review"'],
    ["${submitted.length === 1 ? \"title\" : \"titles\"} with Apple", "${submitted.length === 1 ? \"title\" : \"titles\"} in review"],
    ["Every title here has a real build in Apple review.", "Every title here has a real build in review."],
  ],
  "src/pages/Marketing.tsx": [
    [
      "DJ Games is an independent iOS studio. Everything DIY, Run Dummy, Vexara and Astronix are out now on the App Store — more on the way.",
      "DJ Games is an independent studio. Everything DIY, Run Dummy, Vexara and Astronix are out now — more on the way.",
    ],
  ],
  "src/pages/Legal.tsx": [
    ["Purchases are handled by Apple under Apple's own privacy policy.", "Purchases are handled by the app stores under their own privacy policies."],
    ["to every app we publish on the App Store, current and upcoming", "to every app we publish, current and upcoming"],
    ['heading: "Data handled by Apple"', 'heading: "Data handled by the app stores"'],
    [
      "Downloads, purchases, crash reports, and platform features such as Game Center are handled by Apple under Apple's own privacy policy (apple.com/legal/privacy). We never receive a copy",
      "Downloads, purchases, crash reports, and platform features are handled by the app stores under their own privacy policies. We never receive a copy",
    ],
    ["would disclose it on its App Store listing", "would disclose it on its store listing"],
    [
      "Games downloaded through the App Store are additionally governed by Apple's terms and by any end user licence agreement included with the game itself.",
      "Games downloaded through an app store are additionally governed by that store's terms and by any end user licence agreement included with the game itself.",
    ],
    [
      "Apps are bought through the App Store, and the purchase is a one-time payment at the price shown on the product's page — no subscription. Payment, refunds, and receipts are handled entirely by Apple under Apple's own terms;",
      "Apps are bought through the app stores, and the purchase is a one-time payment at the price shown on the product's page — no subscription. Payment, refunds, and receipts are handled entirely by the store under its own terms;",
    ],
  ],
};

let applied = 0;
const missed = [];
for (const [file, pairs] of Object.entries(edits)) {
  const path = `${R}/${file}`;
  let text = fs.readFileSync(path, "utf8");
  for (const [from, to, all] of pairs) {
    if (!text.includes(from)) {
      missed.push(`${file}: ${from.slice(0, 70)}`);
      continue;
    }
    if (all) {
      while (text.includes(from)) {
        text = text.replace(from, to);
        applied += 1;
      }
    } else {
      text = text.replace(from, to);
      applied += 1;
    }
  }
  fs.writeFileSync(path, text);
}
console.log(`applied ${applied} replacements`);
console.log(missed.length ? `MISSED (${missed.length}):\n` + missed.join("\n") : "no misses");
