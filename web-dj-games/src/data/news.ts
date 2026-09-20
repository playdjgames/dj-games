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
      "Everything DIY is $5.99 on iPhone. If you take on a project with it, we'd genuinely love to hear how it went — feedback goes straight into how we improve the next version.",
    ],
  },
  {
    slug: "run-dummy-first-look",
    title: "First look at Run Dummy",
    date: "2026-08-22",
    category: "Announcement",
    excerpt: "A crash-test dummy, a booby-trapped lab and a ticking clock — our next game is taking shape.",
    image: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/8f5580aa-235a-40c1-a0a1-929739609630.png",
    gameSlug: "run-dummy",
    body: [
      "Time to talk about what's next. Run Dummy is a 3D maze runner starring a crash-test dummy loose in a neon laboratory. Steer with simple tank controls, memorize the corridors, and reach the reward well before the clock runs out.",
      "The walls can't hurt you — the traps will. Every trial hides spinning blades, floor spikes, dart launchers, crumbling tiles and pressure switches between you and the exit. Chain clean wall streaks to unlock new runners and chase up to 3 stars per trial.",
      "35 trials across 5 chapters are in and tuned, and the build is now with Apple for review. Watch this space for a release date.",
    ],
  },
  {
    slug: "realmforge-and-whats-ahead",
    title: "Realmforge — and what's ahead for the studio",
    date: "2026-07-30",
    category: "Devlog",
    excerpt: "A quick update on everything we're building right now.",
    image: "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/46b73a19-75c2-46ee-918e-9d24de700603.png",
    gameSlug: "realmforge",
    body: [
      "Studio update time. We've been quiet on here, but behind the scenes there's a lot in motion — and for the first time we can put names to a couple of projects.",
      "Realmforge is the newest thing on the slate. It's early — too early to share screens or even say much about what it is — but it's been eating most of our prototype time lately and we're excited about where it's heading. We'll reveal more once it's further along.",
      "In the meantime, Run Dummy continues to move through development, and Everything DIY keeps getting refined based on the feedback coming in. Thanks for following along — 2026 is shaping up to be our busiest year yet.",
    ],
  },
];

export const sortedPosts = (): NewsPost[] =>
  POSTS.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const postBySlug = (slug: string | undefined): NewsPost | undefined =>
  POSTS.find((post) => post.slug === slug);

export const formatPostDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
