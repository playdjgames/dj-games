import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Reveal } from "@/components/Reveal";
import { useSeo } from "@/hooks/use-seo";

/**
 * Minimal PRESS HOUSE landing. This exists so the promo link is never dead
 * while `presshouse.playdjgames.com` has no origin attached (it answers 522).
 * Deliberately bare: no catalog, no seller signup form, no fee calculator,
 * no dashboard — just what the platform is, and a way back to the shop.
 */
const PressHouse = () => {
  useSeo({
    title: "PRESS HOUSE — Print-on-demand",
    description:
      "PRESS HOUSE is the print-on-demand platform behind DJ Games. House store $0. Everyone else pays a monthly fee and/or a cut.",
  });

  return (
    <section className="container py-16 sm:py-24">
      <Reveal>
        <div className="mx-auto max-w-2xl">
          <p className="flex items-center gap-2 font-mono text-[0.64rem] font-bold uppercase tracking-[0.3em]">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#FF4D8D" }}
            />
            <span style={{ color: "#E8FF47" }}>Platform</span>
          </p>

          <h1 className="display-title mt-4 text-5xl sm:text-6xl lg:text-7xl" style={{ color: "#F4F1EA" }}>
            Press&nbsp;House
          </h1>

          <p className="mt-6 text-[1.05rem] leading-relaxed" style={{ color: "#9A958B" }}>
            Print-on-demand for sellers. House store $0. Everyone else pays a monthly fee and/or a
            cut.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/"
              className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full px-7 font-mono text-[0.72rem] font-bold uppercase tracking-[0.16em] transition-transform duration-300 active:scale-[0.98]"
              style={{ backgroundColor: "#E8FF47", color: "#0B0B0F" }}
            >
              <ArrowLeft size={16} />
              Back to shop home
            </Link>

            <Link
              to="/store"
              className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border px-7 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-300"
              style={{ borderColor: "#2A2A36", color: "#9A958B" }}
            >
              See LAST CALL merch
              <ArrowRight size={15} />
            </Link>
          </div>

          <p className="mt-8 font-mono text-[0.62rem] uppercase tracking-[0.16em]" style={{ color: "#9A958B" }}>
            Platform, not the merch drop.
          </p>
        </div>
      </Reveal>
    </section>
  );
};

export default PressHouse;
