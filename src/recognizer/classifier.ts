// classifier.ts — in-browser inference for the trained MLP keypoint classifier
// (kinivi approach). 42 → H(ReLU) → 28(softmax) forward pass over the weights
// trained offline by tools/extract-seeds/train.ts. Pure, dependency-free.
//
// This is the "real engine": it classifies a normalised 42-dim landmark vector
// against ground-truth letters learned from real signers (Zenodo ArSL), instead
// of matching the user's own taught samples. Wire it into the grading loop as an
// additional/primary signal alongside the existing KNN.
import model from "./seeds/alphabet-model.json";

const { classes, D, H, W1, b1, W2, b2, tau } = model as {
  classes: string[]; D: number; H: number;
  W1: number[][]; b1: number[]; W2: number[][]; b2: number[];
  tau?: number;
};
const K = classes.length;

/** Calibrated live-grading probability threshold (held-out FA ≤ 0.5%). The target
 *  letter must hold ≥ this share of the softmax mass to count as a frame match. */
export const MODEL_TAU = typeof tau === "number" ? tau : 0.5;

export interface MlpResult {
  /** best class id, e.g. "alpha-alif" */
  classId: string;
  /** softmax probability of the best class (0..1) */
  confidence: number;
  /** softmax probability of a specific target class (for grade-this-letter UX) */
  probOf: (targetId: string) => number;
}

/** True when the trained model knows this class (all 28 seeded letters). */
export function modelKnows(classId: string): boolean {
  return classes.includes(classId);
}

/** Forward pass → softmax probabilities over all known letters. */
function softmaxProbs(x: number[]): number[] {
  const a = new Array(H);
  for (let j = 0; j < H; j++) {
    let s = b1[j];
    for (let i = 0; i < D; i++) s += x[i] * W1[i][j];
    a[j] = s > 0 ? s : 0; // ReLU
  }
  const o = new Array(K);
  for (let k = 0; k < K; k++) {
    let s = b2[k];
    for (let j = 0; j < H; j++) s += a[j] * W2[j][k];
    o[k] = s;
  }
  const m = Math.max(...o);
  const e = o.map((z) => Math.exp(z - m));
  const Z = e.reduce((p, q) => p + q, 0) || 1;
  return e.map((z) => z / Z);
}

/** Classify a normalised 42-dim landmark vector. */
export function classify(vec: number[]): MlpResult {
  const probs = softmaxProbs(vec);
  let am = 0;
  for (let k = 1; k < K; k++) if (probs[k] > probs[am]) am = k;
  return {
    classId: classes[am],
    confidence: probs[am],
    probOf: (targetId: string) => {
      const idx = classes.indexOf(targetId);
      return idx < 0 ? 0 : probs[idx];
    },
  };
}

/** Live-grading result shape — mirrors knn.ts `TargetClassification` so the camera
 *  loop can swap the MLP in for seeded letters with no call-site reshaping. */
export interface ModelGrade {
  /** softmax probability of the TARGET letter (the meter value) */
  confidence: number;
  /** target holds the most softmax mass AND clears the calibrated tau */
  matched: boolean;
  debug?: { bestClass: string; bestP: number; targetP: number };
}

/**
 * Grade a frame against a specific target letter using the trained MLP.
 * The softmax already encodes both confidence and class competition, so a single
 * `probOf(target) ≥ MODEL_TAU` is simultaneously the confidence floor and the
 * separation margin (the target must own the majority of the probability mass).
 * Caller gates with this only when `modelKnows(targetId)`; else falls back to KNN.
 */
export function gradeWithModel(vec: number[], targetId: string): ModelGrade {
  if (vec.length === 0) return { confidence: 0, matched: false };
  const r = classify(vec);
  const targetP = r.probOf(targetId);
  return {
    confidence: targetP,
    matched: r.classId === targetId && targetP >= MODEL_TAU,
    debug: { bestClass: r.classId, bestP: r.confidence, targetP },
  };
}
