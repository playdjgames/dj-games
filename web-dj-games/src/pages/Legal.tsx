import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { GAMES } from "@/data/games";
import { isLive, SITE } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";

interface LegalProps {
  kind: "privacy" | "terms";
}

/**
 * Every app we publish — current and upcoming — is covered by this policy
 * automatically, because the list is read straight from the game catalogue.
 */
const APP_NAMES = GAMES.map((game) => game.title).join(", ");

/** Bare domain (no protocol) for readable legal copy. */
const DOMAIN = SITE.website.replace(/^https?:\/\//, "");

const CONTENT: Record<LegalProps["kind"], { title: string; eyebrow: string; sections: { heading: string; body: string }[] }> = {
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Legal",
    sections: [
      {
        heading: "The short version",
        body: "We don't collect your personal information. Our games contain no advertising, no tracking, and no account system, and this website uses no tracking cookies. If you support the studio through PayPal, PayPal processes the payment under its own privacy policy and we only learn the amount and the name on the payment. The rest of this page explains the details.",
      },
      {
        heading: "Who this policy covers",
        body: `This policy applies to the DJ Games website (${DOMAIN}) and to every app we publish on the App Store, current and upcoming — including ${APP_NAMES}. By downloading or playing any of our games, you agree to this policy.`,
      },
      {
        heading: "Data our games collect",
        body: "None. Our apps do not include our own analytics, advertising, or account systems, and they do not collect your name, email, location, contacts, or usage data. Anything the game needs to run — such as your progress or settings — stays on your device and is never transmitted to us.",
      },
      {
        heading: "Data handled by Apple",
        body: "Downloads, purchases, crash reports, and platform features such as Game Center are handled by Apple under Apple's own privacy policy (apple.com/legal/privacy). We never receive a copy of that information unless you contact us directly.",
      },
      {
        heading: "Supporting the studio",
        body: "If you choose to support the studio with a contribution, the payment is processed entirely by PayPal under PayPal's own privacy policy (paypal.com/privacy). This website never sees your card, bank, or login details — we receive only the payment amount and the name associated with it, which we use solely to say thanks or to help resolve a payment issue. Contributions are voluntary and are not tax-deductible.",
      },
      {
        heading: "Children's privacy",
        body: "Our games are not directed at children under 13 and do not knowingly collect personal information from anyone, including children. If you believe a child has provided us with personal information, contact us and we will delete it.",
      },
      {
        heading: "This website",
        body: `The website (${DOMAIN}) does not use tracking cookies or advertising pixels. If you message us through the contact form, your email client handles the message and we receive only what you choose to write. If you sign up for studio updates, we store your email address solely to send you news about DJ Games; every email includes an unsubscribe link.`,
      },
      {
        heading: "Your rights",
        body: "Wherever you live, you can ask what personal data we hold about you, request a correction, or ask us to delete it. Because our games collect nothing, there is usually nothing to export or erase — the only data we might hold is a newsletter email address you gave us, which you can remove by unsubscribing or contacting us.",
      },
      {
        heading: "Changes to this policy",
        body: "If we ever change how we handle data, we will update this page and the date below before the change takes effect. A game that starts collecting anything beyond what is described here would disclose it on its App Store listing before the update ships.",
      },
      {
        heading: "Contact",
        body: "Questions about this policy or about any of our games? Reach out any time using the details below and we'll get back to you.",
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    eyebrow: "Legal",
    sections: [
      {
        heading: "Using this site",
        body: "This website is provided for information about DJ Games and our products. You may browse and share links freely for personal, non-commercial purposes.",
      },
      {
        heading: "Intellectual property",
        body: "All artwork, game names, logos, text, and design elements on this site are original works owned by DJ Games. You may not reproduce or redistribute them without written permission.",
      },
      {
        heading: "Our games",
        body: "Games downloaded through the App Store are additionally governed by Apple's terms and by any end user licence agreement included with the game itself.",
      },
      {
        heading: "Contributions",
        body: "Contributions are voluntary payments that support the studio's development work. They do not purchase any product, service, or early access, and they are not tax-deductible. Payments are completed on PayPal under PayPal's own terms; this site only composes a paypal.me link with the amount you choose. If you believe a payment was made in error, contact us and we will work with you and PayPal to resolve it.",
      },
      {
        heading: "Availability",
        body: "We work hard to keep this site accurate and online, but we provide it as-is. Release dates, features, and availability of upcoming projects may change as development continues.",
      },
      {
        heading: "Changes",
        body: "We may update these terms from time to time. Continued use of the site after an update means you accept the revised terms.",
      },
    ],
  },
};

const Legal = ({ kind }: LegalProps) => {
  const content = CONTENT[kind];

  useSeo({
    title: `${content.title} — DJ Games`,
    description:
      kind === "privacy"
        ? "Privacy policy for the DJ Games website and apps: no ads, no tracking, no data collection. Effective September 2026."
        : `${content.title} for the DJ Games website and games.`,
  });

  return (
    <>
      <Hero
        compact
        eyebrow={content.eyebrow}
        title={<span className="text-signal text-glow">{content.title}</span>}
        description={`Effective September ${SITE.copyrightYear}. Last updated September ${SITE.copyrightYear}.`}
      />

      <section className="container py-16 sm:py-20">
        <div className="max-w-2xl space-y-10">
          {content.sections.map((section, index) => (
            <Reveal key={section.heading} delay={index * 60}>
              <h2 className="display-title text-xl sm:text-2xl">{section.heading}</h2>
              <p className="mt-3 text-[1rem] leading-relaxed text-muted-foreground">{section.body}</p>
            </Reveal>
          ))}

          {isLive(SITE.email) ? (
            <Reveal>
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground">
                Email
              </p>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-2 inline-block font-mono text-[0.72rem] uppercase tracking-[0.16em] text-signal transition-colors hover:text-foreground"
              >
                {SITE.email}
              </a>
            </Reveal>
          ) : null}
        </div>
      </section>
    </>
  );
};

export default Legal;
