import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Hero } from "@/components/Hero";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useGameLibrary } from "@/data/library";
import { isWithApple } from "@/data/prerelease";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

const ComingSoon = () => {
  useSeo({
    title: "Coming Soon — DJ Games",
    description:
      "See what DJ Games is building next. Concept art, development status, and early looks at our upcoming games.",
  });

  const { upcoming } = useGameLibrary();

  return (
    <>
      <Hero
        compact
        eyebrow="In development"
        title={
          <>
            Coming <span className="text-signal text-glow">Soon</span>
          </>
        }
        description="The projects currently taking shape in the studio. Some are deep in production, some are still sketches — all of them are being built in the open."
        stamp={["New", "Worlds", "Loading"]}
      />

      <section className="container py-16 sm:py-20">
        <Reveal>
          <SectionHeading eyebrow="On the workbench" title="Upcoming Projects" note={`${upcoming.length} projects`} />
        </Reveal>

        {upcoming.length === 0 ? (
          <p className="mt-10 font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
            Nothing announced right now — check back soon.
          </p>
        ) : (
          <div className="mt-10 space-y-8">
            {upcoming.map((game, index) => (
              <Reveal key={game.slug} delay={index * 80}>
                <article className="surface-card corner-ticks grid overflow-hidden lg:grid-cols-[1fr_1fr]">
                  <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto">
                    <img
                      src={game.coverImage}
                      alt={`${game.title} concept art`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover opacity-80 grayscale"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-surface" />
                    <span
                      className={cn(
                        "absolute left-4 top-4 rounded-md border bg-background/85 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] backdrop-blur",
                        game.reviewStage && isWithApple(game.reviewStage)
                          ? "border-signal/60 text-signal"
                          : "border-ember/60 text-ember",
                      )}
                    >
                      {game.reviewStage && isWithApple(game.reviewStage) ? "Launching soon" : "Coming soon"}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
                    <h3 className="display-title text-2xl sm:text-3xl">{game.title}</h3>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em]",
                          game.reviewStage && isWithApple(game.reviewStage)
                            ? "border-signal/40 bg-signal/10 text-signal"
                            : "border-ember/40 bg-ember/10 text-ember",
                        )}
                      >
                        {game.statusLabel}
                      </span>
                      <span className="rounded-full border border-border bg-surface-raised px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                        {game.genre}
                      </span>
                      <span className="rounded-full border border-border bg-surface-raised px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                        {game.releaseDate}
                      </span>
                      {game.prerelease?.version ? (
                        <span className="rounded-full border border-border bg-surface-raised px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                          Build {game.prerelease.version}
                        </span>
                      ) : null}
                      {game.ageRating ? (
                        <span className="rounded-full border border-border bg-surface-raised px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                          {game.ageRating}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-[0.96rem] leading-relaxed text-muted-foreground">{game.description}</p>

                    <Link
                      to={`/games/${game.slug}`}
                      className="inline-flex w-fit min-h-[44px] items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-signal transition-colors hover:text-foreground"
                    >
                      View project page
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="container pb-20 sm:pb-24">
        <Reveal>
          <NewsletterSignup />
        </Reveal>
      </section>
    </>
  );
};

export default ComingSoon;
