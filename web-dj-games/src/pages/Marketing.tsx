import { ArrowRight, ArrowUpRight, Apple, Bell, Facebook, Instagram, Loader2, Mail, Menu, Music2, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Reveal } from "@/components/Reveal";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * DJ GAMES — MARKETING PAGE (/marketing)
 * ============================================================================
 * A single-page public destination for press, creators, Apple notes, social
 * bios, and campaign traffic. One scroll: who we are, what's live, what's
 * next, how to download or get notified, how to reach the studio. Then leave.
 *
 * Deliberately self-contained (own nav + footer, no site chrome) and uses its
 * own scoped campaign palette per the marketing spec (2026-09-21 ice-neon
 * pivot): blue-black #0A0E14, ice #8BE1FF, amber #FFB020. Every outbound link points at the real studio site.
 * ============================================================================
 */

const SITE_URL = "https://playdjgames.com";
const APP_STORE_URL = "https://apps.apple.com/us/app/everything-diy/id6803175688";

interface MkNavLink {
  label: string;
  href: string;
  /** Support renders in the ember accent, everywhere. */
  ember?: boolean;
}

const NAV: MkNavLink[] = [
  { label: "Home", href: `${SITE_URL}/` },
  { label: "Apps-n-Stuff", href: `${SITE_URL}/games` },
  { label: "Coming Soon", href: `${SITE_URL}/coming-soon` },
  { label: "About", href: `${SITE_URL}/about` },
  { label: "News", href: `${SITE_URL}/news` },
  { label: "Support", href: `${SITE_URL}/support`, ember: true },
];

const SUBMITTED = [
  { title: "Run Dummy", line: "Run. Remember. Escape.", href: `${SITE_URL}/games/run-dummy` },
  { title: "Vexara", line: "Neon fire, endless waves, one thumb.", href: `${SITE_URL}/games/vexara` },
  { title: "Astronix", line: "One thumb. Endless waves. Everything earned by play.", href: `${SITE_URL}/games/astronix` },
  { title: "ThinkSort", line: "Dump the chaos. Get one clear next step.", href: `${SITE_URL}/games/thinksort` },
] as const;

const CONCEPTS = [
  { title: "Valiant Kingdoms", line: "Banners on the ridge. A crown that won\u2019t hold itself.", href: `${SITE_URL}/games/valiant-kingdoms` },
  { title: "Neon World", line: "An unmapped planet, glowing in the dark.", href: `${SITE_URL}/games/neon-world` },
  { title: "Neon City: Underground", line: "Rain, neon, and whatever runs beneath the city.", href: `${SITE_URL}/games/neon-city-underground` },
] as const;

const SOCIALS = [
  { label: "TikTok", href: "https://www.tiktok.com/@djgamesgaming", Icon: Music2 },
  { label: "Instagram", href: "https://www.instagram.com/playdjgames/", Icon: Instagram },
  { label: "Facebook", href: "https://www.facebook.com/PlayDJGames", Icon: Facebook },
] as const;

/* ---------------------------------- atoms --------------------------------- */

/** Tiny uppercase tracking label — the section eyebrow used across the page. */
const MkLabel = ({ children }: { children: ReactNode }) => (
  <p className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.34em] text-[#8BE1FF]">{children}</p>
);

const primaryBtn =
  "inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-[#8BE1FF] px-7 font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#0A0E14] transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_36px_-8px_#8BE1FF99] active:scale-[0.97]";

const secondaryBtn =
  "inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border border-[#FFB020]/70 px-7 font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#FFB020] transition-all duration-200 hover:bg-[#FFB020] hover:text-[#0A0E14] active:scale-[0.97]";

/** Faint ice-blue grid layer — the studio's signature backdrop, scoped to this page. */
const GridLayer = ({ className }: { className?: string }) => (
  <div
    aria-hidden="true"
    className={cn("pointer-events-none absolute inset-0", className)}
    style={{
      backgroundImage:
        "linear-gradient(to right, color-mix(in srgb, var(--mk-glow, #8be1ff) 5%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--mk-glow, #8be1ff) 5%, transparent) 1px, transparent 1px)",
      backgroundSize: "56px 56px",
      maskImage: "radial-gradient(120% 90% at 50% 0%, black, transparent 78%)",
      WebkitMaskImage: "radial-gradient(120% 90% at 50% 0%, black, transparent 78%)",
    }}
  />
);

/** Amber square "DJ" + white "GAMES" wordmark → playdjgames.com. */
const Wordmark = () => (
  <a href={`${SITE_URL}/`} className="inline-flex items-center gap-2.5" aria-label="DJ Games — home">
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-[0.45rem] bg-[#FFB020] font-display text-[0.95rem] font-black leading-none text-[#0A0E14]">
      DJ
    </span>
    <span className="font-display text-[1.05rem] font-bold uppercase tracking-[0.08em] text-white">GAMES</span>
  </a>
);

/* ---------------------------------- page ---------------------------------- */

const Marketing = () => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useSeo({
    title: "DJ Games — Marketing",
    description:
      "DJ Games is an independent iOS studio. Everything DIY is out now on the App Store — more games are on the way.",
  });

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /**
   * The marketing page never claims a save. A valid email is handed to the real
   * notify form on the studio site (prefilled via ?email=), where the actual
   * signup happens.
   */
  const onNotifySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const value = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setError("Enter a valid email address.");
        return;
      }
      navigate({ pathname: "/coming-soon", search: `?email=${encodeURIComponent(value)}`, hash: "#notify" });
    },
    [email, navigate],
  );

  return (
    <div className="mk-page-bg min-h-screen text-[#E9F3FA] antialiased selection:bg-[#8BE1FF] selection:text-[#0A0E14]">
      {/* ------------------------------- NAV ------------------------------- */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#0A0E14]/85 backdrop-blur-xl">
        <nav className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-6 px-5 sm:px-8" aria-label="Main">
          <Wordmark />

          <ul className="hidden items-center gap-8 lg:flex">
            {NAV.map(({ label, href, ember }) => (
              <li key={label}>
                <a
                  href={href}
                  className={cn(
                    "text-[0.9rem] font-medium transition-colors duration-200",
                    ember ? "text-[#FFB020] hover:text-[#FFC24B]" : "text-[#9FB6C6] hover:text-white",
                  )}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* Menu only — the nav links carry navigation on their own. */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="-mr-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-[#8BE1FF]/50 hover:text-[#8BE1FF] lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* Mobile sheet */}
        <div
          className={cn(
            "fixed inset-x-0 top-[68px] bottom-0 origin-top border-t border-white/10 bg-[#0A0E14] transition-all duration-300 lg:hidden",
            menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
          )}
        >
          <ul className="flex flex-col px-6 py-6 pb-10">
            {NAV.map(({ label, href, ember }) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex min-h-[56px] items-center border-b border-white/[0.07] font-display text-2xl font-bold uppercase tracking-wide transition-colors",
                    ember ? "text-[#FFB020]" : "text-[#E9F3FA] hover:text-[#8BE1FF]",
                  )}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <main>
        {/* ------------------------------ HERO ------------------------------ */}
        <section className="relative overflow-hidden pt-[68px]" aria-labelledby="mk-hero-title">
          <GridLayer />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] max-w-full -translate-x-1/2 rounded-full bg-[#8BE1FF]/10 blur-[120px]"
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:pb-28 lg:pt-24">
            <div>
              <Reveal>
                <MkLabel>Studio</MkLabel>
              </Reveal>
              <Reveal delay={70}>
                <h1
                  id="mk-hero-title"
                  className="mt-5 font-display text-[3.4rem] font-black uppercase leading-[0.9] tracking-[-0.01em] text-white sm:text-7xl lg:text-[5.6rem]"
                  style={{ fontVariationSettings: '"wdth" 78' }}
                >
                  DJ <span className="text-[#8BE1FF]">GAMES</span>
                </h1>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-6 max-w-md text-xl font-light text-white/90 sm:text-2xl">
                  Original iOS games and apps. Built to play.
                </p>
                <p className="mt-3 font-mono text-[0.78rem] uppercase tracking-[0.2em] text-[#9FB6C6]">
                  No ads-first junk. No pay-to-win.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <div className="mt-7 flex flex-wrap items-center gap-2.5" aria-label="Status">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#8BE1FF]/40 bg-[#8BE1FF]/10 px-4 py-1.5 font-mono text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[#8BE1FF]">
                    <span className="relative inline-flex h-2 w-2" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8BE1FF] opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8BE1FF]" />
                    </span>
                    Live now
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-1.5 font-mono text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[#E9F3FA]">
                    Free
                  </span>
                </div>
              </Reveal>
              <Reveal delay={260}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={primaryBtn}>
                    <Apple size={18} className="fill-current" strokeWidth={0} />
                    Download on the App Store
                  </a>
                  <a href={`${SITE_URL}/coming-soon`} className={secondaryBtn}>
                    See what&rsquo;s coming
                    <ArrowRight size={16} />
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Abstract phone — frame and light only, never fake screenshots */}
            <Reveal delay={320} className="relative mx-auto hidden w-full max-w-[300px] lg:block">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8BE1FF]/15 blur-[90px]"
              />
              <div className="relative aspect-[9/19] overflow-hidden rounded-[2.6rem] border border-white/15 bg-[#0F1721] shadow-2xl shadow-black/60">
                <div className="absolute left-1/2 top-4 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black/80" />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(139,225,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139,225,255,0.07) 1px, transparent 1px)",
                    backgroundSize: "34px 34px",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#8BE1FF]/[0.14] to-transparent"
                />
                <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-2.5">
                  <span className="font-display text-5xl font-black text-[#8BE1FF]/90" style={{ fontVariationSettings: '"wdth" 78' }}>
                    DJ
                  </span>
                  <span className="font-mono text-[0.58rem] uppercase tracking-[0.3em] text-[#9FB6C6]">
                    Live now · Free
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------------------- LIVE NOW ---------------------------- */}
        <section className="relative border-t border-white/[0.07] py-20 sm:py-24" aria-labelledby="mk-live-title">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <MkLabel>Available now</MkLabel>
              <h2 id="mk-live-title" className="mt-4 font-display text-4xl font-black uppercase text-white sm:text-5xl" style={{ fontVariationSettings: '"wdth" 78' }}>
                Everything <span className="text-[#8BE1FF]">DIY</span>
              </h2>
              <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-[#9FB6C6]">
                Every DIY project, explained step by step — tools, where to get them, and a camera that helps identify
                what you&rsquo;re looking at.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={primaryBtn}>
                  <Apple size={18} className="fill-current" strokeWidth={0} />
                  Download on the App Store
                </a>
                <a
                  href={`${SITE_URL}/games/everything-diy`}
                  className="inline-flex min-h-[52px] items-center gap-2 px-2 font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#FFB020] transition-colors hover:text-[#FFC24B]"
                >
                  Learn more
                  <ArrowRight size={16} />
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ----------------------- NEXT THROUGH THE DOOR --------------------- */}
        <section className="relative border-t border-white/[0.07] py-20 sm:py-24" aria-labelledby="mk-next-title">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <MkLabel>Submitted to Apple</MkLabel>
              <h2 id="mk-next-title" className="mt-4 font-display text-3xl font-black uppercase text-white sm:text-4xl" style={{ fontVariationSettings: '"wdth" 78' }}>
                Next through the door
              </h2>
              <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-[#9FB6C6]">
                Four titles in Apple review. No fake dates. Launch dates go on the news page and by email first.
              </p>
            </Reveal>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {SUBMITTED.map(({ title, line, href }, index) => (
                <Reveal as="li" key={title} delay={index * 70}>
                  <a
                    href={href}
                    className="group flex h-full flex-col justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#8BE1FF]/40 hover:bg-white/[0.05] active:scale-[0.99] sm:p-7"
                  >
                    <div>
                      <span className="inline-flex items-center rounded-full border border-[#FFB020]/45 px-3 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-[#FFB020]">
                        Submitted to Apple
                      </span>
                      <h3 className="mt-4 font-display text-2xl font-black uppercase text-white" style={{ fontVariationSettings: '"wdth" 78' }}>
                        {title}
                      </h3>
                      <p className="mt-2 text-[0.95rem] leading-relaxed text-[#9FB6C6]">{line}</p>
                    </div>
                    <span className="inline-flex items-center gap-2 font-mono text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[#8BE1FF] opacity-80 transition-opacity group-hover:opacity-100">
                      View game
                      <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </a>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* --------------------------- EARLY CONCEPTS ------------------------ */}
        <section className="relative border-t border-white/[0.07] py-20 sm:py-24" aria-labelledby="mk-concepts-title">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <MkLabel>In development</MkLabel>
              <h2 id="mk-concepts-title" className="mt-4 font-display text-3xl font-black uppercase text-white sm:text-4xl" style={{ fontVariationSettings: '"wdth" 78' }}>
                Early concepts
              </h2>
              <p className="mt-4 text-[0.98rem] text-[#9FB6C6]">First looks, not launch dates.</p>
            </Reveal>

            <ul className="mt-10 space-y-3">
              {CONCEPTS.map(({ title, line, href }, index) => (
                <Reveal as="li" key={title} delay={index * 70}>
                  <a
                    href={href}
                    className="group flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-5 transition-all duration-200 hover:border-[#8BE1FF]/40 hover:bg-white/[0.045] active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
                        <h3 className="font-display text-xl font-black uppercase text-white" style={{ fontVariationSettings: '"wdth" 78' }}>
                          {title}
                        </h3>
                        <span className="rounded-full border border-[#8BE1FF]/35 px-2.5 py-0.5 font-mono text-[0.54rem] font-bold uppercase tracking-[0.2em] text-[#8BE1FF]/90">
                          In development
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-[0.92rem] text-[#9FB6C6] sm:whitespace-normal">{line}</p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="shrink-0 text-[#8BE1FF]/70 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#8BE1FF]"
                    />
                  </a>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------- PRESS AND CREATORS ---------------------- */}
        <section className="relative border-t border-white/[0.07] py-20 sm:py-24" aria-labelledby="mk-press-title">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
                <MkLabel>Press</MkLabel>
                <h2 id="mk-press-title" className="mt-4 font-display text-3xl font-black uppercase text-white sm:text-4xl" style={{ fontVariationSettings: '"wdth" 78' }}>
                  Need a pack<span className="text-[#8BE1FF]">?</span>
                </h2>
                <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-[#9FB6C6]">
                  Logos, screenshots, and clips are stored in the studio media library. Email{" "}
                  <a href="mailto:hello@playdjgames.com" className="font-medium text-[#FFB020] underline decoration-[#FFB020]/40 underline-offset-4 transition-colors hover:text-[#FFC24B]">
                    hello@playdjgames.com
                  </a>{" "}
                  and we&rsquo;ll send a public link.
                </p>
                <a href="mailto:hello@playdjgames.com?subject=Press%20pack%20request" className={cn(secondaryBtn, "mt-8")}>
                  <Mail size={16} />
                  Email the studio
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ------------------------------ CONTACT ---------------------------- */}
        <section className="relative border-t border-white/[0.07] py-20 sm:py-24" aria-labelledby="mk-contact-title">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <MkLabel>Contact</MkLabel>
              <h2 id="mk-contact-title" className="mt-4 font-display text-3xl font-black uppercase text-white sm:text-4xl" style={{ fontVariationSettings: '"wdth" 78' }}>
                Reach the studio
              </h2>
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <Reveal delay={70}>
                <a
                  href="mailto:hello@playdjgames.com"
                  className="group block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#8BE1FF]/40 hover:bg-white/[0.05] active:scale-[0.99]"
                >
                  <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.24em] text-[#9FB6C6]">General</span>
                  <p className="mt-2.5 flex items-center gap-2.5 font-mono text-[0.95rem] font-bold text-[#8BE1FF]">
                    <Mail size={16} className="shrink-0" />
                    hello@playdjgames.com
                  </p>
                </a>
              </Reveal>
              <Reveal delay={140}>
                <a
                  href="mailto:support@playdjgames.com"
                  className="group block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#FFB020]/40 hover:bg-white/[0.05] active:scale-[0.99]"
                >
                  <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.24em] text-[#9FB6C6]">Player support</span>
                  <p className="mt-2.5 flex items-center gap-2.5 font-mono text-[0.95rem] font-bold text-[#FFB020]">
                    <Mail size={16} className="shrink-0" />
                    support@playdjgames.com
                  </p>
                </a>
              </Reveal>
            </div>

            <Reveal delay={200}>
              <ul className="mt-8 flex flex-wrap gap-3">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[46px] items-center gap-2.5 rounded-full border border-white/12 px-5 font-mono text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#E9F3FA] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8BE1FF]/50 hover:text-[#8BE1FF] active:scale-[0.97]"
                    >
                      <Icon size={15} className="text-[#8BE1FF]" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ------------------------------- NOTIFY ---------------------------- */}
        <section className="relative border-t border-white/[0.07] py-20 sm:py-24" aria-labelledby="mk-notify-title">
          <GridLayer className="opacity-60" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-56 w-[520px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8BE1FF]/10 blur-[100px]"
          />
          <div className="relative mx-auto max-w-2xl px-5 text-center sm:px-8">
            <Reveal>
              <MkLabel>Game updates</MkLabel>
              <h2 id="mk-notify-title" className="mt-4 font-display text-3xl font-black uppercase text-white sm:text-4xl" style={{ fontVariationSettings: '"wdth" 78' }}>
                Get notified <span className="text-[#8BE1FF]">first</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[0.98rem] leading-relaxed text-[#9FB6C6]">
                TestFlight invites and one email when a game goes live.
              </p>

              <form onSubmit={onNotifySubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" noValidate>
                <label htmlFor="mk-notify-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="mk-notify-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  placeholder="you@email.com"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "mk-notify-error" : undefined}
                  className="min-h-[52px] flex-1 rounded-full border border-white/15 bg-white/[0.05] px-5 text-[0.95rem] text-white placeholder:text-[#9FB6C6]/60 transition-colors duration-200 focus:border-[#8BE1FF]/60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#8BE1FF] px-7 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#0A0E14] transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_36px_-8px_#8BE1FF99] active:scale-[0.97]"
                >
                  <Bell size={15} />
                  Notify me
                </button>
              </form>
              <div aria-live="polite">
                {error ? (
                  <p id="mk-notify-error" className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[#FFB020]">
                    {error}
                  </p>
                ) : null}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ------------------------------ FOOTER ------------------------------ */}
      <footer className="relative border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <Wordmark />
              <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[#9FB6C6]">DJ Games LLC</p>
              <p className="mt-3 space-y-1 text-[0.9rem] text-[#9FB6C6]">
                <a href="mailto:hello@playdjgames.com" className="block transition-colors hover:text-[#8BE1FF]">
                  hello@playdjgames.com
                </a>
                <a href={`${SITE_URL}/`} className="block transition-colors hover:text-[#8BE1FF]">
                  playdjgames.com
                </a>
              </p>
            </div>

            <nav aria-label="Explore">
              <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.24em] text-[#9FB6C6]">Explore</p>
              <ul className="mt-4 space-y-2.5">
                {NAV.filter((link) => link.label !== "Home").map(({ label, href, ember }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className={cn("text-[0.9rem] transition-colors", ember ? "text-[#FFB020] hover:text-[#FFC24B]" : "text-[#E9F3FA]/85 hover:text-[#8BE1FF]")}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.24em] text-[#9FB6C6]">Legal</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a href={`${SITE_URL}/privacy`} className="text-[0.9rem] text-[#E9F3FA]/85 transition-colors hover:text-[#8BE1FF]">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href={`${SITE_URL}/terms`} className="text-[0.9rem] text-[#E9F3FA]/85 transition-colors hover:text-[#8BE1FF]">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#9FB6C6]">
              © 2026 DJ Games LLC. All rights reserved. Veteran owned, independently operated.
            </p>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#8BE1FF]/80">
              Original iOS games / Built to play
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Marketing;
