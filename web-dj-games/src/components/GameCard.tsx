import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

import { StatusBadge } from "@/components/StatusBadge";
import { StoreButtons } from "@/components/StoreButtons";
import { divisionLabel } from "@/data/divisions";
import type { Game } from "@/data/games";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: Game;
  className?: string;
}

/**
 * Library card. Each game carries its own accent (`--game-accent`), so the
 * grid reads as a lineup of distinct titles instead of clones. Available apps
 * get a store button; everything else routes to its project page.
 */
export const GameCard = ({ game, className }: GameCardProps) => (
  <article
    className={cn(
      "surface-card game-accent game-accent-glow group flex flex-col overflow-hidden transition-all duration-300",
      className,
    )}
    style={{ "--game-accent": game.accent } as CSSProperties}
  >
    <Link
      to={`/games/${game.slug}`}
      className="relative block aspect-[16/9] overflow-hidden"
      aria-label={`${game.title} — learn more`}
    >
      {game.coverFit === "contain" ? (
        <>
          <img
            src={game.coverImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl saturate-150"
          />
          <div className="absolute inset-0 bg-background/55" />
          <img
            src={game.coverImage}
            alt={`${game.title} app icon`}
            loading="lazy"
            decoding="async"
            className="absolute left-1/2 top-1/2 h-[72%] w-auto -translate-x-1/2 -translate-y-1/2 rounded-[1.25rem] border border-white/15 shadow-2xl transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </>
      ) : (
        <img
          src={game.coverImage}
          alt={`${game.title} key art`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
    </Link>

    <div className="flex flex-1 flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={game.status} label={game.statusLabel} />
        {/* Division then genre, separated by a hairline — one quiet line, no extra chips. */}
        <span className="inline-flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="game-accent-text">{divisionLabel(game.division)}</span>
          <span aria-hidden="true" className="h-3 w-px bg-border" />
          {game.genre}
        </span>
      </div>

      <h3 className="display-title text-xl sm:text-2xl">{game.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{game.tagline}</p>

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
        <Link
          to={`/games/${game.slug}`}
          className="game-accent-text game-accent-border inline-flex min-h-[44px] items-center gap-2 rounded-md border px-4 font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300"
        >
          {game.status === "available" ? "Learn more" : "View project"}
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>

        {game.status === "available" ? (
          <StoreButtons
            appStoreUrl={game.appStoreUrl}
            googlePlayUrl={game.googlePlayUrl}
            gameTitle={game.title}
            size="sm"
          />
        ) : null}
      </div>
    </div>
  </article>
);
