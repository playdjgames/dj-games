import { useState } from "react";
import { Link } from "react-router-dom";

import type { LibraryGame } from "@/data/library";
import { isLive } from "@/data/site";
import { FEATURE_ICONS } from "@/lib/feature-icons";

const CYAN = "#00C2FF";

/** Price 0 (or no price at all) counts as free. Apple's live price wins over the curated one. */
const isFree = (game: LibraryGame): boolean => {
  const price = game.live?.formattedPrice ?? game.price;
  if (!price) return true;
  if (/free/i.test(price)) return true;
  const amount = Number.parseFloat(price.replace(/[^0-9.]/g, ""));
  return Number.isNaN(amount) || amount === 0;
};

/** Screenshot first (portrait only — it has to fit a phone), then the app icon, then nothing. */
const phoneImages = (game: LibraryGame): { screenshot?: string; icon?: string } => ({
  screenshot: game.screenshotAspect !== "landscape" ? game.screenshots[0] : undefined,
  icon: game.live?.artworkUrl ?? (game.coverFit === "contain" ? game.coverImage : undefined) ?? undefined,
});

/** A plain black phone. Shows the screenshot, else the icon, else the app name — never an empty hole. */
const PhoneFrame = ({ game }: { game: LibraryGame }) => {
  const { screenshot, icon } = phoneImages(game);
  const [failed, setFailed] = useState<string[]>([]);
  const shot = screenshot && !failed.includes(screenshot) ? screenshot : undefined;
  const logo = !shot && icon && !failed.includes(icon) ? icon : undefined;
  const markFailed = (url: string) => () => setFailed((prev) => [...prev, url]);

  return (
    <div className="relative w-[220px] rounded-[2.5rem] border border-white/10 bg-black p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] sm:w-[240px]">
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2rem] bg-black">
        <span
          className="absolute left-1/2 top-2.5 z-10 h-[22px] w-[76px] -translate-x-1/2 rounded-full bg-black"
          aria-hidden="true"
        />
        {shot ? (
          <img
            src={shot}
            alt={`${game.title} on iPhone`}
            loading="lazy"
            decoding="async"
            onError={markFailed(shot)}
            className="h-full w-full object-cover object-top"
          />
        ) : logo ? (
          <div className="flex h-full items-center justify-center">
            <img
              src={logo}
              alt={`${game.title} app icon`}
              loading="lazy"
              decoding="async"
              onError={markFailed(logo)}
              className="w-[62%] rounded-[22%]"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center">
            <span className="display-title break-words text-4xl text-white">{game.title}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Home spotlight for the newest live app. Every word, link and image comes from
 * the record passed in — nothing here is specific to any one app.
 */
export const LatestLiveCard = ({ game }: { game: LibraryGame }) => {
  const features = game.features.slice(0, 3);
  const storeUrl = isLive(game.appStoreUrl) ? game.appStoreUrl : null;

  return (
    <div className="surface-card corner-ticks mx-auto grid max-w-[1120px] grid-cols-1 gap-x-10 gap-y-6 border-signal/25 p-6 sm:p-10 lg:grid-cols-[58fr_42fr] lg:grid-rows-[auto_1fr]">
      <p
        className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.32em] lg:col-start-1 lg:row-start-1"
        style={{ color: CYAN }}
      >
        Live now
      </p>

      <div className="flex justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:-mb-14 lg:items-end lg:justify-center">
        <PhoneFrame key={game.slug} game={game} />
      </div>

      <div className="flex flex-col lg:col-start-1 lg:row-start-2 lg:justify-center">
        <h2 className="display-title break-words text-5xl text-white sm:text-6xl lg:text-7xl">{game.title}</h2>

        {game.tagline ? (
          <p className="mt-4 max-w-xl text-lg leading-snug text-white/90 sm:text-xl">{game.tagline}</p>
        ) : null}

        {features.length > 0 ? (
          <ul className="mt-6 space-y-2.5">
            {features.map((feature) => {
              const Icon = FEATURE_ICONS[feature.icon];
              return (
                <li key={feature.title} className="flex items-center gap-3">
                  <Icon size={18} className="shrink-0" style={{ color: CYAN }} aria-hidden="true" />
                  <span className="text-[0.98rem] font-medium text-white">{feature.title}</span>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="mt-8 flex flex-col items-stretch gap-4 sm:items-start">
          {storeUrl ? (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-9 font-mono text-[0.82rem] font-bold uppercase tracking-[0.2em] text-white transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.98] sm:w-auto"
              style={{ backgroundColor: CYAN }}
            >
              {isFree(game) ? "Get it free" : "Get it"}
            </a>
          ) : null}

          <Link
            to={`/games/${game.slug}`}
            className="inline-flex min-h-[44px] items-center justify-center font-mono text-[0.72rem] uppercase tracking-[0.18em] transition-colors hover:text-white sm:justify-start"
            style={{ color: CYAN }}
          >
            Learn more →
          </Link>
        </div>
      </div>
    </div>
  );
};
