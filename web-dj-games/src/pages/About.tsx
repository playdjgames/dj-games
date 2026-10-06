import { Link } from "react-router-dom";

import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { SITE } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";

interface SupportEntry {
  question: string;
  answer: string[];
  link?: { label: string; href: string; external?: boolean };
}

/** Moved from the old /support page (which now redirects here). Same facts. */
const SUPPORT: SupportEntry[] = [
  {
    question: "When do the submitted games launch?",
    answer: [
      "Everything DIY, Run Dummy, Vexara, Astronix and ThinkSort are out. Next titles are in development. No launch date until a build is approved.",
    ],
  },
  {
    question: "How do I delete my data?",
    answer: [
      "Short answer: delete the app. Our games and apps don't have accounts, cloud storage, or analytics — Vexara, Astronix and Thinksort run entirely on your device, so removing the app removes all of its data. There's nothing held on a server to request.",
      "This website has no accounts either. If you joined the notify list, email us and we'll remove your address, or use the unsubscribe link at the bottom of any email. Details are in the Privacy Policy.",
    ],
    link: { label: "Read the Privacy Policy", href: "/privacy" },
  },
  {
    question: "How do I contact a human?",
    answer: [SITE.email],
    link: { label: `Email ${SITE.email}`, href: `mailto:${SITE.email}`, external: true },
  },
];

const linkClass =
  "mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-md border border-signal/50 px-4 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-signal transition-all duration-300 hover:bg-signal hover:text-primary-foreground";

const About = () => {
  useSeo({
    title: "About — DJ Games",
    description:
      "DJ Games is an independent studio run as DJ Games LLC. Five live titles, websites built in-studio, and straight answers to support questions.",
  });

  return (
    <>
      <Hero
        compact
        eyebrow="Our story"
        title={
          <>
            About
            <br />
            <span className="text-signal text-glow">DJ Games</span>
          </>
        }
        description="An indie studio, not a factory. Original mobile games and apps — and we design and build websites too."
        stamp={["Bold", "Ideas", "Real", "Games"]}
      />

      <section className="container py-16 sm:py-20">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionHeading eyebrow="Who we are" title="An indie studio, not a factory" />

            <div className="space-y-4 text-[1.02rem] leading-relaxed text-muted-foreground">
              <p>
                DJ Games is an independent studio run as DJ Games LLC. We're small on purpose — it means every
                idea gets to be strange, specific, and actually ours.
              </p>
              <p>
                We prototype fast and ship games and apps that respect your time. Five titles are live now — Everything DIY, Run Dummy, Vexara, Astronix and Thinksort — with more in
                development right now.
              </p>
              <p>
                And it doesn't stop at apps: we design and build websites too — including this one. Fast,
                clean, made to last, with no template filler.
              </p>
              <p>
                Everything you see here — the art, the worlds, the mechanics — is built from scratch by the studio.
                No licensed filler, no reskinned templates.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="support" className="container scroll-mt-24 pb-20 sm:pb-24">
        <Reveal>
          <h2 className="display-title text-3xl sm:text-4xl lg:text-[2.75rem]">Support</h2>
        </Reveal>

        <div className="mt-8 max-w-3xl space-y-5">
          {SUPPORT.map((entry, index) => (
            <Reveal key={entry.question} delay={index * 70}>
              <article className="surface-card corner-ticks p-7 sm:p-8">
                <h3 className="display-title text-xl">{entry.question}</h3>
                <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-muted-foreground">
                  {entry.answer.map((paragraph) => (
                    <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                  ))}
                </div>
                {entry.link ? (
                  entry.link.external ? (
                    <a href={entry.link.href} className={linkClass}>
                      {entry.link.label}
                    </a>
                  ) : (
                    <Link to={entry.link.href} className={linkClass}>
                      {entry.link.label}
                    </Link>
                  )
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 max-w-3xl" delay={120}>
          <p className="text-[0.98rem] text-muted-foreground">
            Questions, feedback, or a bug.{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="font-mono text-signal transition-colors hover:text-foreground"
            >
              {SITE.email}
            </a>
          </p>
        </Reveal>
      </section>
    </>
  );
};

export default About;
