// Batch 6 verification gate (audit §"Prioritised execution plan"):
//   · the 4 alphabet lessons cover exactly the 28 seeded letters ONCE, in the
//     pinned standard-Arabic order; edge forms never enter a lesson (H22)
//   · an alphabet lesson is completable through the REAL queue in two passes,
//     and its recognise checkpoints carry pools of MET letters only (H22)
//   · fingerspellSequence is honest — folds, ة reference, digits skipped (M6)
//   · ALL A1 words are watch-only — no word sign has a trained model, so
//     camera-grading one could only match the user's own recording (M7 +
//     2026-07-04 iloveyou/stop demotion)
//   · a sign with no real visual is never a recognise stimulus (H23)
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DrillSpec, Sign } from "../types";

// Content-only imports (no store) — safe at module scope.
import {
  A1_SIGNS,
  ALPHABET,
  LESSONS,
  UNITS,
  UNIT_ALPHA,
  fingerspellSequence,
  signById,
} from "../content/signs";

const SEEDED = ALPHABET.filter((l) => l.cameraGradable); // the 28
const ALPHA_LESSONS = LESSONS.filter((l) => l.unitId === "alpha-u1");
const EDGE_IDS = ["alpha-taMarbuta", "alpha-laa", "alpha-al"];

// ── store-backed harness (fresh module graph per test, like loop.test.ts) ────
async function fresh() {
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
type Sim = Awaited<ReturnType<typeof fresh>>;

function doDrill(S: Sim, d: DrillSpec) {
  const rec = S.useApp.getState().recordDrillResult;
  if (d.type === "watch") rec(d.signId, "good", { watch: true });
  else if (d.type === "camera") rec(d.signId, "good", { camera: true, matched: true });
  else rec(d.signId, "good");
}

const masteryOf = (S: Sim, id: string) =>
  S.useApp.getState().progress[S.pid]?.[id]?.masteryLevel ?? 0;

/** Run one full queue pass of a lesson; returns the queue that was played. */
function playPass(S: Sim, lessonId: string): DrillSpec[] {
  const q = S.buildDrillQueue(lessonId, S.useApp.getState(), S.pid);
  for (const d of q) doDrill(S, d);
  return q;
}

beforeEach(() => {
  localStorage.clear();
});

// ── curriculum shape (H22) ───────────────────────────────────────────────────
describe("alphabet curriculum shape (H22)", () => {
  it("4 lessons of 7 cover the 28 seeded letters exactly once, in pinned order", () => {
    expect(ALPHA_LESSONS.length).toBe(4);
    for (const l of ALPHA_LESSONS) expect(l.signIds.length).toBe(7);
    const flat = ALPHA_LESSONS.flatMap((l) => l.signIds);
    expect(flat).toEqual(SEEDED.map((s) => s.id)); // order AND coverage, no dupes
    for (const edge of EDGE_IDS) expect(flat).not.toContain(edge);
  });

  it("the alphabet unit leads the path and owns Unit 1", () => {
    expect(UNITS[0]).toBe(UNIT_ALPHA);
    expect(LESSONS.slice(0, 4).every((l) => l.unitId === "alpha-u1")).toBe(true);
    expect(LESSONS[0].id).toBe("alpha-u1-l1");
    // every lesson's unit exists
    for (const l of LESSONS) expect(UNITS.some((u) => u.id === l.unitId)).toBe(true);
  });
});

// ── alphabet lesson queue (H22) ──────────────────────────────────────────────
describe("alphabet lesson queue (H22)", () => {
  it("fresh pass: per-letter watch→camera under the cap; watches all survive", async () => {
    const S = await fresh();
    const lesson = ALPHA_LESSONS[0];
    const q = S.buildDrillQueue(lesson.id, S.useApp.getState(), S.pid);
    expect(q.length).toBeLessThanOrEqual(12);
    expect(q.filter((d) => d.type === "watch").length).toBe(7); // every letter taught
    // a camera drill never precedes its own watch on a fresh profile
    for (const [i, d] of q.entries()) {
      if (d.type !== "camera") continue;
      const w = q.findIndex((x) => x.type === "watch" && x.signId === d.signId);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThan(i);
    }
    // all drills stay inside the lesson on a fresh profile
    for (const d of q) expect(lesson.signIds).toContain(d.signId);
  });

  it("completes in two passes; checkpoints appear with met-only pools", async () => {
    const S = await fresh();
    const lesson = ALPHA_LESSONS[0];

    const pass1 = playPass(S, lesson.id);
    expect(pass1.some((d) => d.type === "recognise")).toBe(false); // trimmed by the cap
    expect(lesson.signIds.every((id) => masteryOf(S, id) >= 2)).toBe(false); // not done yet

    const pass2 = S.buildDrillQueue(lesson.id, S.useApp.getState(), S.pid);
    const checkpoints = pass2.filter((d) => d.type === "recognise");
    expect(checkpoints.length).toBe(3);
    for (const c of checkpoints) {
      expect(c.pool).toBeDefined();
      expect(c.pool!.length).toBeGreaterThanOrEqual(4); // room for 3 distractors
      expect(c.pool).toContain(c.signId); // the answer is always drawable
      expect(lesson.signIds).toContain(c.signId); // targets come from THIS lesson
      for (const id of c.pool!) {
        // pool ⊆ this lesson ∪ letters already met — never a stranger (H22)
        const met = masteryOf(S, id) >= 1;
        expect(lesson.signIds.includes(id) || met).toBe(true);
      }
    }
    for (const d of pass2) doDrill(S, d);
    expect(lesson.signIds.every((id) => masteryOf(S, id) >= 2)).toBe(true); // two passes
  });

  it("later lessons pool earlier met letters but never unmet strangers", async () => {
    const S = await fresh();
    playPass(S, "alpha-u1-l1");
    playPass(S, "alpha-u1-l1"); // l1 complete → its letters are met
    playPass(S, "alpha-u1-l2"); // l2 pass 1 (no checkpoints yet)

    const l2 = ALPHA_LESSONS[1];
    const pass2 = S.buildDrillQueue(l2.id, S.useApp.getState(), S.pid);
    const metOrLesson = new Set([...ALPHA_LESSONS[0].signIds, ...l2.signIds]);
    const strangers = [...ALPHA_LESSONS[2].signIds, ...ALPHA_LESSONS[3].signIds];
    for (const c of pass2.filter((d) => d.type === "recognise")) {
      for (const id of c.pool!) expect(metOrLesson.has(id)).toBe(true);
      for (const s of strangers) expect(c.pool).not.toContain(s);
    }
  });
});

// ── fingerspelling (M6) ──────────────────────────────────────────────────────
describe("fingerspellSequence (M6)", () => {
  it("سلام maps to seen→lam→alif→meem, all camera-gradable", () => {
    const steps = fingerspellSequence("سلام");
    expect(steps).toEqual([
      { kind: "letter", char: "س", signId: "alpha-seen" },
      { kind: "letter", char: "ل", signId: "alpha-lam" },
      { kind: "letter", char: "ا", signId: "alpha-alif" },
      { kind: "letter", char: "م", signId: "alpha-meem" },
    ]);
    for (const s of steps)
      expect(signById((s as { signId: string }).signId)?.cameraGradable).toBe(true);
  });

  it("folds hamza/final variants onto their base handshape", () => {
    const ids = fingerspellSequence("أإآٱؤئى").map((s) =>
      s.kind === "letter" ? s.signId : s.char,
    );
    expect(ids).toEqual([
      "alpha-alif", "alpha-alif", "alpha-alif", "alpha-alif",
      "alpha-waw",
      "alpha-ya", "alpha-ya",
    ]);
  });

  it("ة is a reference-only letter step — mapped, but not gradable", () => {
    const steps = fingerspellSequence("ة");
    expect(steps).toEqual([{ kind: "letter", char: "ة", signId: "alpha-taMarbuta" }]);
    expect(signById("alpha-taMarbuta")?.cameraGradable).toBe(false);
  });

  it("digits and Latin surface as honest skipped steps; diacritics vanish silently", () => {
    expect(fingerspellSequence("س3x")).toEqual([
      { kind: "letter", char: "س", signId: "alpha-seen" },
      { kind: "skipped", char: "3" },
      { kind: "skipped", char: "x" },
    ]);
    // Arabic-Indic digits are skipped too — not swallowed
    expect(fingerspellSequence("٣").some((s) => s.kind === "skipped")).toBe(true);
    // harakat, tatweel and spaces never produce a skipped note
    expect(fingerspellSequence("سَـلامٌ عليكم").every((s) => s.kind === "letter")).toBe(true);
    expect(fingerspellSequence("سَلام")).toEqual(fingerspellSequence("سلام"));
  });
});

// ── yes/no honesty (M7) ──────────────────────────────────────────────────────
describe("yes/no static-motion contradiction (M7)", () => {
  it("yes and no are dynamic + watch-only; no A1 word is camera-gradable", () => {
    for (const id of ["yes", "no"]) {
      const s = signById(id)!;
      expect(s.type).toBe("dynamic");
      expect(s.cameraGradable).toBe(false);
    }
    // The MLP knows the 28 letters only — a "gradable" word sign could only
    // teach-then-match the user's own recording, which is circular. Every A1
    // word stays watch + self-mark until real signer reference data lands.
    for (const s of A1_SIGNS) {
      expect(s.cameraGradable).toBe(false);
    }
  });
});

// ── H23 recognise gating ─────────────────────────────────────────────────────
describe("visual-gated recognise (H23)", () => {
  it("hasVisual: seeded letters yes, edge forms and today's A1 words no; media flips it", async () => {
    const S = await fresh();
    for (const l of SEEDED) expect(S.hasVisual(l)).toBe(true);
    for (const id of EDGE_IDS) expect(S.hasVisual(signById(id)!)).toBe(false);
    for (const s of A1_SIGNS) expect(S.hasVisual(s)).toBe(false); // no skeleton, no footage yet
    const filmed: Sign = { ...signById("hello")!, media: { type: "video", src: "signs/hello/demo.webm" } };
    expect(S.hasVisual(filmed)).toBe(true);
  });

  it("word lessons emit NO recognise drills while their signs have no visual", async () => {
    const S = await fresh();
    for (const lesson of LESSONS.filter((l) => l.unitId === "a1-u1")) {
      const q = S.buildDrillQueue(lesson.id, S.useApp.getState(), S.pid);
      expect(q.some((d) => d.type === "recognise")).toBe(false);
      expect(q.some((d) => d.type === "recall")).toBe(true); // quizzed honestly instead
    }
  });

  it("review sessions drill visual-less words as recall, never as a shown stimulus", async () => {
    const S = await fresh();
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-07-06T10:00:00"));
      S.useApp.getState().addToReview("hello");
      S.useApp.getState().addToReview("mum");
      vi.setSystemTime(new Date("2026-07-07T10:00:00"));
      const q = S.buildDrillQueue("review", S.useApp.getState(), S.pid);
      expect(q.length).toBe(2);
      for (const d of q) expect(d.type).toBe("recall");
    } finally {
      vi.useRealTimers();
    }
  });
});
