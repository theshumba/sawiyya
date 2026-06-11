// Sawiyya data model — PRD §10. [A] = localStorage; same shapes port to Supabase [B].

export type Lang = "en" | "ar";
export type Hand = "L" | "R";
export type Persona = "parent" | "sibling" | "teacher" | "friend" | "deaf";
export type SignType = "alphabet" | "static" | "dynamic";
export type DailyGoal = "casual" | "regular" | "serious"; // 3 / 7 / 15 min

export interface Profile {
  id: string;
  displayName: string;
  role: Persona;
  emoji: string; // avatar
  dominantHand: Hand;
  language: Lang;
  xp: number;
  xpToday: number;
  streak: number;
  lastActiveDay: string | null; // YYYY-MM-DD
  activeDays: string[]; // recent active days (cap ~90) — feeds shared streak
  dailyGoal: DailyGoal;
  createdAt: string;
}

export interface Sign {
  id: string;
  tier: string; // "alphabet" | "A1"
  code?: string; // Arabic letter character for alphabet signs
  glossEn: string;
  glossAr: string;
  emoji: string; // honest placeholder demo asset [A] — Deaf-signer video in [B]
  hintEn: string; // how the sign is performed (placeholder description)
  hintAr: string;
  type: SignType;
  cameraGradable: boolean;
}

export interface Unit {
  id: string;
  tier: string;
  titleEn: string;
  titleAr: string;
  signIds: string[];
}

export type DrillType = "watch" | "recognise" | "recall" | "camera" | "review";

export interface DrillSpec {
  type: DrillType;
  signId: string;
}

export interface Lesson {
  id: string;
  unitId: string;
  titleEn: string;
  titleAr: string;
  signIds: string[]; // drillSpec generated from these — content stays data-editable
}

export interface SignProgress {
  masteryLevel: number; // 0 none · 1 seen · 2 practised · 3 mastered
  lastSeen: string;
}

/** ts-fsrs Card with dates serialised to ISO strings for localStorage. */
export interface StoredCard {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
}

export interface Flag {
  id: string;
  raisedByProfileId: string;
  signId: string;
  active: boolean;
  createdAt: string;
}

export interface Metrics {
  appFirstOpenAt: string | null;
  firstSignMs: number | null; // time-to-first-sign (G1)
  drillsCompleted: number;
  cameraAttempts: number;
  cameraMatches: number;
  selfMarks: number;
  lessonsCompleted: number;
}
