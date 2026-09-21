import { Heart, ShoppingBag } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { CartDrawer } from "@/components/store/CartDrawer";
import { PressHouseAd } from "@/components/PressHouseAd";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductSheet } from "@/components/store/ProductSheet";
import {
  cartCount,
  defaultSelections,
  DROP_NAME,
  useStoreCatalog,
  type StoreProduct,
} from "@/data/store";
import { useCart } from "@/hooks/use-cart";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

const ALL = "All";

const Store = () => {
  useSeo({
    title: "Store — DJ Games",
    description:
      `${DROP_NAME} merch from DJ Games. Tee, hoodie, cap and tote — pick your size and add to your bag right on the page.`,
  });

  const { products, categories, isLoading, isEmpty } = useStoreCatalog();
  const cart = useCart();

  const [filter, setFilter] = useState<string>(ALL);
  const [active, setActive] = useState<StoreProduct | null>(null);
  const [bagOpen, setBagOpen] = useState<boolean>(false);

  const filters = useMemo<string[]>(() => [ALL, ...categories], [categories]);
  const visible = useMemo<StoreProduct[]>(
    () => (filter === ALL ? products : products.filter((product) => product.category === filter)),
    [products, filter],
  );

  const count = cartCount(cart.lines);

  // One tap on the card: default size/color in, bag open, no detour.
  const addToBag = useCallback(
    (product: StoreProduct) => {
      cart.add(product, defaultSelections(product), 1);
      setBagOpen(true);
    },
    [cart],
  );

  return (
    <>
      <Hero
        compact
        eyebrow="DJ Games"
        title={
          <>
            Last <span className="text-signal text-glow">Call</span>
          </>
        }
        description="Merch from the house. Drops live here."
        stamp={["Wear", "The", "House"]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setBagOpen(true)}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-signal px-5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.16em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.99]"
          >
            <ShoppingBag size={16} />
            Your bag
            {count > 0 ? (
              <span className="ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-foreground/20 px-1 text-[0.62rem]">
                {count}
              </span>
            ) : null}
          </button>
          {/* In-page only: the rack IS the page, so there is no second shop button. */}
        </div>
      </Hero>

      <section className="container py-14 sm:py-16">
        {/* Filters — only meaningful once the drop has more than one category. */}
        {filters.length > 2 ? (
          <Reveal>
            <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
              {filters.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => setFilter(item)}
                    aria-pressed={filter === item}
                    className={cn(
                      "min-h-[40px] whitespace-nowrap rounded-full border px-4 font-mono text-[0.64rem] uppercase tracking-[0.14em] transition-all duration-300",
                      filter === item
                        ? "border-signal bg-signal/15 text-signal"
                        : "border-border bg-surface text-muted-foreground hover:border-signal/40 hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {isLoading ? (
          /* Loading state — skeleton rack, same grid rhythm as the real cards. */
          <ul
            aria-busy="true"
            aria-label="Loading products"
            className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", filters.length > 2 && "mt-8")}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <li key={index} className="surface-card overflow-hidden">
                <div className="aspect-square w-full animate-pulse bg-surface-raised" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-surface-raised" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-surface-raised" />
                </div>
              </li>
            ))}
          </ul>
        ) : isEmpty ? (
          /* Empty state — the drop is not on the rack yet. Never fake products. */
          <Reveal>
            <div className="surface-card corner-ticks mx-auto mt-4 max-w-xl p-8 text-center sm:p-12">
              <p className="eyebrow">{DROP_NAME}</p>
              <h2 className="display-title mt-3 text-3xl sm:text-4xl">Drop loading</h2>
              <p className="mt-4 text-[0.98rem] leading-relaxed text-muted-foreground">
                {DROP_NAME} isn&rsquo;t on the rack yet. When the first run goes live, it lands
                here first.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  to="/donate"
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md border border-ember/50 px-5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ember transition-colors duration-300 hover:bg-ember/10 sm:w-auto"
                >
                  <Heart size={14} />
                  Support the house
                </Link>
                <Link
                  to="/coming-soon#notify"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md border border-border px-5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors duration-300 hover:border-signal/45 hover:text-foreground sm:w-auto"
                >
                  Tell me when it drops
                </Link>
              </div>
            </div>
          </Reveal>
        ) : visible.length === 0 ? (
          <p className="mt-10 font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
            Nothing in this category yet.
          </p>
        ) : (
          <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", filters.length > 2 && "mt-8")}>
            {visible.map((product, index) => (
              <Reveal key={product.id} delay={index * 60}>
                <ProductCard
                  product={product}
                  onSelect={setActive}
                  onAdd={addToBag}
                  className="h-full"
                />
              </Reveal>
            ))}
          </div>
        )}

        {/* PRESS HOUSE — clickable card below the merch, closing out the rack. */}
        <PressHouseAd variant="strip" className="mt-14" />
      </section>

      <ProductSheet
        product={active}
        onClose={() => setActive(null)}
        onAdd={(product, selections, quantity) => {
          cart.add(product, selections, quantity);
          setBagOpen(true);
        }}
      />

      <CartDrawer
        open={bagOpen}
        lines={cart.lines}
        onClose={() => setBagOpen(false)}
        onQuantity={cart.setQuantity}
        onRemove={cart.remove}
      />
    </>
  );
};

export default Store;
