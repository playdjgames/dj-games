import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  /** Small right-aligned note shown on wide screens. */
  note?: string;
  action?: ReactNode;
  className?: string;
}

export const SectionHeading = ({ eyebrow, title, note, action, className }: SectionHeadingProps) => (
  <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
    <div>
      <p className="eyebrow">
        <span className="text-ember">//</span> {eyebrow}
      </p>
      <h2 className="display-title mt-2 text-3xl sm:text-4xl lg:text-[2.75rem]">{title}</h2>
    </div>

    {action ??
      (note ? (
        <p className="hidden font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground md:block">
          {note}
        </p>
      ) : null)}
  </div>
);
