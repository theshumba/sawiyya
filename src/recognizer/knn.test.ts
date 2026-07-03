import { beforeEach, describe, expect, it } from "vitest";
import {
  __setSeedsForTest,
  addSample,
  classifyAgainst,
  isTrained,
  sampleCount,
  trainedClassIds,
  userTaughtClassIds,
} from "./knn";

const v0 = (tail = 0) => [...Array(41).fill(0), tail];
const v1 = (tail = 1) => [...Array(41).fill(1), tail];

beforeEach(() => {
  localStorage.clear();
  // fresh seeds per test: two separable classes, 8 samples each
  __setSeedsForTest({
    "alpha-alif": Array.from({ length: 8 }, (_, i) => v0(i / 100)),
    "alpha-ba": Array.from({ length: 8 }, (_, i) => v1(1 + i / 100)),
  });
});

describe("seeds base layer", () => {
  it("treats a seeded class as trained without any user samples", () => {
    expect(isTrained("alpha-alif")).toBe(true);
    expect(sampleCount("alpha-alif")).toBeGreaterThanOrEqual(8);
    expect(trainedClassIds()).toEqual(expect.arrayContaining(["alpha-alif", "alpha-ba"]));
  });

  it("matches a vector near the target's seeds", () => {
    const res = classifyAgainst(v0(0), "alpha-alif");
    expect(res.matched).toBe(true);
    expect(res.confidence).toBeGreaterThan(0.7);
  });

  it("rejects a vector that belongs to a different class", () => {
    const res = classifyAgainst(v1(1), "alpha-alif"); // signing 'ba' while target is 'alif'
    expect(res.matched).toBe(false);
  });

  it("rejects an out-of-distribution handshape (the 'instant yes' bug)", () => {
    const wild = Array(42).fill(5); // far from every seed
    expect(classifyAgainst(wild, "alpha-alif").matched).toBe(false);
  });
});

describe("user-only taught count (L2)", () => {
  it("counts only handshapes the learner personally taught, never the bundled seeds", () => {
    // Two seeded classes exist (beforeEach), but the user has taught nothing yet.
    // The seeds-inclusive trainedClassIds() reads ≥2 here — the DevMetrics bug.
    expect(trainedClassIds().length).toBeGreaterThanOrEqual(2);
    expect(userTaughtClassIds()).toEqual([]);

    // Teach a brand-new word sign with enough samples → it counts.
    for (let i = 0; i < 6; i++) addSample("word-milk", v0(i / 100));
    expect(userTaughtClassIds()).toEqual(["word-milk"]);

    // A couple of stray user samples on a SEEDED class don't cross the floor, so
    // the count stays honest (the seeds themselves never inflate it).
    addSample("alpha-alif", v0());
    addSample("alpha-alif", v0());
    expect(userTaughtClassIds()).toEqual(["word-milk"]);
  });
});
