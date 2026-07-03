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
  /** Reviews (drills on already-due cards) done today — feeds the daily soft cap
   *  (H3). Like xpToday it resets lazily via lastActiveDay; read through
   *  reviewsTodayFor. */
  reviewsToday: number;
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
  /** Real footage (H23) — the owner-gated Deaf-signer recording drops in here;
   *  SignDemo renders it over every placeholder when present. */
  media?: { type: "video"; src: string; poster?: string };
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
  /** Recognise-drill distractor pool override (H22 checkpoints): only letters
   *  the learner has MET may appear as choices. Absent = the tier default. */
  pool?: string[];
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
  /** Camera-confirmed successes — mastery 3 requires ≥ 2 (M4). Self-marks and
   *  watch reps never increment this. Optional: blobs written before this field
   *  read as 0. */
  cameraHits?: number;
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
  /** Members who co-requested the sign after it was already flagged (H7) —
   *  tapping an existing flag never toggles it off for non-raisers. */
  supporters: string[];
  signId: string;
  active: boolean;
  /** Auto-set when every non-raiser hearing member reaches mastery ≥ 2 (M8);
   *  archived flags leave the queues/pins but stay in state as history. */
  archived: boolean;
  createdAt: string;
}

export interface Metrics {
  appFirstOpenAt: string | null;
  firstSignMs: number | null; // time-to-first-sign (G1)
  drillsCompleted: number;
  cameraAttempts: number;
  cameraMatches: number;
  /** Subset of cameraMatches confirmed ONLY by the learner's own KNN recording,
   *  not the dataset MLP — surfaced honestly, tracked separately (M2). */
  ownRecordingMatches: number;
  selfMarks: number;
  lessonsCompleted: number;
}
