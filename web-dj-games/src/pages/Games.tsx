import { useMemo, useState } from "react";

import { ConceptCard } from "@/components/ConceptCard";
import { GameCard } from "@/components/GameCard";
import { Hero } from "@/components/Hero";
import { LiveSyncNote } from "@/components/LiveSyncNote";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useGameLibrary } from "@/data/library";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

type Filter = "all" | "available" | "submitted" | "concepts" | "utilities" | "arcade" | "maze" | "productivity";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "submitted", label: "Submitted" },
  { id: "concepts", label: "Concepts" },
  { id: "utilities", label: "Utilities" },
  { id: "arcade", label: "Arcade" },
  { id: "maze", label: "Maze" },
  { id: "productivity", label: "Productivity" },
];

const GROUP_META = {
  available: { eyebrow: "Available now", title: "Live on the App Store" },
  submitted: { eyebrow: "Submitted to Apple", title: "Launching next" },
  concepts: { eyebrow: "Early concepts", title: "In development" },
} as const;

const Games = () => {
  useSeo({
    title: "Games — DJ Games",
    description:
      "Every game and app from DJ Games: Everything DIY, live on the App Store, plus titles submitted to Apple and early concepts in development.",
  });

  const { released, submitted, concepts, isSyncing } = useGameLibrary();
  const [filter, setFilter] = useState<Filter>("all");

  const matches = (status: "available" | "submitted" | "concept", category: string): boolean => {
    if (filter === "all") return true;
    if (filter === "available" || filter === "submitted" || filter === "concepts") {
      return filter === (status === "concept" ? "concepts" : status);
    }
    // Genre chips cut across tiers — a category match shows it wherever it sits.
    return filter === category;
  };

  const groups = useMemo(
    () =>
      [
        { tier: "available" as const, games: released },
        { tier: "submitted" as const, games: submitted },
        { tier: "concepts" as const, games: concepts },
      ].map((group) => ({
        ...group,
        visible: group.games.filter((game) => matches(game.status, game.category)),
      })),
    // `matches` closes over `filter`; listing it keeps the memo honest.
    [filter, released, submitted, concepts], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const anyVisible = groups.some((group) => group.visible.length > 0);

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
        description="One app live, four in review, three early concepts. Everything we're building, honest about where each one stands."
        stamp={["Play", "Every", "World"]}
      />

      <section className="container py-14 sm:py-16">
        <Reveal>
          <LiveSyncNote isSyncing={isSyncing} />
          <ul className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {FILTERS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setFilter(item.id)}
                  aria-pressed={filter === item.id}
                  className={cn(
                    "min-h-[40px] whitespace-nowrap rounded-full border px-4 font-mono text-[0.64rem] uppercase tracking-[0.14em] transition-all duration-300",
                    filter === item.id
                      ? "border-signal bg-signal/15 text-signal"
                      : "border-border bg-surface text-muted-foreground hover:border-signal/40 hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </Reveal>

        {anyVisible ? (
          <div className="mt-10 space-y-14">
            {groups.map(
              (group) =>
                group.visible.length > 0 ? (
                  <div key={group.tier}>
                    {filter === "all" || group.visible.length !== group.games.length ? (
                      <Reveal>
                        <SectionHeading
                          eyebrow={GROUP_META[group.tier].eyebrow}
                          title={GROUP_META[group.tier].title}
                        />
                      </Reveal>
                    ) : null}

                    {group.tier === "concepts" ? (
                      <ul className={cn("space-y-3", filter === "all" && "mt-6")}>
                        {group.visible.map((game, index) => (
                          <Reveal key={game.slug} as="li" delay={index * 70}>
                            <ConceptCard game={game} />
                          </Reveal>
                        ))}
                      </ul>
                    ) : (
                      <div className={cn("grid gap-6 md:grid-cols-2", filter === "all" && "mt-6")}>
                        {group.visible.map((game, index) => (
                          <Reveal key={game.slug} delay={index * 80}>
                            <GameCard game={game} className="h-full" />
                          </Reveal>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null,
            )}
          </div>
        ) : (
          <p className="mt-10 font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
            Nothing in this category yet — new games are always in the works.
          </p>
        )}
      </section>
    </>
  );
};

export default Games;
