import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { ConceptCard } from "@/components/ConceptCard";
import { GameCard } from "@/components/GameCard";
import { Hero } from "@/components/Hero";
import { LiveSyncNote } from "@/components/LiveSyncNote";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { DIVISIONS, divisionById, type Division, type DivisionId } from "@/data/divisions";
import { useGameLibrary } from "@/data/library";
import { SITE } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

const ALL = "all" as const;
type Active = DivisionId | typeof ALL;

const GROUP_META = {
  available: { eyebrow: "Available now", title: "Live on the App Store" },
  submitted: { eyebrow: "Submitted to Apple", title: "Launching next" },
  concepts: { eyebrow: "Early concepts", title: "In development" },
} as const;

const Games = () => {
  useSeo({
    title: "Apps-n-Stuff — DJ Games",
    description:
      "Everything DJ Games builds, by division: iOS apps, mobile games, PC games and web work — live titles, builds with Apple, and early concepts.",
  });

  const { games, released, submitted, concepts, isSyncing } = useGameLibrary();

  // The division lives in the URL, so the home strip can deep-link straight
  // into a filtered library and a filtered view stays shareable.
  const [params, setParams] = useSearchParams();
  const raw = params.get("division");
  const active: Active = DIVISIONS.some((division) => division.id === raw) ? (raw as DivisionId) : ALL;

  const select = useCallback(
    (id: Active): void => {
      const next = new URLSearchParams(params);
      if (id === ALL) next.delete("division");
      else next.set("division", id);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  /** Only offer a division that actually holds something. */
  const offered = useMemo<Division[]>(
    () => DIVISIONS.filter((division) => games.some((game) => game.division === division.id)),
    [games],
  );

  const groups = useMemo(
    () =>
      [
        { tier: "available" as const, games: released },
        { tier: "submitted" as const, games: submitted },
        { tier: "concepts" as const, games: concepts },
      ].map((group) => ({
        ...group,
        visible: active === ALL ? group.games : group.games.filter((game) => game.division === active),
      })),
    [active, released, submitted, concepts],
  );

  const anyVisible = groups.some((group) => group.visible.length > 0);
  const activeNote = active === ALL ? null : divisionById(active)?.note;

  return (
    <>
      <Hero
        compact
        eyebrow="The library"
        title={
          <>
            Apps-n-<span className="text-signal text-glow">Stuff</span>
          </>
        }
        description="Apps, mobile games, PC games and web work — everything we're building, honest about where each one stands."
        stamp={["Apps", "Games", "Web"]}
      />

      <section className="container py-14 sm:py-16">
        <Reveal>
          <LiveSyncNote isSyncing={isSyncing} />

          {/* Divisions — quiet underline tabs, never blocky chips. */}
          <ul className="no-scrollbar mt-5 flex gap-6 overflow-x-auto border-b border-border/70 sm:gap-8">
            {([{ id: ALL, label: "All" }, ...offered] as { id: Active; label: string }[]).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => select(item.id)}
                  aria-pressed={active === item.id}
                  className={cn(
                    "-mb-px min-h-[44px] whitespace-nowrap border-b-2 pb-2.5 font-mono text-[0.66rem] uppercase tracking-[0.18em] transition-colors duration-300",
                    active === item.id
                      ? "border-signal text-signal"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          {activeNote ? (
            <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
              {activeNote}
            </p>
          ) : null}
        </Reveal>

        {anyVisible ? (
          <div className="mt-10 space-y-14">
            {groups.map(
              (group) =>
                group.visible.length > 0 ? (
                  <div key={group.tier}>
                    <Reveal>
                      <SectionHeading
                        eyebrow={GROUP_META[group.tier].eyebrow}
                        title={GROUP_META[group.tier].title}
                      />
                    </Reveal>

                    {group.tier === "concepts" ? (
                      <ul className="mt-6 space-y-3">
                        {group.visible.map((game, index) => (
                          <Reveal key={game.slug} as="li" delay={index * 70}>
                            <ConceptCard game={game} />
                          </Reveal>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {/* Cards read a touch smaller here: three-up on wide screens. */}
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
          <div className="mt-10">
            <p className="font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
              Nothing here yet — this side of the studio is just getting started.
            </p>
            {/* Web is a service, not a shipped title — the empty tab is the invite. */}
            {active === "web" ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Need a website? We design and build them — fast, clean, and built to last.{" "}
                <a
                  href={`mailto:${SITE.email}`}
                  className="font-mono text-signal transition-colors hover:text-foreground"
                >
                  {SITE.email}
                </a>
              </p>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
};

export default Games;
