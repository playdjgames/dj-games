import { ArrowRight, Camera, Tag, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

import { ConceptCard } from "@/components/ConceptCard";
import { GameCard } from "@/components/GameCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ParticleField } from "@/components/ParticleField";
import { PressHouseAd } from "@/components/PressHouseAd";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { StoreButtons } from "@/components/StoreButtons";
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
    title: "DJ Games — Original iOS Games and Apps",
    description: SITE.description,
  });

  const { released, submitted, concepts } = useGameLibrary();
  const live = released.find((game) => game.slug === LIVE_APP) ?? released[0];
  const posts = sortedPosts().slice(0, 3);

  return (
    <>
      {/* HERO — the whole first screen is one product, one decision */}
      <section className="relative isolate overflow-hidden">
        <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <ParticleField className="-z-10" count={22} />

        <div className="container grid items-center gap-10 py-12 sm:py-16 lg:min-h-[calc(100vh-68px)] lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-10">
          <div className="max-w-xl animate-fade-up">
            <p className="eyebrow">Games and apps for a brighter tomorrow</p>

            <h1 className="display-title mt-4 text-6xl tracking-tight sm:text-7xl lg:text-8xl">
              DJ&nbsp;<span className="text-signal text-glow">Games</span>
            </h1>

            <p className="mt-4 text-xl font-light text-foreground/90 sm:text-2xl">
              Original iOS games and apps. Built to play.
            </p>

            {live ? (
              <>
                <p className="status-chip mt-6 border-signal/50 bg-signal/10 text-signal">
                  <span className="relative inline-flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
                  </span>
                  Live now · {live.price ?? "FREE"}
                </p>

                <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-muted-foreground">
                  Every DIY project, explained step by step — tools, where to get them, and a camera that helps identify what you're looking at.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href={live.appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-md bg-signal px-7 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98]"
                  >
                    Download on the App Store
                  </a>
                  <Link
                    to="/coming-soon"
                    className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-md border border-ember/60 px-7 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ember transition-all duration-300 hover:bg-ember hover:text-primary-foreground hover:shadow-ember active:scale-[0.98]"
                  >
                    See what's coming
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </>
            ) : null}
          </div>

          {/* PRODUCT — a real app in a phone frame, not atmosphere */}
          {live ? (
            <Reveal className="relative mx-auto w-full max-w-[300px] lg:max-w-[330px]">
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/20 blur-[100px]"
                aria-hidden="true"
              />
              <div className="relative overflow-hidden rounded-[2.4rem] border border-white/15 bg-[#070a09] p-2.5 shadow-2xl shadow-black/60">
                <div className="absolute left-1/2 top-4 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black/80" aria-hidden="true" />
                <img
                  src="/apps/everything-diy-1.png"
                  alt="Everything DIY running on iPhone"
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[9/19.5] w-full rounded-[1.9rem] object-cover object-top"
                />
              </div>
              <p className="mt-4 text-center font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                {live.title} — live on the App Store
              </p>
            </Reveal>
          ) : null}
        </div>
      </section>

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
            Independent studio. No ads-first junk. No pay-to-win.
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
