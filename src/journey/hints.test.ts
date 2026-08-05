// Phase 3 · the hint budget. One hint per session, and never on the screen the
// app launched on — front-loaded tours tested worse than nothing.
import { beforeEach, describe, expect, it } from "vitest";
import { claimHint, resetHintBudget } from "./hints";
import { HINTS } from "./journey";

beforeEach(() => {
  // 1 navigation = the learner has moved at least once, which is the earliest a
  // hint may appear. Tests that care about launch pass 0 themselves.
  resetHintBudget(1);
});

describe("claimHint", () => {
  it("gives the hint for that empty state", () => {
    expect(claimHint("family-board", {})?.id).toBe("hint-family-board");
  });

  it("stays silent on the screen the app launched on", () => {
    resetHintBudget(0);
    expect(claimHint("family-board", {})).toBeNull();
  });

  it("spends the whole session's budget on the first hint", () => {
    expect(claimHint("family-board", {})).not.toBeNull();
    expect(claimHint("progress-due", {})).toBeNull();
    expect(claimHint("progress-league", {})).toBeNull();
  });

  it("does not repeat a hint the learner has already met", () => {
    const seen = { "hint-family-board": 1 };
    expect(claimHint("family-board", seen)).toBeNull();
    // …and the budget was not spent on the hint it refused to show.
    expect(claimHint("progress-due", seen)).not.toBeNull();
  });

  it("re-introduces a hint whose rev has moved", () => {
    expect(claimHint("family-board", { "hint-family-board": 0 })?.id).toBe("hint-family-board");
  });

  it("returns null for a place with no hint", () => {
    // @ts-expect-error — a place that is not in HintPlace, i.e. a screen added
    // later that nobody wrote a hint for. It must be silent, not throw.
    expect(claimHint("some-new-screen", {})).toBeNull();
    expect(HINTS.some((h) => h.place === "family-board")).toBe(true);
  });
});
