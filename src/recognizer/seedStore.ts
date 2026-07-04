// seedStore.ts — the single lazy owner of the bundled ground-truth alphabet
// seeds (real-signer landmark vectors, Zenodo ArSL). Two jobs:
//
//   1. Code-splitting (M13): the 621 KB alphabet.json is dynamic-imported so it
//      lands in its OWN async chunk instead of the entry bundle. A camera screen
//      calls ensureSeeds() on mount; by the time a hand is positioned the chunk
//      is resident. Nothing on the app-boot path pulls the seeds in.
//   2. One copy, two graders: both the KNN (knn.ts) and the MLP's
//      out-of-distribution gate (classifier.ts, M1) read the seeds from here, so
//      there is exactly one copy in memory and in the bundle.
import { euclidean } from "./normalize";

export type SampleStore = Record<string, number[][]>;

let seeds: SampleStore = {};
let loaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Kick (once) the async load of the bundled seed vectors. Idempotent — safe to
 * call from every camera-screen mount. Camera grading gates on seedsLoaded() so
 * a match can never confirm against an empty seed set while this is in flight.
 */
export function ensureSeeds(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (!loadPromise) {
    loadPromise = import("./seeds/alphabet.json")
      .then((m) => {
        // A test (or a race) may have injected fixtures before this resolved —
        // don't clobber an already-populated store with the real dataset.
        if (!loaded) {
          seeds = ((m as { default?: SampleStore }).default ?? m) as SampleStore;
          loaded = true;
        }
      })
      .catch((e) => {
        loadPromise = null; // allow a retry on the next mount
        throw e;
      });
  }
  return loadPromise;
}

/** True once the seeds are resident. Camera grading waits on this. */
export function seedsLoaded(): boolean {
  return loaded;
}

/** The bundled seed layer — empty {} until ensureSeeds() resolves. */
export function getSeeds(): SampleStore {
  return seeds;
}

/**
 * Nearest euclidean distance from `vec` to any seed of `classId` — Infinity when
 * the class has no seeds (or the seeds haven't loaded yet). This is the measure
 * the MLP out-of-distribution gate uses (M1): a real letter sits close to its
 * own seed cloud; a junk / non-letter hand sits far from every real example.
 */
export function nearestSeedDistance(vec: number[], classId: string): number {
  const samples = seeds[classId];
  if (!samples || samples.length === 0) return Infinity;
  let best = Infinity;
  for (const s of samples) {
    const d = euclidean(vec, s);
    if (d < best) best = d;
  }
  return best;
}

/** TEST-ONLY: inject seed fixtures synchronously (replaces the old knn setter). */
export function __setSeedsForTest(s: SampleStore) {
  seeds = s;
  loaded = true;
}
