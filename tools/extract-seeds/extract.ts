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

console.log('\nPer-class sample counts (after subsampling to ≤40):');
const classIds = [...rawSamples.keys()].sort();
for (const classId of classIds) {
  const raw = rawSamples.get(classId)!;
  const sampled = evenSubsample(raw, MAX_PER_CLASS);
  seeds[classId] = sampled;
  const mark = sampled.length < 8 ? ' *** BELOW THRESHOLD ***' : '';
  console.log(`  ${classId}: ${sampled.length} samples (raw: ${raw.length})${mark}`);
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
