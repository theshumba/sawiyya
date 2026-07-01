// Lesson player — one drill at a time, soft feedback, end card (PRD §6.3, §8).
// Never hard-fail: misses get encouragement + the answer, and still earn XP.
// Reskin: Practice-Loop / Practise design — takeover shell + step progress, sand
// surfaces, teal diagonal signer medallions, spring CTAs, Fanan-celebrate results.
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { pick, t } from "../i18n";
import { A1_SIGNS, ALPHABET, lessonById, signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { DrillSpec, Lang, Sign } from "../types";
import { buildChoices, buildDrillQueue } from "../lesson/engine";
import { CameraTrainer, type TrainerResult } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { SignDemo } from "../components/SignDemo";
import { SignGlyph } from "../components/SignGlyph";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { Fanan } from "../components/Fanan";
import { Button, Card, Icon } from "../components/ui";
import { toLocaleDigits, formatPercent } from "../components/dc";

/** A scored drill outcome flows back up so the end card can show accuracy. */
type DrillOutcome = { xp: number; scored: boolean; correct: boolean };

// diagonal teal "signer texture" used behind demo medallions (Practice Loop.dc.html)
const SIGNER_TEXTURE =
  "repeating-linear-gradient(135deg,#0F6E6A,#0F6E6A 15px,#12817b 15px,#12817b 30px)";

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const profileId = profile?.id ?? "";

  // queue is computed once per mount — drills mutate state as they complete
  const queue = useMemo(
    () => buildDrillQueue(lessonId, useApp.getState(), profileId),
    [lessonId, profileId],
  );
  const [index, setIndex] = useState(0);
  const xpEarned = useRef(0);
  const scored = useRef(0);
  const correctCount = useRef(0);
  const [burst, setBurst] = useState(0);

  const empty = queue.length === 0;

  if (!profile) return <NoProfileFallback />;
  const lang = profile.language;
  const lesson = lessonById(lessonId);

  // Nothing to do (e.g. a review lesson with no due cards). Instead of bouncing
  // to a blank takeover with no escape, keep the close-to-home chrome and offer a
  // practice-first camera CTA so the screen is never a dead end (§5.1/§5.4).
  if (empty) {
    return (
      <ScreenShell lang={lang} chrome="takeover" onClose={() => go({ name: "home" })}>
        <div className="mx-auto flex min-h-[calc(100dvh-57px)] w-full max-w-md flex-col items-center justify-center gap-5 px-6 pb-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
            <Icon name="task_alt" fill className="text-4xl" />
          </span>
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold text-teal">
              {pick(lang, "Nothing due right now", "لا شيء مستحق الآن")}
            </h1>
            <p className="text-muted">
              {pick(lang, "You're ahead — keep your hands warm with some camera practice.", "أنت متقدّم — أبقِ يديك جاهزتين بتدريب على الكاميرا.")}
            </p>
          </div>
          <Button
            full
            variant="primary"
            className="h-[54px] rounded-[17px]"
            onClick={() => go({ name: "camera" })}
          >
            <span className="flex items-center justify-center gap-2">
              <Icon name="videocam" className="text-xl" />
              {t("practiceCamera", lang)}
            </span>
          </Button>
          <Button variant="ghost" onClick={() => go({ name: "home" })}>
            {t("lsBackHome", lang)}
          </Button>
        </div>
      </ScreenShell>
    );
  }

  const done = index >= queue.length;
  const drill = done ? null : queue[index];

  const advance = ({ xp, scored: didScore, correct }: DrillOutcome) => {
    xpEarned.current += xp;
    if (didScore) {
      scored.current += 1;
      if (correct) correctCount.current += 1;
    }
    const next = index + 1;
    if (next >= queue.length) {
      app.recordLessonComplete();
      celebrate();
      setBurst((b) => b + 1);
    }
    setIndex(next);
  };

  if (done) {
    // signs taught this session — prefer the lesson manifest, fall back to the queue
    const signIds = lesson
      ? lesson.signIds
      : [...new Set(queue.map((d) => d.signId))];
    const accuracy =
      scored.current === 0
        ? 100
        : Math.round((correctCount.current / scored.current) * 100);
    return (
      <ScreenShell lang={lang} chrome="takeover">
        <ResultsCard
          lang={lang}
          lesson={lesson}
          signIds={signIds}
          xp={xpEarned.current}
          accuracy={accuracy}
          streak={profile.streak}
          burst={burst}
          onContinue={() => go({ name: "home" })}
          onPractice={(targetSignId) => go({ name: "camera", targetSignId })}
        />
      </ScreenShell>
    );
  }

  const isCamera = drill!.type === "camera";
  const stepLabel =
    drill!.type === "watch"
      ? t("lsWatchStep", lang)
      : drill!.type === "camera"
        ? t("lsSignBack", lang)
        : undefined;

  return (
    <ScreenShell lang={lang} chrome="takeover" onClose={() => go({ name: "home" })}>
      <div className="mx-auto flex min-h-[calc(100dvh-57px)] w-full max-w-2xl flex-col px-5 pb-8 pt-5 md:max-w-3xl md:px-8">
        <LessonProgress
          index={index}
          total={queue.length}
          streak={profile.streak}
          lang={lang}
          stepLabel={stepLabel}
        />

        <Drill
          key={`${drill!.type}-${drill!.signId}-${index}`}
          drill={drill!}
          lang={lang}
          onDone={advance}
          compact={isCamera}
        />
      </div>
    </ScreenShell>
  );
}

// ── shared drill primitives ──────────────────────────────────────────────────

/** Header: step label + streak pill, then the thin gold progress bar + counter. */
function LessonProgress({
  index,
  total,
  streak,
  lang,
  stepLabel,
}: {
  index: number;
  total: number;
  streak: number;
  lang: Lang;
  stepLabel?: string;
}) {
  const pct = total > 0 ? index / total : 0;
  return (
    <div className="mb-6 md:mb-8">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-muted">{stepLabel ?? ""}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-2.5 py-1">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-coral" aria-hidden="true" />
          <span className="font-display text-[13px] font-bold text-ink">
            {toLocaleDigits(streak, lang)}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuenow={Math.round(pct * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gold transition-all duration-500"
            style={{ width: `${Math.max(6, pct * 100)}%` }}
          />
        </div>
        <span className="font-display text-xs font-bold text-muted">
          {toLocaleDigits(index + 1, lang)}/{toLocaleDigits(total, lang)}
        </span>
      </div>
    </div>
  );
}

/** Centered drill question heading — Rubik, teal (design keeps teal drill titles). */
function DrillTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 text-center md:mb-8">
      <h2 className="font-display text-2xl font-bold text-teal md:text-3xl">{children}</h2>
    </div>
  );
}

/** A fixed-feel spring footer action anchored to the bottom of the drill. */
function DrillFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-auto pt-6 md:flex md:justify-end">
      <div className="md:w-72">{children}</div>
    </div>
  );
}

/** Bilingual gloss pair — primary in the active lang, secondary script after a dot. */
function BilingualGloss({
  lang,
  sign,
  className = "",
  dotClassName = "text-muted",
}: {
  lang: Lang;
  sign: Sign;
  className?: string;
  dotClassName?: string;
}) {
  return (
    <span className={className}>
      {pick("en", sign.glossEn, sign.glossAr)}
      <span className={`mx-2 ${dotClassName}`}>·</span>
      <span dir="rtl">{pick("ar", sign.glossEn, sign.glossAr)}</span>
    </span>
  );
}

// ── individual drills ───────────────────────────────────────────────────────

function Drill({
  drill,
  lang,
  onDone,
  compact,
}: {
  drill: DrillSpec;
  lang: Lang;
  onDone: (o: DrillOutcome) => void;
  compact?: boolean;
}) {
  const sign = signById(drill.signId);
  if (!sign) return null; // unreachable with valid content data
  switch (drill.type) {
    case "watch":
      return <WatchDrill sign={sign} lang={lang} onDone={onDone} />;
    case "camera":
      return <CameraDrill sign={sign} lang={lang} onDone={onDone} />;
    case "recognise":
    case "review":
      return (
        <ChoiceDrill
          sign={sign}
          lang={lang}
          mode="recognise"
          review={drill.type === "review"}
          onDone={onDone}
          compact={compact}
        />
      );
    case "recall":
      return <ChoiceDrill sign={sign} lang={lang} mode="recall" onDone={onDone} />;
  }
}

/** Bilingual sign-kind sub-line (inline copy — no dedicated i18n key). */
function kindLabel(sign: Sign, lang: Lang): string {
  const en =
    sign.type === "alphabet"
      ? "Arabic letter"
      : sign.type === "dynamic"
        ? "Moving sign"
        : "Static handshape";
  const ar =
    sign.type === "alphabet"
      ? "حرف عربي"
      : sign.type === "dynamic"
        ? "إشارة متحركة"
        : "شكل يد ثابت";
  return pick(lang, en, ar);
}

function WatchDrill({
  sign,
  lang,
  onDone,
}: {
  sign: Sign;
  lang: Lang;
  onDone: (o: DrillOutcome) => void;
}) {
  const { recordDrillResult } = useApp();
  return (
    <div className="flex flex-1 flex-col">
      {/* heading — small eyebrow, big sign name, kind sub-line */}
      <div className="animate-rise mb-5 text-center">
        <span className="text-[11px] font-bold tracking-[0.12em] text-teal">
          {t("lsWatchTitle", lang)} ✨
        </span>
        <h2 className="mt-2 font-display text-[26px] font-extrabold leading-[1.05] tracking-[-0.01em] text-ink">
          {pick(lang, sign.glossEn, sign.glossAr)}
        </h2>
        <p className="mt-1 text-[13px] leading-[1.35] text-muted">{kindLabel(sign, lang)}</p>
      </div>

      {/* signer demo — SignDemo body + a SIGNER DEMO badge overlay (never mirrors) */}
      <div className="relative mx-auto w-full max-w-md">
        <SignDemo sign={sign} lang={lang} />
        <span
          className="absolute start-3 top-3 z-10 rounded-lg bg-black/30 px-2.5 py-1 font-mono text-[9px] font-bold uppercase leading-none tracking-[0.1em] text-white/85"
          dir="ltr"
        >
          ● {t("lsSignerDemo", lang)}
        </span>
      </div>

      {/* hint card */}
      <div className="mx-auto mt-3.5 flex w-full max-w-md items-start gap-2.5 rounded-2xl border border-line bg-sand p-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gold font-display text-[13px] font-extrabold text-ink">
          !
        </span>
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-gold-deep">
            {t("lsHint", lang)}
          </span>
          <p className="mt-0.5 text-[12.5px] leading-[1.4] text-ink">
            {pick(lang, sign.hintEn, sign.hintAr)}
          </p>
        </div>
      </div>

      <DrillFooter>
        <Button
          full
          variant="primary"
          className="h-[54px] rounded-[17px]"
          onClick={() => {
            recordDrillResult(sign.id, "good", { watch: true });
            onDone({ xp: 5, scored: false, correct: false });
          }}
        >
          {t("lsContinue", lang)} →
        </Button>
      </DrillFooter>
    </div>
  );
}

function CameraDrill({
  sign,
  lang,
  onDone,
}: {
  sign: Sign;
  lang: Lang;
  onDone: (o: DrillOutcome) => void;
}) {
  const { recordDrillResult } = useApp();
  const handleResult = (result: TrainerResult) => {
    if (result === "skip") {
      recordDrillResult(sign.id, "hard");
      onDone({ xp: 4, scored: false, correct: false });
      return;
    }
    const matched = result === "match";
    recordDrillResult(sign.id, "good", {
      camera: matched,
      matched,
      selfMark: result === "selfMark",
    });
    onDone({ xp: 10, scored: true, correct: true });
  };
  // CameraTrainer owns the full-screen camera-practice chrome (its own design ref).
  return <CameraTrainer sign={sign} lang={lang} onResult={handleResult} allowSkip autoStart />;
}

/** recognise: sign → pick meaning · recall: meaning → pick sign. */
function ChoiceDrill({
  sign,
  lang,
  mode,
  review = false,
  onDone,
  compact = false,
}: {
  sign: Sign;
  lang: Lang;
  mode: "recognise" | "recall";
  review?: boolean;
  onDone: (o: DrillOutcome) => void;
  compact?: boolean;
}) {
  const { recordDrillResult } = useApp();
  const pool = (sign.type === "alphabet" ? ALPHABET : A1_SIGNS).map((s) => s.id);
  const [choices] = useState(() => buildChoices(sign.id, pool));
  const [picked, setPicked] = useState<string | null>(null);
  const correct = picked === sign.id;

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    recordDrillResult(sign.id, id === sign.id ? "good" : "again");
  };

  const title = review
    ? `${t("lsReviewTitle", lang)} ⏳`
    : mode === "recognise"
      ? t("lsRecogniseTitle", lang)
      : t("lsRecallTitle", lang);

  return (
    <div className="flex flex-1 flex-col">
      <DrillTitle>{title}</DrillTitle>

      {/* question zone — one elevated paper card holding the demo medallion */}
      {mode === "recognise" ? (
        <Card variant="elevated" className="mx-auto w-full max-w-md overflow-hidden p-3 md:p-4">
          {/* recognise question medallion — spec §D fixes this card at ~150px */}
          <DemoFace sign={sign} lang={lang} compact />
        </Card>
      ) : (
        <Card variant="elevated" className="mx-auto w-full max-w-md bg-teal/5 px-6 py-6 text-center md:py-8">
          <p className="font-display text-[30px] font-extrabold leading-none text-teal">
            {pick(lang, sign.glossEn, sign.glossAr)}
          </p>
          <p className="mt-1.5 text-lg font-medium text-muted" dir={lang === "ar" ? "ltr" : "rtl"}>
            {pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr)}
          </p>
        </Card>
      )}

      {/* answers — one grid strategy: mobile single column, 2-col on desktop */}
      <div className="mx-auto mt-6 grid w-full max-w-md grid-cols-1 gap-3 md:max-w-2xl md:grid-cols-2 md:gap-3">
        {choices.map((id, i) => {
          const choice = signById(id);
          if (!choice) return null;
          const state =
            picked === null
              ? "idle"
              : id === sign.id
                ? "correct"
                : id === picked
                  ? "wrong"
                  : "dim";
          return mode === "recognise" ? (
            <ChoiceRow
              key={id}
              n={i + 1}
              state={state}
              labelEn={pick("en", choice.glossEn, choice.glossAr)}
              labelAr={pick("ar", choice.glossEn, choice.glossAr)}
              disabled={picked !== null}
              onClick={() => choose(id)}
            />
          ) : (
            <ChoiceTile
              key={id}
              n={i + 1}
              state={state}
              glyph={(choice.type === "alphabet" ? choice.code : choice.emoji) ?? choice.emoji}
              hint={pick(lang, choice.hintEn, choice.hintAr)}
              disabled={picked !== null}
              onClick={() => choose(id)}
            />
          );
        })}
      </div>

      {/* soft feedback band — never a hard fail (PRD §8) */}
      <div aria-live="polite" className="mx-auto w-full max-w-md">
        {picked !== null && (
          <div className="animate-rise mt-5">
            <p
              className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 font-semibold ${
                correct ? "bg-gold/20 text-ink" : "bg-teal/10 text-teal"
              }`}
            >
              <Icon name={correct ? "check_circle" : "favorite"} fill className="text-xl" />
              {correct ? t("lsCorrect", lang) : t("lsSoftMiss", lang)}
            </p>
            {!correct && (
              <Card className="mt-2 flex items-center gap-3 p-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center" aria-hidden="true">
                  <SignGlyph sign={sign} lang={lang} className="text-3xl" imgClassName="h-full w-full rounded-lg object-cover" />
                </span>
                <p className="font-display font-bold">{pick(lang, sign.glossEn, sign.glossAr)}</p>
              </Card>
            )}
          </div>
        )}
      </div>

      <DrillFooter>
        <Button
          full
          variant="secondary"
          disabled={picked === null}
          className={`h-[54px] rounded-[17px] ${picked === null ? "!bg-[#C7D0CE] !text-white" : ""}`}
          onClick={() => onDone({ xp: correct ? 10 : 4, scored: true, correct })}
        >
          {picked === null ? t("lsCheck", lang) : `${t("lsContinue", lang)} →`}
        </Button>
      </DrillFooter>
    </div>
  );
}

/** Stacked answer row (recognise) — leading state mark + bilingual gloss. */
function ChoiceRow({
  n,
  state,
  labelEn,
  labelAr,
  disabled,
  onClick,
}: {
  n: number;
  state: "idle" | "correct" | "wrong" | "dim";
  labelEn: string;
  labelAr: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const selected = state === "correct" || state === "wrong";
  const shell = {
    idle: "bg-paper text-ink shadow-[inset_0_0_0_1px_#EDE3D2]",
    correct: "bg-teal text-paper shadow-[0_3px_0_#0A4F4C]",
    wrong: "bg-coral text-paper shadow-[0_3px_0_#C54F3A]",
    dim: "bg-sand text-[#94A5A2]",
  }[state];
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-[11px] rounded-[15px] px-4 py-[15px] text-start text-[15px] font-bold leading-[1.1] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${shell}`}
    >
      {/* leading state mark — empty circle idle, ✓ correct, ✕ wrong */}
      {state === "correct" ? (
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/20 text-white/90">
          <Icon name="check" fill className="text-base leading-none" />
        </span>
      ) : state === "wrong" ? (
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/20 text-white/90">
          <Icon name="close" fill className="text-base leading-none" />
        </span>
      ) : (
        <span
          className={`h-[22px] w-[22px] shrink-0 rounded-full border-2 ${state === "dim" ? "border-[#94A5A2]/40" : "border-line"}`}
          aria-hidden="true"
        />
      )}
      <span className="sr-only">{n}. </span>
      <span>
        {labelEn}
        <span className={`mx-2 ${state === "correct" || state === "wrong" ? "opacity-70" : "text-teal/30"}`}>·</span>
        <span dir="rtl">{labelAr}</span>
      </span>
    </button>
  );
}

/** Tile answer (recall) — large glyph + hint, 2-col grid, numbered corner. */
function ChoiceTile({
  n,
  state,
  glyph,
  hint,
  disabled,
  onClick,
}: {
  n: number;
  state: "idle" | "correct" | "wrong" | "dim";
  glyph: string;
  hint: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const selected = state === "correct" || state === "wrong";
  const shell = {
    idle: "bg-paper text-ink shadow-[inset_0_0_0_1px_#EDE3D2]",
    correct: "bg-teal text-paper shadow-[0_3px_0_#0A4F4C]",
    wrong: "bg-coral text-paper shadow-[0_3px_0_#C54F3A]",
    dim: "bg-sand text-[#94A5A2]",
  }[state];
  const badge = {
    idle: "bg-ink/5 text-ink/40",
    correct: "bg-white/20 text-white",
    wrong: "bg-white/20 text-white",
    dim: "bg-ink/5 text-[#94A5A2]",
  }[state];
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-[15px] px-4 py-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${shell}`}
    >
      <span className={`absolute start-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${badge}`}>
        {n}
      </span>
      <span className="text-[32px] leading-none" aria-hidden="true">
        {glyph}
      </span>
      <span
        className={`text-xs font-medium ${state === "correct" || state === "wrong" ? "text-white/80" : state === "dim" ? "text-[#94A5A2]" : "text-muted"}`}
      >
        {hint.length > 38 ? `${hint.slice(0, 38)}…` : hint}
      </span>
    </button>
  );
}

/** The demo medallion without the gloss (so recognise doesn't leak the answer). */
function DemoFace({ sign, lang, compact }: { sign: Sign; lang: Lang; compact?: boolean }) {
  // "Watch again" re-triggers the demo animation (honest placeholder — no signer video yet).
  const [replayKey, setReplayKey] = useState(0);
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-[20px]"
      style={{ height: compact ? 150 : 190, background: SIGNER_TEXTURE }}
    >
      <div
        key={replayKey}
        className="animate-pop-in flex items-center justify-center overflow-hidden rounded-full bg-paper"
        style={{ width: 104, height: 104, boxShadow: "0 10px 26px rgba(0,0,0,.22)" }}
      >
        {sign.id === "iloveyou" ? (
          <img
            src="brand/stitch-30.png"
            alt={t("lsRecogniseTitle", lang)}
            className="h-full w-full object-cover"
          />
        ) : sign.type === "alphabet" ? (
          <span
            className="font-display text-[56px] font-bold text-teal"
            role="img"
            aria-label={t("lsRecogniseTitle", lang)}
          >
            {sign.code}
          </span>
        ) : (
          <Icon name="sign_language" className="text-[56px] leading-none text-teal/80" />
        )}
      </div>

      {/* Watch-again replay chip — frosted overlay (glyph never mirrors). */}
      <button
        type="button"
        onClick={() => setReplayKey((k) => k + 1)}
        className="absolute bottom-3 end-3 z-10 flex items-center gap-2 rounded-full border-2 border-teal/10 bg-sand/85 px-3 py-1.5 backdrop-blur-sm transition hover:bg-sand active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
      >
        <Icon name="play_circle" fill className="text-lg leading-none text-teal" />
        <span className="font-display text-[11px] font-bold uppercase tracking-widest text-teal">
          {pick(lang, "Watch again", "شاهد مرة أخرى")}
        </span>
      </button>
    </div>
  );
}

// ── end card ─────────────────────────────────────────────────────────────────

/** Lesson-complete results — Fanan celebrate, stat trio, review-next, actions. */
function ResultsCard({
  lang,
  lesson,
  signIds,
  xp,
  accuracy,
  streak,
  burst,
  onContinue,
  onPractice,
}: {
  lang: Lang;
  lesson: ReturnType<typeof lessonById>;
  signIds: string[];
  xp: number;
  accuracy: number;
  streak: number;
  burst: number;
  onContinue: () => void;
  /** practice-first: open the camera, optionally pre-targeted to a just-learned sign */
  onPractice: (targetSignId?: string) => void;
}) {
  const learned = signIds.map(signById).filter((s): s is Sign => Boolean(s));
  // The just-learned sign the camera button pre-targets (gradable gate; falls back
  // to a generic camera open when the lesson held only non-gradable/dynamic signs).
  const firstGradable = learned.find((s) => s.cameraGradable);
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-57px)] w-full max-w-md flex-col items-center px-6 pb-10 pt-8 md:pt-12">
      <Confetti burst={burst} />

      {/* celebratory hero — Fanan never mirrors */}
      <div className="flex w-full flex-col items-center text-center">
        <Fanan pose="celebrate" scale={0.85} className="animate-float" />
        <span className="animate-pop-in mt-4 text-[11px] font-bold tracking-[0.1em] text-teal">
          {t("lsLessonDone", lang)}
        </span>
        <h1 className="animate-pop-in mt-1 font-display text-[27px] font-extrabold leading-[1.1] text-ink">
          {t("lsSessionTitle", lang)}
        </h1>
        {lesson && (
          <p className="mt-1.5 text-sm text-muted">
            {pick(lang, lesson.titleEn, lesson.titleAr)}
          </p>
        )}
      </div>

      {/* stat trio — accuracy · XP · streak */}
      <section className="mt-8 grid w-full grid-cols-3 gap-2.5">
        <StatCard
          value={formatPercent(accuracy, lang)}
          valueClass="text-teal"
          label={t("accuracy", lang)}
        />
        <StatCard
          value={`+${toLocaleDigits(xp, lang)}`}
          valueClass="text-coral"
          label={t("lsXpEarned", lang)}
        />
        <StatCard
          value={toLocaleDigits(streak, lang)}
          valueClass="text-gold-deep"
          label={t("homeStreak", lang)}
        />
      </section>

      {/* review-next band — chips per just-learned sign (camera pre-target on tap) */}
      {learned.length > 0 && (
        <section className="mt-6 w-full rounded-2xl border border-[#F5C9BE] bg-[#FBF3EF] p-3.5 text-start">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-coral-deep">
            {t("lsWhatsNext", lang)}
          </span>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {learned.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onPractice(s.cameraGradable ? s.id : undefined)}
                aria-label={`${pick(lang, s.glossEn, s.glossAr)} — ${t("practiceCamera", lang)}`}
                className="flex items-center gap-2 rounded-[11px] border border-line bg-paper px-2.5 py-[7px] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center" aria-hidden="true">
                  <SignGlyph sign={s} lang={lang} className="text-base" imgClassName="h-full w-full rounded object-cover" />
                </span>
                <span className="text-[12px] font-semibold text-ink">
                  <BilingualGloss lang={lang} sign={s} />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* actions — practice-first: camera dominant, Continue → home secondary. */}
      <section className="mt-auto flex w-full flex-col gap-3 pt-8">
        <Button
          full
          variant="primary"
          className="h-[54px] rounded-[17px]"
          onClick={() => onPractice(firstGradable?.id)}
        >
          <span className="flex items-center justify-center gap-2">
            <Icon name="videocam" className="text-xl" />
            {t("practiceCamera", lang)}
          </span>
        </Button>
        <Button
          full
          variant="secondary"
          className="h-[54px] rounded-[17px]"
          onClick={onContinue}
        >
          {pick(lang, "Continue", "متابعة")} →
        </Button>
      </section>
    </div>
  );
}

/** Results stat cell — colored value over a muted label, paper surface. */
function StatCard({
  value,
  valueClass,
  label,
}: {
  value: string;
  valueClass: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[15px] border border-line bg-paper px-1.5 py-3 text-center">
      <span className={`font-display text-[22px] font-extrabold leading-none ${valueClass}`}>
        {value}
      </span>
      <span className="mt-1.5 text-[10px] font-semibold text-muted">{label}</span>
    </div>
  );
}
