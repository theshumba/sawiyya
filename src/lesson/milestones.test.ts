// Step-6 hardening: the milestone ladder must stay reachable for every
// onboarding persona and must not count what the spec excludes.
import { describe, expect, it } from "vitest";
import { nextMilestone } from "./milestones";
import { ALPHABET } from "../content/signs";
import type { AppState } from "../store/app";

const SEEDED = ALPHABET.filter((l) => l.cameraGradable); // the 28
const EDGE = ALPHABET.filter((l) => !l.cameraGradable); // ة / لا / ال

function fakeState(opts: {
  roles: ("deaf" | "parent")[];
  masteredIds: string[];
}): { s: AppState; pid: string } {
  const profiles = opts.roles.map((role, i) => ({
    id: `p${i}`,
    displayName: `P${i}`,
    role,
    emoji: "🦊",
    dominantHand: "R" as const,
    language: "en" as const,
    xp: 0,
    xpToday: 0,
    reviewsToday: 0,
    streak: 0,
    lastActiveDay: null,
    activeDays: [],
    dailyGoal: "regular" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
  }));
  const prog: Record<string, { masteryLevel: number; lastSeen: string; cameraHits: number }> = {};
  for (const id of opts.masteredIds) {
    prog[id] = { masteryLevel: 3, lastSeen: "2026-01-01T00:00:00.000Z", cameraHits: 2 };
  }
  const s = {
    onboarded: true,
    profiles,
    activeProfileId: "p0",
    progress: { p0: prog },
    srs: {},
    flags: [],
    metrics: {},
  } as unknown as AppState;
  return { s, pid: "p0" };
}

describe("milestone ladder (Step-6 fleet findings)", () => {
  it("zero-hearing household skips the family rungs instead of wedging forever", () => {
    // "I'm Deaf — setting up my family" solo persona: signsAllCanDo() is
    // hearing-only, so the family rungs would sit at 0% permanently.
    const { s, pid } = fakeState({
      roles: ["deaf"],
      masteredIds: SEEDED.slice(0, 15).map((l) => l.id),
    });
    const ms = nextMilestone(s, pid, "en");
    expect(ms).not.toBeNull();
    expect(ms!.label).not.toMatch(/family/i);
    expect(ms!.label).toMatch(/alphabet/i); // the reachable rung surfaces
    expect(ms!.progress).toBeCloseTo(15 / 28);
  });

  it("hearing households keep the family rungs", () => {
    const { s, pid } = fakeState({
      roles: ["deaf", "parent"],
      masteredIds: SEEDED.slice(0, 15).map((l) => l.id),
    });
    const ms = nextMilestone(s, pid, "en");
    expect(ms!.label).toMatch(/family/i);
  });

  it("'whole alphabet mastered' counts only the 28 seeded letters — edge forms don't substitute", () => {
    // 25 seeded + all 3 edge forms at mastery 3 = 28 total, but the milestone
    // must NOT fire: three real letters are still unlearned.
    const { s, pid } = fakeState({
      roles: ["deaf"],
      masteredIds: [
        ...SEEDED.slice(0, 25).map((l) => l.id),
        ...EDGE.map((l) => l.id),
      ],
    });
    const ms = nextMilestone(s, pid, "en");
    expect(ms!.label).toMatch(/alphabet/i);
    expect(ms!.progress).toBeCloseTo(25 / 28); // not 28/28
  });
});
