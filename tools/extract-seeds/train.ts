// train.ts — train a small MLP keypoint classifier on real Arabic-alphabet
// landmark vectors, the kinivi/hand-gesture-recognition approach ported to
// TypeScript (no Python, no new runtime deps). Emits seeds/alphabet-model.json
// (weights + calibrated tau) + prints held-out accuracy.
//
//   run:  npx tsx tools/extract-seeds/train.ts
//
// Architecture: 42 → H(ReLU) → 28(softmax), cross-entropy, mini-batch SGD.
//
// Data (2026-08-01): prefers the two-source corpus emitted by extract.ts
// (dataset/corpus.json — Zenodo ArSL + ArSL21L, both CC BY 4.0, ~150+/class
// per source) with a per-class 80/20 held-out split WITHIN each source. It
// first trains a Zenodo-only baseline and reports its accuracy on the
// ArSL21L held-out — the honest cross-dataset number the old shipped model
// corresponds to — then trains the final blended model and calibrates tau on
// the blended held-out. Without the corpus it falls back to the original
// seeds-only path (28×40 from alphabet.json) unchanged.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const SEEDS = resolve(__dir, "../../src/recognizer/seeds/alphabet.json");
const CORPUS = resolve(__dir, "dataset/corpus.json");
const OUT = resolve(__dir, "../../src/recognizer/seeds/alphabet-model.json");

const H = 48;          // hidden units
const LR0 = 0.15;
const BATCH = 32;
const TEST_FRAC = 0.2; // per-class held-out

// deterministic RNG (LCG) so training is reproducible; reset per training run
let _s = 1234567;
const resetRand = () => { _s = 1234567; };
const rand = () => ((_s = (_s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const randn = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());

type Row = { x: number[]; y: number };
type Corpus = Record<string, Record<string, number[][]>>;

let corpus: Corpus | null = null;
try {
  corpus = JSON.parse(readFileSync(CORPUS, "utf8")) as Corpus;
} catch {
  /* no corpus — seeds-only fallback below */
}

// 10× the data per epoch in corpus mode → proportionally fewer epochs; both
// modes land at a comparable number of sample-updates.
const EPOCHS = corpus ? 150 : 400;

const seedData = JSON.parse(readFileSync(SEEDS, "utf8")) as Record<string, number[][]>;
const classes = Object.keys(corpus ? corpus.zenodo : seedData).sort();
const K = classes.length;
const D = (corpus ? corpus.zenodo[classes[0]] : seedData[classes[0]])[0].length; // 42

/** Per-class deterministic split: first nTest rows held out (same convention
 *  as the original script, applied per source). */
function split(byClass: Record<string, number[][]>): { train: Row[]; test: Row[] } {
  const train: Row[] = [], test: Row[] = [];
  classes.forEach((c, yi) => {
    const vecs = byClass[c] ?? [];
    const nTest = Math.max(1, Math.round(vecs.length * TEST_FRAC));
    vecs.forEach((x, i) => (i < nTest ? test : train).push({ x, y: yi }));
  });
  return { train, test };
}

type Model = { W1: number[][]; b1: number[]; W2: number[][]; b2: number[] };

function forwardWith(m: Model, x: number[]) {
  const h = new Array(H).fill(0);
  for (let j = 0; j < H; j++) { let s = m.b1[j]; for (let i = 0; i < D; i++) s += x[i] * m.W1[i][j]; h[j] = s; }
  const a = h.map((z) => (z > 0 ? z : 0));
  const o = new Array(K).fill(0);
  for (let k = 0; k < K; k++) { let s = m.b2[k]; for (let j = 0; j < H; j++) s += a[j] * m.W2[j][k]; o[k] = s; }
  const mx = Math.max(...o); const e = o.map((z) => Math.exp(z - mx)); const Z = e.reduce((p, q) => p + q, 0);
  return { a, h, p: e.map((z) => z / Z) };
}

function accuracy(m: Model, rows: Row[]) {
  if (rows.length === 0) return NaN;
  let ok = 0;
  for (const r of rows) { const { p } = forwardWith(m, r.x); let am = 0; for (let k = 1; k < K; k++) if (p[k] > p[am]) am = k; if (am === r.y) ok++; }
  return ok / rows.length;
}

function trainModel(train: Row[], label: string): Model {
  resetRand();
  const mat = (r: number, c: number, s: number) =>
    Array.from({ length: r }, () => Array.from({ length: c }, () => randn() * s));
  const m: Model = {
    W1: mat(D, H, Math.sqrt(2 / D)), b1: new Array(H).fill(0),
    W2: mat(H, K, Math.sqrt(2 / H)), b2: new Array(K).fill(0),
  };
  const rows = train.slice();
  for (let ep = 0; ep < EPOCHS; ep++) {
    for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; }
    const lr = LR0 * (1 - ep / EPOCHS) + 0.005;
    for (let b = 0; b < rows.length; b += BATCH) {
      const batch = rows.slice(b, b + BATCH);
      const gW1 = mat(D, H, 0), gb1 = new Array(H).fill(0), gW2 = mat(H, K, 0), gb2 = new Array(K).fill(0);
      for (const r of batch) {
        const { a, h, p } = forwardWith(m, r.x);
        const dO = p.slice(); dO[r.y] -= 1;                       // softmax+CE grad
        for (let k = 0; k < K; k++) { gb2[k] += dO[k]; for (let j = 0; j < H; j++) gW2[j][k] += a[j] * dO[k]; }
        const dA = new Array(H).fill(0);
        for (let j = 0; j < H; j++) { let s = 0; for (let k = 0; k < K; k++) s += dO[k] * m.W2[j][k]; dA[j] = h[j] > 0 ? s : 0; }
        for (let j = 0; j < H; j++) { gb1[j] += dA[j]; for (let i = 0; i < D; i++) gW1[i][j] += r.x[i] * dA[j]; }
      }
      const n = batch.length;
      for (let j = 0; j < H; j++) { m.b1[j] -= lr * gb1[j] / n; for (let i = 0; i < D; i++) m.W1[i][j] -= lr * gW1[i][j] / n; }
      for (let k = 0; k < K; k++) { m.b2[k] -= lr * gb2[k] / n; for (let j = 0; j < H; j++) m.W2[j][k] -= lr * gW2[j][k] / n; }
    }
    if (ep % 100 === 0 || ep === EPOCHS - 1)
      console.log(`[${label}] epoch ${ep}: train=${(accuracy(m, train) * 100).toFixed(1)}%`);
  }
  return m;
}

// ── Calibrate the live-grading probability threshold (tau) ───────────────────
// The grader asks "is the learner signing THIS letter?" → it reads probOf(target).
// Positives  = a held-out frame of letter X, graded against target X  → p[X].
// Negatives  = a held-out frame of letter Y, graded against a DIFFERENT target X
//              (the learner signs the wrong/another letter) → p[X], X≠Y.
// Sweep tau: TA = P(positive ≥ tau), FA = P(negative ≥ tau). Pick the smallest
// FA-safe tau (FA ≤ 0.5%) that still passes most correct signs.
function calibrate(m: Model, test: Row[]) {
  const positives: number[] = [];
  const negatives: number[] = [];
  for (const r of test) {
    const { p } = forwardWith(m, r.x);
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
  return { tau, taAtTau, faAtTau };
}

if (corpus) {
  const zen = split(corpus.zenodo);
  const ars = split(corpus.arsl21l);
  console.log(`classes=${K} dim=${D}  zenodo train/test=${zen.train.length}/${zen.test.length}  arsl21l train/test=${ars.train.length}/${ars.test.length}`);

  // Honest baseline: what a Zenodo-only model (the old shipped world) does on
  // people from a dataset it never saw.
  const baseline = trainModel(zen.train, "zenodo-only baseline");
  const baseWithin = accuracy(baseline, zen.test);
  const baseCross = accuracy(baseline, ars.test);
  console.log(`BASELINE (zenodo-only)  zenodo held-out=${(baseWithin * 100).toFixed(1)}%  ArSL21L held-out (CROSS)=${(baseCross * 100).toFixed(1)}%`);

  // Final blended model.
  const final = trainModel([...zen.train, ...ars.train], "blended");
  const accZen = accuracy(final, zen.test);
  const accArs = accuracy(final, ars.test);
  const blendedTest = [...zen.test, ...ars.test];
  const accBlend = accuracy(final, blendedTest);
  console.log(`FINAL (blended)  zenodo held-out=${(accZen * 100).toFixed(1)}%  ArSL21L held-out=${(accArs * 100).toFixed(1)}%  overall=${(accBlend * 100).toFixed(1)}%`);

  const { tau, taAtTau, faAtTau } = calibrate(final, blendedTest);
  writeFileSync(OUT, JSON.stringify({
    classes, D, H, ...final, tau,
    trainAcc: accuracy(final, [...zen.train, ...ars.train]),
    testAcc: accBlend, taAtTau, faAtTau,
    sourceAccs: {
      zenodoHeldOut: accZen,
      arsl21lHeldOut: accArs,
      zenodoOnlyBaselineCross: baseCross,
    },
    createdFrom: "corpus.json — Zenodo ArSL + ArSL21L (both CC BY 4.0), per-source 80/20 held-out",
  }));
  console.log(`wrote ${OUT}`);
} else {
  // Original seeds-only path (28×40 from alphabet.json), unchanged behaviour.
  const { train, test } = split(seedData);
  console.log(`classes=${K} dim=${D} train=${train.length} test=${test.length} H=${H} (seeds-only)`);
  const m = trainModel(train, "seeds");
  const trainAcc = accuracy(m, train), testAcc = accuracy(m, test);
  console.log(`\nFINAL  train=${(trainAcc * 100).toFixed(1)}%  held-out test=${(testAcc * 100).toFixed(1)}%`);
  const { tau, taAtTau, faAtTau } = calibrate(m, test);
  writeFileSync(OUT, JSON.stringify({
    classes, D, H, ...m, tau, trainAcc, testAcc, taAtTau, faAtTau,
    createdFrom: "alphabet.json (Zenodo ArSL, CC-BY-4.0)",
  }));
  console.log(`wrote ${OUT}`);
}
