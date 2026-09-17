import { Download, KeyRound, Loader2, LogOut, RefreshCw, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { useSeo } from "@/hooks/use-seo";
import {
  downloadSubscribersCsv,
  fetchSubscribers,
  isNewsletterConnected,
  NewsletterAuthError,
  removeSubscriber,
  type Subscriber,
} from "@/lib/newsletter";

const STORAGE_KEY = "dj-games-newsletter-key";

const formatDate = (ms: number): string =>
  new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

/**
 * Private subscriber dashboard. Not linked from the site — reachable only by
 * typing /subscribers. The admin key is held in this browser's localStorage and
 * is never part of the deployed bundle.
 */
const Subscribers = () => {
  useSeo({
    title: "Subscribers — DJ Games",
    description: "Private subscriber list for DJ Games.",
    noIndex: true,
  });

  const [adminKey, setAdminKey] = useState<string>("");
  const [keyInput, setKeyInput] = useState<string>("");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setAdminKey(saved);
  }, []);

  const signOut = useCallback((): void => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAdminKey("");
    setKeyInput("");
    setSubscribers([]);
    setHasLoaded(false);
  }, []);

  const load = useCallback(
    async (key: string): Promise<void> => {
      setIsLoading(true);
      try {
        const rows = await fetchSubscribers(key);
        setSubscribers(rows);
        setHasLoaded(true);
        window.localStorage.setItem(STORAGE_KEY, key);
      } catch (error: unknown) {
        if (error instanceof NewsletterAuthError) {
          toast.error("Access denied", { description: error.message });
          signOut();
        } else {
          console.warn("subscriber load failed", error);
          toast.error("Couldn't load subscribers", { description: "Please try again in a moment." });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [signOut],
  );

  useEffect(() => {
    if (adminKey.length > 0 && !hasLoaded && !isLoading) void load(adminKey);
  }, [adminKey, hasLoaded, isLoading, load]);

  const onUnlock = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const value = keyInput.trim();
      if (value.length === 0) return;
      setAdminKey(value);
      void load(value);
    },
    [keyInput, load],
  );

  const onExport = useCallback(async (): Promise<void> => {
    setIsExporting(true);
    try {
      await downloadSubscribersCsv(adminKey);
      toast.success("CSV downloaded");
    } catch (error: unknown) {
      console.warn("csv export failed", error);
      toast.error("Export failed", { description: "Please try again in a moment." });
    } finally {
      setIsExporting(false);
    }
  }, [adminKey]);

  const onRemove = useCallback(
    async (email: string): Promise<void> => {
      if (!window.confirm(`Remove ${email} from the list?`)) return;
      try {
        await removeSubscriber(email, adminKey);
        setSubscribers((rows) => rows.filter((row) => row.email !== email));
        toast.success("Subscriber removed");
      } catch (error: unknown) {
        console.warn("subscriber removal failed", error);
        toast.error("Couldn't remove that subscriber");
      }
    },
    [adminKey],
  );

  const sourceCounts = useMemo((): { source: string; count: number }[] => {
    const counts = new Map<string, number>();
    for (const row of subscribers) counts.set(row.source, (counts.get(row.source) ?? 0) + 1);
    return [...counts.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
  }, [subscribers]);

  const isUnlocked = adminKey.length > 0 && hasLoaded;

  return (
    <>
      <Hero
        compact
        eyebrow="Studio only"
        title={
          <>
            Sub<span className="text-signal text-glow">scribers</span>
          </>
        }
        description="Everyone who signed up for game updates through the site."
        stamp={["Private", "Studio", "Data"]}
      />

      <section className="container py-16 sm:py-20">
        {!isNewsletterConnected() ? (
          <Reveal>
            <p className="font-mono text-sm uppercase tracking-[0.16em] text-ember">
              Backend not reachable — check the project configuration.
            </p>
          </Reveal>
        ) : !isUnlocked ? (
          <Reveal>
            <div className="surface-card corner-ticks mx-auto max-w-md p-7 sm:p-9">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-raised text-signal">
                <KeyRound size={20} />
              </span>
              <h2 className="display-title mt-5 text-2xl">Enter your access key</h2>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-muted-foreground">
                This page is private. Paste the newsletter admin key to view and export your list — it stays saved in
                this browser only.
              </p>

              <form onSubmit={onUnlock} className="mt-6 flex flex-col gap-3">
                <label htmlFor="admin-key" className="sr-only">
                  Admin key
                </label>
                <input
                  id="admin-key"
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
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-signal/40 bg-signal/10 text-signal">
                    <Users size={22} />
                  </span>
                  <div>
                    <p className="display-title text-3xl sm:text-4xl">{subscribers.length}</p>
                    <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">
                      {subscribers.length === 1 ? "Subscriber" : "Subscribers"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => void load(adminKey)}
                    disabled={isLoading}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-surface-raised px-4 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-signal/50 hover:text-foreground disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => void onExport()}
                    disabled={isExporting || subscribers.length === 0}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-signal px-5 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98] disabled:opacity-60"
                  >
                    {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-surface-raised px-4 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-ember/50 hover:text-ember"
                  >
                    <LogOut size={14} />
                    Lock
                  </button>
                </div>
              </div>
            </Reveal>

            {sourceCounts.length > 0 ? (
              <Reveal delay={60}>
                <div className="mt-7 flex flex-wrap gap-2">
                  {sourceCounts.map((item) => (
                    <span
                      key={item.source}
                      className="rounded-full border border-border bg-surface-raised px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      {item.source} · {item.count}
                    </span>
                  ))}
                </div>
              </Reveal>
            ) : null}

            <Reveal delay={90}>
              {subscribers.length === 0 ? (
                <div className="surface-card mt-10 p-10 text-center">
                  <p className="font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
                    No subscribers yet
                  </p>
                  <p className="mt-3 text-[0.92rem] text-muted-foreground">
                    Signups from the footer and community forms will appear here.
                  </p>
                </div>
              ) : (
                <div className="surface-card mt-10 overflow-hidden">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border/70">
                        <th className="px-5 py-4 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-signal">
                          Email
                        </th>
                        <th className="hidden px-5 py-4 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-signal sm:table-cell">
                          Source
                        </th>
                        <th className="hidden px-5 py-4 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-signal sm:table-cell">
                          Joined
                        </th>
                        <th className="px-5 py-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((row) => (
                        <tr key={row.email} className="border-b border-border/40 last:border-b-0">
                          <td className="px-5 py-4 text-[0.92rem] text-foreground">
                            <a href={`mailto:${row.email}`} className="transition-colors hover:text-signal">
                              {row.email}
                            </a>
                            <span className="mt-1 block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground sm:hidden">
                              {row.source} · {formatDate(row.created_at)}
                            </span>
                          </td>
                          <td className="hidden px-5 py-4 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground sm:table-cell">
                            {row.source}
                          </td>
                          <td className="hidden px-5 py-4 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground sm:table-cell">
                            {formatDate(row.created_at)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => void onRemove(row.email)}
                              aria-label={`Remove ${row.email}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-ember/40 hover:text-ember"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Reveal>
          </>
        )}
      </section>
    </>
  );
};

export default Subscribers;
