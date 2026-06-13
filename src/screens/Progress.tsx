// Progress — "The World You're Building" (PRD §8), rebuilt to Stitch v2.
// Weekly streak, growing-oasis hero, the Alphabet Constellation/Starfield, SRS
// review forecast, and the full-screen streak-celebration moment.
//
// Live data preserved: mastery/seen counts, A1 + alphabet ring progress, due +
// upcoming SRS cards, profile streak/xp/goal, real weekly activeDays. Navigation
// (Start Review / Continue Learning / sign rows) routes through the real ui store.
//
// New branded copy with no existing i18n key uses documented literals (EN/AR via
// `pick`): "The World You're Building", "Coming Up", "The Constellation", the
// growth/forecast micro-labels, and the streak-celebration lines.
import { useEffect, useMemo, useRef, useState } from "react";
import { num, pick, t } from "../i18n";
import { A1_SIGNS, ALPHABET, LESSONS, signById, UNIT_A1_U1 } from "../content/signs";
import { activeProfile, dueSignIds, GOAL_XP, useApp } from "../store/app";
import { isTrained } from "../recognizer/knn";
import { useUi } from "../store/ui";
import { Icon } from "../components/ui";
import { Confetti, celebrate } from "../components/Confetti";
import type { Sign } from "../types";

const DAY_LABELS_EN = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_LABELS_AR = ["إث", "ث", "أر", "خ", "ج", "س", "ح"];

/** YYYY-MM-DD for an offset of `back` days before today. */
function dayKey(back: number): string {
  const d = new Date();
  d.setDate(d.getDate() - back);
  return d.toISOString().slice(0, 10);
}

export function Progress() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  if (!profile) return null;
  const lang = profile.language;
  const rtl = lang === "ar";
  const prog = app.progress[profile.id] ?? {};

  const mastered = Object.values(prog).filter((p) => p.masteryLevel >= 3).length;
  const seen = Object.values(prog).filter((p) => p.masteryLevel >= 1).length;
  const a1Done = A1_SIGNS.filter((s) => (prog[s.id]?.masteryLevel ?? 0) >= 2).length;
  const alphaTaught = ALPHABET.filter((s) => isTrained(s.id)).length;
  const due = dueSignIds(app, profile.id);
  const upcoming = Object.entries(app.srs[profile.id] ?? {})
    .filter(([, c]) => new Date(c.due).getTime() > Date.now())
    .sort((a, b) => new Date(a[1].due).getTime() - new Date(b[1].due).getTime())
    .slice(0, 6);

  // World growth — share of the A1 unit + alphabet brought to life.
  const totalTracked = A1_SIGNS.length + ALPHABET.length;
  const growth = Math.round(((a1Done + alphaTaught) / Math.max(1, totalTracked)) * 100);
  const oasisLevel = Math.max(1, Math.floor(mastered / 4) + 1);

  // Real weekly streak: which of the last 7 days (Mon..Sun anchor on today) the
  // active profile actually trained on, from profile.activeDays.
  const activeSet = useMemo(() => new Set(profile.activeDays ?? []), [profile.activeDays]);
  const todayDow = (new Date().getDay() + 6) % 7; // 0 = Monday
  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const back = todayDow - i;
        if (back < 0) return { state: "future" as const };
        const key = dayKey(back);
        return {
          state: activeSet.has(key) ? ("active" as const) : ("missed" as const),
          today: back === 0,
        };
      }),
    [activeSet, todayDow]
  );

  const goalXp = GOAL_XP[profile.dailyGoal];

  // Streak celebration: fire once when arriving with a fresh streak milestone.
  const [celebrating, setCelebrating] = useState(false);
  const lastStreak = useRef(profile.streak);
  useEffect(() => {
    if (profile.streak > lastStreak.current && profile.streak > 1) {
      setCelebrating(true);
    }
    lastStreak.current = profile.streak;
  }, [profile.streak]);

  const reviewCount = due.length;
  function startReview() {
    const firstLesson = LESSONS.find((l) => l.unitId === UNIT_A1_U1.id) ?? LESSONS[0];
    if (firstLesson) {
      go({ name: "lesson", lessonId: firstLesson.id, reviewOnly: true });
    } else {
      go({ name: "camera" });
    }
  }

  // ── sub-renderers ────────────────────────────────────────────────────────
  const headerTitle = pick(lang, "The World You're Building", "العالم الذي تبنيه");
  const headerSub = pick(lang, "Every sign brings life to the oasis.", "كل إشارة تمنح الواحة حياة.");

  const weeklyStreak = (
    <section className="rounded-3xl border-2 border-teal/5 bg-paper p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-display text-xs font-bold uppercase tracking-widest text-teal/60">
          {pick(lang, "Weekly streak", "المواظبة الأسبوعية")}
        </span>
        <div className="flex items-center gap-1.5 text-gold">
          <span aria-hidden="true" className="text-lg">🔥</span>
          <span className="font-display text-xl font-bold text-ink">{num(profile.streak, lang)}</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        {week.map((d, i) => {
          const label = (rtl ? DAY_LABELS_AR : DAY_LABELS_EN)[i];
          if (d.state === "active") {
            return (
              <div key={i} className={`flex flex-col items-center gap-2 ${d.today ? "scale-110" : ""}`}>
                <span
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full bg-gold text-ink ${d.today ? "shadow-gold" : ""}`}
                >
                  <Icon name="check" fill className="text-[18px]" />
                  {d.today && (
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-paper bg-coral" />
                  )}
                </span>
                <span className={`text-[10px] font-bold ${d.today ? "text-teal" : "text-teal/40"}`}>{label}</span>
              </div>
            );
          }
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <span
                className={`h-9 w-9 rounded-full border-2 border-dashed ${d.state === "future" ? "border-teal/20 bg-teal/5" : "border-coral/30 bg-coral/5"}`}
              />
              <span className="text-[10px] font-bold text-teal/40">{label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );

  const oasisHero = (
    <section
      className="group relative cursor-pointer"
      onClick={startReview}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && startReview()}
    >
      <div className="relative aspect-square overflow-hidden rounded-bowl border-4 border-teal/10 bg-teal shadow-lift">
        <img
          alt=""
          aria-hidden="true"
          src="/brand/stitch-32.png"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* floating stats */}
        <div className="absolute left-6 top-6 flex flex-col gap-3">
          <span className="flex items-center gap-2 rounded-2xl border border-white/20 bg-teal px-4 py-2 text-paper shadow-lift">
            <Icon name="star" fill className="text-[18px] text-gold" />
            <span className="font-display text-sm font-bold uppercase tracking-wider">
              {num(mastered, lang)} {t("prMastered", lang)}
            </span>
          </span>
          <span className="flex items-center gap-2 rounded-2xl border border-white/20 bg-gold px-4 py-2 text-ink shadow-lift">
            <Icon name="spa" fill className="text-[14px] text-teal" />
            <span className="font-display text-sm font-bold uppercase tracking-wider">
              {pick(lang, `Level ${oasisLevel} Oasis`, `واحة المستوى ${num(oasisLevel, lang)}`)}
            </span>
          </span>
        </div>
        {/* growth bar */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-teal/80 to-transparent p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-paper/80">
              {pick(lang, "World growth", "نمو العالم")}
            </span>
            <span className="font-display text-lg font-black text-gold">{num(growth, lang)}%</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full border border-white/10 bg-teal-deep/50">
            <div
              className="relative h-full rounded-full bg-gold"
              style={{ width: `${Math.max(4, growth)}%`, boxShadow: "0 0 10px rgba(230,178,76,.7)" }}
            >
              <span className="absolute inset-y-0 right-0 w-4 skew-x-12 bg-white/20 motion-safe:animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Alphabet constellation — every taught letter is a gold star; the rest are
  // dim numbered nodes waiting to be lit.
  const constellation = (
    <section className="overflow-hidden rounded-bowl border-2 border-teal bg-teal-deep p-8">
      <header className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-xl text-paper">{pick(lang, "The Constellation", "الكوكبة")}</h3>
        <span className="rounded-full bg-paper/10 px-3 py-1 text-[10px] font-black uppercase tracking-tighter text-gold">
          {num(alphaTaught, lang)} / {num(ALPHABET.length, lang)} {pick(lang, "Found", "مكتشفة")}
        </span>
      </header>
      <div className="grid grid-cols-5 gap-4" dir="ltr">
        {ALPHABET.map((s, i) => {
          const lit = isTrained(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go({ name: "camera", targetSignId: s.id })}
              aria-label={pick(lang, s.glossEn, s.glossAr)}
              className={`flex aspect-square items-center justify-center rounded-full transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                lit
                  ? "scale-110 bg-gold text-ink shadow-gold"
                  : "border-2 border-teal text-paper/30"
              }`}
            >
              {lit ? (
                <span className="font-display text-sm font-bold" dir="rtl">{s.code}</span>
              ) : (
                <span className="text-[8px] font-black">{num(i + 1, lang)}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-wide text-paper/40">
        {pick(lang, "Connect the signs to light the sky", "اربط الإشارات لتضيء السماء")}
      </p>
    </section>
  );

  const forecastRows = (
    <>
      {due.slice(0, 4).map((signId) => {
        const sign = signById(signId);
        if (!sign) return null;
        return (
          <ForecastRow
            key={signId}
            sign={sign}
            lang={lang}
            tone="due"
            badge={t("homeReviewDue", lang)}
            onClick={() => go({ name: "camera", targetSignId: sign.id })}
          />
        );
      })}
      {upcoming.map(([signId, card]) => {
        const sign = signById(signId);
        if (!sign) return null;
        const days = Math.max(0, Math.round((new Date(card.due).getTime() - Date.now()) / 86400000));
        return (
          <ForecastRow
            key={signId}
            sign={sign}
            lang={lang}
            tone="later"
            badge={days === 0 ? pick(lang, "<1d", "<يوم") : `${num(days, lang)}${pick(lang, "d", "ي")}`}
            onClick={() => go({ name: "camera", targetSignId: sign.id })}
          />
        );
      })}
    </>
  );

  const empty = due.length === 0 && upcoming.length === 0;

  return (
    <>
      {/* ── Mobile (base) — single column, app-bar handled by chrome ───────── */}
      <div className="mx-auto max-w-md space-y-8 px-4 pb-32 pt-6 md:hidden">
        <section className="space-y-2 text-center">
          <h1 className="font-display text-3xl font-black leading-tight text-teal">{headerTitle}</h1>
          <p className="font-semibold text-teal/70">{headerSub}</p>
        </section>

        {weeklyStreak}
        {oasisHero}
        {constellation}

        <section className="space-y-4">
          <h2 className="px-2 font-display text-xl text-teal">{pick(lang, "Coming Up", "قادمة قريباً")}</h2>
          {empty ? (
            <div className="rounded-3xl border border-line bg-paper p-4 text-sm text-muted">
              {t("prNothingDue", lang)}
            </div>
          ) : (
            <div className="space-y-3">{forecastRows}</div>
          )}
          <button
            type="button"
            onClick={startReview}
            className="extruded-coral mt-2 flex w-full items-center justify-center gap-3 rounded-3xl bg-coral py-5 font-display text-lg text-white transition active:translate-y-1"
          >
            <span>{pick(lang, "Start Review Session", "ابدأ جلسة المراجعة")}</span>
            <Icon name="bolt" />
          </button>
        </section>
      </div>

      {/* ── Desktop — split oasis hero + starfield + forecast ──────────────── */}
      <div className="mx-auto hidden max-w-[1600px] px-8 py-8 md:block">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black text-teal">{headerTitle}</h1>
            <p className="font-semibold text-teal/70">{headerSub}</p>
          </div>
          <div className="flex items-center gap-6">
            {/* weekly dots */}
            <div className="flex items-center gap-2 rounded-2xl border-2 border-teal/5 bg-paper/80 px-4 py-2">
              <div className="flex gap-1.5">
                {week.map((d, i) => (
                  <span
                    key={i}
                    className={`h-3 w-3 rounded-full ${
                      d.state === "active"
                        ? `bg-gold ${d.today ? "motion-safe:animate-pulse" : ""}`
                        : "bg-ink/10"
                    }`}
                  />
                ))}
              </div>
              <span className="mx-2 h-6 w-px bg-ink/10" />
              <span className="text-lg" aria-hidden="true">🔥</span>
              <span className="font-display font-bold text-ink">{num(profile.streak, lang)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="military_tech" fill className="text-gold" />
              <span className="font-display text-2xl font-bold text-ink">
                {num(profile.xp, lang)}{" "}
                <span className="font-sans text-sm uppercase tracking-widest text-ink/40">{t("xp", lang)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="potted_plant" fill className="text-teal" />
              <span className="font-display text-2xl font-bold text-ink">
                {num(mastered, lang)}{" "}
                <span className="font-sans text-sm uppercase tracking-widest text-ink/40">{t("prMastered", lang)}</span>
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* split oasis hero */}
          <section className="col-span-12">
            <div className="group relative aspect-[21/9] w-full overflow-hidden rounded-bowl border-4 border-teal/10 bg-paper shadow-lift">
              <div className="absolute inset-0 flex">
                <div className="relative h-full w-1/2 overflow-hidden bg-gradient-to-br from-paper to-sand/50">
                  <img
                    alt=""
                    aria-hidden="true"
                    src="/brand/stitch-32.png"
                    className="h-full w-full -translate-x-1/4 scale-110 object-cover"
                  />
                  <div className="absolute left-8 top-8">
                    <span className="flex items-center gap-2 rounded-full bg-teal px-6 py-2 font-display text-lg text-paper shadow-lift">
                      <Icon name="auto_awesome" fill />
                      {num(mastered, lang)} {t("prMastered", lang)}
                    </span>
                  </div>
                  {/* Wooden "GROW" signpost + growth read-out (Stitch desktop). */}
                  <div className="absolute bottom-8 left-8 flex flex-col items-start gap-2">
                    <span className="extruded-gold flex items-center gap-2 rounded-2xl bg-gold px-5 py-2 font-display text-sm font-bold uppercase tracking-widest text-ink shadow-gold">
                      {pick(lang, "Grow", "ازرع")}
                      <Icon name="arrow_forward" className={`text-[16px] ${rtl ? "rotate-180" : ""}`} />
                    </span>
                    <span className="font-display text-[11px] font-black uppercase tracking-widest text-teal/60">
                      {pick(lang, "Growth", "النمو")} {num(growth, lang)}%
                    </span>
                  </div>
                </div>
                <div className="relative flex h-full w-1/2 flex-col items-center justify-center border-s-4 border-dashed border-teal/20 bg-sand/30 p-12 text-center">
                  <Icon name="potted_plant" className="pointer-events-none absolute text-[15rem] text-teal/10" />
                  <h2 className="relative mb-4 font-display text-3xl text-teal/60">
                    {pick(lang, "A World Waiting to Bloom", "عالمٌ ينتظر أن يزهر")}
                  </h2>
                  <p className="relative max-w-xs text-teal/50">
                    {pick(
                      lang,
                      "Every lesson learned adds life to your Sawiyya oasis.",
                      "كل درس تتعلمه يضيف حياة إلى واحتك في سويّة."
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={startReview}
                    className="extruded-coral relative mt-8 flex items-center gap-3 rounded-2xl bg-coral px-10 py-4 font-display text-xl text-paper transition active:translate-y-1"
                  >
                    {pick(lang, "Continue Learning", "واصل التعلّم")}
                    <Icon name="arrow_forward" className={rtl ? "rotate-180" : ""} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* alphabet starfield */}
          <section className="col-span-12 xl:col-span-8">
            <div className="rounded-bowl border-4 border-teal/10 bg-paper p-10 shadow-soft">
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-3xl text-ink">{pick(lang, "The Alphabet Starfield", "حقل حروف الأبجدية")}</h3>
                  <p className="mt-1 text-ink/60">{t("camPractice", lang)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full bg-gold" />
                    <span className="text-xs font-bold uppercase tracking-widest text-ink/60">{t("prMastered", lang)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-teal/20" />
                    <span className="text-xs font-bold uppercase tracking-widest text-ink/60">
                      {pick(lang, "Exploring", "قيد الاستكشاف")}
                    </span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-6 md:grid-cols-7" dir="rtl">
                {ALPHABET.map((s) => {
                  const lit = isTrained(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => go({ name: "camera", targetSignId: s.id })}
                      aria-label={pick(lang, s.glossEn, s.glossAr)}
                      className={`flex aspect-square flex-col items-center justify-center rounded-3xl transition-all hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                        lit
                          ? "border-b-4 border-[#C89A3D] bg-gold shadow-lift"
                          : "border-4 border-dashed border-teal/20 hover:bg-teal/5"
                      }`}
                    >
                      <span className={`text-4xl font-bold ${lit ? "text-ink" : "text-teal/30"}`}>{s.code}</span>
                      {lit && <Icon name="front_hand" className="mt-1 text-xl text-ink/40" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* coming up */}
          <section className="col-span-12 space-y-8 xl:col-span-4">
            <div className="h-full rounded-bowl border-4 border-teal/10 bg-paper p-10 shadow-soft">
              <h3 className="mb-2 font-display text-3xl text-ink">{pick(lang, "Coming Up", "قادمة قريباً")}</h3>
              <p className="mb-8 text-ink/60">{t("prUpcoming", lang)}</p>
              {empty ? (
                <div className="rounded-3xl border border-line bg-sand p-4 text-sm text-muted">{t("prNothingDue", lang)}</div>
              ) : (
                <div className="space-y-6">{forecastRows}</div>
              )}
              <button
                type="button"
                onClick={startReview}
                className="extruded-coral mt-10 flex w-full items-center justify-center gap-3 rounded-3xl bg-coral py-4 font-display text-lg text-white transition active:translate-y-1"
              >
                <span>{pick(lang, "Start Review Session", "ابدأ جلسة المراجعة")}</span>
                <Icon name="bolt" />
              </button>

              {/* "Did you know?" facts card — closes the rail (Stitch desktop). */}
              <div className="relative mt-12 overflow-hidden rounded-3xl border-2 border-teal/5 bg-sand p-6">
                <div className="relative z-10">
                  <h5 className="mb-2 font-display text-xl text-teal">{pick(lang, "Did you know?", "هل تعلم؟")}</h5>
                  <p className="text-sm leading-snug text-ink/70">
                    {pick(
                      lang,
                      "Qatari Sign Language (QSL) has unique signs for local traditions, including how we hold the Finjan!",
                      "للغة الإشارة القطرية إشاراتٌ فريدة للعادات المحلية، بما في ذلك كيف نمسك الفنجان!"
                    )}
                  </p>
                </div>
                <Icon
                  name="local_cafe"
                  className="pointer-events-none absolute -bottom-4 -right-4 rotate-12 text-9xl text-teal/5"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {celebrating && (
        <StreakCelebration
          profile={profile}
          lang={lang}
          mastered={mastered}
          goalXp={goalXp}
          week={week}
          onContinue={() => setCelebrating(false)}
        />
      )}
    </>
  );
}

// ── Review-forecast row (shared mobile + desktop) ──────────────────────────
function ForecastRow({
  sign,
  lang,
  tone,
  badge,
  onClick,
}: {
  sign: Sign;
  lang: "en" | "ar";
  tone: "due" | "later";
  badge: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-3xl border-2 bg-paper p-4 text-start shadow-soft transition-colors hover:border-gold ${
        tone === "due" ? "border-gold/20" : "border-transparent"
      }`}
    >
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-teal/5 bg-sand">
        <span className="text-3xl" aria-hidden="true">
          {sign.type === "alphabet" ? sign.code : sign.emoji}
        </span>
      </span>
      <span className="flex-grow">
        <span className="block text-lg font-bold leading-tight text-ink">{pick(lang, sign.glossEn, sign.glossAr)}</span>
        <span className="block text-xs font-semibold text-teal/60">
          {sign.type === "alphabet" ? pick(lang, "Alphabet", "الحروف") : pick(lang, "Sign review", "مراجعة إشارة")}
        </span>
      </span>
      <span
        className={`flex items-center gap-1 rounded-full px-3 py-1 ${
          tone === "due" ? "bg-gold/10 text-gold" : "bg-teal/5 text-teal/60"
        }`}
      >
        <Icon name={tone === "due" ? "hourglass_top" : "hourglass_empty"} fill={tone === "due"} className="text-[14px]" />
        <span className="text-[10px] font-black uppercase">{badge}</span>
      </span>
    </button>
  );
}

// ── Full-screen streak celebration (Stitch "4-day streak" mockup) ──────────
function StreakCelebration({
  profile,
  lang,
  mastered,
  goalXp,
  week,
  onContinue,
}: {
  profile: { displayName: string; streak: number; xp: number };
  lang: "en" | "ar";
  mastered: number;
  goalXp: number;
  week: { state: "active" | "missed" | "future"; today?: boolean }[];
  onContinue: () => void;
}) {
  const [burst, setBurst] = useState(0);
  const rtl = lang === "ar";
  useEffect(() => {
    setBurst((b) => b + 1);
    celebrate();
  }, []);

  const n = profile.streak;
  const headline = pick(
    lang,
    `${n} ${n === 1 ? "day" : "days"} of showing up for ${profile.displayName}`,
    `${num(n, lang)} ${n === 1 ? "يوم" : "أيام"} من المواظبة لأجل ${profile.displayName}`
  );
  const arNumber = pick(lang, `${n} ${n === 1 ? "day" : "days"}`, `${num(n, lang)} ${n === 1 ? "يوم" : "أيام"}`);

  return (
    <div className="fixed inset-0 z-[100] flex select-none flex-col items-center justify-center bg-ink p-6 text-center">
      <Confetti burst={burst} />

      {/* Stitch chrome — gold wordmark + close affordance (desktop variant). */}
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-4">
        <span className="font-display text-2xl font-bold tracking-tight text-gold" dir="ltr">
          {pick(lang, "Sawiyya", "سويّة")}
        </span>
        <button
          type="button"
          onClick={onContinue}
          aria-label={t("close", lang)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-paper transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-95"
        >
          <Icon name="close" className="text-3xl" />
        </button>
      </header>

      <main className="relative z-10 flex w-full max-w-lg flex-col items-center">
        <div className="relative mb-8 h-64 w-64 motion-safe:animate-rise md:h-72 md:w-72" style={{ filter: "drop-shadow(0 0 20px rgba(230,178,76,.4))" }}>
          <img alt="" aria-hidden="true" src="/brand/stitch-46.png" className="h-full w-full object-contain" />
        </div>

        <div className="mb-10 space-y-4">
          <h1 className="px-4 font-display text-3xl tracking-tight text-paper md:text-4xl">{headline}</h1>
          <p className="font-display text-4xl font-bold text-gold md:text-5xl" dir="rtl">
            {arNumber}
          </p>
        </div>

        {/* day dots */}
        <div className="mb-12 flex justify-center gap-3" dir="ltr">
          {week.map((d, i) =>
            d.state === "active" ? (
              <span
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-ink shadow-gold"
              >
                <Icon name="check" fill className="text-xl" />
              </span>
            ) : (
              <span
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-paper/20 text-[10px] font-bold text-paper opacity-40"
              >
                {(["M", "T", "W", "T", "F", "S", "S"][i])}
              </span>
            )
          )}
        </div>

        {/* motivational note — mobile only; the Stitch desktop variant omits it. */}
        <div className="mb-10 flex items-center gap-4 rounded-3xl border-2 border-teal/30 bg-teal/20 px-6 py-4 backdrop-blur-sm md:hidden">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal text-paper">
            <Icon name="sign_language" fill />
          </span>
          <p className="text-start text-sm leading-snug text-paper/90 md:text-base">
            {pick(
              lang,
              `You've mastered ${mastered} signs so far. ${profile.displayName} is going to be so proud.`,
              `لقد أتقنت ${num(mastered, lang)} إشارة حتى الآن. سيكون ${profile.displayName} فخوراً جداً بك.`
            )}
          </p>
        </div>
      </main>

      <footer className="fixed bottom-12 z-20 w-full max-w-md px-6">
        <button
          type="button"
          onClick={onContinue}
          className="extruded-gold group flex w-full items-center justify-center gap-2 rounded-3xl bg-gold py-5 font-display text-xl uppercase tracking-widest text-ink transition active:translate-y-1"
        >
          {t("obContinue", lang)}
          <Icon name="arrow_forward" className={`transition-transform group-hover:translate-x-1 ${rtl ? "rotate-180" : ""}`} />
        </button>
      </footer>
    </div>
  );
}
