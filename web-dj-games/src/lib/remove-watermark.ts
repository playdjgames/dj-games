/**
 * The Rork hosting layer injects a floating "Built with Rork" badge
 * (`#rork-watermark-badge`) into the document body after every page load. The
 * site carries no Rork credit anywhere (user decision, 2026-09-17), so this
 * helper removes the injected badge and keeps watching in case it reappears.
 */
const removeBadge = (): void => {
  document.getElementById("rork-watermark-badge")?.remove();
};

export const watchForWatermarkBadge = (): (() => void) => {
  removeBadge();

  const observer = new MutationObserver(() => {
    if (document.getElementById("rork-watermark-badge")) removeBadge();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
};
