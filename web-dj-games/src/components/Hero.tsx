import { ParticleField } from "@/components/ParticleField";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const HERO_IMAGE =
  "https://r2-pub.rork.com/projects/2s7937nfb5j5e0l2chd6r/assets/c5ec20e2-febc-4769-bcf9-7a3f42e64c8c.png";

interface HeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  description?: string;
  children?: ReactNode;
  /** Vertical stamp rendered on the right on wide screens. */
  stamp?: string[];
  /** Shorter variant used by secondary pages. */
  compact?: boolean;
  className?: string;
}

/**
 * Shared brand hero: full-bleed alien-horizon artwork, drifting particles,
 * grid backdrop, and a dark scrim on the left so headlines stay readable.
 */
export const Hero = ({
  eyebrow,
  title,
  subtitle,
  description,
  children,
  stamp,
  compact = false,
  className,
}: HeroProps) => (
  <section className={cn("relative isolate overflow-hidden", className)}>
    <div className="absolute inset-0 -z-10">
      <img
        src={HERO_IMAGE}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70" />
    </div>

    <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
    <ParticleField className="-z-10" count={compact ? 16 : 28} />

    <div
      className={cn(
        "container relative flex flex-col justify-center",
        compact ? "min-h-[42vh] py-16 sm:py-20" : "min-h-[76vh] py-20 sm:py-28",
      )}
    >
      <div className="flex items-start gap-6">
        <span
          className="mt-2 hidden w-px self-stretch bg-gradient-to-b from-transparent via-signal/50 to-transparent lg:block"
          aria-hidden="true"
        />

        <div className="max-w-2xl animate-fade-up">
          <p className="eyebrow">{eyebrow}</p>

          <h1
            className={cn(
              "display-title mt-4 text-balance",
              compact ? "text-4xl sm:text-5xl lg:text-6xl" : "text-5xl sm:text-6xl lg:text-7xl",
            )}
          >
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-5 text-xl font-light text-foreground/90 sm:text-2xl">{subtitle}</p>
          ) : null}

          {description ? (
            <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-muted-foreground">{description}</p>
          ) : null}

          {children ? <div className="mt-9">{children}</div> : null}
        </div>
      </div>
    </div>

    {stamp && stamp.length > 0 ? (
      <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 text-right xl:block">
        <ul className="space-y-1.5">
          {stamp.map((line) => (
            <li key={line} className="font-mono text-[0.72rem] uppercase tracking-[0.4em] text-foreground/45">
              {line}
            </li>
          ))}
        </ul>
        <span className="ml-auto mt-4 block h-px w-16 bg-foreground/25" aria-hidden="true" />
      </div>
    ) : null}
  </section>
);
