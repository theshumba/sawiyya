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

// ── A1 · Unit 1 — "Family & First Words" (PRD §19 candidate set) ─────────────
// PROVENANCE (C3, disclosed in-app via i18n `a1AslProvenance`): these word-sign
// descriptions are ADAPTED FROM ASL and are NOT yet verified as Qatari Sign
// Language. No public QSL word dataset exists; a native Deaf Qatari signer
// records and verifies every A1 sign in Phase 2 (docs/real-sign-content-plan.md).
const S = (
  id: string,
  glossEn: string,
  glossAr: string,
  emoji: string,
  type: "static" | "dynamic",
  cameraGradable: boolean,
  hintEn: string,
  hintAr: string,
): Sign => ({ id, tier: "A1", glossEn, glossAr, emoji, hintEn, hintAr, type, cameraGradable });

export const A1_SIGNS: Sign[] = [
  S("iloveyou", "I love you", "أحبك", "🤟", "static", true,
    "Thumb, index and little finger up — middle and ring folded. Hold it steady, palm out.",
    "الإبهام والسبابة والخنصر مرفوعة — الوسطى والبنصر مطويتان. ثبّت يدك وراحتها للأمام."),
  S("hello", "Hello", "مرحبا", "👋", "dynamic", false,
    "Open hand by your temple, small wave outward.",
    "يد مفتوحة قرب الصدغ، تلويحة صغيرة للخارج."),
  // M7: both hints describe MOTION (nodding / tapping), so a static camera
  // grade would pass a frozen wrong sign — dynamic + watch-only is the honest
  // typing until real signer footage lands.
  S("yes", "Yes", "نعم", "✊", "dynamic", false,
    "Make a fist and nod it gently — like a head saying yes.",
    "اقبض يدك وحرّكها كأنها رأس يقول نعم."),
  S("no", "No", "لا", "🤞", "dynamic", false,
    "Index and middle finger tap against the thumb.",
    "السبابة والوسطى تنقران على الإبهام."),
  S("stop", "Stop", "قف", "✋", "static", true,
    "Flat open hand, palm facing forward — hold it firm.",
    "يد مفتوحة مسطّحة، الراحة للأمام — ثبّتها."),
  S("more", "More", "زيادة", "🤏", "dynamic", false,
    "Fingertips of both hands pinched, tapping together.",
    "أطراف أصابع اليدين مضمومة تتلامس معًا."),
  S("finished", "All done", "خلاص", "🙌", "dynamic", false,
    "Both open hands flip outward — all done!",
    "اليدان المفتوحتان تنقلبان للخارج — خلاص!"),
  S("hungry", "Hungry", "جوعان", "🍽️", "dynamic", false,
    "Cupped hand moves down the chest from throat.",
    "يد مقعّرة تنزل على الصدر من الحلق."),
  S("milk", "Milk", "حليب", "🥛", "dynamic", false,
    "Squeeze a fist — like milking. Repeat softly.",
    "اقبض اليد وافتحها — كأنك تحلب. كرّرها بلطف."),
  S("sleep", "Bedtime", "نوم", "😴", "dynamic", false,
    "Open hand draws down over your face, eyes closing.",
    "اليد المفتوحة تنزل على وجهك، والعينان تغمضان."),
  S("mum", "Mum", "ماما", "👩", "dynamic", false,
    "Open hand, thumb to chin.",
    "يد مفتوحة، الإبهام على الذقن."),
  S("dad", "Dad", "بابا", "👨", "dynamic", false,
    "Open hand, thumb to forehead.",
    "يد مفتوحة، الإبهام على الجبين."),
  S("thankyou", "Thank you", "شكرًا", "🙏", "dynamic", false,
    "Flat hand from chin moving forward — giving thanks.",
    "يد مسطّحة من الذقن تتحرك للأمام — تقديم الشكر."),
  S("help", "Help", "ساعدني", "🤲", "dynamic", false,
    "Fist on open palm, both rise together.",
    "قبضة على راحة مفتوحة، ترتفعان معًا."),
  S("careful", "Careful", "انتبه", "👀", "dynamic", false,
    "Two fingers from your eyes outward — watch out.",
    "إصبعان من عينيك إلى الخارج — انتبه."),
  S("name", "Name", "اسم", "🔤", "dynamic", false,
    "Two fingers of each hand tap crossed.",
    "إصبعان من كل يد ينقران متقاطعين."),
];

export const ALL_SIGNS: Sign[] = [...A1_SIGNS, ...ALPHABET];

export const signById = (id: string): Sign | undefined =>
  ALL_SIGNS.find((s) => s.id === id);

// ── Alphabet curriculum (H22) — the sourced content leads the path. 4 lessons
// of 7 letters in standard Arabic order (pinned decision — no invented
// similarity ordering). Edge forms (ة، لا، ال) are reference-only and stay OUT
// of lessons until a signer records them.
const SEEDED_ALPHABET = ALPHABET.filter((l) => l.cameraGradable); // the 28

export const UNIT_ALPHA: Unit = {
  id: "alpha-u1",
  tier: "alphabet",
  titleEn: "The Arabic Alphabet",
  titleAr: "الحروف العربية",
  signIds: SEEDED_ALPHABET.map((s) => s.id),
};

export const UNIT_A1_U1: Unit = {
  id: "a1-u1",
  tier: "A1",
  titleEn: "Family & First Words",
  titleAr: "العائلة وأول الكلمات",
  signIds: A1_SIGNS.map((s) => s.id),
};

/** Path order: the alphabet unit first (real graded content), then A1 words.
 *  Unit number shown in the UI = index here + 1. */
export const UNITS: Unit[] = [UNIT_ALPHA, UNIT_A1_U1];

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
  {
    id: "a1-u1-l1",
    unitId: "a1-u1",
    titleEn: "First connections",
    titleAr: "أولى الوصلات",
    signIds: ["iloveyou", "hello", "yes", "no"],
  },
  {
    id: "a1-u1-l2",
    unitId: "a1-u1",
    titleEn: "Everyday needs",
    titleAr: "احتياجات اليوم",
    signIds: ["more", "finished", "hungry", "milk", "stop"],
  },
  {
    id: "a1-u1-l3",
    unitId: "a1-u1",
    titleEn: "Home & people",
    titleAr: "البيت والناس",
    signIds: ["mum", "dad", "sleep", "thankyou", "help", "careful", "name"],
  },
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
