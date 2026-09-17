import { ArrowRight, ChevronRight, Gamepad2, Lightbulb, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { ContactForm } from "@/components/ContactForm";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { formatPostDate, sortedPosts } from "@/data/news";
import { isLive, SITE } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";

const VALUES: { icon: typeof Lightbulb; title: string; body: string }[] = [
  {
    icon: Lightbulb,
    title: "Original ideas",
    body: "We build games around ideas that are designed to be different and memorable.",
  },
  {
    icon: Gamepad2,
    title: "Fun first",
    body: "Gameplay comes first. Every game should be easy to understand and fun to keep playing.",
  },
  {
    icon: TrendingUp,
    title: "Always building",
    body: "DJ Games is constantly working on new games, concepts, and interactive experiences.",
  },
];

const About = () => {
  useSeo({
    title: "About — DJ Games",
    description:
      "DJ Games is an independent game and app development brand focused on creating original interactive experiences.",
  });

  const posts = sortedPosts().slice(0, 3);

  return (
    <>
      <Hero
        compact
        eyebrow="Our story"
        title={
          <>
            About
            <br />
            <span className="text-signal text-glow">DJ Games</span>
          </>
        }
        description="We are an independent studio building original games and interactive experiences, one bold idea at a time."
        stamp={["Bold", "Ideas", "Brighter", "Worlds"]}
      />

      <section className="container py-16 sm:py-20">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionHeading eyebrow="Who we are" title="An indie studio, not a factory" />

            <div className="space-y-4 text-[1.02rem] leading-relaxed text-muted-foreground">
              <p>
                DJ Games is an independent game and app development brand focused on creating original interactive
                experiences. We're small on purpose — it means every idea gets to be strange, specific, and actually
                ours.
              </p>
              <p>
                We prototype fast, playtest early, and ship games that respect your time. No endless tutorials, no
                pay-to-win nonsense. Just games that are easy to pick up and genuinely satisfying to get good at.
              </p>
              <p>
                Everything you see here — the art, the worlds, the mechanics — is built from scratch by the studio. If
                we're going to ask for a spot on your home screen, it should be for something you can't get anywhere
                else.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container pb-16 sm:pb-20">
        <Reveal>
          <SectionHeading eyebrow="Why DJ Games" title="What Drives Us" />
        </Reveal>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {VALUES.map((value, index) => (
            <Reveal key={value.title} delay={index * 90}>
              <article className="surface-card-interactive h-full p-6">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-md border border-signal/30 bg-signal/10 text-signal">
                  <value.icon size={26} />
                </span>
                <h3 className="display-title mt-5 text-lg">{value.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container grid gap-10 pb-20 sm:pb-24 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <SectionHeading
            eyebrow="Latest news"
            title="Studio Updates"
            action={
              <Link
                to="/news"
                className="inline-flex min-h-[44px] items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-signal transition-colors hover:text-foreground"
              >
                View all news
                <ArrowRight size={15} />
              </Link>
            }
          />

          <ul className="mt-8">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  to={`/news/${post.slug}`}
                  className="group flex items-center gap-4 border-b border-border/70 py-4 transition-colors hover:border-signal/40"
                >
                  <img
                    src={post.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="hidden h-20 w-28 shrink-0 rounded-md object-cover sm:block"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ember">
                      {formatPostDate(post.date)}
                    </p>
                    <h3 className="mt-1.5 font-display text-lg font-bold leading-snug transition-colors group-hover:text-signal">
                      {post.title}
                    </h3>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{post.excerpt}</p>
                  </div>
                  <ChevronRight
                    size={20}
                    className="shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-signal"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={90}>
          <div className="surface-card corner-ticks h-full p-7 sm:p-9">
            <p className="eyebrow">
              <span className="text-ember">//</span> Get in touch
            </p>
            <h2 className="display-title mt-2 text-3xl">Get In Touch</h2>
            <p className="mt-4 text-[0.96rem] leading-relaxed text-muted-foreground">
              We'd love to hear from you. Whether you have a question, feedback, or just want to say hi, drop us a
              message.
            </p>

            {isLive(SITE.email) ? (
              <a
                href={`mailto:${SITE.email}`}
                className="mt-4 inline-block font-mono text-[0.72rem] uppercase tracking-[0.16em] text-signal transition-colors hover:text-foreground"
              >
                {SITE.email}
              </a>
            ) : null}

            <ContactForm className="mt-7" />
          </div>
        </Reveal>
      </section>
    </>
  );
};

export default About;
