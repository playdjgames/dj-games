import { ExternalLink, Gamepad2, Heart, Music, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { isLive, paypalMeUrl, DONATIONS } from "@/data/site";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

const PRESET_AMOUNTS = [3, 5, 10, 25] as const;
const MIN_CONTRIBUTION = 1;
const MAX_CONTRIBUTION = 2000;
type AmountMode = "preset" | "custom";

const WHERE_IT_GOES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Gamepad2,
    title: "Development",
    body: "Keeps the next worlds in production — from first sketch to App Store release.",
  },
  {
    icon: Wrench,
    title: "Tools & hardware",
    body: "Software licences, test devices, and the unglamorous gear every build depends on.",
  },
  {
    icon: Music,
    title: "Sound & art",
    body: "Original music, voice work, and the artwork that gives each game its look.",
  },
];

/**
 * Support page: visitors pick or type any whole-dollar amount and are handed
 * to PayPal.me to complete it. Payment is never handled on this site — the
 * CTA only composes a paypal.me URL, so nothing to pay with exists here.
 */
const Support = () => {
  useSeo({
    title: "Support — DJ Games",
    description:
      "Support DJ Games directly. Choose any amount to help fund development, tools, and original sound and art for our games.",
  });

  const [mode, setMode] = useState<AmountMode>("preset");
  const [presetAmount, setPresetAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>("");

  const amount = mode === "preset" ? presetAmount : Number.parseInt(customAmount, 10) || 0;
  const isValid = amount >= MIN_CONTRIBUTION && amount <= MAX_CONTRIBUTION && Number.isInteger(amount);
  const checkoutUrl = isValid ? paypalMeUrl(amount) : null;

  const selectPreset = useCallback((value: number) => {
    setMode("preset");
    setPresetAmount(value);
    setCustomAmount("");
  }, []);

  const onCustomChange = useCallback((value: string) => {
    const digits = value.replace(/[^\d]/g, "").slice(0, 4);
    setMode("custom");
    setCustomAmount(digits);
  }, []);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      // The <a> below already navigates when PayPal is live; this handler only
      // exists to stop form submits from reloading the page.
    },
    [],
  );

  return (
    <>
      <Hero
        compact
        eyebrow="Insert coin"
        title={
          <>
            Fuel The <span className="text-signal text-glow">Studio</span>
          </>
        }
        description="DJ Games is fully independent — no ads, no trackers, no publishers. Your support keeps it that way and goes straight into making the next game."
        stamp={["Play", "Create", "Repeat"]}
      />

      <section className="container grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <div className="surface-card corner-ticks p-6 sm:p-9">
            <p className="eyebrow">
              <span className="text-ember">//</span> Choose an amount
            </p>

            <form onSubmit={onSubmit} className="mt-6">
              <div className="flex flex-wrap gap-2.5" role="group" aria-label="Preset support amounts">
                {PRESET_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectPreset(value)}
                    aria-pressed={mode === "preset" && presetAmount === value}
                    className={cn(
                      "min-h-[44px] rounded-md border px-5 font-mono text-[0.78rem] font-semibold uppercase tracking-[0.14em] transition-all duration-200",
                      mode === "preset" && presetAmount === value
                        ? "border-signal bg-signal/10 text-signal shadow-glow"
                        : "border-border bg-surface-raised text-muted-foreground hover:border-signal/50 hover:text-foreground",
                    )}
                  >
                    ${value}
                  </button>
                ))}
              </div>

              <label
                htmlFor="support-custom-amount"
                className="mt-6 block font-mono text-[0.64rem] uppercase tracking-[0.22em] text-muted-foreground"
              >
                Or any amount you like
              </label>
              <div className="relative mt-2.5 max-w-xs">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground"
                >
                  $
                </span>
                <input
                  id="support-custom-amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="00"
                  value={customAmount}
                  onChange={(event) => onCustomChange(event.target.value)}
                  className={cn(
                    "min-h-[48px] w-full rounded-md border bg-surface-raised pl-8 pr-3 font-mono text-lg text-foreground placeholder:text-muted-foreground/60 transition-colors duration-200 focus:outline-none",
                    mode === "custom" && customAmount.length > 0 && !isValid
                      ? "border-ember/60 focus:border-ember"
                      : "border-border focus:border-signal/60",
                  )}
                />
              </div>
              {mode === "custom" && customAmount.length > 0 && !isValid ? (
                <p className="mt-2.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-ember">
                  Whole dollars only — between ${MIN_CONTRIBUTION} and ${MAX_CONTRIBUTION}
                </p>
              ) : null}

              <div className="mt-8">
                {checkoutUrl ? (
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-md bg-signal px-6 font-mono text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98] sm:w-auto"
                  >
                    Send ${amount} via PayPal
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-describedby="support-not-live-note"
                    className="inline-flex min-h-[52px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-border bg-surface-raised px-6 font-mono text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:w-auto"
                  >
                    <Heart size={14} />
                    Support via PayPal
                  </button>
                )}
                {!isLive(DONATIONS.paypalMe) ? (
                  <p
                    id="support-not-live-note"
                    className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    PayPal isn't connected yet — support launches soon
                  </p>
                ) : null}
              </div>
            </form>

            <div className="mt-8 flex items-start gap-2.5 border-t border-border/60 pt-6">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-signal" />
              <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
                You'll finish securely on PayPal. This site never sees your payment details, and contributions are
                voluntary — they support development and aren't tax-deductible.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <p className="eyebrow">
            <span className="text-ember">//</span> Where it goes
          </p>
          <h2 className="display-title mt-2 text-3xl sm:text-4xl">Every dollar makes games</h2>

          <ul className="mt-7 space-y-5">
            {WHERE_IT_GOES.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface-raised text-signal">
                  <item.icon size={18} />
                </span>
                <div>
                  <h3 className="font-display text-[0.95rem] font-bold uppercase tracking-wide">{item.title}</h3>
                  <p className="mt-1 text-[0.9rem] leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="surface-card mt-8 p-6">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-signal">Free ways to help</p>
            <ul className="mt-3 space-y-2 text-[0.9rem] leading-relaxed text-muted-foreground">
              <li>
                <Link to="/games" className="transition-colors hover:text-signal">
                  Play our games
                </Link>{" "}
                and leave a rating — it genuinely helps.
              </li>
              <li>Share the studio with someone who loves indie games.</li>
              <li>Send feedback or ideas through the contact page.</li>
            </ul>
          </div>
        </Reveal>
      </section>
    </>
  );
};

export default Support;
