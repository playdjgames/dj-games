import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { StoreButtons } from "@/components/StoreButtons";
import type { Game } from "@/data/games";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: Game;
  className?: string;
}

/**
 * Reusable featured-game card. Everything it renders comes from the game entry
 * in `data/games.ts`, so new titles appear without touching this component.
 */
export const GameCard = ({ game, className }: GameCardProps) => (
  <article className={cn("surface-card-interactive corner-ticks group flex flex-col overflow-hidden", className)}>
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

    <div className="flex flex-1 flex-col gap-4 p-5">
      <div>
        <h3 className="display-title text-xl sm:text-2xl">{game.title}</h3>

        <ul className="mt-3 flex flex-wrap gap-2">
          <li className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-signal">
            {game.genre}
          </li>
          {game.platforms.map((platform) => (
            <li
              key={platform}
              className="rounded-full border border-border bg-surface-raised px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground"
            >
              {platform}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{game.tagline}</p>

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
        <Link
          to={`/games/${game.slug}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-signal/45 px-4 font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-signal transition-all duration-300 hover:bg-signal hover:text-primary-foreground"
        >
          Learn more
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>

        <StoreButtons
          appStoreUrl={game.appStoreUrl}
          googlePlayUrl={game.googlePlayUrl}
          gameTitle={game.title}
          size="sm"
        />
      </div>
    </div>
  </article>
);
