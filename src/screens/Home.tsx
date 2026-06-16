// Home → Learn tab (UX redesign §5.2). Presentation-only re-skin.
// The winding Path is the hero with EXACTLY ONE dominant action = current-node
// START. Nav duties (desktop side-nav + right dashboard rail + mobile bottom bar)
// are owned entirely by ScreenShell/AppNav now and have been stripped here.
// The camera practiceHero + alphabetCard moved OUT to the Practise chooser; only
// a slim secondary "Practise" link remains. Family flags collapse to a single
// compact FlagCard. Daily goal is one GoalCard. Review-due + milestone are
// lightweight secondary cards. Logic unchanged (contract §2) — every store hook,
// route (incl. cameraGradable→targetSignId gate + lessonId:"review"), guard and
// i18n key preserved; the old md:hidden / hidden-md:flex twin trees are collapsed
// into ONE mobile-first responsive render.
import { num, pick, t } from "../i18n";
import { signById, LESSONS, UNIT_A1_U1 } from "../content/signs";
import {
  GOAL_XP,
  activeProfile,
  dueSignIds,
  pinnedFlagSigns,
  useApp,
  xpTodayFor,
} from "../store/app";
import { useUi } from "../store/ui";
import { Card, Icon, Eyebrow, Title } from "../components/ui";
import { ScreenShell } from "../components/ScreenShell";
import { FlagCard } from "../components/FlagCard";
import { GoalCard } from "../components/GoalCard";
import { nextMilestone } from "../lesson/milestones";

export function Home() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  if (!profile) return null;
  const lang = profile.language;

  const goalXp = GOAL_XP[profile.dailyGoal];
  const xpToday = xpTodayFor(profile); // today's XP, not yesterday's stale total (#5)
  const goalProgress = xpToday / goalXp;
  const goalPct = Math.round(Math.min(1, goalProgress) * 100);

  // next lesson = first lesson with an unseen sign; falls back to L1 replay
  const prog = app.progress[profile.id] ?? {};
  const nextLesson =
    LESSONS.find((l) => l.signIds.some((id) => (prog[id]?.masteryLevel ?? 0) < 2)) ?? LESSONS[0];

  const due = dueSignIds(app, profile.id);
  const flags = pinnedFlagSigns(app, profile.id).filter(
    (f) => f.raisedByProfileId !== profile.id,
  );

  // journey node status derived from existing progress data
  const nodes = LESSONS.map((lesson) => {
    const complete = lesson.signIds.every((id) => (prog[id]?.masteryLevel ?? 0) >= 2);
    const status: "current" | "done" | "locked" =
      lesson.id === nextLesson.id ? "current" : complete ? "done" : "locked";
    return { lesson, status };
  });
  // alternating horizontal offsets along the winding path
  const offsets = ["ms-28", "me-16", "ms-20", "-ms-10"];

  const ms = nextMilestone(app, profile.id, lang);

  // Stitch CTA copy. i18n.ts is FROZEN and has no key for these strings, so the
  // dual-script literals live here (spec §1 allows documented literals when no
  // key exists). "START" is the single dominant action on the current journey node.
  const startLabel = lang === "ar" ? "ابدأ" : "START";

  const goalLabel =
    goalProgress >= 1
      ? t("homeAllDone", lang)
      : `${num(xpToday, lang)} / ${num(goalXp, lang)} ${t("xp", lang)}`;

  return (
    <ScreenShell lang={lang} chrome="tabs">
      {/* Page-specific hero header — streak + XP chips + unit. NOT navigation:
          brand + tabs + profile button live in the shared AppNav rail/bar. */}
      <header className="bg-teal text-white">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-5 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Eyebrow lang={lang} className="!text-gold/90">
                {t("homeUnit", lang)} A1·1
              </Eyebrow>
              <h1 className="font-display text-xl font-bold leading-tight md:text-2xl">
                {pick(lang, UNIT_A1_U1.titleEn, UNIT_A1_U1.titleAr)}
              </h1>
              <p className="mt-0.5 text-sm text-white/70">
                {pick(lang, `Ahlan, ${profile.displayName}`, `أهلًا، ${profile.displayName}`)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* Streak chip — gold flame + Rubik number */}
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-teal-deep/40 px-3 py-1">
                <img alt="" aria-hidden="true" className="h-6 w-6" src="brand/stitch-18.png" />
                <span className="font-display text-xl font-bold leading-none text-gold">
                  {num(profile.streak, lang)}
                </span>
                <span className="sr-only">{t("homeStreak", lang)}</span>
              </span>
              {/* XP chip */}
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-teal-deep/40 px-3.5 py-1">
                <span className="font-display text-lg font-bold leading-none text-white">
                  {num(profile.xp, lang)}
                </span>
                <span className="font-display text-[10px] font-bold uppercase tracking-widest text-white/60">
                  {t("xp", lang)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ONE responsive content column (no twin trees). */}
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-6">
        {/* The Path — hero, with exactly one dominant action (current-node START). */}
        <section
          aria-label={t("homeToday", lang)}
          className="relative w-full overflow-hidden rounded-bowl bg-sand shadow-inner aspect-[9/13] sm:aspect-[16/12]"
        >
          {/* CSS illustration — Gulf landscape (Stitch background asset unavailable) */}
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-gold/15 via-sand to-coral/10" />
            {/* far mosque skyline */}
            <div className="absolute bottom-[58%] start-[8%] h-16 w-9 rounded-t-full bg-teal/15" />
            <div className="absolute bottom-[58%] start-[20%] h-10 w-12 rounded-t-3xl bg-coral/15" />
            <div className="absolute bottom-[57%] start-[33%] h-20 w-20 rounded-t-full bg-teal/12" />
            <div className="absolute bottom-[59%] end-[12%] h-12 w-8 rounded-t-full bg-gold/25" />
            {/* dunes */}
            <div className="absolute -start-1/4 bottom-[30%] h-40 w-[150%] rounded-[100%] bg-gold/20" />
            <div className="absolute -end-1/4 bottom-[8%] h-44 w-[150%] rounded-[100%] bg-coral/10" />
            <div className="absolute -start-1/3 -bottom-12 h-40 w-[160%] rounded-[100%] bg-gold/25" />
            {/* palms */}
            <PalmTree className="absolute bottom-[42%] start-[10%] h-20" />
            <PalmTree className="absolute bottom-[18%] end-[14%] h-24" />
            <PalmTree className="absolute bottom-[4%] start-[16%] h-16" />
            {/* winding teal path */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 156"
              preserveAspectRatio="none"
            >
              <path
                d="M72 -4 C74 26, 26 30, 30 56 C34 82, 76 86, 70 112 C64 138, 36 140, 40 160"
                fill="none"
                stroke="#0F6E6A"
                strokeOpacity="0.8"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <path
                d="M72 -4 C74 26, 26 30, 30 56 C34 82, 76 86, 70 112 C64 138, 36 140, 40 160"
                fill="none"
                stroke="#FBF7EF"
                strokeOpacity="0.7"
                strokeWidth="1.6"
                strokeDasharray="4 5"
              />
            </svg>
          </div>

          {/* Nodes layer */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-evenly py-10">
            {nodes.map(({ lesson, status }, i) => {
              const title = pick(lang, lesson.titleEn, lesson.titleAr);
              if (status === "current") {
                return (
                  <div
                    key={lesson.id}
                    className={`relative flex flex-col items-center ${offsets[i % offsets.length]}`}
                  >
                    <div className="animate-pulse-ring relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-4 border-coral-deep bg-coral shadow-coral">
                      <Icon name="waving_hand" fill className="!text-5xl text-white" />
                    </div>
                    <button
                      type="button"
                      aria-label={`${startLabel} — ${title}`}
                      onClick={() => go({ name: "lesson", lessonId: lesson.id })}
                      className="extruded-coral mt-4 rounded-2xl border-2 border-coral-deep bg-coral px-8 py-3 font-display text-xl font-bold uppercase tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
                    >
                      {startLabel}
                    </button>
                    <p className="mt-2 max-w-[180px] text-center text-sm font-semibold text-teal">
                      {title}
                    </p>
                    {/* waving hand character */}
                    <img
                      alt=""
                      aria-hidden="true"
                      className="absolute -start-14 top-0 w-16 -rotate-12 rounded-3xl drop-shadow-md motion-safe:animate-rise sm:-start-20 sm:w-20"
                      src="brand/stitch-31.png"
                    />
                  </div>
                );
              }
              if (status === "done") {
                return (
                  <div
                    key={lesson.id}
                    aria-label={title}
                    className={`relative ${offsets[i % offsets.length]}`}
                  >
                    <div className="extruded-gold flex h-16 w-16 items-center justify-center rounded-full border-4 border-gold-deep bg-gold shadow-gold">
                      <Icon name="check" className="!text-3xl font-bold text-white" />
                    </div>
                    <Icon
                      name="auto_awesome"
                      fill
                      className="absolute -end-3 -top-2 !text-xl text-gold-deep"
                    />
                  </div>
                );
              }
              return (
                <div
                  key={lesson.id}
                  aria-label={title}
                  className={`relative ${offsets[i % offsets.length]}`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-teal/20 bg-sand shadow-sm">
                    <Icon name="lock" fill className="!text-3xl text-teal/30" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Slim secondary "Practise" link — the camera moat now lives in the
            Practise tab; this keeps a lightweight entry + the camera route alive. */}
        <Card
          variant="elevated"
          className="flex items-center gap-3 p-5"
          onClick={() => go({ name: "camera" })}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral/10">
            <Icon name="videocam" fill className="!text-2xl text-coral" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-ink">{t("camPractice", lang)}</p>
            <p className="text-sm text-muted">{t("camPrivacy", lang)}</p>
          </div>
          <Icon name="arrow_forward" className="text-2xl text-teal rtl:rotate-180" />
        </Card>

        {/* Secondary cards below the Path. */}
        <section className="space-y-6">
          {/* Family flags — collapsed to a single compact FlagCard + a count
              deep-link to the Family tab. Keeps the cameraGradable→targetSignId
              gate (top flag) AND the family deep-link route. */}
          {flags.length > 0 &&
            (() => {
              const slice = flags.slice(0, 3);
              const flag = slice[0];
              const sign = signById(flag.signId);
              const by = app.profiles.find((p) => p.id === flag.raisedByProfileId);
              if (!sign) return null;
              return (
                <section className="space-y-3" aria-label={t("homeFlagged", lang)}>
                  <div className="flex items-center justify-between gap-3">
                    <Eyebrow lang={lang} className="!text-coral">
                      {t("homeFlagged", lang)}
                    </Eyebrow>
                    <button
                      type="button"
                      onClick={() => go({ name: "family" })}
                      className="inline-flex items-center gap-1 text-sm font-bold text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded-full px-1"
                    >
                      {pick(
                        lang,
                        `${num(slice.length, lang)} family requests`,
                        `${num(slice.length, lang)} طلبات العائلة`,
                      )}
                      <Icon name="arrow_forward" className="!text-base rtl:rotate-180" />
                    </button>
                  </div>
                  <FlagCard
                    sign={sign}
                    requestedBy={by ? `${by.displayName} ${t("homeNeeds", lang)}` : undefined}
                    lang={lang}
                    compact
                    onClick={() =>
                      go({
                        name: "camera",
                        targetSignId: sign.cameraGradable ? sign.id : undefined,
                      })
                    }
                  />
                </section>
              );
            })()}

          {/* Review-due — lightweight secondary card. */}
          {due.length > 0 && (
            <Card
              variant="elevated"
              className="flex items-center gap-4 p-5"
              onClick={() => go({ name: "lesson", lessonId: "review", reviewOnly: true })}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/20">
                <Icon name="history" className="!text-3xl text-gold-deep" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-ink">{t("homeReviewDue", lang)}</p>
                <p className="text-sm text-muted">
                  {num(due.length, lang)} {t("homeReviewCta", lang)}
                </p>
              </div>
              <Icon name="arrow_forward" className="text-2xl text-teal rtl:rotate-180" />
            </Card>
          )}

          {/* Daily goal — the single GoalCard widget. */}
          <div className="space-y-3">
            <Title className="!text-2xl">{t("homeDailyGoal", lang)}</Title>
            <GoalCard
              label={goalLabel}
              caption={`${num(goalPct, lang)}${lang === "ar" ? "٪" : "%"}`}
              progress={goalProgress}
              done={goalProgress >= 1}
            />
          </div>

          {/* Milestone — lightweight secondary card. */}
          {ms && (
            <Card variant="elevated" className="flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/20">
                <Icon name="emoji_events" fill className="!text-3xl text-gold-deep" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-ink">{ms.label}</p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-teal/10">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${Math.max(4, ms.progress * 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          )}
        </section>
      </div>
    </ScreenShell>
  );
}

// ── Local sub-component (owned by this file) ────────────────────────────────

function PalmTree({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 60"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
    >
      <path d="M20 60 C19 45 19 35 20 26" stroke="#0A4F4C" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 26 C12 20 6 20 1 24" stroke="#0F6E6A" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M20 26 C28 20 34 20 39 24" stroke="#0F6E6A" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M20 26 C14 16 11 12 8 8" stroke="#0F6E6A" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M20 26 C26 16 29 12 32 8" stroke="#0F6E6A" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M20 26 C20 18 20 13 20 6" stroke="#0F6E6A" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
