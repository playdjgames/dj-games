import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { formatPostDate, sortedPosts } from "@/data/news";
import { useSeo } from "@/hooks/use-seo";

const News = () => {
  useSeo({
    title: "News & Updates — DJ Games",
    description:
      "Announcements, release notes, patch notes, and behind-the-scenes devlogs from the DJ Games studio.",
  });

  const posts = sortedPosts();

  return (
    <>
      <Hero
        compact
        eyebrow="From the studio"
        title={
          <>
            News &amp; <span className="text-signal text-glow">Updates</span>
          </>
        }
        description="Announcements, release notes, patch notes, and the occasional look behind the curtain."
        stamp={["Devlogs", "Patches", "Releases"]}
      />

      <section className="container py-16 sm:py-20">
        <Reveal>
          <SectionHeading eyebrow="Everything" title="All Posts" note={`${posts.length} posts`} />
        </Reveal>

        {posts.length === 0 ? (
          <p className="mt-10 font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
            No posts published yet.
          </p>
        ) : (
          <ul className="mt-10 space-y-5">
            {posts.map((post, index) => (
              <Reveal key={post.slug} as="li" delay={index * 70}>
                <Link
                  to={`/news/${post.slug}`}
                  className="surface-card-interactive group grid overflow-hidden sm:grid-cols-[minmax(0,300px)_1fr]"
                >
                  <div className="aspect-[16/9] overflow-hidden sm:aspect-auto">
                    <img
                      src={post.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="flex items-center gap-4 p-6">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ember">
                        {formatPostDate(post.date)}{" "}
                        <span className="text-muted-foreground">/ {post.category}</span>
                      </p>
                      <h2 className="display-title mt-2 text-xl transition-colors group-hover:text-signal sm:text-2xl">
                        {post.title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                    </div>

                    <ChevronRight
                      size={22}
                      className="hidden shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-signal sm:block"
                    />
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </section>
    </>
  );
};

export default News;
