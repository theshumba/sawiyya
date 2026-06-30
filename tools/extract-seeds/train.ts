// train.ts — train a small MLP keypoint classifier on the real Arabic-alphabet
// landmark vectors (seeds/alphabet.json), the kinivi/hand-gesture-recognition
// approach ported to TypeScript (no Python, no new runtime deps). Emits
// seeds/alphabet-model.json (weights) + prints held-out accuracy.
//
//   run:  npx tsx tools/extract-seeds/train.ts
//
// Architecture: 42 → H(ReLU) → 28(softmax), cross-entropy, mini-batch SGD.
// Data: 28 classes × 40 normalised 42-dim vectors. Split 80/20 per class.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const SEEDS = resolve(__dir, "../../src/recognizer/seeds/alphabet.json");
const OUT = resolve(__dir, "../../src/recognizer/seeds/alphabet-model.json");

const H = 48;          // hidden units
const EPOCHS = 400;
const LR0 = 0.15;
const BATCH = 32;
const TEST_FRAC = 0.2; // per-class held-out

// deterministic RNG (LCG) so training is reproducible
let _s = 1234567;
const rand = () => ((_s = (_s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const randn = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());

const raw = JSON.parse(readFileSync(SEEDS, "utf8")) as Record<string, number[][]>;
const classes = Object.keys(raw).sort();
const K = classes.length;
const D = raw[classes[0]][0].length; // 42

// build train/test splits
type Row = { x: number[]; y: number };
const train: Row[] = [], test: Row[] = [];
classes.forEach((c, yi) => {
  const vecs = raw[c];
  const nTest = Math.max(1, Math.round(vecs.length * TEST_FRAC));
  vecs.forEach((x, i) => (i < nTest ? test : train).push({ x, y: yi }));
});
console.log(`classes=${K} dim=${D} train=${train.length} test=${test.length} H=${H}`);

// params (He init)
const mat = (r: number, c: number, s: number) =>
  Array.from({ length: r }, () => Array.from({ length: c }, () => randn() * s));
let W1 = mat(D, H, Math.sqrt(2 / D)), b1 = new Array(H).fill(0);
let W2 = mat(H, K, Math.sqrt(2 / H)), b2 = new Array(K).fill(0);

const relu = (v: number[]) => v.map((z) => (z > 0 ? z : 0));
function forward(x: number[]) {
  const h = new Array(H).fill(0);
  for (let j = 0; j < H; j++) { let s = b1[j]; for (let i = 0; i < D; i++) s += x[i] * W1[i][j]; h[j] = s; }
  const a = relu(h);
  const o = new Array(K).fill(0);
  for (let k = 0; k < K; k++) { let s = b2[k]; for (let j = 0; j < H; j++) s += a[j] * W2[j][k]; o[k] = s; }
  const m = Math.max(...o); const e = o.map((z) => Math.exp(z - m)); const Z = e.reduce((p, q) => p + q, 0);
  return { a, h, p: e.map((z) => z / Z) };
}

function accuracy(rows: Row[]) {
  let ok = 0;
  for (const r of rows) { const { p } = forward(r.x); let am = 0; for (let k = 1; k < K; k++) if (p[k] > p[am]) am = k; if (am === r.y) ok++; }
  return ok / rows.length;
}

for (let ep = 0; ep < EPOCHS; ep++) {
  // shuffle
  for (let i = train.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [train[i], train[j]] = [train[j], train[i]]; }
  const lr = LR0 * (1 - ep / EPOCHS) + 0.005;
  for (let b = 0; b < train.length; b += BATCH) {
    const batch = train.slice(b, b + BATCH);
    const gW1 = mat(D, H, 0), gb1 = new Array(H).fill(0), gW2 = mat(H, K, 0), gb2 = new Array(K).fill(0);
    for (const r of batch) {
      const { a, h, p } = forward(r.x);
      const dO = p.slice(); dO[r.y] -= 1;                       // softmax+CE grad
      for (let k = 0; k < K; k++) { gb2[k] += dO[k]; for (let j = 0; j < H; j++) gW2[j][k] += a[j] * dO[k]; }
      const dA = new Array(H).fill(0);
      for (let j = 0; j < H; j++) { let s = 0; for (let k = 0; k < K; k++) s += dO[k] * W2[j][k]; dA[j] = h[j] > 0 ? s : 0; }
      for (let j = 0; j < H; j++) { gb1[j] += dA[j]; for (let i = 0; i < D; i++) gW1[i][j] += r.x[i] * dA[j]; }
    }
    const n = batch.length;
    for (let j = 0; j < H; j++) { b1[j] -= lr * gb1[j] / n; for (let i = 0; i < D; i++) W1[i][j] -= lr * gW1[i][j] / n; }
    for (let k = 0; k < K; k++) { b2[k] -= lr * gb2[k] / n; for (let j = 0; j < H; j++) W2[j][k] -= lr * gW2[j][k] / n; }
  }
  if (ep % 50 === 0 || ep === EPOCHS - 1)
    console.log(`epoch ${ep}: train=${(accuracy(train) * 100).toFixed(1)}% test=${(accuracy(test) * 100).toFixed(1)}%`);
}

const trainAcc = accuracy(train), testAcc = accuracy(test);
console.log(`\nFINAL  train=${(trainAcc * 100).toFixed(1)}%  held-out test=${(testAcc * 100).toFixed(1)}%`);

// ── Calibrate the live-grading probability threshold (tau) ───────────────────
// The grader asks "is the learner signing THIS letter?" → it reads probOf(target).
// Positives  = a held-out frame of letter X, graded against target X  → p[X].
// Negatives  = a held-out frame of letter Y, graded against a DIFFERENT target X
//              (the learner signs the wrong/another letter) → p[X], X≠Y.
// Sweep tau: TA = P(positive ≥ tau), FA = P(negative ≥ tau). Pick the smallest
// FA-safe tau (FA ≤ 0.5%) that still passes most correct signs.
const positives: number[] = [];
const negatives: number[] = [];
for (const r of test) {
  const { p } = forward(r.x);
  for (let k = 0; k < K; k++) (k === r.y ? positives : negatives).push(p[k]);
}
const FA_BUDGET = 0.005;
let tau = 0.9, taAtTau = 0, faAtTau = 1;
for (let cand = 0.50; cand <= 0.995; cand += 0.005) {
  const ta = positives.filter((v) => v >= cand).length / positives.length;
  const fa = negatives.filter((v) => v >= cand).length / negatives.length;
  if (fa <= FA_BUDGET) { tau = Math.round(cand * 1000) / 1000; taAtTau = ta; faAtTau = fa; break; }
}
console.log(`CALIBRATE  tau=${tau}  TA=${(taAtTau * 100).toFixed(1)}%  FA=${(faAtTau * 100).toFixed(2)}%  (FA budget ${FA_BUDGET * 100}%)`);

writeFileSync(OUT, JSON.stringify({
  classes, D, H, W1, b1, W2, b2, tau,
  trainAcc, testAcc, taAtTau, faAtTau,
  createdFrom: "alphabet.json (Zenodo ArSL, CC-BY-4.0)",
}));
console.log(`wrote ${OUT}`);
