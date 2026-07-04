// Progress — "The World You're Building" (PRD §8), the "My World" surface behind
// the profile button. Reskinned (Turn 9 design) into a 4-tab surface —
// Your oasis · Stats · Achievements · Family league — inside the preserved
// takeover ScreenShell.
//
// The OASIS tab is the live default: the growing-oasis scene (Fanan relaxing by
// the water, swaying palms), live planted/palms tiles, a next-milestone bar, the
// live weekly streak, the Alphabet Constellation and the "Coming Up" SRS
// forecast with its designed empty state. STATS/ACHIEVEMENTS/LEAGUE adopt the
// design's card language and are ALL live store data (C6): accuracy derives
// from app.metrics with an honest "—" empty state, achievements from real
// mastery/streak counts, and the league binds to app.profiles with a solo
// empty state. Only the heatmap's intensity is binary, pending a per-day
// volume source.
//
// Live data preserved: mastery/seen counts, A1 + alphabet ring progress, due +
// upcoming SRS cards, profile streak/xp/goal, real weekly activeDays. Navigation
// (Start Review / sign rows) routes through the real ui store. The full-screen
// streak-celebration moment still fires on a fresh milestone. Read-only.
import { useEffect, useMemo, useRef, useState } from "react";
import { num, pick, t } from "../i18n";
import { A1_SIGNS, ALPHABET, signById } from "../content/signs";
import {
  activeProfile,
  dueSignIds,
  GOAL_XP,
  REVIEW_DAILY_CAP,
  reviewsTodayFor,
  streakFor,
  useApp,
} from "../store/app";
import { useUi } from "../store/ui";
import { Icon, Title } from "../components/ui";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { Confetti, celebrate } from "../components/Confetti";
import { Fanan } from "../components/Fanan";
import { toLocaleDigits, formatPercent } from "../components/dc";
import { SignGlyph } from "../components/SignGlyph";
import { useDialog } from "../components/useDialog";
import type { Lang, Metrics, Profile, Sign } from "../types";

const DAY_LABELS_EN = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_LABELS_AR = ["إث", "ث", "أر", "خ", "ج", "س", "ح"];

type Tab = "oasis" | "stats" | "achieve" | "league";

/** YYYY-MM-DD for an offset of `back` days before today. */
function dayKey(back: number): string {
  const d = new Date();
  d.setDate(d.getDate() - back);
  return d.toISOString().slice(0, 10);
}

// Design keyframes (float/sway) — scoped names so they resolve regardless of the
// Tailwind JIT purge. Reduce-motion is handled globally in src/styles.css.
const OASIS_KEYFRAMES = `
@keyframes pr-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes pr-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
`;

export function Progress() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  if (!profile) return <NoProfileFallback />;
  const lang = profile.language;
  const rtl = lang === "ar";
  const prog = app.progress[profile.id] ?? {};

  const [tab, setTab] = useState<Tab>("oasis");

  const mastered = Object.values(prog).filter((p) => p.masteryLevel >= 3).length;
  const seen = Object.values(prog).filter((p) => p.masteryLevel >= 1).length;
  const a1Done = A1_SIGNS.filter((s) => (prog[s.id]?.masteryLevel ?? 0) >= 2).length;
  // Letters THIS profile actually practised successfully — from the store, never
  // the recognizer's isTrained() (bundled seeds mark all 28 letters trained for a
  // brand-new user; rendering that as progress is a C6-class fabrication).
  const alphaLit = new Set(
    ALPHABET.filter((s) => (prog[s.id]?.masteryLevel ?? 0) >= 1).map((s) => s.id),
  );
  const alphaTaught = alphaLit.size;
  const due = dueSignIds(app, profile.id);
  const upcoming = Object.entries(app.srs[profile.id] ?? {})
    .filter(([, c]) => new Date(c.due).getTime() > Date.now())
    .sort((a, b) => new Date(a[1].due).getTime() - new Date(b[1].due).getTime())
    .slice(0, 6);

  // World growth — share of the A1 unit + alphabet brought to life. Feeds the
  // next-milestone bar (done / target).
  const totalTracked = A1_SIGNS.length + ALPHABET.length;
  const milestoneDone = a1Done + alphaTaught;
  const growth = Math.round((milestoneDone / Math.max(1, totalTracked)) * 100);

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

  // Month heatmap: last 35 days from the real activeDays set (binary intensity —
  // the app has no per-day volume source yet; flag for a future data hook).
  const heat = useMemo(
    () => Array.from({ length: 35 }, (_, i) => (activeSet.has(dayKey(34 - i)) ? 3 : 0)),
    [activeSet]
  );

  const goalXp = GOAL_XP[profile.dailyGoal];
  // Read-time streak: a lapsed learner sees 0, not their stale pre-lapse count (M26).
  const streak = streakFor(profile);

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
  const reviewCapped = reviewsTodayFor(profile) >= REVIEW_DAILY_CAP;
  // Review opens the real 10-card session (H3) — mixed drills, daily cap, and a
  // drain path for non-gradable due signs — not a single camera sign.
  function startReview() {
    go({ name: "lesson", lessonId: "review" });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "oasis", label: t("prTabOasis", lang) },
    { key: "stats", label: t("prTabStats", lang) },
    { key: "achieve", label: t("prTabAchieve", lang) },
    { key: "league", label: t("prTabLeague", lang) },
  ];
  const headerTitle = TABS.find((x) => x.key === tab)!.label;

  const empty = due.length === 0 && upcoming.length === 0;

  return (
    <ScreenShell lang={lang} chrome="takeover" title={headerTitle} onClose={() => go({ name: "home" })}>
      <style>{OASIS_KEYFRAMES}</style>
      <div className="mx-auto max-w-2xl px-4 py-4 md:px-6">
        {/* ── Tab bar (Block B) ──────────────────────────────────────────────── */}
        <div
          // L11-pattern: these switch in-page views without tabpanel wiring or
          // arrow-key roving — pressed buttons, not ARIA tabs.
          role="group"
          aria-label={pick(lang, "Progress views", "أوجه التقدّم")}
          className="flex flex-wrap gap-2 rounded-[18px] border border-line bg-paper p-3"
          style={{ boxShadow: "0 2px 0 #EDE3D2" }}
        >
          {TABS.map((x) => {
            const active = x.key === tab;
            return (
              <button
                key={x.key}
                type="button"
                aria-pressed={active}
                onClick={() => setTab(x.key)}
                className="rounded-[12px] px-[14px] py-[10px] font-display text-[12px] font-bold leading-none transition-all ease-standard duration-200"
                style={
                  active
                    ? { background: "#0F6E6A", color: "#FBF7EF", boxShadow: "0 3px 0 #0A4F4C" }
                    : { background: "#F6EFE3", color: "#566B68", boxShadow: "inset 0 0 0 1px #EDE3D2" }
                }
              >
                {x.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab panels ─────────────────────────────────────────────────────── */}
        <div className="mt-5">
          {tab === "oasis" && (
            <OasisTab
              lang={lang}
              rtl={rtl}
              mastered={mastered}
              alphaTaught={alphaTaught}
              alphaLit={alphaLit}
              milestoneDone={milestoneDone}
              totalTracked={totalTracked}
              growth={growth}
              xp={profile.xp}
              streak={streak}
              week={week}
              due={due}
              upcoming={upcoming}
              empty={empty}
              reviewCount={reviewCount}
              reviewCapped={reviewCapped}
              onReview={startReview}
              onCamera={() => go({ name: "camera" })}
              onSign={(id) => go({ name: "camera", targetSignId: id })}
            />
          )}
          {tab === "stats" && (
            <StatsTab lang={lang} mastered={mastered} streak={streak} heat={heat} metrics={app.metrics} />
          )}
          {tab === "achieve" && (
            <AchievementsTab
              lang={lang}
              seen={seen}
              mastered={mastered}
              streak={streak}
              alphaTaught={alphaTaught}
              flagsRaised={app.flags.length}
            />
          )}
          {tab === "league" && (
            <LeagueTab
              lang={lang}
              profiles={app.profiles}
              activeProfileId={app.activeProfileId}
              onAddFamily={() => go({ name: "family" })}
            />
          )}
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
    </ScreenShell>
  );
}

// ── OASIS tab ────────────────────────────────────────────────────────────────
function OasisTab({
  lang,
  rtl,
  mastered,
  alphaTaught,
  alphaLit,
  milestoneDone,
  totalTracked,
  growth,
  xp,
  streak,
  week,
  due,
  upcoming,
  empty,
  reviewCount,
  reviewCapped,
  onReview,
  onCamera,
  onSign,
}: {
  lang: Lang;
  rtl: boolean;
  mastered: number;
  alphaTaught: number;
  alphaLit: Set<string>;
  milestoneDone: number;
  totalTracked: number;
  growth: number;
  xp: number;
  streak: number;
  week: { state: "active" | "missed" | "future"; today?: boolean }[];
  due: string[];
  upcoming: [string, { due: string }][];
  empty: boolean;
  reviewCount: number;
  reviewCapped: boolean;
  onReview: () => void;
  onCamera: () => void;
  onSign: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Title + body */}
      <div>
        <h2 className="font-display text-[25px] font-extrabold leading-[1.1] text-ink">{t("prOasisTitle", lang)}</h2>
        <p className="mt-[3px] text-[13px] leading-[1.35] text-muted">{t("prOasisBody", lang)}</p>
      </div>

      {/* Oasis scene — non-interactive, illustrated. Fanan never mirrors. */}
      <div
        aria-hidden="true"
        className="relative overflow-hidden rounded-[22px]"
        style={{ height: 236, background: "linear-gradient(180deg,#FBF7EF 0%,#FBF3E6 55%,#F0E4CC 100%)" }}
      >
        {/* sun */}
        <div
          className="absolute top-5"
          style={{
            insetInlineEnd: 24,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#F0C879",
            boxShadow: "0 0 0 10px rgba(240,200,121,.25)",
          }}
        />
        {/* sand mound */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: 96, background: "#EBD9B6", borderRadius: "50% 50% 0 0 / 40px 40px 0 0" }}
        />
        {/* water pool */}
        <div
          className="absolute left-1/2"
          style={{
            bottom: 26,
            transform: "translateX(-50%)",
            width: 150,
            height: 52,
            borderRadius: "50%",
            background: "#0F6E6A",
            boxShadow: "inset 0 4px 0 rgba(255,255,255,.15)",
          }}
        />
        {/* palm 1 */}
        <div
          className="absolute"
          style={{ bottom: 60, left: 56, transformOrigin: "bottom center", animation: "pr-sway 4s ease-in-out infinite" }}
        >
          <div style={{ width: 9, height: 64, background: "#C89A3D", borderRadius: 5, margin: "0 auto" }} />
          <div className="absolute left-1/2" style={{ top: -6, transform: "translateX(-50%)", width: 70, height: 34 }}>
            <div className="absolute left-1/2 top-0" style={{ width: 38, height: 15, background: "#0F6E6A", borderRadius: "50%", transform: "translateX(-90%) rotate(-24deg)" }} />
            <div className="absolute left-1/2 top-0" style={{ width: 38, height: 15, background: "#0F6E6A", borderRadius: "50%", transform: "translateX(-10%) rotate(24deg)" }} />
            <div className="absolute left-1/2" style={{ top: -4, width: 34, height: 14, background: "#0A4F4C", borderRadius: "50%", transform: "translateX(-50%)" }} />
          </div>
        </div>
        {/* palm 2 */}
        <div
          className="absolute"
          style={{ bottom: 56, right: 60, transformOrigin: "bottom center", animation: "pr-sway 4.6s ease-in-out infinite" }}
        >
          <div style={{ width: 8, height: 50, background: "#C89A3D", borderRadius: 5, margin: "0 auto" }} />
          <div className="absolute left-1/2" style={{ top: -5, transform: "translateX(-50%)", width: 60, height: 30 }}>
            <div className="absolute left-1/2 top-0" style={{ width: 32, height: 13, background: "#0F6E6A", borderRadius: "50%", transform: "translateX(-90%) rotate(-24deg)" }} />
            <div className="absolute left-1/2 top-0" style={{ width: 32, height: 13, background: "#0F6E6A", borderRadius: "50%", transform: "translateX(-10%) rotate(24deg)" }} />
            <div className="absolute left-1/2" style={{ top: -3, width: 28, height: 12, background: "#0A4F4C", borderRadius: "50%", transform: "translateX(-50%)" }} />
          </div>
        </div>
        {/* sprout */}
        <div className="absolute left-1/2" style={{ bottom: 40, transform: "translateX(-50%)" }}>
          <div style={{ width: 5, height: 16, background: "#0F6E6A", borderRadius: 3, margin: "0 auto" }} />
          <div style={{ width: 14, height: 8, background: "#1F8A5B", borderRadius: "50%", marginTop: -14 }} />
        </div>
        {/* Fanan — pose cheer, never mirrors; sits at the logical end edge. */}
        <div className="absolute" style={{ bottom: 8, insetInlineEnd: 14, animation: "pr-float 3s ease-in-out infinite" }}>
          <Fanan pose="cheer" scale={0.5} />
        </div>
      </div>

      {/* Two stat tiles */}
      <div className="flex gap-[10px]">
        <div className="flex-1 rounded-[16px] border border-line bg-paper p-[13px] text-center">
          <div className="font-display text-[24px] font-extrabold leading-none text-teal">{toLocaleDigits(mastered, lang)}</div>
          <div className="mt-1 text-[11px] font-semibold leading-[1.2] text-muted">{t("prPlanted", lang)}</div>
        </div>
        <div className="flex-1 rounded-[16px] border border-line bg-paper p-[13px] text-center">
          <div className="font-display text-[24px] font-extrabold leading-none" style={{ color: "#E6B24C" }}>
            {toLocaleDigits(alphaTaught, lang)}
          </div>
          <div className="mt-1 text-[11px] font-semibold leading-[1.2] text-muted">{t("prPalmsGrown", lang)}</div>
        </div>
      </div>

      {/* Next-milestone card — fill mirrors in RTL via document dir. */}
      <div className="rounded-[16px] border border-line bg-paper p-[14px]">
        <div className="mb-2 flex justify-between text-[12px] font-semibold leading-none">
          <span className="text-ink">{t("prNextMilestone", lang)}</span>
          <span className="text-muted">
            {toLocaleDigits(milestoneDone, lang)} / {toLocaleDigits(totalTracked, lang)}
          </span>
        </div>
        <div className="h-[9px] overflow-hidden rounded-full" style={{ background: "#EDE3D2" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, growth))}%`, background: "linear-gradient(90deg,#F0C879,#E6B24C)" }}
          />
        </div>
      </div>

      {/* Weekly streak (live activeDays) — restyled to the card system. */}
      <div className="rounded-[16px] border border-line bg-paper p-[14px]">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-ink">{pick(lang, "Weekly streak", "المواظبة الأسبوعية")}</span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true">🔥</span>
            <span className="font-display text-[15px] font-extrabold text-ink">{num(streak, lang)}</span>
            <span className="ms-2 text-[11px] font-semibold text-muted">
              {num(mastered, lang)} {t("prMastered", lang)}
            </span>
            <span className="ms-2 text-[11px] font-semibold text-muted">
              {num(xp, lang)} {t("xp", lang)}
            </span>
          </span>
        </div>
        <div className="flex items-end justify-between gap-1.5">
          {week.map((d, i) => {
            const label = (rtl ? DAY_LABELS_AR : DAY_LABELS_EN)[i];
            if (d.state === "active") {
              return (
                <div key={i} className={`flex flex-col items-center gap-1.5 ${d.today ? "scale-110" : ""}`}>
                  <span
                    className="relative flex h-8 w-8 items-center justify-center rounded-full text-ink"
                    style={{ background: "#E6B24C", boxShadow: d.today ? "0 3px 0 #C89A3D" : "none" }}
                  >
                    <Icon name="check" fill className="text-[16px]" />
                    {d.today && <span className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-coral" />}
                  </span>
                  <span className="text-[11px] font-bold text-teal">{label}</span>
                </div>
              );
            }
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span
                  className={`h-8 w-8 rounded-full border-2 border-dashed ${d.state === "future" ? "border-teal/20 bg-teal/5" : "border-coral/30 bg-coral/5"}`}
                />
                <span className="text-[11px] font-bold text-teal">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* The Constellation — live alphabet ring. */}
      <Constellation lang={lang} alphaTaught={alphaTaught} alphaLit={alphaLit} onTap={onSign} />

      {/* Coming Up — SRS forecast with designed empty state. */}
      <section className="space-y-3">
        <Title>{pick(lang, "Coming Up", "قادمة قريباً")}</Title>
        <p className="text-[13px] text-muted">{t("prUpcoming", lang)}</p>
        {empty ? (
          <div className="flex flex-col items-center gap-3 rounded-[16px] border border-line bg-paper p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
              <Icon name="task_alt" fill className="text-3xl" />
            </span>
            <p className="font-display text-lg font-bold text-teal">{t("prNothingDue", lang)}</p>
            <p className="text-sm text-muted">
              {pick(lang, "Nothing due right now — your oasis is thriving.", "لا شيء مستحق الآن — واحتك مزدهرة.")}
            </p>
            <button
              type="button"
              onClick={onCamera}
              className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-teal/10 px-5 py-2.5 font-display font-bold text-teal transition hover:bg-teal/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <Icon name="videocam" className="text-lg" />
              {t("practiceCamera", lang)}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewCount > 0 && !reviewCapped && (
              <button
                type="button"
                onClick={onReview}
                className="extruded-coral flex w-full items-center justify-center gap-3 rounded-2xl bg-coral-deep py-4 font-display text-base font-bold text-white transition active:translate-y-1"
              >
                <span>{pick(lang, "Start Review Session", "ابدأ جلسة المراجعة")}</span>
                <Icon name="bolt" />
              </button>
            )}
            {/* Daily soft cap reached (H3) — honest done-for-today note, no endless queue. */}
            {reviewCount > 0 && reviewCapped && (
              <div className="flex w-full items-center gap-3 rounded-2xl border border-line bg-paper p-4">
                <Icon name="task_alt" className="shrink-0 text-2xl text-teal" />
                <p className="min-w-0 flex-1 font-display text-sm font-bold leading-snug text-ink">
                  {t("reviewCapDone", lang)}
                </p>
              </div>
            )}
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
                  onClick={() => onSign(sign.id)}
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
                  onClick={() => onSign(sign.id)}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ── STATS tab — grid + month heatmap. Every number is real store data (C6):
// camera accuracy derives from metrics; drills replace the un-tracked "minutes"
// (never render a number the store can't back — "—" until data exists). ────────
function StatsTab({
  lang,
  mastered,
  streak,
  heat,
  metrics,
}: {
  lang: Lang;
  mastered: number;
  streak: number;
  heat: number[];
  metrics: Metrics;
}) {
  const shades = ["#EDE3D2", "#9DC6C2", "#3E9A93", "#0F6E6A"];
  const accuracy =
    metrics.cameraAttempts > 0
      ? formatPercent(Math.round((100 * metrics.cameraMatches) / metrics.cameraAttempts), lang)
      : "—";
  const cells: { val: string; label: string; color: string }[] = [
    { val: toLocaleDigits(mastered, lang), label: t("prStatMastered", lang), color: "#0F6E6A" },
    { val: accuracy, label: t("prAvgAccuracy", lang), color: "#0F6E6A" },
    { val: toLocaleDigits(metrics.drillsCompleted, lang), label: t("prDrillsDone", lang), color: "#C89A3D" },
    { val: toLocaleDigits(streak, lang), label: t("prBestStreak", lang), color: "#E8654C" },
  ];
  return (
    <div className="space-y-0">
      <h2 className="font-display text-[25px] font-extrabold leading-[1.1] text-ink">{t("prStatsTitle", lang)}</h2>
      <div className="mt-[14px] grid grid-cols-2 gap-[10px]">
        {cells.map((c, i) => (
          <div key={i} className="rounded-[16px] border border-line bg-paper p-[14px]">
            <div className="font-display text-[26px] font-extrabold leading-none" style={{ color: c.color }}>
              {c.val}
            </div>
            <div className="mt-[5px] text-[11px] font-semibold leading-[1.2] text-muted">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-[22px] font-mono text-[11px] font-bold uppercase leading-none tracking-[0.1em] text-teal">
        {t("prThisMonth", lang)}
      </div>
      <div className="mt-[11px] rounded-[16px] border border-line bg-paper p-4">
        <div className="grid grid-cols-7 gap-[6px]">
          {heat.map((l, i) => (
            <div key={i} className="rounded-[4px]" style={{ aspectRatio: "1", background: shades[l] }} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-[5px]">
          <span className="text-[10px] font-medium text-muted">{t("prLess", lang)}</span>
          {shades.map((s) => (
            <div key={s} className="rounded-[3px]" style={{ width: 11, height: 11, background: s }} />
          ))}
          <span className="text-[10px] font-medium text-muted">{t("prMore", lang)}</span>
        </div>
      </div>
    </div>
  );
}

// ── ACHIEVEMENTS tab — every earned state derives from live store data (C6);
// the family-flag badge unlocks when the household has raised a flag. ───────────
function AchievementsTab({
  lang,
  seen,
  mastered,
  streak,
  alphaTaught,
  flagsRaised,
}: {
  lang: Lang;
  seen: number;
  mastered: number;
  streak: number;
  alphaTaught: number;
  flagsRaised: number;
}) {
  const items: { glyph: string; name: string; status: string; earned: boolean }[] = [
    { glyph: "🌱", name: t("prAchFirstSign", lang), status: t("prUnlocked", lang), earned: seen >= 1 },
    { glyph: "🔥", name: t("prAch7Day", lang), status: t("prUnlocked", lang), earned: streak >= 7 },
    { glyph: "🤟", name: t("prAch5Words", lang), status: t("prUnlocked", lang), earned: mastered >= 5 },
    { glyph: "أ", name: t("prAchAlphabetStarted", lang), status: t("prUnlocked", lang), earned: alphaTaught >= 1 },
    {
      glyph: "👪",
      name: t("prAchFamilyFlag", lang),
      status: flagsRaised > 0 ? t("prUnlocked", lang) : "—",
      earned: flagsRaised > 0,
    },
    {
      glyph: "🏆",
      name: t("prAchWholeAlphabet", lang),
      status: `${toLocaleDigits(alphaTaught, lang)} / ${toLocaleDigits(28, lang)}`,
      earned: alphaTaught >= 28,
    },
  ];
  const earnedCount = items.filter((a) => a.earned).length;
  const summary = t("prAchieveSummary", lang)
    .replace("{n}", toLocaleDigits(earnedCount, lang))
    .replace("{total}", toLocaleDigits(items.length, lang));

  return (
    <div>
      <h2 className="font-display text-[25px] font-extrabold leading-[1.1] text-ink">{t("prAchievements", lang)}</h2>
      <p className="mt-[3px] text-[13px] leading-[1.35] text-muted">{summary}</p>
      <div className="mt-4 grid grid-cols-2 gap-[11px]">
        {items.map((a, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-[16px] px-[10px] py-4"
            style={{
              background: "#FBF7EF",
              border: a.earned ? "2px solid #E6B24C" : "2px dashed #C7BBA4",
              opacity: a.earned ? 1 : 0.72,
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                fontSize: 25,
                background: a.earned ? "#F6EFE3" : "#EDE3D2",
                filter: a.earned ? "none" : "grayscale(0.7)",
              }}
            >
              <span aria-hidden="true">{a.glyph}</span>
            </div>
            <div
              className="mt-[9px] text-center font-display text-[13px] font-bold leading-[1.1]"
              style={{ color: a.earned ? "#16302E" : "#94A5A2" }}
            >
              {a.name}
            </div>
            <div className="mt-[3px] text-center text-[10px] font-medium leading-[1.2] text-[#94A5A2]">{a.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FAMILY LEAGUE tab — bound to the REAL household profiles in the store (C6).
// Solo users get an honest empty state; no fabricated members, no phantom toggle.
const LEAGUE_AVATAR_BG = ["#E6B24C", "#0F6E6A", "#E8654C", "#0A4F4C"];

function LeagueTab({
  lang,
  profiles,
  activeProfileId,
  onAddFamily,
}: {
  lang: Lang;
  profiles: Profile[];
  activeProfileId: string | null;
  onAddFamily: () => void;
}) {
  const ranked = [...profiles].sort((a, b) => b.xp - a.xp);
  const max = Math.max(1, ...ranked.map((p) => p.xp));
  const colorFor = (p: Profile) =>
    LEAGUE_AVATAR_BG[Math.max(0, profiles.findIndex((x) => x.id === p.id)) % LEAGUE_AVATAR_BG.length];
  const initialOf = (name: string) => [...name.trim()][0] ?? "؟";

  return (
    <div>
      <h2 className="font-display text-[25px] font-extrabold leading-[1.1] text-ink">{t("prLeagueTitle", lang)}</h2>
      <p className="mt-[3px] text-[13px] leading-[1.35] text-muted">{t("prLeagueBody", lang)}</p>

      {/* Warm note */}
      <div
        className="mt-[14px] flex items-center gap-[9px] rounded-[14px] px-[13px] py-[11px]"
        style={{ background: "#E6F0EE", border: "1px solid #C9E0DC" }}
      >
        <div className="flex-none" style={{ width: 20, height: 20, borderRadius: 6, background: "#0F6E6A" }} />
        <span className="text-[12px] font-semibold leading-[1.3] text-teal">{t("prLeagueWarm", lang)}</span>
      </div>

      {profiles.length <= 1 ? (
        // Honest empty state — one learner is not a league.
        <div className="mt-[14px] flex flex-col items-center gap-3 rounded-[16px] border border-line bg-paper p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
            <Icon name="family_restroom" fill className="text-3xl" />
          </span>
          <p className="max-w-[280px] text-sm leading-relaxed text-muted">{t("prLeagueSolo", lang)}</p>
          <button
            type="button"
            onClick={onAddFamily}
            className="mt-1 inline-flex items-center gap-2 rounded-2xl bg-teal/10 px-5 py-2.5 font-display font-bold text-teal transition hover:bg-teal/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <Icon name="person_add" className="text-lg" />
            {t("famAdd", lang)}
          </button>
        </div>
      ) : (
        // Ranked rows — real names, real XP, "you" = the active profile.
        <div className="mt-[14px] flex flex-col gap-[10px]">
          {ranked.map((p, i) => {
            const you = p.id === activeProfileId;
            const bg = colorFor(p);
            return (
              <div
                key={p.id}
                className="flex items-center gap-[11px] rounded-[15px] px-[13px] py-[11px]"
                style={{ background: you ? "#FBF3EF" : "#FBF7EF", border: you ? "1px solid #F5C9BE" : "1px solid #EDE3D2" }}
              >
                <span className="flex-none text-center font-display text-[15px] font-extrabold leading-none text-muted" style={{ width: 18 }}>
                  {toLocaleDigits(i + 1, lang)}
                </span>
                <div
                  className="flex flex-none items-center justify-center font-display text-[15px] font-extrabold"
                  style={{ width: 38, height: 38, borderRadius: "50%", background: bg, color: bg === "#E6B24C" ? "#16302E" : "#FBF7EF" }}
                  aria-hidden="true"
                >
                  {initialOf(p.displayName)}
                </div>
                <div className="flex-1">
                  <div className="font-display text-[14px] font-bold leading-[1.1] text-ink">
                    <bdi>{p.displayName}</bdi>
                  </div>
                  <div className="mt-[5px] h-[6px] overflow-hidden rounded-full" style={{ background: "#EDE3D2" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round((p.xp / max) * 100)}%`, background: "linear-gradient(90deg,#F0C879,#E6B24C)" }} />
                  </div>
                </div>
                <span className="flex-none font-display text-[14px] font-extrabold leading-none text-teal">{toLocaleDigits(p.xp, lang)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Alphabet Constellation — every taught letter is a gold star; the rest are
// dim numbered nodes waiting to be lit. ────────────────────────────────────────
function Constellation({
  lang,
  alphaTaught,
  alphaLit,
  onTap,
}: {
  lang: Lang;
  alphaTaught: number;
  alphaLit: Set<string>;
  onTap: (signId: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-bowl border-2 border-teal bg-teal-deep p-6">
      <header className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-paper">{pick(lang, "The Constellation", "الكوكبة")}</h3>
        <span className="rounded-full bg-paper/15 px-3 py-1 font-display text-xs font-black uppercase tracking-tight text-gold">
          {num(alphaTaught, lang)} / {num(ALPHABET.length, lang)} {pick(lang, "Found", "مكتشفة")}
        </span>
      </header>
      <div className="grid grid-cols-5 gap-4" dir="ltr">
        {ALPHABET.map((s, i) => {
          const lit = alphaLit.has(s.id);
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
      <p className="mt-5 text-center font-display text-xs font-bold uppercase tracking-wide text-paper/90">
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
  lang: Lang;
  tone: "due" | "later";
  badge: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-[16px] border bg-paper p-3 text-start transition-colors hover:border-gold ${
        tone === "due" ? "border-gold/40" : "border-line"
      }`}
      style={{ boxShadow: "0 2px 0 #EDE3D2" }}
    >
      <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-teal/5 bg-sand">
        {/* SignGlyph — real handshape / letter / honest icon, never emoji-as-sign (H14). */}
        <span aria-hidden="true">
          <SignGlyph sign={sign} lang={lang} className="text-3xl" imgClassName="h-10 w-10 object-contain" />
        </span>
      </span>
      <span className="flex-grow">
        <span className="block text-base font-bold leading-tight text-ink">{pick(lang, sign.glossEn, sign.glossAr)}</span>
        <span className="block text-xs font-semibold text-teal">
          {sign.type === "alphabet" ? pick(lang, "Alphabet", "الحروف") : pick(lang, "Sign review", "مراجعة إشارة")}
        </span>
      </span>
      <span
        className={`flex items-center gap-1 rounded-full px-3 py-1 ${
          tone === "due" ? "bg-gold/10 text-gold" : "bg-teal/5 text-teal"
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
  lang: Lang;
  mastered: number;
  goalXp: number;
  week: { state: "active" | "missed" | "future"; today?: boolean }[];
  onContinue: () => void;
}) {
  const [burst, setBurst] = useState(0);
  const rtl = lang === "ar";
  // H16: this full-screen celebration is a takeover overlay stacked on top of
  // Progress — focus it on mount, trap Tab, Escape to dismiss, restore focus
  // to Progress on close.
  const dialogRef = useDialog<HTMLDivElement>(true, onContinue);
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
  void goalXp;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={pick(lang, "Streak celebration", "احتفال بالمواظبة")}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex select-none flex-col items-center justify-center bg-ink p-6 text-center focus:outline-none"
    >
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

      {/* M17: not <main> — this celebration overlay is nested inside App.tsx's
          <main>, which already owns the one landmark. */}
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
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
      </div>

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
