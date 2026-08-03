// Onboarding — reskinned to the "Sawiyya Onboarding.dc.html" design language.
// The functional step machine (splash/lang/learn/why/goal/name) and all its
// wiring are PRESERVED (design/rebuild-source/specs/onboarding.md §1), minus
// the handedness step, which fed a field nothing in the app reads.
// Trimmed per L20: the inert "your why" step is cut, camera + on-device privacy
// are one screen, and the reminders step is honest (a real .ics download — H20).
// Every step is re-dressed in the device-column visual system: springy amber
// progress, Fanan poses per screen, teal/coral selection chips and the signature
// hard-shadow footer CTA. Bilingual EN(LTR)/AR(RTL) via logical properties.
import { useEffect, useState } from "react";
import {
  pick,
  t,
  applyDir,
  langFromSearch,
  weekdayName,
  weekdayIcsCode,
  WEEKDAY_COUNT,
} from "../i18n";
import { PERSONA_TAGLINE } from "../content/signs";
import { useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { DailyGoal, Lang, Persona, PriorSigning } from "../types";
import { Fanan } from "../components/Fanan";
import { SpringButton, MonoLabel } from "../components/dc";

// Step machine: every step that feeds a real createProfile input, plus the
// design moments that earn their keep. Trimmed per L20: the camera
// how-it-works and on-device privacy screens are merged into one. The
// handedness step is gone: nothing reads dominantHand and the recognizer
// canonicalises both hands itself, so asking was a lever with nothing on the
// other end.
// Phase 2 · ONE first run. The "What do you want to learn?" track chooser is
// gone: it branched the app in three directions, and one of them (Everyday
// signs) could not reach the aha moment at all, because the 19 word signs are
// watch-only. Everyone now walks the same road and lands on the same lesson
// one. Per the Headspace teardown, the ASKING is the mechanism — answers are
// recorded and shown back, they do not fork the curriculum.
//
// splash · meet · lang · why · know · plan · reminders · recap · name · camera
//
// The camera explainer moved to the END, immediately before FirstSign asks the
// browser for the permission. It used to sit six screens early, so the sentence
// explaining the camera had been forgotten by the time the prompt appeared.
type Step =
  | "splash"
  | "meet"
  | "lang"
  | "why"
  | "know"
  | "plan"
  | "reminders"
  | "recap"
  | "name"
  | "camera";

// Persona choices (PRESERVE §1 data table — values/keys/ar/icon stay intact).
const PERSONAS: {
  value: Persona;
  icon: string;
  key: "obParent" | "obSibling" | "obTeacher" | "obFriend" | "obDeaf";
  ar: string;
}[] = [
  { value: "parent", icon: "family_restroom", key: "obParent", ar: "طفلي" },
  { value: "sibling", icon: "diversity_3", key: "obSibling", ar: "أخي أو أختي" },
  { value: "teacher", icon: "school", key: "obTeacher", ar: "طالبي" },
  { value: "friend", icon: "group", key: "obFriend", ar: "صديقي" },
  { value: "deaf", icon: "sign_language", key: "obDeaf", ar: "أنا أصم، أهيّئ عائلتي" },
];

// Daily-goal choices (PRESERVE §1 data table).
const GOALS: { value: DailyGoal; key: "obCasual" | "obRegular" | "obSerious"; icon: string }[] = [
  { value: "casual", key: "obCasual", icon: "potted_plant" },
  { value: "regular", key: "obRegular", icon: "eco" },
  { value: "serious", key: "obSerious", icon: "forest" },
];

// "What do you know already?" — recorded, shown back on the recap, and used
// nowhere else. Ordered easiest-to-admit first.
const PRIORS: {
  value: PriorSigning;
  key: "obKnowNone" | "obKnowSome" | "obKnowFluent";
  subKey: "obKnowNoneSub" | "obKnowSomeSub" | "obKnowFluentSub";
}[] = [
  { value: "none", key: "obKnowNone", subKey: "obKnowNoneSub" },
  { value: "some", key: "obKnowSome", subKey: "obKnowSomeSub" },
  { value: "fluent", key: "obKnowFluent", subKey: "obKnowFluentSub" },
];

// Choice-card affordance (PRESERVE §1 — retuned to the new paper/hairline look).
const cardBase =
  "relative flex w-full items-center rounded-2xl border border-line bg-paper text-start transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 shadow-[0_2px_0_#EDE3D2]";

// Selected / unselected hard-shadow chip skins (design's teal-fill vs hairline).
const chipSel = "bg-teal text-paper shadow-[0_4px_0_#0A4F4C]";
const chipIdle = "bg-paper text-ink shadow-[inset_0_0_0_1px_#EDE3D2]";

// Real daily reminder via the user's own calendar (H20): Sawiyya sends no
// notifications (no push, no email — everything stays on-device), so the only
// honest offer is a downloadable .ics with a daily RRULE that the user's own
// calendar app owns from then on.
function downloadReminderIcs(lang: Lang, practiseDays: number[]) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date();
  start.setDate(start.getDate() + 1); // first occurrence: tomorrow
  const dtStart = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T180000`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  // The days the learner just picked ARE the recurrence. Answering "Mondays and
  // Thursdays" and then being handed a daily reminder is the app not listening.
  // No days picked (or all seven) stays a plain daily rule.
  const byDay =
    practiseDays.length > 0 && practiseDays.length < WEEKDAY_COUNT
      ? `;BYDAY=${[...practiseDays].sort((a, b) => a - b).map(weekdayIcsCode).join(",")}`
      : "";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sawiyya//Daily practice reminder//EN",
    "BEGIN:VEVENT",
    `UID:sawiyya-daily-practice-${Date.now()}@sawiyya.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`, // floating local time — 6:00 pm wherever the user is
    "DURATION:PT10M",
    `RRULE:FREQ=WEEKLY${byDay || ";BYDAY=SU,MO,TU,WE,TH,FR,SA"}`,
    `SUMMARY:${t("obRemindEventTitle", lang)}`,
    "URL:https://theshumba.github.io/sawiyya/",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "sawiyya-daily-practice.ics";
  a.click();
  URL.revokeObjectURL(url);
}

function CheckGlyph() {
  // Never mirrors (HANDOFF §2) — physical direction locked.
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ direction: "ltr" }}>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Onboarding() {
  const { createProfile, completeOnboarding } = useApp();
  const { go } = useUi();
  const [step, setStep] = useState<Step>("splash");
  // Landing→app handoff (M27): honour ?lang=ar so an Arabic visitor's first-run
  // opens Arabic/RTL from the splash, not English LTR until the language step.
  const [lang, setLang] = useState<Lang>(() => langFromSearch(window.location.search) ?? "en");
  useEffect(() => {
    applyDir(lang);
    // mount-only: the language step calls applyDir itself on later changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [persona, setPersona] = useState<Persona>("parent");
  const [goal, setGoal] = useState<DailyGoal>("regular");
  const [prior, setPrior] = useState<PriorSigning>("none");
  // Empty until they touch it, and it stays empty if they skip — Home then says
  // nothing rather than inventing a commitment.
  const [days, setDays] = useState<number[]>([]);
  const [name, setName] = useState("");
  // Reminder .ics downloaded this session (label feedback only — the user's
  // calendar app owns the reminder from here).
  const [icsDownloaded, setIcsDownloaded] = useState(false);

  // The camera explainer is the terminal step, so a profile is never created
  // before the learner has been asked their name AND told what the camera does.
  // Whatever they did not answer keeps the sensible defaults above.
  //
  // ONE destination. There is no track to honour any more: everybody lands on
  // FirstSign, which teaches the head of the path, and FirstSign hands them on
  // to Home with the first node lit.
  const finish = () => {
    const displayName = name.trim() || (lang === "ar" ? "أنا" : "Me");
    createProfile({
      displayName,
      role: persona,
      // Inert field: nothing in the app reads dominantHand and the recognizer
      // canonicalises both hands itself, so we no longer ask for it.
      dominantHand: "R",
      language: lang,
      dailyGoal: goal,
      priorSigning: prior,
      practiseDays: days,
    });
    completeOnboarding();
    go({ name: "firstSign" });
  };

  const chooseLang = (l: Lang) => {
    setLang(l);
    applyDir(l);
    setStep("why");
  };

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));

  const everyDay = days.length === WEEKDAY_COUNT;

  // How the chosen days read back, used by the recap and by the calendar
  // preview. No answer means the .ics falls back to daily, so it says so.
  const daysLabel =
    everyDay || days.length === 0
      ? t("obPlanEveryDay", lang)
      : days.map((d) => weekdayName(d, lang)).join(pick(lang, ", ", "، "));

  const STEP_ORDER: Step[] = [
    "splash",
    "meet",
    "lang",
    "why",
    "know",
    "plan",
    "reminders",
    "recap",
    "name",
    "camera",
  ];
  const stepIndex = STEP_ORDER.indexOf(step);
  const total = STEP_ORDER.length;
  const back = () => {
    if (stepIndex > 0) setStep(STEP_ORDER[stepIndex - 1]);
  };
  const advance = () => {
    if (stepIndex < total - 1) setStep(STEP_ORDER[stepIndex + 1]);
  };

  const dark = step === "splash"; // sand hero background (design s0).
  const progressPct = `${((stepIndex + 1) / total) * 100}%`;

  // Footer CTA per step (design Block D). Name owns its own submit button, and
  // the camera explainer is terminal: its CTA is what creates the profile.
  const footer: { label: string; onClick: () => void; variant: "teal" | "coral" } | null =
    step === "splash"
      ? { label: t("obWelcomeCta", lang), onClick: advance, variant: "coral" }
      : step === "meet"
        ? { label: t("obFananCta", lang), onClick: advance, variant: "teal" }
        : step === "lang"
          ? { label: t("obContinue", lang), onClick: () => chooseLang(lang), variant: "teal" }
          : step === "why" || step === "know" || step === "plan" || step === "reminders"
            ? { label: t("obContinue", lang), onClick: advance, variant: "teal" }
            : step === "recap"
              ? { label: t("obRecapCta", lang), onClick: advance, variant: "teal" }
              : step === "camera"
                ? { label: t("obCamCta", lang), onClick: finish, variant: "coral" }
                : null;

  return (
    <div className={`flex min-h-dvh w-full justify-center ${dark ? "bg-sand" : "bg-paper"}`}>
      <div className="flex min-h-dvh w-full max-w-md flex-col">
        {/* Header — back + springy amber progress + skip (PRESERVE §1). */}
        <div className="flex items-center gap-3 px-6 pt-4">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={back}
              aria-label={lang === "ar" ? "رجوع" : "Back"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink shadow-[inset_0_0_0_1px_#EDE3D2] transition active:scale-95"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="rtl:-scale-x-100"
              >
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span className="h-10 w-10 shrink-0" />
          )}

          <div
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-label={pick(lang, "Setup progress", "تقدّم الإعداد")}
            className="flex h-[7px] flex-1 overflow-hidden rounded-full bg-line"
          >
            {/* Fills from the start edge → mirrors in RTL. */}
            <div
              className="h-full rounded-full bg-gold transition-[width] duration-300 ease-spring"
              style={{ width: progressPct }}
            />
          </div>

          {/* Skip jumps to the name step rather than finishing: it means "use
              defaults for what I have not answered", never "throw away what I
              already chose" and never a profile called Me. It still passes
              through the camera explainer, because that sentence has to be read
              before the browser asks for the permission. Name owns its own
              submit and camera is terminal, so neither shows a Skip. */}
          {step !== "splash" && step !== "name" && step !== "camera" ? (
            <button
              type="button"
              onClick={() => setStep("name")}
              className="min-w-10 shrink-0 text-[13px] font-bold text-teal transition active:scale-95"
            >
              {t("obSkip", lang)}
            </button>
          ) : (
            <span className="h-10 w-10 shrink-0" />
          )}
        </div>

        {/* Body (design Block C) — M17: Onboarding renders before a profile
            exists, so it bypasses App.tsx's <main>; it needs its own. */}
        <main className="flex flex-1 flex-col overflow-y-auto px-6 pb-2 pt-3">
          {/* s0 · Welcome (reskinned splash) */}
          {step === "splash" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <div className="animate-float">
                <Fanan pose="wave" scale={1.15} />
              </div>
              <h1 className="mt-3 animate-rise font-display text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
                {t("obWelcomeTitle", lang)}
              </h1>
              <p className="max-w-[250px] animate-rise text-[15px] leading-[1.45] text-muted">
                {t("obWelcomeBody", lang)}
              </p>
            </div>
          )}

          {/* s1 · Meet Fanan */}
          {step === "meet" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
              <div className="animate-float">
                <Fanan pose="cheer" scale={1.2} />
              </div>
              <MonoLabel lang={lang} className="mt-3 text-coral">{t("obFananEyebrow", lang)}</MonoLabel>
              <h1 className="mt-1.5 animate-rise font-display text-[32px] font-extrabold leading-[1.05] text-ink">
                {t("obFananTitle", lang)}
              </h1>
              <p className="mt-1 max-w-[252px] text-[15px] leading-[1.45] text-muted">{t("obFananBody", lang)}</p>
            </div>
          )}

          {/* s2 · Language */}
          {step === "lang" && (
            <div className="flex flex-1 flex-col">
              <div className="mt-2">
                <Fanan pose="idle" scale={0.7} />
              </div>
              <h1 className="mt-2 font-display text-[26px] font-extrabold leading-[1.1] text-ink">
                {t("obLangTitle", lang)}
              </h1>
              <p className="mt-1.5 text-[14px] leading-[1.4] text-muted">{t("obLangBody", lang)}</p>
              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  aria-pressed={lang === "en"}
                  onClick={() => chooseLang("en")}
                  className={`flex items-center justify-between rounded-2xl px-[18px] py-4 transition ${lang === "en" ? chipSel : chipIdle}`}
                >
                  <span className="font-display text-[17px] font-bold">{t("obLangEn", lang)}</span>
                  <span className="text-[13px] font-medium opacity-70">{t("obLangEnSub", lang)}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={lang === "ar"}
                  onClick={() => chooseLang("ar")}
                  className={`flex items-center justify-between rounded-2xl px-[18px] py-4 transition ${lang === "ar" ? chipSel : chipIdle}`}
                >
                  <span className="font-display text-[17px] font-bold" dir="rtl">
                    {t("obLangAr", lang)}
                  </span>
                  <span className="text-[13px] font-medium opacity-70" dir="rtl">
                    {t("obLangArSub", lang)}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Q2 · what you already know. Recorded, shown back on the recap,
              and deliberately not used for anything else. */}
          {step === "know" && (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3">
                <Fanan pose="think" scale={0.56} />
                <div>
                  <h1 className="font-display text-[24px] font-extrabold leading-[1.08] text-ink">
                    {t("obKnowTitle", lang)}
                  </h1>
                  <p className="mt-1 text-[13px] leading-[1.35] text-muted">{t("obKnowSub", lang)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-2.5">
                {PRIORS.map((p) => {
                  const sel = prior === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => setPrior(p.value)}
                      className={`flex w-full items-center justify-between gap-2.5 rounded-2xl px-4 py-3.5 text-start transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${sel ? chipSel : chipIdle}`}
                    >
                      <span className="flex flex-col">
                        <span className="font-display text-[16px] font-bold">{t(p.key, lang)}</span>
                        <span className={`mt-0.5 text-[12px] ${sel ? "text-paper/80" : "text-muted"}`}>
                          {t(p.subKey, lang)}
                        </span>
                      </span>
                      {sel && <CheckGlyph />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Q3 · which days, and how long. One decision about commitment,
              asked two ways, so it stays one screen. */}
          {step === "plan" && (
            <div className="flex flex-1 flex-col">
              <h1 className="font-display text-[24px] font-extrabold leading-[1.08] text-ink">
                {t("obPlanTitle", lang)}
              </h1>
              <p className="mt-1 text-[13px] leading-[1.35] text-muted">{t("obPlanSub", lang)}</p>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {Array.from({ length: WEEKDAY_COUNT }, (_, d) => {
                  const sel = days.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => toggleDay(d)}
                      className={`min-w-0 rounded-2xl px-1 py-3 text-center font-display text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${sel ? chipSel : chipIdle}`}
                    >
                      <span className="block truncate">{weekdayName(d, lang)}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={everyDay}
                  onClick={() =>
                    setDays(everyDay ? [] : Array.from({ length: WEEKDAY_COUNT }, (_, i) => i))
                  }
                  className={`min-w-0 rounded-2xl px-1 py-3 text-center font-display text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${everyDay ? chipSel : chipIdle}`}
                >
                  <span className="block truncate">{t("obPlanEveryDay", lang)}</span>
                </button>
              </div>

              <p className="mt-6 font-display text-[15px] font-bold text-ink">{t("obPlanHowLong", lang)}</p>
              <div className="mt-2.5 flex flex-col gap-2.5">
                {GOALS.map((g) => {
                  const sel = goal === g.value;
                  const sub =
                    g.value === "casual"
                      ? t("obGoalCasualSub", lang)
                      : g.value === "regular"
                        ? t("obGoalRegularSub", lang)
                        : t("obGoalSeriousSub", lang);
                  return (
                    <button
                      key={g.value}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => setGoal(g.value)}
                      className={`flex w-full items-center justify-between gap-2.5 rounded-2xl px-4 py-3.5 text-start transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${sel ? chipSel : chipIdle}`}
                    >
                      <span className="flex flex-col">
                        <span className="font-display text-[16px] font-bold">{t(g.key, lang)}</span>
                        <span className={`mt-0.5 text-[12px] ${sel ? "text-paper/80" : "text-muted"}`}>{sub}</span>
                      </span>
                      {sel && <CheckGlyph />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* The recap — the three answers read back, and the ONE place the
              four tabs are named. Nothing in the app named them anywhere. */}
          {step === "recap" && (
            <div className="flex flex-1 flex-col">
              <h1 className="font-display text-[26px] font-extrabold leading-[1.1] text-ink">
                {t("obRecapTitle", lang)}
              </h1>
              <p className="mt-1.5 text-[14px] leading-[1.4] text-muted">{t("obRecapSub", lang)}</p>

              <dl className={`${cardBase} mt-5 flex-col gap-3 p-4`}>
                {[
                  { label: t("obRecapLearningFor", lang), value: t(PERSONAS.find((p) => p.value === persona)!.key, lang) },
                  { label: t("obRecapStartingFrom", lang), value: t(PRIORS.find((p) => p.value === prior)!.key, lang) },
                  {
                    label: t("obRecapPractising", lang),
                    // Not daysLabel: an unanswered question reads as unanswered
                    // here, even though the .ics falls back to daily.
                    value: days.length === 0 ? t("obRecapNoDays", lang) : daysLabel,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex w-full items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-[13px] font-semibold text-muted">{row.label}</dt>
                    <dd className="min-w-0 text-end font-display text-[14px] font-bold text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-6 font-display text-[15px] font-bold text-ink">{t("obRecapTabsTitle", lang)}</p>
              <ul className="mt-2.5 flex flex-col gap-2">
                {[
                  { name: t("navLearn", lang), body: t("obRecapTabLearn", lang) },
                  { name: t("navPractise", lang), body: t("obRecapTabPractise", lang) },
                  { name: t("navDictionary", lang), body: t("obRecapTabSigns", lang) },
                  { name: t("navFamily", lang), body: t("obRecapTabFamily", lang) },
                ].map((tab) => (
                  <li key={tab.name} className="flex items-baseline gap-2.5">
                    <span className="shrink-0 font-display text-[14px] font-bold text-teal">{tab.name}</span>
                    <span className="min-w-0 text-[13px] leading-[1.4] text-muted">{tab.body}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* s3 · Who with (persona) */}
          {step === "why" && (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3">
                <Fanan pose="think" scale={0.56} />
                <div>
                  <h1 className="font-display text-[24px] font-extrabold leading-[1.08] text-ink">
                    {t("obWhoTitle", lang)}
                  </h1>
                  <p className="mt-1 text-[13px] leading-[1.35] text-muted">{t("obWhoSub", lang)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-2.5">
                {PERSONAS.map((p) => {
                  const selected = persona === p.value;
                  const isDeaf = p.value === "deaf";
                  return (
                    <button
                      key={p.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPersona(p.value)}
                      className={`relative flex w-full items-center gap-3 rounded-[15px] px-4 py-3.5 text-start text-[15px] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${
                        selected
                          ? isDeaf
                            ? "bg-gold text-ink shadow-[0_4px_0_#C89A3D]"
                            : chipSel
                          : chipIdle
                      }`}
                    >
                      <span
                        className={`h-3 w-3 shrink-0 rounded-full ${
                          selected ? (isDeaf ? "bg-ink/30" : "bg-gold-soft") : isDeaf ? "bg-gold-soft" : "bg-line"
                        }`}
                      />
                      <span className="flex-1">{t(p.key, lang)}</span>
                      {isDeaf && (
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            selected ? "text-ink/70" : "text-gold-deep"
                          }`}
                        >
                          {/* Was "Special Path". There is no special path any
                              more — everyone walks the same one. What a Deaf
                              member actually gets is the DIRECTING role: they
                              flag the signs and the household's queue follows.
                              Family.tsx and FlagPicker already say exactly
                              that, so this badge now says it too. */}
                          {pick(lang, "Directs learning", "يوجّه التعلّم")}
                        </span>
                      )}
                      {selected && (
                        <span
                          className={`absolute -end-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border-4 border-sand ${
                            isDeaf ? "bg-gold text-ink" : "bg-coral text-paper"
                          }`}
                        >
                          <CheckGlyph />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* s4 · How it works · camera + on-device privacy (merged — L20) */}
          {step === "camera" && (
            <div className="flex flex-1 flex-col">
              <MonoLabel lang={lang} className="text-teal">{t("obCamEyebrow", lang)}</MonoLabel>
              <h1 className="mt-1.5 font-display text-[26px] font-extrabold leading-[1.1] text-ink">
                {t("obCamTitle", lang)}
              </h1>
              <div
                className="mt-4 flex items-center justify-center overflow-hidden rounded-[22px]"
                style={{
                  height: 220,
                  background: "repeating-linear-gradient(135deg,#16302E,#16302E 15px,#1d3d3a 15px,#1d3d3a 30px)",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-[32px]"
                  style={{ width: 120, height: 140, border: "3px dashed rgba(240,200,121,.75)" }}
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-teal"
                    style={{ boxShadow: "0 0 0 8px rgba(15,110,106,.25)" }}
                  >
                    {/* Camera/check chevron — never mirrors (HANDOFF §2). */}
                    <span
                      style={{
                        width: 22,
                        height: 12,
                        borderLeft: "5px solid #FBF7EF",
                        borderBottom: "5px solid #FBF7EF",
                        transform: "rotate(-45deg) translateY(-2px)",
                        direction: "ltr",
                      }}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[14px] leading-[1.45] text-muted">{t("obCamBody", lang)}</p>
              {/* On-device privacy, folded in from the old standalone step (L20). */}
              <p className="mt-3 text-[14px] leading-[1.45] text-muted">{t("obPrivacyBody", lang)}</p>
              <div className="mt-3.5 inline-flex items-center gap-2 self-start rounded-full border border-line bg-sand px-3.5 py-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-success"
                  style={{ boxShadow: "0 0 0 4px rgba(31,138,91,.2)" }}
                />
                <span className="text-[12px] font-bold text-ink">{t("obPrivacyBadge", lang)}</span>
              </div>
            </div>
          )}

          {/* s8 · Daily reminder — honest (H20): the app sends no notifications,
              so the offer is a real .ics the user's own calendar takes over. */}
          {step === "reminders" && (
            <div className="flex flex-1 flex-col items-center text-center">
              <div className="mt-2">
                <Fanan pose="idle" scale={0.82} />
              </div>
              <h1 className="mt-2.5 font-display text-[25px] font-extrabold leading-[1.1] text-ink">
                {t("obRemindTitle", lang)}
              </h1>
              <p className="mt-1.5 text-[14px] leading-[1.45] text-muted">{t("obRemindBody", lang)}</p>
              {/* Calendar-event preview — exactly what the .ics creates. */}
              <div
                className="mt-5 flex w-full items-center gap-3 rounded-[18px] border border-line bg-paper p-3.5 text-start"
                style={{ boxShadow: "0 6px 18px rgba(22,48,46,.08)" }}
              >
                {/* App-icon tile — never mirrors (HANDOFF §2). */}
                <div className="h-[38px] w-[38px] shrink-0 rounded-[11px] bg-gold" />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[12px] font-bold text-ink">
                    {t("obRemindEventTitle", lang)}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-[1.35] text-muted">
                    {t("obRemindEventWhen", lang).replace("{days}", daysLabel)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  downloadReminderIcs(lang, days);
                  setIcsDownloaded(true);
                }}
                className={`mt-4 rounded-full px-5 py-3 text-[14px] font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${
                  icsDownloaded
                    ? "bg-paper text-success shadow-[inset_0_0_0_1px_#EDE3D2]"
                    : "bg-paper text-teal shadow-[inset_0_0_0_1px_#EDE3D2]"
                }`}
              >
                {icsDownloaded ? t("obRemindCalDone", lang) : t("obRemindCal", lang)}
              </button>
            </div>
          )}

          {/* Name — owns its own submit, but is no longer terminal: it hands on
              to the camera explainer, which is what creates the profile. */}
          {step === "name" && (
            <div className="flex flex-1 flex-col">
              <h1 className="font-display text-[26px] font-extrabold leading-[1.1] text-ink">{t("obNameTitle", lang)}</h1>
              <p className="mt-1.5 text-[14px] leading-[1.4] text-muted">
                {PERSONA_TAGLINE[persona] ? pick(lang, PERSONA_TAGLINE[persona].en, PERSONA_TAGLINE[persona].ar) : ""}
              </p>
              <form
                className="mt-6 flex flex-1 flex-col"
                onSubmit={(e) => {
                  e.preventDefault();
                  advance();
                }}
              >
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label={pick(lang, "Your name", "اسمك")}
                  placeholder={pick(lang, "Your name", "اسمك")}
                  maxLength={20}
                  className="rounded-2xl border border-line bg-paper px-5 py-4 text-lg font-semibold text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none"
                />
                {/* This step is skipped by the footer's step !== "name" guard,
                    so it carries its own safe-area padding. */}
                <div className="safe-bottom mt-auto pb-6 pt-6">
                  <SpringButton full size="lg" type="submit">
                    {t("obContinue", lang)}
                  </SpringButton>
                </div>
              </form>
            </div>
          )}
        </main>

        {/* Footer CTA (design Block D) — name owns its own submit button. */}
        {step !== "name" && footer && (
          <div className="safe-bottom px-6 pb-6 pt-3">
            <SpringButton full size="lg" variant={footer.variant} onClick={footer.onClick}>
              {footer.label}
            </SpringButton>
          </div>
        )}
      </div>
    </div>
  );
}
