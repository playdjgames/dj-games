import { Apple, Play } from "lucide-react";

import { isLive } from "@/data/site";
import { cn } from "@/lib/utils";

interface StoreButtonsProps {
  appStoreUrl: string;
  googlePlayUrl: string;
  gameTitle: string;
  size?: "sm" | "md";
  className?: string;
}

const badgeBase =
  "inline-flex items-center gap-2.5 rounded-md border border-white/15 bg-[#070a09] text-left text-white transition-all duration-300 hover:border-signal/50 hover:shadow-glow focus-visible:border-signal/50";

/**
 * Official-style store badges. A badge is only rendered once the matching URL
 * in `games.ts` has been replaced with a real link, so the site never implies
 * availability that does not exist yet.
 */
export const StoreButtons = ({
  appStoreUrl,
  googlePlayUrl,
  gameTitle,
  size = "md",
  className,
}: StoreButtonsProps) => {
  const hasApple = isLive(appStoreUrl);
  const hasGoogle = isLive(googlePlayUrl);

  const padding = size === "sm" ? "px-3 py-2" : "px-4 py-2.5";
  const iconSize = size === "sm" ? 18 : 22;
  const topText = size === "sm" ? "text-[0.5rem]" : "text-[0.58rem]";
  const bottomText = size === "sm" ? "text-[0.8rem]" : "text-[0.95rem]";

  if (!hasApple && !hasGoogle) {
    return (
      <p className={cn("font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground", className)}>
        Store links coming soon
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {hasApple ? (
        <a
          href={appStoreUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(badgeBase, padding)}
          aria-label={`Download ${gameTitle} on the App Store`}
        >
          <Apple size={iconSize} className="shrink-0 fill-white" strokeWidth={0} />
          <span className="leading-tight">
            <span className={cn("block uppercase tracking-[0.06em] text-white/70", topText)}>Download on the</span>
            <span className={cn("block font-semibold leading-tight", bottomText)}>App Store</span>
          </span>
        </a>
      ) : null}

      {hasGoogle ? (
        <a
          href={googlePlayUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(badgeBase, padding)}
          aria-label={`Get ${gameTitle} on Google Play`}
        >
          <Play size={iconSize} className="shrink-0 fill-signal text-signal" />
          <span className="leading-tight">
            <span className={cn("block uppercase tracking-[0.06em] text-white/70", topText)}>Get it on</span>
            <span className={cn("block font-semibold leading-tight", bottomText)}>Google Play</span>
          </span>
        </a>
      ) : null}
    </div>
  );
};
