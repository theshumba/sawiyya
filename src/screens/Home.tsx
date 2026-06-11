// Home / dashboard — streak chip, daily-goal ring, continue CTA,
// family flags pinned, review-due card (PRD §8).
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
import { Card, Pill, ProgressRing, Wordmark, Logo } from "../components/ui";

export function Home() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  if (!profile) return null;
  const lang = profile.language;

  const goalXp = GOAL_XP[profile.dailyGoal];
  const goalProgress = profile.xpToday / goalXp;

  // next lesson = first lesson with an unseen sign; falls back to L1 replay
  const prog = app.progress[profile.id] ?? {};
  const nextLesson =
    LESSONS.find((l) => l.signIds.some((id) => (prog[id]?.masteryLevel ?? 0) < 2)) ?? LESSONS[0];

  const due = dueSignIds(app, profile.id);
  const flags = pinnedFlagSigns(app, profile.id).filter(
    (f) => f.raisedByProfileId !== profile.id,
  );

  return (
    <div className="mx-auto max-w-md px-5 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo size={34} />
          <Wordmark className="text-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="gold">
            🔥 {num(profile.streak, lang)} <span className="font-medium">{t("homeStreak", lang)}</span>
          </Pill>
          <button
            type="button"
            aria-label={t("setTitle", lang)}
            onClick={() => go({ name: "settings" })}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-lg"
          >
            ⚙️
          </button>
        </div>
      </header>

      <p className="mt-3 text-[15px] text-muted">
        {pick(lang, `Ahlan, ${profile.displayName}`, `أهلًا، ${profile.displayName}`)}{" "}
        <span aria-hidden="true">{profile.emoji}</span>
      </p>

      {/* Daily goal */}
      <Card className="mt-4 flex items-center gap-4 p-4">
        <ProgressRing progress={goalProgress} size={72}>
          <span className="font-display text-sm font-bold text-teal">
            {num(Math.min(profile.xpToday, goalXp), lang)}
          </span>
        </ProgressRing>
        <div>
          <h2 className="font-bold">{t("homeDailyGoal", lang)}</h2>
          <p className="text-sm text-muted">
            {goalProgress >= 1
              ? t("homeAllDone", lang)
              : `${num(profile.xpToday, lang)} / ${num(goalXp, lang)} ${t("xp", lang)}`}
          </p>
        </div>
      </Card>

      {/* Family flags — pinned to the top of the queue (PRD §6.7) */}
      {flags.length > 0 && (
        <section className="mt-5" aria-label={t("homeFlagged", lang)}>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-coral">
            {t("homeFlagged", lang)}
          </h2>
          <div className="flex flex-col gap-2">
            {flags.slice(0, 3).map((flag) => {
              const sign = signById(flag.signId);
              const by = app.profiles.find((p) => p.id === flag.raisedByProfileId);
              if (!sign) return null;
              return (
                <Card
                  key={flag.id}
                  className="flex items-center gap-3 border-coral/40 p-3.5"
                  onClick={() => go({ name: "camera", targetSignId: sign.cameraGradable ? sign.id : undefined })}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {sign.type === "alphabet" ? sign.code : sign.emoji}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold">{pick(lang, sign.glossEn, sign.glossAr)}</p>
                    <p className="text-sm text-coral">
                      {by ? `${by.emoji} ${by.displayName} ` : ""}
                      {t("homeNeeds", lang)}
                    </p>
                  </div>
                  <span aria-hidden="true" className="text-coral">📌</span>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Today's lesson */}
      <section className="mt-5">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-teal">
          {t("homeToday", lang)}
        </h2>
        <Card
          className="overflow-hidden !bg-teal text-white shadow-lift"
          onClick={() => go({ name: "lesson", lessonId: nextLesson.id })}
        >
          <div className="p-5">
            <p className="text-sm font-medium text-white/70">
              {t("homeUnit", lang)} A1·1 — {pick(lang, UNIT_A1_U1.titleEn, UNIT_A1_U1.titleAr)}
            </p>
            <h3 className="mt-1 text-2xl font-bold">
              {pick(lang, nextLesson.titleEn, nextLesson.titleAr)}
            </h3>
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-coral px-5 py-3 font-semibold shadow-coral">
              {t("homeContinueUnit", lang)} →
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-gold via-coral to-gold" aria-hidden="true" />
        </Card>
      </section>

      {/* Review due */}
      {due.length > 0 && (
        <section className="mt-5">
          <Card
            className="flex items-center gap-3 p-4"
            onClick={() => go({ name: "lesson", lessonId: "review", reviewOnly: true })}
          >
            <span className="text-3xl" aria-hidden="true">⏳</span>
            <div className="flex-1">
              <p className="font-bold">{t("homeReviewDue", lang)}</p>
              <p className="text-sm text-muted">
                {num(due.length, lang)} {t("homeReviewCta", lang)}
              </p>
            </div>
            <span className="text-teal" aria-hidden="true">→</span>
          </Card>
        </section>
      )}

      {/* Alphabet practice */}
      <section className="mt-5">
        <Card className="flex items-center gap-3 p-4" onClick={() => go({ name: "camera" })}>
          <span className="text-3xl" aria-hidden="true">📷</span>
          <div className="flex-1">
            <p className="font-bold">{t("camPractice", lang)}</p>
            <p className="text-sm text-muted">{t("camPrivacy", lang)}</p>
          </div>
          <span className="text-teal" aria-hidden="true">→</span>
        </Card>
      </section>
    </div>
  );
}
