// Landmark normalisation — PRD §9.1.
// Translate to wrist origin → scale by hand size → mirror so left- and
// right-handers land in the same feature space (§6.8 fairness).
export interface LM {
  x: number;
  y: number;
  z: number;
}

/** 21 landmarks → 42-dim normalised feature vector (x,y pairs). */
export function normalizeLandmarks(lms: LM[], mirror: boolean): number[] {
  if (lms.length === 0) return []; // defensive — no landmarks → no feature vector
  const wrist = lms[0];
  const rel: [number, number][] = [];
  let scale = 0;
  for (const p of lms) {
    const x = p.x - wrist.x;
    const y = p.y - wrist.y;
    rel.push([x, y]);
    const d = Math.hypot(x, y);
    if (d > scale) scale = d;
  }
  if (scale === 0) scale = 1;
  const out: number[] = [];
  for (const [x, y] of rel) {
    out.push((mirror ? -x : x) / scale, y / scale);
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
