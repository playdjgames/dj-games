import { ArrowUpRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { cartSubtotal, checkoutUrl, formatPrice, type CartLine } from "@/data/store";
import { cn } from "@/lib/utils";

interface CartDrawerProps {
  open: boolean;
  lines: CartLine[];
  onClose: () => void;
  onQuantity: (productId: string, selections: string[], quantity: number) => void;
  onRemove: (productId: string, selections: string[]) => void;
}

/**
 * Slide-in bag. Quantity edits and removal live here; the checkout button hands
 * off to the shop host, which owns payment.
 */
export const CartDrawer = ({ open, lines, onClose, onQuantity, onRemove }: CartDrawerProps) => {
  const subtotal = cartSubtotal(lines);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="Shopping bag"
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-[61] flex w-full max-w-[400px] flex-col border-l border-border bg-surface transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="display-title text-xl">Your bag</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:border-signal/50 hover:text-signal"
          >
            <X size={18} />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag size={28} className="text-muted-foreground" />
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              Your bag is empty
            </p>
          </div>
        ) : (
          <ul className="flex-1 space-y-3 overflow-y-auto p-5">
            {lines.map((line) => (
              <li
                key={`${line.productId}-${line.selections.join("-")}`}
                className="flex gap-3 rounded-lg border border-border bg-surface-raised p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface">
                  {line.image ? (
                    <img src={line.image} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{line.name}</p>
                  {line.selections.length > 0 ? (
                    <p className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                      {line.selections.join(" · ")}
                    </p>
                  ) : null}

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5 rounded-md border border-border">
                      <button
                        type="button"
                        aria-label={`Decrease ${line.name} quantity`}
                        onClick={() => onQuantity(line.productId, line.selections, line.quantity - 1)}
                        className="inline-flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:text-signal"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="min-w-[2ch] text-center font-mono text-xs font-bold">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${line.name} quantity`}
                        onClick={() => onQuantity(line.productId, line.selections, line.quantity + 1)}
                        className="inline-flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:text-signal"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <span className="font-mono text-sm font-bold text-foreground">
                      {formatPrice(line.price * line.quantity)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${line.name}`}
                  onClick={() => onRemove(line.productId, line.selections)}
                  className="self-start p-1 text-muted-foreground transition-colors hover:text-ember"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="border-t border-border p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
              Subtotal
            </span>
            <span className="font-mono text-lg font-bold text-foreground">{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-1 text-[0.72rem] text-muted-foreground">Shipping and tax calculated at checkout.</p>

          <a
            href={checkoutUrl(lines)}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={lines.length === 0}
            onClick={(event) => {
              if (lines.length === 0) event.preventDefault();
            }}
            className={cn(
              "mt-4 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-md font-mono text-[0.74rem] font-bold uppercase tracking-[0.18em] transition-all duration-300",
              lines.length === 0
                ? "pointer-events-none bg-surface-raised text-muted-foreground"
                : "bg-signal text-primary-foreground hover:shadow-glow active:scale-[0.99]",
            )}
          >
            Checkout
            <ArrowUpRight size={15} />
          </a>
        </footer>
      </aside>
    </>
  );
};
