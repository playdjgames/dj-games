import { Mail } from "lucide-react";

import { ContactForm } from "@/components/ContactForm";
import { Hero } from "@/components/Hero";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Reveal } from "@/components/Reveal";
import { SocialLinks } from "@/components/SocialLinks";
import { activeSocials, isLive, SITE } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";

const Contact = () => {
  useSeo({
    title: "Contact — DJ Games",
    description: "Get in touch with DJ Games. Questions, feedback, press enquiries, or just to say hi.",
  });

  const socials = activeSocials();

  return (
    <>
      <Hero
        compact
        eyebrow="Say hello"
        title={
          <>
            Get In <span className="text-signal text-glow">Touch</span>
          </>
        }
        description="Questions, feedback, press enquiries, or just want to say hi — the studio inbox is open."
        stamp={["Talk", "To", "Us"]}
      />

      <section className="container grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <p className="eyebrow">
            <span className="text-ember">//</span> Contact
          </p>
          <h2 className="display-title mt-2 text-3xl sm:text-4xl">Drop us a message</h2>
          <p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-muted-foreground">
            We read everything that lands in the inbox. Bug reports, feature ideas, collaboration offers — all welcome.
          </p>

          {isLive(SITE.email) ? (
            <a
              href={`mailto:${SITE.email}`}
              className="mt-7 inline-flex min-h-[44px] items-center gap-2.5 text-[0.95rem] text-foreground transition-colors hover:text-signal"
            >
              <Mail size={18} className="text-signal" />
              {SITE.email}
            </a>
          ) : (
            <p className="mt-7 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
              Business email coming soon
            </p>
          )}

          {socials.length > 0 ? (
            <div className="mt-9">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-signal">Find us on</p>
              <SocialLinks className="mt-3" />
            </div>
          ) : null}
        </Reveal>

        <Reveal delay={90}>
          <div className="surface-card corner-ticks p-6 sm:p-9">
            <ContactForm />
          </div>
        </Reveal>
      </section>

      <section className="container pb-20 sm:pb-24">
        <Reveal>
          <NewsletterSignup />
        </Reveal>
      </section>
    </>
  );
};

export default Contact;
