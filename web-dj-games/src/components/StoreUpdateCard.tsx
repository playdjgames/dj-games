import { ArrowUpRight, PackageCheck, Rocket } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

import type { StoreUpdate } from "@/data/newsFeed";
import { cn } from "@/lib/utils";

interface StoreUpdateCardProps {
  update: StoreUpdate;
  /** "SEP 10, 2026" style date, already formatted by the page. */
  dateLabel: string;
  className?: string;
}

/**
 * A news row the site wrote itself, straight off the App Store: a launch or a
 * version update. Visually distinct from a written post — no wide key art, an
 * icon instead, and an "Auto" stamp so it never pretends to be a devlog.
 */
export const StoreUpdateCard = ({ update, dateLabel, className }: StoreUpdateCardProps) => {
  const isLaunch = update.kind === "launch";
  const Icon = isLaunch ? Rocket : PackageCheck;

  return (
    <Link
      to={`/games/${update.game.slug}`}
      className={cn(
        "surface-card game-accent group flex items-center gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 sm:gap-5",
        className,
      )}
      style={{ "--game-accent": update.game.accent } as CSSProperties}
    >
      <span
        className="game-accent-border grid h-12 w-12 shrink-0 place-items-center rounded-md border bg-surface-raised sm:h-14 sm:w-14"
        aria-hidden="true"
      >
        <Icon size={20} className="game-accent-text" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ember">
          {dateLabel}
          <span className="text-muted-foreground">/ {isLaunch ? "Release" : "Update"}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/40 px-2 py-0.5 text-[0.55rem] tracking-[0.16em] text-signal">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            Live from the App Store
          </span>
        </p>

        <h3 className="display-title mt-2 text-lg transition-colors group-hover:text-signal sm:text-xl">
          {update.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{update.summary}</p>
      </div>

      <ArrowUpRight
        size={20}
        className="hidden shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal sm:block"
        aria-hidden="true"
      />
    </Link>
  );
};
