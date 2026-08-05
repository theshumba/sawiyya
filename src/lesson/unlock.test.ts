// The padlock has to MEAN something. Before Phase 1 it was one `disabled`
// attribute on Home's sheet button, bypassed four ways, while i18n promised
// "Finish the sign before this to unlock". These tests pin the four bypasses
// shut so a future refactor cannot quietly reopen them.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LESSONS } from "../content/signs";
import {
  currentLessonId,
  lessonFinished,
  lessonPlayable,
  lessonState,
  trailPosition,
} from "./unlock";
import type { SignProgress } from "../types";

const practised = (ids: string[]): Record<string, SignProgress> =>
  Object.fromEntries(
    ids.map((id) => [id, { masteryLevel: 2, lastSeen: "2026-08-01T00:00:00.000Z" }]),
  );

/** Progress that finishes every lesson strictly before `lessonId`. */
const arrivedAt = (lessonId: string): Record<string, SignProgress> => {
  const ids: string[] = [];
  for (const l of LESSONS) {
    if (l.id === lessonId) break;
    ids.push(...l.signIds);
  }
  return practised(ids);
};

// The third node. This used to be the word lesson "First connections", which
// was the audit's original bypass; the words were removed 2026-08-05 and the
// bypass it proved is a property of the trail, not of that lesson, so the test
// simply points at a later alphabet node instead (docs/RECORD-WORD-SIGNS.md).
const LATER_LESSON = "alpha-u1-l3";
const LESSON_BEFORE = "alpha-u1-l2";

async function freshStore() {
  vi.resetModules();
  const app = await import("../store/app");
  const engine = await import("./engine");
  const pid = app.useApp.getState().createProfile({
    displayName: "Sim",
    role: "parent",
    dominantHand: "R",
    language: "en",
    dailyGoal: "regular",
  });
  app.useApp.getState().completeOnboarding();
  return { ...app, ...engine, pid };
}

beforeEach(() => {
  localStorage.clear();
});

describe("the trail runs in order", () => {
  it("a fresh learner is on lesson one, and everything after it is locked", () => {
    const prog = {};
    expect(trailPosition(prog)).toBe(0);
    expect(currentLessonId(prog)).toBe(LESSONS[0].id);
    expect(lessonState(LESSONS[0].id, prog)).toBe("current");
    for (const l of LESSONS.slice(1)) expect(lessonState(l.id, prog)).toBe("locked");
  });

  it("finishing a lesson moves the position forward by exactly one", () => {
    const prog = arrivedAt(LESSONS[1].id);
    expect(trailPosition(prog)).toBe(1);
    expect(lessonState(LESSONS[0].id, prog)).toBe("done");
    expect(lessonState(LESSONS[1].id, prog)).toBe("current");
    expect(lessonState(LESSONS[2].id, prog)).toBe("locked");
  });

  it("a finished path has no current lesson and no locked ones", () => {
    const prog = practised(LESSONS.flatMap((l) => l.signIds));
    expect(trailPosition(prog)).toBe(LESSONS.length);
    expect(currentLessonId(prog)).toBeUndefined();
    for (const l of LESSONS) expect(lessonState(l.id, prog)).toBe("done");
  });
});

// Bypass 1 (the one the audit found on the trail itself): self-marking every
// sign of a LATER node used to draw a green tick on it while the nodes before
// it were still locked.
describe("a lesson cannot complete out of order", () => {
  it("practising a later lesson's signs does NOT unlock or complete its node", () => {
    const prog = practised(LESSONS.find((l) => l.id === LATER_LESSON)!.signIds);
    expect(lessonFinished(LATER_LESSON, prog)).toBe(true); // its own signs ARE practised
    expect(lessonState(LATER_LESSON, prog)).toBe("locked"); // and it is still locked
    expect(trailPosition(prog)).toBe(0); // the learner has not moved
    expect(lessonPlayable(LATER_LESSON, prog)).toBe(false);
  });

  it("it unlocks once the lessons before it are actually finished", () => {
    const prog = arrivedAt(LATER_LESSON);
    expect(lessonState(LATER_LESSON, prog)).toBe("current");
    expect(lessonPlayable(LATER_LESSON, prog)).toBe(true);
    expect(lessonState(LESSON_BEFORE, prog)).toBe("done");
  });
});

// Bypass 2: `#/lesson/<any-id>` played any lesson in the curriculum, because
// neither LessonPlayer nor buildDrillQueue asked whether it was reachable.
describe("buildDrillQueue enforces the lock", () => {
  it("a locked lesson yields no drills, however it was reached", async () => {
    const S = await freshStore();
    expect(S.buildDrillQueue(LATER_LESSON, S.useApp.getState(), S.pid)).toEqual([]);
    expect(S.buildDrillQueue("alpha-u1-l4", S.useApp.getState(), S.pid)).toEqual([]);
  });

  it("the current lesson still builds a real queue", async () => {
    const S = await freshStore();
    const q = S.buildDrillQueue(LESSONS[0].id, S.useApp.getState(), S.pid);
    expect(q.length).toBeGreaterThan(0);
  });

  it("review is never locked — it can only hold signs already met", async () => {
    const S = await freshStore();
    expect(lessonPlayable("review", {})).toBe(true);
    // No due cards on a fresh profile, so the queue is empty for that reason,
    // not because the pseudo-lesson was refused.
    expect(S.buildDrillQueue("review", S.useApp.getState(), S.pid)).toEqual([]);
  });
});
