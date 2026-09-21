/**
 * ============================================================================
 * DJ GAMES — WHAT WE MAKE
 * ============================================================================
 * The studio is no longer only mobile games. A division is the honest answer
 * to "what kind of thing is this?" — the one label that tells a visitor where
 * a project lives before they read a word of copy.
 *
 * Keep this list SHORT. Divisions are a wayfinding device, not a taxonomy:
 * four is comfortable, six is a menu. Genre ("Arcade Shooter") stays on the
 * card; it answers a different question.
 *
 * ADD A DIVISION: add it here, then set `division` on the entries in games.ts.
 * Nothing else needs to change — the filter row, the home strip and the detail
 * pages all read from this file.
 * ============================================================================
 */

export type DivisionId = "apps" | "mobile-games" | "pc-games" | "web";

export interface Division {
  id: DivisionId;
  /** Full label — filter chips, detail pages. */
  label: string;
  /** Four words at most: what this division actually is. */
  note: string;
}

/** Display order everywhere on the site: shipped-most-often first. */
export const DIVISIONS: Division[] = [
  { id: "apps", label: "Apps", note: "iOS tools and productivity" },
  { id: "mobile-games", label: "Mobile", note: "iPhone and iPad" },
  { id: "pc-games", label: "PC", note: "Desktop titles" },
  { id: "web", label: "Web", note: "Sites and web design" },
];

export const divisionById = (id: DivisionId): Division | undefined =>
  DIVISIONS.find((division) => division.id === id);

/** Label for a division id, falling back to the id so nothing renders blank. */
export const divisionLabel = (id: DivisionId): string => divisionById(id)?.label ?? id;
