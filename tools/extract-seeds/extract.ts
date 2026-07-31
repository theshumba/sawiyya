/**
 * Extract real ground-truth seeds from the Zenodo ArSL landmark CSV.
 * Produces src/recognizer/seeds/alphabet.json (28 classes, ≤40 vectors, 42-dim).
 *
 * Run with:  npx tsx tools/extract-seeds/extract.ts
 *
 * Dataset:   ArSL_dataset.csv — Zenodo record 18363162, CC-BY-4.0
 * Normalise: Sawiyya normalizeLandmarks(lms, mirror=false) — same pipeline as live camera
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { normalizeLandmarks, type LM } from '../../src/recognizer/normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../../');

// ---------------------------------------------------------------------------
// Label → class-id mapping (verbatim from task brief; null = control, skip)
// ---------------------------------------------------------------------------
const LABEL_MAP: Record<string, string | null> = {
  '3ayn':   'alpha-ain',
  '7a2':    'alpha-haa',
  '9af':    'alpha-qaf',
  'Alef':   'alpha-alif',
  'Ba2':    'alpha-ba',
  'Chin':   'alpha-sheen',
  'Dal':    'alpha-dal',
  'DDad':   'alpha-dad',
  'Delete': null,          // control — skip
  'Fa2':    'alpha-fa',
  'Finish': null,          // control — skip
  'Ghayn':  'alpha-ghain',
  'Ha2':    'alpha-ha',
  'Jim':    'alpha-jeem',
  'Kaf':    'alpha-kaf',
  'Kha2':   'alpha-kha',
  'Lam':    'alpha-lam',
  'Mim':    'alpha-meem',
  'Noon':   'alpha-noon',
  'Ra2':    'alpha-ra',
  'Sin':    'alpha-seen',
  'Space':  null,          // control — skip
  'SSad':   'alpha-sad',
  'Ta2':    'alpha-ta',
  'Tha2':   'alpha-tha',
  'Thal':   'alpha-thal',
  'TTa2':   'alpha-tah',
  'TTha2':  'alpha-zah',
  'Waw':    'alpha-waw',
  'Ya2':    'alpha-ya',
  'Zayn':   'alpha-zay',
};

const MAX_PER_CLASS = 40;

// ---------------------------------------------------------------------------
// Read and parse CSV
// ---------------------------------------------------------------------------
const csvPath = resolve(__dirname, 'dataset/ArSL_dataset.csv');
const lines = readFileSync(csvPath, 'utf-8').split('\n');
const header = lines[0].split(';');

// Verify the first 42 value columns (after Sign) are x0,y0,...,x20,y20
const expectedCols = [];
for (let i = 0; i <= 20; i++) {
  expectedCols.push(`x${i}`, `y${i}`);
}
const actualCols = header.slice(1, 43);
for (let i = 0; i < expectedCols.length; i++) {
  if (actualCols[i] !== expectedCols[i]) {
    throw new Error(`Column mismatch at index ${i+1}: expected "${expectedCols[i]}", got "${actualCols[i]}"`);
  }
}
console.log('CSV header verified: x0,y0,...,x20,y20 in columns 1-42');

// ---------------------------------------------------------------------------
// Accumulate samples per class (raw, not yet subsampled)
// ---------------------------------------------------------------------------
const rawSamples: Map<string, number[][]> = new Map();

let rowsRead = 0;
let rowsSkipped = 0;

for (let li = 1; li < lines.length; li++) {
  const line = lines[li].trim();
  if (!line) continue;

  const cols = line.split(';');
  const label = cols[0];

  if (!(label in LABEL_MAP)) {
    // Unknown label — warn once
    console.warn(`Unknown label at row ${li}: "${label}" — skipping`);
    rowsSkipped++;
    continue;
  }

  const classId = LABEL_MAP[label];
  if (classId === null) {
    // Control sign — skip silently
    rowsSkipped++;
    continue;
  }

  // Parse 21 landmarks from columns 1–42 (x0,y0,...,x20,y20)
  const lms: LM[] = [];
  for (let i = 0; i <= 20; i++) {
    const xi = parseFloat(cols[1 + i * 2]);
    const yi = parseFloat(cols[2 + i * 2]);
    if (isNaN(xi) || isNaN(yi)) {
      console.warn(`NaN at row ${li} point ${i} — skipping row`);
      continue;
    }
    lms.push({ x: xi, y: yi, z: 0 });
  }
  if (lms.length !== 21) {
    rowsSkipped++;
    continue;
  }

  // Normalise using the REAL normalizeLandmarks (mirror=false — right-hand data)
  const vec = normalizeLandmarks(lms, false);
  if (vec.length !== 42) {
    throw new Error(`normalizeLandmarks returned ${vec.length} dims, expected 42`);
  }

  // Round to 3dp (matches addSample)
  const rounded = vec.map((v) => Math.round(v * 1000) / 1000);

  if (!rawSamples.has(classId)) rawSamples.set(classId, []);
  rawSamples.get(classId)!.push(rounded);
  rowsRead++;
}

console.log(`\nRows processed: ${rowsRead} used, ${rowsSkipped} skipped`);

// ---------------------------------------------------------------------------
// Optional second dataset — ArSL21L (CC BY 4.0), derived on 2026-08-01 via
// landmarks_from_images.py. Its CSV already carries our alpha-* class ids
// (the label map is applied at derivation), so rows pass through directly.
// Present → seeds blend 20+20 per class across datasets (same shipped size,
// double the signer diversity) and train.ts gets a full two-source corpus.
// ---------------------------------------------------------------------------
const TARGET_IDS = new Set(Object.values(LABEL_MAP).filter((v): v is string => v !== null));
const rawSamples2: Map<string, number[][]> = new Map();
const csv2Path = resolve(__dirname, 'dataset/arsl21l_landmarks.csv');
let hasSecond = false;

// Zenodo per-class centroids — the canonical chirality reference. ArSL21L is
// photographed (some left hands / mirrored captures), and the CSV has no
// handedness column, so for each sample we normalise BOTH mirror options and
// keep the one nearer its class centroid. The live camera mirrors left hands
// into the same right-hand space (§6.8), so training data must be single-
// chirality too — without this snap, flipped samples form phantom clusters
// the live pipeline can never produce.
const centroids = new Map<string, number[]>();
for (const [cls, vecs] of rawSamples) {
  const mean = new Array(42).fill(0);
  for (const v of vecs) for (let i = 0; i < 42; i++) mean[i] += v[i];
  for (let i = 0; i < 42; i++) mean[i] /= vecs.length;
  centroids.set(cls, mean);
}
const dist2 = (a: number[], b: number[]) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return s;
};

try {
  const lines2 = readFileSync(csv2Path, 'utf-8').split('\n');
  let used2 = 0;
  let flipped = 0;
  for (let li = 1; li < lines2.length; li++) {
    const line = lines2[li].trim();
    if (!line) continue;
    const cols = line.split(';');
    const classId = cols[0];
    if (!TARGET_IDS.has(classId)) continue;
    const lms: LM[] = [];
    for (let i = 0; i <= 20; i++) {
      const xi = parseFloat(cols[1 + i * 2]);
      const yi = parseFloat(cols[2 + i * 2]);
      if (isNaN(xi) || isNaN(yi)) break;
      lms.push({ x: xi, y: yi, z: 0 });
    }
    if (lms.length !== 21) continue;
    const plain = normalizeLandmarks(lms, false);
    const mirrored = normalizeLandmarks(lms, true);
    const c = centroids.get(classId)!;
    const useMirror = dist2(mirrored, c) < dist2(plain, c);
    if (useMirror) flipped++;
    const vec = (useMirror ? mirrored : plain).map((v) => Math.round(v * 1000) / 1000);
    if (!rawSamples2.has(classId)) rawSamples2.set(classId, []);
    rawSamples2.get(classId)!.push(vec);
    used2++;
  }
  hasSecond = used2 > 0;
  console.log(`ArSL21L rows used: ${used2} across ${rawSamples2.size} classes (${flipped} chirality-snapped)`);
} catch {
  console.log('No ArSL21L CSV (dataset/arsl21l_landmarks.csv) — Zenodo-only seeds.');
}

// ---------------------------------------------------------------------------
// Subsample to ≤40 per class (even spacing)
// ---------------------------------------------------------------------------
function evenSubsample(arr: number[][], max: number): number[][] {
  if (arr.length <= max) return arr;
  const step = arr.length / max;
  const result: number[][] = [];
  for (let i = 0; i < max; i++) {
    result.push(arr[Math.floor(i * step)]);
  }
  return result;
}

const seeds: Record<string, number[][]> = {};

console.log(`\nPer-class sample counts (after subsampling to ≤${MAX_PER_CLASS}):`);
const classIds = [...rawSamples.keys()].sort();
for (const classId of classIds) {
  const raw = rawSamples.get(classId)!;
  const raw2 = rawSamples2.get(classId) ?? [];
  // Blend across datasets when both exist: half the seed budget each, so the
  // KNN/OOD gate + mean shapes see two independent signer populations at the
  // SAME shipped size. Zenodo-only behaviour is unchanged when no second CSV.
  const sampled =
    hasSecond && raw2.length >= 8
      ? [...evenSubsample(raw, MAX_PER_CLASS / 2), ...evenSubsample(raw2, MAX_PER_CLASS / 2)]
      : evenSubsample(raw, MAX_PER_CLASS);
  seeds[classId] = sampled;
  const mark = sampled.length < 8 ? ' *** BELOW THRESHOLD ***' : '';
  console.log(`  ${classId}: ${sampled.length} samples (zenodo raw: ${raw.length}, arsl21l raw: ${raw2.length})${mark}`);
}

// ---------------------------------------------------------------------------
// Validate: all 28 classes present, all ≥8 samples, all 42-dim
// ---------------------------------------------------------------------------
const expectedClasses = Object.values(LABEL_MAP).filter((v) => v !== null) as string[];
const missingClasses = expectedClasses.filter((c) => !seeds[c]);
if (missingClasses.length > 0) {
  throw new Error(`Missing classes in output: ${missingClasses.join(', ')}`);
}

const badClasses = Object.entries(seeds).filter(
  ([, vecs]) => vecs.length < 8 || vecs.some((v) => v.length !== 42)
);
if (badClasses.length > 0) {
  throw new Error(`Classes below threshold or wrong dims: ${badClasses.map(([k]) => k).join(', ')}`);
}

console.log(`\nValidation: ${Object.keys(seeds).length} classes, all ≥8 samples, all 42-dim — OK`);

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------
const outPath = resolve(ROOT, 'src/recognizer/seeds/alphabet.json');
writeFileSync(outPath, JSON.stringify(seeds, null, 2));
console.log(`\nWrote ${outPath}`);

// Full two-source corpus for train.ts (NOT shipped — dataset/ is gitignored).
// Keeps every derived vector per source so training/eval can stratify and
// report honest per-dataset + cross-dataset numbers.
if (hasSecond) {
  // ≤160/class per source — balanced classes, and keeps the pure-TS trainer
  // in the minutes range (≈9k rows total).
  const CORPUS_CAP = 160;
  const capAll = (m: Map<string, number[][]>) =>
    Object.fromEntries([...m.entries()].map(([k, v]) => [k, evenSubsample(v, CORPUS_CAP)]));
  const corpus = {
    zenodo: capAll(rawSamples),
    arsl21l: capAll(rawSamples2),
  };
  const corpusPath = resolve(__dirname, 'dataset/corpus.json');
  writeFileSync(corpusPath, JSON.stringify(corpus));
  console.log(`Wrote ${corpusPath}`);
}
