import { Check, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  findVariant,
  formatPrice,
  isBuyable,
  normalizeStickerText,
  STICKER_COLORS,
  STICKER_FONTS,
  STICKER_PACK_PRODUCT,
  STICKER_PACK_VARIANT,
  STICKER_SHAPES,
  stickerColor,
  stickerVariantId,
  type CustomSticker,
  type LineCheckout,
  type StickerFont,
  type StickerShape,
  type StoreProduct,
} from "@/data/store";
import { drawSticker, ensureStickerFonts } from "@/lib/sticker-render";
import { cn } from "@/lib/utils";

interface ProductSheetProps {
  product: StoreProduct | null;
  onClose: () => void;
  /** Adds the picked item to the on-page bag. */
  onAdd: (product: StoreProduct, selections: string[], checkout: LineCheckout) => void;
}

const LEGEND = "font-mono text-[0.64rem] font-bold uppercase tracking-[0.2em] text-muted-foreground";
const CHIP =
  "min-h-[44px] rounded-md border px-3.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.1em] transition-all duration-200 active:scale-[0.97]";
const chipState = (isPicked: boolean): string =>
  isPicked ? "border-signal bg-signal/15 text-signal" : "border-border bg-surface-raised text-foreground hover:border-signal/40";

const PREVIEW_PX = 480;

/**
 * Product detail: art, copy, materials, and a picker mapped to exactly what
 * gets printed. Custom text stickers get a live builder whose preview is the
 * print file. Adding goes straight into the bag on this page.
 */
export const ProductSheet = ({ product, onClose, onAdd }: ProductSheetProps) => {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [imageIndex, setImageIndex] = useState<number>(0);
  const [sticker, setSticker] = useState<Omit<CustomSticker, "typeId" | "sizeId">>({
    shape: "text",
    font: "block",
    color: "black",
    text: "",
  });
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  const custom = product?.custom;

  // Reset picks whenever the product changes.
  useEffect(() => {
    if (!product) return;
    const defaults: Record<string, string> = {};
    product.options.forEach((group) => {
      const firstAvailable = group.values.find((value) => value.available);
      if (firstAvailable) defaults[group.id] = firstAvailable.label;
    });
    setSelections(defaults);
    setImageIndex(0);
    setSticker({ shape: "text", font: "block", color: product.custom?.cutVinyl ? "white" : "black", text: "" });
  }, [product]);

  useEffect(() => {
    if (!custom) return;
    let isActive = true;
    void ensureStickerFonts().then(() => {
      if (isActive) setFontsLoaded(true);
    });
    return () => {
      isActive = false;
    };
  }, [custom]);

  const size = useMemo(
    () => custom?.sizes.find((item) => item.label === selections.size) ?? custom?.sizes[0],
    [custom, selections.size],
  );

  const spec = useMemo<CustomSticker | null>(
    () => (custom && size ? { typeId: custom.typeId, sizeId: size.id, ...sticker } : null),
    [custom, size, sticker],
  );

  // Live preview, drawn at the print file's aspect ratio.
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !spec || !size) return;
    const [w, h] = size.printPx;
    const scale = PREVIEW_PX / Math.max(w, h);
    drawSticker(canvas, spec, Math.round(w * scale), Math.round(h * scale));
  }, [spec, size, fontsLoaded]);

  const variant = useMemo(() => (product ? findVariant(product, selections) : undefined), [product, selections]);

  if (!product) return null;

  const stickerText = normalizeStickerText(sticker.text);
  const price = size?.price ?? product.price;
  const canBuy = isBuyable(product) && (custom ? stickerText.length > 0 : product.pack ? true : Boolean(variant));
  const image = product.images[imageIndex] ?? product.images[0];
  const colors = custom?.cutVinyl ? STICKER_COLORS.filter((color) => color.glass) : STICKER_COLORS;
  const shapes = custom?.cutVinyl ? STICKER_SHAPES.filter((shape) => shape.id === "text") : STICKER_SHAPES;

  const handleAdd = (): void => {
    if (custom && spec && size) {
      const thumb = previewRef.current?.toDataURL("image/png");
      const labels = [
        size.label,
        STICKER_SHAPES.find((shape) => shape.id === spec.shape)?.label ?? spec.shape,
        STICKER_FONTS.find((font) => font.id === spec.font)?.label ?? spec.font,
        stickerColor(spec.color).label,
        `"${stickerText}"`,
      ];
      onAdd(product, labels, {
        kind: "custom",
        pressHouseId: product.id,
        variantId: stickerVariantId(custom.typeId, size),
        price: size.price,
        image: thumb,
        custom: { ...spec, text: stickerText },
      });
      return;
    }
    if (product.pack) {
      onAdd(product, [], {
        kind: "design",
        pressHouseId: STICKER_PACK_PRODUCT,
        variantId: STICKER_PACK_VARIANT,
        price: product.price,
        design: product.pack,
      });
      return;
    }
    if (!variant || !product.pressHouseId) return;
    const labels = product.options
      .map((group) => selections[group.id])
      .filter((label): label is string => Boolean(label));
    onAdd(product, labels, { kind: "listing", pressHouseId: product.pressHouseId, variantId: variant.id, price: product.price });
  };

  const setStickerField = <K extends keyof typeof sticker>(key: K, value: (typeof sticker)[K]): void =>
    setSticker((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="block max-h-[92vh] gap-0 overflow-y-auto border-border bg-surface p-0 sm:max-w-[560px]">
        {custom ? (
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,hsl(var(--surface-raised)),hsl(var(--background)))] p-8">
            <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
            <canvas
              ref={previewRef}
              aria-label="Sticker preview"
              className="relative max-h-full max-w-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
              style={{ imageRendering: "auto" }}
            />
            <span className="absolute left-3 top-3 rounded-full border border-signal/50 bg-background/80 px-2.5 py-1 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-signal backdrop-blur-md">
              Live preview
            </span>
          </div>
        ) : (
          <div className="relative aspect-square w-full overflow-hidden bg-surface-raised">
            {image ? (
              <img src={image} alt={product.name} decoding="async" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
                <span className="display-title text-2xl text-foreground/85">{product.name}</span>
              </div>
            )}
          </div>
        )}

        {!custom && product.images.length > 1 ? (
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
            <span className="font-mono text-xl font-bold text-signal">{formatPrice(price, product.currency)}</span>
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

          {custom ? (
            <label className="mt-6 block">
              <span className={LEGEND}>
                Your text <span className="ml-1 text-muted-foreground/70">{stickerText.length}/24</span>
              </span>
              <input
                value={sticker.text}
                maxLength={24}
                onChange={(event) => setStickerField("text", event.target.value)}
                placeholder="Type anything"
                className="mt-2.5 min-h-[50px] w-full rounded-md border border-border bg-surface-raised px-3.5 text-[1rem] font-semibold text-foreground placeholder:text-muted-foreground/60 focus:border-signal focus:outline-none"
              />
            </label>
          ) : null}

          {product.options.map((group) => (
            <fieldset key={group.id} className="mt-6">
              <legend className={LEGEND}>
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
                        CHIP,
                        "min-w-[56px]",
                        !value.available
                          ? "cursor-not-allowed border-border bg-surface-raised text-muted-foreground/50 line-through"
                          : chipState(isPicked),
                      )}
                    >
                      {value.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {custom ? (
            <>
              {shapes.length > 1 ? (
                <fieldset className="mt-6">
                  <legend className={LEGEND}>Shape</legend>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {shapes.map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        aria-pressed={sticker.shape === shape.id}
                        onClick={() => setStickerField("shape", shape.id as StickerShape)}
                        className={cn(CHIP, chipState(sticker.shape === shape.id))}
                      >
                        {shape.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              <fieldset className="mt-6">
                <legend className={LEGEND}>Font</legend>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {STICKER_FONTS.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      aria-pressed={sticker.font === font.id}
                      onClick={() => setStickerField("font", font.id as StickerFont)}
                      className={cn(CHIP, chipState(sticker.font === font.id))}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-6">
                <legend className={LEGEND}>
                  Color <span className="ml-2 text-foreground">{stickerColor(sticker.color).label}</span>
                </legend>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      aria-label={color.label}
                      aria-pressed={sticker.color === color.id}
                      onClick={() => setStickerField("color", color.id)}
                      className={cn(
                        "h-11 w-11 rounded-full border-2 transition-transform duration-200 active:scale-95",
                        sticker.color === color.id ? "scale-110 border-signal" : "border-border hover:scale-105",
                      )}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </fieldset>
            </>
          ) : null}

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
              Add to bag · {formatPrice(price, product.currency)}
            </button>
          ) : (
            <span className="mt-7 inline-flex min-h-[54px] w-full cursor-not-allowed items-center justify-center rounded-md bg-surface-raised font-mono text-[0.76rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {custom ? "Type your text" : isBuyable(product) ? "Pick an option" : product.statusLabel}
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
