// Sawiyya content — PRD §11. Content as data: add/edit signs here, no code changes.
// Demonstration assets are HONEST PLACEHOLDERS [A] — a grant-funded Deaf Qatari
// signer re-records every demonstration in Phase 2 (PRD §11 [B]).
// Camera-gradable = static handshapes ONLY (PRD §9.4 hard rule).

import type { Lesson, Sign, Unit } from "../types";

// ── Arabic alphabet — 28 letters camera-graded from real signers (Zenodo ArSL,
// CC-BY-4.0), plus 3 edge forms (taMarbuta/laa/al) that have NO ground-truth seeds
// and are reference-only (cameraGradable=false) until a signer records them. ─────
const L = (
  id: string,
  code: string,
  glossEn: string,
  edge = false,
): Sign => ({
  id: `alpha-${id}`,
  tier: "alphabet",
  code,
  glossEn,
  glossAr: code,
  emoji: "✋",
  hintEn: edge
    ? "Edge form — reference only; no camera grading yet (awaiting a recorded signer)."
    : `Static handshape for the letter ${code}.`,
  hintAr: `شكل اليد الثابت لحرف ${code}`,
  type: "alphabet",
  // Only the 28 seeded letters have a real trained model behind them. The edge
  // forms stay visible as reference but never pretend to auto-grade (honest [A]).
  cameraGradable: !edge,
  // Real signer photo (ArSL21L, CC BY 4.0 — see public/handshapes/SOURCES.md).
  // All 31 letters incl. the edge forms have one; selection was scored against
  // the model's own per-letter mean geometry so the photo and the grader agree.
  photo: `handshapes/alpha-${id}.webp`,
  hands: 1,
});

export const ALPHABET: Sign[] = [
  L("alif", "ا", "Alif"),
  L("ba", "ب", "Ba"),
  L("ta", "ت", "Ta"),
  L("tha", "ث", "Tha"),
  L("jeem", "ج", "Jeem"),
  L("haa", "ح", "Haa"),
  L("kha", "خ", "Kha"),
  L("dal", "د", "Dal"),
  L("thal", "ذ", "Thal"),
  L("ra", "ر", "Ra"),
  L("zay", "ز", "Zay"),
  L("seen", "س", "Seen"),
  L("sheen", "ش", "Sheen"),
  L("sad", "ص", "Sad"),
  L("dad", "ض", "Dad"),
  L("tah", "ط", "Tah"),
  L("zah", "ظ", "Zah"),
  L("ain", "ع", "Ain"),
  L("ghain", "غ", "Ghain"),
  L("fa", "ف", "Fa"),
  L("qaf", "ق", "Qaf"),
  L("kaf", "ك", "Kaf"),
  L("lam", "ل", "Lam"),
  L("meem", "م", "Meem"),
  L("noon", "ن", "Noon"),
  L("ha", "ه", "Ha"),
  L("waw", "و", "Waw"),
  L("ya", "ي", "Ya"),
  L("taMarbuta", "ة", "Ta Marbuta", true),
  L("laa", "لا", "Laa", true),
  L("al", "ال", "Al", true),
];

// ── A1 word signs — REMOVED 2026-08-05. ──────────────────────────────────────
// The 19 "Family & First Words" signs were adapted from American Sign Language
// and never verified as Qatari. A disclosure does not make a wrong sign right,
// and six of them turned out to have a DIFFERENT documented Qatari counterpart
// (Mada's Jumla dictionary), so they were most likely wrong, not merely
// unverified. Sawiyya now teaches only content with a real source behind it:
// the 28 letters, from a CC BY 4.0 dataset of real signers.
//
// The complete record — the exact source removed, every Qatari route researched
// and why each is closed, and the restore steps — is docs/RECORD-WORD-SIGNS.md.
// They come back when Mada licences a lexicon or a Deaf Qatari signer records them.

export const ALL_SIGNS: Sign[] = [...ALPHABET];

export const signById = (id: string): Sign | undefined =>
  ALL_SIGNS.find((s) => s.id === id);

// ── Alphabet curriculum (H22) — the sourced content leads the path. 4 lessons
// of 7 letters in standard Arabic order (pinned decision — no invented
// similarity ordering). Edge forms (ة، لا، ال) are reference-only and stay OUT
// of lessons until a signer records them.
/** The 28 seeded letters: every alphabet sign with a trained model behind it.
 *  The 3 edge forms (ة، لا، ال) have no ground-truth seeds, so they are excluded.
 *  This is the ONE alphabet denominator: any screen that counts letter progress
 *  divides by `SEEDED_ALPHABET.length`, never by `ALPHABET.length` (31) and never
 *  by a hardcoded 28. Counting the edge forms produced "30 of 28 learned". */
export const SEEDED_ALPHABET: Sign[] = ALPHABET.filter((l) => l.cameraGradable); // the 28

export const UNIT_ALPHA: Unit = {
  id: "alpha-u1",
  tier: "alphabet",
  titleEn: "The Arabic Alphabet",
  titleAr: "الحروف العربية",
  signIds: SEEDED_ALPHABET.map((s) => s.id),
};

/** The path. One unit until there is a second one with a real source behind it
 *  — the A1 word unit was removed 2026-08-05 (docs/RECORD-WORD-SIGNS.md).
 *  Unit number shown in the UI = index here + 1. */
export const UNITS: Unit[] = [UNIT_ALPHA];

export const unitById = (id: string): Unit | undefined =>
  UNITS.find((u) => u.id === id);

const alphaLesson = (n: number, titleEn: string, titleAr: string): Lesson => ({
  id: `alpha-u1-l${n}`,
  unitId: "alpha-u1",
  titleEn,
  titleAr,
  signIds: SEEDED_ALPHABET.slice((n - 1) * 7, n * 7).map((s) => s.id),
});

export const LESSONS: Lesson[] = [
  // Alphabet leads the path — it's the sourced, camera-graded content (H22).
  alphaLesson(1, "Alif to Kha", "من الألف إلى الخاء"),
  alphaLesson(2, "Dal to Sad", "من الدال إلى الصاد"),
  alphaLesson(3, "Dad to Qaf", "من الضاد إلى القاف"),
  alphaLesson(4, "Kaf to Ya", "من الكاف إلى الياء"),
];

export const lessonById = (id: string): Lesson | undefined =>
  LESSONS.find((l) => l.id === id);

// ── Fingerspelling (M6) — char → alphabet sign. ──────────────────────────────
// Base map: every single-char letter code in ALPHABET (the multi-char edge
// forms لا/ال are spelled through their constituent letters instead).
const CHAR_TO_SIGN: Record<string, string> = Object.fromEntries(
  ALPHABET.filter((s) => s.code?.length === 1).map((s) => [s.code as string, s.id]),
);
// Orthographic folds: hamza-carrier and final-position variants collapse onto
// the base letter whose handshape they share. ة keeps its own reference-only
// sign (never folded to ه/ت — that would be a linguistic claim we can't back).
const FOLDS: Record<string, string> = {
  "أ": "alpha-alif", "إ": "alpha-alif", "آ": "alpha-alif", "ٱ": "alpha-alif",
  "ؤ": "alpha-waw",
  "ئ": "alpha-ya", "ى": "alpha-ya",
};
// Dropped silently (not "skipped" — they're not signable units at all):
// whitespace, tatweel (U+0640), harakat (U+064B–065F) and dagger alif (U+0670).
// A typed سَلام must not produce a "we skipped َ" note. Arabic-Indic digits
// are deliberately NOT here — digits surface as honest `skipped` steps.
const SILENT = /[\s\u0640\u064B-\u065F\u0670]/;

export type FingerspellStep =
  | { kind: "letter"; char: string; signId: string }
  | { kind: "skipped"; char: string };

/** Map an Arabic string to its fingerspelling sequence. Unmappable characters
 *  (digits, Latin, ء, punctuation) come back as honest `skipped` steps. */
export function fingerspellSequence(text: string): FingerspellStep[] {
  const steps: FingerspellStep[] = [];
  for (const char of text) {
    if (SILENT.test(char)) continue;
    const signId = FOLDS[char] ?? CHAR_TO_SIGN[char];
    steps.push(signId ? { kind: "letter", char, signId } : { kind: "skipped", char });
  }
  return steps;
}

// ── Latin → Arabic transliteration (fingerspell) ─────────────────────────────
// Most people type their name in English letters ("musa") — before this map,
// every one of those characters surfaced as "skipped" and the screen was a dead
// end. Map each Latin letter to the Arabic letter whose sound it carries, so
// fingerspell teaches the Arabic spelling instead of refusing the word.
// Approximate BY DESIGN (transliteration, not translation) — the UI always shows
// the resulting Arabic word, so nothing is hidden. Digraphs first (sh → ش, not
// س+ه), then single letters; anything unmapped passes through and surfaces as an
// honest skipped step like before.
const LATIN_DIGRAPHS: [string, string][] = [
  ["sh", "ش"], ["th", "ث"], ["dh", "ذ"], ["kh", "خ"], ["gh", "غ"],
  ["aa", "ا"], ["ee", "ي"], ["oo", "و"], ["ou", "و"],
];
const LATIN_SINGLES: Record<string, string> = {
  a: "ا", b: "ب", c: "ك", d: "د", e: "ي", f: "ف", g: "ج", h: "ه", i: "ي",
  j: "ج", k: "ك", l: "ل", m: "م", n: "ن", o: "و", p: "ب", q: "ق", r: "ر",
  s: "س", t: "ت", u: "و", v: "ف", w: "و", x: "كس", y: "ي", z: "ز",
};

export const hasLatin = (text: string): boolean => /[a-z]/i.test(text);

/** Replace Latin runs with their Arabic transliteration; Arabic passes through. */
export function transliterateLatin(text: string): string {
  const lower = text.toLowerCase();
  let out = "";
  let i = 0;
  while (i < lower.length) {
    const two = lower.slice(i, i + 2);
    const di = LATIN_DIGRAPHS.find(([d]) => d === two);
    if (di) {
      out += di[1];
      i += 2;
      continue;
    }
    out += LATIN_SINGLES[lower[i]] ?? lower[i];
    i += 1;
  }
  return out;
}

/** Persona → which lesson the tailored copy points at first (all start at L1 [A]). */
export const PERSONA_TAGLINE: Record<string, { en: string; ar: string }> = {
  parent: {
    en: "Your child's first language starts with your hands.",
    ar: "لغة طفلك الأولى تبدأ من يديك.",
  },
  sibling: {
    en: "Talk to your brother or sister — really talk.",
    ar: "كلّم أخاك أو أختك — كلام حقيقي.",
  },
  teacher: {
    en: "Survival signs for your classroom, fast.",
    ar: "إشارات أساسية لصفّك، بسرعة.",
  },
  friend: {
    en: "Be the friend who can actually chat.",
    ar: "كن الصديق اللي يقدر يسولف فعلًا.",
  },
  deaf: {
    en: "Tell your family what to learn. They'll follow you.",
    ar: "قل لعائلتك ماذا يتعلمون. سيتبعونك.",
  },
};
