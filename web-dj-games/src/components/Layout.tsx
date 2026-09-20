import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StickyMobileCta } from "@/components/StickyMobileCta";

/** Scrolls to top on navigation, unless the URL carries a hash target. */
const ScrollManager = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);

  return null;
};

export const Layout = () => {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollManager />
      <Navbar />
      <main key={pathname} className="flex-1 animate-fade-in pt-[68px]">
        <Outlet />
      </main>
      <Footer />
      <StickyMobileCta />
    </div>
  );
};
