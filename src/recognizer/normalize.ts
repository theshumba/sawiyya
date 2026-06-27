// Landmark normalisation — PRD §9.1.
// Translate to wrist origin → mirror (left/right fairness, §6.8) → rotate to a
// canonical orientation → scale by hand size. Removing in-plane rotation is what
// lets a *correctly-shaped* hand match regardless of how the learner happens to
// tilt it toward the camera: without it, a perfect handshape held ~15–20° off the
// dataset's pose lands outside the KNN gate and the meter sticks at 0% — which
// surfaces as "works for some people, not others" even though nothing here reads
// skin colour (landmarks are pure geometry). See tools/extract-seeds/SOURCES.md.
export interface LM {
  x: number;
  y: number;
  z: number;
}

// Middle-finger MCP (knuckle). Rigid relative to the wrist regardless of which
// fingers are extended, so wrist→MCP9 is a stable "which way is the palm pointing"
// axis to align on.
const MIDDLE_MCP = 9;

/** 21 landmarks → 42-dim normalised feature vector (x,y pairs). */
export function normalizeLandmarks(lms: LM[], mirror: boolean): number[] {
  if (lms.length === 0) return []; // defensive — no landmarks → no feature vector
  const wrist = lms[0];

  // 1. translate to wrist origin; 2. mirror so both hands share one feature space.
  const rel: [number, number][] = lms.map((p) => {
    const x = p.x - wrist.x;
    const y = p.y - wrist.y;
    return [mirror ? -x : x, y];
  });

  // 3. rotation-canonicalise: spin the whole hand so its wrist→middle-knuckle axis
  //    points in one fixed direction. A tilted-but-correct handshape now maps to the
  //    same vector as an upright one. (Rotation is about the wrist origin, so it
  //    preserves every point's distance from the wrist — scale below is unaffected.)
  const ref = rel[MIDDLE_MCP] ?? rel[rel.length - 1];
  const theta = Math.atan2(ref[1], ref[0]); // current angle of the hand's long axis
  const cos = Math.cos(-theta);
  const sin = Math.sin(-theta);

  let scale = 0;
  const rot: [number, number][] = rel.map(([x, y]) => {
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    const d = Math.hypot(rx, ry);
    if (d > scale) scale = d;
    return [rx, ry];
  });
  if (scale === 0) scale = 1;

  // 4. scale by hand size — makes it invariant to distance from the camera.
  const out: number[] = [];
  for (const [x, y] of rot) {
    out.push(x / scale, y / scale);
  }
  return out;
}

export function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}
