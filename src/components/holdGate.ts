// Time-based hold gate (L1). A camera match confirms after HOLD_MS of CONTINUOUS
// matching time, measured in wall-clock ms from the frame timestamps — so it's
// independent of device fps (the old 24-frame count was ~0.8s @30fps, ~0.4s
// @60fps: an "insta-pass").
//
// Held time is ACCUMULATED across matched frames rather than gated on a single
// streak-start timestamp. Each frame-to-frame step is capped at HOLD_STEP_CAP, so:
//   · a single huge gap (backgrounded tab, stall) adds at most the cap — it can
//     never jump straight past HOLD_MS (preserves the never-insta-pass rule), and
//   · a genuinely low-fps device (frames > the cap apart) STILL accrues toward the
//     threshold. A naive ">gap resets the streak" version made confirmation
//     impossible below ~3fps — squarely in the low-end-device accessibility target.
export const HOLD_MS = 1200;
export const HOLD_STEP_CAP = 300; // max ms a single frame-to-frame step may add

/**
 * Advance the held-time accumulator by one matched frame.
 * @param heldMs  ms accumulated so far in the current unbroken match streak
 * @param lastTs  timestamp of the previous matched frame, or null at streak start
 * @param ts      this matched frame's timestamp (rAF/performance.now clock)
 * @returns the new accumulated held ms (caller resets to 0 on any non-match frame)
 */
export function stepHold(heldMs: number, lastTs: number | null, ts: number): number {
  if (lastTs === null) return heldMs; // first frame of a streak: no elapsed time yet
  // clamp the step to [0, cap]: 0 guards a non-monotonic clock, cap guards a stall.
  return heldMs + Math.min(Math.max(0, ts - lastTs), HOLD_STEP_CAP);
}
