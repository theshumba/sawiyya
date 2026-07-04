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
import { ALPHABET } from "../content/signs";
import { isDue, newStoredCard, rateCard, type SrsOutcome } from "./srs";

/** Daily soft cap on reviews (H3 flood spreader) and per-session card count. */
export const REVIEW_DAILY_CAP = 30;
export const REVIEW_SESSION_SIZE = 10;
/** ts-fsrs State.Review — a card that has graduated out of (re)learning. */
const FSRS_STATE_REVIEW = 2;

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
  /** Deactivate every active flag RAISED BY this profile (H7-scoped clear-all). */
  clearFlags: (byProfileId: string) => void;
  /** Record a completed drill for the active profile: XP + streak + SRS + mastery. */
  recordDrillResult: (
    signId: string,
    outcome: SrsOutcome,
    opts?: {
      selfMark?: boolean;
      camera?: boolean;
      matched?: boolean;
      watch?: boolean;
      /** The match was confirmed only by the learner's own KNN recording, not
       *  the dataset MLP — counted separately as ownRecordingMatches (M2). */
      ownRecording?: boolean;
    },
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
  ownRecordingMatches: 0,
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
        // Consume the corrupt blob so the recovery notice fires ONCE — leaving
        // it re-armed the "one-time" notice on every launch until the next
        // store write happened to overwrite it.
        localStorage.removeItem(name);
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

// Deep-normalize the nested per-profile maps: a hand-edited or stale import
// (H8) can carry ANY shape here, and one null card would crash isDue on the
// Home render path — bricking boot behind the error boundary. Malformed
// entries are dropped (a dropped card simply resurfaces as new); malformed
// numbers coerce (an invalid `due` string self-heals to due-now via L16).
function normalizeProgress(v: unknown): AppState["progress"] {
  if (!isRecord(v)) return {};
  const out: AppState["progress"] = {};
  for (const [pid, signs] of Object.entries(v)) {
    // JSON.parse creates "__proto__" as an OWN key; assigning it below would
    // swap the map's prototype instead of storing the entry. Drop it.
    if (pid === "__proto__") continue;
    if (!isRecord(signs)) continue;
    const clean: Record<string, SignProgress> = {};
    for (const [sid, sp] of Object.entries(signs)) {
      if (sid === "__proto__") continue;
      if (!isRecord(sp)) continue;
      const p = sp as Partial<SignProgress>;
      clean[sid] = {
        masteryLevel: finiteOr(p.masteryLevel, 0),
        lastSeen: typeof p.lastSeen === "string" ? p.lastSeen : new Date().toISOString(),
        cameraHits: finiteOr(p.cameraHits, 0),
      };
    }
    out[pid] = clean;
  }
  return out;
}

function normalizeSrs(v: unknown): AppState["srs"] {
  if (!isRecord(v)) return {};
  const out: AppState["srs"] = {};
  for (const [pid, cards] of Object.entries(v)) {
    if (pid === "__proto__") continue; // see normalizeProgress
    if (!isRecord(cards)) continue;
    const clean: Record<string, StoredCard> = {};
    for (const [sid, c] of Object.entries(cards)) {
      if (sid === "__proto__") continue;
      if (!isRecord(c)) continue;
      const k = c as Partial<StoredCard>;
      clean[sid] = {
        due: typeof k.due === "string" ? k.due : new Date().toISOString(),
        stability: finiteOr(k.stability, 0),
        difficulty: finiteOr(k.difficulty, 0),
        elapsed_days: finiteOr(k.elapsed_days, 0),
        scheduled_days: finiteOr(k.scheduled_days, 0),
        reps: finiteOr(k.reps, 0),
        lapses: finiteOr(k.lapses, 0),
        state: finiteOr(k.state, 0),
        last_review: typeof k.last_review === "string" ? k.last_review : undefined,
      };
    }
    out[pid] = clean;
  }
  return out;
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
          // Enum-ish fields validate against their unions — a hand-edited
          // import with role "boss" / language "xx" used to NaN the goal ring
          // and blank every t() label.
          role:
            pr.role === "parent" || pr.role === "sibling" || pr.role === "teacher" ||
            pr.role === "friend" || pr.role === "deaf"
              ? pr.role
              : "parent",
          emoji: typeof pr.emoji === "string" ? pr.emoji : AVATARS[0],
          dominantHand: pr.dominantHand === "L" ? "L" : "R",
          language: pr.language === "ar" ? "ar" : "en",
          xp: finiteOr(pr.xp, 0),
          xpToday: finiteOr(pr.xpToday, 0),
          reviewsToday: finiteOr(pr.reviewsToday, 0),
          streak: finiteOr(pr.streak, 0),
          lastActiveDay: typeof pr.lastActiveDay === "string" ? pr.lastActiveDay : null,
          activeDays: Array.isArray(pr.activeDays)
            ? pr.activeDays.filter((d): d is string => typeof d === "string")
            : [],
          dailyGoal:
            pr.dailyGoal === "casual" || pr.dailyGoal === "serious" ? pr.dailyGoal : "regular",
          createdAt: typeof pr.createdAt === "string" ? pr.createdAt : new Date().toISOString(),
        };
      })
    : current.profiles;
  // NO blind `...p` spread: a hostile/hand-edited import could smuggle keys
  // that collide with store ACTION names (e.g. {"toggleFlag": 42}) and brick
  // the app permanently. Only the explicit whitelist below is restored.
  return {
    ...current,
    onboarded: p.onboarded === true,
    profiles,
    activeProfileId:
      typeof p.activeProfileId === "string" && profiles.some((pr) => pr.id === p.activeProfileId)
        ? p.activeProfileId
        : (profiles[0]?.id ?? null),
    progress: normalizeProgress(p.progress),
    srs: normalizeSrs(p.srs),
    // Flags written before supporters/archived existed (pre-Batch-5) backfill
    // cleanly; malformed entries are dropped rather than crashing selectors.
    flags: Array.isArray(p.flags)
      ? p.flags
          .filter(isRecord)
          .map((raw) => {
            const f = raw as Partial<Flag>;
            return {
              id: typeof f.id === "string" ? f.id : uid("flag"),
              raisedByProfileId:
                typeof f.raisedByProfileId === "string" ? f.raisedByProfileId : "",
              supporters: Array.isArray(f.supporters)
                ? f.supporters.filter((x): x is string => typeof x === "string")
                : [],
              signId: typeof f.signId === "string" ? f.signId : "",
              active: f.active !== false,
              archived: f.archived === true,
              createdAt:
                typeof f.createdAt === "string" ? f.createdAt : new Date().toISOString(),
            };
          })
          .filter((f) => f.signId !== "")
      : [],
    // Metrics coerce field-by-field like every other slice — a spread let
    // string/object values through, and `drillsCompleted + 1` on a string
    // silently corrupts the honesty counters forever after.
    metrics: (() => {
      const m = isRecord(p.metrics) ? (p.metrics as Partial<Metrics>) : {};
      return {
        appFirstOpenAt:
          typeof m.appFirstOpenAt === "string"
            ? m.appFirstOpenAt
            : current.metrics.appFirstOpenAt,
        firstSignMs:
          typeof m.firstSignMs === "number" && Number.isFinite(m.firstSignMs)
            ? m.firstSignMs
            : null,
        drillsCompleted: finiteOr(m.drillsCompleted, 0),
        cameraAttempts: finiteOr(m.cameraAttempts, 0),
        cameraMatches: finiteOr(m.cameraMatches, 0),
        ownRecordingMatches: finiteOr(m.ownRecordingMatches, 0),
        selfMarks: finiteOr(m.selfMarks, 0),
        lessonsCompleted: finiteOr(m.lessonsCompleted, 0),
      };
    })(),
  };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
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
          reviewsToday: 0,
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
          // 1. SRS — watch drills NEVER rate the card (M3): passive exposure must
          //    not schedule recall or count as it. Everything else rates; drilling
          //    an already-due card is by definition a review (feeds the H3 cap).
          const prevSrs = s.srs[activeProfileId] ?? {};
          const profileSrs = { ...prevSrs };
          const wasReview = !opts.watch && !!prevSrs[signId] && isDue(prevSrs[signId]);
          let ratedCard: StoredCard | null = null;
          if (!opts.watch) {
            ratedCard = rateCard(profileSrs[signId] ?? newStoredCard(), outcome);
            profileSrs[signId] = ratedCard;
          }

          // 2. Mastery: 1 seen → 2 practised → 3 mastered. Level 3 is gated hard
          //    (M4): FSRS state Review AND stability ≥ 2 days AND ≥ 2 camera-
          //    confirmed successes — watch reps and self-marks can never farm it.
          const profileProg = { ...(s.progress[activeProfileId] ?? {}) };
          const prevP = profileProg[signId];
          const prev = prevP?.masteryLevel ?? 0;
          const cameraHits = (prevP?.cameraHits ?? 0) + (opts.camera && opts.matched ? 1 : 0);
          const mastered =
            ratedCard !== null &&
            ratedCard.state === FSRS_STATE_REVIEW &&
            ratedCard.stability >= 2 &&
            cameraHits >= 2;
          const mastery =
            opts.watch || outcome === "again"
              ? Math.max(prev, 1)
              : mastered
                ? 3
                : Math.max(prev, 2);
          profileProg[signId] = {
            masteryLevel: mastery,
            lastSeen: new Date().toISOString(),
            cameraHits,
          };

          // 3. XP + streak (no hearts, no punishment — XP even on a miss)
          const success = !opts.watch && (outcome === "good" || outcome === "easy");
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
              reviewsToday: (newDay ? 0 : p.reviewsToday) + (wasReview ? 1 : 0),
              streak,
              lastActiveDay: today,
              activeDays,
            };
          });

          // 4. Metrics
          const metrics = { ...s.metrics, drillsCompleted: s.metrics.drillsCompleted + 1 };
          if (opts.camera) {
            metrics.cameraAttempts += 1;
            if (opts.matched) {
              metrics.cameraMatches += 1;
              // A real match, but confirmed only by the learner's own recording
              // (the dataset model didn't agree) — counted honestly, apart (M2).
              if (opts.ownRecording) metrics.ownRecordingMatches += 1;
            }
          }
          if (opts.selfMark) metrics.selfMarks += 1;

          // 5. Flag auto-archive (M8): when every non-raiser HEARING member has
          //    reached mastery ≥ 2 on a flagged sign, the flag archives — kept
          //    in state as history, out of the queues and Home pins.
          const flags = s.flags.map((f) => {
            if (f.signId !== signId || !f.active || f.archived) return f;
            const learners = s.profiles.filter(
              (p) => p.id !== f.raisedByProfileId && p.role !== "deaf",
            );
            const done =
              learners.length > 0 &&
              learners.every((p) => {
                const lvl =
                  p.id === activeProfileId
                    ? mastery
                    : (s.progress[p.id]?.[signId]?.masteryLevel ?? 0);
                return lvl >= 2;
              });
            return done ? { ...f, archived: true } : f;
          });

          return {
            srs: { ...s.srs, [activeProfileId]: profileSrs },
            progress: { ...s.progress, [activeProfileId]: profileProg },
            profiles,
            metrics,
            flags,
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

      toggleFlag: (signId, byProfileId) =>
        set((s) => {
          const existing = s.flags.find((f) => f.signId === signId && f.active && !f.archived);
          const by = s.profiles.find((p) => p.id === byProfileId);
          if (existing) {
            // H7: only the raiser or a deaf-role member can deactivate a flag.
            // Anyone else tapping an already-flagged sign is a CO-REQUEST —
            // added to supporters, never a silent toggle-off of the Deaf
            // member's curriculum.
            const canDeactivate =
              existing.raisedByProfileId === byProfileId || by?.role === "deaf";
            if (canDeactivate) {
              return {
                flags: s.flags.map((f) =>
                  f.id === existing.id ? { ...f, active: false } : f,
                ),
              };
            }
            if (existing.supporters.includes(byProfileId)) return s;
            return {
              flags: s.flags.map((f) =>
                f.id === existing.id
                  ? { ...f, supporters: [...f.supporters, byProfileId] }
                  : f,
              ),
            };
          }

          // M8: if every non-raiser hearing member ALREADY has mastery >= 2,
          // the flag archives (and celebrates into the honeycomb) immediately —
          // the drill-completion check alone would leave such a flag pinned
          // forever, since nobody needs to re-drill a mastered sign.
          const learners = s.profiles.filter(
            (p) => p.id !== byProfileId && p.role !== "deaf",
          );
          const alreadyDone =
            learners.length > 0 &&
            learners.every(
              (p) => (s.progress[p.id]?.[signId]?.masteryLevel ?? 0) >= 2,
            );

          const flag: Flag = {
            id: uid("flag"),
            raisedByProfileId: byProfileId,
            supporters: [],
            signId,
            active: true,
            archived: alreadyDone,
            createdAt: new Date().toISOString(),
          };

          // H4: "everyone's queue follows" must be true — seed a due-now card
          // into every NON-RAISER profile's SRS (never overwriting an existing
          // card, which would reset real scheduling history). Skipped when the
          // flag archived on creation — an already-mastered sign must not jump
          // anyone's queue.
          const srs = { ...s.srs };
          if (!alreadyDone) {
            for (const p of s.profiles) {
              if (p.id === byProfileId) continue;
              const cards = srs[p.id] ?? {};
              if (!cards[signId]) srs[p.id] = { ...cards, [signId]: newStoredCard() };
            }
          }

          // H6: flagging is the DEAF member's real participation — it counts as
          // their active day (streak/day-set) without minting XP. Scoped to the
          // deaf role per the pinned decision: a hearing member must not be able
          // to farm the household streak by flagging instead of practising.
          const today = todayKey();
          const yesterday = yesterdayKey();
          const profiles =
            by?.role === "deaf"
              ? s.profiles.map((p) => {
                  if (p.id !== byProfileId || p.lastActiveDay === today) return p;
                  return {
                    ...p,
                    streak: p.lastActiveDay === yesterday ? p.streak + 1 : 1,
                    lastActiveDay: today,
                    activeDays: [...p.activeDays, today].slice(-90),
                  };
                })
              : s.profiles;

          return { flags: [...s.flags, flag], srs, profiles };
        }),

      // H7: "Clear all" clears only the CALLER's own raised flags — never the
      // Deaf member's curriculum.
      clearFlags: (byProfileId) =>
        set((s) => ({
          flags: s.flags.map((f) =>
            f.active && !f.archived && f.raisedByProfileId === byProfileId
              ? { ...f, active: false }
              : f,
          ),
        })),

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

// M22: a second tab's write was last-write-wins over whatever the first tab
// held in memory — a card rated in tab A vanished the moment tab B's next
// action re-saved its stale snapshot. `storage` only fires in OTHER tabs (per
// the spec), so re-reading from localStorage here can't create a self-loop.
// `event.key === null` covers `localStorage.clear()`.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORE_KEY && event.key !== null) return;
    // A WIPE in another tab (Privacy "erase everything", the error boundary's
    // reset, localStorage.clear()) must not be resurrected by this one:
    // rehydrate() on an empty key merges undefined into the CURRENT state, so
    // this tab would keep everything and its next set() would re-persist the
    // data the user just confirm-deleted. Reload instead — this tab boots
    // fresh, exactly like the tab that wiped.
    if (localStorage.getItem(STORE_KEY) === null) {
      window.location.reload();
      return;
    }
    void useApp.persist.rehydrate();
  });
}

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

/**
 * Current streak, derived at read time (M26). Like `xpToday`, the stored
 * `streak` is only reset inside recordDrillResult on the first drill after a
 * lapse — so a lapsed learner would otherwise keep seeing their old streak
 * until a drill silently knocked it down to 1. A streak is only alive if the
 * profile was active today or yesterday.
 */
export function streakFor(p: Profile): number {
  return p.lastActiveDay === todayKey() || p.lastActiveDay === yesterdayKey()
    ? p.streak
    : 0;
}

/**
 * Reviews done today, derived at read time like xpToday — the stored counter is
 * only reset inside recordDrillResult on a new day's first drill, so a fresh
 * morning reads 0 here even before that reset lands (H3 daily cap).
 */
export function reviewsTodayFor(p: Profile): number {
  return p.lastActiveDay === todayKey() ? p.reviewsToday : 0;
}

/**
 * Next new letter to learn when the queue is empty (M5 starvation fix): the
 * first letter in curriculum order with no SRS card yet for this profile.
 * ALPHABET is in standard Arabic order — the same order the Step-3 letter
 * groups follow — and edge forms (not cameraGradable) are skipped.
 */
export function nextNewLetterId(s: AppState, profileId: string): string | null {
  const cards = s.srs[profileId] ?? {};
  return ALPHABET.find((l) => l.cameraGradable && !cards[l.id])?.id ?? null;
}

/** Live flags, newest first (PRD §6.7) — archived flags are history, not queue. */
export function activeFlags(s: AppState): Flag[] {
  return s.flags.filter((f) => f.active && !f.archived).slice().reverse();
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

/** Signs the whole household can do — the shared board (PRD §6.7). H6: the Deaf
 *  member directs the curriculum and already knows the signs, so the
 *  intersection covers HEARING members only — the board must never sit empty
 *  because the one person it's for "hasn't drilled" it. */
export function signsAllCanDo(s: AppState): string[] {
  const hearing = s.profiles.filter((p) => p.role !== "deaf");
  if (hearing.length === 0) return [];
  const sets = hearing.map((p) =>
    new Set(
      Object.entries(s.progress[p.id] ?? {})
        .filter(([, pr]) => pr.masteryLevel >= 3)
        .map(([signId]) => signId),
    ),
  );
  const [first, ...rest] = sets;
  const mastered = [...first].filter((id) => rest.every((set) => set.has(id)));
  // M8: a completed (archived) flag "celebrates into the honeycomb" — the
  // family finished the Deaf member's request. Without this, non-gradable
  // signs (mastery capped at 2 — no camera confirmation possible) could
  // archive out of the flag list yet never reach the ≥3 board: the sign
  // would silently vanish instead of celebrating.
  const archivedSigns = s.flags.filter((f) => f.archived).map((f) => f.signId);
  return [...new Set([...mastered, ...archivedSigns])];
}

/** Household streak: consecutive days (ending today/yesterday) where every
 *  HEARING profile was active (H6 — the Deaf member's day-set is excluded;
 *  their flagging still marks their own active day for the member row). */
export function householdStreak(s: AppState): number {
  const hearing = s.profiles.filter((p) => p.role !== "deaf");
  if (hearing.length === 0) return 0;
  const daySets = hearing.map((p) => new Set(p.activeDays));
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
