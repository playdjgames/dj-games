import {
  ArrowLeft,
  Brush,
  Camera,
  Check,
  Flag,
  Link2,
  Map,
  Music,
  Play,
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
import { useCallback, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Reveal } from "@/components/Reveal";
import { StoreButtons } from "@/components/StoreButtons";
import { LiveSyncNote, PrereleaseSyncNote } from "@/components/LiveSyncNote";
import type { GameFeature } from "@/data/games";
import { formatSyncDate, useGameLibrary } from "@/data/library";
import { canonicalUrl, isLive } from "@/data/site";
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
};

const XGlyph = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const RedditGlyph = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.605a3.11 3.11 0 0 1 .042.52c0 2.694-3.13 4.87-6.994 4.87-3.864 0-6.994-2.176-6.994-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const FacebookGlyph = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.025 1.792-4.696 4.533-4.696 1.313 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);

const GameDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { bySlug, isSyncing } = useGameLibrary();
  const game = bySlug(slug);
  const [copied, setCopied] = useState<boolean>(false);

  useSeo({
    title: game ? `${game.title} — ${game.genre} by DJ Games` : "Game not found — DJ Games",
    description: game
      ? `${game.tagline} ${game.title} is an original ${game.genre.toLowerCase()} from DJ Games for ${game.platforms.join(", ")}.`
      : "This game could not be found.",
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

  const shareText = encodeURIComponent(`${game.title} — ${game.tagline}`);
  const encodedUrl = encodeURIComponent(shareUrl);
  const isPortraitShots = game.screenshotAspect === "portrait";

  const shareTargets: { label: string; href: string; glyph: typeof XGlyph }[] = [
    { label: "Share on X", href: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`, glyph: XGlyph },
    { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, glyph: FacebookGlyph },
    { label: "Share on Reddit", href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${shareText}`, glyph: RedditGlyph },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative isolate">
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
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-background/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-transparent to-transparent" />
        </div>

        <div className="container flex min-h-[52vh] flex-col justify-end py-12 sm:min-h-[58vh] sm:py-16">
          <Link
            to="/games"
            className="inline-flex w-fit min-h-[44px] items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-foreground/85 transition-colors hover:text-signal"
          >
            <ArrowLeft size={16} />
            Back to games
          </Link>

          <div className="mt-5 flex items-center gap-5">
            {game.coverFit === "contain" ? (
              <img
                src={game.coverImage}
                alt={`${game.title} app icon`}
                decoding="async"
                className="hidden h-24 w-24 shrink-0 rounded-[1.35rem] border border-white/15 shadow-2xl sm:block lg:h-28 lg:w-28"
              />
            ) : null}

            <div>
              <h1 className="display-title text-5xl sm:text-6xl lg:text-7xl">{game.title}</h1>
              <p className="mt-2 font-display text-xl uppercase tracking-[0.3em] text-foreground/50 sm:text-2xl">
                {game.genre}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="container py-14 sm:py-16">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="display-title text-2xl leading-tight sm:text-3xl">{game.tagline}</h2>

              <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 font-mono text-[0.72rem] uppercase tracking-[0.14em]">
                <div className="flex items-center gap-2">
                  <dt className="text-signal">Genre:</dt>
                  <dd className="text-muted-foreground">{game.genre}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="text-signal">Platform:</dt>
                  <dd className="text-muted-foreground">{game.platforms.join(", ")}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="text-signal">Status:</dt>
                  <dd className="text-muted-foreground">{game.statusLabel}</dd>
                </div>
                {game.price ? (
                  <div className="flex items-center gap-2">
                    <dt className="text-signal">Price:</dt>
                    <dd className="text-muted-foreground">{game.price}</dd>
                  </div>
                ) : null}
                {game.live?.version ?? game.prerelease?.version ? (
                  <div className="flex items-center gap-2">
                    <dt className="text-signal">Version:</dt>
                    <dd className="text-muted-foreground">{game.live?.version ?? game.prerelease?.version}</dd>
                  </div>
                ) : null}
                {game.ageRating ? (
                  <div className="flex items-center gap-2">
                    <dt className="text-signal">Rated:</dt>
                    <dd className="text-muted-foreground">{game.ageRating}</dd>
                  </div>
                ) : null}
                {game.live?.currentVersionReleaseDate ? (
                  <div className="flex items-center gap-2">
                    <dt className="text-signal">Updated:</dt>
                    <dd className="text-muted-foreground">{formatSyncDate(game.live.currentVersionReleaseDate)}</dd>
                  </div>
                ) : null}
              </dl>

              {game.live ? <LiveSyncNote isSyncing={isSyncing} /> : null}
              {!game.live && game.prerelease ? <PrereleaseSyncNote /> : null}
            </div>

            <p className="text-[1rem] leading-relaxed text-muted-foreground">{game.description}</p>
          </div>
        </Reveal>
      </section>

      {/* SCREENSHOTS */}
      {game.screenshots.length > 0 ? (
        <section className="pb-14 sm:pb-16">
          <div className="container">
            <Reveal>
              <p className="eyebrow mb-5">
                <span className="text-ember">//</span> Gameplay
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

      {/* FEATURES */}
      {game.features.length > 0 ? (
        <section className="container pb-14 sm:pb-16">
          <Reveal>
            <p className="eyebrow mb-5">
              <span className="text-ember">//</span> Features
            </p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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

      {/* TRAILER + DOWNLOAD */}
      <section className="container grid gap-8 pb-20 sm:pb-24 lg:grid-cols-[1.35fr_1fr]">
        <Reveal>
          <p className="eyebrow mb-5">
            <span className="text-ember">//</span> Trailer
          </p>

          {isLive(game.trailerUrl) ? (
            <div className="surface-card overflow-hidden">
              <div className="aspect-video w-full">
                <iframe
                  src={game.trailerUrl}
                  title={`${game.title} official trailer`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
            </div>
          ) : (
            <div className="surface-card corner-ticks relative aspect-video overflow-hidden">
              <img
                src={game.screenshots[0] ?? game.coverImage}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover opacity-55"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/45">
                <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-foreground/70 text-foreground/90">
                  <Play size={30} className="ml-1 fill-current" />
                </span>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-foreground/80">
                  Trailer coming soon
                </p>
              </div>
              <span className="absolute bottom-4 left-4 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-foreground/70">
                Official trailer
              </span>
            </div>
          )}
        </Reveal>

        <Reveal delay={90}>
          <div className="surface-card h-full p-7">
            <h2 className="display-title text-xl">Get {game.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {game.status === "available"
                ? `Available now on ${game.platforms.join(" and ")}.`
                : `${game.statusLabel} — follow along for release news.`}
            </p>

            <StoreButtons
              className="mt-6"
              appStoreUrl={game.appStoreUrl}
              googlePlayUrl={game.googlePlayUrl}
              gameTitle={game.title}
            />

            {isLive(game.websiteUrl) ? (
              <a
                href={game.websiteUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-signal transition-colors hover:text-foreground"
              >
                Official game site
              </a>
            ) : null}

            <h3 className="mt-8 font-mono text-[0.66rem] uppercase tracking-[0.22em] text-signal">Share this game</h3>
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {shareTargets.map(({ label, href, glyph: Glyph }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-raised text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-signal/50 hover:text-signal"
                  >
                    <Glyph />
                  </a>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={copyLink}
                  aria-label="Copy link to this game"
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-raised transition-all duration-300 hover:-translate-y-0.5 hover:border-signal/50 hover:text-signal",
                    copied ? "border-signal/60 text-signal" : "text-muted-foreground",
                  )}
                >
                  {copied ? <Check size={18} /> : <Link2 size={18} />}
                </button>
              </li>
            </ul>
          </div>
        </Reveal>
      </section>
    </>
  );
};

export default GameDetail;
