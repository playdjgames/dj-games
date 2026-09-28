import { Check, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { findVariant, formatPrice, isBuyable, type StoreProduct } from "@/data/store";
import { cn } from "@/lib/utils";

interface ProductSheetProps {
  product: StoreProduct | null;
  onClose: () => void;
  /** Adds the picked variant to the on-page bag. */
  onAdd: (product: StoreProduct, selections: string[], variantId: number) => void;
}

/**
 * Product detail: art, copy, materials, and a color/size picker mapped to the
 * exact printable variant. Adding goes straight into the bag on this page —
 * nothing here ever leaves the DJ Games site.
 */
export const ProductSheet = ({ product, onClose, onAdd }: ProductSheetProps) => {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [imageIndex, setImageIndex] = useState<number>(0);

  // Preselect the first value of every axis whenever the product changes.
  useEffect(() => {
    if (!product) return;
    const defaults: Record<string, string> = {};
    product.options.forEach((group) => {
      const firstAvailable = group.values.find((value) => value.available);
      if (firstAvailable) defaults[group.id] = firstAvailable.label;
    });
    setSelections(defaults);
    setImageIndex(0);
  }, [product]);

  const variant = useMemo(() => (product ? findVariant(product, selections) : undefined), [product, selections]);

  if (!product) return null;

  const canBuy = isBuyable(product) && Boolean(variant);
  const image = product.images[imageIndex] ?? product.images[0];

  const handleAdd = (): void => {
    if (!variant) return;
    const labels = product.options
      .map((group) => selections[group.id])
      .filter((label): label is string => Boolean(label));
    onAdd(product, labels, variant.id);
  };

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="block max-h-[92vh] gap-0 overflow-y-auto border-border bg-surface p-0 sm:max-w-[560px]">
        <div className="relative aspect-square w-full overflow-hidden bg-surface-raised">
          {image ? (
            <img src={image} alt={product.name} decoding="async" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="display-title text-2xl text-foreground/85">{product.name}</span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">
                Art pending
              </span>
            </div>
          )}
        </div>

        {product.images.length > 1 ? (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4">
            {product.images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setImageIndex(index)}
                aria-label={`View image ${index + 1}`}
                aria-pressed={index === imageIndex}
                className={cn(
                  "h-14 w-14 shrink-0 overflow-hidden rounded-md border transition-colors duration-200",
                  index === imageIndex ? "border-signal" : "border-border hover:border-signal/40",
                )}
              >
                <img src={src} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="p-5 sm:p-6">
          <p className="eyebrow">{product.category}</p>
          <DialogTitle className="display-title mt-2 text-3xl sm:text-4xl">{product.name}</DialogTitle>

          <p className="mt-3 flex items-baseline gap-2.5">
            <span className="font-mono text-xl font-bold text-signal">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="font-mono text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice, product.currency)}
              </span>
            ) : null}
          </p>

          {product.description ? (
            <DialogDescription className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">
              {product.description}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{product.name} product details</DialogDescription>
          )}

          {product.options.map((group) => (
            <fieldset key={group.id} className="mt-6">
              <legend className="font-mono text-[0.64rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {group.name}
                {selections[group.id] ? <span className="ml-2 text-foreground">{selections[group.id]}</span> : null}
              </legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {group.values.map((value) => {
                  const isPicked = selections[group.id] === value.label;
                  return (
                    <button
                      key={value.id}
                      type="button"
                      disabled={!value.available}
                      aria-pressed={isPicked}
                      onClick={() => setSelections((current) => ({ ...current, [group.id]: value.label }))}
                      className={cn(
                        "min-h-[44px] min-w-[56px] rounded-md border px-4 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.1em] transition-all duration-200 active:scale-[0.97]",
                        !value.available
                          ? "cursor-not-allowed border-border bg-surface-raised text-muted-foreground/50 line-through"
                          : isPicked
                            ? "border-signal bg-signal/15 text-signal"
                            : "border-border bg-surface-raised text-foreground hover:border-signal/40",
                      )}
                    >
                      {value.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {product.details && product.details.length > 0 ? (
            <ul className="mt-6 space-y-2">
              {product.details.map((detail) => (
                <li key={detail} className="flex items-start gap-2.5 text-[0.88rem] text-muted-foreground">
                  <Check size={14} className="mt-0.5 shrink-0 text-signal" aria-hidden="true" />
                  {detail}
                </li>
              ))}
            </ul>
          ) : null}

          {canBuy ? (
            <button
              type="button"
              onClick={handleAdd}
              className="mt-7 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-md bg-signal font-mono text-[0.76rem] font-bold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.99]"
            >
              <ShoppingBag size={16} />
              Add to bag · {formatPrice(product.price, product.currency)}
            </button>
          ) : (
            <span className="mt-7 inline-flex min-h-[54px] w-full cursor-not-allowed items-center justify-center rounded-md bg-surface-raised font-mono text-[0.76rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {isBuyable(product) ? "Pick an option" : product.statusLabel}
            </span>
          )}

          <p className="mt-3 text-center text-[0.75rem] leading-relaxed text-muted-foreground">
            Printed to order and shipped to you. Checkout happens right here in your bag.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
