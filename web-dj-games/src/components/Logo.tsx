import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Renders as a plain element instead of a link (used in the footer lockup). */
  asLink?: boolean;
}

/**
 * DJ Games wordmark: an angular ember "DJ" block paired with an outlined
 * "GAMES" lockup. Used in the navigation bar, footer, and brand moments.
 */
export const Logo = ({ className, asLink = true }: LogoProps) => {
  const mark = (
    <span className={cn("group inline-flex select-none items-center gap-2", className)}>
      <span
        className="relative flex h-9 items-center bg-ember px-2 font-display text-[1.35rem] font-black uppercase leading-none tracking-tight text-[#0a0e14] transition-transform duration-300 group-hover:-translate-y-0.5"
        style={{ clipPath: "polygon(0 0, 100% 0, 88% 100%, 0 100%)" }}
      >
        DJ
      </span>
      <span className="font-display text-[1.35rem] font-black uppercase leading-none tracking-[0.14em] text-foreground transition-colors duration-300 group-hover:text-signal">
        GAMES
      </span>
    </span>
  );

  if (!asLink) return mark;

  return (
    <Link to="/" aria-label="DJ Games — home" className="inline-flex">
      {mark}
    </Link>
  );
};
