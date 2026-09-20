import type { GameStatus } from "@/data/games";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<GameStatus, string> = {
  // Live product — the lime signal.
  available: "border-signal/50 bg-signal/10 text-signal",
  // In Apple's review pipeline — hot orange, the "almost there" tier.
  submitted: "border-ember/50 bg-ember/10 text-ember",
  // Early concept — deliberately quiet, so it never reads as imminent.
  concept: "border-border bg-surface-raised text-muted-foreground",
};

const DEFAULT_LABELS: Record<GameStatus, string> = {
  available: "Live now",
  submitted: "Submitted to Apple",
  concept: "In development",
};

interface StatusBadgeProps {
  status: GameStatus;
  /** Override the default tier label (e.g. Apple's live "In review with Apple"). */
  label?: string;
  className?: string;
}

/** Tier badge: LIVE NOW / SUBMITTED TO APPLE / IN DEVELOPMENT. */
export const StatusBadge = ({ status, label, className }: StatusBadgeProps) => (
  <span
    className={cn(
      "inline-flex w-fit items-center rounded-md border px-2.5 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.16em]",
      STATUS_STYLES[status],
      className,
    )}
  >
    {label ?? DEFAULT_LABELS[status]}
  </span>
);
