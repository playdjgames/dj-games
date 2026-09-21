import { Plus } from "lucide-react";

import { formatPrice, type StoreProduct } from "@/data/store";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: StoreProduct;
  /** Opens the detail sheet (size/color picker). The image tap does this. */
  onSelect: (product: StoreProduct) => void;
  /** One-tap add with default variants — the card's own ADD TO BAG. */
  onAdd: (product: StoreProduct) => void;
  className?: string;
}

/**
 * Catalog card: image, name, price, pitch, and an on-card ADD TO BAG that
 * feeds the page's bag directly. The artwork itself still opens the detail
 * sheet. Items that are not buyable yet — out of stock, drop locked — wear
 * their status on the badge and on the button instead of the add action, with
 * the art dimmed. Missing art renders a clearly-labeled dark placeholder with
 * the product name.
 */
export const ProductCard = ({ product, onSelect, onAdd, className }: ProductCardProps) => {
  const isLocked = product.status !== "available";
  const cover = product.images[0];
  const variantHint = product.options
    .map((group) => group.name)
    .slice(0, 2)
    .join(" · ");

  return (
    <article
      className={cn(
        "surface-card group flex flex-col overflow-hidden",
        !isLocked && "hover:-translate-y-1 hover:border-signal/45 hover:shadow-glow",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(product)}
        disabled={isLocked}
        aria-label={isLocked ? `${product.name} — ${product.statusLabel}` : `View ${product.name}`}
        className={cn(
          "relative block aspect-square w-full overflow-hidden bg-surface-raised",
          isLocked ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        {cover ? (
          <img
            src={cover}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-cover transition-all duration-700 ease-out",
              isLocked ? "opacity-45 grayscale" : "group-hover:scale-105",
            )}
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="display-title text-lg text-foreground/85 sm:text-xl">{product.name}</span>
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground/80">
              Art pending
            </span>
          </span>
        )}

        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.16em] backdrop-blur-md",
            isLocked
              ? "border-ember/50 bg-background/80 text-ember"
              : "border-signal/50 bg-background/80 text-signal",
          )}
        >
          {product.statusLabel}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="display-title text-lg sm:text-xl">{product.name}</h3>

        {product.tagline ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{product.tagline}</p>
        ) : null}

        {variantHint ? (
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground/80">
            {variantHint}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="flex items-baseline gap-2">
            <span className="font-mono text-base font-bold text-foreground">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="font-mono text-[0.72rem] text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice, product.currency)}
              </span>
            ) : null}
          </p>

          <button
            type="button"
            onClick={() => (isLocked ? undefined : onAdd(product))}
            disabled={isLocked}
            aria-label={isLocked ? `${product.name} — ${product.statusLabel}` : `Add ${product.name} to bag`}
            className={cn(
              "inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border font-mono text-[0.62rem] font-semibold uppercase tracking-[0.12em] transition-all duration-300",
              isLocked
                ? "cursor-not-allowed border-border bg-surface-raised px-3 text-muted-foreground opacity-70"
                : "border-signal/50 px-3.5 text-signal hover:bg-signal hover:text-primary-foreground active:scale-[0.97]",
            )}
          >
            {isLocked ? (
              product.statusLabel
            ) : (
              <>
                <Plus size={13} />
                Add to bag
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
