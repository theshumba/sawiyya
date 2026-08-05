// Phase 3 · the journey slice where it meets real persisted state: cold start,
// the backfill from a pre-Phase-3 blob, and detection off actual drills.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LESSONS } from "../content/signs";

const KEY = "sawiyya.app.v1";

async function freshStore() {
  vi.resetModules();
  return import("./app");
}

/** A blob shaped like one written before Phase 3 existed: no `journey` key. */
function prePhase3(state: Record<string, unknown>) {
  localStorage.setItem(KEY, JSON.stringify({ state, version: 1 }));
}

const profile = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  displayName: "Amal",
  role: "parent",
  emoji: "🦊",
  dominantHand: "R",
  language: "en",
  xp: 0,
  xpToday: 0,
  reviewsToday: 0,
  streak: 0,
  bestStreak: 0,
  celebratedStreak: 0,
  lastActiveDay: null,
  activeDays: [],
  dailyGoal: "regular",
  priorSigning: "none",
  practiseDays: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

beforeEach(() => {
  localStorage.clear();
});

describe("cold start", () => {
  it("starts a genuinely first run with an empty ladder", async () => {
    const { useApp } = await freshStore();
    expect(useApp.getState().journey.steps).toEqual([]);
    expect(useApp.getState().journey.dismissed).toEqual([]);
  });

  it("writes every current announcement rev into `seen` on a first run", async () => {
    const { useApp } = await freshStore();
    const { coldStartSeen } = await import("../journey/journey");
    // Empty today, and the assertion is against the same source of truth so it
    // keeps holding when the first real announcement ships.
    expect(useApp.getState().journey.seen).toEqual(coldStartSeen());
  });
});

describe("a blob written before Phase 3 backfills from evidence", () => {
  it("claims nothing for a learner who has done nothing", async () => {
    prePhase3({ onboarded: true, profiles: [profile("p1")], activeProfileId: "p1" });
    const { useApp } = await freshStore();
    expect(useApp.getState().journey.steps).toEqual([]);
  });

  it("reads first-sign off a recorded camera attempt", async () => {
    prePhase3({
      onboarded: true,
      profiles: [profile("p1")],
      activeProfileId: "p1",
      metrics: { cameraAttempts: 3, lessonsCompleted: 0 },
    });
    const { useApp } = await freshStore();
    expect(useApp.getState().journey.steps).toEqual(["first-sign"]);
  });

  it("reads first-lesson off the completed-lessons counter, and backfills under it", async () => {
    prePhase3({
      onboarded: true,
      profiles: [profile("p1")],
      activeProfileId: "p1",
      metrics: { cameraAttempts: 0, lessonsCompleted: 2 },
    });
    const { useApp } = await freshStore();
    expect(useApp.getState().journey.steps).toEqual(["first-sign", "first-lesson"]);
  });

  it("reads first-review off a card that was rated more than once", async () => {
    prePhase3({
      onboarded: true,
      profiles: [profile("p1")],
      activeProfileId: "p1",
      srs: {
        p1: {
          "alpha-alif": {
            due: "2026-01-02T00:00:00.000Z",
            stability: 3,
            difficulty: 5,
            elapsed_days: 1,
            scheduled_days: 2,
            reps: 3,
            lapses: 0,
            state: 2,
          },
        },
      },
    });
    const { useApp } = await freshStore();
    expect(useApp.getState().journey.steps).toContain("first-review");
  });

  it("reads first-flag off an existing flag", async () => {
    prePhase3({
      onboarded: true,
      profiles: [profile("p1")],
      activeProfileId: "p1",
      flags: [
        {
          id: "f1",
          raisedByProfileId: "p1",
          supporters: [],
          signId: "alpha-alif",
          active: true,
          archived: false,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    const { useApp } = await freshStore();
    expect(useApp.getState().journey.steps).toContain("first-flag");
  });

  it("never backfills install — it is observed at boot, not inferred", async () => {
    prePhase3({
      onboarded: true,
      profiles: [profile("p1")],
      activeProfileId: "p1",
      metrics: { cameraAttempts: 9, lessonsCompleted: 9 },
      flags: [
        {
          id: "f1",
          raisedByProfileId: "p1",
          supporters: [],
          signId: "alpha-alif",
          active: true,
          archived: false,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    const { useApp } = await freshStore();
    expect(useApp.getState().journey.steps).not.toContain("install");
  });

  it("leaves `seen` empty for an existing learner, so a new feature can still reach them", async () => {
    prePhase3({
      onboarded: true,
      profiles: [profile("p1")],
      activeProfileId: "p1",
      metrics: { cameraAttempts: 1 },
    });
    const { useApp } = await freshStore();
    expect(useApp.getState().journey.seen).toEqual({});
  });
});

describe("a stored journey survives a round trip, and a hand-edited one is cleaned", () => {
  it("keeps valid values", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          onboarded: true,
          profiles: [profile("p1")],
          activeProfileId: "p1",
          journey: { steps: ["first-sign"], seen: { "hint-x": 2 }, dismissed: ["install"] },
        },
        version: 1,
      }),
    );
    const { useApp } = await freshStore();
    expect(useApp.getState().journey).toEqual({
      steps: ["first-sign"],
      seen: { "hint-x": 2 },
      dismissed: ["install"],
    });
  });

  it("drops non-strings, duplicates and non-finite revs rather than trusting them", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          onboarded: true,
          profiles: [profile("p1")],
          activeProfileId: "p1",
          journey: {
            steps: ["first-sign", "first-sign", 7, null],
            seen: { good: 1, bad: "2", worse: null },
            dismissed: "install",
          },
        },
        version: 1,
      }),
    );
    const { useApp } = await freshStore();
    expect(useApp.getState().journey).toEqual({
      steps: ["first-sign"],
      seen: { good: 1 },
      dismissed: [],
    });
  });
});

describe("steps are detected from what the learner actually did", () => {
  it("banks first-sign on the first camera drill", async () => {
    const { useApp } = await freshStore();
    const id = useApp.getState().createProfile({
      displayName: "Amal",
      role: "parent",
      dominantHand: "R",
      language: "en",
      dailyGoal: "regular",
    });
    useApp.getState().switchProfile(id);
    expect(useApp.getState().journey.steps).toEqual([]);
    useApp.getState().recordDrillResult("alpha-alif", "good", { camera: true, matched: true });
    expect(useApp.getState().journey.steps).toEqual(["first-sign"]);
  });

  it("does not bank first-sign for a watch drill — nothing was graded", async () => {
    const { useApp } = await freshStore();
    const id = useApp.getState().createProfile({
      displayName: "Amal",
      role: "parent",
      dominantHand: "R",
      language: "en",
      dailyGoal: "regular",
    });
    useApp.getState().switchProfile(id);
    useApp.getState().recordDrillResult("alpha-alif", "good", { watch: true });
    expect(useApp.getState().journey.steps).toEqual([]);
  });

  it("banks first-lesson, and first-sign under it", async () => {
    const { useApp } = await freshStore();
    useApp.getState().recordLessonComplete();
    expect(useApp.getState().journey.steps).toEqual(["first-sign", "first-lesson"]);
  });

  it("banks first-flag when a flag is raised", async () => {
    const { useApp } = await freshStore();
    const id = useApp.getState().createProfile({
      displayName: "Amal",
      role: "parent",
      dominantHand: "R",
      language: "en",
      dailyGoal: "regular",
    });
    useApp.getState().toggleFlag("a1-milk", id);
    expect(useApp.getState().journey.steps).toContain("first-flag");
  });

  it("banks first-unit once every lesson in a unit is finished", async () => {
    const { useApp } = await freshStore();
    const id = useApp.getState().createProfile({
      displayName: "Amal",
      role: "parent",
      dominantHand: "R",
      language: "en",
      dailyGoal: "regular",
    });
    useApp.getState().switchProfile(id);
    // Drive the FIRST unit to mastery 2 on every sign, through the real action.
    const unitId = LESSONS[0].unitId;
    const signIds = [...new Set(LESSONS.filter((l) => l.unitId === unitId).flatMap((l) => l.signIds))];
    for (const signId of signIds) {
      useApp.getState().recordDrillResult(signId, "good", { camera: true, matched: true });
    }
    expect(useApp.getState().journey.steps).toContain("first-unit");
  });
});

describe("dismiss and acknowledge", () => {
  it("puts a dismissible step aside", async () => {
    const { useApp } = await freshStore();
    useApp.getState().dismissStep("install");
    expect(useApp.getState().journey.dismissed).toEqual(["install"]);
  });

  it("refuses to dismiss a step that is not dismissible", async () => {
    const { useApp } = await freshStore();
    useApp.getState().dismissStep("first-lesson");
    expect(useApp.getState().journey.dismissed).toEqual([]);
  });

  it("records an acknowledged hint rev once", async () => {
    const { useApp } = await freshStore();
    const before = useApp.getState().journey;
    useApp.getState().ackHint("hint-family-board", 1);
    expect(useApp.getState().journey.seen["hint-family-board"]).toBe(1);
    // Re-acknowledging the same rev must not churn the object — the hint hook
    // runs this inside an effect that re-fires on every relevant render.
    const after = useApp.getState().journey;
    useApp.getState().ackHint("hint-family-board", 1);
    expect(useApp.getState().journey).toBe(after);
    expect(after).not.toBe(before);
  });
});
