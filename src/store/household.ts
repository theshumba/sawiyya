// Household export/import (H8) — local-first backup for a product whose entire
// database is one browser's localStorage. The export wraps the persisted store
// slice verbatim; import replaces it wholesale (pinned decision) and reloads so
// the blob re-enters through the version/migrate/normalizer pipeline (H13) —
// which also sanitises a hand-edited or stale-shaped file. The same envelope is
// the minimum school-pilot surface and ports to a future backend unchanged.
import { STORE_KEY } from "./app";

export const HOUSEHOLD_SCHEMA = "sawiyya.household.v1";
/** Must match the persist `version` in store/app.ts. */
const PERSIST_VERSION = 1;

export interface HouseholdExport {
  schema: typeof HOUSEHOLD_SCHEMA;
  exportedAt: string;
  appVersion: string;
  state: unknown;
}

/** Serialise the current household, or null when nothing is persisted yet. */
export function buildHouseholdExport(appVersion: string): string | null {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: unknown };
    if (parsed === null || typeof parsed !== "object" || parsed.state === undefined) return null;
    const doc: HouseholdExport = {
      schema: HOUSEHOLD_SCHEMA,
      exportedAt: new Date().toISOString(),
      appVersion,
      state: parsed.state,
    };
    return JSON.stringify(doc, null, 2);
  } catch {
    return null;
  }
}

/** Validate an import file: schema tag + a state object. Never throws. */
export function parseHouseholdImport(
  text: string,
): { ok: true; state: unknown } | { ok: false } {
  try {
    const doc = JSON.parse(text) as Partial<HouseholdExport> | null;
    if (doc === null || typeof doc !== "object") return { ok: false };
    if (doc.schema !== HOUSEHOLD_SCHEMA) return { ok: false };
    if (doc.state === null || typeof doc.state !== "object" || Array.isArray(doc.state))
      return { ok: false };
    return { ok: true, state: doc.state };
  } catch {
    return { ok: false };
  }
}

/** Wholesale replace (after the user's explicit bilingual confirm). The caller
 *  reloads the page so rehydrate runs migrate + the normalizer over the blob. */
export function applyHouseholdImport(state: unknown): void {
  localStorage.setItem(STORE_KEY, JSON.stringify({ state, version: PERSIST_VERSION }));
}
