// Home / "The Journey" — Stitch v2 brand skin (design/stitch-v2-brand/the-journey-home--mobile.html).
// Teal app bar with streak + XP chips, unit ribbon banner, winding journey path
// (gold completed nodes, coral current node with START, sand locked nodes),
// coral-bordered family-flag card, daily-goal ring card. Logic unchanged (PRD §8).
import { num, pick, t } from "../i18n";
import { signById, LESSONS, UNIT_A1_U1 } from "../content/signs";
import {
  GOAL_XP,
  activeProfile,
  dueSignIds,
  pinnedFlagSigns,
  useApp,
} from "../store/app";
import { useUi } from "../store/ui";
import { Card, Icon, ProgressRing, Wordmark, Logo } from "../components/ui";
import { nextMilestone } from "../lesson/milestones";

export function Home() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  if (!profile) return null;
  const lang = profile.language;

  const goalXp = GOAL_XP[profile.dailyGoal];
  const goalProgress = profile.xpToday / goalXp;
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

  return (
    <div className="pb-28">
      {/* Top app bar */}
      <header className="fixed inset-x-0 top-0 z-40 rounded-b-2xl bg-teal shadow-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3 md:max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white p-1">
              <Logo size={30} />
            </span>
            <Wordmark className="font-display text-2xl text-white" />
          </div>
          <div className="flex items-center gap-2">
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
            <button
              type="button"
              aria-label={t("setTitle", lang)}
              onClick={() => go({ name: "settings" })}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition active:scale-95"
            >
              <Icon name="settings" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-[72px] md:max-w-lg">
        {/* Unit ribbon banner */}
        <div className="relative z-10 -mx-4 mb-6">
          <div
            className="bg-teal px-8 py-6 pb-8 text-center text-white shadow-lift [clip-path:polygon(0_0,100%_0,100%_85%,50%_100%,0_85%)]"
          >
            <p className="mb-1 font-display text-xs font-bold uppercase tracking-[0.2em] text-gold/90">
              {t("homeUnit", lang)} A1·1
            </p>
            <h2 className="font-display text-xl font-bold leading-tight">
              {pick(lang, UNIT_A1_U1.titleEn, UNIT_A1_U1.titleAr)}
            </h2>
            <p className="text-sm text-white/70">
              {pick(lang, `Ahlan, ${profile.displayName}`, `أهلًا، ${profile.displayName}`)}
            </p>
          </div>
        </div>

        {/* The journey path */}
        <section
          aria-label={t("homeToday", lang)}
          className="relative mb-8 aspect-[9/14] w-full overflow-hidden rounded-3xl bg-sand shadow-inner md:aspect-[4/5]"
        >
          {/* CSS illustration — Gulf landscape (Stitch background asset unavailable) */}
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-gold/15 via-sand to-coral/10" />
            {/* far skyline */}
            <div className="absolute bottom-[55%] start-[8%] h-16 w-9 rounded-t-full bg-teal/15" />
            <div className="absolute bottom-[55%] start-[20%] h-10 w-12 rounded-t-3xl bg-coral/15" />
            <div className="absolute bottom-[56%] end-[12%] h-12 w-8 rounded-t-full bg-gold/25" />
            {/* dunes */}
            <div className="absolute -start-1/4 bottom-[30%] h-40 w-[150%] rounded-[100%] bg-gold/20" />
            <div className="absolute -end-1/4 bottom-[8%] h-44 w-[150%] rounded-[100%] bg-coral/10" />
            <div className="absolute -start-1/3 -bottom-12 h-40 w-[160%] rounded-[100%] bg-gold/25" />
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
              if (status === "current") {
                return (
                  <div key={lesson.id} className={`relative flex flex-col items-center ${offsets[i % offsets.length]}`}>
                    <div className="animate-pulse-ring relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#C54F3A] bg-coral shadow-coral">
                      <Icon name="waving_hand" fill className="!text-5xl text-white" />
                    </div>
                    <button
                      type="button"
                      onClick={() => go({ name: "lesson", lessonId: lesson.id })}
                      className="extruded-coral mt-4 rounded-2xl border-2 border-[#C54F3A] bg-coral px-8 py-3 font-display text-xl font-bold uppercase tracking-wide text-white"
                    >
                      {t("homeContinueUnit", lang)}
                    </button>
                    <p className="mt-2 max-w-[180px] text-center text-sm font-semibold text-teal">
                      {pick(lang, lesson.titleEn, lesson.titleAr)}
                    </p>
                    {/* waving hand character */}
                    <img
                      alt=""
                      aria-hidden="true"
                      className="absolute -start-20 top-0 w-20 -rotate-12 rounded-3xl drop-shadow-md"
                      src="brand/stitch-31.png"
                    />
                  </div>
                );
              }
              if (status === "done") {
                return (
                  <div key={lesson.id} className={`relative ${offsets[i % offsets.length]}`}>
                    <div className="extruded-gold flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#C9993E] bg-gold shadow-gold">
                      <Icon name="check" className="!text-3xl font-bold text-white" />
                    </div>
                    <Icon
                      name="auto_awesome"
                      fill
                      className="absolute -end-3 -top-2 !text-xl text-[#C9993E]"
                    />
                  </div>
                );
              }
              return (
                <div key={lesson.id} className={`relative ${offsets[i % offsets.length]}`}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-teal/20 bg-sand shadow-sm">
                    <Icon name="lock" fill className="!text-3xl text-teal/30" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-5">
          {/* Family flags — pinned to the top of the queue (PRD §6.7) */}
          {flags.length > 0 && (
            <section aria-label={t("homeFlagged", lang)}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-coral">
                {t("homeFlagged", lang)}
              </h2>
              <div className="flex flex-col gap-3">
                {flags.slice(0, 3).map((flag) => {
                  const sign = signById(flag.signId);
                  const by = app.profiles.find((p) => p.id === flag.raisedByProfileId);
                  if (!sign) return null;
                  return (
                    <Card
                      key={flag.id}
                      className="relative overflow-hidden !rounded-bowl !border-4 !border-coral p-5 shadow-soft"
                      onClick={() => go({ name: "camera", targetSignId: sign.cameraGradable ? sign.id : undefined })}
                    >
                      <div className="flex items-start gap-4">
                        {sign.type === "alphabet" ? (
                          <span
                            aria-hidden="true"
                            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border-4 border-sand bg-teal/10 font-display text-5xl font-bold text-teal shadow-md"
                          >
                            {sign.code}
                          </span>
                        ) : (
                          <img
                            alt=""
                            aria-hidden="true"
                            className="h-24 w-24 shrink-0 rounded-3xl border-4 border-sand object-cover shadow-md"
                            src="brand/stitch-27.png"
                          />
                        )}
                        <div className="flex-1 pt-1">
                          <h3 className="font-display text-xl font-bold leading-tight text-ink">
                            {by ? `${by.displayName}` : ""}{" "}
                            <span className="text-coral">{t("homeNeeds", lang)}</span>
                          </h3>
                          <p className="mt-1 text-lg font-bold text-coral">
                            {pick(lang, sign.glossEn, sign.glossAr)}
                          </p>
                        </div>
                      </div>
                      <Icon
                        name="push_pin"
                        className="absolute end-5 top-4 rotate-45 !text-3xl text-coral/30"
                      />
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Review due */}
          {due.length > 0 && (
            <Card
              className="extruded-paper flex items-center gap-4 !rounded-bowl !border-2 !border-line p-4"
              onClick={() => go({ name: "lesson", lessonId: "review", reviewOnly: true })}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/20">
                <Icon name="history" className="!text-3xl text-[#C9993E]" />
              </span>
              <div className="flex-1">
                <p className="font-display font-bold">{t("homeReviewDue", lang)}</p>
                <p className="text-sm text-muted">
                  {num(due.length, lang)} {t("homeReviewCta", lang)}
                </p>
              </div>
              <Icon name="arrow_forward" className="text-teal" />
            </Card>
          )}

          {/* Daily goal */}
          <div className="rounded-bowl border-4 border-teal/10 bg-paper p-6 shadow-soft">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">
                  {t("homeDailyGoal", lang)}
                </h2>
                <p className="font-bold text-teal">
                  {goalProgress >= 1
                    ? t("homeAllDone", lang)
                    : `${num(profile.xpToday, lang)} / ${num(goalXp, lang)} ${t("xp", lang)}`}
                </p>
              </div>
              <ProgressRing progress={goalProgress} size={80} stroke={11}>
                <span className="font-display text-lg font-bold text-ink">
                  {num(goalPct, lang)}{lang === "ar" ? "٪" : "%"}
                </span>
              </ProgressRing>
            </div>
            <div
              className="h-4 w-full overflow-hidden rounded-full bg-teal/5"
              role="progressbar"
              aria-valuenow={goalPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-gold to-[#C9993E] transition-all"
                style={{ width: `${Math.max(6, Math.min(1, goalProgress) * 100)}%` }}
              >
                <span className="absolute inset-0 animate-pulse bg-white/20" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Next milestone */}
          {(() => {
            const ms = nextMilestone(app, profile.id, lang);
            if (!ms) return null;
            return (
              <Card className="extruded-paper flex items-center gap-4 !rounded-bowl !border-2 !border-line p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/20">
                  <Icon name="emoji_events" fill className="!text-3xl text-[#C9993E]" />
                </span>
                <div className="flex-1">
                  <p className="font-display font-bold">{ms.label}</p>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-teal/10">
                    <div
                      className="h-full rounded-full bg-gold transition-all"
                      style={{ width: `${Math.max(4, ms.progress * 100)}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Alphabet practice */}
          <Card
            className="extruded-paper flex items-center gap-4 !rounded-bowl !border-2 !border-line p-4"
            onClick={() => go({ name: "camera" })}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal/10">
              <Icon name="video_camera_front" className="!text-3xl text-teal" />
            </span>
            <div className="flex-1">
              <p className="font-display font-bold">{t("camPractice", lang)}</p>
              <p className="text-sm text-muted">{t("camPrivacy", lang)}</p>
            </div>
            <Icon name="arrow_forward" className="text-teal" />
          </Card>
        </div>
      </main>
    </div>
  );
}
