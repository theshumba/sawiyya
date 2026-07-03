// Persistence safety net (H13, M21) — localStorage is the database, so an
// old-shape or corrupt blob must boot clean, never NaN the UI or silently
// wipe progress. Each test re-imports a fresh store module against a staged
// localStorage.
import { beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "sawiyya.app.v1";
const BACKUP = "sawiyya.app.v1.corrupt";
const NOTICE = "sawiyya.app.recovery-notice";

async function freshStore() {
  vi.resetModules();
  return import("./app");
}

beforeEach(() => {
  localStorage.clear();
});

describe("persist versioning + rehydrate normalizer (H13)", () => {
  it("boots clean from an old v0 blob with missing profile/metrics keys", async () => {
    // A realistic stale blob: written before xpToday/activeDays/metrics
    // keys existed, and before `version` was set (zustand default 0).
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          onboarded: true,
          householdName: "Bayt Amal",
          profiles: [
            {
              id: "p-old-1",
              displayName: "Amal",
              role: "parent",
              emoji: "🦊",
              dominantHand: "R",
              language: "ar",
              xp: 120,
              streak: 4,
              lastActiveDay: "2026-06-01",
              dailyGoal: "regular",
              createdAt: "2026-05-01T09:00:00.000Z",
              // missing: xpToday, activeDays
            },
          ],
          activeProfileId: "p-old-1",
          progress: { "p-old-1": { iloveyou: { masteryLevel: 3, lastSeen: "2026-06-01" } } },
          srs: {},
          flags: [],
          // missing: metrics entirely
        },
        version: 0,
      }),
    );

    const { useApp, activeProfile, xpTodayFor, householdStreak } = await freshStore();
    const s = useApp.getState();

    expect(s.onboarded).toBe(true);
    // (householdName was dead state — deleted in Batch 5 / L7; old blobs still
    // carrying it are simply ignored.)
    const p = activeProfile(s);
    expect(p).not.toBeNull();
    expect(p!.displayName).toBe("Amal");
    expect(p!.xp).toBe(120); // real data survives
    expect(p!.xpToday).toBe(0); // missing key backfilled
    expect(p!.reviewsToday).toBe(0); // missing key backfilled (H3 cap counter)
    expect(p!.activeDays).toEqual([]); // missing key backfilled
    expect(s.metrics.drillsCompleted).toBe(0); // whole missing object backfilled
    expect(s.progress["p-old-1"].iloveyou.masteryLevel).toBe(3);

    // the NaN blast-radius paths stay finite
    expect(Number.isFinite(xpTodayFor(p!))).toBe(true);
    expect(Number.isFinite(householdStreak(s))).toBe(true);

    // no wipe, no false alarm
    expect(localStorage.getItem(BACKUP)).toBeNull();
    expect(localStorage.getItem(NOTICE)).toBeNull();
  });

  it("drops a dangling activeProfileId instead of pointing at a ghost", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ state: { onboarded: true, profiles: [], activeProfileId: "p-gone" }, version: 0 }),
    );
    const { useApp } = await freshStore();
    expect(useApp.getState().activeProfileId).toBeNull();
  });
});

describe("corrupt-blob backup (M21)", () => {
  it("backs up the raw blob + flags a notice instead of silently wiping", async () => {
    localStorage.setItem(KEY, '{"state": {"onboarded": tru'); // truncated JSON
    const { useApp, CORRUPT_BACKUP_KEY, RECOVERY_NOTICE_KEY } = await freshStore();

    // the damaged data is preserved, not destroyed
    expect(localStorage.getItem(CORRUPT_BACKUP_KEY)).toBe('{"state": {"onboarded": tru');
    // the app can tell the user honestly
    expect(localStorage.getItem(RECOVERY_NOTICE_KEY)).toBe("1");
    // and it still boots to a clean default state
    const s = useApp.getState();
    expect(s.onboarded).toBe(false);
    expect(s.profiles).toEqual([]);
  });
});

describe("streakFor read-time selector (M26)", () => {
  const baseProfile = {
    id: "p-1",
    displayName: "Amal",
    role: "parent",
    emoji: "🦊",
    dominantHand: "R",
    language: "en",
    xp: 100,
    xpToday: 10,
    streak: 6,
    lastActiveDay: null as string | null,
    activeDays: [] as string[],
    dailyGoal: "regular",
    createdAt: "2026-06-01T09:00:00.000Z",
  };

  it("keeps a streak alive when last active today", async () => {
    const { streakFor, todayKey } = await freshStore();
    const p = { ...baseProfile, lastActiveDay: todayKey() };
    expect(streakFor(p as never)).toBe(6);
  });

  it("keeps a streak alive when last active yesterday (today not done yet)", async () => {
    const { streakFor, todayKey } = await freshStore();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const p = { ...baseProfile, lastActiveDay: todayKey(y) };
    expect(streakFor(p as never)).toBe(6);
  });

  it("shows 0 — not the stale stored streak — after a lapse", async () => {
    const { streakFor, todayKey } = await freshStore();
    const old = new Date();
    old.setDate(old.getDate() - 5);
    const p = { ...baseProfile, lastActiveDay: todayKey(old) };
    expect(streakFor(p as never)).toBe(0);
  });

  it("shows 0 for a brand-new profile that never drilled", async () => {
    const { streakFor } = await freshStore();
    expect(streakFor({ ...baseProfile, streak: 0 } as never)).toBe(0);
  });
});

describe("own-recording match metric (M2)", () => {
  async function withProfile() {
    const app = await freshStore();
    const g = app.useApp.getState();
    const id = g.createProfile({
      displayName: "Lea",
      role: "parent",
      dominantHand: "R",
      language: "en",
      dailyGoal: "regular",
    });
    g.completeOnboarding();
    g.switchProfile(id);
    return app;
  }

  it("counts a KNN-only pass separately, without inflating or hiding real camera matches", async () => {
    const app = await withProfile();
    const G = () => app.useApp.getState();

    // A normal, model-confirmed camera match: a real match, NOT an own-recording one.
    G().recordDrillResult("alpha-alif", "good", { camera: true, matched: true });
    expect(G().metrics.cameraMatches).toBe(1);
    expect(G().metrics.ownRecordingMatches).toBe(0);

    // A match carried purely by the learner's own recording: still an honest match
    // (cameraMatches counts it) but tracked separately so the pitch metric is truthful.
    G().recordDrillResult("alpha-ba", "good", { camera: true, matched: true, ownRecording: true });
    expect(G().metrics.cameraMatches).toBe(2);
    expect(G().metrics.ownRecordingMatches).toBe(1);

    // ownRecording only ever counts alongside a real matched camera pass.
    G().recordDrillResult("alpha-ta", "hard", { camera: true, matched: false, selfMark: true });
    expect(G().metrics.ownRecordingMatches).toBe(1);
  });
});
