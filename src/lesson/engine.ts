// Lesson engine — Tier → Unit → Lesson → Drill[] (PRD §6.3).
// Rules: mix receptive + productive; camera drills only for static gradable
// signs; never hard-fail; SRS review items surface inside lessons.
import type { AppState } from "../store/app";
import {
  dueSignIds,
  reviewsTodayFor,
  REVIEW_DAILY_CAP,
  REVIEW_SESSION_SIZE,
} from "../store/app";
import { isTrained } from "../recognizer/knn";
import { lessonById, signById } from "../content/signs";
import type { DrillSpec } from "../types";

const MAX_DRILLS = 12;
const MAX_CAMERA = 2;
const MAX_RECALL = 2;
const MAX_REVIEW = 2;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build the drill queue for a lesson (or the pseudo-lesson "review"). */
export function buildDrillQueue(
  lessonId: string,
  state: AppState,
  profileId: string,
): DrillSpec[] {
  if (lessonId === "review") return buildReviewQueue(state, profileId);

  const lesson = lessonById(lessonId);
  if (!lesson) return [];
  const prog = state.progress[profileId] ?? {};

  const queue: DrillSpec[] = [];

  // teach: watch every sign not yet practised, recognise every sign
  for (const signId of lesson.signIds) {
    if ((prog[signId]?.masteryLevel ?? 0) < 2) queue.push({ type: "watch", signId });
  }
  for (const signId of lesson.signIds) {
    queue.push({ type: "recognise", signId });
  }

  // productive: camera for gradable statics (§9.4), recall for the rest
  const gradable = lesson.signIds.filter((id) => signById(id)?.cameraGradable);
  for (const signId of shuffle(gradable).slice(0, MAX_CAMERA)) {
    queue.push({ type: "camera", signId });
  }
  const nonGradable = lesson.signIds.filter((id) => !signById(id)?.cameraGradable);
  for (const signId of shuffle(nonGradable).slice(0, MAX_RECALL)) {
    queue.push({ type: "recall", signId });
  }

  // review: due SRS cards from anywhere jump in (flagged signs already lead)
  const due = dueSignIds(state, profileId).filter((id) => !lesson.signIds.includes(id));
  for (const signId of due.slice(0, MAX_REVIEW)) {
    queue.push({ type: "review", signId });
  }

  // cap: keep all watch drills (they teach), trim the rest from the end
  if (queue.length > MAX_DRILLS) {
    const watches = queue.filter((d) => d.type === "watch");
    const rest = queue.filter((d) => d.type !== "watch");
    return [...watches, ...rest.slice(0, Math.max(0, MAX_DRILLS - watches.length))];
  }
  return queue;
}

/** Review session (H3 flood spreader): up to 10 cards per session, oldest-due
 *  first (flagged signs keep their queue-jump from dueSignIds), mixed drill
 *  types, hard-stopped by the daily soft cap of 30 — beyond it the queue is
 *  empty and the UI shows "30 done today — the rest will wait for tomorrow". */
function buildReviewQueue(state: AppState, profileId: string): DrillSpec[] {
  const profile = state.profiles.find((p) => p.id === profileId);
  const remaining = profile
    ? Math.max(0, REVIEW_DAILY_CAP - reviewsTodayFor(profile))
    : REVIEW_DAILY_CAP;
  return dueSignIds(state, profileId)
    .slice(0, Math.min(REVIEW_SESSION_SIZE, remaining))
    .map((signId, i) => {
      const sign = signById(signId);
      // productive review via camera when the camera already knows the shape
      if (sign?.cameraGradable && isTrained(signId)) {
        return { type: "camera", signId } satisfies DrillSpec;
      }
      // receptive mix for the rest: alternate recognise ("review") and recall
      return { type: i % 2 === 0 ? "review" : "recall", signId } satisfies DrillSpec;
    });
}

/** 4-option multiple choice: the right sign + 3 distractors from its tier. */
export function buildChoices(signId: string, pool: string[]): string[] {
  const distractors = shuffle(pool.filter((id) => id !== signId)).slice(0, 3);
  return shuffle([signId, ...distractors]);
}
