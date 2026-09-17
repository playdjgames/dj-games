import { Instagram, MessageCircle, Music2, Youtube } from "lucide-react";
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
};

interface SocialLinksProps {
  className?: string;
  iconSize?: number;
}

/**
 * Renders only the platforms with a real URL filled in inside `data/site.ts`.
 * Returns nothing while every social link is still a placeholder.
 */
export const SocialLinks = ({ className, iconSize = 18 }: SocialLinksProps) => {
  const socials = activeSocials();
  if (socials.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {socials.map(({ key, label, url }) => {
        const Icon = ICONS[key];
        return (
          <li key={key}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={label}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-raised text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-signal/50 hover:text-signal"
            >
              <Icon size={iconSize} />
            </a>
          </li>
        );
      })}
    </ul>
  );
};
