import { useMemo } from "react";

import { ConceptCard } from "@/components/ConceptCard";
import { GameCard } from "@/components/GameCard";
import { Hero } from "@/components/Hero";
import { LiveSyncNote } from "@/components/LiveSyncNote";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Reveal } from "@/components/Reveal";
import type { LibraryGame } from "@/data/library";
import { useGameLibrary } from "@/data/library";
import { useSeo } from "@/hooks/use-seo";

/**
 * Fixed running order for the live cards. Anything Apple publishes that isn't
 * listed here (a brand-new app) is appended after, newest first.
 */
const LIVE_ORDER: string[] = [
  "thinksort",
  "run-dummy",
  "astronix",
  "vexara",
  "everything-diy",
  "press-house",
  "dj-games-website",
];

const rank = (game: LibraryGame): number => {
  const index = LIVE_ORDER.indexOf(game.slug);
  return index === -1 ? LIVE_ORDER.length : index;
};

const Games = () => {
  useSeo({
    title: "Apps — DJ Games",
    description:
      "Every DJ Games app: live work on top, in development under that. First looks are not release dates.",
  });

  const { released, concepts, isSyncing } = useGameLibrary();

  // `released` arrives newest-first, and sort is stable, so unlisted apps keep that order.
  const live = useMemo<LibraryGame[]>(() => [...released].sort((a, b) => rank(a) - rank(b)), [released]);

  return (
    <>
      <Hero
        compact
        title="Apps"
        description="Live work on top. In development under that. First looks are not release dates."
      />

      <section className="container py-14 sm:py-16">
        <Reveal>
          <LiveSyncNote isSyncing={isSyncing} />
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {live.map((game, index) => (
            <Reveal key={game.slug} delay={index * 80}>
              <GameCard game={game} className="h-full" />
            </Reveal>
          ))}
        </div>
      </section>

      {concepts.length > 0 ? (
        <section className="container pb-14 sm:pb-16">
          <Reveal>
            <h2 className="display-title text-3xl sm:text-4xl lg:text-[2.75rem]">In development</h2>
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

      <section className="container pb-20 sm:pb-24">
        <Reveal>
          <NewsletterSignup />
        </Reveal>
      </section>
    </>
  );
};

export default Games;
