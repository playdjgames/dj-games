import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { ANDROID_TEST } from "@/data/androidTest";
import { ParticleField } from "@/components/ParticleField";
import { PressHouseAd } from "@/components/PressHouseAd";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { formatPostDate, postBySlug, type NewsPost } from "@/data/news";
import { SITE } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";

/** The three posts the homepage lists, in this order. */
const HOME_POSTS: string[] = ["run-dummy-2-3-3-controls", "everything-diy-camera-measure", "everything-diy-is-live"];

const Home = () => {
  useSeo({
    title: "DJ Games — Original Mobile Games, Apps and Websites",
    description: SITE.description,
  });

  const posts = HOME_POSTS.map((slug) => postBySlug(slug)).filter((post): post is NewsPost => post !== undefined);

  return (
    <>
      {/* HERO — the whole first screen is one product, one decision */}
      <section className="relative isolate overflow-hidden">
        <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <ParticleField className="-z-10" count={22} />

        {/* One centred column: with the phone gone, the type IS the hero. */}
        <div className="container flex min-h-[78vh] flex-col items-center justify-center py-16 text-center sm:py-20 lg:min-h-[calc(100vh-68px)]">
          <div className="animate-fade-up flex w-full max-w-3xl flex-col items-center">
            <p className="eyebrow">Games, apps and websites for a brighter tomorrow</p>

            <h1 className="display-title mt-4 text-7xl tracking-tight sm:text-8xl lg:text-9xl">
              DJ&nbsp;<span className="text-signal text-glow">Games</span>
            </h1>

            <p className="mt-4 text-xl font-light text-foreground/90 sm:text-2xl">
              Original mobile games and apps. Built to play.
            </p>

            {/* Web design lives right under the title — the studio's quiet second trade. Plain text, NOT a link, matches the line. */}
            <p className="mt-6 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              We also design + build websites
            </p>
          </div>
        </div>
      </section>

      {/* ANDROID CLOSED TEST — recruit band for Vexara's Google Play testing */}
      <section className="container">
        <div className="flex flex-col gap-6 border border-[#243044] bg-[#0a0e14] p-6 sm:flex-row sm:items-center">
          {ANDROID_TEST.scene ? (
            <img
              src={ANDROID_TEST.scene}
              alt="A night stone keep on a rock with city glow behind it, and an Android phone whose screen shows a stone gate outlined in purple light"
              width={1536}
              height={1024}
              loading="lazy"
              decoding="async"
              className="aspect-[16/9] w-full shrink-0 border border-[#243044] object-cover sm:w-64 md:w-72"
            />
          ) : null}
          <div className="min-w-0">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ember">{ANDROID_TEST.eyebrow}</p>
            <h2 className="display-title mt-2 text-2xl tracking-tight">{ANDROID_TEST.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ANDROID_TEST.bandBody}</p>
            <Link
              to="/android-test"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-md bg-signal px-5 font-display text-sm font-bold uppercase tracking-wide text-background transition-colors duration-300 hover:bg-foreground"
            >
              Join the test
            </Link>
          </div>
        </div>
      </section>

      {/* PRESS HOUSE — platform promo, directly under the hero */}
      <section className="container pb-2 pt-4 sm:pt-6">
        <PressHouseAd />
      </section>

      {/* NEWS — three pinned lines */}
      <section className="container py-16 sm:py-20">
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
        </Reveal>

        <ul className="mt-8 max-w-3xl">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                to={`/news/${post.slug}`}
                className="group flex items-center gap-4 border-b border-border/70 py-4 transition-colors hover:border-signal/40"
              >
                <span className="w-24 shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ember">
                  {formatPostDate(post.date)}
                </span>
                <span className="min-w-0 flex-1 font-display text-lg font-bold leading-snug transition-colors group-hover:text-signal">
                  {post.title}
                </span>
                <ChevronRight
                  size={18}
                  className="shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-signal"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};

export default Home;
