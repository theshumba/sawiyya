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
// Thresholds are DATA-DERIVED from the real seeds (5,600 sample×finger pairs):
// a correct hand's worst finger sits under 0.113 at p90 / 0.159 at p95, while a
// wrong LETTER's worst finger starts at 0.243 (p10) with median 0.399. 0.13 ≈ p92
// of correct-hand noise; the residual is absorbed structurally — the coach only
// runs on frames the model already rejected, and a hint must survive ~700 ms of
// consecutive frames before it shows. Tip-radius within-noise is 0.078 at p90.
const FINGER_MIN = 0.13; // mean per-joint deviation before we say anything
const DIRECTION_DELTA = 0.08; // tip-radius difference before curl/extend is clear
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
