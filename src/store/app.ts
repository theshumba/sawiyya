// Sawiyya app state — zustand, persisted to localStorage (PRD §10 [A]).
// Single device, multiple local profiles. No accounts, no cloud, no PII upload.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  DailyGoal,
  Flag,
  Hand,
  Lang,
  Metrics,
  Persona,
  Profile,
  SignProgress,
  StoredCard,
} from "../types";
import { isDue, newStoredCard, rateCard, type SrsOutcome } from "./srs";

export const GOAL_XP: Record<DailyGoal, number> = {
  casual: 20, // ~3 min
  regular: 50, // ~7 min
  serious: 100, // ~15 min
};

const AVATARS = ["🦊", "🐝", "🦜", "🐬", "🦔", "🐢", "🦩", "⭐"] as const;

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

let idSeq = 0;
function uid(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

export interface AppState {
  onboarded: boolean;
  householdName: string;
  profiles: Profile[];
  activeProfileId: string | null;
  /** profileId → signId → progress */
  progress: Record<string, Record<string, SignProgress>>;
  /** profileId → signId → FSRS card */
  srs: Record<string, Record<string, StoredCard>>;
  flags: Flag[];
  metrics: Metrics;

  // actions
  createProfile: (p: {
    displayName: string;
    role: Persona;
    dominantHand: Hand;
    language: Lang;
    dailyGoal: DailyGoal;
  }) => string;
  switchProfile: (id: string) => void;
  updateProfile: (id: string, patch: Partial<Profile>) => void;
  completeOnboarding: () => void;
  /** Record a completed drill for the active profile: XP + streak + SRS + mastery. */
  recordDrillResult: (
    signId: string,
    outcome: SrsOutcome,
    opts?: { selfMark?: boolean; camera?: boolean; matched?: boolean; watch?: boolean },
  ) => void;
  recordLessonComplete: () => void;
  /** Seed an SRS review card for a sign without XP/mastery (Dictionary "Add to Daily Review"). */
  addToReview: (signId: string) => void;
  markFirstSignTime: () => void;
  toggleFlag: (signId: string, raisedByProfileId: string) => void;
  bumpMetric: (key: keyof Metrics, by?: number) => void;
}

const emptyMetrics: Metrics = {
  appFirstOpenAt: null,
  firstSignMs: null,
  drillsCompleted: 0,
  cameraAttempts: 0,
  cameraMatches: 0,
  selfMarks: 0,
  lessonsCompleted: 0,
};

// ── persistence safety net (H13, M21) ────────────────────────────────────────
// localStorage IS the database here — no accounts, no cloud. Two protections:
// 1. A corrupt blob is backed up to CORRUPT_BACKUP_KEY before the app falls
//    back to defaults, and RECOVERY_NOTICE_KEY flags a one-time honest notice
//    (M21 — never silently wipe someone's progress).
// 2. `version` + `migrate` + a normalizing `merge` mean future schema changes
//    can't shallow-merge stale nested shapes into new code (H13).

export const STORE_KEY = "sawiyya.app.v1";
export const CORRUPT_BACKUP_KEY = "sawiyya.app.v1.corrupt";
export const RECOVERY_NOTICE_KEY = "sawiyya.app.recovery-notice";

const guardedStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const raw = localStorage.getItem(name);
    if (raw === null) return null;
    try {
      JSON.parse(raw);
      return raw;
    } catch {
      try {
        localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
        localStorage.setItem(RECOVERY_NOTICE_KEY, "1");
      } catch {
        // storage full — the backup is best-effort, the app must still boot
      }
      return null;
    }
  },
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
}));

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function finiteOr(n: unknown, fallback: number): number {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

/**
 * Rehydrate normalizer: whatever shape the persisted blob has, the state that
 * reaches the app is complete. Backfills keys added after a blob was written
 * (e.g. a profile missing `activeDays` or a metrics key) so no selector ever
 * sees `undefined` and NaNs the UI.
 */
function normalizePersisted(persisted: unknown, current: AppState): AppState {
  if (!isRecord(persisted)) return current;
  const p = persisted as Partial<AppState>;
  const profiles: Profile[] = Array.isArray(p.profiles)
    ? p.profiles.filter(isRecord).map((raw) => {
        const pr = raw as Partial<Profile>;
        return {
          id: typeof pr.id === "string" ? pr.id : uid("p"),
          displayName: typeof pr.displayName === "string" ? pr.displayName : "",
          role: pr.role ?? "parent",
          emoji: typeof pr.emoji === "string" ? pr.emoji : AVATARS[0],
          dominantHand: pr.dominantHand ?? "R",
          language: pr.language ?? "en",
          xp: finiteOr(pr.xp, 0),
          xpToday: finiteOr(pr.xpToday, 0),
          streak: finiteOr(pr.streak, 0),
          lastActiveDay: typeof pr.lastActiveDay === "string" ? pr.lastActiveDay : null,
          activeDays: Array.isArray(pr.activeDays)
            ? pr.activeDays.filter((d): d is string => typeof d === "string")
            : [],
          dailyGoal: pr.dailyGoal ?? "regular",
          createdAt: typeof pr.createdAt === "string" ? pr.createdAt : new Date().toISOString(),
        };
      })
    : current.profiles;
  return {
    ...current,
    ...p,
    profiles,
    activeProfileId:
      typeof p.activeProfileId === "string" && profiles.some((pr) => pr.id === p.activeProfileId)
        ? p.activeProfileId
        : (profiles[0]?.id ?? null),
    progress: isRecord(p.progress) ? (p.progress as AppState["progress"]) : {},
    srs: isRecord(p.srs) ? (p.srs as AppState["srs"]) : {},
    flags: Array.isArray(p.flags) ? p.flags : [],
    metrics: {
      ...emptyMetrics,
      appFirstOpenAt: current.metrics.appFirstOpenAt,
      ...(isRecord(p.metrics) ? (p.metrics as Partial<Metrics>) : {}),
    },
  };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      householdName: "",
      profiles: [],
      activeProfileId: null,
      progress: {},
      srs: {},
      flags: [],
      metrics: { ...emptyMetrics, appFirstOpenAt: new Date().toISOString() },

      createProfile: ({ displayName, role, dominantHand, language, dailyGoal }) => {
        const id = uid("p");
        const emoji = AVATARS[get().profiles.length % AVATARS.length];
        const profile: Profile = {
          id,
          displayName,
          role,
          emoji,
          dominantHand,
          language,
          xp: 0,
          xpToday: 0,
          streak: 0,
          lastActiveDay: null,
          activeDays: [],
          dailyGoal,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          profiles: [...s.profiles, profile],
          activeProfileId: s.activeProfileId ?? id,
        }));
        return id;
      },

      switchProfile: (id) => set({ activeProfileId: id }),

      updateProfile: (id, patch) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      completeOnboarding: () => set({ onboarded: true }),

      recordDrillResult: (signId, outcome, opts = {}) => {
        const { activeProfileId } = get();
        if (!activeProfileId) return;
        const today = todayKey();
        const yesterday = yesterdayKey();
        set((s) => {
          // 1. SRS
          const profileSrs = { ...(s.srs[activeProfileId] ?? {}) };
          const card = profileSrs[signId] ?? newStoredCard();
          profileSrs[signId] = rateCard(card, outcome);

          // 2. Mastery: 1 seen → 2 practised → 3 mastered (3+ *successful* reps)
          const profileProg = { ...(s.progress[activeProfileId] ?? {}) };
          const prev = profileProg[signId]?.masteryLevel ?? 0;
          const success = !opts.watch && (outcome === "good" || outcome === "easy");
          // ts-fsrs `reps` counts every review including "again"/lapses; subtract
          // lapses so mastery reflects successful recall, not raw attempts (#6).
          const ratedCard = profileSrs[signId];
          const successfulReps = ratedCard.reps - ratedCard.lapses;
          const mastery = opts.watch
            ? Math.max(prev, 1)
            : success
              ? successfulReps >= 3
                ? 3
                : Math.max(prev, 2)
              : Math.max(prev, 1);
          profileProg[signId] = { masteryLevel: mastery, lastSeen: new Date().toISOString() };

          // 3. XP + streak (no hearts, no punishment — XP even on a miss)
          const xpGain = opts.watch ? 5 : success ? 10 : 4;
          const profiles = s.profiles.map((p) => {
            if (p.id !== activeProfileId) return p;
            const newDay = p.lastActiveDay !== today;
            const streak = newDay
              ? p.lastActiveDay === yesterday
                ? p.streak + 1
                : 1
              : p.streak;
            const activeDays = newDay
              ? [...p.activeDays, today].slice(-90)
              : p.activeDays;
            return {
              ...p,
              xp: p.xp + xpGain,
              xpToday: newDay ? xpGain : p.xpToday + xpGain,
              streak,
              lastActiveDay: today,
              activeDays,
            };
          });

          // 4. Metrics
          const metrics = { ...s.metrics, drillsCompleted: s.metrics.drillsCompleted + 1 };
          if (opts.camera) {
            metrics.cameraAttempts += 1;
            if (opts.matched) metrics.cameraMatches += 1;
          }
          if (opts.selfMark) metrics.selfMarks += 1;

          return {
            srs: { ...s.srs, [activeProfileId]: profileSrs },
            progress: { ...s.progress, [activeProfileId]: profileProg },
            profiles,
            metrics,
          };
        });
      },

      recordLessonComplete: () =>
        set((s) => ({
          metrics: { ...s.metrics, lessonsCompleted: s.metrics.lessonsCompleted + 1 },
        })),

      // Explicitly schedule a sign for review (due now) without inflating mastery,
      // XP or "Learned" counts — that's reserved for actual drills (#M5). A no-op
      // if the sign already has a card.
      addToReview: (signId) =>
        set((s) => {
          const { activeProfileId } = get();
          if (!activeProfileId) return s;
          const profileSrs = s.srs[activeProfileId] ?? {};
          if (profileSrs[signId]) return s;
          return {
            srs: {
              ...s.srs,
              [activeProfileId]: { ...profileSrs, [signId]: newStoredCard() },
            },
          };
        }),

      markFirstSignTime: () => {
        const { metrics } = get();
        if (metrics.firstSignMs !== null || !metrics.appFirstOpenAt) return;
        const ms = Date.now() - new Date(metrics.appFirstOpenAt).getTime();
        set((s) => ({ metrics: { ...s.metrics, firstSignMs: ms } }));
      },

      toggleFlag: (signId, raisedByProfileId) =>
        set((s) => {
          const existing = s.flags.find((f) => f.signId === signId && f.active);
          if (existing) {
            return {
              flags: s.flags.map((f) =>
                f.id === existing.id ? { ...f, active: false } : f,
              ),
            };
          }
          const flag: Flag = {
            id: uid("flag"),
            raisedByProfileId,
            signId,
            active: true,
            createdAt: new Date().toISOString(),
          };
          return { flags: [...s.flags, flag] };
        }),

      bumpMetric: (key, by = 1) =>
        set((s) => {
          const cur = s.metrics[key];
          if (typeof cur !== "number") return s;
          return { metrics: { ...s.metrics, [key]: cur + by } };
        }),
    }),
    {
      name: STORE_KEY,
      storage: guardedStorage,
      // Schema version 1 (H13). Bump this + extend migrate whenever the
      // persisted shape changes; identity for now so today's blobs are v1.
      version: 1,
      migrate: (persistedState) => persistedState as AppState,
      merge: (persistedState, currentState) =>
        normalizePersisted(persistedState, currentState),
    },
  ),
);

// ── selectors ────────────────────────────────────────────────────────────────
export function activeProfile(s: AppState): Profile | null {
  return s.profiles.find((p) => p.id === s.activeProfileId) ?? null;
}

/**
 * Today's XP, derived at read time (#5). `xpToday` is only reset inside
 * recordDrillResult on the first drill of a new day, so on a fresh morning —
 * before that drill — the stored value is yesterday's total. Reading it through
 * here keeps the daily-goal ring honest from the moment the app opens.
 */
export function xpTodayFor(p: Profile): number {
  return p.lastActiveDay === todayKey() ? p.xpToday : 0;
}

/** Signs flagged by Deaf family members, newest first (PRD §6.7). */
export function activeFlags(s: AppState): Flag[] {
  return s.flags.filter((f) => f.active).slice().reverse();
}

/** Due SRS cards for a profile — flagged signs jump the queue (PRD §6.6). */
export function dueSignIds(s: AppState, profileId: string, now = new Date()): string[] {
  const cards = s.srs[profileId] ?? {};
  const flagged = new Set(activeFlags(s).map((f) => f.signId));
  return Object.entries(cards)
    .filter(([, card]) => isDue(card, now))
    .sort(([aId, a], [bId, b]) => {
      const af = flagged.has(aId) ? 0 : 1;
      const bf = flagged.has(bId) ? 0 : 1;
      if (af !== bf) return af - bf;
      return new Date(a.due).getTime() - new Date(b.due).getTime();
    })
    .map(([signId]) => signId);
}

/** Flagged signs not yet mastered by the profile — pinned on Home. */
export function pinnedFlagSigns(s: AppState, profileId: string): Flag[] {
  const prog = s.progress[profileId] ?? {};
  return activeFlags(s).filter((f) => (prog[f.signId]?.masteryLevel ?? 0) < 3);
}

/** Signs every household member has mastered — the shared board (PRD §6.7). */
export function signsAllCanDo(s: AppState): string[] {
  if (s.profiles.length === 0) return [];
  const sets = s.profiles.map((p) =>
    new Set(
      Object.entries(s.progress[p.id] ?? {})
        .filter(([, pr]) => pr.masteryLevel >= 3)
        .map(([signId]) => signId),
    ),
  );
  const [first, ...rest] = sets;
  return [...first].filter((id) => rest.every((set) => set.has(id)));
}

/** Household streak: consecutive days (ending today/yesterday) where every profile was active. */
export function householdStreak(s: AppState): number {
  if (s.profiles.length === 0) return 0;
  const daySets = s.profiles.map((p) => new Set(p.activeDays));
  const allActive = (key: string) => daySets.every((set) => set.has(key));
  let streak = 0;
  const cursor = new Date();
  // a streak survives if today isn't done yet, so allow starting from yesterday
  if (!allActive(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (allActive(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function profilesActiveToday(s: AppState): number {
  const today = todayKey();
  return s.profiles.filter((p) => p.lastActiveDay === today).length;
}
