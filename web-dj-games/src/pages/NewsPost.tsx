import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { Reveal } from "@/components/Reveal";
import { useGameLibrary } from "@/data/library";
import { formatPostDate, postBySlug, sortedPosts } from "@/data/news";
import { useSeo } from "@/hooks/use-seo";

const NewsPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { bySlug } = useGameLibrary();
  const post = postBySlug(slug);

  useSeo({
    title: post ? `${post.title} — DJ Games` : "Post not found — DJ Games",
    description: post?.excerpt ?? "This post could not be found.",
    image: post?.image,
  });

  if (!post) return <Navigate to="/news" replace />;

  const relatedGame = post.gameSlug ? bySlug(post.gameSlug) : undefined;
  const more = sortedPosts()
    .filter((item) => item.slug !== post.slug)
    .slice(0, 2);

  return (
    <>
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10">
          <img src={post.image} alt="" aria-hidden="true" decoding="async" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-background/60" />
        </div>

        <div className="container flex min-h-[40vh] flex-col justify-end py-12 sm:py-16">
          <Link
            to="/news"
            className="inline-flex w-fit min-h-[44px] items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-foreground/85 transition-colors hover:text-signal"
          >
            <ArrowLeft size={16} />
            Back to news
          </Link>

          <p className="mt-5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ember">
            {formatPostDate(post.date)} <span className="text-foreground/60">/ {post.category}</span>
          </p>
          <h1 className="display-title mt-3 max-w-3xl text-balance text-4xl sm:text-5xl">{post.title}</h1>
        </div>
      </section>

      <article className="container py-14 sm:py-16">
        <Reveal>
          <div className="max-w-2xl space-y-5 text-[1.02rem] leading-relaxed text-muted-foreground">
            {post.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
        </Reveal>

        {relatedGame ? (
          <Reveal delay={80}>
            <Link
              to={`/games/${relatedGame.slug}`}
              className="surface-card-interactive group mt-10 flex max-w-2xl items-center gap-5 overflow-hidden p-4"
            >
              <img
                src={relatedGame.coverImage}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-20 w-28 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-signal">Related game</p>
                <h2 className="mt-1 font-display text-lg font-bold transition-colors group-hover:text-signal">
                  {relatedGame.title}
                </h2>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{relatedGame.tagline}</p>
              </div>
              <ArrowRight
                size={20}
                className="shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-signal"
              />
            </Link>
          </Reveal>
        ) : null}
      </article>

      {more.length > 0 ? (
        <section className="container pb-20 sm:pb-24">
          <Reveal>
            <p className="eyebrow">
              <span className="text-ember">//</span> Keep reading
            </p>
          </Reveal>

          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {more.map((item, index) => (
              <Reveal key={item.slug} as="li" delay={index * 80}>
                <Link to={`/news/${item.slug}`} className="surface-card-interactive group block h-full overflow-hidden">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ember">
                      {formatPostDate(item.date)}
                    </p>
                    <h3 className="mt-2 font-display text-lg font-bold leading-snug transition-colors group-hover:text-signal">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
};

export default NewsPost;
