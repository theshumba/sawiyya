/**
 * Threshold calibration sweep over the Zenodo ArSL held-out split.
 * Loads shipped seeds (src/recognizer/seeds/alphabet.json) as train,
 * builds held-out positives + negatives from the same CSV (rows NOT in seeds),
 * sweeps DISTANCE_GATE × TAU combinations, prints a table + recommended combo.
 *
 * Run with: npx tsx tools/extract-seeds/calibrate.ts
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { normalizeLandmarks, type LM } from '../../src/recognizer/normalize.js';
import { evaluate, type TestItem } from '../../src/recognizer/calibration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../../');

// ---------------------------------------------------------------------------
// Label → class-id mapping (verbatim from extract.ts)
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
  'Delete': null,
  'Fa2':    'alpha-fa',
  'Finish': null,
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
  'Space':  null,
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

// ---------------------------------------------------------------------------
// Load shipped seeds (train store)
// ---------------------------------------------------------------------------
const seedsPath = resolve(ROOT, 'src/recognizer/seeds/alphabet.json');
const train = JSON.parse(readFileSync(seedsPath, 'utf-8')) as Record<string, number[][]>;
const classIds = Object.keys(train).sort();

// Build seed fingerprints per class for held-out filtering
const seedSets = new Map<string, Set<string>>();
for (const [cls, vecs] of Object.entries(train)) {
  seedSets.set(cls, new Set(vecs.map(v => JSON.stringify(v))));
}

// ---------------------------------------------------------------------------
// Parse CSV and collect per-class held-out samples
// ---------------------------------------------------------------------------
const csvPath = resolve(__dirname, 'dataset/ArSL_dataset.csv');
const lines = readFileSync(csvPath, 'utf-8').split('\n');

const heldOut = new Map<string, number[][]>();

for (let li = 1; li < lines.length; li++) {
  const line = lines[li].trim();
  if (!line) continue;
  const cols = line.split(';');
  const label = cols[0];
  if (!(label in LABEL_MAP)) continue;
  const classId = LABEL_MAP[label];
  if (!classId) continue;

  // Parse 21 landmarks from columns 1–42 (x0,y0,...,x20,y20)
  const lms: LM[] = [];
  let ok = true;
  for (let i = 0; i <= 20; i++) {
    const xi = parseFloat(cols[1 + i * 2]);
    const yi = parseFloat(cols[2 + i * 2]);
    if (isNaN(xi) || isNaN(yi)) { ok = false; break; }
    lms.push({ x: xi, y: yi, z: 0 });
  }
  if (!ok || lms.length !== 21) continue;

  const vec = normalizeLandmarks(lms, false);
  if (vec.length !== 42) continue;
  const rounded = vec.map(v => Math.round(v * 1000) / 1000);

  // Keep ONLY rows NOT present in the shipped seed set for this class
  const key = JSON.stringify(rounded);
  const seedSet = seedSets.get(classId);
  if (seedSet?.has(key)) continue; // this exact vector is a seed — skip

  if (!heldOut.has(classId)) heldOut.set(classId, []);
  heldOut.get(classId)!.push(rounded);
}

const MAX_PER_CLASS = 15;

// ---------------------------------------------------------------------------
// Build positives and negatives
// ---------------------------------------------------------------------------
const testItems: TestItem[] = [];
let posTotal = 0;
let negTotal = 0;

for (let ci = 0; ci < classIds.length; ci++) {
  const cls = classIds[ci];
  const pool = heldOut.get(cls) ?? [];

  // Positives: samples of the correct class
  const pos = pool.slice(0, MAX_PER_CLASS);
  for (const vec of pos) {
    testItems.push({ targetId: cls, vec, positive: true });
    posTotal++;
  }

  // Negatives: samples of THIS class but graded as the NEXT class (rotated)
  // "Is the learner signing cls[i+1]?" when they're actually signing cls[i]
  const nextCls = classIds[(ci + 1) % classIds.length];
  const neg = pool.slice(0, MAX_PER_CLASS);
  for (const vec of neg) {
    testItems.push({ targetId: nextCls, vec, positive: false });
    negTotal++;
  }
}

console.log(`\nHeld-out test set: ${posTotal} positives, ${negTotal} negatives (${posTotal + negTotal} total)`);
console.log(`Classes: ${classIds.length}, max ${MAX_PER_CLASS} items per class per role\n`);

// ---------------------------------------------------------------------------
// Sweep
// ---------------------------------------------------------------------------
const GATES = [0.45, 0.50, 0.55, 0.60, 0.65];
const TAUS  = [0.70, 0.78, 0.85];
const MARGIN = 0.15;
const K = 7; // production k

interface Result { gate: number; tau: number; trueAccept: number; falseAccept: number; n: number }
const results: Result[] = [];

console.log('gate  tau  → trueAccept  falseAccept  (n)');
console.log('─────────────────────────────────────────');

for (const gate of GATES) {
  for (const tau of TAUS) {
    const r = evaluate({ train, test: testItems, distanceGate: gate, tau, margin: MARGIN, k: K });
    results.push({ gate, tau, trueAccept: r.trueAccept, falseAccept: r.falseAccept, n: r.n });
    const ta = (r.trueAccept * 100).toFixed(1).padStart(5);
    const fa = (r.falseAccept * 100).toFixed(1).padStart(5);
    console.log(`${gate.toFixed(2)}  ${tau.toFixed(2)} → ${ta}%        ${fa}%       (${r.n})`);
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Recommendation: highest trueAccept subject to falseAccept ≤ 0.02
// ---------------------------------------------------------------------------
const FA_HARD_CAP = 0.02;
const eligible = results.filter(r => r.falseAccept <= FA_HARD_CAP);

if (eligible.length === 0) {
  console.log('⚠  No combo achieved falseAccept ≤ 2% — reporting lowest-FA combo instead:');
  const best = results.reduce((a, b) => a.falseAccept < b.falseAccept ? a : b);
  console.log(`  gate=${best.gate}  tau=${best.tau}  → trueAccept=${(best.trueAccept*100).toFixed(1)}%  falseAccept=${(best.falseAccept*100).toFixed(1)}%  (n=${best.n})`);
  console.log('DONE_WITH_CONCERNS: falseAccept target not met. Review sweep table and choose manually.');
} else {
  const best = eligible.reduce((a, b) => a.trueAccept > b.trueAccept ? a : b);
  console.log('─────────────────────────────────────────');
  console.log(`RECOMMENDED: gate=${best.gate}  tau=${best.tau}  margin=${MARGIN}  → trueAccept=${(best.trueAccept*100).toFixed(1)}%  falseAccept=${(best.falseAccept*100).toFixed(1)}%  (n=${best.n})`);
}
