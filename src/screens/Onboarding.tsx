// Onboarding — "pick your why" (PRD §6.1), Stitch v2 brand skin
// (design/stitch-v2-brand/html/onboarding-who-are-you-learning-for---mobile.html).
// Splash → language → who for → handedness → goal → name → first-sign flow.
// Skippable to defaults (Parent / right / Regular); target < 45 s. Logic unchanged.
import { useState } from "react";
import { pick, t, applyDir } from "../i18n";
import { PERSONA_TAGLINE } from "../content/signs";
import { useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { DailyGoal, Hand, Lang, Persona } from "../types";
import { Button, Icon, Logo, Wordmark } from "../components/ui";

type Step = "splash" | "lang" | "why" | "hand" | "goal" | "name";

// Brand illustrations from the approved Stitch screen (public/brand/mapping.tsv)
const PERSONAS: { value: Persona; img: string; key: "obParent" | "obSibling" | "obTeacher" | "obFriend" | "obDeaf"; subKey: "obParentSub" | "obSiblingSub" | "obTeacherSub" | "obFriendSub" | "obDeafSub" }[] = [
  { value: "parent", img: "brand/stitch-35.png", key: "obParent", subKey: "obParentSub" },
  { value: "sibling", img: "brand/stitch-37.png", key: "obSibling", subKey: "obSiblingSub" },
  { value: "teacher", img: "brand/stitch-33.png", key: "obTeacher", subKey: "obTeacherSub" },
  { value: "friend", img: "brand/stitch-05.png", key: "obFriend", subKey: "obFriendSub" },
  { value: "deaf", img: "brand/stitch-41.png", key: "obDeaf", subKey: "obDeafSub" },
];

const GOALS: { value: DailyGoal; key: "obCasual" | "obRegular" | "obSerious"; icon: string }[] = [
  { value: "casual", key: "obCasual", icon: "potted_plant" },
  { value: "regular", key: "obRegular", icon: "eco" },
  { value: "serious", key: "obSerious", icon: "forest" },
];

// Extruded paper choice card (Stitch "extruded-card" language).
const cardBase =
  "extruded-paper relative rounded-3xl border-[3px] border-teal/20 bg-paper text-start transition";

export function Onboarding() {
  const { createProfile, completeOnboarding } = useApp();
  const { go } = useUi();
  const [step, setStep] = useState<Step>("splash");
  const [lang, setLang] = useState<Lang>("en");
  const [persona, setPersona] = useState<Persona>("parent");
  const [hand, setHand] = useState<Hand>("R");
  const [goal, setGoal] = useState<DailyGoal>("regular");
  const [name, setName] = useState("");

  const finish = (overrides?: { skipAll?: boolean }) => {
    const displayName =
      name.trim() ||
      (lang === "ar" ? "أنا" : "Me");
    createProfile({
      displayName,
      role: overrides?.skipAll ? "parent" : persona,
      dominantHand: overrides?.skipAll ? "R" : hand,
      language: lang,
      dailyGoal: overrides?.skipAll ? "regular" : goal,
    });
    completeOnboarding();
    go({ name: "firstSign" });
  };

  const chooseLang = (l: Lang) => {
    setLang(l);
    applyDir(l);
    setStep("why");
  };

  const stepIndex = ["splash", "lang", "why", "hand", "goal", "name"].indexOf(step);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Dune horizon footer (decorative, Stitch screen asset) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-32">
        <img
          alt=""
          className="h-full w-full scale-x-125 object-cover object-top opacity-25"
          src="brand/stitch-73.png"
        />
      </div>
      {/* Floating gold spark (decorative) */}
      <div aria-hidden="true" className="pointer-events-none fixed end-8 top-20 z-0 opacity-20">
        <Icon name="auto_awesome" fill className="!text-4xl text-gold" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-12 pt-8 md:max-w-2xl">
        {/* progress dots */}
        {step !== "splash" && (
          <div className="mb-8 flex items-center justify-between">
            <div className="flex gap-2" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`h-3 rounded-full transition-all ${i <= stepIndex ? "w-8 bg-teal" : "w-3 bg-teal/20"}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => finish({ skipAll: true })}
              className="text-base font-bold text-teal transition active:scale-95"
            >
              {t("obSkip", lang)}
            </button>
          </div>
        )}

        {step === "splash" && (
          <div className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
            <div className="animate-pop-in flex h-40 w-40 items-center justify-center rounded-bowl border-[3px] border-teal/10 bg-paper shadow-soft">
              <Logo size={104} />
            </div>
            <Wordmark className="mt-5 animate-rise font-display text-4xl" />
            <p className="mt-1 font-display text-2xl font-bold text-teal" dir="rtl">سويّة</p>
            <p className="mt-4 max-w-xs animate-rise text-muted">{t("tagline", "en")}</p>
            <div className="mt-10 w-full">
              <Button full className="!rounded-3xl font-display uppercase tracking-widest" onClick={() => setStep("lang")}>
                {t("obStart", "en")} · لنبدأ
              </Button>
            </div>
          </div>
        )}

        {step === "lang" && (
          <div className="flex flex-1 flex-col justify-center gap-5 pb-24">
            <h1 className="mb-2 text-center font-display text-3xl font-bold leading-tight">
              {t("obChooseLang", lang)}
            </h1>
            <button type="button" className={`${cardBase} p-6 text-center`} onClick={() => chooseLang("ar")}>
              <span className="text-2xl font-bold" dir="rtl">العربية</span>
              <p className="mt-1 text-sm font-medium text-muted">Arabic — RTL native</p>
            </button>
            <button type="button" className={`${cardBase} p-6 text-center`} onClick={() => chooseLang("en")}>
              <span className="text-2xl font-bold">English</span>
              <p className="mt-1 text-sm font-medium text-muted">الإنجليزية</p>
            </button>
          </div>
        )}

        {step === "why" && (
          <div className="flex flex-1 flex-col">
            <div className="mb-8 text-center">
              <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
                {t("obWhoTitle", "en")}
              </h1>
              <h2 className="mt-1 text-2xl font-bold text-teal md:text-3xl" dir="rtl">
                {t("obWhoTitle", "ar")}
              </h2>
              <p className="mt-3 text-lg font-medium text-ink/70">{t("obWhoSub", lang)}</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {PERSONAS.map((p) =>
                p.value === "deaf" ? (
                  // Elevated gold option — "I'm Deaf, setting up my family"
                  <button
                    key={p.value}
                    type="button"
                    className={`extruded-gold relative col-span-1 flex items-center gap-5 rounded-3xl border-[3px] border-gold bg-[#FFFDF8] p-5 text-start transition sm:col-span-2 ${persona === p.value ? "ring-4 ring-gold/40" : ""}`}
                    onClick={() => {
                      setPersona(p.value);
                      setStep("hand");
                    }}
                  >
                    <span className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                      <img alt="" aria-hidden="true" className="z-10 h-full w-full rounded-2xl object-cover" src={p.img} />
                      <span aria-hidden="true" className="absolute inset-0 rounded-full bg-gold/10 blur-xl" />
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5">
                        <Icon name="stars" fill className="!text-base text-gold" />
                        <span className="font-bold leading-tight text-ink">{t(p.key, lang)}</span>
                      </span>
                      <span className="text-sm font-bold text-[#C9993E]">{t(p.subKey, lang)}</span>
                    </span>
                    <span className="ms-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/20 text-[#C9993E]">
                      <Icon name="arrow_forward" />
                    </span>
                  </button>
                ) : (
                  <button
                    key={p.value}
                    type="button"
                    className={`${cardBase} flex flex-col items-center p-6 text-center ${persona === p.value ? "extruded-teal-pressed !border-teal !bg-[#F0F9F8]" : ""}`}
                    onClick={() => {
                      setPersona(p.value);
                      setStep("hand");
                    }}
                  >
                    <span className="mb-3 flex h-24 w-24 items-center justify-center">
                      <img alt="" aria-hidden="true" className="h-full w-full rounded-2xl object-cover" src={p.img} />
                    </span>
                    <span className="text-lg font-bold text-ink">{t(p.key, lang)}</span>
                    <span className="mt-0.5 text-sm text-muted">{t(p.subKey, lang)}</span>
                    {persona === p.value && (
                      <span className="absolute -end-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border-4 border-sand bg-teal text-white shadow-lg">
                        <Icon name="check" className="!text-base font-bold" />
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {step === "hand" && (
          <div className="flex flex-1 flex-col">
            <h1 className="font-display text-3xl font-bold leading-tight">{t("obHandTitle", lang)}</h1>
            <p className="mt-2 text-lg font-medium text-ink/70">{t("obHandSub", lang)}</p>
            <div className="mt-8 grid grid-cols-2 gap-5">
              {(
                [
                  { value: "R" as Hand, key: "obRight" as const, flip: false },
                  { value: "L" as Hand, key: "obLeft" as const, flip: true },
                ]
              ).map((h) => (
                <button
                  key={h.value}
                  type="button"
                  className={`${cardBase} flex flex-col items-center gap-3 p-8 text-center`}
                  onClick={() => {
                    setHand(h.value);
                    setStep("goal");
                  }}
                >
                  <Icon
                    name="front_hand"
                    fill
                    className={`!text-6xl text-teal ${h.flip ? "-scale-x-100" : ""}`}
                  />
                  <p className="text-lg font-bold">{t(h.key, lang)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "goal" && (
          <div className="flex flex-1 flex-col">
            <h1 className="font-display text-3xl font-bold leading-tight">{t("obGoalTitle", lang)}</h1>
            <p className="mt-2 text-lg font-medium text-ink/70">{t("obGoalSub", lang)}</p>
            <div className="mt-8 flex flex-col gap-5">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={`${cardBase} flex items-center gap-4 p-5`}
                  onClick={() => {
                    setGoal(g.value);
                    setStep("name");
                  }}
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal/10">
                    <Icon name={g.icon} fill className="!text-3xl text-teal" />
                  </span>
                  <p className="text-lg font-bold">{t(g.key, lang)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "name" && (
          <div className="flex flex-1 flex-col">
            <h1 className="font-display text-3xl font-bold leading-tight">{t("obNameTitle", lang)}</h1>
            <p className="mt-2 text-lg font-medium text-ink/70">
              {PERSONA_TAGLINE[persona] ? pick(lang, PERSONA_TAGLINE[persona].en, PERSONA_TAGLINE[persona].ar) : ""}
            </p>
            <form
              className="mt-8 flex flex-col gap-5"
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
                className="extruded-paper rounded-3xl border-[3px] border-teal/20 bg-paper px-5 py-4 text-lg font-semibold placeholder:text-muted/60 focus:border-teal"
              />
              <Button full type="submit" className="!rounded-3xl font-display uppercase tracking-widest">
                {t("obContinue", lang)}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
