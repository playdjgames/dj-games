import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { ComingSoonCard } from "@/components/ComingSoonCard";
import { ConceptCard } from "@/components/ConceptCard";
import { Hero } from "@/components/Hero";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useGameLibrary } from "@/data/library";
import { useSeo } from "@/hooks/use-seo";

const ComingSoon = () => {
  useSeo({
    title: "Coming Soon — DJ Games",
    description:
      "See what DJ Games is building next: titles submitted to Apple and early concepts in development. Get notified when a game goes live.",
  });

  const { submitted, concepts } = useGameLibrary();

  return (
    <>
      <Hero
        compact
        eyebrow="In the pipeline"
        title={
          <>
            Coming <span className="text-signal text-glow">Soon</span>
          </>
        }
        description="Submitted to Apple up top — those are next through the door. Early concepts below: first looks, not release dates."
        stamp={["New", "Worlds", "Loading"]}
      />

      {/* SUBMITTED — large, closest to launch */}
      {submitted.length > 0 ? (
        <section className="container py-14 sm:py-16">
          <Reveal>
            <SectionHeading
              eyebrow="Submitted to Apple"
              title="In review now"
              note={`${submitted.length} ${submitted.length === 1 ? "title" : "titles"} with Apple`}
            />
          </Reveal>

          <div className="mt-8 space-y-6">
            {submitted.map((game, index) => (
              <Reveal key={game.slug} delay={index * 80}>
                <ComingSoonCard game={game} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-6" delay={120}>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Every title here has a real build in Apple review. Launch dates get announced on{" "}
              <Link to="/news" className="text-signal transition-colors hover:text-foreground">
                the news page
              </Link>{" "}
              and by email first.
            </p>
          </Reveal>
        </section>
      ) : null}

      {/* CONCEPTS — compact, deliberately lower weight */}
      {concepts.length > 0 ? (
        <section className="container pb-16 sm:pb-20">
          <Reveal>
            <SectionHeading eyebrow="Early concepts" title="In development" note="Not launching this week" />
          </Reveal>

          <ul className="mt-8 space-y-3">
            {concepts.map((game, index) => (
              <Reveal key={game.slug} as="li" delay={index * 70}>
                <ConceptCard game={game} />
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      {/* NOTIFY */}
      <section className="container pb-20 sm:pb-24">
        <Reveal>
          <NewsletterSignup />
        </Reveal>
        <Reveal className="mt-6" delay={90}>
          <p className="text-center font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
            One email when a game goes live. TestFlight invites for subscribers.{" "}
            <Link to="/support" className="text-signal transition-colors hover:text-foreground">
              Questions? Support
              <ArrowRight size={12} className="ml-1 inline" />
            </Link>
          </p>
        </Reveal>
      </section>
    </>
  );
};

export default ComingSoon;
