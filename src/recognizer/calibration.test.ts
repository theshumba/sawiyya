import { describe, expect, it } from "vitest";
import { evaluate } from "./calibration";

const z = (t = 0) => [...Array(41).fill(0), t];
const o = (t = 1) => [...Array(41).fill(1), t];

describe("evaluate", () => {
  const train = { "alpha-alif": [z(), z(0.01), z(0.02)], "alpha-ba": [o(), o(1.01), o(1.02)] };

  it("accepts true-positive samples of their own class", () => {
    const test = [
      { targetId: "alpha-alif", vec: z(0.005), positive: true },
      { targetId: "alpha-ba", vec: o(1.005), positive: true },
    ];
    const r = evaluate({ train, test, distanceGate: 0.55, tau: 0.78, margin: 0.15 });
    expect(r.trueAccept).toBe(1);
    expect(r.falseAccept).toBe(0); // no negatives present
  });

  it("rejects negative samples (vec belongs to a different class than the target)", () => {
    const test = [
      { targetId: "alpha-alif", vec: o(1.005), positive: false }, // signing ba, graded as alif
      { targetId: "alpha-ba", vec: z(0.005), positive: false },   // signing alif, graded as ba
    ];
    const r = evaluate({ train, test, distanceGate: 0.55, tau: 0.78, margin: 0.15 });
    expect(r.falseAccept).toBe(0);
  });

  it("counts a real false-accept when a negative slips through a too-loose gate", () => {
    // identical clusters → target's share can clear tau; a huge gate lets it through
    const t2 = { "alpha-alif": [z(), z()], "alpha-ba": [z(), z()] };
    const test = [{ targetId: "alpha-alif", vec: z(), positive: false }];
    const r = evaluate({ train: t2, test, distanceGate: 99, tau: 0, margin: 0 });
    expect(r.falseAccept).toBe(1);
  });
});
