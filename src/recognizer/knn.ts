// In-browser teach-mode KNN classifier — PRD §9.2 "live teach mode".
// kinivi-style: record N samples of a handshape → classify live.
// Samples live in localStorage; nothing ever leaves the device.
import { euclidean } from "./normalize";

const STORE_KEY = "sawiyya.knn.v1";
const K = 7;
const MAX_SAMPLES_PER_CLASS = 48;
/** Distance gate — beyond this the nearest neighbours aren't credible. */
const DISTANCE_GATE = 0.55;

export interface Classification {
  classId: string | null;
  confidence: number; // 0..1 weighted vote share of the top class
  nearest: number; // distance of single nearest neighbour
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

/** Weighted-vote KNN over all trained classes. */
export function classify(vec: number[]): Classification {
  const s = store();
  const neighbours: { classId: string; d: number }[] = [];
  for (const [classId, samples] of Object.entries(s)) {
    for (const sample of samples) {
      neighbours.push({ classId, d: euclidean(vec, sample) });
    }
  }
  if (neighbours.length === 0) return { classId: null, confidence: 0, nearest: Infinity };

  neighbours.sort((a, b) => a.d - b.d);
  const top = neighbours.slice(0, Math.min(K, neighbours.length));
  const weights = new Map<string, number>();
  let total = 0;
  for (const n of top) {
    const w = 1 / (n.d + 0.05);
    weights.set(n.classId, (weights.get(n.classId) ?? 0) + w);
    total += w;
  }
  let best: string | null = null;
  let bestW = 0;
  for (const [classId, w] of weights) {
    if (w > bestW) {
      bestW = w;
      best = classId;
    }
  }
  const nearest = top[0].d;
  // confidence = vote share, zeroed if even the nearest neighbour is far away
  const confidence = nearest > DISTANCE_GATE ? 0 : bestW / total;
  return { classId: best, confidence, nearest };
}

/** Conservative match threshold (PRD §9.5 — favour encouragement). */
export const TAU = 0.78;
