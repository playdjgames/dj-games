import { Facebook, Instagram, MessageCircle, Music2, Youtube } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { activeSocials, type SocialKey } from "@/data/site";
import { cn } from "@/lib/utils";

const XIcon = ({ size = 18, className }: { size?: number; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ICONS: Record<SocialKey, LucideIcon | typeof XIcon> = {
  discord: MessageCircle,
  youtube: Youtube,
  tiktok: Music2,
  x: XIcon,
  instagram: Instagram,
  facebook: Facebook,
};

interface SocialLinksProps {
  className?: string;
  iconSize?: number;
  /** Renders the platform name beside each icon (footer uses this for clarity).
   *  Default false keeps the compact icon-only row used elsewhere. */
  showLabels?: boolean;
}

/**
 * Renders only the platforms with a real URL filled in inside `data/site.ts`.
 * Returns nothing while every social link is still a placeholder.
 */
export const SocialLinks = ({ className, iconSize = 18, showLabels = false }: SocialLinksProps) => {
  const socials = activeSocials();
  if (socials.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-2.5", showLabels && "flex-col items-start gap-1", className)}>
      {socials.map(({ key, label, url }) => {
        const Icon = ICONS[key];
        return (
          <li key={key}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={label}
              className={cn(
                "inline-flex min-h-[44px] items-center gap-2.5 rounded-md text-muted-foreground transition-colors duration-300 hover:text-signal",
                showLabels
                  ? "px-1 font-mono text-[0.68rem] uppercase tracking-[0.18em]"
                  : "h-11 w-11 justify-center border border-border bg-surface-raised hover:-translate-y-0.5 hover:border-signal/50",
              )}
            >
              <Icon size={iconSize} className={showLabels ? "text-signal" : undefined} />
              {showLabels ? label : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
};
