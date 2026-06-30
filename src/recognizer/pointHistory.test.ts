// Locks the motion-capability primitives: the ring buffer, the kinivi sequence
// feature, and the geometric motion recogniser on synthetic trajectories.
import { describe, it, expect } from "vitest";
import { PointHistory, pointHistoryFeature, classifyMotion, INDEX_TIP } from "./pointHistory";
import type { LM } from "./normalize";

const lmsAt = (x: number, y: number): LM[] =>
  Array.from({ length: 21 }, (_, i) => ({ x: i === INDEX_TIP ? x : 0, y: i === INDEX_TIP ? y : 0, z: 0 }));

const line = (x0: number, y0: number, x1: number, y1: number, n = 16): [number, number][] =>
  Array.from({ length: n }, (_, i) => [x0 + ((x1 - x0) * i) / (n - 1), y0 + ((y1 - y0) * i) / (n - 1)]);

describe("PointHistory buffer", () => {
  it("keeps only the most recent `capacity` points", () => {
    const h = new PointHistory(4);
    for (let i = 0; i < 10; i++) h.push(lmsAt(i / 10, 0.5));
    expect(h.length).toBe(4);
    expect(h.ready).toBe(false); // capacity 4 < 8-frame readiness floor
  });

  it("is ready after >= 8 frames and ignores empty frames", () => {
    const h = new PointHistory(16);
    h.push(null);
    expect(h.length).toBe(0);
    for (let i = 0; i < 8; i++) h.push(lmsAt(0.5, 0.5));
    expect(h.ready).toBe(true);
  });
});

describe("pointHistoryFeature", () => {
  it("is zero-based on the first point and scaled into [-1,1]", () => {
    const f = pointHistoryFeature(line(0.2, 0.5, 0.8, 0.5));
    expect(f.slice(0, 2)).toEqual([0, 0]); // first point is the origin
    expect(Math.max(...f.map(Math.abs))).toBeLessThanOrEqual(1);
    expect(f.length).toBe(16 * 2);
  });
  it("returns empty for no points", () => {
    expect(pointHistoryFeature([])).toEqual([]);
  });
});

describe("classifyMotion", () => {
  it("detects a rightward swipe", () => {
    expect(classifyMotion(line(0.2, 0.5, 0.85, 0.5)).kind).toBe("right");
  });
  it("detects a leftward swipe", () => {
    expect(classifyMotion(line(0.85, 0.5, 0.2, 0.5)).kind).toBe("left");
  });
  it("detects an upward swipe (image y is down)", () => {
    expect(classifyMotion(line(0.5, 0.85, 0.5, 0.2)).kind).toBe("up");
  });
  it("detects a downward swipe", () => {
    expect(classifyMotion(line(0.5, 0.2, 0.5, 0.85)).kind).toBe("down");
  });
  it("calls a tiny jitter static", () => {
    const jitter: [number, number][] = Array.from({ length: 12 }, (_, i) => [
      0.5 + Math.sin(i) * 0.01,
      0.5 + Math.cos(i) * 0.01,
    ]);
    expect(classifyMotion(jitter).kind).toBe("static");
  });
  it("detects a circular path that returns to start", () => {
    const circle: [number, number][] = Array.from({ length: 20 }, (_, i) => {
      const a = (2 * Math.PI * i) / 19;
      return [0.5 + Math.cos(a) * 0.15, 0.5 + Math.sin(a) * 0.15];
    });
    expect(classifyMotion(circle).kind).toBe("circular");
  });
});
