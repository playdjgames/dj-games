import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import type { LibraryGame } from "@/data/library";
import { isWithApple } from "@/data/prerelease";
import { cn } from "@/lib/utils";

interface ComingSoonCardProps {
  game: LibraryGame;
  className?: string;
}

/** Horizontal in-development card: desaturated concept art plus an ember status badge. */
export const ComingSoonCard = ({ game, className }: ComingSoonCardProps) => (
  <article className={cn("surface-card-interactive group overflow-hidden", className)}>
    <Link to={`/games/${game.slug}`} className="flex flex-col sm:flex-row">
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden sm:aspect-auto sm:h-auto sm:w-[44%]">
        <img
          src={game.coverImage}
          alt={`${game.title} concept art`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover opacity-70 grayscale transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-90 group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface/85 sm:to-surface" />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="display-title text-lg sm:text-xl">{game.title}</h3>

        <span
          className={cn(
            "w-fit rounded-md border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em]",
            // Once Apple has the build, the status is news — make it glow.
            game.reviewStage && isWithApple(game.reviewStage)
              ? "border-signal/50 bg-signal/10 text-signal"
              : "border-ember/50 bg-ember/10 text-ember",
          )}
        >
          {game.statusLabel}
        </span>

        <p className="text-sm leading-relaxed text-muted-foreground">{game.tagline}</p>

        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-signal">
          View project
          <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  </article>
);
