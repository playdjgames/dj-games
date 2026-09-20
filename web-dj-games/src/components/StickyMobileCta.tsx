import { Apple, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { FEATURED_APP_URL } from "@/data/site";

/** Admin routes where the sales bar has no business appearing. */
const HIDDEN_PREFIXES = ["/media", "/subscribers"];

/**
 * Sticky conversion bar for phones: the one live app and the notify list,
 * always one tap away. Hidden above `lg` where the header CTA is visible.
 */
export const StickyMobileCta = () => {
  const { pathname } = useLocation();

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <>
      {/* Spacer so the bar never covers the footer's legal line. */}
      <div className="h-[74px] lg:hidden" aria-hidden="true" />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),0.65rem)] pt-2.5 backdrop-blur-xl lg:hidden">
        <div className="flex gap-2.5">
          <a
            href={FEATURED_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-md bg-signal px-4 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all duration-300 active:scale-[0.98]"
          >
            <Apple size={16} className="fill-current" strokeWidth={0} />
            Get Everything DIY
          </a>
          <Link
            to="/coming-soon#notify"
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-md border border-signal/50 px-4 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-signal transition-colors duration-300 hover:bg-signal/10 active:scale-[0.98]"
          >
            <Bell size={15} />
            Notify me
          </Link>
        </div>
      </div>
    </>
  );
};
