/**
 * Informational compatibility checks for social platforms.
 *
 * These are advisory only — they read the file's own dimensions, duration and
 * size and compare them against each platform's published limits. Nothing here
 * publishes anything; the media library only reports what a file looks suitable
 * for so the right URL gets handed to Windsor.ai.
 */

import type { MediaItem } from "@/lib/media";

export type CompatVerdict = "good" | "warn" | "bad";

export interface CompatResult {
  platform: string;
  verdict: CompatVerdict;
  note: string;
}

const ratioOf = (item: MediaItem): number | null => {
  if (!item.width || !item.height) return null;
  return item.width / item.height;
};

/** Closest common aspect label, e.g. "9:16". */
export const aspectLabel = (item: MediaItem): string => {
  const ratio = ratioOf(item);
  if (ratio === null) return "Unknown";

  const known: { label: string; value: number }[] = [
    { label: "9:16", value: 9 / 16 },
    { label: "4:5", value: 4 / 5 },
    { label: "2:3", value: 2 / 3 },
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "3:2", value: 3 / 2 },
    { label: "16:9", value: 16 / 9 },
    { label: "1.91:1", value: 1.91 },
  ];

  let best = known[0];
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const candidate of known) {
    const delta = Math.abs(candidate.value - ratio);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = candidate;
    }
  }

  // Only claim a named ratio when it is genuinely close.
  return bestDelta / ratio < 0.04 ? best.label : `${ratio.toFixed(2)}:1`;
};

const VERTICAL_MIN = 0.5; // 1:2
const VERTICAL_MAX = 0.58; // a touch wider than 9:16

const verticalVideo = (item: MediaItem, minSeconds: number, maxSeconds: number, platform: string): CompatResult => {
  const ratio = ratioOf(item);
  const duration = item.duration ?? 0;

  if (ratio === null) {
    return { platform, verdict: "warn", note: "Resolution unknown — check before publishing." };
  }
  if (ratio > VERTICAL_MAX) {
    return { platform, verdict: "warn", note: "Not vertical — will be cropped or letterboxed." };
  }
  if (ratio < VERTICAL_MIN) {
    return { platform, verdict: "warn", note: "Taller than 1:2 — edges may be cropped." };
  }
  if (duration > 0 && duration < minSeconds) {
    return { platform, verdict: "bad", note: `Too short — needs at least ${minSeconds}s.` };
  }
  if (duration > maxSeconds) {
    return { platform, verdict: "bad", note: `Too long — limit is ${Math.round(maxSeconds / 60)} min.` };
  }
  return { platform, verdict: "good", note: "Vertical video within limits." };
};

/** Evaluates one file against the platforms the studio posts to. */
export const compatibilityFor = (item: MediaItem): CompatResult[] => {
  const isVideo = item.content_type.startsWith("video/");
  const ratio = ratioOf(item);
  const megabytes = item.size / (1024 * 1024);
  const isMov = item.content_type === "video/quicktime";

  if (isVideo) {
    const reel = verticalVideo(item, 3, 900, "Instagram Reel");
    const story = verticalVideo(item, 1, 60, "Instagram Story");

    const feed: CompatResult =
      ratio === null
        ? { platform: "Instagram Feed", verdict: "warn", note: "Resolution unknown." }
        : ratio >= 0.8 && ratio <= 1.91
          ? { platform: "Instagram Feed", verdict: "good", note: "Within the 4:5–1.91:1 feed range." }
          : { platform: "Instagram Feed", verdict: "warn", note: "Outside 4:5–1.91:1 — will be cropped." };

    const facebook: CompatResult =
      megabytes > 4096
        ? { platform: "Facebook", verdict: "bad", note: "Over Facebook's 4GB limit." }
        : { platform: "Facebook", verdict: "good", note: "Accepts most MP4/MOV sizes and ratios." };

    const tiktok = verticalVideo(item, 3, 600, "TikTok");

    const results = [reel, story, feed, facebook, tiktok];

    // MOV works on these platforms but MP4/H.264 is the safest interchange
    // format for third-party publishers like Windsor.
    if (isMov) {
      return results.map((result) =>
        result.verdict === "good"
          ? { ...result, verdict: "warn" as const, note: `${result.note} MP4 is more reliable than MOV.` }
          : result,
      );
    }
    return results;
  }

  const feedImage: CompatResult =
    ratio === null
      ? { platform: "Instagram Feed", verdict: "warn", note: "Dimensions unknown." }
      : ratio >= 0.8 && ratio <= 1.91
        ? { platform: "Instagram Feed", verdict: "good", note: "Within the 4:5–1.91:1 feed range." }
        : { platform: "Instagram Feed", verdict: "warn", note: "Outside 4:5–1.91:1 — will be cropped." };

  const storyImage: CompatResult =
    ratio === null
      ? { platform: "Instagram Story", verdict: "warn", note: "Dimensions unknown." }
      : ratio <= VERTICAL_MAX
        ? { platform: "Instagram Story", verdict: "good", note: "Vertical — fills the screen." }
        : { platform: "Instagram Story", verdict: "warn", note: "Not vertical — will be letterboxed." };

  return [
    { platform: "Instagram Reel", verdict: "bad", note: "Reels require a video file." },
    feedImage,
    storyImage,
    megabytes > 30
      ? { platform: "Facebook", verdict: "warn", note: "Large image — consider compressing." }
      : { platform: "Facebook", verdict: "good", note: "Standard image format and size." },
    { platform: "TikTok", verdict: "bad", note: "TikTok posts require a video file." },
  ];
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const formatDuration = (seconds: number): string => {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
};
