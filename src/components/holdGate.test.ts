// L1 hold accumulator — locks the fix for the reviewer's low-fps regression.
// The hold must (a) never let one long inter-frame gap accumulate into an instant
// pass, AND (b) still reach the threshold on a genuinely low-fps device (the naive
// ">300ms gap resets the streak" version made confirmation IMPOSSIBLE below ~3fps).
import { describe, it, expect } from "vitest";
import { stepHold, HOLD_MS, HOLD_STEP_CAP } from "./holdGate";

describe("time-based hold accumulator (L1)", () => {
  it("the first frame of a streak contributes no held time yet", () => {
    expect(stepHold(0, null, 1000)).toBe(0);
  });

  it("accrues real time on normal-fps frames and reaches the threshold", () => {
    let h = 0;
    let last: number | null = null;
    let ts = 0;
    for (let i = 0; i < 40; i++) {
      ts += 33; // ~30 fps
      h = stepHold(h, last, ts);
      last = ts;
    }
    expect(h).toBeGreaterThanOrEqual(HOLD_MS); // ~1.2s of held time confirms
  });

  it("caps one long gap so a backgrounded tab can never instant-pass", () => {
    // 1100ms already held, then a 10s stall/background: the resume frame adds only
    // the cap, not the whole gap — so it can't jump straight past HOLD_MS.
    expect(stepHold(1100, 1000, 11000)).toBe(1100 + HOLD_STEP_CAP);
  });

  it("still confirms on a low-fps device (>300ms frames) — just takes a few frames", () => {
    let h = 0;
    let last: number | null = null;
    let ts = 0;
    let frames = 0;
    while (h < HOLD_MS && frames < 100) {
      ts += 400; // ~2.5 fps — below the old 300ms reset threshold
      h = stepHold(h, last, ts);
      last = ts;
      frames++;
    }
    expect(h).toBeGreaterThanOrEqual(HOLD_MS); // reachable (was IMPOSSIBLE before the fix)
    expect(frames).toBeLessThan(10);
  });

  it("ignores a non-monotonic timestamp instead of subtracting held time", () => {
    expect(stepHold(500, 2000, 1000)).toBe(500); // ts < last → add 0, never go negative
  });
});
