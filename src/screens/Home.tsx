// Home / "The Journey" — Stitch v2 brand skin.
//   mobile  → design/stitch-v2-brand/the-journey-home--mobile.html
//   desktop → design/stitch-v2-brand/the-journey-home--desktop.html
// Mobile: teal app bar (streak + XP chips), unit ribbon banner, winding journey
// path (gold done / coral current+START / sand locked), coral family-flag card,
// daily-goal ring + bar. Desktop (md:): 3-column shell — left side-nav rail,
// centre journey landscape, right dashboard rail (stats grid, priority flag,
// daily goal, today's challenges). Logic unchanged (PRD §8) — every store hook,
// handler and data binding preserved from the prior build.
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

  const ms = nextMilestone(app, profile.id, lang);

  // Stitch CTA copy. i18n.ts is FROZEN and has no key for these strings, so the
  // dual-script literals live here (spec §1 allows documented literals when no
  // key exists). Stitch shows "START" on the current journey node (mobile +
  // desktop) and "Practice Now" on the desktop side-nav rail CTA.
  const startLabel = lang === "ar" ? "ابدأ" : "START";
  const practiceNowLabel = lang === "ar" ? "تدرّب الآن" : "Practice Now";

  // ---- shared sub-pieces (defined locally; this file owns them) ----------

  const goalLabel =
    goalProgress >= 1
      ? t("homeAllDone", lang)
      : `${num(profile.xpToday, lang)} / ${num(goalXp, lang)} ${t("xp", lang)}`;

  // The winding landscape + journey nodes (re-used on mobile + desktop centre).
  const journey = (
    <section
      aria-label={t("homeToday", lang)}
      className="relative w-full overflow-hidden rounded-3xl bg-sand shadow-inner aspect-[9/14] md:aspect-auto md:h-full md:min-h-[640px] md:rounded-none md:shadow-none"
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
          if (status === "current") {
            return (
              <div
                key={lesson.id}
                className={`relative flex flex-col items-center ${offsets[i % offsets.length]}`}
              >
                <div className="animate-pulse-ring relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#C54F3A] bg-coral shadow-coral">
                  <Icon name="waving_hand" fill className="!text-5xl text-white" />
                </div>
                <button
                  type="button"
                  onClick={() => go({ name: "lesson", lessonId: lesson.id })}
                  className="extruded-coral mt-4 rounded-2xl border-2 border-[#C54F3A] bg-coral px-8 py-3 font-display text-xl font-bold uppercase tracking-wide text-white"
                >
                  {startLabel}
                </button>
                <p className="mt-2 max-w-[180px] text-center text-sm font-semibold text-teal">
                  {pick(lang, lesson.titleEn, lesson.titleAr)}
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
  );

  // Family-flag cards (full version — mobile + desktop priority card share data).
  const flagSection =
    flags.length > 0 ? (
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
                onClick={() =>
                  go({ name: "camera", targetSignId: sign.cameraGradable ? sign.id : undefined })
                }
              >
                <span className="absolute -start-2 -top-2 rounded-full bg-coral px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-coral">
                  {t("homeFlagged", lang)}
                </span>
                <div className="flex items-start gap-4 pt-2">
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
    ) : null;

  const reviewCard =
    due.length > 0 ? (
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
        <Icon name="arrow_forward" className="text-teal rtl:rotate-180" />
      </Card>
    ) : null;

  const dailyGoalCard = (
    <div className="rounded-bowl border-4 border-teal/10 bg-paper p-6 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">{t("homeDailyGoal", lang)}</h2>
          <p className="font-bold text-teal">{goalLabel}</p>
        </div>
        <ProgressRing progress={goalProgress} size={80} stroke={11}>
          <span className="font-display text-lg font-bold text-ink">
            {num(goalPct, lang)}
            {lang === "ar" ? "٪" : "%"}
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
          <span className="absolute inset-0 motion-safe:animate-pulse bg-white/20" aria-hidden="true" />
        </div>
      </div>
    </div>
  );

  const milestoneCard = ms ? (
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
  ) : null;

  // Hero: camera-graded practice — the differentiator, surfaced front-and-centre.
  const practiceHero = (
    <button
      type="button"
      onClick={() => go({ name: "camera" })}
      className="extruded-coral relative w-full overflow-hidden rounded-bowl bg-coral p-5 text-start text-white"
    >
      <div className="relative z-10 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Icon name="videocam" fill className="!text-3xl text-white" />
        </span>
        <div className="flex-1">
          <p className="mb-1 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
            {t("homeHeroEyebrow", lang)}
          </p>
          <p className="font-display text-lg font-bold leading-tight">{t("homeHeroTitle", lang)}</p>
          <p className="mt-1 text-sm leading-snug text-white/85">{t("homeHeroSub", lang)}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 font-display text-xs font-bold uppercase tracking-widest text-coral">
            {t("homeHeroCta", lang)}
            <Icon name="arrow_forward" className="!text-base rtl:rotate-180" />
          </span>
        </div>
      </div>
    </button>
  );

  const alphabetCard = (
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
      <Icon name="arrow_forward" className="text-teal rtl:rotate-180" />
    </Card>
  );

  return (
    <div className="md:flex md:min-h-screen md:bg-sand">
      {/* ───────── Desktop left side-nav rail (Stitch desktop) ───────── */}
      <aside className="sticky top-0 z-50 hidden h-screen w-64 shrink-0 flex-col border-e-4 border-teal/20 bg-sand p-6 md:flex">
        <div className="mb-10 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal shadow-soft">
            <Logo size={30} />
          </span>
          <div>
            <Wordmark className="font-display text-2xl leading-tight text-teal" />
            <p className="font-display text-sm font-bold tracking-[0.3em] text-teal" dir="rtl">
              سويّة
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <SideNavItem icon="home" label={t("navHome", lang)} active />
          <SideNavItem
            icon="videocam"
            label={t("navCamera", lang)}
            onClick={() => go({ name: "camera" })}
          />
          <SideNavItem
            icon="diversity_3"
            label={t("navFamily", lang)}
            onClick={() => go({ name: "family" })}
          />
          <SideNavItem
            icon="bar_chart"
            label={t("navProgress", lang)}
            onClick={() => go({ name: "progress" })}
          />
          <SideNavItem
            icon="settings"
            label={t("setTitle", lang)}
            onClick={() => go({ name: "settings" })}
          />
        </nav>
        <button
          type="button"
          onClick={() => go({ name: "lesson", lessonId: nextLesson.id })}
          className="extruded-coral mt-auto rounded-2xl bg-coral py-4 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          {practiceNowLabel}
        </button>
      </aside>

      {/* ───────── Centre column (app bar + ribbon + journey) ───────── */}
      <main className="relative flex-1 pb-28 md:flex md:min-w-0 md:flex-col md:overflow-y-auto md:pb-0">
        {/* Top app bar — fixed on mobile, sticky ribbon on desktop */}
        <header className="fixed inset-x-0 top-0 z-40 rounded-b-2xl bg-teal shadow-md md:static md:rounded-none md:shadow-lg">
          <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3 md:max-w-none md:px-8 md:py-4">
            {/* mobile: logo + wordmark / desktop: unit title */}
            <div className="flex items-center gap-2.5 md:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white p-1">
                <Logo size={30} />
              </span>
              <Wordmark className="font-display text-2xl text-white" />
            </div>
            <div className="hidden items-center gap-3 text-white md:flex">
              <Icon name="stars" className="text-gold" />
              <h2 className="font-display text-lg font-bold">
                {t("homeUnit", lang)} A1·1 — {pick(lang, UNIT_A1_U1.titleEn, UNIT_A1_U1.titleAr)}
              </h2>
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
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition active:scale-95 md:hidden"
              >
                <Icon name="settings" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile content column */}
        <div className="mx-auto max-w-md px-4 pt-[72px] md:hidden">
          {/* Unit ribbon banner */}
          <div className="relative z-10 -mx-4 mb-6">
            <div className="bg-teal px-8 py-6 pb-8 text-center text-white shadow-lift [clip-path:polygon(0_0,100%_0,100%_85%,50%_100%,0_85%)]">
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

          <div className="mb-6">{practiceHero}</div>

          <div className="mb-8">{journey}</div>

          <div className="space-y-5">
            {flagSection}
            {reviewCard}
            {dailyGoalCard}
            {milestoneCard}
            {alphabetCard}
          </div>
        </div>

        {/* Desktop journey landscape (fills the centre column) */}
        <div className="hidden flex-1 md:block">{journey}</div>
      </main>

      {/* ───────── Desktop right dashboard rail ───────── */}
      <aside className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto border-s-4 border-teal/10 bg-paper p-6 md:flex">
        {/* Camera-graded practice hero — the differentiator, top of the dashboard */}
        {practiceHero}

        {/* Stats cluster */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-teal/10 bg-sand p-4">
            <img alt="" aria-hidden="true" className="mb-2 h-12 w-12" src="brand/stitch-18.png" />
            <span className="font-display text-3xl font-bold text-ink">
              {num(profile.streak, lang)}
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-widest text-teal">
              {t("homeStreak", lang)}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-teal/10 bg-sand p-4">
            <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10">
              <Icon name="stars" fill className="!text-3xl text-teal" />
            </span>
            <span className="font-display text-3xl font-bold text-ink">
              {num(profile.xp, lang)}
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-widest text-teal">
              {t("xp", lang)}
            </span>
          </div>
        </div>

        {/* Priority family flag (first pinned request) */}
        {flags.length > 0 &&
          (() => {
            const flag = flags[0];
            const sign = signById(flag.signId);
            const by = app.profiles.find((p) => p.id === flag.raisedByProfileId);
            if (!sign) return null;
            return (
              <Card
                className="relative flex flex-col items-center !rounded-bowl !border-4 !border-coral p-6 text-center shadow-soft"
                onClick={() =>
                  go({ name: "camera", targetSignId: sign.cameraGradable ? sign.id : undefined })
                }
              >
                <span className="absolute -start-3 -top-3 rounded-full bg-coral px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-coral">
                  {t("homeFlagged", lang)}
                </span>
                <h3 className="mb-1 font-display font-bold text-ink">
                  {by ? `${by.displayName}` : ""}{" "}
                  <span className="text-coral">{t("homeNeeds", lang)}</span>
                </h3>
                <p className="mb-4 font-bold text-xl text-coral">
                  {pick(lang, sign.glossEn, sign.glossAr)}
                </p>
                <div className="mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-teal/5 bg-sand p-4">
                  {sign.type === "alphabet" ? (
                    <span className="font-display text-7xl font-bold text-teal">{sign.code}</span>
                  ) : (
                    <img
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-contain"
                      src="brand/stitch-27.png"
                    />
                  )}
                </div>
                {by && (
                  <span className="flex items-center gap-2 rounded-full border border-teal/10 bg-teal/5 px-3 py-1 text-xs font-bold text-teal">
                    <span className="h-5 w-5 rounded-full border border-white bg-gold" />
                    {by.displayName}
                  </span>
                )}
              </Card>
            );
          })()}

        {/* Daily goal */}
        <div className="rounded-bowl border-4 border-teal/10 bg-sand p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-teal">
              {t("homeDailyGoal", lang)}
            </h4>
            <span className="text-xs font-bold text-ink">{goalLabel}</span>
          </div>
          <div
            className="relative h-6 w-full overflow-hidden rounded-full bg-teal/10 p-1 shadow-inner"
            role="progressbar"
            aria-valuenow={goalPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gold transition-all duration-700"
              style={{
                width: `${Math.max(6, Math.min(1, goalProgress) * 100)}%`,
                boxShadow: "0 0 12px rgba(230,178,76,.6)",
              }}
            />
          </div>
        </div>

        {/* Today's challenges = review + next milestone */}
        {(due.length > 0 || ms) && (
          <div className="mt-auto border-t-2 border-teal/5 pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="emoji_events" className="text-gold" />
              <span className="font-display text-xs font-bold uppercase tracking-widest text-ink">
                {t("homeToday", lang)}
              </span>
            </div>
            <div className="space-y-3">
              {reviewCard}
              {milestoneCard}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

// ── Local sub-components (owned by this file) ───────────────────────────────

function SideNavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-start transition ${
        active
          ? "border-b-4 border-teal-deep bg-teal text-paper"
          : "text-ink/70 hover:bg-teal/10 hover:text-teal"
      }`}
    >
      <Icon name={icon} fill={active} className="!text-2xl" />
      <span className="font-display text-sm font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

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
