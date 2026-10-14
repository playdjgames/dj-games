/**
 * Android closed-test campaign — shared between the /android-test page and the
 * homepage band. Single source of truth for copy, links and the scene art.
 *
 * Closed tests render as a stacked list of identical buttons, in array order,
 * directly under the intro copy. To recruit for another build, append an entry
 * to `tests` — no page code changes needed.
 */

export interface ClosedTest {
  /** Button text. */
  label: string;
  /** Outbound Google Play link (opened in a new tab). */
  url: string;
  /** Small mono note shown under the button. */
  note: string;
}

export const ANDROID_TEST = {
  eyebrow: "ANDROID CLOSED TEST",
  title: "Help DJ GAMES reach Google Play",
  pageBody:
    "Vexara is in a closed Play test. This is not the public launch. Use the Gmail on your Android phone. Open the closed-test link, tap Become a tester, install, and stay opted in for 14 days. A reply does not count. Opting out early does not count.",
  bandBody: "Vexara is in a closed test. Testers are how it gets to the public store.",
  tests: [
    {
      label: "Join the Vexara closed test",
      url: "https://play.google.com/apps/testing/com.djgames.vexara",
      note: "Android phone. Same Gmail. 14 days.",
    },
    {
      label: "Join the DesignCo closed test",
      url: "https://play.google.com/store/apps/details?id=com.DesignCo.djgames",
      note: "Android phone. Same Gmail. 14 days. Second listing, same goal.",
    },
  ] as readonly ClosedTest[],
  listingLabel: "Play listing",
  listingUrl: "https://play.google.com/store/apps/details?id=com.djgames.vexara",
  listingNote:
    "The public listing. It may not open until Google Play allows it. The closed-test link is the one that counts.",
  /** Generated scene: night stone keep, city glow, Android phone with a purple-lit gate. */
  scene: "https://2s7937nfb5j5e0l2chd6r.rork.app/~assets/img/188d4682-44ab-4746-b3ae-7b0bb6037a4f.png",
} as const;
