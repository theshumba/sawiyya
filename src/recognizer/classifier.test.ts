// Locks the trained MLP classifier: top-1 accuracy over the real seed vectors
// must stay high, and a correct letter must out-score the rest. Guards against a
// broken forward pass or a bad retrain landing in seeds/alphabet-model.json.
import { beforeAll, describe, it, expect } from "vitest";
import seeds from "./seeds/alphabet.json";
import { classify, modelKnows, gradeWithModel, MODEL_TAU } from "./classifier";
import { __setSeedsForTest } from "./seedStore";

const data = seeds as Record<string, number[][]>;

describe("MLP keypoint classifier", () => {
  // gradeWithModel's out-of-distribution gate (M1) reads the seed cloud from
  // seedStore; in the app it's dynamic-imported, so populate it here.
  beforeAll(() => __setSeedsForTest(data));

  it("knows all seeded alphabet classes", () => {
    for (const id of Object.keys(data)) expect(modelKnows(id)).toBe(true);
  });

  it("exposes a sane calibrated tau", () => {
    expect(MODEL_TAU).toBeGreaterThan(0);
    expect(MODEL_TAU).toBeLessThanOrEqual(1);
  });

  it("gradeWithModel matches the right letter and rejects the wrong target", () => {
    const entries = Object.entries(data);
    let matchedRight = 0, total = 0, falseAccept = 0;
    for (const [id, vecs] of entries) {
      const wrong = entries.find(([oid]) => oid !== id)![0];
      for (const v of vecs) {
        total++;
        if (gradeWithModel(v, id).matched) matchedRight++;
        // grading a frame of `id` against a DIFFERENT target must rarely "match"
        if (gradeWithModel(v, wrong).matched) falseAccept++;
      }
    }
    expect(matchedRight / total).toBeGreaterThan(0.9); // correct signs confirm
    expect(falseAccept / total).toBeLessThan(0.02);    // wrong target is rejected
  });

  it("gradeWithModel is a no-op on an empty frame", () => {
    expect(gradeWithModel([], "alpha-alif")).toEqual({ confidence: 0, matched: false });
  });

  it("rejects an out-of-distribution handshape the softmax is confident about (the 'instant yes' bug, ported from KNN)", () => {
    // The softmax runs over a CLOSED set of 28 letters, so a junk / non-letter
    // hand is still normalised into "some letter" — and the closed set makes it
    // confident: fill(5) scores ~1.0 on whatever class it lands nearest in
    // weight space. Without the seed-distance gate the MLP waves it straight
    // through. Grade it against the very class the model NAMES for it, so the
    // only thing that can reject it is the OOD gate.
    const junk = Array(42).fill(5);
    const guess = classify(junk);
    expect(guess.confidence).toBeGreaterThanOrEqual(MODEL_TAU); // model IS confident (else the test is toothless)
    expect(gradeWithModel(junk, guess.classId).matched).toBe(false); // …but it's OOD, so no match
  });

  it("classifies real signer vectors with high top-1 accuracy", () => {
    let total = 0, correct = 0;
    for (const [id, vecs] of Object.entries(data)) {
      for (const v of vecs) {
        total++;
        if (classify(v).classId === id) correct++;
      }
    }
    const acc = correct / total;
    // forward pass must reproduce training-level accuracy (model fits the seeds)
    expect(acc).toBeGreaterThan(0.95);
  });

  it("gives the correct letter a high probability for a known sample", () => {
    const [id, vecs] = Object.entries(data)[0];
    const r = classify(vecs[0]);
    expect(r.probOf(id)).toBeGreaterThan(0.5);
  });
});
