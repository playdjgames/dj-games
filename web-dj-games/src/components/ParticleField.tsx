import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  ember: boolean;
}

interface ParticleFieldProps {
  count?: number;
  className?: string;
}

/**
 * Lightweight CSS-only drifting particle layer for hero sections.
 * Uses deterministic pseudo-random placement so it never re-shuffles on
 * re-render, and disables itself when the user prefers reduced motion.
 */
export const ParticleField = ({ count = 26, className }: ParticleFieldProps) => {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setEnabled(!query.matches);

    const onChange = (event: MediaQueryListEvent) => setEnabled(!event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const particles = useMemo<Particle[]>(() => {
    const seeded = (n: number): number => {
      const value = Math.sin(n * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };

    return Array.from({ length: count }, (_, index) => ({
      id: index,
      left: seeded(index + 1) * 100,
      top: seeded(index + 41) * 100,
      size: 1.5 + seeded(index + 91) * 2.5,
      duration: 7 + seeded(index + 131) * 9,
      delay: seeded(index + 173) * 8,
      ember: seeded(index + 211) > 0.82,
    }));
  }, [count]);

  if (!enabled) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full animate-pulse-glow"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: particle.ember ? "hsl(var(--ember))" : "hsl(var(--signal))",
            boxShadow: `0 0 ${particle.size * 4}px hsl(var(--${particle.ember ? "ember" : "signal"}) / 0.8)`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
