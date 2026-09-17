import { ArrowRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

import { ParticleField } from "@/components/ParticleField";
import { useSeo } from "@/hooks/use-seo";

const NotFound = () => {
  useSeo({
    title: "Page not found — DJ Games",
    description: "The page you're looking for doesn't exist.",
  });

  return (
    <section className="relative isolate flex min-h-[72vh] items-center overflow-hidden">
      <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <ParticleField className="-z-10" count={18} />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-72 w-[620px] max-w-full -translate-x-1/2 rounded-full bg-signal/15 blur-[110px]"
        aria-hidden="true"
      />

      <div className="container text-center">
        <p className="eyebrow">
          <span className="text-ember">//</span> Error 404
        </p>
        <h1 className="display-title mt-4 text-6xl sm:text-7xl lg:text-8xl">
          Level <span className="text-signal text-glow">Not Found</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[0.98rem] leading-relaxed text-muted-foreground">
          This world hasn't been built yet. Head back to base and pick a different route.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-md bg-signal px-7 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98]"
          >
            <Home size={16} />
            Back home
          </Link>
          <Link
            to="/games"
            className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-md border border-ember/60 px-7 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ember transition-all duration-300 hover:bg-ember hover:text-primary-foreground active:scale-[0.98]"
          >
            Explore our games
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
