import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Hero } from "@/components/Hero";
import { LiveSyncNote } from "@/components/LiveSyncNote";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { StoreUpdateCard } from "@/components/StoreUpdateCard";
import { divisionLabel } from "@/data/divisions";
import { formatPostDate } from "@/data/news";
import { useNewsFeed } from "@/data/newsFeed";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

const News = () => {
  useSeo({
    title: "News & Updates — DJ Games",
    description:
      "Announcements, release notes and devlogs from DJ Games — plus live App Store releases, version updates and review status, updated automatically.",
  });

  const { items, pipeline, autoCount, isSyncing } = useNewsFeed();

  const note =
    autoCount > 0
      ? `${items.length} entries · ${autoCount} from the App Store`
      : `${items.length} ${items.length === 1 ? "entry" : "entries"}`;

  return (
    <>
      <Hero
        compact
        eyebrow="From the studio"
        title={
          <>
            News &amp; <span className="text-signal text-glow">Updates</span>
          </>
        }
        description="Announcements, release notes and the occasional look behind the curtain — plus every App Store release and update, posted the moment Apple publishes it."
        stamp={["Devlogs", "Patches", "Releases"]}
      />

      {/* THE PIPELINE BOARD — reads its stages straight off App Store Connect */}
      {pipeline.length > 0 ? (
        <section className="container pt-14 sm:pt-16">
          <Reveal>
            <SectionHeading
              eyebrow="Right now"
              title="Where every build stands"
              note={`${pipeline.length} in progress`}
            />
          </Reveal>

          <Reveal delay={60}>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pipeline.map((entry) => (
                <li key={entry.game.slug}>
                  <Link
                    to={`/games/${entry.game.slug}`}
                    className="surface-card group flex h-full items-center gap-3 p-4 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        entry.withApple ? "bg-ember animate-pulse" : "bg-muted-foreground/60",
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[0.95rem] font-bold transition-colors group-hover:text-signal">
                        {entry.game.title}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground">
                        {divisionLabel(entry.game.division)}
                        {entry.version ? ` / v${entry.version}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-right font-mono text-[0.58rem] uppercase tracking-[0.14em]",
                        entry.withApple ? "text-ember" : "text-muted-foreground",
                      )}
                    >
                      {entry.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-5" delay={110}>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
              Status pulled from App Store Connect — these move on their own as builds progress.
            </p>
          </Reveal>
        </section>
      ) : null}

      <section className="container py-16 sm:py-20">
        <Reveal>
          <SectionHeading eyebrow="Everything" title="All Posts" note={note} />
        </Reveal>

        <Reveal className="mt-5" delay={50}>
          <LiveSyncNote isSyncing={isSyncing} />
        </Reveal>

        {items.length === 0 ? (
          <p className="mt-10 font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
            No posts published yet.
          </p>
        ) : (
          <ul className="mt-8 space-y-5">
            {items.map((item, index) =>
              item.kind === "store" ? (
                <Reveal key={item.key} as="li" delay={index * 70}>
                  <StoreUpdateCard update={item.update} dateLabel={formatPostDate(item.date)} />
                </Reveal>
              ) : (
                <Reveal key={item.key} as="li" delay={index * 70}>
                  <Link
                    to={`/news/${item.post.slug}`}
                    className="surface-card-interactive group grid overflow-hidden sm:grid-cols-[minmax(0,300px)_1fr]"
                  >
                    <div className="aspect-[16/9] overflow-hidden sm:aspect-auto">
                      <img
                        src={item.post.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex items-center gap-4 p-6">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ember">
                          {formatPostDate(item.post.date)}{" "}
                          <span className="text-muted-foreground">/ {item.post.category}</span>
                        </p>
                        <h2 className="display-title mt-2 text-xl transition-colors group-hover:text-signal sm:text-2xl">
                          {item.post.title}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.post.excerpt}</p>
                      </div>

                      <ChevronRight
                        size={22}
                        className="hidden shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-signal sm:block"
                      />
                    </div>
                  </Link>
                </Reveal>
              ),
            )}
          </ul>
        )}
      </section>
    </>
  );
};

export default News;
