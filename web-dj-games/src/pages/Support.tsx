import { Apple, Bell, Mail, ShieldCheck, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { FEATURED_APP_URL, SITE } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";

interface SupportEntry {
  icon: LucideIcon;
  question: string;
  /** Paragraphs — plain, actual answers, no "coming soon" filler. */
  answer: string[];
  link?: { label: string; href: string; external?: boolean };
}

const ENTRIES: SupportEntry[] = [
  {
    icon: Apple,
    question: "How do I get Everything DIY?",
    answer: [
      "Everything DIY is on the Apple App Store for iPhone. It's free — no subscription, no ads.",
      "Search \"Everything DIY\" in the App Store, or tap the button here. Once it's installed, type in any project — replace a faucet, mount a TV — and the app walks you through it step by step, with the tools, prices, and where to get them.",
    ],
    link: { label: "Open the App Store", href: FEATURED_APP_URL, external: true },
  },
  {
    icon: Bell,
    question: "When do the submitted games launch?",
    answer: [
      "Run Dummy, Vexara, Astronix and Thinksort are real builds currently in review with Apple. Review usually takes a few days, but we don't post a launch date until Apple approves the build — we don't do countdowns that slip.",
      "The moment each game is live it appears on the Games page automatically (the site checks the App Store directly), and we announce it on the news page. Newsletter subscribers get TestFlight invites before launch and exactly one email when a game goes live.",
    ],
    link: { label: "Get notified", href: "/coming-soon#notify" },
  },
  {
    icon: ShieldCheck,
    question: "How do I delete my data?",
    answer: [
      "Short answer: delete the app. Our games and apps don't have accounts, cloud storage, or analytics — Vexara, Astronix and Thinksort run entirely on your device, so removing the app removes all of its data. There's nothing held on a server to request.",
      "This website has no accounts either. If you joined the notify list, email us and we'll remove your address, or use the unsubscribe link at the bottom of any email. Details are in the Privacy Policy.",
    ],
    link: { label: "Read the Privacy Policy", href: "/privacy" },
  },
  {
    icon: Mail,
    question: "How do I contact a human?",
    answer: [
      "For player support — a bug, a purchase question, a feature idea — email support@playdjgames.com and we'll get back to you.",
      "For everything else (press, partnerships, hellos), use hello@playdjgames.com.",
    ],
    link: { label: `Email ${SITE.supportEmail}`, href: `mailto:${SITE.supportEmail}`, external: true },
  },
];

const Support = () => {
  useSeo({
    title: "Support — DJ Games",
    description:
      "Real answers about DJ Games apps: getting Everything DIY, when submitted games launch, deleting your data, and contacting support@playdjgames.com.",
  });

  return (
    <>
      <Hero
        compact
        eyebrow="Support"
        title={
          <>
            How can we <span className="text-signal text-glow">help?</span>
          </>
        }
        description="Straight answers about our apps, launches, and your data. No runaround."
        stamp={["Real", "Answers", "Fast"]}
      />

      <section className="container py-14 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-5">
          {ENTRIES.map((entry, index) => (
            <Reveal key={entry.question} delay={index * 70}>
              <article className="surface-card corner-ticks p-7 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-signal/30 bg-signal/10 text-signal">
                    <entry.icon size={20} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="display-title text-xl">{entry.question}</h2>
                    <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-muted-foreground">
                      {entry.answer.map((paragraph) => (
                        <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                      ))}
                    </div>

                    {entry.link ? (
                      entry.link.external ? (
                        <a
                          href={entry.link.href}
                          target={entry.link.href.startsWith("mailto:") ? undefined : "_blank"}
                          rel="noopener noreferrer"
                          className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-md border border-signal/50 px-4 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-signal transition-all duration-300 hover:bg-signal hover:text-primary-foreground"
                        >
                          {entry.link.label}
                        </a>
                      ) : (
                        <Link
                          to={entry.link.href}
                          className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-md border border-signal/50 px-4 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-signal transition-all duration-300 hover:bg-signal hover:text-primary-foreground"
                        >
                          {entry.link.label}
                        </Link>
                      )
                    ) : null}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mx-auto mt-10 max-w-3xl" delay={120}>
          <p className="text-center font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
            DJ Games LLC · <a href={`mailto:${SITE.supportEmail}`} className="text-signal transition-colors hover:text-foreground">{SITE.supportEmail}</a> · playdjgames.com
          </p>
        </Reveal>
      </section>
    </>
  );
};

export default Support;
