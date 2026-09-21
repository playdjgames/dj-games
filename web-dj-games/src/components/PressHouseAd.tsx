import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * PRESS HOUSE AD — one shared promo module
 * ============================================================================
 * Used on Home, Store, and Donate so all three stay in sync. This advertises
 * the PRESS HOUSE print-on-demand PLATFORM — it is not the LAST CALL merch
 * drop and not a product card.
 *
 * `presshouse.playdjgames.com` currently answers HTTP 522 (DNS resolves, no
 * origin attached), so the ad points at the on-site landing route instead of a
 * dead host. When the real platform is live, change this one constant to
 * "https://presshouse.playdjgames.com" — the component swaps to a plain <a>
 * on its own.
 * ============================================================================
 */
export const PRESS_HOUSE_URL = "/press-house";

/** Accessible name for every instance of the ad. */
const LINK_LABEL = "PRESS HOUSE — open the print-on-demand platform";

const COPY = {
  eyebrow: "PRESS HOUSE",
  headline: "Print it. Drop it. Keep the cut.",
  body: "The POD platform behind DJ Games. Your designs, printed on demand. House store stays $0. Other sellers: monthly and/or a cut.",
  button: "Enter PRESS HOUSE →",
  fine: "Platform, not the merch drop.",
} as const;

/* ------------------------------ scoped palette ----------------------------- */
/** The ad carries its own billed-promo palette so it never reads as chrome. */
const CARD = "#14141C";
const LINE = "#2A2A36";
const TEXT = "#F4F1EA";
const MUTED = "#9A958B";
const LIME = "#E8FF47";
const PINK = "#FF4D8D";

const isInternal = PRESS_HOUSE_URL.startsWith("/");

interface AdLinkProps {
  className?: string;
  children: ReactNode;
}

/**
 * One real link wrapping the whole ad — tapping anywhere opens PRESS HOUSE.
 * Same tab, never a popup.
 */
const AdLink = ({ className, children }: AdLinkProps) =>
  isInternal ? (
    <Link to={PRESS_HOUSE_URL} aria-label={LINK_LABEL} className={className}>
      {children}
    </Link>
  ) : (
    <a href={PRESS_HOUSE_URL} aria-label={LINK_LABEL} className={className}>
      {children}
    </a>
  );

/** Lime pill. A span, not a button — it lives inside the card-wide link. */
const AdButton = ({ full = false }: { full?: boolean }) => (
  <span
    aria-hidden="true"
    className={cn(
      "inline-flex min-h-[44px] items-center justify-center rounded-full px-6 font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] transition-transform duration-300 group-active:scale-[0.98]",
      full ? "w-full" : "w-full sm:w-auto",
    )}
    style={{ backgroundColor: LIME, color: "#0B0B0F" }}
  >
    {COPY.button}
  </span>
);

export type PressHouseAdVariant = "banner" | "strip" | "quiet";

interface PressHouseAdProps {
  /**
   * `banner` — full promo card (Home, top of Store).
   * `strip`  — compact one-line version (Store footer).
   * `quiet`  — muted text + link (Donate, under the fine print).
   */
  variant?: PressHouseAdVariant;
  /**
   * PRESS HOUSE is still in development — when true the module renders as a
   * non-linking card (identical visuals, no navigation) marked "UNDER
   * CONSTRUCTION". Used by the Store strip for now; drop the prop to re-open
   * the link when the platform ships.
   */
  disabled?: boolean;
  className?: string;
}

export const PressHouseAd = ({
  variant = "banner",
  disabled = false,
  className,
}: PressHouseAdProps) => {
  if (variant === "quiet") {
    return (
      <p className={cn("text-center text-[0.78rem] leading-relaxed", className)} style={{ color: MUTED }}>
        Selling your own designs?{" "}
        <AdLink className="font-semibold underline decoration-dotted underline-offset-4 transition-colors duration-200 hover:opacity-80">
          <span style={{ color: LIME }}>PRESS HOUSE</span>
        </AdLink>{" "}
        is the print-on-demand platform behind DJ Games. {COPY.fine}
      </p>
    );
  }

  if (variant === "strip") {
    const body = (
      <>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl border transition-colors duration-300"
          style={{ borderColor: LINE }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-[0.10] blur-3xl"
          style={{ backgroundColor: PINK }}
        />

        <span className="relative min-w-0">
          <span
            className="block font-mono text-[0.6rem] font-bold uppercase tracking-[0.28em]"
            style={{ color: LIME }}
          >
            {COPY.eyebrow}
          </span>
          <span className="mt-1 block text-[0.95rem] font-bold leading-tight" style={{ color: TEXT }}>
            {COPY.headline}
          </span>
        </span>

        <span className="relative w-full sm:w-auto sm:shrink-0">
          <AdButton />
          {disabled && (
            <span className="mt-2 flex items-center justify-center gap-1.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.22em] sm:justify-end">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "#FFB020" }}
              />
              <span style={{ color: "#FFB020" }}>Under construction</span>
            </span>
          )}
        </span>
      </>
    );

    // PRESS HOUSE in dev — same card, but it navigates nowhere and is marked.
    if (disabled) {
      return (
        <div
          className={cn(
            "relative flex min-h-[44px] flex-col items-center gap-3 overflow-hidden rounded-2xl border p-4 sm:flex-row sm:justify-between sm:gap-5 sm:px-6",
            className,
          )}
        >
          {body}
        </div>
      );
    }

    return (
      <AdLink
        className={cn(
          "group relative flex min-h-[44px] flex-col items-center gap-3 overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 sm:flex-row sm:justify-between sm:gap-5 sm:px-6",
          className,
        )}
      >
        {body}
      </AdLink>
    );
  }

  return (
    <AdLink
      className={cn(
        "press-house-ad group relative block overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 sm:p-8",
        className,
      )}
    >
      {/* Faint lime + pink wash so the module reads as a paid slot, not chrome. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full opacity-[0.12] blur-[90px]"
        style={{ backgroundColor: LIME }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full opacity-[0.14] blur-[90px]"
        style={{ backgroundColor: PINK }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="min-w-0 lg:max-w-[38rem]">
          <p className="flex items-center gap-2 font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em]">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: PINK }}
            />
            <span style={{ color: LIME }}>{COPY.eyebrow}</span>
          </p>

          <p
            className="display-title mt-3 text-[1.75rem] leading-[0.98] sm:text-[2.15rem]"
            style={{ color: TEXT }}
          >
            {COPY.headline}
          </p>

          <p className="mt-3 max-w-xl text-[0.94rem] leading-relaxed" style={{ color: MUTED }}>
            {COPY.body}
          </p>
        </div>

        <div className="shrink-0 lg:text-right">
          <AdButton />
          <p className="mt-2.5 font-mono text-[0.6rem] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            {COPY.fine}
          </p>
        </div>
      </div>
    </AdLink>
  );
};
