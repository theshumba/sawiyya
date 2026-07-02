// FSRS wrapper (PRD §6.6) — ts-fsrs with Date↔ISO serialisation for localStorage.
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card,
  type Grade,
} from "ts-fsrs";
import type { StoredCard } from "../types";

const f = fsrs(generatorParameters({ enable_fuzz: true }));

export function newStoredCard(now = new Date()): StoredCard {
  return toStored(createEmptyCard(now));
}

function toStored(c: Card): StoredCard {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? c.last_review.toISOString() : undefined,
  };
}

function toCard(s: StoredCard): Card {
  return {
    // Self-heal a corrupt due date (L16): an invalid ISO string would otherwise
    // flow NaN through ts-fsrs scheduling. Due-now is the safe recovery.
    due: healDate(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsed_days,
    scheduled_days: s.scheduled_days,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state,
    last_review: s.last_review ? new Date(s.last_review) : undefined,
  } as Card;
}

export type SrsOutcome = "again" | "hard" | "good" | "easy";

const RATING: Record<SrsOutcome, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

/** Rate a card and get its next state. Never-hard-fail: self-marks rate "good". */
export function rateCard(stored: StoredCard, outcome: SrsOutcome, now = new Date()): StoredCard {
  const result = f.next(toCard(stored), now, RATING[outcome]);
  return toStored(result.card);
}

/** Invalid date string → due now (self-heal), never a silent NaN. */
function healDate(iso: string, now = new Date()): Date {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : now;
}

export function isDue(stored: StoredCard, now = new Date()): boolean {
  const t = new Date(stored.due).getTime();
  // A corrupt due date must surface the card, not hide it forever (L16):
  // NaN <= x is false, which would make the card silently never-due.
  if (!Number.isFinite(t)) return true;
  return t <= now.getTime();
}
