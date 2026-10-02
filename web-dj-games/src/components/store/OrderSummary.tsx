import { Check, ExternalLink, Package } from "lucide-react";
import { memo } from "react";

import { centsToPrice, orderStage, type OrderDetail } from "@/lib/merch";
import { cn } from "@/lib/utils";

const STEPS = ["Paid", "Printing", "Shipped", "Delivered"] as const;

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

/** Status pill + 4-step progress track for one order. */
export const OrderProgress = memo(({ order }: { order: OrderDetail }) => {
  const stage = orderStage(order);
  return (
    <div>
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.16em]",
          stage.tone === "ok" && "border-signal/45 bg-signal/10 text-signal",
          stage.tone === "wait" && "border-border bg-surface-raised text-muted-foreground",
          stage.tone === "bad" && "border-ember/50 bg-ember/10 text-ember",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {stage.label}
      </span>

      <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Order progress">
        {STEPS.map((label, index) => {
          const done = stage.tone !== "bad" && stage.step >= index + 1;
          return (
            <li key={label} className="flex flex-col gap-2">
              <span
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-500",
                  done ? "bg-signal shadow-[0_0_12px_-2px_hsl(var(--signal))]" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "flex items-center gap-1 font-mono text-[0.58rem] uppercase tracking-[0.14em]",
                  done ? "text-foreground" : "text-muted-foreground/70",
                )}
              >
                {done ? <Check size={11} className="text-signal" /> : null}
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
});
OrderProgress.displayName = "OrderProgress";

/** Items, totals and tracking links for one order. */
export const OrderLines = memo(({ order }: { order: OrderDetail }) => (
  <div>
    <ul className="divide-y divide-border/60">
      {order.lines.map((line, index) => {
        const options = [line.size_label, line.color_label].filter((label) => label && label !== "Default").join(" · ");
        return (
          <li key={`${line.title}-${index}`} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-[0.95rem] text-foreground">{line.title}</p>
              <p className="mt-0.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                {options ? `${options} · ` : ""}Qty {line.qty}
              </p>
            </div>
            <p className="shrink-0 font-mono text-sm text-foreground">{centsToPrice(line.unit_cents * line.qty)}</p>
          </li>
        );
      })}
    </ul>

    <dl className="mt-3 space-y-1.5 border-t border-border/60 pt-4 font-mono text-[0.78rem]">
      <div className="flex justify-between text-muted-foreground">
        <dt>Merchandise</dt>
        <dd>{centsToPrice(order.merchandise_cents)}</dd>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <dt>Shipping</dt>
        <dd>{centsToPrice(order.shipping_cents)}</dd>
      </div>
      <div className="flex justify-between pt-1 text-[0.9rem] text-foreground">
        <dt>Total</dt>
        <dd>{centsToPrice(order.total_cents)}</dd>
      </div>
    </dl>

    {order.shipments.length > 0 ? (
      <div className="mt-6 space-y-2.5">
        {order.shipments.map((shipment) => (
          <a
            key={`${shipment.carrier}-${shipment.number}`}
            href={shipment.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] items-center justify-between gap-3 rounded-md border border-signal/40 bg-signal/[0.07] px-4 transition-colors hover:bg-signal/[0.12]"
          >
            <span className="flex items-center gap-3">
              <Package size={17} className="text-signal" />
              <span>
                <span className="block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-signal">
                  {shipment.carrier || "Carrier"} tracking
                </span>
                <span className="block font-mono text-[0.8rem] text-foreground">{shipment.number}</span>
              </span>
            </span>
            {shipment.url ? <ExternalLink size={15} className="text-muted-foreground" /> : null}
          </a>
        ))}
      </div>
    ) : null}

    <p className="mt-5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
      Ordered {formatDate(order.created_at)}
      {order.ship_to ? ` · Ships to ${order.ship_to}` : ""}
    </p>
  </div>
));
OrderLines.displayName = "OrderLines";
