// Sign Coach verification — data-driven from the REAL mean handshapes, run
// through the REAL normalizeLandmarks pipeline (what a live perfect hand
// produces). Design: docs/superpowers/specs/2026-07-07-sign-coach-design.md.
import { describe, expect, it } from "vitest";
import shapeData from "./seeds/alphabet-shapes.json";
import { coach, coachKnows } from "./coach";
import { normalizeLandmarks, type LM } from "./normalize";

const SHAPES = (shapeData as { shapes: Record<string, number[][]> }).shapes;
const IDS = Object.keys(SHAPES);

// MediaPipe finger groups, base→tip (mirrors coach.ts / HandSkeleton).
const FINGERS: [number, number, number, number][] = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
];
const NAMES = ["thumb", "index", "middle", "ring", "pinky"] as const;

const toLMs = (pts: number[][]): LM[] => pts.map(([x, y]) => ({ x, y, z: 0 }));
/** A "live frame" of this shape: through the real normalisation pipeline. */
const vecOf = (pts: number[][]) => normalizeLandmarks(toLMs(pts), false);

/** Fold a finger's non-base joints toward the palm centre (midway wrist→knuckle)
 *  — where a REAL curled fingertip lands, unlike a fold onto the knuckle itself. */
function curlFinger(pts: number[][], finger: number, k = 0.3): number[][] {
  const [base, ...rest] = FINGERS[finger];
  const [cx, cy] = [pts[base][0] * 0.5, pts[base][1] * 0.5];
  const out = pts.map((p) => [...p]);
  for (const j of rest) {
    out[j] = [cx + (pts[j][0] - cx) * k, cy + (pts[j][1] - cy) * k];
  }
  return out;
}

/** Push a finger's non-base joints radially out from the wrist (origin) until the
 *  TIP sits at a clearly-extended radius (0.85). Absolute, not relative: a fist's
 *  fingers are so bunched that doubling their coords still leaves them curled. */
function extendFinger(pts: number[][], finger: number): number[][] {
  const [, ...rest] = FINGERS[finger];
  const k = 0.85 / Math.max(tipRadius(pts, finger), 0.05);
  const out = pts.map((p) => [...p]);
  for (const j of rest) {
    out[j] = [pts[j][0] * k, pts[j][1] * k];
  }
  return out;
}

const tipRadius = (pts: number[][], finger: number) => {
  const [x, y] = pts[FINGERS[finger][3]];
  return Math.hypot(x, y);
};

describe("coach honesty — a correct hand is NEVER coached", () => {
  it("every letter's own mean shape coaches null", () => {
    for (const id of IDS) {
      expect(coach(vecOf(SHAPES[id]), id), id).toBeNull();
    }
  });

  it("small landmark jitter stays silent (deterministic noise)", () => {
    for (const id of IDS.slice(0, 8)) {
      const noisy = SHAPES[id].map(([x, y], i) => [
        x + 0.02 * Math.sin(i * 7.3),
        y + 0.02 * Math.cos(i * 3.1),
      ]);
      expect(coach(vecOf(noisy), id), id).toBeNull();
    }
  });

  it("no target / short vector → null, and coachKnows gates correctly", () => {
    expect(coach(vecOf(SHAPES[IDS[0]]), "hello")).toBeNull();
    expect(coach([0, 0], IDS[0])).toBeNull();
    expect(coachKnows(IDS[0])).toBe(true);
    expect(coachKnows("hello")).toBe(false);
  });
});

describe("coach direction — perturb one finger, name that finger", () => {
  it("curling a clearly-extended finger → that finger + extend (all letters)", () => {
    let cases = 0;
    for (const id of IDS) {
      for (let f = 0; f < 5; f++) {
        if (tipRadius(SHAPES[id], f) < 0.6) continue; // only clearly-extended fingers
        cases++;
        const advice = coach(vecOf(curlFinger(SHAPES[id], f)), id);
        expect(advice, `${id}/${NAMES[f]}`).toEqual({
          kind: "finger",
          finger: NAMES[f],
          fingerIndex: f,
          direction: "extend",
        });
      }
    }
    expect(cases).toBeGreaterThan(20); // the sweep genuinely covered the alphabet
  });

  it("extending a clearly-curled finger → that finger + curl", () => {
    let cases = 0;
    for (const id of IDS) {
      for (let f = 1; f < 5; f++) {
        // thumbs excluded: their base sits near the wrist, so a radial "extend"
        // of the group is not a real extension analogue
        if (tipRadius(SHAPES[id], f) > 0.45) continue; // only clearly-curled fingers
        cases++;
        const advice = coach(vecOf(extendFinger(SHAPES[id], f)), id);
        expect(advice, `${id}/${NAMES[f]}`).toEqual({
          kind: "finger",
          finger: NAMES[f],
          fingerIndex: f,
          direction: "curl",
        });
      }
    }
    expect(cases).toBeGreaterThan(5);
  });
});

describe("coach reference — a wholesale-wrong hand is not fake-precise", () => {
  it("curling EVERY extended finger of an open letter → reference", () => {
    let cases = 0;
    for (const id of IDS) {
      const open = [0, 1, 2, 3, 4].filter((f) => tipRadius(SHAPES[id], f) >= 0.6);
      if (open.length < 3) continue;
      cases++;
      let pts = SHAPES[id];
      for (const f of open) pts = curlFinger(pts, f);
      expect(coach(vecOf(pts), id), id).toEqual({ kind: "reference" });
    }
    expect(cases).toBeGreaterThan(3);
  });
});
