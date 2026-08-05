// Phase 4 · the tone pass, kept honest by a gate rather than by memory.
//
// The rules are Duolingo's published ones, chosen because they are free, public
// and specific: no punctuation in buttons, no full stops in headlines,
// exclamation marks only on success. A copy change that breaks one of them now
// fails here instead of shipping.
import { describe, expect, it } from "vitest";
import { DICT, t } from "./i18n";

const entries = Object.entries(DICT);

// Keys the codebase names as button labels. The convention is real: every CTA
// in the dictionary carries the Cta suffix.
const BUTTON_KEY = /Cta$/;

// Ornaments that crept into button labels: an arrow is not a word, and a phone
// mirrors the layout but not the glyph, so "Start →" pointed the wrong way in
// Arabic while "ابدأ ←" pointed the wrong way in English.
const ORNAMENT = /[→←↑↓⭐★✓]/;

describe("Phase 4 tone · buttons", () => {
  it("carry no trailing punctuation and no ornaments", () => {
    const offenders = entries
      .filter(([key]) => BUTTON_KEY.test(key))
      .filter(([, v]) => /[.!?…]$/.test(v.en) || /[.!?…]$/.test(v.ar) || ORNAMENT.test(v.en) || ORNAMENT.test(v.ar))
      .map(([key]) => key);
    expect(offenders).toEqual([]);
  });

  it("includes the trail's own two, which are buttons without the suffix", () => {
    for (const label of [t("pathStartCta", "en"), t("pathReview", "en"), t("pathReview", "ar")]) {
      expect(ORNAMENT.test(label)).toBe(false);
    }
  });
});

describe("Phase 4 tone · exclamation marks", () => {
  // Every key allowed to shout, and the reason it is: each one marks a thing
  // the learner just DID. Adding a key here should feel like a decision.
  const SUCCESS = new Set([
    "camMatch", // the camera confirmed the sign
    "camReached",
    "camTeachDone",
    "fsCelebrate",
    "fsDone",
    "fspDone",
    "lsCorrect",
    "lsLessonDone",
    "lsSessionTitle",
    "loopLineCorrect",
    "celStreakTitle",
    "celGoalTitle",
    "celLevelTitle",
  ]);

  it("appear only where something succeeded", () => {
    const shouting = entries
      .filter(([, v]) => v.en.includes("!") || v.ar.includes("!"))
      .map(([key]) => key)
      .filter((key) => !SUCCESS.has(key));
    expect(shouting).toEqual([]);
  });
});

describe("Phase 4 tone · headlines", () => {
  // Titles, not bodies. Body copy keeps its full stops; a heading with one
  // reads as a sentence fragment that lost its paragraph.
  const HEADLINE_KEY = /(Title$|^prNothingDue$|^obRecapTabsTitle$)/;
  const BODY_EXEMPT = new Set([
    // These "Title" keys are sentences by design — the confirm dialogs ask a
    // question, and a question mark is not a full stop.
    "setImportConfirmTitle",
    "famRemoveTitle",
  ]);

  it("do not end in a full stop", () => {
    const offenders = entries
      .filter(([key]) => HEADLINE_KEY.test(key) && !BODY_EXEMPT.has(key))
      .filter(([, v]) => v.en.trim().endsWith(".") || v.ar.trim().endsWith("."))
      .map(([key]) => key);
    expect(offenders).toEqual([]);
  });
});

describe("Phase 4 · one name for the dictionary", () => {
  it("is 'Dictionary', and the old four names are gone from the copy", () => {
    expect(t("navDictionary", "en")).toBe("Dictionary");
    const dead = ["Sign Dictionary", "Signs dictionary", "Browse the signs"];
    const offenders = entries
      .filter(([, v]) => dead.some((name) => v.en.includes(name)))
      .map(([key]) => key);
    expect(offenders).toEqual([]);
  });

  it("names the destination the same way from the camera's escape hatch", () => {
    expect(t("stBrowseSigns", "en").toLowerCase()).toContain(t("navDictionary", "en").toLowerCase());
  });
});
