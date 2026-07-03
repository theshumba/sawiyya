// In-browser teach-mode KNN classifier — PRD §9.2 "live teach mode".
// kinivi-style: record N samples of a handshape → classify live.
// Samples live in localStorage; nothing ever leaves the device.
import { euclidean } from "./normalize";
import { getSeeds, type SampleStore } from "./seedStore";
// The bundled ground-truth seeds live in seedStore (dynamic-imported, M13). Keep
// exposing the test setter from here so existing knn tests import it unchanged.
export { __setSeedsForTest } from "./seedStore";

// v2 (2026-06-27): the normaliser became rotation-invariant (normalize.ts), which
// changed the feature space. Teach samples recorded under v1 are in the OLD space and
// no longer match the live hand (measured ~1–6 units away, gate is 0.65) — they'd sit
// there silently breaking grading forever. Bumping the key discards them so the user
// re-teaches once in the current space. The old key is purged on load to free storage.
const STORE_KEY = "sawiyya.knn.v2";
const LEGACY_KEYS = ["sawiyya.knn.v1"];
const K = 7;
const MAX_SAMPLES_PER_CLASS = 48;
/** Distance gate — beyond this (mean of the top-K) the neighbours aren't credible. */
// recalibrated 2026-06-27 on Zenodo ArSL held-out split AFTER rotation-invariant
// normalisation (normalize.ts): gate=0.65 tau=0.70 → TA=98.1% FA=0.2%. Rotation
// invariance collapses intra-class distance, so the gate now has generous headroom
// for real users whose hand tilt/pose differs from the dataset (the "stuck at 0%"
// bug) while class separation — and thus the 0.2% false-accept rate — is unchanged.
const DISTANCE_GATE = 0.65;
/** Minimum vote-share lead the winning class must hold over the runner-up. */
const MARGIN_GATE = 0.15;

export interface TargetClassification {
  /** 0..1 weighted vote share of the *target* class within the top-K. */
  confidence: number;
  /** True iff the target is the winning class, confident, and clear of the runner-up. */
  matched: boolean;
  /** Optional decision internals — surfaced behind ?debug to diagnose stuck grading. */
  debug?: {
    bestClass: string | null;
    meanTopD: number;
    targetShare: number;
    targetSamples: number;
    gated: boolean;
  };
}

/** All stores read paths must span — the bundled seeds (seedStore), then the
 *  user's own localStorage teach store. */
function readStores(): SampleStore[] {
  return [getSeeds(), store()];
}

function load(): SampleStore {
  try {
    // Purge superseded-space teach data so it can't haunt grading (see STORE_KEY note).
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as SampleStore) : {};
  } catch {
    return {};
  }
}

let cache: SampleStore | null = null;

function store(): SampleStore {
  if (!cache) cache = load();
  return cache;
}

// M22: the in-memory cache is only ever written by THIS tab's own save() —
// another tab's teach session was invisible until a full reload. `storage`
// only fires in other tabs, so dropping the cache here can't race our own
// scheduleSave()/save() writes.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORE_KEY || event.key === null) cache = null;
  });
}

/** L15: full reset-training wipe. `trainedClassIds()` only surfaces classes
 *  with ≥4 samples (the credible-KNN floor), so the Settings reset button's
 *  old per-id loop left partially-taught (<4 sample) classes behind — this
 *  clears the whole store outright, partial or not. */
export function clearAll() {
  cache = {};
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* best effort — in-memory cache is already cleared */
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store()));
  } catch {
    // storage full — drop oldest samples across classes and retry once
    const s = store();
    for (const id of Object.keys(s)) s[id] = s[id].slice(-16);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch {
      /* give up quietly — teach mode still works in-memory */
    }
  }
}

// Teach mode adds ~7 samples/sec; serialising the whole growing store on every
// one stalls the capture path (Q3). Debounce writes and expose flushSamples()
// so callers force a durable write at teach "done" / when leaving the screen.
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    save();
  }, 400);
}

export function flushSamples() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  save();
}

export function addSample(classId: string, vec: number[]) {
  const s = store();
  const arr = s[classId] ?? (s[classId] = []);
  arr.push(vec.map((v) => Math.round(v * 1000) / 1000)); // 3dp — compact storage
  if (arr.length > MAX_SAMPLES_PER_CLASS) arr.splice(0, arr.length - MAX_SAMPLES_PER_CLASS);
  scheduleSave();
}

export function clearClass(classId: string) {
  const s = store();
  delete s[classId];
  save();
}

export function sampleCount(classId: string): number {
  return readStores().reduce((n, s) => n + (s[classId]?.length ?? 0), 0);
}

/** Samples the LEARNER personally taught (their localStorage store only, not the
 *  bundled seeds). Lets the grader honour "it works for MY hands" — when someone
 *  has taught their own version of a letter, we can confirm against it even if the
 *  dataset MLP is strict cross-person. */
export function userTaughtCount(classId: string): number {
  return store()[classId]?.length ?? 0;
}

export function trainedClassIds(): string[] {
  const ids = new Set<string>();
  for (const s of readStores()) for (const id of Object.keys(s)) ids.add(id);
  return [...ids].filter((id) => sampleCount(id) >= 4);
}

/** Handshapes the LEARNER personally taught — their own localStorage store only,
 *  never the bundled seeds. This is the honest DevMetrics count (L2): the
 *  seeds-inclusive trainedClassIds() always reads ≥ 28 for a brand-new user, so
 *  "handshapes taught" looked pre-earned. */
export function userTaughtClassIds(): string[] {
  return Object.keys(store()).filter((id) => userTaughtCount(id) >= 4);
}

export function isTrained(classId: string): boolean {
  return sampleCount(classId) >= 8;
}

/**
 * Weighted-vote KNN graded **against a specific target class** (PRD §9.5).
 *
 * The grader must answer "is the learner signing *this* sign?", not "which of all
 * trained classes is nearest?". The global-argmax form silently failed once more
 * than one class was trained (the seeded alphabet alone is 28): another class could
 * win the vote and the target's meter would stick at 0% even when signed correctly.
 *
 * Here `confidence` is the target's own vote share within the top-K, and a match
 * requires the target to be the *winning* class, confident (≥ TAU), and clear of
 * the runner-up by MARGIN_GATE. The credibility gate uses the **mean** of the
 * top-K distances rather than a single nearest neighbour, so one stray/mislabelled
 * sample can no longer wave an out-of-distribution handshape through.
 */
export function classifyAgainst(vec: number[], targetId: string): TargetClassification {
  if (vec.length === 0) return { confidence: 0, matched: false }; // empty/degenerate frame (Q8)

  // Maintain just the K nearest neighbours via bounded insertion — avoids
  // allocating + full-sorting an array of every sample each frame (Q2).
  const top: { classId: string; d: number }[] = [];
  let worst = Infinity;
  for (const layer of readStores()) {
    for (const [classId, samples] of Object.entries(layer)) {
      for (const sample of samples) {
        const d = euclidean(vec, sample);
        if (top.length < K) {
          top.push({ classId, d });
          if (top.length === K) {
            top.sort((a, b) => a.d - b.d);
            worst = top[K - 1].d;
          }
        } else if (d < worst) {
          top[K - 1] = { classId, d };
          let i = K - 1;
          while (i > 0 && top[i].d < top[i - 1].d) {
            [top[i - 1], top[i]] = [top[i], top[i - 1]];
            i -= 1;
          }
          worst = top[K - 1].d;
        }
      }
    }
  }
  if (top.length === 0) return { confidence: 0, matched: false };
  if (top.length < K) top.sort((a, b) => a.d - b.d); // fewer than K samples total

  const meanTopD = top.reduce((sum, n) => sum + n.d, 0) / top.length;

  const weights = new Map<string, number>();
  let total = 0;
  for (const n of top) {
    const w = 1 / (n.d + 0.05);
    weights.set(n.classId, (weights.get(n.classId) ?? 0) + w);
    total += w;
  }

  // winning class + runner-up vote weight, for the separation margin
  let bestClass: string | null = null;
  let bestW = 0;
  let secondW = 0;
  for (const [classId, w] of weights) {
    if (w > bestW) {
      secondW = bestW;
      bestW = w;
      bestClass = classId;
    } else if (w > secondW) {
      secondW = w;
    }
  }

  const gated = meanTopD <= DISTANCE_GATE;
  const targetShare = (weights.get(targetId) ?? 0) / total;
  const margin = (bestW - secondW) / total;
  const matched =
    gated && bestClass === targetId && targetShare >= TAU && margin >= MARGIN_GATE;

  // Surface the target's share (zeroed when not credible) so the meter tracks the
  // learner's progress toward *this* sign, never a competing class.
  return {
    confidence: gated ? targetShare : 0,
    matched,
    debug: {
      bestClass,
      meanTopD,
      targetShare,
      targetSamples: sampleCount(targetId),
      gated,
    },
  };
}

/** Conservative match threshold (PRD §9.5 — favour encouragement). */
// recalibrated 2026-06-27 (rotation-invariant normalize): gate=0.65 tau=0.70 → TA=98.1% FA=0.2%.
// Lowered from 0.85 — with tilt no longer inflating distances, a correctly-shaped
// hand earns a clear vote share, so the floor can favour the learner without
// raising false-accepts (winner + 0.15 margin gates still apply).
export const TAU = 0.70;
