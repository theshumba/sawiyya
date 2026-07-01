// Onboarding — reskinned to the "Sawiyya Onboarding.dc.html" design language.
// The functional 7-step machine (splash/lang/learn/why/hand/goal/name) and all
// its wiring are PRESERVED (design/rebuild-source/specs/onboarding.md §1); the
// design's inert moments — meet-Fanan, your-why, camera, on-device privacy and
// reminders — are threaded in as additive steps that only advance the flow.
// Every step is re-dressed in the device-column visual system: springy amber
// progress, Fanan poses per screen, teal/coral selection chips and the signature
// hard-shadow footer CTA. Bilingual EN(LTR)/AR(RTL) via logical properties.
import { useState } from "react";
import { pick, t, applyDir } from "../i18n";
import { PERSONA_TAGLINE } from "../content/signs";
import { useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { DailyGoal, Hand, Lang, Persona } from "../types";
import { Fanan } from "../components/Fanan";
import { SpringButton, MonoLabel } from "../components/dc";

// Extended step machine: the original 7 steps (splash/lang/learn/why/hand/goal/
// name — every real createProfile input) plus the design's inert moments.
type Step =
  | "splash"
  | "meet"
  | "lang"
  | "learn"
  | "why"
  | "why2"
  | "camera"
  | "privacy"
  | "hand"
  | "goal"
  | "reminders"
  | "name";

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
  { value: "deaf", icon: "sign_language", key: "obDeaf", ar: "أنا أصم — أهيّئ عائلتي" },
];

// Daily-goal choices (PRESERVE §1 data table).
const GOALS: { value: DailyGoal; key: "obCasual" | "obRegular" | "obSerious"; icon: string }[] = [
  { value: "casual", key: "obCasual", icon: "potted_plant" },
  { value: "regular", key: "obRegular", icon: "eco" },
  { value: "serious", key: "obSerious", icon: "forest" },
];

// "Your why" — inert reason chips (design s4). Local state only, advance-only.
const WHY: { value: string; key: "obWhyFamily" | "obWhyWork" | "obWhyCuriosity" | "obWhyPerson" | "obWhyCommunity" }[] = [
  { value: "family", key: "obWhyFamily" },
  { value: "work", key: "obWhyWork" },
  { value: "curiosity", key: "obWhyCuriosity" },
  { value: "person", key: "obWhyPerson" },
  { value: "community", key: "obWhyCommunity" },
];

// Choice-card affordance (PRESERVE §1 — retuned to the new paper/hairline look).
const cardBase =
  "relative flex w-full items-center rounded-2xl border border-line bg-paper text-start transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 shadow-[0_2px_0_#EDE3D2]";

// Selected / unselected hard-shadow chip skins (design's teal-fill vs hairline).
const chipSel = "bg-teal text-paper shadow-[0_4px_0_#0A4F4C]";
const chipIdle = "bg-paper text-ink shadow-[inset_0_0_0_1px_#EDE3D2]";

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
  const [lang, setLang] = useState<Lang>("en");
  const [persona, setPersona] = useState<Persona>("parent");
  const [hand, setHand] = useState<Hand>("R");
  const [goal, setGoal] = useState<DailyGoal>("regular");
  const [name, setName] = useState("");
  // Inert "your why" reason (design s4) — shapes nothing yet, advance-only.
  const [reason, setReason] = useState("");

  const finish = (overrides?: { skipAll?: boolean; destination?: { name: "camera"; targetSignId?: string } }) => {
    const displayName = name.trim() || (lang === "ar" ? "أنا" : "Me");
    createProfile({
      displayName,
      role: overrides?.skipAll ? "parent" : persona,
      dominantHand: overrides?.skipAll ? "R" : hand,
      language: lang,
      dailyGoal: overrides?.skipAll ? "regular" : goal,
    });
    completeOnboarding();
    // Practice-first: the Alphabet learn card finishes straight into camera on
    // alpha-alif; every other path keeps firstSign as the default landing.
    go(overrides?.destination ?? { name: "firstSign" });
  };

  const chooseLang = (l: Lang) => {
    setLang(l);
    applyDir(l);
    setStep("learn");
  };

  // Extended so back / progress stay honest across the new design steps.
  const STEP_ORDER: Step[] = [
    "splash",
    "meet",
    "lang",
    "learn",
    "why",
    "why2",
    "camera",
    "privacy",
    "hand",
    "goal",
    "reminders",
    "name",
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

  // Footer CTA per step (design Block D). Name owns its own submit button.
  const footer: { label: string; onClick: () => void; variant: "teal" | "coral" } | null =
    step === "splash"
      ? { label: t("obWelcomeCta", lang), onClick: advance, variant: "coral" }
      : step === "meet"
        ? { label: t("obFananCta", lang), onClick: advance, variant: "teal" }
        : step === "lang"
          ? { label: t("obContinue", lang), onClick: () => chooseLang(lang), variant: "teal" }
          : step === "learn"
            ? { label: t("obContinue", lang), onClick: () => setStep("why"), variant: "teal" }
            : step === "why"
              ? { label: t("obContinue", lang), onClick: advance, variant: "teal" }
              : step === "why2"
                ? { label: t("obContinue", lang), onClick: advance, variant: "teal" }
                : step === "camera"
                  ? { label: t("obCamCta", lang), onClick: advance, variant: "teal" }
                  : step === "privacy"
                    ? { label: t("obPrivacyCta", lang), onClick: advance, variant: "teal" }
                    : step === "hand"
                      ? { label: t("obContinue", lang), onClick: () => setStep("goal"), variant: "teal" }
                      : step === "goal"
                        ? { label: t("obGoalCta", lang), onClick: () => setStep("reminders"), variant: "teal" }
                        : step === "reminders"
                          ? { label: t("obRemindCta", lang), onClick: advance, variant: "teal" }
                          : null;

  return (
    <div className={`flex min-h-screen w-full justify-center ${dark ? "bg-sand" : "bg-paper"}`}>
      <div className="flex min-h-screen w-full max-w-md flex-col">
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

          {step !== "splash" ? (
            <button
              type="button"
              onClick={() => finish({ skipAll: true })}
              className="min-w-10 shrink-0 text-[13px] font-bold text-teal transition active:scale-95"
            >
              {t("obSkip", lang)}
            </button>
          ) : (
            <span className="h-10 w-10 shrink-0" />
          )}
        </div>

        {/* Body (design Block C) */}
        <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-2 pt-3">
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
              <MonoLabel className="mt-3 text-coral">{t("obFananEyebrow", lang)}</MonoLabel>
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

          {/* Learning path chooser (existing — practice-first destination preserved) */}
          {step === "learn" && (
            <div className="flex flex-1 flex-col">
              <h1 className="font-display text-[26px] font-extrabold leading-[1.1] text-ink">
                {pick(lang, "What do you want to learn?", "ماذا تريد أن تتعلّم؟")}
              </h1>
              <p className="mt-1.5 text-[14px] leading-[1.4] text-muted">
                {pick(
                  lang,
                  "Qatari Sign Language — start here, on your device.",
                  "لغة الإشارة القطرية — ابدأ هنا، على جهازك.",
                )}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {/* Arabic alphabet — finishes straight into camera on alpha-alif. */}
                <button
                  type="button"
                  onClick={() => finish({ destination: { name: "camera", targetSignId: "alpha-alif" } })}
                  className={`${cardBase} gap-4 p-4`}
                >
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal/10 font-display text-2xl font-black text-teal"
                    dir="rtl"
                  >
                    ا ب
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[16px] font-bold text-ink">
                        {pick(lang, "Arabic Alphabet", "الحروف العربية")}
                      </span>
                      <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper">
                        {pick(lang, "Ready", "جاهز")}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted">
                      {pick(lang, "28 core letters, camera-graded", "٢٨ حرفًا أساسيًا، بتقييم الكاميرا")}
                    </p>
                  </div>
                </button>

                {/* Everyday signs — teach-mode, continues to persona. */}
                <button type="button" onClick={() => setStep("why")} className={`${cardBase} gap-4 p-4`}>
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/15">
                    <span className="h-5 w-5 rounded-full bg-gold" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-display text-[16px] font-bold text-ink">
                      {pick(lang, "Everyday signs", "إشارات يومية")}
                    </span>
                    <p className="text-[13px] text-muted">
                      {pick(lang, "Hello, milk, more, thank you…", "مرحبا، حليب، المزيد، شكرًا…")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-ink/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                    {pick(lang, "Teach & practise", "علّم وتدرّب")}
                  </span>
                </button>

                {/* Other dialects — honest coming-soon. */}
                <button
                  type="button"
                  onClick={() => setStep("why")}
                  className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-line p-4 text-start opacity-80 transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink/5">
                    <span className="h-5 w-5 rounded-full border-2 border-teal/30" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-display text-[16px] font-bold text-ink/70">
                      {pick(lang, "Other Gulf dialects", "لهجات خليجية أخرى")}
                    </span>
                    <p className="text-[13px] text-muted">
                      {pick(lang, "Emirati, Saudi & more — coming soon", "الإماراتية والسعودية وغيرها — قريبًا")}
                    </p>
                  </div>
                </button>
              </div>
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
                          {pick(lang, "Special Path", "مسار خاص")}
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

          {/* s4 · Your why (inert) */}
          {step === "why2" && (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3">
                <Fanan pose="think" scale={0.56} />
                <div>
                  <h1 className="font-display text-[24px] font-extrabold leading-[1.08] text-ink">
                    {t("obWhyTitle", lang)}
                  </h1>
                  <p className="mt-1 text-[13px] leading-[1.35] text-muted">{t("obWhyBody", lang)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {WHY.map((w) => {
                  const active = reason === w.value;
                  return (
                    <button
                      key={w.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setReason(w.value)}
                      className={`rounded-full px-[15px] py-[11px] text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${
                        active
                          ? "bg-coral text-paper shadow-[0_3px_0_#C54F3A]"
                          : "bg-paper text-ink shadow-[inset_0_0_0_1px_#EDE3D2]"
                      }`}
                    >
                      {t(w.key, lang)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* s5 · How it works · camera (inert mock) */}
          {step === "camera" && (
            <div className="flex flex-1 flex-col">
              <MonoLabel className="text-teal">{t("obCamEyebrow", lang)}</MonoLabel>
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
            </div>
          )}

          {/* s6 · On-device privacy (headline moment) */}
          {step === "privacy" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
              <div
                className="relative flex h-[118px] w-[118px] items-center justify-center rounded-[36px] bg-teal"
                style={{ boxShadow: "0 12px 30px rgba(15,110,106,.3)" }}
              >
                <span aria-hidden="true" className="absolute inset-0 rounded-[36px] bg-teal/30 animate-ping" />
                {/* Lock — never mirrors (HANDOFF §2). */}
                <div className="relative" style={{ width: 44, height: 52, borderRadius: 8, background: "#FBF7EF" }}>
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: -18,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 30,
                      height: 30,
                      border: "6px solid #FBF7EF",
                      borderBottom: "none",
                      borderRadius: "16px 16px 0 0",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 18,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 9,
                      height: 14,
                      borderRadius: 3,
                      background: "#0F6E6A",
                    }}
                  />
                </div>
              </div>
              <h1 className="mt-5 animate-rise font-display text-[27px] font-extrabold leading-[1.1] text-ink">
                {t("obPrivacyTitle", lang)}
              </h1>
              <p className="mt-1 max-w-[250px] text-[15px] leading-[1.5] text-muted">{t("obPrivacyBody", lang)}</p>
              <div className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-line bg-sand px-3.5 py-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-success"
                  style={{ boxShadow: "0 0 0 4px rgba(31,138,91,.2)" }}
                />
                <span className="text-[12px] font-bold text-ink">{t("obPrivacyBadge", lang)}</span>
              </div>
            </div>
          )}

          {/* Handedness (existing) */}
          {step === "hand" && (
            <div className="flex flex-1 flex-col">
              <h1 className="font-display text-[26px] font-extrabold leading-[1.1] text-ink">{t("obHandTitle", lang)}</h1>
              <p className="mt-1.5 text-[14px] leading-[1.4] text-muted">{t("obHandSub", lang)}</p>
              <div className="mt-5 flex flex-col gap-3">
                {([
                  { value: "R" as Hand, key: "obRight" as const },
                  { value: "L" as Hand, key: "obLeft" as const },
                ]).map((h) => {
                  const sel = hand === h.value;
                  return (
                    <button
                      key={h.value}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => {
                        setHand(h.value);
                        setStep("goal");
                      }}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-start text-[15px] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${sel ? chipSel : chipIdle}`}
                    >
                      <span className={`h-3 w-3 shrink-0 rounded-full ${sel ? "bg-gold-soft" : "bg-line"}`} />
                      <span className="flex-1">{t(h.key, lang)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* s7 · Daily goal */}
          {step === "goal" && (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3">
                <Fanan pose="cheer" scale={0.56} />
                <div>
                  <h1 className="font-display text-[24px] font-extrabold leading-[1.08] text-ink">
                    {t("obGoalTitle", lang)}
                  </h1>
                  <p className="mt-1 text-[13px] leading-[1.35] text-muted">{t("obGoalSub", lang)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-2.5">
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
                      onClick={() => {
                        setGoal(g.value);
                        setStep("reminders");
                      }}
                      className={`flex w-full items-center justify-between gap-2.5 rounded-2xl px-4 py-3.5 text-start transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${sel ? chipSel : chipIdle}`}
                    >
                      <span className="flex flex-col">
                        <span className="font-display text-[16px] font-bold">{t(g.key, lang)}</span>
                        <span className={`mt-0.5 text-[12px] ${sel ? "text-paper/80" : "text-muted"}`}>{sub}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* s8 · Reminders (inert) */}
          {step === "reminders" && (
            <div className="flex flex-1 flex-col items-center text-center">
              <div className="mt-2">
                <Fanan pose="idle" scale={0.82} />
              </div>
              <h1 className="mt-2.5 font-display text-[25px] font-extrabold leading-[1.1] text-ink">
                {t("obRemindTitle", lang)}
              </h1>
              <p className="mt-1.5 text-[14px] leading-[1.45] text-muted">{t("obRemindBody", lang)}</p>
              <div
                className="mt-5 flex w-full items-center gap-3 rounded-[18px] border border-line bg-paper p-3.5 text-start"
                style={{ boxShadow: "0 6px 18px rgba(22,48,46,.08)" }}
              >
                {/* App-icon tile — never mirrors (HANDOFF §2). */}
                <div className="h-[38px] w-[38px] shrink-0 rounded-[11px] bg-gold" />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[12px] font-bold text-ink">Sawiyya · {t("obRemindNow", lang)}</div>
                  <p className="mt-0.5 text-[12px] leading-[1.35] text-muted">{t("obRemindSample", lang)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Name (existing — terminal, owns finish()) */}
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
                  finish();
                }}
              >
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === "ar" ? "اسمك" : "Your name"}
                  maxLength={20}
                  className="rounded-2xl border border-line bg-paper px-5 py-4 text-lg font-semibold text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none"
                />
                <div className="mt-auto pb-6 pt-6">
                  <SpringButton full size="lg" type="submit">
                    {t("obContinue", lang)}
                  </SpringButton>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer CTA (design Block D) — name owns its own submit button. */}
        {step !== "name" && footer && (
          <div className="px-6 pb-6 pt-3">
            <SpringButton full size="lg" variant={footer.variant} onClick={footer.onClick}>
              {footer.label}
            </SpringButton>
          </div>
        )}
      </div>
    </div>
  );
}
