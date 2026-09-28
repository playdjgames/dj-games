import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Lock, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import { cartSubtotal, formatPrice, type CartLine } from "@/data/store";
import { centsToPrice, placeMerchOrder, quoteMerch, type MerchAddress, type MerchQuote } from "@/lib/merch";
import { cn } from "@/lib/utils";

interface CartDrawerProps {
  open: boolean;
  lines: CartLine[];
  onClose: () => void;
  onQuantity: (productId: string, selections: string[], quantity: number) => void;
  onRemove: (productId: string, selections: string[]) => void;
}

type Step = "bag" | "ship" | "review";

const EMPTY_ADDRESS: MerchAddress = {
  email: "",
  name: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
};

const FIELD =
  "min-h-[46px] w-full rounded-md border border-border bg-surface-raised px-3 text-[0.92rem] text-foreground placeholder:text-muted-foreground/60 focus:border-signal focus:outline-none";
const LABEL = "font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted-foreground";

/**
 * Slide-in bag with the whole checkout inside it: bag → shipping address →
 * review with real shipping → secure card payment. Everything happens on the
 * DJ Games store page.
 *
 * Rendered through a portal on `document.body`: the page's `<main>` is
 * `relative z-10`, which creates a stacking context, so a drawer rendered
 * inside it could never rise above the `z-50` navbar.
 */
export const CartDrawer = ({ open, lines, onClose, onQuantity, onRemove }: CartDrawerProps) => {
  const subtotal = cartSubtotal(lines);
  const [step, setStep] = useState<Step>("bag");
  const [address, setAddress] = useState<MerchAddress>(EMPTY_ADDRESS);

  const quote = useMutation<MerchQuote, Error, void>({
    mutationFn: () => quoteMerch(lines, address),
    onSuccess: () => setStep("review"),
  });

  const pay = useMutation<{ url?: string; orderId?: string }, Error, void>({
    mutationFn: () => placeMerchOrder(lines, address),
    onSuccess: (result) => {
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      if (result.orderId) window.location.assign(`/checkout/done/${encodeURIComponent(result.orderId)}`);
    },
  });

  // Editing the bag invalidates the quote — send the shopper back to the bag.
  useEffect(() => {
    if (lines.length === 0) setStep("bag");
    else if (step === "review") setStep("ship");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const setField = (key: keyof MerchAddress, value: string): void => {
    setAddress((current) => ({ ...current, [key]: value }));
  };

  const submitAddress = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    quote.mutate();
  };

  const isPaying = pay.isPending || (pay.isSuccess && Boolean(pay.data?.url));
  const title = step === "bag" ? "Your bag" : step === "ship" ? "Shipping" : "Review & pay";

  return createPortal(
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[100] bg-background/70 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="Shopping bag"
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-[101] flex w-full max-w-[420px] flex-col border-l border-border bg-surface shadow-2xl shadow-black/60 transition-transform duration-300 ease-out",
          "pt-[env(safe-area-inset-top)]",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            {step !== "bag" ? (
              <button
                type="button"
                onClick={() => setStep(step === "review" ? "ship" : "bag")}
                aria-label="Back"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:border-signal/50 hover:text-signal"
              >
                <ArrowLeft size={17} />
              </button>
            ) : null}
            <div>
              <h2 className="display-title text-xl">{title}</h2>
              {lines.length > 0 ? (
                <p className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Step {step === "bag" ? 1 : step === "ship" ? 2 : 3} of 3
                </p>
              ) : null}
            </div>
          </div>
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
        ) : step === "bag" ? (
          <>
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
                          onClick={() => onQuantity(line.productId, line.selections, Math.min(20, line.quantity + 1))}
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

            <footer className="border-t border-border p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Subtotal
                </span>
                <span className="font-mono text-lg font-bold text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-[0.72rem] text-muted-foreground">Shipping calculated at the next step. US only.</p>

              <button
                type="button"
                onClick={() => setStep("ship")}
                className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center rounded-md bg-signal font-mono text-[0.74rem] font-bold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.99]"
              >
                Checkout
              </button>
            </footer>
          </>
        ) : step === "ship" ? (
          <form onSubmit={submitAddress} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-3.5 overflow-y-auto p-5">
              <label className="block space-y-1.5">
                <span className={LABEL}>Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={address.email}
                  onChange={(event) => setField("email", event.target.value)}
                  className={FIELD}
                  placeholder="you@example.com"
                />
              </label>
              <label className="block space-y-1.5">
                <span className={LABEL}>Full name</span>
                <input
                  required
                  autoComplete="name"
                  value={address.name}
                  onChange={(event) => setField("name", event.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={LABEL}>Street address</span>
                <input
                  required
                  autoComplete="address-line1"
                  value={address.address1}
                  onChange={(event) => setField("address1", event.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={LABEL}>Apt, suite (optional)</span>
                <input
                  autoComplete="address-line2"
                  value={address.address2}
                  onChange={(event) => setField("address2", event.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={LABEL}>City</span>
                <input
                  required
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={(event) => setField("city", event.target.value)}
                  className={FIELD}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className={LABEL}>State</span>
                  <input
                    required
                    autoComplete="address-level1"
                    maxLength={2}
                    value={address.state}
                    onChange={(event) => setField("state", event.target.value.toUpperCase())}
                    className={FIELD}
                    placeholder="GA"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={LABEL}>ZIP</span>
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="postal-code"
                    pattern="[0-9]{5}(-[0-9]{4})?"
                    value={address.zip}
                    onChange={(event) => setField("zip", event.target.value)}
                    className={FIELD}
                  />
                </label>
              </div>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                Ships to United States addresses only
              </p>

              {quote.isError ? (
                <p role="alert" className="rounded-md border border-ember/50 bg-ember/10 px-3 py-2.5 text-[0.8rem] text-ember">
                  {quote.error.message}
                </p>
              ) : null}
            </div>

            <footer className="border-t border-border p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
              <button
                type="submit"
                disabled={quote.isPending}
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-md bg-signal font-mono text-[0.74rem] font-bold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.99] disabled:opacity-70"
              >
                {quote.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                {quote.isPending ? "Getting shipping…" : "Continue to review"}
              </button>
            </footer>
          </form>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <ul className="divide-y divide-border rounded-lg border border-border bg-surface-raised">
                {(quote.data?.lines ?? []).map((line, index) => (
                  <li key={`${line.title}-${index}`} className="flex items-start justify-between gap-3 p-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">{line.title}</span>
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                        {[line.color_label, line.size_label].filter((label) => label && label !== "Default").join(" · ") ||
                          "One size"}{" "}
                        · Qty {line.qty}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-sm font-bold">{centsToPrice(line.unit_cents * line.qty)}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-lg border border-border p-3 text-[0.82rem] leading-relaxed text-muted-foreground">
                <p className={LABEL}>Ship to</p>
                <p className="mt-1.5 text-foreground">{address.name}</p>
                <p>
                  {address.address1}
                  {address.address2 ? `, ${address.address2}` : ""}
                </p>
                <p>
                  {address.city}, {address.state} {address.zip}
                </p>
                <p>{address.email}</p>
              </div>

              <dl className="space-y-1.5 font-mono text-[0.78rem]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Merchandise</dt>
                  <dd>{centsToPrice(quote.data?.merchandise_cents ?? 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd>{centsToPrice(quote.data?.shipping_cents ?? 0)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="text-signal">{centsToPrice(quote.data?.total_cents ?? 0)}</dd>
                </div>
              </dl>

              {pay.isError ? (
                <p role="alert" className="rounded-md border border-ember/50 bg-ember/10 px-3 py-2.5 text-[0.8rem] text-ember">
                  {pay.error.message}
                </p>
              ) : null}
            </div>

            <footer className="border-t border-border p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
              <button
                type="button"
                onClick={() => pay.mutate()}
                disabled={isPaying}
                className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-md bg-signal font-mono text-[0.76rem] font-bold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.99] disabled:opacity-70"
              >
                {isPaying ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
                {isPaying ? "Opening secure payment…" : `Pay ${centsToPrice(quote.data?.total_cents ?? 0)}`}
              </button>
              <p className="mt-2 text-center text-[0.72rem] text-muted-foreground">
                Card payment by Stripe. Printed to order and shipped to you.
              </p>
            </footer>
          </>
        )}
      </aside>
    </>,
    document.body,
  );
};
