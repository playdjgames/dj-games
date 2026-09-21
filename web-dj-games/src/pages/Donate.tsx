import { ArrowLeft } from "lucide-react";
import { useCallback, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import { AMOUNT_CHIPS, DEFAULT_AMOUNT, PAYMENT_METHODS } from "@/data/payments";
import { useSeo } from "@/hooks/use-seo";

/* ------------------------------- constants -------------------------------- */

const ACCENT = "#8BE1FF";

/* --------------------------------- atoms ---------------------------------- */

/** Section label — tiny uppercase tracking, ice. */
const SectionLabel = ({ children }: { children: string }) => (
  <h2 className="mb-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#8BE1FF]">
    {children}
  </h2>
);

/* --------------------------------- page ----------------------------------- */

/**
 * Tip-jar screen for DJ Games. Fully driven by PAYMENT_METHODS in
 * data/payments.ts — a new platform is data, not new UI. One column,
 * max ~520px, dark nightlife palette, safe-area aware.
 */
const Donate = () => {
  const navigate = useNavigate();
  // Default selection = first live method (PayPal today).
  const [selectedId, setSelectedId] = useState<string>(
    () => PAYMENT_METHODS.find((m) => m.live)?.id ?? "",
  );
  const [amount, setAmount] = useState<string>(String(DEFAULT_AMOUNT));

  useSeo({
    title: "Support DJ Games — Donate",
    description:
      "Tips keep LAST CALL moving. Support DJ Games with a tip via PayPal — more payment options coming soon.",
  });

  const numericAmount = Number.parseInt(amount, 10);
  const amountValid = Number.isInteger(numericAmount) && numericAmount >= 1;

  const selected = PAYMENT_METHODS.find((m) => m.id === selectedId) ?? null;
  const canPay = Boolean(selected?.live) && amountValid;

  /** ← Back returns to wherever the user came from (home / coming-soon). */
  const onBack = useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate]);

  /** Integers only, minimum enforced on the derived value (not while typing). */
  const onAmountInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "").slice(0, 5);
    setAmount(digits);
  }, []);

  const selectMethod = useCallback((id: string, live: boolean) => {
    if (live) {
      setSelectedId(id);
    }
  }, []);

  return (
    <div className="donate-root relative min-h-screen bg-[#0A0E14] text-[#EDF5FB] antialiased selection:bg-[#8BE1FF] selection:text-[#0A0E14]">
      {/* Soft amber + ice radial glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-28 right-[-5rem] h-[22rem] w-[22rem] rounded-full bg-[#FFB020]/[0.16] blur-[110px]" />
        <div className="absolute bottom-[-7rem] left-[-6rem] h-[24rem] w-[24rem] rounded-full bg-[#8BE1FF]/[0.09] blur-[130px]" />
        <div className="absolute left-1/2 top-[38%] h-[16rem] w-[26rem] -translate-x-1/2 rounded-full bg-[#FFB020]/[0.06] blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[520px] px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full pr-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#8FA3B4] transition-colors duration-200 hover:text-[#EDF5FB] active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        {/* Header */}
        <header className="mt-8">
          <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#8BE1FF]">
            DJ Games
          </p>
          <h1 className="dj-display mt-3 text-[3.1rem] leading-[0.95] tracking-[0.01em] text-[#EDF5FB]">
            Support the house
          </h1>
          <p className="mt-4 text-[0.98rem] leading-relaxed text-[#8FA3B4]">
            Tips keep LAST CALL moving. Pick a method, pick an amount. More payment
            options will show up here as they go live.
          </p>
        </header>

        {/* PAY WITH */}
        <section className="mt-10" aria-labelledby="pay-with-label">
          <SectionLabel>Pay with</SectionLabel>
          <div role="radiogroup" aria-label="Payment method" className="grid gap-3">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = method.id === selectedId;
              const selectable = method.live;
              return (
                <button
                  key={method.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={!selectable}
                  onClick={() => selectMethod(method.id, method.live)}
                  className={[
                    "flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-200",
                    selectable
                      ? "cursor-pointer active:scale-[0.99]"
                      : "cursor-not-allowed opacity-40",
                    isSelected
                      ? "border-[#8BE1FF] bg-[#8BE1FF]/[0.06] shadow-[0_0_24px_-8px_#8BE1FF66]"
                      : "border-[#263444] bg-[#131A24] hover:border-[#33475C]",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[1.05rem] font-black"
                    style={{
                      backgroundColor: method.badge?.bg ?? "#263444",
                      color: method.badge?.text ?? "#EDF5FB",
                    }}
                  >
                    {method.badge?.glyph ?? method.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.02rem] font-bold leading-tight text-[#EDF5FB]">
                      {method.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-[0.66rem] font-medium uppercase tracking-[0.16em] text-[#8FA3B4]">
                      {method.meta}
                    </span>
                  </span>
                  {/* Selection dot */}
                  <span
                    aria-hidden="true"
                    className={[
                      "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
                      isSelected ? "border-[#8BE1FF]" : "border-[#263444]",
                    ].join(" ")}
                  >
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#8BE1FF]" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* AMOUNT */}
        <section className="mt-9" aria-labelledby="amount-label">
          <SectionLabel>Amount</SectionLabel>
          <div className="flex flex-wrap items-center gap-2.5">
            {AMOUNT_CHIPS.map((chip) => {
              const isPicked = numericAmount === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  aria-pressed={isPicked}
                  onClick={() => setAmount(String(chip))}
                  className={[
                    "inline-flex min-h-[48px] min-w-[72px] items-center justify-center rounded-full border px-6 font-mono text-[0.9rem] font-bold transition-all duration-200 active:scale-[0.96]",
                    isPicked
                      ? "border-[#8BE1FF] bg-[#8BE1FF]/[0.08] text-[#8BE1FF] shadow-[0_0_20px_-6px_#8BE1FF66]"
                      : "border-[#263444] bg-[#131A24] text-[#8FA3B4] hover:border-[#33475C] hover:text-[#EDF5FB]",
                  ].join(" ")}
                >
                  ${chip}
                </button>
              );
            })}
            {/* Custom USD input — integers, min 1 */}
            <div
              className={[
                "ml-auto flex min-h-[48px] items-center gap-1.5 rounded-full border bg-[#131A24] px-5 transition-colors duration-200 focus-within:border-[#8BE1FF]",
                !amountValid ? "border-[#FFB020]/70" : "border-[#263444]",
              ].join(" ")}
            >
              <span aria-hidden="true" className="font-mono text-[0.9rem] font-bold text-[#8FA3B4]">
                $
              </span>
              <label htmlFor="donate-custom-amount" className="sr-only">
                Custom amount (USD), minimum one dollar
              </label>
              <input
                id="donate-custom-amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="Custom"
                value={amount}
                onChange={onAmountInput}
                className="w-[4.5rem] bg-transparent py-3 font-mono text-[0.9rem] font-bold text-[#EDF5FB] placeholder:font-medium placeholder:text-[#8FA3B4]/60 focus:outline-none"
              />
            </div>
          </div>
          {!amountValid && (
            <p className="mt-2.5 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[#FFB020]">
              Minimum tip is $1
            </p>
          )}
        </section>

        {/* Primary CTA */}
        <div className="mt-9">
          {canPay && selected ? (
            <a
              href={selected.url(numericAmount)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: selected.theme?.bg ?? ACCENT,
                color: selected.theme?.text ?? "#0A0E14",
              }}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full font-mono text-[0.82rem] font-bold uppercase tracking-[0.18em] shadow-[0_14px_40px_-14px_rgba(0,0,0,0.8)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              {selected.cta}
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex min-h-[56px] w-full cursor-not-allowed items-center justify-center rounded-full bg-[#131A24] font-mono text-[0.82rem] font-bold uppercase tracking-[0.18em] text-[#8FA3B4]"
            >
              Coming soon
            </button>
          )}
        </div>

        {/* Fine print */}
        <p className="mt-5 text-center text-[0.78rem] leading-relaxed text-[#8FA3B4]">
          You’ll finish checkout on the provider. We never see your card details.
          Not tax-deductible.
        </p>
      </main>
    </div>
  );
};

export default Donate;
