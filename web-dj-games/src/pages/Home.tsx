import { ArrowRight, Download, Gamepad2, Lightbulb, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { ComingSoonCard } from "@/components/ComingSoonCard";
import { ContactForm } from "@/components/ContactForm";
import { GameCard } from "@/components/GameCard";
import { Hero } from "@/components/Hero";
import { LiveSyncNote } from "@/components/LiveSyncNote";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { StoreButtons } from "@/components/StoreButtons";
import { formatSyncDate, useGameLibrary } from "@/data/library";
import { formatPostDate, sortedPosts } from "@/data/news";
import { isLive, SITE } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

const VALUES: { icon: typeof Lightbulb; title: string; body: string }[] = [
  {
    icon: Lightbulb,
    title: "Original ideas",
    body: "We build games around ideas that are designed to be different and memorable.",
  },
  {
    icon: Gamepad2,
    title: "Fun first",
    body: "Gameplay comes first. Every game should be easy to understand and fun to keep playing.",
  },
  {
    icon: TrendingUp,
    title: "Always building",
    body: "DJ Games is constantly working on new games, concepts, and interactive experiences.",
  },
];

const Home = () => {
  useSeo({
    title: "DJ Games — Original Games & Apps",
    description: SITE.description,
  });

  const { featured, upcoming, latest, isSyncing } = useGameLibrary();
  const posts = sortedPosts().slice(0, 3);

  return (
    <>
      <Hero
        eyebrow="Games for a brighter tomorrow"
        title={
          <>
            Welcome to
            <br />
            <span className="text-signal text-glow">DJ Games</span>
          </>
        }
        subtitle={SITE.tagline}
        description="DJ Games creates original games and interactive experiences designed to be fun, accessible, and engaging."
        stamp={["Small", "Games", "Bigger", "Worlds"]}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/games"
            className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-md bg-signal px-7 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98]"
          >
            Explore our games
            <ArrowRight size={16} />
          </Link>

          <a
            href="#download"
            className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-md border border-ember/60 px-7 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ember transition-all duration-300 hover:bg-ember hover:text-primary-foreground hover:shadow-ember active:scale-[0.98]"
          >
            <Download size={16} />
            Download our apps
          </a>
        </div>
      </Hero>

      {/* FEATURED GAMES */}
      <section id="games" className="container scroll-mt-24 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Our picks"
            title="Featured Games"
            note="Original games / Real players / Brighter worlds"
          />
          <LiveSyncNote className="mt-4" isSyncing={isSyncing} />
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((game, index) => (
            <Reveal key={game.slug} as="div" delay={index * 110} className="reveal-modern">
              <GameCard game={game} className="h-full" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* LATEST RELEASE */}
      {latest ? (
        <section id="download" className="container scroll-mt-24 pb-20 sm:pb-24">
          <Reveal>
            <SectionHeading eyebrow="Fresh out" title="Latest Release" note="Newest from the studio" />
          </Reveal>

          <Reveal delay={80}>
            <div className="surface-card corner-ticks mt-10 grid overflow-hidden lg:grid-cols-[1.15fr_1fr]">
              <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto">
                <img
                  src={latest.coverImage}
                  alt={latest.coverFit === "contain" ? "" : `${latest.title} key art`}
                  aria-hidden={latest.coverFit === "contain" ? "true" : undefined}
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    "h-full w-full object-cover",
                    latest.coverFit === "contain" ? "scale-125 blur-3xl saturate-150" : undefined,
                  )}
                />
                {latest.coverFit === "contain" ? (
                  <img
                    src={latest.coverImage}
                    alt={`${latest.title} app icon`}
                    loading="lazy"
                    decoding="async"
                    className="absolute left-1/2 top-1/2 h-[62%] w-auto -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] border border-white/15 shadow-2xl"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-surface/10 lg:to-surface" />
              </div>

              <div className="flex flex-col justify-center gap-5 p-7 sm:p-10">
                <span className="w-fit rounded-md border border-signal/40 bg-signal/10 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-signal">
                  {latest.statusLabel}
                </span>

                <h3 className="display-title text-3xl sm:text-4xl">{latest.title}</h3>
                <p className="text-[0.98rem] leading-relaxed text-muted-foreground">{latest.description}</p>

                <dl className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[0.68rem] uppercase tracking-[0.16em]">
                  <div>
                    <dt className="text-signal">Genre</dt>
                    <dd className="mt-1 text-muted-foreground">{latest.genre}</dd>
                  </div>
                  <div>
                    <dt className="text-signal">Platform</dt>
                    <dd className="mt-1 text-muted-foreground">{latest.platforms.join(", ")}</dd>
                  </div>
                  {latest.price ? (
                    <div>
                      <dt className="text-signal">Price</dt>
                      <dd className="mt-1 text-muted-foreground">{latest.price}</dd>
                    </div>
                  ) : null}
                  {latest.live?.currentVersionReleaseDate ? (
                    <div>
                      <dt className="text-signal">Updated</dt>
                      <dd className="mt-1 text-muted-foreground">
                        {formatSyncDate(latest.live.currentVersionReleaseDate)}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <StoreButtons
                  appStoreUrl={latest.appStoreUrl}
                  googlePlayUrl={latest.googlePlayUrl}
                  gameTitle={latest.title}
                />

                <Link
                  to={`/games/${latest.slug}`}
                  className="inline-flex w-fit min-h-[44px] items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-signal transition-colors hover:text-foreground"
                >
                  View game page
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      ) : null}

      {/* COMING SOON */}
      {upcoming.length > 0 ? (
        <section className="container pb-20 sm:pb-24">
          <Reveal>
            <SectionHeading eyebrow="Next up" title="Coming Soon" note="New worlds are on the way" />
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {upcoming.slice(0, 2).map((game, index) => (
              <Reveal key={game.slug} delay={index * 110} className="reveal-modern">
                <ComingSoonCard game={game} className="h-full" />
              </Reveal>
            ))}
          </div>

          {upcoming.length > 2 ? (
            <Reveal className="mt-8" delay={120}>
              <Link
                to="/coming-soon"
                className="inline-flex min-h-[44px] items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-signal transition-colors hover:text-foreground"
              >
                See everything in development
                <ArrowRight size={15} />
              </Link>
            </Reveal>
          ) : null}
        </section>
      ) : null}

      {/* ABOUT */}
      <section className="container pb-20 sm:pb-24">
        <Reveal>
          <SectionHeading eyebrow="Why DJ Games" title="About DJ Games" />
        </Reveal>

        <Reveal delay={60}>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            We are an independent studio building original games and interactive experiences, one bold idea at a time.
            No committees, no focus-grouped sequels — just small games with bigger worlds inside them.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {VALUES.map((value, index) => (
            <Reveal key={value.title} delay={index * 90}>
              <article className="surface-card-interactive h-full p-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-signal/30 bg-signal/10 text-signal">
                  <value.icon size={22} />
                </span>
                <h3 className="display-title mt-5 text-lg">{value.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8" delay={120}>
          <Link
            to="/about"
            className="inline-flex min-h-[44px] items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-signal transition-colors hover:text-foreground"
          >
            Read our story
            <ArrowRight size={15} />
          </Link>
        </Reveal>
      </section>

      {/* LATEST NEWS */}
      <section className="container pb-20 sm:pb-24">
        <Reveal>
          <SectionHeading
            eyebrow="Latest news"
            title="Studio Updates"
            action={
              <Link
                to="/news"
                className="inline-flex min-h-[44px] items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-signal transition-colors hover:text-foreground"
              >
                View all news
                <ArrowRight size={15} />
              </Link>
            }
          />
        </Reveal>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {posts.map((post, index) => (
            <Reveal key={post.slug} as="li" delay={index * 90}>
              <Link to={`/news/${post.slug}`} className="surface-card-interactive group block h-full overflow-hidden">
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={post.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ember">
                    {formatPostDate(post.date)} <span className="text-muted-foreground">/ {post.category}</span>
                  </p>
                  <h3 className="mt-2.5 font-display text-lg font-bold leading-snug transition-colors group-hover:text-signal">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* COMMUNITY */}
      <section className="container pb-20 sm:pb-24">
        <Reveal>
          <NewsletterSignup />
        </Reveal>
      </section>

      {/* CONTACT */}
      <section id="contact" className="container scroll-mt-24 pb-4">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <SectionHeading eyebrow="Get in touch" title="Get In Touch" />
            <p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-muted-foreground">
              We'd love to hear from you. Whether you have a question, feedback, or just want to say hi, drop us a
              message.
            </p>
            {isLive(SITE.email) ? (
              <a
                href={`mailto:${SITE.email}`}
                className="mt-5 inline-block font-mono text-[0.72rem] uppercase tracking-[0.16em] text-signal transition-colors hover:text-foreground"
              >
                {SITE.email}
              </a>
            ) : null}
          </Reveal>

          <Reveal delay={90}>
            <div className="surface-card p-6 sm:p-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default Home;
