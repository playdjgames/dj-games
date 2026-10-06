import { useSeo } from "@/hooks/use-seo";

import { ANDROID_TEST } from "@/data/androidTest";

/**
 * /android-test — the Google Play closed-test recruit page for Vexara.
 * One centred column on the campaign background, exact copy, two outbound links.
 */
const AndroidTest = () => {
  useSeo({
    title: "Android closed test — DJ GAMES",
    description:
      "Join the Vexara closed test on Google Play and help DJ GAMES reach the public store. Android phone, same Gmail, 14 days.",
  });

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#0a0e14]" style={{ backgroundColor: "#0a0e14" }}>
      <div className="mx-auto w-full max-w-[880px] p-6">
        {/* Generated scene — 16:9, no product photo, no titles burned in */}
        {ANDROID_TEST.scene ? (
          <img
            src={ANDROID_TEST.scene}
            alt="A night stone keep on a rock with city glow behind it, and an Android phone whose screen shows a stone gate outlined in purple light"
            width={1536}
            height={1024}
            loading="eager"
            decoding="async"
            className="aspect-[16/9] w-full border border-[#243044] object-cover"
          />
        ) : null}

        <p className="eyebrow mt-8">{ANDROID_TEST.eyebrow}</p>
        <h1 className="display-title mt-3 text-4xl tracking-tight sm:text-5xl">{ANDROID_TEST.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{ANDROID_TEST.pageBody}</p>

        <div className="mt-8">
          <a
            href={ANDROID_TEST.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-signal px-6 font-display text-base font-bold uppercase tracking-wide text-background transition-colors duration-300 hover:bg-foreground"
          >
            {ANDROID_TEST.joinLabel}
          </a>
          <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            {ANDROID_TEST.joinNote}
          </p>
        </div>

        <div className="mt-8">
          <a
            href={ANDROID_TEST.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-border bg-surface px-6 font-display text-base font-bold uppercase tracking-wide text-foreground transition-colors duration-300 hover:border-signal/50 hover:text-signal"
          >
            {ANDROID_TEST.listingLabel}
          </a>
          <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            {ANDROID_TEST.listingNote}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AndroidTest;
