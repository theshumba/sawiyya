// Phase 3 · the ladder's rules, in isolation from React and the store.
import { describe, expect, it } from "vitest";
import {
  ANNOUNCEMENTS,
  coldStartSeen,
  HINTS,
  isActionable,
  isUnseen,
  nextStep,
  stageOf,
  stepById,
  STEPS,
  stepsImpliedBy,
  type StepId,
} from "./journey";

const set = (...ids: string[]) => new Set(ids);

describe("the ladder is an ordered list, not a rules engine", () => {
  it("has unique ids", () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(STEPS.length);
  });

  it("carries both languages on every row", () => {
    for (const s of STEPS) {
      expect(s.en.length, s.id).toBeGreaterThan(0);
      expect(s.ar.length, s.id).toBeGreaterThan(0);
      expect(s.bodyEn.length, s.id).toBeGreaterThan(0);
      expect(s.bodyAr.length, s.id).toBeGreaterThan(0);
    }
  });

  it("gives every step that has no destination a way to act anyway", () => {
    // The only step without a `go` is install, which opens instructions instead.
    // Any other row with no destination would be unfollowable — the exact way a
    // getting-started list becomes decoration.
    expect(STEPS.filter((s) => !s.go).map((s) => s.id)).toEqual(["install"]);
  });
});

describe("nextStep — one canonical next action", () => {
  it("is the first step on a fresh device", () => {
    expect(nextStep(set())?.id).toBe(STEPS[0].id);
  });

  it("walks the array in order", () => {
    expect(nextStep(set("first-sign"))?.id).toBe("first-lesson");
    expect(nextStep(set("first-sign", "first-lesson"))?.id).toBe("install");
  });

  it("skips a step the learner put aside", () => {
    expect(nextStep(set("first-sign", "first-lesson"), set("install"))?.id).toBe("first-review");
  });

  it("is null once nothing is left", () => {
    expect(nextStep(new Set(STEPS.map((s) => s.id)))).toBeNull();
  });

  it("keeps pointing at what a learner who jumped ahead has genuinely not done", () => {
    // Someone who reviewed before finishing lesson one. The review banks the
    // first sign it proves and nothing else, so the pointer lands back on the
    // lesson — not on install, and not on a step it invented for them.
    const done = set(...stepsImpliedBy("first-review"));
    expect(done.has("install")).toBe(false);
    expect(done.has("first-lesson")).toBe(false);
    expect(nextStep(done)?.id).toBe("first-lesson");
  });

  it("never wedges: every step it can park on can be put aside or completed", () => {
    // Walk the ladder the way a learner who refuses everything optional would.
    const done = new Set<string>();
    const dismissed = new Set<string>();
    let guard = STEPS.length + 1;
    let step = nextStep(done, dismissed);
    while (step && guard-- > 0) {
      if (step.dismissible) dismissed.add(step.id);
      else done.add(step.id);
      step = nextStep(done, dismissed);
    }
    expect(step).toBeNull();
  });
});

describe("backfill — a step banks only what it actually proves", () => {
  it("takes the transitive closure, in ladder order", () => {
    expect(stepsImpliedBy("first-unit")).toEqual(["first-sign", "first-lesson", "first-unit"]);
  });

  it("never claims install on the learner's behalf", () => {
    for (const s of STEPS) {
      if (s.id === "install") continue;
      expect(stepsImpliedBy(s.id), s.id).not.toContain("install");
    }
  });

  it("claims nothing at all for a one-tap step", () => {
    // The plan's positional rule would have ticked first-sign, first-lesson,
    // install and first-review here — for a learner who has done none of them.
    expect(stepsImpliedBy("first-flag")).toEqual(["first-flag"]);
  });

  it("does not claim a finished lesson off a review", () => {
    expect(stepsImpliedBy("first-review")).toEqual(["first-sign", "first-review"]);
  });

  it("still completes install when install itself is the one reached", () => {
    expect(stepsImpliedBy("install")).toEqual(["install"]);
  });

  it("returns nothing for an id that is no longer a step", () => {
    expect(stepsImpliedBy("retired-step" as StepId)).toEqual([]);
  });

  it("only ever entails steps that really exist and sit earlier", () => {
    // An entailment pointing forwards would tick a step the learner has not
    // reached; one pointing at a deleted id would silently do nothing.
    STEPS.forEach((s, i) => {
      for (const e of s.entails) {
        const j = STEPS.findIndex((x) => x.id === e);
        expect(j, `${s.id} entails ${e}`).toBeGreaterThanOrEqual(0);
        expect(j, `${s.id} entails ${e}`).toBeLessThan(i);
      }
    });
  });

  it("gives every step that proves nothing a way to be put aside", () => {
    // Otherwise the pointer parks on it forever for anyone who never does it —
    // the wedge the plan's positional backfill was there to prevent.
    for (const s of STEPS) {
      if (s.entails.length === 0 && s.id !== STEPS[0].id) {
        expect(s.dismissible, s.id).toBe(true);
      }
    }
  });
});

describe("stage is derived, never stored", () => {
  it("reads new / started / learning / settled off the same ladder", () => {
    expect(stageOf(set())).toBe("new");
    expect(stageOf(set("first-sign"))).toBe("started");
    expect(stageOf(set("first-sign", "first-lesson"))).toBe("learning");
    expect(stageOf(new Set(STEPS.map((s) => s.id)))).toBe("settled");
  });

  it("settles when the only step left was put aside", () => {
    const done = new Set(STEPS.filter((s) => s.id !== "install").map((s) => s.id));
    expect(stageOf(done)).toBe("learning");
    expect(stageOf(done, set("install"))).toBe("settled");
  });

  it("ignores ids that are no longer steps, rather than stranding on them", () => {
    // Removing a step from STEPS must not leave a learner in a stage that no
    // longer exists — the whole reason stage is derived.
    expect(stageOf(set("a-step-we-deleted"))).toBe("started");
  });
});

describe("isActionable", () => {
  const review = stepById("first-review")!;
  const flag = stepById("first-flag")!;

  it("holds the review step back until something is due", () => {
    expect(isActionable(review, { dueCount: 0 })).toBe(false);
    expect(isActionable(review, { dueCount: 1 })).toBe(true);
  });

  it("leaves steps with no precondition alone", () => {
    expect(isActionable(flag, { dueCount: 0 })).toBe(true);
  });
});

describe("hints", () => {
  it("has unique ids and both languages", () => {
    expect(new Set(HINTS.map((h) => h.id)).size).toBe(HINTS.length);
    for (const h of HINTS) {
      expect(h.en.length, h.id).toBeGreaterThan(0);
      expect(h.ar.length, h.id).toBeGreaterThan(0);
      expect(h.rev, h.id).toBeGreaterThan(0);
    }
  });

  it("puts at most one hint in each empty state", () => {
    const places = HINTS.map((h) => h.place);
    expect(new Set(places).size).toBe(places.length);
  });
});

describe("announcement revs", () => {
  it("seeds a genuinely first run with every current rev", () => {
    const list = [
      { id: "feature-a", rev: 2 },
      { id: "feature-b", rev: 1 },
    ];
    expect(coldStartSeen(list)).toEqual({ "feature-a": 2, "feature-b": 1 });
  });

  it("re-arms a surface when its rev moves", () => {
    const seen = coldStartSeen([{ id: "feature-a", rev: 1 }]);
    expect(isUnseen("feature-a", 1, seen)).toBe(false);
    expect(isUnseen("feature-a", 2, seen)).toBe(true);
    expect(isUnseen("never-met", 1, seen)).toBe(true);
  });

  it("ships with no announcements, so nothing announces itself today", () => {
    // The empty list is the point: see the comment on ANNOUNCEMENTS. Change this
    // number deliberately, alongside the badge that reads it.
    expect(ANNOUNCEMENTS).toHaveLength(0);
  });
});
