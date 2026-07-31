// Content gates for the 2026-07-31 batch: real signer photos, the Words hub's
// hands annotations, and Latin→Arabic fingerspell transliteration.
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  A1_SIGNS,
  ALPHABET,
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
    for (const s of ALPHABET) {
      const p = resolve(__dirname, "../../public", s.photo as string);
      expect(existsSync(p), `${s.id} → ${s.photo}`).toBe(true);
    }
  });
});

describe("Words hub content", () => {
  it("every A1 word declares hands (1 or 2)", () => {
    for (const s of A1_SIGNS) expect([1, 2], s.id).toContain(s.hands);
  });

  it("me / man / woman exist, one-handed and watch-only like the rest of A1", () => {
    for (const id of ["me", "man", "woman"]) {
      const s = A1_SIGNS.find((x) => x.id === id);
      expect(s, id).toBeTruthy();
      expect(s!.hands).toBe(1);
      expect(s!.cameraGradable).toBe(false);
    }
  });

  it("the people trio has its own lesson in the A1 unit", () => {
    const l = lessonById("a1-u1-l4");
    expect(l?.unitId).toBe("a1-u1");
    expect(l?.signIds).toEqual(["me", "man", "woman"]);
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
