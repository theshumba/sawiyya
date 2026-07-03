// Family Mode store semantics (M11 — the Batch 5 verification gate, store half):
//   · flagging seeds every NON-RAISER profile's SRS queue (H4)
//   · ownership: raiser/deaf-role deactivate; others co-request; clear-all is
//     scoped to the caller's own raised flags (H7)
//   · deaf-role exclusions: shared board + household streak; flagging counts
//     as the raiser's active day (H6)
//   · auto-archive when every non-raiser hearing member reaches mastery ≥ 2 (M8)
//   · household export/import envelope round-trips (H8)
//   · old persisted flags (no supporters/archived) normalize cleanly (H13)
import { beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "sawiyya.app.v1";

async function fresh() {
  vi.resetModules();
  const app = await import("./app");
  const household = await import("./household");
  const g = app.useApp.getState();
  const deafId = g.createProfile({
    displayName: "Noor",
    role: "deaf",
    dominantHand: "R",
    language: "ar",
    dailyGoal: "regular",
  });
  const amalId = g.createProfile({
    displayName: "Amal",
    role: "parent",
    dominantHand: "R",
    language: "en",
    dailyGoal: "regular",
  });
  const samiId = g.createProfile({
    displayName: "Sami",
    role: "sibling",
    dominantHand: "R",
    language: "en",
    dailyGoal: "regular",
  });
  g.completeOnboarding();
  return { ...app, ...household, deafId, amalId, samiId };
}

beforeEach(() => {
  localStorage.clear();
});

describe("flag seeding (H4)", () => {
  it("seeds a due-now card into every non-raiser profile's queue — not the raiser's", async () => {
    const S = await fresh();
    S.useApp.getState().toggleFlag("milk", S.deafId);
    const s = S.useApp.getState();
    expect(s.srs[S.amalId]?.milk).toBeDefined();
    expect(s.srs[S.samiId]?.milk).toBeDefined();
    expect(s.srs[S.deafId]?.milk).toBeUndefined(); // the assigner isn't queued
    // the seeded cards are due immediately — the queue actually follows
    expect(S.dueSignIds(s, S.amalId)).toContain("milk");
  });

  it("never overwrites an existing card (scheduling history survives)", async () => {
    const S = await fresh();
    S.useApp.getState().switchProfile(S.amalId);
    S.useApp.getState().recordDrillResult("milk", "good", { camera: true, matched: true });
    const before = S.useApp.getState().srs[S.amalId].milk;
    S.useApp.getState().toggleFlag("milk", S.deafId);
    expect(S.useApp.getState().srs[S.amalId].milk).toEqual(before);
  });
});

describe("flag ownership (H7)", () => {
  it("a non-raiser hearing tap co-requests — it never toggles off", async () => {
    const S = await fresh();
    S.useApp.getState().toggleFlag("milk", S.deafId);
    S.useApp.getState().toggleFlag("milk", S.amalId); // Amal taps the existing flag
    let f = S.useApp.getState().flags.find((x) => x.signId === "milk")!;
    expect(f.active).toBe(true); // NOT deactivated
    expect(f.supporters).toEqual([S.amalId]);
    S.useApp.getState().toggleFlag("milk", S.amalId); // tapping again is idempotent
    f = S.useApp.getState().flags.find((x) => x.signId === "milk")!;
    expect(f.supporters).toEqual([S.amalId]);
  });

  it("the raiser and any deaf-role member can deactivate", async () => {
    const S = await fresh();
    S.useApp.getState().toggleFlag("milk", S.amalId); // a hearing member raised it
    S.useApp.getState().toggleFlag("milk", S.deafId); // deaf member curates it away
    expect(S.activeFlags(S.useApp.getState())).toHaveLength(0);

    S.useApp.getState().toggleFlag("hello", S.deafId);
    S.useApp.getState().toggleFlag("hello", S.deafId); // raiser un-flags their own
    expect(S.activeFlags(S.useApp.getState())).toHaveLength(0);
  });

  it("clearFlags clears only the caller's own raised flags", async () => {
    const S = await fresh();
    S.useApp.getState().toggleFlag("milk", S.deafId);
    S.useApp.getState().toggleFlag("hello", S.amalId);
    S.useApp.getState().clearFlags(S.amalId);
    const live = S.activeFlags(S.useApp.getState());
    expect(live).toHaveLength(1);
    expect(live[0].signId).toBe("milk"); // the Deaf member's curriculum survives
  });
});

describe("deaf-role exclusions (H6)", () => {
  it("the shared board intersects hearing members only", async () => {
    const S = await fresh();
    const master = (pid: string) => {
      S.useApp.setState((s) => ({
        progress: {
          ...s.progress,
          [pid]: { hello: { masteryLevel: 3, lastSeen: "2026-07-01" } },
        },
      }));
    };
    master(S.amalId);
    master(S.samiId);
    // Noor (deaf) has zero progress — the board must still light up.
    expect(S.signsAllCanDo(S.useApp.getState())).toEqual(["hello"]);
  });

  it("household streak ignores the deaf member's day-set", async () => {
    const S = await fresh();
    const today = S.todayKey();
    S.useApp.setState((s) => ({
      profiles: s.profiles.map((p) =>
        p.role === "deaf" ? p : { ...p, activeDays: [today], lastActiveDay: today },
      ),
    }));
    expect(S.householdStreak(S.useApp.getState())).toBe(1);
  });

  it("flagging counts as the DEAF raiser's active day (streak, day-set) without XP", async () => {
    const S = await fresh();
    S.useApp.getState().toggleFlag("milk", S.deafId);
    const noor = S.useApp.getState().profiles.find((p) => p.id === S.deafId)!;
    expect(noor.lastActiveDay).toBe(S.todayKey());
    expect(noor.activeDays).toContain(S.todayKey());
    expect(S.streakFor(noor)).toBe(1);
    expect(noor.xp).toBe(0); // participation, not points
  });

  it("a HEARING raiser gets no active-day credit from flagging (no streak farming)", async () => {
    const S = await fresh();
    S.useApp.getState().toggleFlag("hello", S.amalId);
    const amal = S.useApp.getState().profiles.find((p) => p.id === S.amalId)!;
    expect(amal.lastActiveDay).toBeNull();
    expect(amal.activeDays).toHaveLength(0);
    expect(S.streakFor(amal)).toBe(0); // hearing members earn days by practising
  });
});

describe("flag auto-archive (M8)", () => {
  it("archives when EVERY non-raiser hearing member reaches mastery ≥ 2", async () => {
    const S = await fresh();
    S.useApp.getState().toggleFlag("milk", S.deafId);

    S.useApp.getState().switchProfile(S.amalId);
    S.useApp.getState().recordDrillResult("milk", "good", { camera: true, matched: true });
    // Sami hasn't learned it yet — still live.
    expect(S.activeFlags(S.useApp.getState())).toHaveLength(1);

    S.useApp.getState().switchProfile(S.samiId);
    S.useApp.getState().recordDrillResult("milk", "good", { camera: true, matched: true });
    const f = S.useApp.getState().flags.find((x) => x.signId === "milk")!;
    expect(f.archived).toBe(true); // kept in state as history…
    expect(S.activeFlags(S.useApp.getState())).toHaveLength(0); // …out of the queues
    expect(S.pinnedFlagSigns(S.useApp.getState(), S.amalId)).toHaveLength(0);
    // …and the sign CELEBRATES INTO the honeycomb (pinned M8) even though a
    // non-gradable sign's mastery caps at 2 — never a silent vanish.
    expect(S.signsAllCanDo(S.useApp.getState())).toContain("milk");
  });

  it("never archives while the raiser is the only household member", async () => {
    vi.resetModules();
    const app = await import("./app");
    const g = app.useApp.getState();
    const solo = g.createProfile({
      displayName: "Solo",
      role: "deaf",
      dominantHand: "R",
      language: "en",
      dailyGoal: "regular",
    });
    g.toggleFlag("milk", solo);
    app.useApp.getState().recordDrillResult("milk", "good", { camera: true, matched: true });
    expect(app.useApp.getState().flags.find((f) => f.signId === "milk")!.archived).toBe(false);
  });
});

describe("household export/import (H8)", () => {
  it("round-trips the persisted household through the envelope", async () => {
    const S = await fresh();
    S.useApp.getState().toggleFlag("milk", S.deafId);
    const json = S.buildHouseholdExport("test-build");
    expect(json).not.toBeNull();
    const doc = JSON.parse(json!);
    expect(doc.schema).toBe("sawiyya.household.v1");
    expect(doc.exportedAt).toBeTruthy();
    expect(doc.appVersion).toBe("test-build");

    const parsed = S.parseHouseholdImport(json!);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    localStorage.clear();
    S.applyHouseholdImport(parsed.state);
    const raw = JSON.parse(localStorage.getItem(KEY)!);
    expect(raw.version).toBe(1);
    expect(raw.state.profiles).toHaveLength(3);
    expect(raw.state.flags).toHaveLength(1);
  });

  it("rejects garbage, wrong schema, and non-object state", async () => {
    const S = await fresh();
    expect(S.parseHouseholdImport("not json").ok).toBe(false);
    expect(S.parseHouseholdImport(JSON.stringify({ schema: "other", state: {} })).ok).toBe(false);
    expect(
      S.parseHouseholdImport(JSON.stringify({ schema: "sawiyya.household.v1", state: [] })).ok,
    ).toBe(false);
  });
});

describe("malformed import survives rehydrate (H8 + H13)", () => {
  it("drops null/garbage nested srs+progress entries instead of crashing isDue at boot", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          onboarded: true,
          profiles: [],
          activeProfileId: null,
          // a hand-edited export: valid JSON + schema, hostile nested shapes
          progress: { "p-x": { hello: null, milk: { masteryLevel: "nine" } }, bad: 7 },
          srs: { "p-x": { "alpha-alif": null, hello: { due: 42 }, milk: "oops" } },
          flags: [],
          metrics: {},
        },
        version: 1,
      }),
    );
    vi.resetModules();
    const app = await import("./app");
    const s = app.useApp.getState();
    expect(s.srs["p-x"]["alpha-alif"]).toBeUndefined(); // null card dropped
    expect(s.srs["p-x"].milk).toBeUndefined(); // string card dropped
    expect(typeof s.srs["p-x"].hello.due).toBe("string"); // bad due coerced
    expect(s.progress["p-x"].hello).toBeUndefined();
    expect(s.progress["p-x"].milk.masteryLevel).toBe(0); // NaN mastery coerced
    // the Home render path must not throw on this blob
    expect(() => app.dueSignIds(s, "p-x")).not.toThrow();
  });
});

describe("legacy flag normalization (H13)", () => {
  it("backfills supporters/archived on flags written before Batch 5", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          onboarded: true,
          profiles: [],
          activeProfileId: null,
          progress: {},
          srs: {},
          flags: [
            {
              id: "flag-old-1",
              raisedByProfileId: "p-old",
              signId: "milk",
              active: true,
              createdAt: "2026-06-20T10:00:00.000Z",
              // missing: supporters, archived
            },
          ],
          metrics: {},
        },
        version: 1,
      }),
    );
    vi.resetModules();
    const app = await import("./app");
    const f = app.useApp.getState().flags[0];
    expect(f.supporters).toEqual([]);
    expect(f.archived).toBe(false);
    expect(f.active).toBe(true);
    expect(app.activeFlags(app.useApp.getState())).toHaveLength(1);
  });
});
