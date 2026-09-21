import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatPrice, type StoreProduct } from "@/data/store";
import { cn } from "@/lib/utils";

interface ProductSheetProps {
  product: StoreProduct | null;
  onClose: () => void;
  onAdd: (product: StoreProduct, selections: string[], quantity: number) => void;
}

/**
 * Product detail: gallery, copy, one selector row per variant axis (size /
 * color), quantity stepper, add to cart. Ported from the POD product page and
 * presented as a sheet so the catalog never unmounts behind it.
 */
export const ProductSheet = ({ product, onClose, onAdd }: ProductSheetProps) => {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [imageIndex, setImageIndex] = useState<number>(0);

  // Preselect the first in-stock value of every axis whenever the product changes.
  useEffect(() => {
    if (!product) return;
    const defaults: Record<string, string> = {};
    product.options.forEach((group) => {
      const firstAvailable = group.values.find((value) => value.available);
      if (firstAvailable) defaults[group.id] = firstAvailable.label;
    });
    setSelections(defaults);
    setQuantity(1);
    setImageIndex(0);
  }, [product]);

  const chosen = useMemo<string[]>(
    () => (product ? product.options.map((group) => selections[group.id]).filter(Boolean) : []),
    [product, selections],
  );

  if (!product) return null;

  const ready = product.options.every((group) => Boolean(selections[group.id]));
  const image = product.images[imageIndex] ?? product.images[0];

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto border-border bg-surface p-0 sm:max-w-[560px]">
        <div className="relative aspect-square w-full overflow-hidden bg-surface-raised">
          {image ? (
            <img src={image} alt={product.name} decoding="async" className="h-full w-full object-cover" />
          ) : null}
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
                        "min-h-[44px] min-w-[56px] rounded-md border px-4 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.1em] transition-all duration-200",
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

          <div className="mt-6 flex items-center gap-4">
            <span className="font-mono text-[0.64rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Qty
            </span>
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface-raised">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Decrease quantity"
                className="inline-flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:text-signal"
              >
                <Minus size={15} />
              </button>
              <span aria-live="polite" className="min-w-[2ch] text-center font-mono text-sm font-bold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                aria-label="Increase quantity"
                className="inline-flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:text-signal"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              onAdd(product, chosen, quantity);
              onClose();
            }}
            className={cn(
              "mt-7 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-md font-mono text-[0.76rem] font-bold uppercase tracking-[0.18em] transition-all duration-300",
              ready
                ? "bg-signal text-primary-foreground hover:shadow-glow active:scale-[0.99]"
                : "cursor-not-allowed bg-surface-raised text-muted-foreground",
            )}
          >
            <ShoppingBag size={16} />
            Add to bag · {formatPrice(product.price * quantity, product.currency)}
          </button>

          <p className="mt-3 text-center text-[0.75rem] leading-relaxed text-muted-foreground">
            Checkout finishes on the shop. We never see your card details.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
