// Sawiyya data model — PRD §10. [A] = localStorage; same shapes port to Supabase [B].

export type Lang = "en" | "ar";
export type Hand = "L" | "R";
export type Persona = "parent" | "sibling" | "teacher" | "friend" | "deaf";
export type SignType = "alphabet" | "static" | "dynamic";
export type DailyGoal = "casual" | "regular" | "serious"; // 3 / 7 / 15 min
/** Onboarding question 2. Stored and surfaced, never used to branch: everyone
 *  gets the same lesson one. The asking is the mechanism, not the matching. */
export type PriorSigning = "none" | "some" | "fluent";

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
  /** Highest streak this profile has ever reached. Achievements narrate what
   *  HAPPENED, so the 7-day badge reads this and not the live `streak`, which
   *  drops to 0 the moment a learner lapses. Blobs written before this field
   *  backfill from `streak`. */
  bestStreak: number;
  /** The streak value the full-screen celebration last fired for. Persisted so
   *  the celebration can fire the next time Progress opens: the old per-mount
   *  ref could only fire if the streak grew while Progress was already on
   *  screen, which never happens (one screen renders at a time). */
  celebratedStreak: number;
  lastActiveDay: string | null; // YYYY-MM-DD
  activeDays: string[]; // recent active days (cap ~90) — feeds shared streak
  dailyGoal: DailyGoal;
  /** Onboarding answer, surfaced on the recap. Never branches the curriculum. */
  priorSigning: PriorSigning;
  /** Onboarding answer: weekday numbers (0 Sun … 6 Sat) the learner said they
   *  would practise. Empty means they never answered — Home then says nothing
   *  rather than inventing a commitment they did not make. Surfaced on Home and
   *  used for the reminder .ics recurrence. */
  practiseDays: number[];
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
  /** Real reference photo (ArSL21L, CC BY 4.0) — public/handshapes/<id>.webp.
   *  The primary demo visual for alphabet signs; replaces the averaged-skeleton
   *  placeholder everywhere it renders. */
  photo?: string;
  /** Hands the sign needs. The Words hub leads with one-handed signs — they're
   *  the ones a learner can copy while holding a phone. */
  hands?: 1 | 2;
  /** Real footage (H23) — a recording drops in here; SignDemo renders it over
   *  every placeholder when present. `signer` drives the honesty label:
   *  "deaf" → "Deaf signer recording"; anything else (incl. absent) → the safe
   *  "Reference recording" — never claim a Deaf signer that isn't one. */
  media?: { type: "video"; src: string; poster?: string; signer?: "deaf" | "reference" };
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

/**
 * Where the learner is on the getting-started ladder, and what the app has
 * already introduced (Phase 3). Device-level, not per-profile: "has this app
 * introduced itself on this phone" is a property of the phone. The ladder's own
 * definitions live in journey/journey.ts — nothing here is an enum, so adding or
 * removing a step needs no migration.
 */
export interface Journey {
  /** Completed step ids, in the order they were reached. */
  steps: string[];
  /** surfaceId → the rev of it the learner has acknowledged. */
  seen: Record<string, number>;
  /** Step ids the learner explicitly put aside. */
  dismissed: string[];
  // The plan's fourth field, `firstOpenAt`, is deliberately absent: it is
  // `metrics.appFirstOpenAt`, which already records first open on this device
  // and is already normalized and persisted. Two fields holding one fact is the
  // naming collision Phase 4 exists to clean up, not one to add.
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
