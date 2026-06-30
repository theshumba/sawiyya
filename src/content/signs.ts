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
  S("yes", "Yes", "نعم", "✊", "static", true,
    "Make a fist and nod it gently — like a head saying yes.",
    "اقبض يدك وحرّكها كأنها رأس يقول نعم."),
  S("no", "No", "لا", "🤞", "static", true,
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

export const UNIT_A1_U1: Unit = {
  id: "a1-u1",
  tier: "A1",
  titleEn: "Family & First Words",
  titleAr: "العائلة وأول الكلمات",
  signIds: A1_SIGNS.map((s) => s.id),
};

export const LESSONS: Lesson[] = [
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
