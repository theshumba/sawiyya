// Stages — how far along the learner is, and how the app introduces itself over
// time (Phase 3 of the 2026-08-01 UX audit, docs/ux-audit-2026-08-01/07-THE-PLAN.md).
//
// Two ordered const arrays and a handful of pure functions. ARRAY ORDER IS THE
// PRIORITY: that single rule is what keeps this from turning into a rules engine
// with per-step conditions nobody can predict.
//
// Naming, deliberately: these are STEPS, not milestones. `lesson/milestones.ts`
// already owns the word for the mastery ladder that Home's treasure chest and
// Progress's "Next milestone" both read, and two ladders sharing one noun is the
// exact defect Phase 4 is scheduled to clean up elsewhere in the app. The plan
// text calls them both names in the same breath (point 1 "MILESTONES", point 4
// "STEPS.find(...)"); STEPS is the one that does not collide.
import type { Screen } from "../store/ui";

export type StepId =
  | "first-sign"
  | "first-lesson"
  | "install"
  | "first-review"
  | "first-flag"
  | "first-unit";

export interface JourneyStep {
  id: StepId;
  en: string;
  ar: string;
  bodyEn: string;
  bodyAr: string;
  /** Where the row goes when tapped. `install` has none: it opens instructions,
   *  because no screen in this app can install it. */
  go?: Screen;
  /**
   * Steps this one PROVES already happened. Reaching a step banks these too, so
   * a skipped step cannot wedge the pointer forever (plan point 5).
   *
   * The plan words that rule positionally — "completing a later milestone marks
   * the earlier ones done" — and taken literally it lies. Raising a flag is
   * fifth in this list and takes one tap on day one, with no drill and no
   * lesson behind it; positional backfill would tick both. Entailment is listed
   * per step instead, and it is only ever listed where it is actually true.
   * Nothing is wedged by the difference: everything that entails nothing is
   * dismissible instead.
   */
  entails: StepId[];
  /** Can the learner put it aside? Every step the app cannot make happen on its
   *  own, or the pointer parks forever on the one they never intend to do. */
  dismissible: boolean;
  /**
   * Does the trail on Home already carry this action? Phase 1 deleted Home's
   * card stack because it offered nine answers to "what do I do now". Home's
   * strip therefore shows a step ONLY when the trail cannot: install, review,
   * the family flag. First sign / first lesson / first unit ARE the trail.
   */
  onTrail: boolean;
  /** Extra condition before the step is worth offering. "due" = there is at
   *  least one card ready, or "try a review" lands on a screen with no review. */
  needs?: "due";
}

/** The ladder. Order is the priority; nothing else ranks these. */
export const STEPS: JourneyStep[] = [
  {
    id: "first-sign",
    en: "Sign your first letter",
    ar: "أشِر أول حرف",
    bodyEn: "One letter to the camera. That's the whole app in ten seconds.",
    bodyAr: "حرف واحد أمام الكاميرا. هذا هو التطبيق كله في عشر ثوانٍ.",
    go: { name: "home" },
    entails: [],
    dismissible: false,
    onTrail: true,
  },
  {
    id: "first-lesson",
    en: "Finish your first lesson",
    ar: "أكمل درسك الأول",
    bodyEn: "A lesson mixes watching, choosing and signing back.",
    bodyAr: "الدرس يمزج المشاهدة والاختيار وإعادة الإشارة.",
    go: { name: "home" },
    entails: ["first-sign"],
    dismissible: false,
    onTrail: true,
  },
  {
    id: "install",
    // Point 7 of the plan, worded exactly this way on purpose: "install the app"
    // is jargon for what is really at stake. Every scrap of a learner's progress
    // lives in this browser's localStorage, and iOS Safari deletes it after
    // seven unused days — installed web apps are exempt.
    en: "Keep your progress",
    ar: "احفظ تقدّمك",
    bodyEn: "Add Sawiyya to your home screen so this phone stops forgetting you.",
    bodyAr: "أضف سويّة إلى شاشتك الرئيسية حتى لا ينساك هذا الهاتف.",
    entails: [],
    dismissible: true,
    onTrail: false,
  },
  {
    id: "first-review",
    en: "Do a review",
    ar: "راجِع",
    bodyEn: "Signs come back a day later, then a week. That's what makes them stick.",
    bodyAr: "تعود الإشارات بعد يوم، ثم بعد أسبوع. هكذا ترسخ.",
    go: { name: "practiseChooser" },
    // A review is a drill on a card you already hold, so it proves a first
    // sign — but NOT a finished lesson: the queue is reachable from Practise
    // long before the trail's first node is behind you.
    entails: ["first-sign"],
    dismissible: true,
    onTrail: false,
    needs: "due",
  },
  {
    id: "first-flag",
    en: "Ask for a sign",
    ar: "اطلب إشارة",
    bodyEn: "Flag what your household actually needs, and everyone's practice follows it.",
    bodyAr: "حدّد ما تحتاجه أسرتك فعلًا، وسيتبعه تدريب الجميع.",
    go: { name: "family" },
    // Entails nothing at all: flagging is one tap, available from the first
    // minute, and proves no drill, no lesson and no review.
    entails: [],
    dismissible: true,
    onTrail: false,
  },
  {
    id: "first-unit",
    en: "Finish a whole unit",
    ar: "أكمل وحدة كاملة",
    bodyEn: "Every lesson in one unit, behind you.",
    bodyAr: "كل دروس وحدة واحدة، خلفك.",
    go: { name: "home" },
    entails: ["first-sign", "first-lesson"],
    dismissible: false,
    onTrail: true,
  },
];

/** Derived, never stored (plan point 3) — so adding or removing a stage needs no
 *  migration and nobody is left holding a stage that no longer exists. */
export type Stage = "new" | "started" | "learning" | "settled";

export function stepById(id: string): JourneyStep | undefined {
  return STEPS.find((s) => s.id === id);
}

/** The one canonical next action: the first step neither done nor put aside. */
export function nextStep(
  done: ReadonlySet<string>,
  dismissed: ReadonlySet<string> = new Set(),
): JourneyStep | null {
  return STEPS.find((s) => !done.has(s.id) && !dismissed.has(s.id)) ?? null;
}

export function stageOf(
  done: ReadonlySet<string>,
  dismissed: ReadonlySet<string> = new Set(),
): Stage {
  if (nextStep(done, dismissed) === null) return "settled";
  if (done.size === 0) return "new";
  return done.has("first-lesson") ? "learning" : "started";
}

/**
 * Everything reaching `id` proves — the step itself plus the transitive closure
 * of `entails`, returned in ladder order. Closure rather than a flat read so a
 * future edit that adds a step in the middle cannot silently drop a link.
 */
export function stepsImpliedBy(id: StepId): StepId[] {
  const seen = new Set<StepId>();
  const walk = (x: StepId) => {
    if (seen.has(x)) return; // also the cycle guard
    seen.add(x);
    for (const e of stepById(x)?.entails ?? []) walk(e);
  };
  walk(id);
  return STEPS.filter((s) => seen.has(s.id)).map((s) => s.id);
}

/** Is this step worth offering right now? Keeps "do a review" off the screen
 *  when tapping it would land on a Practise tab with nothing due. */
export function isActionable(step: JourneyStep, ctx: { dueCount: number }): boolean {
  return step.needs !== "due" || ctx.dueCount > 0;
}

// ── hints ────────────────────────────────────────────────────────────────────
// Plan point 8: hints live in EMPTY STATES, never in a front-loaded tour, which
// tested worse than nothing. The session budget (one hint, and never on the
// screen the app launched on) lives in ./hints.ts — this array is just content.

export type HintPlace = "family-board" | "progress-due" | "progress-league";

export interface Hint {
  id: string;
  place: HintPlace;
  /** Bump to re-introduce a changed feature to learners who already saw it. */
  rev: number;
  en: string;
  ar: string;
}

export const HINTS: Hint[] = [
  {
    id: "hint-family-board",
    place: "family-board",
    rev: 1,
    en: "A sign lands here once every hearing member has mastered it — camera-checked twice, not self-marked.",
    ar: "تظهر الإشارة هنا عندما يتقنها كل فرد سامع — بتحقّق الكاميرا مرتين، لا بتقييم ذاتي.",
  },
  {
    id: "hint-progress-due",
    place: "progress-due",
    rev: 1,
    en: "Reviews appear on their own schedule: a day after you first sign something, then longer each time you get it right.",
    ar: "تظهر المراجعات وفق جدولها: بعد يوم من أول إشارة، ثم مدة أطول كلما أصبتها.",
  },
  {
    id: "hint-progress-league",
    place: "progress-league",
    rev: 1,
    en: "Add the person you're learning to sign with, and they get their own progress on this device.",
    ar: "أضف من تتعلّم الإشارة من أجله، وسيحصل على تقدّمه الخاص على هذا الجهاز.",
  },
];

// ── announcements ────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  rev: number;
}

/**
 * Features that mark themselves NEW for learners who already know the app.
 *
 * Empty today, and that is the point of shipping it empty: plan point 9's
 * cold-start rule cannot be retrofitted. A learner who onboards this week has
 * met everything the app currently has, so when the first announcement does
 * ship they must not meet five "new" badges at once. The only moment we can
 * write that down is their genuinely first run — which is now.
 */
export const ANNOUNCEMENTS: Announcement[] = [];

/** The `seen` map a genuinely first run starts with: every current rev already
 *  acknowledged. Hints are NOT seeded — they are teaching, not novelty, and a
 *  brand-new learner is exactly who they are for. */
export function coldStartSeen(list: readonly Announcement[] = ANNOUNCEMENTS): Record<string, number> {
  return Object.fromEntries(list.map((a) => [a.id, a.rev]));
}

/** Has this surface changed since the learner last acknowledged it? */
export function isUnseen(id: string, rev: number, seen: Record<string, number>): boolean {
  return seen[id] !== rev;
}
