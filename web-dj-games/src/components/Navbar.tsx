import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { Logo } from "@/components/Logo";
import { NAV_LINKS } from "@/data/site";
import { cn } from "@/lib/utils";

/** Sticky site navigation. Collapses into a full-screen sheet on narrow viewports. */
export const Navbar = () => {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-border/70 bg-background/85 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <nav className="container flex h-[68px] items-center justify-between gap-6" aria-label="Main">
        <Logo />

        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "relative py-2 text-[0.92rem] font-medium transition-colors duration-200 after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:transition-all after:duration-300",
                    link.accent === "ember"
                      ? cn(
                          "after:bg-ember",
                          isActive
                            ? "text-ember after:w-full"
                            : "text-ember/75 after:w-0 hover:text-ember hover:after:w-full",
                        )
                      : cn(
                          "after:bg-signal",
                          isActive
                            ? "text-signal after:w-full"
                            : "text-muted-foreground after:w-0 hover:text-foreground hover:after:w-full",
                        ),
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            to="/games"
            className="hidden min-h-[40px] items-center rounded-md border border-signal/50 px-4 font-mono text-[0.66rem] font-medium uppercase tracking-[0.16em] text-signal transition-all duration-300 hover:bg-signal hover:text-primary-foreground hover:shadow-glow sm:inline-flex"
          >
            Explore Games
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors duration-300 hover:border-signal/50 hover:text-signal lg:hidden"
          >
            {open ? <Menu size={20} className="hidden" /> : null}
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "fixed inset-x-0 top-[68px] bottom-0 z-40 origin-top border-t border-border bg-background/97 backdrop-blur-xl transition-all duration-300 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <ul className="container flex flex-col gap-1 py-6">
          {NAV_LINKS.map((link, index) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                onClick={close}
                style={{ transitionDelay: open ? `${index * 40}ms` : "0ms" }}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-[56px] items-center border-b border-border/60 font-display text-2xl font-bold uppercase tracking-wide transition-colors duration-300",
                    link.accent === "ember"
                      ? isActive
                        ? "text-ember"
                        : "text-foreground hover:text-ember"
                      : isActive
                        ? "text-signal"
                        : "text-foreground hover:text-signal",
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li className="pt-5">
            <Link
              to="/games"
              onClick={close}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-md bg-signal px-6 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground"
            >
              Explore Games
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
};
