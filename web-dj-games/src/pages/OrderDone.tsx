import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { useCart } from "@/hooks/use-cart";
import { useSeo } from "@/hooks/use-seo";
import { centsToPrice, fetchMerchOrder, type MerchOrder } from "@/lib/merch";

/**
 * Where card payment returns shoppers. Stays on playdjgames.com, polls the
 * order until the payment settles, then empties the bag.
 */
const OrderDone = () => {
  useSeo({ title: "Order — DJ Games Store", description: "Your DJ Games merch order." });

  const { orderId = "" } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clear } = useCart();

  const order = useQuery<MerchOrder>({
    queryKey: ["merch-order", orderId, sessionId],
    queryFn: () => fetchMerchOrder(orderId, sessionId),
    enabled: orderId.length > 0,
    retry: 1,
    refetchInterval: (query) => (query.state.data?.order.payment_status === "unpaid" ? 3000 : false),
  });

  const status = order.data?.order.payment_status;
  const isPaid = status === "paid" || status === "paid_test";

  useEffect(() => {
    if (isPaid) clear();
  }, [isPaid, clear]);

  return (
    <section className="container flex min-h-[70vh] items-center justify-center py-16">
      <div className="surface-card corner-ticks w-full max-w-lg p-8 text-center sm:p-10">
        {order.isLoading || status === "unpaid" ? (
          <>
            <Loader2 size={30} className="mx-auto animate-spin text-signal" />
            <h1 className="display-title mt-5 text-3xl">Confirming payment</h1>
            <p className="mt-3 text-[0.95rem] text-muted-foreground">Hang tight — this takes a few seconds.</p>
          </>
        ) : isPaid ? (
          <>
            <CheckCircle2 size={34} className="mx-auto text-signal" />
            <p className="eyebrow mt-5">Order confirmed</p>
            <h1 className="display-title mt-2 text-4xl">
              You&rsquo;re <span className="text-signal text-glow">in</span>
            </h1>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">
              Your merch is being printed to order. A receipt is on its way
              {order.data?.order.email ? ` to ${order.data.order.email}` : ""}, and tracking follows once it ships.
            </p>
            {typeof order.data?.order.total_cents === "number" ? (
              <p className="mt-4 font-mono text-sm text-foreground">Paid {centsToPrice(order.data.order.total_cents)}</p>
            ) : null}
            <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
              Order {orderId}
            </p>
          </>
        ) : (
          <>
            <ShoppingBag size={30} className="mx-auto text-ember" />
            <h1 className="display-title mt-5 text-3xl">We couldn&rsquo;t confirm this order</h1>
            <p className="mt-3 text-[0.95rem] text-muted-foreground">
              {order.error instanceof Error ? order.error.message : "The payment didn't go through."} Your bag is
              still saved.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={isPaid ? "/store" : "/store?bag=open"}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-signal px-5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.16em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98]"
          >
            {isPaid ? "Keep shopping" : "Back to your bag"}
          </Link>
          <Link
            to="/support"
            className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-border px-5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-signal/45 hover:text-foreground"
          >
            Need help?
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OrderDone;
