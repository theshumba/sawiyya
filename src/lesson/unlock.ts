// The trail lock — ONE rule, used by every surface that draws or enforces it.
//
// Before this module the padlock was decoration: Home rendered it from a per-sign
// mastery check, the sheet button carried a lone `disabled` attribute, and
// `#/lesson/<any-id>` played any lesson because neither LessonPlayer nor
// buildDrillQueue asked a question. i18n `pathLockedMeta` promised behaviour the
// app did not have.
//
// The rule: LESSONS is an ordered path. Your POSITION is the index of the first
// lesson you have not finished. Everything before it is behind you, the lesson at
// it is the one to do, everything after it is locked — and stays locked even if
// its own signs happen to be practised, which is what let four Words self-marks
// light up the fifth trail node on day one.
import { LESSONS } from "../content/signs";
import type { SignProgress } from "../types";

export type LessonState = "done" | "current" | "locked";

type Progress = Record<string, SignProgress>;

/** Mastery 2 = practised. Every sign in the lesson has to reach it. */
export function lessonFinished(lessonId: string, prog: Progress): boolean {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lesson) return false;
  return lesson.signIds.every((id) => (prog[id]?.masteryLevel ?? 0) >= 2);
}

/** Index of the first unfinished lesson — the learner's place on the trail.
 *  LESSONS.length once the whole path is behind them. */
export function trailPosition(prog: Progress): number {
  const i = LESSONS.findIndex((l) => !lessonFinished(l.id, prog));
  return i === -1 ? LESSONS.length : i;
}

/** done / current / locked for a lesson, read off the position — never off the
 *  lesson's own signs alone, or a lesson can complete out of order. */
export function lessonState(lessonId: string, prog: Progress): LessonState {
  const i = LESSONS.findIndex((l) => l.id === lessonId);
  if (i === -1) return "locked";
  const pos = trailPosition(prog);
  return i < pos ? "done" : i === pos ? "current" : "locked";
}

/** Can this lesson be played at all? The current one and every finished one can.
 *  "review" is the SRS pseudo-lesson: it has no place on the path and is never
 *  locked — it can only ever contain signs the learner has already met. */
export function lessonPlayable(lessonId: string, prog: Progress): boolean {
  if (lessonId === "review") return true;
  return lessonState(lessonId, prog) !== "locked";
}

/** The lesson to do next, or undefined once the path is finished. */
export function currentLessonId(prog: Progress): string | undefined {
  return LESSONS[trailPosition(prog)]?.id;
}
