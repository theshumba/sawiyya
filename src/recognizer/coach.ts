// Sign Coach — turns "not matching" into ONE honest corrective hint.
// Design: docs/superpowers/specs/2026-07-07-sign-coach-design.md.
//
// Compares the live normalised 42-vec (the exact vector the grader computes in
// CameraTrainer) against the letter's MEAN real-signer handshape from
// alphabet-shapes.json — the same normalised space (normalize.ts), so per-finger
// deviation is pure geometry. Decision ladder, honesty first:
//   1. ≥REFERENCE_AT fingers clearly off → "check the reference" (naming one
//      finger would be fake precision when the whole shape is wrong);
//   2. worst finger over FINGER_MIN with a CLEAR curl/extend direction (live
//      fingertip-to-wrist radius vs the target's) → name it;
//   3. ambiguous (sideways) or everything close → null. Silence over wrong advice.
// "Rotate your hand" deliberately does NOT exist: normalize.ts rotation-
// canonicalises every frame, so rotation can never be why a learner is stuck.
import shapeData from "./seeds/alphabet-shapes.json";

export type FingerName = "thumb" | "index" | "middle" | "ring" | "pinky";
export type CoachAdvice =
  | { kind: "finger"; finger: FingerName; fingerIndex: number; direction: "curl" | "extend" }
  | { kind: "reference" };

// MediaPipe 21-point finger groups, base→tip (same grouping as HandSkeleton).
const FINGERS: { name: FingerName; joints: [number, number, number, number] }[] = [
  { name: "thumb", joints: [1, 2, 3, 4] },
  { name: "index", joints: [5, 6, 7, 8] },
  { name: "middle", joints: [9, 10, 11, 12] },
  { name: "ring", joints: [13, 14, 15, 16] },
  { name: "pinky", joints: [17, 18, 19, 20] },
];

// Units: normalised hand space (wrist at origin), re-anchored on the palm below.
// Thresholds are DATA-DERIVED — re-derived 2026-08-01 on the blended two-dataset
// corpus (4,480 sample×5-finger pairs, same method as the 2026-07-07 originals):
// a correct hand's worst finger now sits at 0.237 (p90) / 0.260 (p92) — the
// ArSL21L population is noisier than Zenodo's studio captures, and per-population
// reference means barely help (own-population p90 is still 0.206), so the single
// blended mean stays. A wrong LETTER's worst finger starts at 0.244 (p10),
// median 0.425. 0.24 ≈ p90 of correct-hand noise AND just under the ~0.25 a
// fully-curled-when-should-be-extended finger produces — the canonical miss
// the coach exists to catch. False coaching needs BOTH gates to trip (err ≥
// 0.24 and |tip-radius delta| ≥ 0.17 = its own p90), so the joint rate on
// correct hands stays in the low single digits; the rest is absorbed
// structurally (model-rejected frames only + ~700 ms stability). The coach
// speaks less than the old 0.13 world, but what it names is right for BOTH
// signer populations — silence over wrong advice (ladder rule 3).
const FINGER_MIN = 0.24; // mean per-joint deviation before we say anything
const DIRECTION_DELTA = 0.17; // tip-radius difference before curl/extend is clear
const REFERENCE_AT = 3; // this many wrong fingers → the whole shape is off

// Palm knuckles (MCPs) — rigid relative to the wrist REGARDLESS of finger pose.
// normalize.ts scales by the max landmark radius, which IS pose-dependent: curl
// the longest finger and the whole live hand rescales, smearing that one finger's
// deviation across all five. So before comparing, the live hand is re-anchored to
// the target's scale via the mean palm-knuckle radius — pose-independent ground.
const PALM_MCPS = [5, 9, 13, 17];

const TARGETS = (shapeData as { shapes: Record<string, number[][]> }).shapes;

const palmRadiusOfTarget = (pts: number[][]) => {
  let sum = 0;
  for (const j of PALM_MCPS) sum += Math.hypot(pts[j][0], pts[j][1]);
  return sum / PALM_MCPS.length;
};

/** True when a real mean handshape exists to coach against. */
export function coachKnows(signId: string): boolean {
  return signId in TARGETS;
}

/**
 * One corrective hint for a non-matching frame, or null for silence.
 * `vec` is the 42-dim output of normalizeLandmarks (x,y pairs, wrist-origin).
 */
export function coach(vec: number[], signId: string): CoachAdvice | null {
  const target = TARGETS[signId];
  if (!target || vec.length < 42) return null;

  // Re-anchor the live hand's scale on the palm (see PALM_MCPS note above).
  let livePalm = 0;
  for (const j of PALM_MCPS) livePalm += Math.hypot(vec[j * 2], vec[j * 2 + 1]);
  livePalm /= PALM_MCPS.length;
  if (livePalm < 1e-6) return null; // degenerate frame — say nothing
  const s = palmRadiusOfTarget(target) / livePalm;

  // Per-finger error: mean per-joint distance to the target joint.
  const errs = FINGERS.map((f, fingerIndex) => {
    let sum = 0;
    for (const j of f.joints) {
      sum += Math.hypot(vec[j * 2] * s - target[j][0], vec[j * 2 + 1] * s - target[j][1]);
    }
    return { finger: f.name, fingerIndex, tip: f.joints[3], err: sum / f.joints.length };
  });

  const wrong = errs.filter((e) => e.err >= FINGER_MIN).sort((a, b) => b.err - a.err);
  if (wrong.length === 0) return null;
  if (wrong.length >= REFERENCE_AT) return { kind: "reference" };

  // Worst decidable finger: direction from fingertip-to-wrist radius (wrist is the
  // origin, so the radius is just the tip's magnitude). Live radius smaller than the
  // target's → the finger is more curled than it should be → "extend"; larger →
  // "curl". A sideways deviation gives a small difference → skip it (honest).
  for (const w of wrong) {
    const liveR = Math.hypot(vec[w.tip * 2] * s, vec[w.tip * 2 + 1] * s);
    const targetR = Math.hypot(target[w.tip][0], target[w.tip][1]);
    const d = liveR - targetR;
    if (d <= -DIRECTION_DELTA)
      return { kind: "finger", finger: w.finger, fingerIndex: w.fingerIndex, direction: "extend" };
    if (d >= DIRECTION_DELTA)
      return { kind: "finger", finger: w.finger, fingerIndex: w.fingerIndex, direction: "curl" };
  }
  return null;
}
