import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { OrderLines, OrderProgress } from "@/components/store/OrderSummary";
import { useSeo } from "@/hooks/use-seo";
import { lookupMerchOrder, MerchError, type OrderDetail } from "@/lib/merch";

const INPUT_CLASS =
  "min-h-[52px] w-full rounded-md border border-border bg-surface-raised px-4 text-[0.95rem] text-foreground placeholder:text-muted-foreground/70 transition-colors duration-200 focus:border-signal/60 focus:outline-none";

/**
 * Guest order history: no account, just the order number from the receipt
 * and the email used at checkout. Shows status, items and live tracking.
 */
const OrderLookup = () => {
  useSeo({
    title: "Find my order — DJ Games Store",
    description: "Check the status and tracking of your DJ Games merch order with your order number and email.",
    noIndex: true,
  });

  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState<string>(searchParams.get("order") ?? "");
  const [email, setEmail] = useState<string>("");

  const lookup = useMutation<OrderDetail, Error, { id: string; email: string }>({
    mutationFn: ({ id, email: address }) => lookupMerchOrder(id, address),
  });

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      lookup.mutate({ id: orderId.trim().toUpperCase(), email: email.trim() });
    },
    [email, lookup, orderId],
  );

  const canSubmit = /^DJG-?[A-Z0-9]{6,}$/i.test(orderId.trim()) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const order = lookup.data;
  const errorMessage =
    lookup.error instanceof MerchError ? lookup.error.message : lookup.error ? "SOMETHING WENT WRONG — TRY AGAIN" : "";

  return (
    <>
      <Hero
        compact
        eyebrow="DJ Games Store"
        title={
          <>
            Find my <span className="text-signal text-glow">order</span>
          </>
        }
        description="Checked out as a guest? Enter your order number and the email you used — no account needed."
        stamp={["Track", "Your", "Merch"]}
      />

      <section className="container py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <form onSubmit={onSubmit} className="surface-card corner-ticks p-7 sm:p-8">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-signal/30 bg-signal/10 text-signal">
                <Search size={19} />
              </span>
              <h2 className="display-title mt-5 text-2xl">Look it up</h2>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-muted-foreground">
                Your order number starts with <span className="font-mono text-foreground">DJG-</span>. It&rsquo;s on
                the confirmation page and your receipt email.
              </p>

              <label htmlFor="lookup-order" className="mt-6 block font-mono text-[0.62rem] uppercase tracking-[0.18em] text-signal">
                Order number
              </label>
              <input
                id="lookup-order"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="DJG-7K2QX9M4TB"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className={`${INPUT_CLASS} mt-2 font-mono uppercase`}
              />

              <label htmlFor="lookup-email" className="mt-4 block font-mono text-[0.62rem] uppercase tracking-[0.18em] text-signal">
                Checkout email
              </label>
              <input
                id="lookup-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                className={`${INPUT_CLASS} mt-2`}
              />

              <button
                type="submit"
                disabled={!canSubmit || lookup.isPending}
                className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-md bg-signal px-6 font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98] disabled:opacity-50"
              >
                {lookup.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
                Find order
                {lookup.isPending ? null : <ArrowRight size={14} />}
              </button>

              {errorMessage ? (
                <p role="alert" className="mt-4 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ember">
                  {errorMessage}
                </p>
              ) : null}
            </form>
          </Reveal>

          <Reveal delay={80}>
            {order ? (
              <div className="surface-card p-7 sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="eyebrow">Order</p>
                  <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-foreground">{order.id}</p>
                </div>
                <div className="mt-5">
                  <OrderProgress order={order} />
                </div>
                <div className="mt-7">
                  <OrderLines order={order} />
                </div>
                {order.shipments.length === 0 && order.payment_status.startsWith("paid") ? (
                  <p className="mt-5 text-[0.86rem] leading-relaxed text-muted-foreground">
                    Everything is printed to order, usually 2–7 business days before it ships. Tracking shows up here
                    and in your email the moment it leaves the printer.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Your order shows up here
                </p>
                <p className="mt-3 max-w-xs text-[0.88rem] leading-relaxed text-muted-foreground">
                  Status, items, totals and carrier tracking once it ships.
                </p>
                <Link
                  to="/support"
                  className="mt-6 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-signal transition-colors hover:text-foreground"
                >
                  Lost your order number? Contact support →
                </Link>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default OrderLookup;
