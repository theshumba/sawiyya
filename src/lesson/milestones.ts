// Milestones — celebrate the human outcome, not the score (PRD §6.5).
import type { AppState } from "../store/app";
import { signsAllCanDo } from "../store/app";
import { A1_SIGNS, ALPHABET } from "../content/signs";
import type { Lang } from "../types";
import { pick } from "../i18n";

export interface Milestone {
  reached: boolean;
  emoji: string;
  label: string;
  progress: number; // 0..1 toward this milestone
}

export function nextMilestone(s: AppState, profileId: string, lang: Lang): Milestone | null {
  const prog = s.progress[profileId] ?? {};
  const mastered = Object.values(prog).filter((p) => p.masteryLevel >= 3).length;
  // "All of Unit 1" counts ONLY the 16 A1 signs (M4) — any 16 mastered signs
  // (e.g. alphabet letters) must not fire the unit milestone.
  const a1Mastered = A1_SIGNS.filter((s2) => (prog[s2.id]?.masteryLevel ?? 0) >= 3).length;
  // Count ONLY the 28 seeded (cameraGradable) letters: the ة/لا/ال edge forms
  // can still reach mastery 3 through the teach-and-match path, and letting
  // them substitute for real letters would fire "whole alphabet mastered"
  // while seeded letters are unlearned (H22).
  const alphaMastered = ALPHABET.filter(
    (s2) => s2.cameraGradable && (prog[s2.id]?.masteryLevel ?? 0) >= 3,
  ).length;
  const familyCanDo = signsAllCanDo(s).length;
  // H6 made signsAllCanDo() hearing-only, so a zero-hearing household (the
  // "I'm Deaf — setting up my family" solo persona) has familyCanDo pinned at
  // 0 forever — the family rungs would wedge the ladder in front of the
  // reachable alphabet milestone. Skip them until a hearing member exists.
  const hasHearing = s.profiles.some((p) => p.role !== "deaf");

  const ladder: { at: number; value: number; emoji: string; en: string; ar: string }[] = [
    { at: 1, value: mastered, emoji: "🌱", en: "First sign mastered", ar: "أول إشارة متقنة" },
    { at: 5, value: mastered, emoji: "✋", en: "5 signs mastered", ar: "٥ إشارات متقنة" },
    { at: 10, value: mastered, emoji: "🤟", en: "10 signs mastered", ar: "١٠ إشارات متقنة" },
    ...(hasHearing
      ? [
          { at: 5, value: familyCanDo, emoji: "👪", en: "5 signs your whole family can do", ar: "٥ إشارات تتقنها كل العائلة" },
          { at: 10, value: familyCanDo, emoji: "🏠", en: "10 signs your whole family can do", ar: "١٠ إشارات تتقنها كل العائلة" },
        ]
      : []),
    // The whole-alphabet row sits BEFORE the word-unit row: the word unit needs
    // Phase-2 signer content to be masterable (non-gradable words cap at 2), so
    // it must never block the reachable alphabet milestone (H22).
    { at: 28, value: alphaMastered, emoji: "🔤", en: "Whole alphabet mastered", ar: "الأبجدية كاملة متقنة" },
    { at: 16, value: a1Mastered, emoji: "🏆", en: "All the word unit mastered", ar: "كل وحدة الكلمات متقنة" },
  ];

  const next = ladder.find((l) => l.value < l.at);
  if (!next) return null;
  return {
    reached: false,
    emoji: next.emoji,
    label: `${pick(lang, next.en, next.ar)}`,
    progress: next.value / next.at,
  };
}
