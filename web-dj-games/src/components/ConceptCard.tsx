import { ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

import type { LibraryGame } from "@/data/library";
import { cn } from "@/lib/utils";

interface ConceptCardProps {
  game: LibraryGame;
  className?: string;
}

/**
 * Compact row for early concepts: small thumb, one-line hook, quiet badge.
 * Deliberately smaller than submitted titles — these are not launching soon.
 */
export const ConceptCard = ({ game, className }: ConceptCardProps) => (
  <Link
    to={`/games/${game.slug}`}
    className={cn(
      "surface-card game-accent group flex items-center gap-4 p-3.5 transition-all duration-300 hover:-translate-y-0.5 sm:p-4",
      className,
    )}
    style={{ "--game-accent": game.accent } as CSSProperties}
    aria-label={`${game.title} — early concept, view project page`}
  >
    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-border/70 sm:h-[72px] sm:w-32">
      <img
        src={game.coverImage}
        alt={`${game.title} concept art`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover opacity-80 grayscale transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
      />
    </div>

    <div className="min-w-0 flex-1">
      <h3 className="display-title text-base sm:text-lg">{game.title}</h3>
      <p className="mt-0.5 truncate text-[0.82rem] text-muted-foreground">{game.tagline}</p>
    </div>

    <span className="hidden shrink-0 rounded-full border border-border bg-surface-raised px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground sm:inline-flex">
      In development
    </span>

    <ChevronRight
      size={18}
      className="shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1"
      aria-hidden="true"
    />
  </Link>
);
