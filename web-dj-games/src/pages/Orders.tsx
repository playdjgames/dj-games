import { ChevronDown, KeyRound, Loader2, LogOut, Receipt, RefreshCw, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { OrderLines, OrderProgress } from "@/components/store/OrderSummary";
import { useSeo } from "@/hooks/use-seo";
import { centsToPrice, fetchAdminOrders, orderStage, OrdersAuthError, type AdminOrder } from "@/lib/merch";
import { cn } from "@/lib/utils";

/** Same key the Subscribers page stores — one unlock covers both studio pages. */
const STORAGE_KEY = "dj-games-newsletter-key";

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * Private store order dashboard (owner only, not linked). Every order with
 * buyer, items, payment, Printify hand-off and — on demand — live tracking.
 */
const Orders = () => {
  useSeo({ title: "Orders — DJ Games", description: "Private store orders for DJ Games.", noIndex: true });

  const [adminKey, setAdminKey] = useState<string>("");
  const [keyInput, setKeyInput] = useState<string>("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [hasTracking, setHasTracking] = useState<boolean>(false);
  const [showAbandoned, setShowAbandoned] = useState<boolean>(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setAdminKey(saved);
  }, []);

  const signOut = useCallback((): void => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAdminKey("");
    setKeyInput("");
    setOrders([]);
    setHasLoaded(false);
  }, []);

  const load = useCallback(
    async (key: string, withTracking: boolean): Promise<void> => {
      setIsLoading(true);
      try {
        setOrders(await fetchAdminOrders(key, withTracking));
        setHasLoaded(true);
        setHasTracking(withTracking);
        window.localStorage.setItem(STORAGE_KEY, key);
      } catch (error: unknown) {
        if (error instanceof OrdersAuthError) {
          toast.error("Access denied", { description: error.message });
          signOut();
        } else {
          console.warn("orders load failed", error);
          toast.error("Couldn't load orders", { description: "Please try again in a moment." });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [signOut],
  );

  useEffect(() => {
    if (adminKey.length > 0 && !hasLoaded && !isLoading) void load(adminKey, false);
  }, [adminKey, hasLoaded, isLoading, load]);

  const onUnlock = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const value = keyInput.trim();
      if (value.length === 0) return;
      setAdminKey(value);
      void load(value, false);
    },
    [keyInput, load],
  );

  const paid = useMemo(() => orders.filter((order) => order.payment_status.startsWith("paid")), [orders]);
  const visible = useMemo(() => (showAbandoned ? orders : paid), [orders, paid, showAbandoned]);
  const revenue = useMemo(() => paid.reduce((sum, order) => sum + order.total_cents, 0), [paid]);
  const needsAttention = useMemo(() => paid.filter((order) => order.fulfillment_status === "failed").length, [paid]);

  const isUnlocked = adminKey.length > 0 && hasLoaded;

  return (
    <>
      <Hero
        compact
        eyebrow="Studio only"
        title={
          <>
            Store <span className="text-signal text-glow">orders</span>
          </>
        }
        description="Every DJ Games store checkout — guest or not — with payment, print and shipping status."
        stamp={["Private", "Studio", "Data"]}
      />

      <section className="container py-16 sm:py-20">
        {!isUnlocked ? (
          <Reveal>
            <div className="surface-card corner-ticks mx-auto max-w-md p-7 sm:p-9">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-raised text-signal">
                <KeyRound size={20} />
              </span>
              <h2 className="display-title mt-5 text-2xl">Enter your access key</h2>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-muted-foreground">
                Same studio admin key as the Subscribers page. It stays saved in this browser only.
              </p>
              <form onSubmit={onUnlock} className="mt-6 flex flex-col gap-3">
                <label htmlFor="orders-admin-key" className="sr-only">
                  Admin key
                </label>
                <input
                  id="orders-admin-key"
                  type="password"
                  autoComplete="current-password"
                  value={keyInput}
                  onChange={(event) => setKeyInput(event.target.value)}
                  placeholder="Access key"
                  className="min-h-[52px] rounded-md border border-border bg-surface-raised px-4 font-mono text-[0.9rem] text-foreground placeholder:text-muted-foreground/70 transition-colors duration-200 focus:border-signal/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || keyInput.trim().length === 0}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-md bg-signal px-6 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98] disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={15} className="animate-spin" /> : null}
                  Unlock
                </button>
              </form>
            </div>
          </Reveal>
        ) : (
          <>
            <Reveal>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Paid orders", value: String(paid.length) },
                  { label: "Revenue (incl. shipping)", value: centsToPrice(revenue) },
                  { label: "Needs attention", value: String(needsAttention), alert: needsAttention > 0 },
                ].map((stat) => (
                  <div key={stat.label} className="surface-card p-5">
                    <p className={cn("display-title text-3xl", stat.alert ? "text-ember" : "text-foreground")}>
                      {stat.value}
                    </p>
                    <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2.5 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={showAbandoned}
                    onChange={(event) => setShowAbandoned(event.target.checked)}
                    className="h-4 w-4 accent-[hsl(var(--signal))]"
                  />
                  Show unpaid / abandoned ({orders.length - paid.length})
                </label>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => void load(adminKey, true)}
                    disabled={isLoading}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-signal px-4 font-mono text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98] disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                    {hasTracking ? "Refresh tracking" : "Load tracking"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void load(adminKey, hasTracking)}
                    disabled={isLoading}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-surface-raised px-4 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-signal/50 hover:text-foreground disabled:opacity-60"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-surface-raised px-4 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-ember/50 hover:text-ember"
                  >
                    <LogOut size={14} />
                    Lock
                  </button>
                </div>
              </div>
            </Reveal>

            <Reveal delay={90}>
              {visible.length === 0 ? (
                <div className="surface-card mt-8 p-10 text-center">
                  <Receipt size={26} className="mx-auto text-muted-foreground" />
                  <p className="mt-4 font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
                    No {showAbandoned ? "" : "paid "}orders yet
                  </p>
                </div>
              ) : (
                <ul className="mt-8 space-y-3">
                  {visible.map((order) => {
                    const stage = orderStage(order);
                    const isOpen = openId === order.id;
                    return (
                      <li key={order.id} className="surface-card overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenId(isOpen ? null : order.id)}
                          aria-expanded={isOpen}
                          className="flex min-h-[64px] w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-raised/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.95rem] text-foreground">
                              {order.name || order.email}{" "}
                              <span className="text-muted-foreground">
                                · {order.lines.map((line) => `${line.qty}× ${line.title}`).join(", ")}
                              </span>
                            </p>
                            <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                              {order.id} · {formatDateTime(order.created_at)}
                              {order.payment_status === "paid_test" ? " · TEST" : ""}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "hidden shrink-0 rounded-full border px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] sm:inline",
                              stage.tone === "ok" && "border-signal/40 text-signal",
                              stage.tone === "wait" && "border-border text-muted-foreground",
                              stage.tone === "bad" && "border-ember/50 text-ember",
                            )}
                          >
                            {stage.label}
                          </span>
                          <span className="shrink-0 font-mono text-sm text-foreground">
                            {centsToPrice(order.total_cents)}
                          </span>
                          <ChevronDown
                            size={16}
                            className={cn("shrink-0 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")}
                          />
                        </button>

                        {isOpen ? (
                          <div className="grid gap-8 border-t border-border/60 px-5 py-6 lg:grid-cols-2">
                            <div>
                              <OrderProgress order={order} />
                              <dl className="mt-6 space-y-2 font-mono text-[0.7rem]">
                                <div className="flex justify-between gap-4">
                                  <dt className="uppercase tracking-[0.14em] text-muted-foreground">Email</dt>
                                  <dd>
                                    <a href={`mailto:${order.email}`} className="text-foreground hover:text-signal">
                                      {order.email}
                                    </a>
                                  </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <dt className="uppercase tracking-[0.14em] text-muted-foreground">Printify order</dt>
                                  <dd className="text-foreground">{order.printify_order_id ?? "—"}</dd>
                                </div>
                                {order.printify_status ? (
                                  <div className="flex justify-between gap-4">
                                    <dt className="uppercase tracking-[0.14em] text-muted-foreground">Printify status</dt>
                                    <dd className="text-foreground">{order.printify_status}</dd>
                                  </div>
                                ) : null}
                                {order.last_error ? (
                                  <div className="rounded-md border border-ember/40 bg-ember/10 p-3 text-ember">
                                    {order.last_error}
                                  </div>
                                ) : null}
                              </dl>
                              {!hasTracking && order.printify_order_id ? (
                                <p className="mt-4 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                                  Tap “Load tracking” for live print &amp; shipping status
                                </p>
                              ) : null}
                            </div>
                            <OrderLines order={order} />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Reveal>
          </>
        )}
      </section>
    </>
  );
};

export default Orders;
