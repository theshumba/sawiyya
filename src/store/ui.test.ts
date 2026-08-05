// Phase 4 · the Words screen became a filter on the dictionary, and the router
// is where that has to hold: "#/words" was a real address (the screenshot
// harness uses it, and anyone who bookmarked the word room has it), so it must
// keep landing on the words rather than on Home's catch-all.
import { describe, expect, it } from "vitest";
import { hashToScreen, screenToHash } from "./ui";

describe("the word room after the merge", () => {
  it("still answers to #/words, as the dictionary filtered", () => {
    expect(hashToScreen("#/words")).toEqual({ name: "allSigns", filter: "words" });
  });

  it("round-trips: the filter survives a push and a Back", () => {
    const screen = hashToScreen("#/words");
    expect(screenToHash(screen)).toBe("#/words");
    expect(hashToScreen(screenToHash(screen))).toEqual(screen);
  });

  it("keeps the dictionary's own two addresses untouched", () => {
    expect(hashToScreen("#/signs")).toEqual({ name: "allSigns" });
    expect(screenToHash({ name: "allSigns" })).toBe("#/signs");
    expect(hashToScreen("#/signs/alpha-alif")).toEqual({ name: "allSigns", signId: "alpha-alif" });
    expect(screenToHash({ name: "allSigns", signId: "alpha-alif" })).toBe("#/signs/alpha-alif");
  });

  it("does not let an unfiltered dictionary claim the words address", () => {
    expect(screenToHash({ name: "allSigns", signId: "a1-milk" })).not.toBe("#/words");
  });
});
