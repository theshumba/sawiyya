// The dictionary's addresses. "#/words" was the word room's address: Phase 4
// folded that screen into a filter, and 2026-08-05 removed the words themselves
// (docs/RECORD-WORD-SIGNS.md). The address still has to resolve, because people
// bookmarked it and the app must not 404 them, but it now lands on the plain
// dictionary and is never minted again.
import { describe, expect, it } from "vitest";
import { hashToScreen, screenToHash } from "./ui";

describe("the words address after the words were removed", () => {
  it("#/words still resolves, to the unfiltered dictionary", () => {
    expect(hashToScreen("#/words")).toEqual({ name: "allSigns" });
  });

  it("is one-way: nothing in the app mints #/words again", () => {
    const screen = hashToScreen("#/words");
    expect(screenToHash(screen)).toBe("#/signs");
    // And it settles there — a second round-trip does not oscillate.
    expect(hashToScreen(screenToHash(screen))).toEqual(screen);
  });

  it("keeps the dictionary's own two addresses untouched", () => {
    expect(hashToScreen("#/signs")).toEqual({ name: "allSigns" });
    expect(screenToHash({ name: "allSigns" })).toBe("#/signs");
    expect(hashToScreen("#/signs/alpha-alif")).toEqual({ name: "allSigns", signId: "alpha-alif" });
    expect(screenToHash({ name: "allSigns", signId: "alpha-alif" })).toBe("#/signs/alpha-alif");
  });

  it("no screen anywhere serialises to #/words", () => {
    expect(screenToHash({ name: "allSigns", signId: "alpha-meem" })).not.toBe("#/words");
    expect(screenToHash({ name: "allSigns" })).not.toBe("#/words");
  });
});
