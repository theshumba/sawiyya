// Onboarding — "pick your why" (PRD §6.1), Stitch v2 brand skin
// (design/stitch-v2-brand/html/onboarding-who-are-you-learning-for---{mobile,desktop}.html).
// Splash → language → who for → handedness → goal → name → first-sign flow.
// Skippable to defaults (Parent / right / Regular); target < 45 s. Logic unchanged.
//
// Desktop variant (md:+) mirrors the Stitch split-screen: a fixed 40% teal brand
// anchor panel on the left + the interaction canvas on the right. Mobile is the base
// single-column flow with the dune-horizon footer + floating gold spark.
import { useState } from "react";
import { pick, t, applyDir } from "../i18n";
import { PERSONA_TAGLINE } from "../content/signs";
import { useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { DailyGoal, Hand, Lang, Persona } from "../types";
import { Button, Icon, Logo, Wordmark } from "../components/ui";

type Step = "splash" | "lang" | "why" | "hand" | "goal" | "name";

// Brand illustrations from the approved Stitch screen (public/brand/mapping.tsv).
// `ar` = the Arabic persona label Stitch renders beneath each card title.
const PERSONAS: {
  value: Persona;
  img: string;
  key: "obParent" | "obSibling" | "obTeacher" | "obFriend" | "obDeaf";
  subKey: "obParentSub" | "obSiblingSub" | "obTeacherSub" | "obFriendSub" | "obDeafSub";
  ar: string;
}[] = [
  { value: "parent", img: "brand/stitch-35.png", key: "obParent", subKey: "obParentSub", ar: "طفلي" },
  { value: "sibling", img: "brand/stitch-37.png", key: "obSibling", subKey: "obSiblingSub", ar: "أخي أو أختي" },
  { value: "teacher", img: "brand/stitch-33.png", key: "obTeacher", subKey: "obTeacherSub", ar: "طالبي" },
  { value: "friend", img: "brand/stitch-05.png", key: "obFriend", subKey: "obFriendSub", ar: "صديقي" },
  { value: "deaf", img: "brand/stitch-41.png", key: "obDeaf", subKey: "obDeafSub", ar: "أنا أصم — أهيّئ عائلتي" },
];

const GOALS: { value: DailyGoal; key: "obCasual" | "obRegular" | "obSerious"; icon: string }[] = [
  { value: "casual", key: "obCasual", icon: "potted_plant" },
  { value: "regular", key: "obRegular", icon: "eco" },
  { value: "serious", key: "obSerious", icon: "forest" },
];

// Extruded paper choice card (Stitch "extruded-card-teal" language).
const cardBase =
  "extruded-paper relative rounded-3xl border-[3px] border-teal/20 bg-paper text-start transition";

// Persistent left brand anchor — Stitch desktop §"Left Panel: Brand Anchor (40%)".
// Only mounts at lg:+. Brand copy lines have no i18n key (brand-locked literals).
function BrandPanel() {
  return (
    <aside className="relative hidden w-[40%] shrink-0 flex-col items-center justify-center overflow-hidden bg-teal p-12 text-paper lg:flex">
      {/* Faint س watermarks (Stitch arabic-decoration) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -start-16 -top-16 select-none font-display text-[28rem] leading-none text-paper/[0.06]"
      >
        س
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -end-16 select-none font-display text-[22rem] leading-none text-paper/[0.06]"
      >
        س
      </span>
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-bowl bg-paper/10">
          <Logo size={88} />
        </div>
        <Wordmark className="font-display text-5xl" />
        <p className="mt-3 font-display text-3xl text-paper/90" dir="rtl">سويّة</p>
        <span aria-hidden="true" className="my-7 h-1 w-24 rounded-full bg-gold" />
        <p className="max-w-sm text-xl leading-relaxed text-paper/90">
          Learn to sign — together, as equals.
        </p>
        <div className="mt-12 flex items-center gap-3 text-paper/80">
          <Icon name="favorite" fill className="text-gold" />
          <span className="text-sm font-bold uppercase tracking-widest">Empowering Families</span>
        </div>
      </div>
    </aside>
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

  const STEP_ORDER: Step[] = ["splash", "lang", "why", "hand", "goal", "name"];
  const stepIndex = STEP_ORDER.indexOf(step);
  const back = () => {
    if (stepIndex > 0) setStep(STEP_ORDER[stepIndex - 1]);
  };

  return (
    <div className="flex min-h-screen w-full lg:h-screen lg:overflow-hidden">
      {/* Desktop brand anchor (Stitch split-screen left panel) */}
      <BrandPanel />

      {/* Interaction canvas — Stitch desktop fills this 60% panel with solid sand. */}
      <div className="relative flex min-h-screen flex-1 flex-col overflow-x-hidden lg:min-h-0 lg:overflow-y-auto lg:bg-sand">
        {/* Dune horizon footer (decorative, Stitch screen asset) */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-32 lg:absolute lg:h-48 lg:opacity-80">
          <img
            alt=""
            className="h-full w-full scale-x-125 object-cover object-top opacity-25"
            src="brand/stitch-73.png"
          />
        </div>
        {/* Floating gold spark (decorative) */}
        <div aria-hidden="true" className="pointer-events-none fixed end-8 top-20 z-0 opacity-20 lg:absolute">
          <Icon name="auto_awesome" fill className="!text-4xl text-gold" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-12 pt-8 md:max-w-2xl lg:max-w-3xl">
          {/* Top bar — back + progress dots + skip (Stitch header) */}
          {step !== "splash" && (
            <div className="mb-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={back}
                aria-label={lang === "ar" ? "رجوع" : "Back"}
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-teal/10 bg-paper text-teal transition active:scale-95"
              >
                <Icon name="arrow_back" className="rtl:-scale-x-100" />
              </button>
              {/* Progress dots — Stitch shows 4 on mobile, 3 on desktop.
                  We map the live step index onto that fixed-pip track. */}
              <div className="flex gap-2 lg:hidden" aria-hidden="true">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-3 rounded-full transition-all ${i <= Math.min(stepIndex, 4) ? "w-8 bg-teal" : "w-3 bg-teal/20"}`}
                  />
                ))}
              </div>
              <div className="hidden gap-3 lg:flex" aria-hidden="true">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-3 rounded-full transition-all ${i <= Math.min(stepIndex, 3) ? "w-12 bg-teal" : "w-12 bg-ink/10"}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => finish({ skipAll: true })}
                className="min-w-12 text-base font-bold text-teal transition active:scale-95"
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
              <div className="mt-10 w-full max-w-md">
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
              <div className="mb-12 text-center">
                {/* Bilingual stack matches Stitch (EN over AR). The EN line is
                    pinned to 'en' so both scripts always show, per the reference. */}
                <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
                  {t("obWhoTitle", "en")}
                </h1>
                <h2 className="mt-2 text-2xl font-bold text-teal md:text-3xl" dir="rtl">
                  {t("obWhoTitle", "ar")}
                </h2>
                <p className="mt-4 text-lg font-medium text-ink/70 md:text-xl">{t("obWhoSub", lang)}</p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {PERSONAS.map((p) => {
                  const selected = persona === p.value;
                  return p.value === "deaf" ? (
                    // Gold "Special Path" option — "I'm Deaf, setting up my family".
                    // No "Most Popular" pill / arrow badge in Stitch; just title + SPECIAL PATH.
                    <button
                      key={p.value}
                      type="button"
                      aria-pressed={selected}
                      className={`extruded-gold relative col-span-1 flex items-center gap-5 rounded-3xl border-[3px] bg-[#FFFDF8] p-5 text-start transition sm:col-span-2 ${selected ? "border-gold ring-4 ring-gold/30" : "border-gold/70"}`}
                      onClick={() => setPersona(p.value)}
                    >
                      <span className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gold/10 p-2">
                        <img alt="" aria-hidden="true" className="z-10 h-full w-full object-contain" src={p.img} />
                        <span aria-hidden="true" className="absolute inset-0 rounded-full bg-gold/10 blur-xl" />
                      </span>
                      <span className="flex flex-1 flex-col gap-1">
                        <span className="font-bold leading-tight text-ink">{t(p.key, lang)}</span>
                        {/* No i18n key for "Special Path"; literal documented here. */}
                        <span className="text-sm font-bold uppercase tracking-wider text-[#C9993E]">
                          {pick(lang, "Special Path", "مسار خاص")}
                        </span>
                      </span>
                      {selected && (
                        <span className="absolute -end-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full border-4 border-sand bg-gold text-ink shadow-lg">
                          <Icon name="check" className="!text-base font-bold" />
                        </span>
                      )}
                    </button>
                  ) : (
                    <button
                      key={p.value}
                      type="button"
                      aria-pressed={selected}
                      className={`${cardBase} flex flex-col items-center p-6 text-center ${
                        selected
                          ? "translate-y-1 !border-coral bg-paper/60 !shadow-none ring-4 ring-coral/20"
                          : ""
                      }`}
                      onClick={() => setPersona(p.value)}
                    >
                      <span className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-sand/60 p-2">
                        <img alt="" aria-hidden="true" className="h-full w-full object-contain" src={p.img} />
                      </span>
                      <span className={`text-xl font-bold ${selected ? "text-coral" : "text-ink"}`}>{t(p.key, lang)}</span>
                      <span className={`mt-1 text-lg font-bold ${selected ? "text-coral/80" : "text-teal"}`} dir="rtl">
                        {p.ar}
                      </span>
                      {selected && (
                        <span className="absolute -end-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border-4 border-sand bg-coral text-white shadow-lg">
                          <Icon name="check" className="!text-base font-bold" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stitch footer: prominent coral "Continue · استمر" advancing the flow. */}
              <div className="mt-auto flex flex-col items-center gap-4 pb-8 pt-12">
                <Button
                  full
                  className="!rounded-3xl font-display uppercase tracking-widest sm:max-w-sm"
                  onClick={() => setStep("hand")}
                >
                  {t("obContinue", lang)} · استمر
                </Button>
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
    </div>
  );
}
