import { ArrowRight, Camera, Tag, Wrench } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { ConceptCard } from "@/components/ConceptCard";
import { GameCard } from "@/components/GameCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ParticleField } from "@/components/ParticleField";
import { PressHouseAd } from "@/components/PressHouseAd";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { StoreButtons } from "@/components/StoreButtons";
import { DIVISIONS } from "@/data/divisions";
import { formatPostDate, sortedPosts } from "@/data/news";
import { useGameLibrary } from "@/data/library";
import { SITE } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";

/** The one live product — everything else on this page is pipeline. */
const LIVE_APP = "everything-diy";

const HERO_BULLETS: { icon: typeof Wrench; text: string }[] = [
  { icon: Wrench, text: "Step-by-step projects" },
  { icon: Camera, text: "Camera identifies tools & materials" },
  { icon: Tag, text: "Price + where to buy" },
];

const VALUES: { title: string; body: string }[] = [
  { title: "Original ideas", body: "Games and apps built around ideas designed to be different and memorable." },
  { title: "Fun first", body: "Gameplay comes first. Easy to pick up, satisfying to keep playing." },
  { title: "Always building", body: "New prototypes, new games, new apps — the slate never sits still." },
];

const Home = () => {
  useSeo({
    title: "DJ Games — Original iOS Games, Apps and Websites",
    description: SITE.description,
  });

  const { games, released, submitted, concepts } = useGameLibrary();
  const live = released.find((game) => game.slug === LIVE_APP) ?? released[0];
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
              Original iOS games and apps. Built to play.
            </p>

            {/* Web design lives right under the title — the studio's quiet second trade. Plain text, NOT a link. */}
            <p className="mt-6 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              We also design + build <span className="text-ember">websites</span>
            </p>
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

      {/* AVAILABLE NOW — exactly one product, no competition for attention */}
      {live ? (
        <section className="container py-16 sm:py-20">
          <Reveal>
            <SectionHeading eyebrow="Available now" title="Everything DIY" note="Out now · iPhone" />
          </Reveal>

          <Reveal delay={70}>
            <div className="surface-card corner-ticks mt-8 grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="text-[1.02rem] leading-relaxed text-muted-foreground">{live.tagline}</p>

                <ul className="mt-6 space-y-3.5">
                  {HERO_BULLETS.map((bullet) => (
                    <li key={bullet.text} className="flex items-center gap-3.5">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-signal/30 bg-signal/10 text-signal">
                        <bullet.icon size={18} />
                      </span>
                      <span className="text-[0.95rem] font-medium">{bullet.text}</span>
                    </li>
                  ))}
                </ul>

                {live.jobs ? (
                  <div className="mt-7 flex flex-wrap gap-2">
                    {live.jobs.map((job) => (
                      <span
                        key={job}
                        className="rounded-full border border-border bg-surface-raised px-3.5 py-1.5 font-mono text-[0.64rem] uppercase tracking-[0.12em] text-foreground/80"
                      >
                        {job}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col items-stretch justify-center gap-4 border-t border-border/60 pt-7 lg:items-start lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Free · {live.price ?? "FREE"} · iPhone
                </p>
                <StoreButtons
                  appStoreUrl={live.appStoreUrl}
                  googlePlayUrl={live.googlePlayUrl}
                  gameTitle={live.title}
                />
                <Link
                  to={`/games/${live.slug}`}
                  className="inline-flex min-h-[44px] items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-signal transition-colors hover:text-foreground"
                >
                  Learn more
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      ) : null}

      {/* SUBMITTED TO APPLE — the launch pipeline, full-weight cards */}
      {submitted.length > 0 ? (
        <section className="container py-16 sm:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="The pipeline"
              title="Submitted to Apple"
              note="In review — launching on the App Store next"
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
