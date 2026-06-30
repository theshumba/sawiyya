// Locks the trained MLP classifier: top-1 accuracy over the real seed vectors
// must stay high, and a correct letter must out-score the rest. Guards against a
// broken forward pass or a bad retrain landing in seeds/alphabet-model.json.
import { describe, it, expect } from "vitest";
import seeds from "./seeds/alphabet.json";
import { classify, modelKnows, gradeWithModel, MODEL_TAU } from "./classifier";

const data = seeds as Record<string, number[][]>;

describe("MLP keypoint classifier", () => {
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
