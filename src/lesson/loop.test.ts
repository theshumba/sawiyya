// Batch 4 verification gate (audit §"Prioritised execution plan") — the core
// loop proven by deterministic multi-day simulation against the REAL store +
// engine + ts-fsrs scheduler (mocked clock only):
//   · every lesson is completable through the LessonPlayer queue (H1)
//   · a failed letter reschedules sooner than a passed one (H2)
//   · watch drills never rate the card (M3)
//   · mastery 3 is hard-gated — self-marks/quizzes can't farm it (M4)
//   · a 7-day-lapse learner drains 28 due cards in ≤ 3 review sessions,
//     and the daily soft cap of 30 refuses a 4th session (H3)
//   · an on-pace learner is offered new letters instead of starving (M5)
//   · a 14-day learner converges on the alphabet (the sim gate)
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALPHABET, LESSONS } from "../content/signs";
import type { DrillSpec } from "../types";

const T0 = new Date("2026-07-06T10:00:00");
const DAY = 86_400_000;

const SEEDED_LETTERS = ALPHABET.filter((l) => l.cameraGradable); // 28 (edge forms excluded)

async function fresh() {
  vi.resetModules();
  const app = await import("../store/app");
  const engine = await import("./engine");
  const milestones = await import("./milestones");
  // The bundled seeds are dynamic-imported (M13); the app pulls them in on
  // camera-screen mount. The simulation grades against the real engine, so load
  // them the same way — otherwise isTrained() reads empty and letters that should
  // grade on camera fall back to recall.
  const seedStore = await import("../recognizer/seedStore");
  await seedStore.ensureSeeds();
  const pid = app.useApp.getState().createProfile({
    displayName: "Sim",
    role: "parent",
    dominantHand: "R",
    language: "en",
    dailyGoal: "regular",
  });
  app.useApp.getState().completeOnboarding();
  return { ...app, ...engine, ...milestones, pid };
}
type Sim = Awaited<ReturnType<typeof fresh>>;

const atDay = (n: number, hour = 10) =>
  vi.setSystemTime(new Date(T0.getTime() + n * DAY + (hour - 10) * 3_600_000));

/** Complete one drill the way the real screens record it (always-correct learner). */
function doDrill(S: Sim, d: DrillSpec) {
  const rec = S.useApp.getState().recordDrillResult;
  if (d.type === "watch") rec(d.signId, "good", { watch: true });
  else if (d.type === "camera") rec(d.signId, "good", { camera: true, matched: true });
  else rec(d.signId, "good");
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("rating semantics (M3, H2, M4)", () => {
  it("watch drills never rate the card and never pass mastery 1 (M3)", async () => {
    const S = await fresh();
    for (let i = 0; i < 5; i++)
      S.useApp.getState().recordDrillResult("hello", "good", { watch: true });
    const s = S.useApp.getState();
    expect(s.srs[S.pid]?.hello).toBeUndefined(); // no SRS card from watching
    expect(s.progress[S.pid]?.hello?.masteryLevel).toBe(1); // seen, never more
  });

  it("a failed letter reschedules sooner than a passed one (H2)", async () => {
    const S = await fresh();
    S.useApp.getState().recordDrillResult("alpha-ba", "again", { camera: true, matched: false });
    S.useApp.getState().recordDrillResult("alpha-ta", "good", { camera: true, matched: true });
    const srs = S.useApp.getState().srs[S.pid];
    expect(new Date(srs["alpha-ba"].due).getTime()).toBeLessThan(
      new Date(srs["alpha-ta"].due).getTime(),
    );
  });

  it("self-marks alone never reach mastery 3, even over many days (M4)", async () => {
    const S = await fresh();
    for (let d = 0; d < 10; d++) {
      atDay(d);
      S.useApp
        .getState()
        .recordDrillResult("alpha-alif", "hard", { camera: true, matched: false, selfMark: true });
    }
    expect(S.useApp.getState().progress[S.pid]["alpha-alif"].masteryLevel).toBeLessThanOrEqual(2);
  });

  it("quiz-only successes never reach mastery 3 — camera confirmation is required (M4)", async () => {
    const S = await fresh();
    for (let d = 0; d < 10; d++) {
      atDay(d);
      S.useApp.getState().recordDrillResult("hello", "good");
    }
    expect(S.useApp.getState().progress[S.pid].hello.masteryLevel).toBeLessThanOrEqual(2);
  });

  it("camera-confirmed successes across days DO master (M4 honest path)", async () => {
    const S = await fresh();
    for (let d = 0; d < 6; d++) {
      atDay(d);
      S.useApp.getState().recordDrillResult("alpha-alif", "good", { camera: true, matched: true });
    }
    const p = S.useApp.getState().progress[S.pid]["alpha-alif"];
    expect(p.masteryLevel).toBe(3);
    expect(p.cameraHits).toBeGreaterThanOrEqual(2);
  });

  it("the word-unit milestone counts only A1 signs; the alphabet row gates first (M4/H22)", async () => {
    const S = await fresh();
    // Master 16 alphabet letters — the reachable whole-alphabet row gates next.
    const prog: Record<string, { masteryLevel: number; lastSeen: string }> = {};
    for (const l of SEEDED_LETTERS.slice(0, 16))
      prog[l.id] = { masteryLevel: 3, lastSeen: T0.toISOString() };
    S.useApp.setState((s) => ({ progress: { ...s.progress, [S.pid]: prog } }));
    let ms = S.nextMilestone(S.useApp.getState(), S.pid, "en");
    expect(ms).not.toBeNull();
    expect(ms!.label).toMatch(/Whole alphabet/);
    expect(ms!.progress).toBeCloseTo(16 / 28);

    // Master all 28 — the word-unit row is next, and letters count ZERO toward it.
    for (const l of SEEDED_LETTERS)
      prog[l.id] = { masteryLevel: 3, lastSeen: T0.toISOString() };
    S.useApp.setState((s) => ({ progress: { ...s.progress, [S.pid]: { ...prog } } }));
    ms = S.nextMilestone(S.useApp.getState(), S.pid, "en");
    expect(ms).not.toBeNull();
    expect(ms!.label).toMatch(/word unit/);
    expect(ms!.progress).toBe(0); // zero A1 signs mastered — not 16/16
  });
});

describe("review sessions (H3)", () => {
  it("sessions are capped at 10 cards, oldest-due first, mixed drill types", async () => {
    const S = await fresh();
    // Stagger card creation so due times are distinct and ordered.
    const ids = [
      ...SEEDED_LETTERS.slice(0, 6).map((l) => l.id),
      "hello",
      "mum",
      "dad",
      "sleep",
      "careful",
      "name",
    ];
    ids.forEach((id, i) => {
      vi.setSystemTime(new Date(T0.getTime() + i * 60_000));
      S.useApp.getState().addToReview(id);
    });
    atDay(1);
    const q = S.buildDrillQueue("review", S.useApp.getState(), S.pid);
    expect(q.length).toBe(10);
    expect(q.map((d) => d.signId)).toEqual(ids.slice(0, 10)); // oldest due first
    // letters grade on camera; visual-less words drill as RECALL — they have no
    // honest stimulus to recognise until signer footage lands (H23)
    for (const d of q) {
      const isLetter = d.signId.startsWith("alpha-");
      if (isLetter) expect(d.type).toBe("camera");
      else expect(d.type).toBe("recall");
    }
    expect(q.some((d) => d.type === "recall")).toBe(true);
  });

  it("a 7-day-lapse learner drains 28 due letters in ≤ 3 sessions", async () => {
    const S = await fresh();
    const get = () => S.useApp.getState();
    // Learn all 28 letters (day 0), review them once (day 1) so they graduate.
    for (const l of SEEDED_LETTERS)
      get().recordDrillResult(l.id, "good", { camera: true, matched: true });
    atDay(1);
    for (const l of SEEDED_LETTERS)
      get().recordDrillResult(l.id, "good", { camera: true, matched: true });

    atDay(8); // the 7-day break
    expect(S.dueSignIds(get(), S.pid).length).toBe(28); // full flood

    let sessions = 0;
    while (S.dueSignIds(get(), S.pid).length > 0 && sessions < 5) {
      const q = S.buildDrillQueue("review", get(), S.pid);
      expect(q.length).toBeLessThanOrEqual(10);
      for (const d of q) doDrill(S, d);
      sessions++;
    }
    expect(sessions).toBeLessThanOrEqual(3);
    expect(S.dueSignIds(get(), S.pid).length).toBe(0);
    expect(S.reviewsTodayFor(get().profiles[0])).toBe(28); // under the 30 cap
  });

  it("the daily cap of 30 refuses a 4th session while cards remain due", async () => {
    const S = await fresh();
    const get = () => S.useApp.getState();
    // 40 due cards (28 letters + 12 words), all due now.
    const ids = [
      ...SEEDED_LETTERS.map((l) => l.id),
      ...["hello", "mum", "dad", "sleep", "careful", "name", "more", "finished", "hungry", "milk", "thankyou", "help"],
    ];
    for (const id of ids) get().addToReview(id);
    atDay(1);

    for (let i = 0; i < 3; i++) {
      const q = S.buildDrillQueue("review", get(), S.pid);
      expect(q.length).toBe(10);
      for (const d of q) doDrill(S, d);
    }
    expect(S.reviewsTodayFor(get().profiles[0])).toBe(30);
    expect(S.dueSignIds(get(), S.pid).length).toBeGreaterThan(0); // still due…
    expect(S.buildDrillQueue("review", get(), S.pid)).toEqual([]); // …but capped
    // Tomorrow the cap resets and the queue reopens.
    atDay(2);
    expect(S.buildDrillQueue("review", get(), S.pid).length).toBeGreaterThan(0);
  });
});

describe("lesson path (H1) + starvation (M5)", () => {
  it("every lesson is completable through the LessonPlayer queue", async () => {
    const S = await fresh();
    const get = () => S.useApp.getState();
    for (const lesson of LESSONS) {
      const complete = () =>
        lesson.signIds.every((id) => (get().progress[S.pid]?.[id]?.masteryLevel ?? 0) >= 2);
      let rounds = 0;
      while (!complete() && rounds < 6) {
        const q = S.buildDrillQueue(lesson.id, get(), S.pid);
        expect(q.length).toBeGreaterThan(0);
        for (const d of q) doDrill(S, d);
        rounds++;
      }
      expect(complete()).toBe(true); // the node unlocks — no more L1 deadlock
    }
  });

  it("offers the next unseen letter in curriculum order when nothing is due (M5)", async () => {
    const S = await fresh();
    const get = () => S.useApp.getState();
    expect(S.nextNewLetterId(get(), S.pid)).toBe("alpha-alif");
    get().recordDrillResult("alpha-alif", "good", { camera: true, matched: true });
    expect(S.nextNewLetterId(get(), S.pid)).toBe("alpha-ba");
    for (const l of SEEDED_LETTERS) get().addToReview(l.id);
    expect(S.nextNewLetterId(get(), S.pid)).toBeNull(); // all content met
  });

  it("reviewsTodayFor reads 0 on a fresh morning before the lazy reset (H3)", async () => {
    const S = await fresh();
    S.useApp.getState().addToReview("alpha-alif");
    atDay(0, 11);
    S.useApp.getState().recordDrillResult("alpha-alif", "good", { camera: true, matched: true });
    expect(S.reviewsTodayFor(S.useApp.getState().profiles[0])).toBe(1);
    atDay(1); // next morning, no drill yet — stored counter is stale, read is honest
    expect(S.reviewsTodayFor(S.useApp.getState().profiles[0])).toBe(0);
  });
});

describe("the 14-day simulation gate", () => {
  it("converges on the alphabet; never floods past the cap; never starves while content remains", async () => {
    const S = await fresh();
    const get = () => S.useApp.getState();
    // Day 0 — FirstSign: Alif, camera-confirmed.
    get().recordDrillResult("alpha-alif", "good", { camera: true, matched: true });

    for (let d = 1; d <= 14; d++) {
      atDay(d);
      // Morning: drain due reviews (≤ 3 sessions/day — the H3 spreader).
      let sessions = 0;
      while (sessions < 3) {
        const q = S.buildDrillQueue("review", get(), S.pid);
        if (q.length === 0) break;
        for (const drill of q) doDrill(S, drill);
        sessions++;
      }
      expect(S.reviewsTodayFor(get().profiles[0])).toBeLessThanOrEqual(30); // never floods

      // Afternoon: with a clear plate, learn up to 3 new letters (M5 injection).
      for (let k = 0; k < 3; k++) {
        if (S.dueSignIds(get(), S.pid).length > 0) break;
        const id = S.nextNewLetterId(get(), S.pid);
        if (!id) break;
        get().recordDrillResult(id, "good", { camera: true, matched: true });
      }

      // Starvation check: while letters remain unmet, the day always offers work.
      const carded = SEEDED_LETTERS.filter((l) => get().srs[S.pid]?.[l.id]).length;
      if (carded < SEEDED_LETTERS.length) {
        expect(
          S.dueSignIds(get(), S.pid).length > 0 || S.nextNewLetterId(get(), S.pid) !== null,
        ).toBe(true);
      }
    }

    const st = get();
    const carded = SEEDED_LETTERS.filter((l) => st.srs[S.pid]?.[l.id]).length;
    expect(carded).toBe(SEEDED_LETTERS.length); // met every seeded letter
    const mastered = SEEDED_LETTERS.filter(
      (l) => (st.progress[S.pid]?.[l.id]?.masteryLevel ?? 0) >= 3,
    ).length;
    expect(mastered).toBeGreaterThanOrEqual(20); // converged, not just met
  });
});
