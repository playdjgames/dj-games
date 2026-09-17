/**
 * ============================================================================
 * PRE-RELEASE SYNC  —  run with:  node scripts/sync-prerelease.mjs
 * ============================================================================
 * Apps that are not published yet are INVISIBLE to Apple's public API, so the
 * website cannot discover them the way it discovers live apps. Everything about
 * them lives in your App Store Connect account instead, behind a private API
 * key that must never ship inside a public website.
 *
 * So we read it here, using the App Store Connect CLI, and write the safe parts into
 * `src/data/prerelease.generated.ts`, which the site imports like any other
 * data file. Nothing secret is written — only the store copy you already
 * intend to publish.
 *
 * Re-run this whenever you change an unreleased app in App Store Connect.
 * ============================================================================
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "src/data/prerelease.generated.ts");

/** Apple publishes these apps already — the site reads those from the public API. */
const LIVE_STATE = "READY_FOR_SALE";

const asc = (args) => {
  const stdout = execFileSync("asc", [...args, "--output", "json"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(stdout);
};

const listOf = (payload) => (Array.isArray(payload) ? payload : (payload?.data ?? []));

/**
 * App Store Connect records often start life with a working title — a truncated
 * prompt ("Create a polished mobile arcad") or a scaffold suffix
 * ("Realmforge (d0b3d6)"). We clean what we can and flag the rest so the site
 * keeps using your own name instead of showing a placeholder to visitors.
 */
const cleanName = (raw) => {
  const name = (raw ?? "").replace(/\s*\([0-9a-f]{4,8}\)\s*$/i, "").trim();
  const looksLikeAPrompt = /^(create|build|make|design|develop)\s/i.test(name);
  // ASC truncates names at 30 characters, so a 29-30 char name with no final
  // word boundary is almost certainly a cut-off prompt.
  const looksTruncated = name.length >= 29 && !/[.!?)]$/.test(name);
  return { name, isPlaceholder: looksLikeAPrompt || looksTruncated };
};

/** Turns Apple's review machinery into something a visitor understands. */
const REVIEW_STATES = {
  PREPARE_FOR_SUBMISSION: { label: "In development", stage: "building" },
  DEVELOPER_REJECTED: { label: "In development", stage: "building" },
  REJECTED: { label: "In development", stage: "building" },
  METADATA_REJECTED: { label: "In development", stage: "building" },
  INVALID_BINARY: { label: "In development", stage: "building" },
  WAITING_FOR_REVIEW: { label: "Submitted to Apple", stage: "submitted" },
  IN_REVIEW: { label: "In review with Apple", stage: "review" },
  PENDING_CONTRACT: { label: "In review with Apple", stage: "review" },
  PENDING_DEVELOPER_RELEASE: { label: "Approved — releasing soon", stage: "approved" },
  PROCESSING_FOR_APP_STORE: { label: "Approved — releasing soon", stage: "approved" },
  PENDING_APPLE_RELEASE: { label: "Approved — releasing soon", stage: "approved" },
  READY_FOR_SALE: { label: "Available now", stage: "released" },
};

const AGE_RATINGS = {
  FOUR_PLUS: "4+",
  NINE_PLUS: "9+",
  TWELVE_PLUS: "12+",
  SEVENTEEN_PLUS: "17+",
  EIGHTEEN_PLUS: "18+",
};

const readJson = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null);

const collect = () => {
  const apps = listOf(asc(["apps", "list", "--paginate"]));
  const results = [];

  for (const app of apps) {
    const appStoreId = Number(app.id);
    const attrs = app.attributes ?? {};

    const versions = listOf(asc(["versions", "list", "--app", app.id, "--paginate"]));
    // Newest record first; Apple keeps shipped versions in this list too.
    const version = versions.find((v) => v.attributes?.appStoreState !== LIVE_STATE) ?? versions[0];
    if (!version) continue;

    const state = version.attributes?.appStoreState ?? "PREPARE_FOR_SUBMISSION";
    if (state === LIVE_STATE) continue; // The public API already covers this one.

    const versionString = version.attributes?.versionString ?? "";

    // Pull the store copy exactly as it will appear on the App Store.
    const dir = mkdtempSync(join(tmpdir(), `asc-${appStoreId}-`));
    try {
      asc(["metadata", "pull", "--app", app.id, "--version", versionString, "--platform", "IOS", "--dir", dir]);
    } catch {
      // An app with no metadata yet is normal, not an error.
    }

    const info = readJson(join(dir, "app-info/en-US.json")) ?? {};
    const copy = readJson(join(dir, `version/${versionString}/en-US.json`)) ?? {};

    const appInfos = listOf(asc(["apps", "info", "list", "--app", app.id]));
    const ageRaw = appInfos[0]?.attributes?.appStoreAgeRating ?? null;

    const { name, isPlaceholder } = cleanName(info.name ?? attrs.name);
    const review = REVIEW_STATES[state] ?? { label: "In development", stage: "building" };

    results.push({
      appStoreId,
      name,
      nameIsPlaceholder: isPlaceholder,
      subtitle: info.subtitle ?? null,
      description: copy.description ?? null,
      keywords: copy.keywords ? copy.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
      version: versionString,
      reviewState: state,
      reviewStateLabel: review.label,
      reviewStage: review.stage,
      ageRating: ageRaw ? (AGE_RATINGS[ageRaw] ?? null) : null,
    });
  }

  return results;
};

const render = (apps) => `/**
 * AUTO-GENERATED — DO NOT EDIT BY HAND.
 * Written by \`bun run sync:prerelease\` from your App Store Connect account.
 *
 * These are the apps Apple has NOT published yet, so they cannot be discovered
 * through the public App Store API. Re-run the script after changing an
 * unreleased app in App Store Connect.
 */

import type { PrereleaseApp } from "@/data/prerelease";

export const PRERELEASE_SYNCED_AT = ${JSON.stringify(new Date().toISOString())};

export const PRERELEASE_APPS: PrereleaseApp[] = ${JSON.stringify(apps, null, 2)};
`;

const apps = collect();
writeFileSync(OUT_FILE, render(apps));
console.log(`Synced ${apps.length} unreleased app(s) -> src/data/prerelease.generated.ts`);
for (const a of apps) {
  console.log(`  ${a.appStoreId}  ${a.name}  v${a.version}  ${a.reviewStateLabel}${a.description ? "  (has description)" : ""}`);
}
