// pointHistory.ts — MOTION-sign capability (kinivi point-history pattern).
// Static handshapes are graded by the MLP/KNN on a single frame. Motion signs need
// the *trajectory*: buffer the last N frames of a tracked point (default: index
// fingertip) → turn it into a sequence feature → recognise the movement.
//
// HONEST SCOPE: this lands the ENGINE capability — a ring buffer, a kinivi-style
// normalised sequence feature (ready to feed a GRU/1D-CNN run via onnxruntime-web),
// and a transparent geometric recogniser that DEMONSTRABLY classifies motion
// (static / swipe direction / circular). It does NOT grade real QSL words: there is
// no public QSL isolated-sign dataset, so real motion-word recognition still needs a
// native signer to record sequences (then the feature here trains the sequence model).
import type { LM } from "./normalize";

export type MotionKind = "static" | "left" | "right" | "up" | "down" | "circular";

/** Index fingertip — the most expressive single point for tracing a movement. */
export const INDEX_TIP = 8;

/** Fixed-length ring buffer of recent 2D points (image-normalised, 0..1, y-down). */
export class PointHistory {
  private buf: [number, number][] = [];
  constructor(private readonly capacity = 16) {}

  /** Push the tracked landmark from one frame. Pass null when no hand is seen. */
  push(lms: LM[] | null, index = INDEX_TIP): void {
    if (!lms || lms.length <= index) return;
    const p = lms[index];
    this.buf.push([p.x, p.y]);
    if (this.buf.length > this.capacity) this.buf.shift();
  }

  clear(): void {
    this.buf = [];
  }

  get length(): number {
    return this.buf.length;
  }

  points(): [number, number][] {
    return this.buf.slice();
  }

  /** True once enough frames (a fixed 8-frame floor) have accumulated to judge a
   *  movement. A buffer smaller than the floor can never be "ready" — too few
   *  points to read a trajectory from. */
  get ready(): boolean {
    return this.buf.length >= 8;
  }
}

/**
 * kinivi point-history feature: each point made relative to the FIRST point, then
 * scaled by the largest absolute coordinate → a 2N vector in [-1, 1]. This is the
 * exact shape a small sequence classifier (GRU / 1D-CNN) consumes.
 */
export function pointHistoryFeature(points: [number, number][]): number[] {
  if (points.length === 0) return [];
  const [bx, by] = points[0];
  const rel = points.map(([x, y]) => [x - bx, y - by] as [number, number]);
  let max = 0;
  for (const [x, y] of rel) max = Math.max(max, Math.abs(x), Math.abs(y));
  if (max === 0) max = 1;
  const out: number[] = [];
  for (const [x, y] of rel) out.push(x / max, y / max);
  return out;
}

/**
 * Transparent geometric motion recogniser (capability demo — not a QSL word grader).
 * Thresholds are fractions of the camera frame, so they're scale-free.
 */
export function classifyMotion(points: [number, number][]): { kind: MotionKind; confidence: number } {
  if (points.length < 4) return { kind: "static", confidence: 0 };
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last[0] - first[0];
  const dy = last[1] - first[1];
  const net = Math.hypot(dx, dy);
  let path = 0;
  for (let i = 1; i < points.length; i++) {
    path += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }

  // barely moved → static handshape territory
  if (net < 0.05 && path < 0.12) return { kind: "static", confidence: 1 - net / 0.05 };

  // wandered a long way but ended near where it started → circular / repetitive
  if (path > 0.3 && net < 0.18 && path > 2.5 * net) {
    return { kind: "circular", confidence: Math.min(1, path) };
  }

  // dominant straight-line axis (y is image-down, so dy<0 is upward)
  const conf = Math.min(1, net / 0.4);
  if (Math.abs(dx) >= Math.abs(dy)) return { kind: dx >= 0 ? "right" : "left", confidence: conf };
  return { kind: dy >= 0 ? "down" : "up", confidence: conf };
}
