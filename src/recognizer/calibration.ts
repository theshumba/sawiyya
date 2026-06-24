/**
 * Threshold calibration helpers — Node-safe, no module-level side-effects.
 * Mirrors the grading logic in knn.ts::classifyAgainst so sweep results
 * are valid predictors of live recognizer behaviour.
 */
import { euclidean } from "./normalize";

type Store = Record<string, number[][]>;
export interface TestItem { targetId: string; vec: number[]; positive: boolean }
interface Opts { train: Store; test: TestItem[]; distanceGate: number; tau: number; margin: number; k?: number }

/**
 * Re-implementation of classifyAgainst kept in sync with knn.ts.
 * Weighted 1/(d+0.05) votes, mean-of-topK distance gate, winner+margin.
 */
function decide(
  train: Store,
  vec: number[],
  target: string,
  gate: number,
  tau: number,
  margin: number,
  K: number,
): boolean {
  const top: { c: string; d: number }[] = [];
  for (const [c, samples] of Object.entries(train))
    for (const s of samples) top.push({ c, d: euclidean(vec, s) });
  if (top.length === 0) return false;
  top.sort((a, b) => a.d - b.d);
  const near = top.slice(0, Math.min(K, top.length));
  const meanD = near.reduce((s, n) => s + n.d, 0) / near.length;
  const w = new Map<string, number>();
  let total = 0;
  for (const n of near) {
    const x = 1 / (n.d + 0.05);
    w.set(n.c, (w.get(n.c) ?? 0) + x);
    total += x;
  }
  let best = "", bestW = 0, secondW = 0;
  for (const [c, x] of w) {
    if (x > bestW) { secondW = bestW; bestW = x; best = c; }
    else if (x > secondW) secondW = x;
  }
  const share = (w.get(target) ?? 0) / total;
  return meanD <= gate && best === target && share >= tau && (bestW - secondW) / total >= margin;
}

// NOTE: k defaults to 3 so small unit-test fixtures (< 7 total samples) work
// correctly. The sweep passes k=7 explicitly to mirror production knn.ts.
export function evaluate({ train, test, distanceGate, tau, margin, k = 3 }: Opts) {
  let pos = 0, posMatched = 0, neg = 0, negMatched = 0;
  for (const t of test) {
    const matched = decide(train, t.vec, t.targetId, distanceGate, tau, margin, k);
    if (t.positive) { pos++; if (matched) posMatched++; }
    else { neg++; if (matched) negMatched++; }
  }
  return { trueAccept: pos ? posMatched / pos : 0, falseAccept: neg ? negMatched / neg : 0, n: test.length };
}
