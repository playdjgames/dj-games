import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** Slide order matters — it mirrors the lime → ember → lime glow drift in index.css. */
const SLIDES: string[] = [
  "/bg/bg-grid-horizon.png",
  "/bg/bg-circuit-canyon.png",
  "/bg/bg-space-horizon.png",
  "/bg/bg-run-dummy.png",
  "/bg/bg-tool-blueprint.png",
];

/** One image every 16s; the full loop is `SLIDES.length × SLIDE_INTERVAL_MS`. */
const SLIDE_INTERVAL_MS = 16000;

/**
 * Site-wide living backdrop: artwork crossfades on a 16s loop at ~30% opacity
 * while the glow hue drifts lime ↔ ember. Fixed and pointer-transparent, so it
 * never affects layout. Under prefers-reduced-motion it freezes on the first
 * image + lime glow and never advances.
 */
export const DynamicBackground = () => {
  const [active, setActive] = useState<number>(0);
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(query.matches);
      if (query.matches) setActive(0);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setActive((index) => (index + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {SLIDES.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          decoding="async"
          className={cn(
            "dynamic-bg-slide absolute inset-0 h-full w-full object-cover",
            index === active ? "opacity-30" : "opacity-0",
          )}
        />
      ))}

      {/* Lime ↔ ember glow, drifting in lockstep with the slide loop. */}
      <div className="dynamic-bg-glow absolute inset-0" />

      {/* Near-black vignette top and bottom so header, copy, and footer stay readable. */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/10 to-background/85" />
    </div>
  );
};
