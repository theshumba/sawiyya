// Locks the left/right mirror convention (H17). normalizeLandmarks(lms, true)
// exists so a LEFT hand (which the camera sees as the mirror image of a right
// hand) folds into the SAME feature space as a right hand — that's the §6.8
// fairness promise, and nothing here reads skin colour: it's pure geometry.
//
// These tests characterise the ALGEBRA of that fold. They are independent of
// which detected handedness triggers mirror=true inside CameraTrainer — the live
// phone ?debug check (Alif with each hand) stays OWNER-GATED and only decides
// that trigger; if it flips, these tests still hold because they test the
// transform, not the trigger.
import { describe, it, expect, beforeAll } from "vitest";
import { normalizeLandmarks, mirrorForDetectedHand, euclidean, type LM } from "./normalize";
import { gradeWithModel } from "./classifier";
import { __setSeedsForTest } from "./seedStore";
import alphabetSeeds from "./seeds/alphabet.json";
import referenceLandmarks from "./fixtures/reference-landmarks.json";

/** A deterministic, asymmetric 21-landmark pseudo-hand in MediaPipe's normalised
 *  [0,1] image space (wrist at index 0, middle-MCP at 9). Asymmetric on purpose
 *  so a mirror is a genuinely different shape unless it's corrected. */
function makeHand(): LM[] {
  const pts: [number, number, number][] = [
    [0.50, 0.90, 0.00], // 0 wrist
    [0.44, 0.82, 0.01], [0.40, 0.74, 0.02], [0.37, 0.67, 0.02], [0.35, 0.61, 0.03], // thumb
    [0.52, 0.66, 0.00], [0.53, 0.55, 0.01], [0.54, 0.48, 0.01], [0.55, 0.42, 0.02], // index
    [0.58, 0.65, 0.00], [0.60, 0.53, 0.01], [0.61, 0.45, 0.01], [0.62, 0.39, 0.02], // middle (MCP=9)
    [0.63, 0.67, 0.00], [0.66, 0.57, 0.01], [0.68, 0.50, 0.01], [0.69, 0.45, 0.02], // ring
    [0.68, 0.71, 0.00], [0.72, 0.63, 0.01], [0.74, 0.58, 0.01], [0.75, 0.54, 0.02], // pinky
  ];
  return pts.map(([x, y, z]) => ({ x, y, z }));
}

/** Horizontal mirror in MediaPipe's [0,1] space — what the camera does to a hand
 *  of the opposite chirality (x → 1 − x). */
function mirrorX(lms: LM[]): LM[] {
  return lms.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z }));
}

describe("normalizeLandmarks — mirror convention (H17)", () => {
  it("folds a mirrored hand (mirror=true) onto the same vector as the original (mirror=false)", () => {
    const hand = makeHand();
    const asRight = normalizeLandmarks(hand, false); // seen/stored as a right hand
    const mirroredCorrected = normalizeLandmarks(mirrorX(hand), true); // the same shape, other chirality, mirror-corrected
    const d = euclidean(asRight, mirroredCorrected);
    expect(d).toBeLessThan(1e-9); // identical up to float noise
    expect(d).toBeLessThan(0.65); // …hence trivially inside the KNN credibility gate — it WOULD match
  });

  it("the mirror flag is load-bearing: forgetting it leaves a genuinely different vector", () => {
    // Guards the test above from passing vacuously (e.g. if normalize ignored the
    // flag): without the correction, a mirrored hand canonicalises to the opposite
    // chirality and is a different point in feature space.
    const hand = makeHand();
    const asRight = normalizeLandmarks(hand, false);
    const mirroredUncorrected = normalizeLandmarks(mirrorX(hand), false);
    expect(euclidean(asRight, mirroredUncorrected)).toBeGreaterThan(0.1);
  });

  it("is stable under a pure horizontal shift (translation-invariant)", () => {
    // The convention only cares about chirality, not where the hand sits in frame:
    // sliding the whole hand sideways must not change the vector.
    const hand = makeHand();
    const shifted = hand.map((p) => ({ ...p, x: p.x + 0.12 }));
    expect(euclidean(normalizeLandmarks(hand, false), normalizeLandmarks(shifted, false))).toBeLessThan(1e-9);
  });
});

// The trigger the block above deliberately did NOT cover, and which was left to
// an owner-gated manual phone check that never happened. It was inverted, and
// because gradeWithModel() zeroes confidence outside the seed cloud, EVERY
// letter read exactly 0% on a correct hand — the camera could not grade anything
// for anyone.
//
// Fixture: MediaPipe's own landmarks for the 28 bundled reference photos in
// public/handshapes (the real signer stills the app tells the learner to copy),
// captured once via HandLandmarker and frozen here so this needs no wasm.
// If a hand that IS the reference cannot score against its own letter, the
// grader is broken by definition — no judgement call, no eyeballing a meter.
describe("the live mirror trigger grades the app's own reference photos", () => {
  const refs = referenceLandmarks as Record<string, { hand: "Left" | "Right"; lms: number[][] }>;

  beforeAll(() => {
    __setSeedsForTest(alphabetSeeds as unknown as Record<string, number[][]>);
  });

  it("covers every seeded letter", () => {
    expect(Object.keys(refs)).toHaveLength(28);
  });

  it.each(Object.keys(refs))("%s: the reference hand matches its own letter", (id) => {
    const { hand, lms } = refs[id];
    const vec = normalizeLandmarks(
      lms.map(([x, y, z]) => ({ x, y, z })),
      mirrorForDetectedHand(hand),
    );
    const g = gradeWithModel(vec, id);
    expect(g.inDistribution).toBe(true);
    expect(g.confidence).toBeGreaterThan(0);
    expect(g.matched).toBe(true);
  });

  it("the trigger is load-bearing: the opposite convention grades every letter at 0%", () => {
    // Guards against the fix being made vacuous by, say, widening the OOD gate.
    const scored = Object.entries(refs).map(([id, { hand, lms }]) => {
      const vec = normalizeLandmarks(
        lms.map(([x, y, z]) => ({ x, y, z })),
        !mirrorForDetectedHand(hand),
      );
      return gradeWithModel(vec, id).confidence;
    });
    expect(scored.every((c) => c === 0)).toBe(true);
  });
});
