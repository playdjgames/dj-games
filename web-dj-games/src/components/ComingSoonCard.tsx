import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

import { StatusBadge } from "@/components/StatusBadge";
import { divisionLabel } from "@/data/divisions";
import type { LibraryGame } from "@/data/library";
import { cn } from "@/lib/utils";

interface ComingSoonCardProps {
  game: LibraryGame;
  className?: string;
}

/**
 * Large card for submitted titles — the tier closest to launch. Desaturated
 * art that colors in on hover, real review status, and the project hook.
 */
export const ComingSoonCard = ({ game, className }: ComingSoonCardProps) => (
  <article
    className={cn(
      "surface-card game-accent game-accent-glow group overflow-hidden transition-all duration-300",
      className,
    )}
    style={{ "--game-accent": game.accent } as CSSProperties}
  >
    <Link to={`/games/${game.slug}`} className="flex flex-col sm:flex-row">
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden sm:aspect-auto sm:h-auto sm:w-[44%]">
        <img
          src={game.coverImage}
          alt={`${game.title} key art`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover opacity-70 grayscale transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-90 group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface/85 sm:to-surface" />
        <StatusBadge
          status={game.status}
          label={game.statusLabel}
          className="absolute left-4 top-4 backdrop-blur"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="display-title text-lg sm:text-xl">{game.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{game.tagline}</p>

        <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-2">
          <span className="game-accent-text font-mono text-[0.58rem] uppercase tracking-[0.14em]">
            {divisionLabel(game.division)}
          </span>
          {game.ageRating ? (
            <span className="rounded-full border border-border bg-surface-raised px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground">
              {game.ageRating}
            </span>
          ) : null}
          <span className="game-accent-text inline-flex items-center gap-1.5 font-mono text-[0.66rem] uppercase tracking-[0.16em]">
            View project
            <ArrowUpRight
              size={14}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  </article>
);
