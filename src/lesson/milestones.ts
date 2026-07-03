// Milestones — celebrate the human outcome, not the score (PRD §6.5).
import type { AppState } from "../store/app";
import { signsAllCanDo } from "../store/app";
import { A1_SIGNS } from "../content/signs";
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
  const familyCanDo = signsAllCanDo(s).length;

  const ladder: { at: number; value: number; emoji: string; en: string; ar: string }[] = [
    { at: 1, value: mastered, emoji: "🌱", en: "First sign mastered", ar: "أول إشارة متقنة" },
    { at: 5, value: mastered, emoji: "✋", en: "5 signs mastered", ar: "٥ إشارات متقنة" },
    { at: 10, value: mastered, emoji: "🤟", en: "10 signs mastered", ar: "١٠ إشارات متقنة" },
    { at: 5, value: familyCanDo, emoji: "👪", en: "5 signs your whole family can do", ar: "٥ إشارات تتقنها كل العائلة" },
    { at: 10, value: familyCanDo, emoji: "🏠", en: "10 signs your whole family can do", ar: "١٠ إشارات تتقنها كل العائلة" },
    { at: 16, value: a1Mastered, emoji: "🏆", en: "All of Unit 1 mastered", ar: "كل الوحدة الأولى متقنة" },
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
