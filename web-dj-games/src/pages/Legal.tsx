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

/** The registered owner, named once so the legal copy can never drift from it. */
const OWNER = SITE.legalName;

const WHO_WE_ARE = `${OWNER} owns and operates this website (${DOMAIN}), the DJ Games store, and every DJ Games app. On this page, "DJ Games", "we", "us" and "our" all mean ${OWNER}.`;

const CONTENT: Record<LegalProps["kind"], { title: string; eyebrow: string; sections: { heading: string; body: string }[] }> = {
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Legal",
    sections: [
      {
        heading: "The short version",
        body: "Our apps don't collect your personal information: no advertising, no tracking, and no account system, and this website uses no tracking cookies. When you order merch from our store, we collect only what we need to print and ship it. The rest of this page explains the details.",
      },
      {
        heading: "Who we are",
        body: WHO_WE_ARE,
      },
      {
        heading: "Who this policy covers",
        body: `This policy applies to the DJ Games website (${DOMAIN}), the DJ Games store, and every app ${OWNER} publishes, current and upcoming — including ${APP_NAMES}. By downloading or playing any of our games, you agree to this policy.`,
      },
      {
        heading: "Data our games collect",
        body: "None. Our apps do not include our own analytics, advertising, or account systems, and they do not collect your name, email, location, contacts, or usage data. Anything the game needs to run — such as your progress or settings — stays on your device and is never transmitted to us.",
      },
      {
        heading: "Data handled by the app stores",
        body: "Downloads, purchases, crash reports, and platform features are handled by the app stores under their own privacy policies. We never receive a copy of that information unless you contact us directly.",
      },
      {
        heading: "Store orders",
        body: "When you order from the DJ Games store, we collect your name, email address, shipping address and, if you give it, a phone number — only to make, ship and support your order. Card payments are processed by Stripe; we never see or store your full card details. Your order details are shared with our print partner, Printify, and its print providers solely to produce and deliver your items. We keep order records for as long as we need them for support and for our tax and accounting obligations.",
      },
      {
        heading: "Children's privacy",
        body: "Our games are not directed at children under 13 and do not knowingly collect personal information from anyone, including children. If you believe a child has provided us with personal information, contact us and we will delete it.",
      },
      {
        heading: "This website",
        body: `The website (${DOMAIN}) does not use tracking cookies or advertising pixels. If you email us, we receive only what you choose to write. If you sign up for studio updates, we store your email address solely to send you news about DJ Games; every email includes an unsubscribe link.`,
      },
      {
        heading: "Your rights",
        body: "Wherever you live, you can ask what personal data we hold about you, request a correction, or ask us to delete it. Because our games collect nothing, there is usually nothing to export or erase — the only data we might hold is a newsletter email address or the details of a store order you placed. You can unsubscribe at any time, or contact us about anything else.",
      },
      {
        heading: "Changes to this policy",
        body: "If we ever change how we handle data, we will update this page and the date below before the change takes effect. A game that starts collecting anything beyond what is described here would disclose it on its store listing before the update ships.",
      },
      {
        heading: "Contact",
        body: `Questions about this policy or about any of our games? Contact ${OWNER} any time using the details below and we'll get back to you.`,
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    eyebrow: "Legal",
    sections: [
      {
        heading: "Who we are",
        body: WHO_WE_ARE,
      },
      {
        heading: "Using this site",
        body: "This website is provided for information about DJ Games and our products. You may browse and share links freely for personal, non-commercial purposes.",
      },
      {
        heading: "Intellectual property",
        body: `All games, apps, artwork, game names, logos, text, and design elements on this site — including the DJ Games and PRESS HOUSE names — are owned by ${OWNER}. You may not reproduce or redistribute them without written permission.`,
      },
      {
        heading: "Our games",
        body: "Games downloaded through an app store are additionally governed by that store's terms and by any end user licence agreement included with the game itself.",
      },
      {
        heading: "App purchases",
        body: "Apps are downloaded through the app stores. Any paid app or in-app purchase is handled entirely by that store — payment, refunds, and receipts are governed by its own terms.",
      },
      {
        heading: "Store orders",
        body: `Merch from the DJ Games store is sold by ${OWNER}. Every item is printed after you order and shipped by our print partner, so we don't take returns for a change of mind — but if your order arrives damaged, misprinted, or wrong, contact us and we'll replace it or refund you. Payments are processed securely by Stripe; this site never stores your card details.`,
      },
      {
        heading: "Tips",
        body: `Tips are voluntary payments to ${OWNER} to support our work. They are not charitable donations, are not tax-deductible, and don't buy any product or perk.`,
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
        ? "Privacy policy for DJ Games LLC — the DJ Games website, store and apps: no ads, no tracking, and only what's needed to ship store orders."
        : `${content.title} for the DJ Games website, store and games, owned and operated by DJ Games LLC.`,
  });

  return (
    <>
      <Hero
        compact
        eyebrow={content.eyebrow}
        title={<span className="text-signal text-glow">{content.title}</span>}
        description={`${OWNER}. Effective September 2026. Last updated October 2026.`}
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
                {OWNER} · Email
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
