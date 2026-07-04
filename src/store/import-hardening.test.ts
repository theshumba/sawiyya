// Step-6 hardening: the H8 import path must not let a hostile or hand-edited
// household file corrupt the store — action-name collisions, enum garbage,
// non-numeric metrics and __proto__ keys all have to die in the normalizer.
import { beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "sawiyya.app.v1";

beforeEach(() => {
  localStorage.clear();
});

describe("hostile import blobs die in the normalizer", () => {
  it("ignores top-level keys that collide with store actions", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          onboarded: true,
          profiles: [],
          activeProfileId: null,
          progress: {},
          srs: {},
          flags: [],
          metrics: {},
          // hostile: would previously overwrite the real actions and persist
          toggleFlag: 42,
          recordDrillResult: null,
          createProfile: "boom",
        },
        version: 1,
      }),
    );
    vi.resetModules();
    const app = await import("./app");
    const s = app.useApp.getState();
    expect(typeof s.toggleFlag).toBe("function");
    expect(typeof s.recordDrillResult).toBe("function");
    expect(typeof s.createProfile).toBe("function");
    expect(s.onboarded).toBe(true);
  });

  it("validates enum-ish profile fields instead of passing garbage through", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          onboarded: true,
          profiles: [
            {
              id: "p1",
              displayName: "X",
              role: "boss",
              language: "xx",
              dailyGoal: "hax",
              dominantHand: "Q",
            },
          ],
          activeProfileId: "p1",
          progress: {},
          srs: {},
          flags: [],
          metrics: {},
        },
        version: 1,
      }),
    );
    vi.resetModules();
    const app = await import("./app");
    const p = app.useApp.getState().profiles[0];
    expect(p.role).toBe("parent");
    expect(p.language).toBe("en"); // t(key, "xx") would blank every label
    expect(p.dailyGoal).toBe("regular"); // GOAL_XP["hax"] would NaN the ring
    expect(p.dominantHand).toBe("R");
  });

  it("coerces metrics field-by-field — strings/objects can't corrupt counters", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          onboarded: true,
          profiles: [],
          activeProfileId: null,
          progress: {},
          srs: {},
          flags: [],
          metrics: { drillsCompleted: "12", cameraAttempts: { pwn: true }, selfMarks: 3 },
        },
        version: 1,
      }),
    );
    vi.resetModules();
    const app = await import("./app");
    const m = app.useApp.getState().metrics;
    expect(m.drillsCompleted).toBe(0); // "12" + 1 would concat to "121"
    expect(m.cameraAttempts).toBe(0);
    expect(m.selfMarks).toBe(3); // real numbers survive
  });

  it("drops __proto__ keys in the nested maps (raw-JSON own-property attack)", async () => {
    // Built as a raw string: a JS object literal can't carry an OWN __proto__ key.
    localStorage.setItem(
      KEY,
      '{"state":{"onboarded":true,"profiles":[],"activeProfileId":null,' +
        '"progress":{"__proto__":{"milk":{"masteryLevel":3}}},' +
        '"srs":{"__proto__":{"milk":{"due":"2026-01-01"}}},' +
        '"flags":[],"metrics":{}},"version":1}',
    );
    vi.resetModules();
    const app = await import("./app");
    const s = app.useApp.getState();
    expect("milk" in s.progress).toBe(false); // nothing inherited
    expect(Object.getPrototypeOf(s.progress)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(s.srs)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).milk).toBeUndefined(); // no global pollution
  });
});
