import { useMemo, useState } from "react";

import { ComingSoonCard } from "@/components/ComingSoonCard";
import { GameCard } from "@/components/GameCard";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { LiveSyncNote } from "@/components/LiveSyncNote";
import { useGameLibrary } from "@/data/library";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

const Games = () => {
  useSeo({
    title: "Games — DJ Games",
    description:
      "Browse every game from DJ Games, from released titles on the App Store to projects still in development.",
  });

  const { released, upcoming, genres: libraryGenres, isSyncing } = useGameLibrary();
  const [genre, setGenre] = useState<string>("All");

  const genres = useMemo<string[]>(() => ["All", ...libraryGenres], [libraryGenres]);

  const visible = useMemo(
    () => (genre === "All" ? released : released.filter((game) => game.genre === genre)),
    [genre, released],
  );

  return (
    <>
      <Hero
        compact
        eyebrow="The library"
        title={
          <>
            Our <span className="text-signal text-glow">Games</span>
          </>
        }
        description="Every title we've shipped, plus the projects still taking shape in the studio. Tap any game for screenshots, features, and download links."
        stamp={["Play", "Every", "World"]}
      />

      <section className="container py-16 sm:py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Available now"
            title="Released Titles"
            note={`${released.length} ${released.length === 1 ? "title" : "titles"}`}
          />
          <LiveSyncNote className="mt-4" isSyncing={isSyncing} />
        </Reveal>

        {genres.length > 2 ? (
          <Reveal delay={60}>
            <ul className="mt-7 flex flex-wrap gap-2">
              {genres.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => setGenre(item)}
                    aria-pressed={genre === item}
                    className={cn(
                      "min-h-[40px] rounded-full border px-4 font-mono text-[0.64rem] uppercase tracking-[0.14em] transition-all duration-300",
                      genre === item
                        ? "border-signal bg-signal/15 text-signal"
                        : "border-border bg-surface text-muted-foreground hover:border-signal/40 hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {visible.length > 0 ? (
          <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((game, index) => (
              <Reveal key={game.slug} delay={index * 80}>
                <GameCard game={game} className="h-full" />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-10 font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
            No games in this genre yet.
          </p>
        )}
      </section>

      {upcoming.length > 0 ? (
        <section className="container pb-20 sm:pb-24">
          <Reveal>
            <SectionHeading eyebrow="In the works" title="Coming Soon" note="New worlds are on the way" />
          </Reveal>

          <div className="mt-9 grid gap-6 lg:grid-cols-2">
            {upcoming.map((game, index) => (
              <Reveal key={game.slug} delay={index * 80}>
                <ComingSoonCard game={game} className="h-full" />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
};

export default Games;
