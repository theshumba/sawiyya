// In-browser teach-mode KNN classifier — PRD §9.2 "live teach mode".
// kinivi-style: record N samples of a handshape → classify live.
// Samples live in localStorage; nothing ever leaves the device.
import { euclidean } from "./normalize";

const STORE_KEY = "sawiyya.knn.v1";
const K = 7;
const MAX_SAMPLES_PER_CLASS = 48;
/** Distance gate — beyond this (mean of the top-K) the neighbours aren't credible. */
const DISTANCE_GATE = 0.55;
/** Minimum vote-share lead the winning class must hold over the runner-up. */
const MARGIN_GATE = 0.15;

export interface TargetClassification {
  /** 0..1 weighted vote share of the *target* class within the top-K. */
  confidence: number;
  /** True iff the target is the winning class, confident, and clear of the runner-up. */
  matched: boolean;
}

type SampleStore = Record<string, number[][]>;

function load(): SampleStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as SampleStore) : {};
  } catch {
    return {};
  }
}

let cache: SampleStore | null = null;

function store(): SampleStore {
  if (!cache) cache = load();
  return cache;
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store()));
  } catch {
    // storage full — drop oldest samples across classes and retry once
    const s = store();
    for (const id of Object.keys(s)) s[id] = s[id].slice(-16);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch {
      /* give up quietly — teach mode still works in-memory */
    }
  }
}

export function addSample(classId: string, vec: number[]) {
  const s = store();
  const arr = s[classId] ?? (s[classId] = []);
  arr.push(vec.map((v) => Math.round(v * 1000) / 1000)); // 3dp — compact storage
  if (arr.length > MAX_SAMPLES_PER_CLASS) arr.splice(0, arr.length - MAX_SAMPLES_PER_CLASS);
  save();
}

export function clearClass(classId: string) {
  const s = store();
  delete s[classId];
  save();
}

export function sampleCount(classId: string): number {
  return store()[classId]?.length ?? 0;
}

export function trainedClassIds(): string[] {
  return Object.keys(store()).filter((id) => store()[id].length >= 4);
}

export function isTrained(classId: string): boolean {
  return sampleCount(classId) >= 8;
}

/**
 * Weighted-vote KNN graded **against a specific target class** (PRD §9.5).
 *
 * The grader must answer "is the learner signing *this* sign?", not "which of all
 * trained classes is nearest?". The global-argmax form silently failed once more
 * than one class was trained (the alphabet alone is 32): another class could win
 * the vote and the target's meter would stick at 0% even when signed correctly.
 *
 * Here `confidence` is the target's own vote share within the top-K, and a match
 * requires the target to be the *winning* class, confident (≥ TAU), and clear of
 * the runner-up by MARGIN_GATE. The credibility gate uses the **mean** of the
 * top-K distances rather than a single nearest neighbour, so one stray/mislabelled
 * sample can no longer wave an out-of-distribution handshape through.
 */
export function classifyAgainst(vec: number[], targetId: string): TargetClassification {
  const s = store();
  const neighbours: { classId: string; d: number }[] = [];
  for (const [classId, samples] of Object.entries(s)) {
    for (const sample of samples) {
      neighbours.push({ classId, d: euclidean(vec, sample) });
    }
  }
  if (neighbours.length === 0) return { confidence: 0, matched: false };

  neighbours.sort((a, b) => a.d - b.d);
  const top = neighbours.slice(0, Math.min(K, neighbours.length));
  const meanTopD = top.reduce((sum, n) => sum + n.d, 0) / top.length;

  const weights = new Map<string, number>();
  let total = 0;
  for (const n of top) {
    const w = 1 / (n.d + 0.05);
    weights.set(n.classId, (weights.get(n.classId) ?? 0) + w);
    total += w;
  }

  // winning class + runner-up vote weight, for the separation margin
  let bestClass: string | null = null;
  let bestW = 0;
  let secondW = 0;
  for (const [classId, w] of weights) {
    if (w > bestW) {
      secondW = bestW;
      bestW = w;
      bestClass = classId;
    } else if (w > secondW) {
      secondW = w;
    }
  }

  const gated = meanTopD <= DISTANCE_GATE;
  const targetShare = (weights.get(targetId) ?? 0) / total;
  const margin = (bestW - secondW) / total;
  const matched =
    gated && bestClass === targetId && targetShare >= TAU && margin >= MARGIN_GATE;

  // Surface the target's share (zeroed when not credible) so the meter tracks the
  // learner's progress toward *this* sign, never a competing class.
  return { confidence: gated ? targetShare : 0, matched };
}

/** Conservative match threshold (PRD §9.5 — favour encouragement). */
export const TAU = 0.78;
