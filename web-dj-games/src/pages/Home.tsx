import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { ANDROID_TEST } from "@/data/androidTest";
import { ConceptCard } from "@/components/ConceptCard";
import { GameCard } from "@/components/GameCard";
import { LatestLiveCard } from "@/components/LatestLiveCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ParticleField } from "@/components/ParticleField";
import { PressHouseAd } from "@/components/PressHouseAd";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { DIVISIONS } from "@/data/divisions";
import { formatPostDate, sortedPosts } from "@/data/news";
import type { LibraryGame } from "@/data/library";
import { useGameLibrary } from "@/data/library";
import { SITE } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";

/** Milliseconds for an ISO date, or 0 when it's a target like "2026" / "TBA". */
const timeOf = (iso: string | undefined): number => {
  const time = new Date(iso ?? "").getTime();
  return Number.isNaN(time) ? 0 : time;
};

/**
 * The newest app or game to LAUNCH. Apple's first-release date wins (it's live
 * data), falling back to the curated date before Apple answers; same-day
 * launches break the tie on the newest version. Websites never take the slot.
 */
const latestLaunch = (released: LibraryGame[]): LibraryGame | undefined =>
  released
    .filter((game) => game.division !== "web")
    .map((game) => ({
      game,
      launched: timeOf(game.live?.releaseDate || game.releaseDate),
      updated: timeOf(game.live?.currentVersionReleaseDate),
    }))
    .sort((a, b) => b.launched - a.launched || b.updated - a.updated)[0]?.game;

const VALUES: { title: string; body: string }[] = [
  { title: "Original ideas", body: "Games and apps built around ideas designed to be different and memorable." },
  { title: "Fun first", body: "Gameplay comes first. Easy to pick up, satisfying to keep playing." },
  { title: "Always building", body: "New prototypes, new games, new apps — the slate never sits still." },
];

const Home = () => {
  useSeo({
    title: "DJ Games — Original Mobile Games, Apps and Websites",
    description: SITE.description,
  });

  const { games, released, submitted, concepts } = useGameLibrary();
  const live = useMemo(() => latestLaunch(released), [released]);
  const posts = sortedPosts().slice(0, 3);

  // What the studio makes, counted from the real library — a division with
  // nothing in it never appears. Web is the exception: it's a service we sell,
  // so it always shows, with an "available" note instead of a count.
  const divisions = useMemo(
    () =>
      DIVISIONS.map((division) => ({
        ...division,
        count: games.filter((game) => game.division === division.id).length,
      })).filter((division) => division.count > 0 || division.id === "web"),
    [games],
  );

  return (
    <>
      {/* HERO — the whole first screen is one product, one decision */}
      <section className="relative isolate overflow-hidden">
        <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <ParticleField className="-z-10" count={22} />

        {/* One centred column: with the phone gone, the type IS the hero. */}
        <div className="container flex min-h-[78vh] flex-col items-center justify-center py-16 text-center sm:py-20 lg:min-h-[calc(100vh-68px)]">
          <div className="animate-fade-up flex w-full max-w-3xl flex-col items-center">
            <p className="eyebrow">Games, apps and websites for a brighter tomorrow</p>

            <h1 className="display-title mt-4 text-7xl tracking-tight sm:text-8xl lg:text-9xl">
              DJ&nbsp;<span className="text-signal text-glow">Games</span>
            </h1>

            <p className="mt-4 text-xl font-light text-foreground/90 sm:text-2xl">
              Original mobile games and apps. Built to play.
            </p>

            {/* Web design lives right under the title — the studio's quiet second trade. Plain text, NOT a link, matches the line. */}
            <p className="mt-6 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              We also design + build websites
            </p>
          </div>
        </div>
      </section>

      {/* ANDROID CLOSED TEST — recruit band for Vexara's Google Play testing */}
      <section className="container">
        <div className="flex flex-col gap-6 border border-[#243044] bg-[#0a0e14] p-6 sm:flex-row sm:items-center">
          {ANDROID_TEST.scene ? (
            <img
              src={ANDROID_TEST.scene}
              alt="A night stone keep on a rock with city glow behind it, and an Android phone whose screen shows a stone gate outlined in purple light"
              width={1536}
              height={1024}
              loading="lazy"
              decoding="async"
              className="aspect-[16/9] w-full shrink-0 border border-[#243044] object-cover sm:w-64 md:w-72"
            />
          ) : null}
          <div className="min-w-0">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ember">{ANDROID_TEST.eyebrow}</p>
            <h2 className="display-title mt-2 text-2xl tracking-tight">{ANDROID_TEST.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ANDROID_TEST.bandBody}</p>
            <Link
              to="/android-test"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-md bg-signal px-5 font-display text-sm font-bold uppercase tracking-wide text-background transition-colors duration-300 hover:bg-foreground"
            >
              Join the test
            </Link>
          </div>
        </div>
      </section>

      {/* WHAT WE MAKE — one thin line of divisions, straight into the library */}
      {divisions.length > 0 ? (
        <section className="container">
          <Reveal>
            <ul className="no-scrollbar flex gap-6 overflow-x-auto border-y border-border/60 py-4 sm:justify-center sm:gap-10">
              {divisions.map((division) => (
                <li key={division.id}>
                  <Link
                    to={`/games?division=${division.id}`}
                    className="group inline-flex items-baseline gap-2 whitespace-nowrap font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-300 hover:text-signal"
                  >
                    {division.id === "web" ? "Created Sites" : division.label}
                    {division.count > 0 ? (
                      <span className="text-[0.6rem] text-muted-foreground/60 transition-colors group-hover:text-signal/70">
                        {division.count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      ) : null}

      {/* PRESS HOUSE — platform promo, directly under the hero */}
      <section className="container pb-2 pt-4 sm:pt-6">
        <PressHouseAd />
      </section>

      {/* LIVE NOW — exactly one product: always the newest launch */}
      {live ? (
        <section className="container pb-20 pt-16 sm:pb-24 sm:pt-20">
          <Reveal>
            <LatestLiveCard game={live} />
          </Reveal>
        </section>
      ) : null}

      {/* SUBMITTED TO APPLE — the launch pipeline, full-weight cards */}
      {submitted.length > 0 ? (
        <section className="container py-16 sm:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="The pipeline"
              title="Launching next"
              note="In review — launching on mobile next"
            />
          </Reveal>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {submitted.map((game, index) => (
              <Reveal key={game.slug} as="div" delay={index * 90} className="reveal-modern">
                <GameCard game={game} className="h-full" />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* EARLY CONCEPTS — deliberately small: not launching this week */}
      {concepts.length > 0 ? (
        <section className="container py-16 sm:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Early concepts"
              title="In Development"
              note="Early ideas — not launching this week"
            />
          </Reveal>

          <ul className="mt-8 space-y-3">
            {concepts.map((game, index) => (
              <Reveal key={game.slug} as="li" delay={index * 70}>
                <ConceptCard game={game} />
              </Reveal>
            ))}
          </ul>

          <Reveal className="mt-6" delay={140}>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
              These are first looks, not release dates. Follow along or{" "}
              <Link to="/coming-soon#notify" className="text-signal transition-colors hover:text-foreground">
                get notified
              </Link>
              .
            </p>
          </Reveal>
        </section>
      ) : null}

      {/* WHY DJ GAMES */}
      <section className="container py-16 sm:py-20">
        <Reveal>
          <SectionHeading eyebrow="Why DJ Games" title="Independent by design" />
        </Reveal>

        <Reveal delay={60}>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Independent studio. Games, apps — and websites. No ads-first junk. No pay-to-win.
          </p>
        </Reveal>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {VALUES.map((value, index) => (
            <Reveal key={value.title} delay={index * 90}>
              <article className="surface-card-interactive h-full p-6">
                <h3 className="display-title text-lg">{value.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* NEWS TEASER */}
      <section className="container py-16 sm:py-20">
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

        <ul className="mt-9 grid gap-5 md:grid-cols-3">
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

      {/* NOTIFY */}
      <section className="container pb-20 sm:pb-24">
        <Reveal>
          <NewsletterSignup />
        </Reveal>
      </section>
    </>
  );
};

export default Home;
