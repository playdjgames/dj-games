/**
 * ============================================================================
 * DJ GAMES — NEWS & UPDATES
 * ============================================================================
 * ADD A POST: copy an entry, put it at the top of the POSTS array, and edit it.
 * The homepage, About page and /news list all read from here. `body` accepts
 * an array of paragraphs so posts can grow into full articles later.
 * ============================================================================
 */

export type PostCategory = "Announcement" | "Release" | "Patch Notes" | "Devlog";

export interface NewsPost {
  /** Used in the URL: /news/{slug} */
  slug: string;
  title: string;
  /** ISO date — controls ordering and the displayed date. */
  date: string;
  category: PostCategory;
  excerpt: string;
  image: string;
  body: string[];
  /** Optional — links the post to a game page. */
  gameSlug?: string;
}

export const POSTS: NewsPost[] = [
  {
    slug: "everything-diy-camera-measure",
    title: "Everything DIY 2.1.4 — your camera is now a tape measure",
    date: "2026-09-22",
    category: "Release",
    excerpt: "Point, tap two points, get a length. Measure live in front of the job or on a photo you already took.",
    image: "/apps/everything-diy-1.png",
    gameSlug: "everything-diy",
    body: [
      "Everybody knows the moment. You're halfway into a job, you need one number — the width of that opening, the length of that board — and the tape measure is somewhere between the garage and the trunk of the car. Version 2.1.4 fixes that. Everything DIY can now measure with the camera.",
      "Point the phone at a shelf, a doorway, a board or an opening, tap two points, and you get a length. Save it straight to the project you're working on so it lives next to the steps and the shopping list instead of on the back of a receipt you're going to lose.",
      "There are two ways to use it. Live measure is for when you're standing in front of the job — raise the phone, tap, done. Set scale on a photo is for everything else: got a picture of the wall from last week, or a shot your contractor sent you? Drop the scale on something of a known size in the frame and measure the rest of the picture after the fact. That second one quietly solves a problem a laser measure can't touch — you can measure a room you're not standing in.",
      "One honest note, and it's in the app too: the numbers are approximate. They're right for planning — how wide that shelf run is, how much board to buy, whether the fridge fits through the door. For a cut you can't take back, confirm it with a real tape.",
      "Everything DIY stays free on iPhone. Update from the App Store and the measure tool is waiting in your next project.",
    ],
  },
  {
    slug: "everything-diy-is-live",
    title: "Everything DIY is live on the App Store",
    date: "2026-09-10",
    category: "Release",
    excerpt: "Our first app is out now. Bring on the projects.",
    image: "/apps/everything-diy-2.png",
    gameSlug: "everything-diy",
    body: [
      "Everything DIY is officially available on the App Store. If you have ever stood in a hardware aisle wondering what tool you actually need — or what a job is going to cost before you start pulling things apart — this is the app for you.",
      "Type in any project and the app puts together step-by-step instructions plus video walkthroughs. Not sure what a part is called? Point your camera at it and the app helps identify tools and materials, then tells you where to get them and roughly what they cost.",
      "Everything DIY is free on iPhone. If you take on a project with it, we'd genuinely love to hear how it went — feedback goes straight into how we improve the next version.",
    ],
  },
  {
    slug: "run-dummy-first-look",
    title: "First look at Run Dummy",
    date: "2026-08-22",
    category: "Announcement",
    excerpt: "A crash-test dummy, a booby-trapped lab and a ticking clock — our next game is taking shape.",
    // Same key art as the Run Dummy library card (games.ts `coverImage`) — the
    // post and the card must never show two different versions of the game.
    image: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/74b7731b-abaa-4f03-a756-155d3d402b85.png",
    gameSlug: "run-dummy",
    body: [
      "Time to talk about what's next. Run Dummy is a 3D maze runner starring a crash-test dummy loose in a neon laboratory. Steer with simple tank controls, memorize the corridors, and reach the reward well before the clock runs out.",
      "The walls can't hurt you — the traps will. Every trial hides spinning blades, floor spikes, dart launchers, crumbling tiles and pressure switches between you and the exit. Chain clean wall streaks to unlock new runners and chase up to 3 stars per trial.",
      "35 trials across 5 chapters are in and tuned, and the build is now with Apple for review. Watch this space for a release date.",
    ],
  },
  {
    slug: "blood-war-and-whats-ahead",
    title: "Blood War — and what's ahead for the studio",
    date: "2026-07-30",
    category: "Devlog",
    excerpt: "A quick update on everything we're building right now.",
    image: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/44b0f9e7-68d1-463f-a813-9ef69fadd98e.png",
    gameSlug: "blood-war",
    body: [
      "Studio update time. We've been quiet on here, but behind the scenes there's a lot in motion — and for the first time we can put a name to the next project.",
      "Blood War is the newest thing on the slate. It's early — too early to share screens or even say much about what it is — but it's been eating most of our prototype time lately and we're excited about where it's heading. We'll reveal more once it's further along.",
      "In the meantime, Run Dummy, Vexara, Astronix and Thinksort are all moving through Apple review, and Everything DIY keeps getting refined based on the feedback coming in. Thanks for following along — 2026 is shaping up to be our busiest year yet.",
    ],
  },
];

export const sortedPosts = (): NewsPost[] =>
  POSTS.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const postBySlug = (slug: string | undefined): NewsPost | undefined =>
  POSTS.find((post) => post.slug === slug);

export const formatPostDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
