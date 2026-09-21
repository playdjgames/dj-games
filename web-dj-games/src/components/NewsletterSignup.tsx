import { ArrowRight, Loader2 } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { SocialLinks } from "@/components/SocialLinks";
import { activeSocials } from "@/data/site";
import { isNewsletterConnected, subscribeEmail } from "@/lib/newsletter";
import { cn } from "@/lib/utils";

interface NewsletterSignupProps {
  className?: string;
}

/**
 * Community block with an email capture. Subscribers are stored by the project's
 * Cloudflare Worker and are viewable/exportable from the /subscribers page.
 */
export const NewsletterSignup = ({ className }: NewsletterSignupProps) => {
  // Prefill from ?email= — the /marketing campaign page hands its email here.
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState<string>(() => searchParams.get("email") ?? "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const hasSocials = activeSocials().length > 0;

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
        const result = await subscribeEmail(value, "community");
        if (result.alreadySubscribed) {
          toast.success("You're already on the list", { description: "No need to sign up twice — we've got you." });
        } else {
          toast.success("You're on the list", { description: "We'll let you know when the next game drops." });
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
    <section
      id="notify"
      className={cn(
        "surface-card corner-ticks relative scroll-mt-24 overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16",
        className,
      )}
    >
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-56 w-[520px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/20 blur-[90px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl">
        <p className="eyebrow">
          <span className="text-ember">//</span> Be first
        </p>
        <h2 className="display-title mt-3 text-3xl sm:text-4xl">Get notified first</h2>
        <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
          Get TestFlight invites and one email when a game goes live.
        </p>

        <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            className="min-h-[52px] flex-1 rounded-md border border-border bg-surface-raised px-4 text-[0.95rem] text-foreground placeholder:text-muted-foreground/70 transition-colors duration-200 focus:border-signal/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-md bg-signal px-6 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
            Notify me
            <ArrowRight size={15} />
          </button>
        </form>

        {hasSocials ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-muted-foreground">Find us on</p>
            <SocialLinks />
          </div>
        ) : null}
      </div>
    </section>
  );
};
