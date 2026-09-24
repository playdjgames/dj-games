import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Brush,
  Camera,
  Check,
  Flag,
  Link2,
  Map,
  Music,
  Ruler,
  Search,
  Shield,
  Sparkles,
  Swords,
  Tag,
  Trophy,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { LiveSyncNote, PrereleaseSyncNote } from "@/components/LiveSyncNote";
import { Reveal } from "@/components/Reveal";
import { StatusBadge } from "@/components/StatusBadge";
import { StoreButtons } from "@/components/StoreButtons";
import { divisionLabel } from "@/data/divisions";
import type { GameFeature } from "@/data/games";
import { formatSyncDate, useGameLibrary } from "@/data/library";
import { canonicalUrl, isLive as isLinkLive, SITE } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

const FEATURE_ICONS: Record<GameFeature["icon"], LucideIcon> = {
  flag: Flag,
  brush: Brush,
  trophy: Trophy,
  swords: Swords,
  shield: Shield,
  zap: Zap,
  map: Map,
  users: Users,
  music: Music,
  sparkles: Sparkles,
  camera: Camera,
  wrench: Wrench,
  search: Search,
  tag: Tag,
  ruler: Ruler,
};

const GameDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { bySlug, isSyncing, released, submitted } = useGameLibrary();
  const game = bySlug(slug);
  const [copied, setCopied] = useState<boolean>(false);

  useSeo({
    title: game?.seoTitle ?? "Game not found — DJ Games",
    description: game?.seoDescription ?? "This game could not be found.",
    image: game?.coverImage,
  });

  // Share links use the custom domain once it serves the site, otherwise the current origin,
  // so a copied link never points at a URL that redirects or 404s.
  const shareUrl = typeof window !== "undefined" ? canonicalUrl(window.location.pathname) : "";

  const copyLink = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Couldn't copy the link", { description: "Copy it from your browser's address bar instead." });
    }
  }, [shareUrl]);

  if (!game) return <Navigate to="/games" replace />;

  const isLive = game.status === "available";
  const isConcept = game.status === "concept";
  const isPortraitShots = game.screenshotAspect === "portrait";
  const paragraphs = game.description.split("\n\n");
  const accentStyle = { "--game-accent": game.accent } as CSSProperties;

  return (
    <>
      {/* HERO */}
      <section className="game-accent relative isolate" style={accentStyle}>
        <div className="absolute inset-0 -z-10">
          <img
            src={game.coverImage}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            className={cn(
              "h-full w-full object-cover",
              game.coverFit === "contain" ? "scale-125 blur-3xl saturate-150" : undefined,
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-transparent to-transparent" />
        </div>

        <div className="container flex min-h-[46vh] flex-col justify-end py-12 sm:min-h-[52vh] sm:py-16">
          <Link
            to="/games"
            className="inline-flex w-fit min-h-[44px] items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-foreground/85 transition-colors hover:text-signal"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <div className="mt-5 flex items-end gap-5">
            {game.coverFit === "contain" ? (
              <img
                src={game.coverImage}
                alt={`${game.title} app icon`}
                decoding="async"
                className="hidden h-24 w-24 shrink-0 rounded-[1.35rem] border border-white/15 shadow-2xl sm:block lg:h-28 lg:w-28"
              />
            ) : null}

            <div>
              <StatusBadge status={game.status} label={game.statusLabel} className="mb-3" />
              <h1 className="display-title text-5xl sm:text-6xl lg:text-7xl">{game.title}</h1>
              {game.taglineStatement ? (
                <p className="mt-3 max-w-2xl font-display text-2xl font-bold leading-snug text-white sm:text-3xl lg:text-4xl">
                  {game.tagline}
                </p>
              ) : (
                <p className="game-accent-text mt-2 font-display text-lg uppercase tracking-[0.22em] sm:text-xl">
                  {game.tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW — the first paragraph always says what this IS, plainly */}
      <section className="container py-12 sm:py-14">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <dl className="flex flex-wrap gap-x-8 gap-y-4 font-mono text-[0.7rem] uppercase tracking-[0.14em]">
                <div>
                  <dt className="text-muted-foreground">Division</dt>
                  <dd className="game-accent-text mt-1">{divisionLabel(game.division)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Platform</dt>
                  <dd className="mt-1 text-foreground">{game.platforms.join(", ")}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-1 text-foreground">{game.statusLabel}</dd>
                </div>
                {game.price ? (
                  <div>
                    <dt className="text-muted-foreground">Price</dt>
                    <dd className="mt-1 text-foreground">{game.price}</dd>
                  </div>
                ) : null}
                {game.ageRating ? (
                  <div>
                    <dt className="text-muted-foreground">Rated</dt>
                    <dd className="mt-1 text-foreground">{game.ageRating}</dd>
                  </div>
                ) : null}
                {game.live?.version ?? game.prerelease?.version ? (
                  <div>
                    <dt className="text-muted-foreground">Version</dt>
                    <dd className="mt-1 text-foreground">{game.live?.version ?? game.prerelease?.version}</dd>
                  </div>
                ) : null}
                {game.live?.currentVersionReleaseDate ? (
                  <div>
                    <dt className="text-muted-foreground">Updated</dt>
                    <dd className="mt-1 text-foreground">{formatSyncDate(game.live.currentVersionReleaseDate)}</dd>
                  </div>
                ) : null}
              </dl>

              {game.live ? <LiveSyncNote className="mt-5" isSyncing={isSyncing} /> : null}
              {!game.live && game.prerelease ? <PrereleaseSyncNote className="mt-5" /> : null}

              {/* Everything DIY's example jobs — what the app is FOR, immediately */}
              {game.jobs ? (
                <div className="mt-7">
                  <p className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-muted-foreground">
                    Three jobs it does today
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {game.jobs.map((job) => (
                      <li
                        key={job}
                        className="rounded-full border border-border bg-surface-raised px-3.5 py-1.5 font-mono text-[0.64rem] uppercase tracking-[0.12em] text-foreground/80"
                      >
                        {job}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="space-y-4 text-[1rem] leading-relaxed text-muted-foreground">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* SCREENSHOTS */}
      {game.screenshots.length > 0 ? (
        <section className="pb-12 sm:pb-14">
          <div className="container">
            <Reveal>
              <p className="eyebrow mb-5">
                <span className="text-ember">//</span> Screenshots
              </p>
            </Reveal>
          </div>

          <Reveal>
            <ul className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:px-[max(1.25rem,calc((100vw-1360px)/2+1.25rem))]">
              {game.screenshots.map((shot, index) => (
                <li
                  key={shot}
                  className={cn(
                    "shrink-0 snap-start",
                    isPortraitShots
                      ? "w-[62vw] sm:w-[38vw] lg:w-[264px]"
                      : "w-[86vw] sm:w-[52vw] lg:w-[calc((1360px-2.5rem-3rem)/4)]",
                  )}
                >
                  <div className="surface-card overflow-hidden">
                    <img
                      src={shot}
                      alt={`${game.title} screenshot ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className={cn(
                        "w-full object-cover",
                        isPortraitShots ? "aspect-[9/19.5]" : "aspect-[16/10]",
                      )}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      ) : null}

      {/* WHAT'S NEW — Apple's own release notes for the current version */}
      {game.live?.releaseNotes ? (
        <section className="container pb-12 sm:pb-14">
          <Reveal>
            <p className="eyebrow mb-5">
              <span className="text-ember">//</span> What&rsquo;s new in {game.live.version}
            </p>
          </Reveal>

          <Reveal delay={60}>
            <article className="game-accent surface-card p-6 sm:p-8" style={accentStyle}>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                Released {formatSyncDate(game.live.currentVersionReleaseDate)} · pulled live from the App Store
              </p>
              <div className="mt-4 space-y-3 text-[0.98rem] leading-relaxed text-muted-foreground">
                {game.live.releaseNotes
                  .split("\n")
                  .map((line) => line.trim())
                  .filter((line) => line.length > 0)
                  .map((line, index) => (
                    <p key={line.slice(0, 40)} className={index === 0 ? "font-display text-lg font-bold text-foreground" : undefined}>
                      {line}
                    </p>
                  ))}
              </div>
            </article>
          </Reveal>
        </section>
      ) : null}

      {/* FEATURES */}
      {game.features.length > 0 ? (
        <section className="container pb-12 sm:pb-14">
          <Reveal>
            <p className="eyebrow mb-5">
              <span className="text-ember">//</span> Features
            </p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {game.features.map((feature, index) => {
              const Icon = FEATURE_ICONS[feature.icon];
              return (
                <Reveal key={feature.title} delay={index * 80}>
                  <article className="surface-card-interactive flex h-full gap-4 p-6">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-signal/30 bg-signal/10 text-signal">
                      <Icon size={22} />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold">{feature.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* FAQ — currently Everything DIY only */}
      {game.faq && game.faq.length > 0 ? (
        <section className="container pb-12 sm:pb-14">
          <Reveal>
            <p className="eyebrow mb-5">
              <span className="text-ember">//</span> Questions
            </p>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-3">
            {game.faq.map((item, index) => (
              <Reveal key={item.question} delay={index * 80}>
                <article className="surface-card h-full p-6">
                  <h3 className="font-display text-[1.05rem] font-bold">{item.question}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* CTA + SHARE */}
      <section className="container pb-20 sm:pb-24">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Reveal>
            <div
              className="game-accent surface-card corner-ticks h-full p-7 sm:p-9"
              style={accentStyle}
            >
              <h2 className="display-title text-2xl">
                {isLive
                  ? game.division === "web"
                    ? "You're standing on it"
                    : `Get ${game.title}`
                  : isConcept
                    ? `Follow ${game.title}`
                    : `${game.title} is coming`}
              </h2>
              <p className="mt-2.5 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
                {isLive
                  ? game.division === "web"
                    ? "This site is the project — designed and built in-house by DJ Games, statuses and all. Need one like it? We build for others too."
                    : `Available now on the App Store for iPhone${game.price ? ` — ${game.price}` : ""}.`
                  : isConcept
                    ? "Early concept — not launching this week. First looks and the release window land here and in the newsletter first."
                    : "A real build is in review with Apple. Get one email the day it goes live — no spam, no drip campaign."}
              </p>

              {isLive ? (
                game.division === "web" ? (
                  isLinkLive(SITE.email) ? (
                    <a
                      href={`mailto:${SITE.email}`}
                      className="game-accent-border mt-6 inline-flex min-h-[52px] items-center gap-2.5 rounded-md border bg-surface-raised px-6 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition-all duration-300 hover:bg-signal/10"
                      style={{ color: game.accent }}
                    >
                      Start a project
                      <ArrowRight size={16} />
                    </a>
                  ) : null
                ) : (
                  <StoreButtons
                    className="mt-6"
                    appStoreUrl={game.appStoreUrl}
                    googlePlayUrl={game.googlePlayUrl}
                    gameTitle={game.title}
                  />
                )
              ) : (
                <Link
                  to="/coming-soon#notify"
                  className="game-accent-border mt-6 inline-flex min-h-[52px] items-center gap-2.5 rounded-md border bg-surface-raised px-6 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition-all duration-300 hover:bg-signal/10"
                  style={{ color: game.accent }}
                >
                  <Bell size={16} />
                  Notify me at launch
                </Link>
              )}

              <h3 className="mt-9 font-mono text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">
                Share this project
              </h3>
              <button
                type="button"
                onClick={copyLink}
                className={cn(
                  "mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-md border px-4 font-mono text-[0.68rem] uppercase tracking-[0.16em] transition-colors duration-300",
                  copied
                    ? "border-signal/60 text-signal"
                    : "border-border text-muted-foreground hover:border-signal/50 hover:text-signal",
                )}
              >
                {copied ? <Check size={15} /> : <Link2 size={15} />}
                {copied ? "Link copied" : "Copy link"}
              </button>
            </div>
          </Reveal>

          {/* MORE FROM THE STUDIO */}
          <Reveal delay={90}>
            <div className="surface-card h-full p-7">
              <h2 className="display-title text-xl">More from DJ Games</h2>
              <ul className="mt-5 space-y-4">
                {[
                  ...released.filter((item) => item.slug !== game.slug),
                  ...submitted.slice(0, 2),
                ]
                  .slice(0, 3)
                  .map((item) => (
                    <li key={item.slug}>
                      <Link
                        to={`/games/${item.slug}`}
                        className="group flex items-center gap-3.5 rounded-md border border-border/70 p-3 transition-colors hover:border-signal/40"
                      >
                        <img
                          src={item.coverImage}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-12 w-16 shrink-0 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[0.92rem] font-bold">{item.title}</p>
                          <p className="truncate text-[0.78rem] text-muted-foreground">{item.tagline}</p>
                        </div>
                        <ArrowRight
                          size={16}
                          className="shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5"
                        />
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default GameDetail;
