/**
 * ============================================================================
 * UNRELEASED APPS — WHAT APP STORE CONNECT KNOWS
 * ============================================================================
 * Apple's public App Store API only returns apps that are actually published.
 * An app sitting in "Prepare for Submission" or "In Review" is invisible to it,
 * which is why unreleased projects can never be discovered the way live ones
 * are.
 *
 * Everything about those apps lives in your App Store Connect account, behind a
 * private API key that must never ship inside a public website. So the details
 * are pulled by `node scripts/sync-prerelease.mjs` and written into
 * `prerelease.generated.ts` — see that script for the full explanation.
 *
 * The result: real names, subtitles, descriptions, keywords, version numbers,
 * age ratings and live review status for apps that have not shipped yet.
 * ============================================================================
 */

/** How far along an unreleased app is, in plain language. */
export type ReviewStage = "building" | "submitted" | "review" | "approved" | "released";

/** One unreleased app, exactly as App Store Connect describes it. */
export interface PrereleaseApp {
  appStoreId: number;
  /** The App Store Connect record name, cleaned of scaffold suffixes. */
  name: string;
  /**
   * True when the ASC name is still a working title (a truncated prompt or an
   * auto-generated name). The site keeps your own title in that case.
   */
  nameIsPlaceholder: boolean;
  subtitle: string | null;
  description: string | null;
  keywords: string[];
  version: string;
  /** Apple's raw state, e.g. `PREPARE_FOR_SUBMISSION`. */
  reviewState: string;
  /** Visitor-friendly version of the state, e.g. "In review with Apple". */
  reviewStateLabel: string;
  reviewStage: ReviewStage;
  /** e.g. "12+". */
  ageRating: string | null;
}

export { PRERELEASE_APPS, PRERELEASE_SYNCED_AT } from "@/data/prerelease.generated";

/** Ordering used when sorting upcoming apps: closest to launch first. */
export const STAGE_ORDER: Record<ReviewStage, number> = {
  approved: 0,
  review: 1,
  submitted: 2,
  building: 3,
  released: 4,
};

/**
 * Stages where Apple has the build in hand. Used to give the status badge more
 * urgency than a generic "In development".
 */
export const isWithApple = (stage: ReviewStage): boolean =>
  stage === "submitted" || stage === "review" || stage === "approved";
