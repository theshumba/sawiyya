// Progress — "The World You're Building" (PRD §8), the "My World" surface behind
// the profile button. One responsive render (no mobile/desktop twins): a compact
// streak+XP+mastered strip → the growing-oasis hero (focal, NOT a button) → ONE
// dominant CTA → the Alphabet Constellation → "Coming Up" with a designed empty
// state. The full-screen streak-celebration moment fires on a fresh milestone.
//
// Live data preserved: mastery/seen counts, A1 + alphabet ring progress, due +
// upcoming SRS cards, profile streak/xp/goal, real weekly activeDays. Navigation
// (Start Review / sign rows) routes through the real ui store. Read-only.
//
// New branded copy with no existing i18n key uses documented literals (EN/AR via
// `pick`): "The World You're Building", "Coming Up", "The Constellation", the
// growth/forecast micro-labels, and the streak-celebration lines.
import { useEffect, useMemo, useRef, useState } from "react";
import { num, pick, t } from "../i18n";
import { A1_SIGNS, ALPHABET, signById } from "../content/signs";
import { activeProfile, dueSignIds, GOAL_XP, useApp } from "../store/app";
import { isTrained } from "../recognizer/knn";
import { useUi } from "../store/ui";
import { Icon, Title, Subtitle, Eyebrow } from "../components/ui";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
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
  if (!profile) return <NoProfileFallback />;
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
  // Practice-first: the review session opens the camera on the first due gradable
  // sign (falls back to a generic camera open when none is gradable).
  function startReview() {
    const firstDueGradable = due.map(signById).find((s) => s?.cameraGradable)?.id;
    go({ name: "camera", targetSignId: firstDueGradable });
  }

  const headerTitle = pick(lang, "The World You're Building", "العالم الذي تبنيه");
  const headerSub = pick(lang, "Every sign brings life to the oasis.", "كل إشارة تمنح الواحة حياة.");

  const empty = due.length === 0 && upcoming.length === 0;

  return (
    <ScreenShell lang={lang} chrome="takeover" title={headerTitle} onClose={() => go({ name: "home" })}>
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-6 md:px-6">
        {/* Intro line under the shell title. */}
        <Subtitle className="text-teal/70">{headerSub}</Subtitle>

        {/* ── Stats strip: streak · XP · mastered ───────────────────────────── */}
        <section className="grid grid-cols-3 gap-3" aria-label={pick(lang, "Your progress", "تقدّمك")}>
          <div className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-line bg-paper p-5 shadow-soft">
            <span className="text-2xl" aria-hidden="true">🔥</span>
            <span className="font-display text-2xl font-bold text-ink">{num(profile.streak, lang)}</span>
            <Eyebrow lang={lang} className="text-teal/70">{pick(lang, "Streak", "المواظبة")}</Eyebrow>
          </div>
          <div className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-line bg-paper p-5 shadow-soft">
            <Icon name="military_tech" fill className="text-2xl text-gold" />
            <span className="font-display text-2xl font-bold text-ink">{num(profile.xp, lang)}</span>
            <Eyebrow lang={lang} className="text-teal/70">{t("xp", lang)}</Eyebrow>
          </div>
          <div className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-line bg-paper p-5 shadow-soft">
            <Icon name="potted_plant" fill className="text-2xl text-teal" />
            <span className="font-display text-2xl font-bold text-ink">{num(mastered, lang)}</span>
            <Eyebrow lang={lang} className="text-teal/70">{t("prMastered", lang)}</Eyebrow>
          </div>
        </section>

        {/* ── Weekly streak dots ────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-line bg-paper p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <Eyebrow lang={lang} className="text-teal/70">{pick(lang, "Weekly streak", "المواظبة الأسبوعية")}</Eyebrow>
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
                    <span className={`text-xs font-bold ${d.today ? "text-teal" : "text-teal/60"}`}>{label}</span>
                  </div>
                );
              }
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span
                    className={`h-9 w-9 rounded-full border-2 border-dashed ${d.state === "future" ? "border-teal/20 bg-teal/5" : "border-coral/30 bg-coral/5"}`}
                  />
                  <span className="text-xs font-bold text-teal/60">{label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Oasis-growth hero (focal, NOT a button) ───────────────────────── */}
        <section className="relative">
          <div className="relative aspect-[16/10] overflow-hidden rounded-bowl border border-teal/10 bg-teal shadow-lift">
            <img
              alt=""
              aria-hidden="true"
              src="/brand/stitch-32.png"
              className="h-full w-full object-cover"
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
                <span className="font-display text-xs font-bold uppercase tracking-wide text-paper">
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

        {/* ── ONE dominant CTA ──────────────────────────────────────────────── */}
        <section>
          {reviewCount > 0 ? (
            <button
              type="button"
              onClick={startReview}
              className="extruded-coral flex w-full items-center justify-center gap-3 rounded-2xl bg-coral py-5 font-display text-lg font-bold text-white transition active:translate-y-1"
            >
              <span>{pick(lang, "Start Review Session", "ابدأ جلسة المراجعة")}</span>
              <Icon name="bolt" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go({ name: "camera" })}
              className="extruded-teal flex w-full items-center justify-center gap-3 rounded-2xl bg-teal py-5 font-display text-lg font-bold text-white transition active:translate-y-1"
            >
              <span>{pick(lang, "Keep building", "واصل البناء")}</span>
              <Icon name="videocam" className={rtl ? "rotate-180" : ""} />
            </button>
          )}
        </section>

        {/* ── The Constellation ─────────────────────────────────────────────── */}
        <Constellation lang={lang} alphaTaught={alphaTaught} onTap={(id) => go({ name: "camera", targetSignId: id })} />

        {/* ── Coming Up ─────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <Title>{pick(lang, "Coming Up", "قادمة قريباً")}</Title>
          <p className="text-ink/60">{t("prUpcoming", lang)}</p>
          {empty ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-line bg-paper p-8 text-center shadow-soft">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
                <Icon name="task_alt" fill className="text-3xl" />
              </span>
              <p className="font-display text-lg font-bold text-teal">{t("prNothingDue", lang)}</p>
              <p className="text-sm text-muted">
                {pick(lang, "Nothing due right now — your oasis is thriving.", "لا شيء مستحق الآن — واحتك مزدهرة.")}
              </p>
              <button
                type="button"
                onClick={() => go({ name: "camera" })}
                className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-teal/10 px-5 py-2.5 font-display font-bold text-teal transition hover:bg-teal/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <Icon name="videocam" className="text-lg" />
                {t("practiceCamera", lang)}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
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
            </div>
          )}
        </section>
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
    </ScreenShell>
  );
}

// ── Alphabet Constellation — every taught letter is a gold star; the rest are
// dim numbered nodes waiting to be lit. ────────────────────────────────────────
function Constellation({
  lang,
  alphaTaught,
  onTap,
}: {
  lang: "en" | "ar";
  alphaTaught: number;
  onTap: (signId: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-bowl border-2 border-teal bg-teal-deep p-8">
      <header className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-paper">{pick(lang, "The Constellation", "الكوكبة")}</h3>
        <span className="rounded-full bg-paper/15 px-3 py-1 font-display text-xs font-black uppercase tracking-tight text-gold">
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
              onClick={() => onTap(s.id)}
              aria-label={pick(lang, s.glossEn, s.glossAr)}
              className={`flex aspect-square items-center justify-center rounded-full transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                lit
                  ? "scale-110 border-b-4 border-gold-deep bg-gold text-ink shadow-gold"
                  : "border-2 border-teal text-paper/40"
              }`}
            >
              {lit ? (
                <span className="font-display text-sm font-bold" dir="rtl">{s.code}</span>
              ) : (
                <span className="text-xs font-black">{num(i + 1, lang)}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-6 text-center font-display text-xs font-bold uppercase tracking-wide text-paper/60">
        {pick(lang, "Connect the signs to light the sky", "اربط الإشارات لتضيء السماء")}
      </p>
    </section>
  );
}

// ── Review-forecast row ─────────────────────────────────────────────────────
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
        <span className="block text-xs font-semibold text-teal/70">
          {sign.type === "alphabet" ? pick(lang, "Alphabet", "الحروف") : pick(lang, "Sign review", "مراجعة إشارة")}
        </span>
      </span>
      <span
        className={`flex items-center gap-1 rounded-full px-3 py-1 ${
          tone === "due" ? "bg-gold/10 text-gold" : "bg-teal/5 text-teal/70"
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
  // Latin display names interpolated into RTL strings get a bidi isolate (<bdi>)
  // so they don't visually reorder the surrounding Arabic.
  const headlinePrefix = pick(
    lang,
    `${n} ${n === 1 ? "day" : "days"} of showing up for `,
    `${num(n, lang)} ${n === 1 ? "يوم" : "أيام"} من المواظبة لأجل `
  );
  const arNumber = pick(lang, `${n} ${n === 1 ? "day" : "days"}`, `${num(n, lang)} ${n === 1 ? "يوم" : "أيام"}`);

  return (
    <div className="fixed inset-0 z-[100] flex select-none flex-col items-center justify-center bg-ink p-6 text-center">
      <Confetti burst={burst} />

      {/* Stitch chrome — gold wordmark + close affordance. */}
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
          <h1 className="px-4 font-display text-3xl tracking-tight text-paper md:text-4xl">
            {headlinePrefix}
            <bdi>{profile.displayName}</bdi>
          </h1>
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

        {/* motivational note */}
        <div className="mb-10 flex items-center gap-4 rounded-3xl border-2 border-teal/30 bg-teal/20 px-6 py-4 backdrop-blur-sm">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal text-paper">
            <Icon name="sign_language" fill />
          </span>
          <p className="text-start text-sm leading-snug text-paper/90 md:text-base">
            {pick(
              lang,
              `You've mastered ${mastered} signs so far. `,
              `لقد أتقنت ${num(mastered, lang)} إشارة حتى الآن. سيكون `
            )}
            <bdi>{profile.displayName}</bdi>
            {pick(lang, " is going to be so proud.", " فخوراً جداً بك.")}
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
