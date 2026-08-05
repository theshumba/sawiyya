// Content gates: real signer photos, the no-unsourced-signs rule, and
// Latin→Arabic fingerspell transliteration.
import { describe, expect, it } from "vitest";
import {
  ALL_SIGNS,
  ALPHABET,
  LESSONS,
  UNITS,
  fingerspellSequence,
  hasLatin,
  lessonById,
  transliterateLatin,
} from "./signs";

describe("real signer photos (ArSL21L)", () => {
  it("every letter — including the 3 edge forms — declares a photo", () => {
    for (const s of ALPHABET) expect(s.photo, s.id).toBeTruthy();
  });

  it("every declared photo file exists in public/", () => {
    // import.meta.glob (vite/client) instead of node:fs — the app tsconfig has
    // no node types, and CI's fresh tsc rejects node imports in test files.
    const onDisk = new Set(
      Object.keys(import.meta.glob("../../public/handshapes/*.webp")).map(
        (p) => p.split("/").pop() as string,
      ),
    );
    for (const s of ALPHABET) {
      expect(onDisk.has((s.photo as string).split("/").pop() as string), `${s.id} → ${s.photo}`).toBe(true);
    }
  });
});

describe("no sign ships without a real source (2026-08-05)", () => {
  // The 19 A1 word signs were adapted from ASL and never verified as Qatari.
  // They were removed rather than disclosed, because a disclosure does not make
  // a wrong sign right. See docs/RECORD-WORD-SIGNS.md for the record and the
  // restore steps. These gates exist so they cannot come back by accident —
  // only deliberately, by a change that also updates this test.
  it("every shipped sign is a sourced alphabet letter", () => {
    for (const s of ALL_SIGNS) expect(s.tier, s.id).toBe("alphabet");
  });

  it("the 19 removed word ids resolve to nothing", () => {
    const removed = [
      "iloveyou", "hello", "yes", "no", "stop", "more", "finished", "hungry",
      "milk", "sleep", "mum", "dad", "thankyou", "help", "careful", "name",
      "me", "man", "woman",
    ];
    const ids = new Set(ALL_SIGNS.map((s) => s.id));
    for (const id of removed) expect(ids.has(id), id).toBe(false);
  });

  it("no unit or lesson references the removed word content", () => {
    for (const u of UNITS) expect(u.id, u.id).not.toContain("a1");
    for (const l of LESSONS) expect(l.unitId, l.id).toBe("alpha-u1");
    expect(lessonById("a1-u1-l4")).toBeUndefined();
  });

  it("every sign in every lesson actually exists", () => {
    const ids = new Set(ALL_SIGNS.map((s) => s.id));
    for (const l of LESSONS) {
      for (const id of l.signIds) expect(ids.has(id), `${l.id} → ${id}`).toBe(true);
    }
  });
});

describe("Latin → Arabic fingerspell transliteration", () => {
  it("musa maps letter-for-letter with zero skips", () => {
    const steps = fingerspellSequence(transliterateLatin("musa"));
    expect(steps.every((s) => s.kind === "letter")).toBe(true);
    expect(steps.map((s) => s.char).join("")).toBe("موسا");
  });

  it("digraphs win over singles (sh → ش, not س+ه)", () => {
    expect(transliterateLatin("sham")).toBe("شام");
    expect(transliterateLatin("khalid")).toBe("خاليد");
  });

  it("Arabic passes through untouched; digits still surface as skipped", () => {
    expect(transliterateLatin("سلام")).toBe("سلام");
    const steps = fingerspellSequence(transliterateLatin("m3"));
    expect(steps).toEqual([
      { kind: "letter", char: "م", signId: "alpha-meem" },
      { kind: "skipped", char: "3" },
    ]);
  });

  it("hasLatin gates the conversion", () => {
    expect(hasLatin("musa")).toBe(true);
    expect(hasLatin("سلام")).toBe(false);
  });
});
