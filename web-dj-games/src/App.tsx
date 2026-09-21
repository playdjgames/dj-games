import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { watchForWatermarkBadge } from "@/lib/remove-watermark";

import About from "./pages/About";
import ComingSoon from "./pages/ComingSoon";
import Donate from "./pages/Donate";
import GameDetail from "./pages/GameDetail";
import Games from "./pages/Games";
import Home from "./pages/Home";
import Legal from "./pages/Legal";
import Marketing from "./pages/Marketing";
import MediaLibrary from "./pages/MediaLibrary";
import News from "./pages/News";
import NewsPost from "./pages/NewsPost";
import NotFound from "./pages/NotFound";
import Subscribers from "./pages/Subscribers";
import Support from "./pages/Support";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => watchForWatermarkBadge(), []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster position="bottom-right" />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Standalone campaign page — own chrome, no site Layout. */}
          <Route path="/marketing" element={<Marketing />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:slug" element={<GameDetail />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
            <Route path="/about" element={<About />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsPost />} />
            <Route path="/support" element={<Support />} />
            <Route path="/donate" element={<Donate />} />
            {/* Private studio pages — intentionally not linked in nav or footer. */}
            <Route path="/subscribers" element={<Subscribers />} />
            <Route path="/media" element={<MediaLibrary />} />
            <Route path="/privacy" element={<Legal kind="privacy" />} />
            <Route path="/terms" element={<Legal kind="terms" />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
