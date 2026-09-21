import { ArrowRight, Globe, Loader2, Mail } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { SocialLinks } from "@/components/SocialLinks";
import { isLive, SITE, websiteDomain } from "@/data/site";
import { isNewsletterConnected, subscribeEmail } from "@/lib/newsletter";

const FOOTER_LINKS: { label: string; to: string }[] = [
  { label: "Games", to: "/games" },
  { label: "Coming Soon", to: "/coming-soon" },
  { label: "About", to: "/about" },
  { label: "News", to: "/news" },
  { label: "Support", to: "/support" },
  { label: "Store", to: "/store" },
  { label: "Donate", to: "/donate" },
];

const LEGAL_LINKS: { label: string; to: string }[] = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Use", to: "/terms" },
];

export const Footer = () => {
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      const value = email.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        toast.error("That email doesn't look right");
        return;
      }

      if (!isNewsletterConnected()) {
        toast.error("Signups aren't connected yet", { description: "The subscriber list isn't reachable right now." });
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await subscribeEmail(value, "footer");
        if (result.alreadySubscribed) {
          toast.success("You're already on the list", { description: "No need to sign up twice — we've got you." });
        } else {
          toast.success("You're on the list", { description: "We'll email you the moment a game goes live." });
        }
        setEmail("");
      } catch (error: unknown) {
        console.warn("newsletter signup failed", error);
        toast.error("Couldn't sign you up", { description: "Please try again in a moment." });
      } finally {
        setIsSubmitting(false);
      }
    },
    [email],
  );

  return (
    <footer className="relative mt-24 border-t border-border/70 bg-surface/40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/50 to-transparent" />

      <div className="container grid gap-12 py-14 md:grid-cols-[1.2fr_0.7fr_0.7fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{SITE.tagline}</p>

          <p className="mt-5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
            DJ Games LLC
          </p>

          {isLive(SITE.email) ? (
            <a
              href={`mailto:${SITE.email}`}
              className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-signal"
            >
              <Mail size={16} />
              {SITE.email}
            </a>
          ) : null}

          <a
            href={SITE.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-signal"
          >
            <Globe size={16} />
            {websiteDomain()}
          </a>

          <SocialLinks className="mt-4" showLabels />
        </div>

        <nav aria-label="Footer">
          <h2 className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-signal">Explore</h2>
          <ul className="mt-4 space-y-2.5">
            {FOOTER_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal">
          <h2 className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-signal">Legal</h2>
          <ul className="mt-4 space-y-2.5">
            {LEGAL_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-signal">Game updates</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Get TestFlight invites and one email when a game goes live.
          </p>

          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <label htmlFor="footer-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-newsletter-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              className="min-h-[44px] flex-1 rounded-md border border-border bg-surface-raised px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors duration-200 focus:border-signal/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-signal px-4 font-mono text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : null}
              Notify me
              <ArrowRight size={13} />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-6">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            © {SITE.copyrightYear} DJ Games LLC. All rights reserved.
          </p>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            Original iOS games <span className="text-ember">/</span> Built to play
          </p>
        </div>
      </div>
    </footer>
  );
};
