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
import { ALPHABET, lessonById, signById } from "../content/signs";
import { hasHandShape } from "../components/HandSkeleton";
import type { DrillSpec, Lesson, Sign } from "../types";

const MAX_DRILLS = 12;
const MAX_CAMERA = 2;
const MAX_RECALL = 2;
const MAX_REVIEW = 2;
/** Recognise checkpoints closing an alphabet lesson (H22). */
const CHECKPOINTS = 3;

/** H23: a sign may be a recognise STIMULUS only when we can honestly SHOW it —
 *  a real averaged handshape skeleton or real signer footage. Everything else
 *  would render as the same generic icon, making "what does this sign mean?"
 *  unanswerable; those signs drill as recall (meaning → pick the sign) instead. */
export function hasVisual(sign: Sign): boolean {
  return hasHandShape(sign.id) || !!sign.media;
}

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
  if (lesson.unitId === "alpha-u1") return buildAlphabetQueue(lesson, state, profileId);
  const prog = state.progress[profileId] ?? {};

  const queue: DrillSpec[] = [];

  // teach: watch every sign not yet practised; then quiz every sign — recognise
  // only when the sign has a real visual to show (H23), recall otherwise
  for (const signId of lesson.signIds) {
    if ((prog[signId]?.masteryLevel ?? 0) < 2) queue.push({ type: "watch", signId });
  }
  for (const signId of lesson.signIds) {
    const sign = signById(signId);
    queue.push({ type: sign && hasVisual(sign) ? "recognise" : "recall", signId });
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

  // review: due SRS cards from anywhere jump in (flagged signs already lead) —
  // visual-less signs become recall here too (H23: no stimulus to recognise)
  const due = dueSignIds(state, profileId).filter((id) => !lesson.signIds.includes(id));
  for (const signId of due.slice(0, MAX_REVIEW)) {
    const sign = signById(signId);
    queue.push({ type: sign && hasVisual(sign) ? "review" : "recall", signId });
  }

  // cap: keep all watch drills (they teach), trim the rest from the end
  if (queue.length > MAX_DRILLS) {
    const watches = queue.filter((d) => d.type === "watch");
    const rest = queue.filter((d) => d.type !== "watch");
    return [...watches, ...rest.slice(0, Math.max(0, MAX_DRILLS - watches.length))];
  }
  return queue;
}

/** Alphabet lesson queue (H22) — the pinned per-letter loop: watch the real
 *  handshape (until practised), sign it back on camera, then close the group
 *  with recognise checkpoints whose choices come ONLY from letters the learner
 *  has met. Over the 12-drill cap the non-watch tail is dropped, so a fresh
 *  7-letter lesson completes across two passes rather than one marathon. */
function buildAlphabetQueue(
  lesson: Lesson,
  state: AppState,
  profileId: string,
): DrillSpec[] {
  const prog = state.progress[profileId] ?? {};
  const mastery = (id: string) => prog[id]?.masteryLevel ?? 0;

  const queue: DrillSpec[] = [];
  for (const signId of lesson.signIds) {
    if (mastery(signId) < 2) queue.push({ type: "watch", signId });
    queue.push({ type: "camera", signId });
  }

  // Checkpoint pool = this lesson's letters (all watched above, in-session) +
  // every seeded letter already met — never a stranger as stimulus or choice.
  const met = ALPHABET.filter((l) => l.cameraGradable && mastery(l.id) >= 1).map(
    (l) => l.id,
  );
  const pool = [...new Set([...lesson.signIds, ...met])];
  for (const signId of shuffle([...lesson.signIds]).slice(0, CHECKPOINTS)) {
    queue.push({ type: "recognise", signId, pool });
  }

  // cap: watches teach and always survive; drop other drills from the end
  for (let i = queue.length - 1; queue.length > MAX_DRILLS && i >= 0; i--) {
    if (queue[i].type !== "watch") queue.splice(i, 1);
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
      // The 28 seeded letters (type "alphabet" + cameraGradable) grade via the
      // bundled MLP — they are camera-ready BY CONSTRUCTION. isTrained() alone
      // reads the KNN stores, and since M13 the bundled seeds live on a lazy
      // chunk that only CameraTrainer loads, so on a fresh session the review
      // queue silently downgraded every due letter to receptive drills unless
      // a camera screen happened to mount first.
      if (sign?.cameraGradable && (sign.type === "alphabet" || isTrained(signId))) {
        return { type: "camera", signId } satisfies DrillSpec;
      }
      // H23: a sign with no honest visual can't be a recognise stimulus
      if (!sign || !hasVisual(sign)) {
        return { type: "recall", signId } satisfies DrillSpec;
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
