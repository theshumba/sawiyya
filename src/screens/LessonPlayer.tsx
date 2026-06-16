// Lesson player — one drill at a time, soft feedback, end card (PRD §6.3, §8).
// Never hard-fail: misses get encouragement + the answer, and still earn XP.
// Visual target: Stitch v2 (lesson-choice-drill / lesson-drill-…--desktop /
// lesson-camera-practice / lesson-complete-results).
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { num, pick, t } from "../i18n";
import { A1_SIGNS, ALPHABET, lessonById, signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { DrillSpec, Lang, Sign } from "../types";
import { buildChoices, buildDrillQueue } from "../lesson/engine";
import { CameraTrainer, type TrainerResult } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { SignDemo } from "../components/SignDemo";
import { Button, Card, Icon, MeetingBar } from "../components/ui";

/** A scored drill outcome flows back up so the end card can show accuracy. */
type DrillOutcome = { xp: number; scored: boolean; correct: boolean };

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

  // nothing to do (e.g. review with no due cards) — bounce home
  const empty = queue.length === 0;
  useEffect(() => {
    if (empty) go({ name: "home" });
  }, [empty, go]);

  if (!profile || empty) return null;
  const lang = profile.language;
  const lesson = lessonById(lessonId);

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
      <ResultsCard
        lang={lang}
        lesson={lesson}
        signIds={signIds}
        xp={xpEarned.current}
        accuracy={accuracy}
        streak={profile.streak}
        burst={burst}
        onContinue={() => go({ name: "home" })}
        onCamera={() => go({ name: "camera" })}
      />
    );
  }

  const isCamera = drill!.type === "camera";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col bg-sand px-5 pb-8 pt-5 md:max-w-3xl md:px-8">
      {/* header: close + meeting-curve progress + mascot hint */}
      <header className="mb-6 flex items-center gap-3 md:mb-8 md:gap-5">
        <button
          type="button"
          onClick={() => go({ name: "home" })}
          aria-label={t("close", lang)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/50 transition hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 active:scale-90 md:h-11 md:w-11"
        >
          <Icon name="close" className="text-3xl" />
        </button>
        <div className="flex-1">
          <MeetingBar progress={index / queue.length} />
        </div>
        <Logo3D />
      </header>

      <Drill
        key={`${drill!.type}-${drill!.signId}-${index}`}
        drill={drill!}
        lang={lang}
        onDone={advance}
        compact={isCamera}
      />
    </div>
  );
}

/** Small gold mascot-hint coin in the progress header (Stitch character guide). */
function Logo3D() {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-gold shadow-gold md:h-12 md:w-12"
      aria-hidden="true"
    >
      <Icon name="auto_awesome" fill className="text-2xl" />
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

/** A fixed-feel coral primary action that mirrors the Stitch CHECK / CONTINUE footer. */
function DrillFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-auto pt-6 md:flex md:justify-end">
      <div className="md:w-72">{children}</div>
    </div>
  );
}

/** Centered drill question heading — Rubik, teal (Stitch). */
function DrillTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 text-center md:mb-8">
      <h2 className="font-display text-2xl font-bold text-teal md:text-3xl">{children}</h2>
    </div>
  );
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
      <DrillTitle>{t("lsWatchTitle", lang)} ✨</DrillTitle>
      <div className="mx-auto w-full max-w-md">
        <SignDemo sign={sign} lang={lang} />
      </div>
      <DrillFooter>
        <Button
          full
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
  // CameraTrainer owns the full-screen camera-practice chrome (its own Stitch ref).
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

      {/* question zone — bordered paper card holding the sign demo (Stitch) */}
      {mode === "recognise" ? (
        <div className="mx-auto w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border-[3px] border-teal/20 bg-paper p-3 shadow-soft md:p-5">
            <DemoFace sign={sign} lang={lang} compact={compact} />
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-md rounded-3xl border-[3px] border-teal/15 bg-teal/5 px-6 py-6 text-center md:py-8">
          <p className="font-display text-3xl font-bold text-teal">
            {pick(lang, sign.glossEn, sign.glossAr)}
          </p>
          <p className="mt-1 text-lg font-medium text-muted" dir={lang === "ar" ? "ltr" : "rtl"}>
            {pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr)}
          </p>
        </div>
      )}

      {/* answers — recall: 2-col grid; recognise: stacked on mobile, 2-col on desktop (Stitch desktop) */}
      <div
        className={`mx-auto mt-6 w-full ${
          mode === "recall"
            ? "max-w-md grid grid-cols-2 gap-4"
            : "max-w-md md:max-w-2xl flex flex-col gap-3.5 md:grid md:grid-cols-2 md:gap-4"
        }`}
      >
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
      {picked !== null && (
        <div className="animate-rise mx-auto mt-5 w-full max-w-md">
          <p
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 font-semibold ${
              correct ? "bg-gold/20 text-ink" : "bg-teal/10 text-teal"
            }`}
          >
            <Icon name={correct ? "check_circle" : "favorite"} fill className="text-xl" />
            {correct ? t("lsCorrect", lang) : t("lsSoftMiss", lang)}
          </p>
          {!correct && (
            <Card className="mt-2 flex items-center gap-3 p-3">
              <span className="text-3xl" aria-hidden="true">
                {sign.type === "alphabet" ? sign.code : sign.emoji}
              </span>
              <p className="font-display font-bold">{pick(lang, sign.glossEn, sign.glossAr)}</p>
            </Card>
          )}
        </div>
      )}

      <DrillFooter>
        <Button
          full
          variant="primary"
          disabled={picked === null}
          onClick={() => onDone({ xp: correct ? 10 : 4, scored: true, correct })}
        >
          {picked === null ? t("lsCheck", lang) : `${t("lsContinue", lang)} →`}
        </Button>
      </DrillFooter>
    </div>
  );
}

/** Stacked answer row (recognise) — numbered badge + bilingual gloss, extruded paper. */
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
    idle: "border-ink/5 bg-paper text-ink extruded-paper",
    correct: "border-teal-deep bg-teal text-white",
    wrong: "border-coral/60 bg-coral/10 text-ink",
    dim: "border-ink/5 bg-paper text-ink opacity-40",
  }[state];
  const badge = {
    idle: "bg-sand text-ink/60",
    correct: "bg-white/20 text-white",
    wrong: "bg-coral/20 text-coral",
    dim: "bg-sand text-ink/40",
  }[state];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-3xl border-2 p-5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${shell}`}
    >
      <span className="flex items-center gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${badge}`}>
          {n}
        </span>
        <span className="text-xl font-bold">
          {labelEn}
          <span className={`mx-2 ${state === "correct" ? "opacity-70" : "text-teal/30"}`}>·</span>
          <span dir="rtl">{labelAr}</span>
        </span>
      </span>
      {state === "correct" && <Icon name="check_circle" fill className="text-2xl text-white" />}
      {state === "wrong" && <Icon name="cancel" fill className="text-2xl text-coral" />}
      {!selected && <span className="w-6" aria-hidden="true" />}
    </button>
  );
}

/** Tile answer (recall) — large glyph + hint, extruded paper, 2-col grid. */
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
  const shell = {
    idle: "border-ink/5 bg-paper extruded-paper",
    correct: "border-teal-deep bg-teal text-white",
    wrong: "border-coral/60 bg-coral/10",
    dim: "border-ink/5 bg-paper opacity-40",
  }[state];
  const badge = {
    idle: "bg-ink/5 text-ink/40",
    correct: "bg-white/20 text-white",
    wrong: "bg-coral/20 text-coral",
    dim: "bg-ink/5 text-ink/40",
  }[state];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-3xl border-2 p-6 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${shell}`}
    >
      <span className={`absolute start-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${badge}`}>
        {n}
      </span>
      <span className="text-4xl" aria-hidden="true">
        {glyph}
      </span>
      <span
        className={`text-xs font-medium ${state === "correct" ? "text-white/80" : "text-muted"}`}
      >
        {hint.length > 38 ? `${hint.slice(0, 38)}…` : hint}
      </span>
    </button>
  );
}

/** The demo face without the gloss (so recognise doesn't leak the answer). */
function DemoFace({ sign, lang, compact }: { sign: Sign; lang: Lang; compact?: boolean }) {
  // "Watch again" re-triggers the demo animation (honest placeholder — no signer video yet).
  const [replayKey, setReplayKey] = useState(0);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-teal/10 via-paper to-gold/10 ${
        compact ? "h-44" : "aspect-square max-h-[22rem]"
      }`}
    >
      {sign.id === "iloveyou" ? (
        <img
          key={replayKey}
          src="brand/stitch-30.png"
          alt={t("lsRecogniseTitle", lang)}
          className="animate-pop-in h-full w-full object-cover"
        />
      ) : sign.type === "alphabet" ? (
        <span
          key={replayKey}
          className="animate-pop-in font-display text-8xl font-bold text-teal"
          role="img"
          aria-label={t("lsRecogniseTitle", lang)}
        >
          {sign.code}
        </span>
      ) : (
        <Icon
          key={replayKey}
          name="sign_language"
          className="animate-pop-in text-8xl leading-none text-teal/70"
        />
      )}

      {/* Watch-again replay chip — frosted overlay (mirrors Stitch choice-drill mobile + desktop). */}
      <button
        type="button"
        onClick={() => setReplayKey((k) => k + 1)}
        className="absolute bottom-3 end-3 z-10 flex items-center gap-2 rounded-full border-2 border-teal/10 bg-sand/85 px-4 py-2 backdrop-blur-sm transition hover:bg-sand active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 md:bottom-4 md:end-4"
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

/** Lesson-complete results — celebratory hero, bento stats, signs learned. */
function ResultsCard({
  lang,
  lesson,
  signIds,
  xp,
  accuracy,
  streak,
  burst,
  onContinue,
  onCamera,
}: {
  lang: Lang;
  lesson: ReturnType<typeof lessonById>;
  signIds: string[];
  xp: number;
  accuracy: number;
  streak: number;
  burst: number;
  onContinue: () => void;
  onCamera: () => void;
}) {
  const learned = signIds.map(signById).filter((s): s is Sign => Boolean(s));
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center bg-sand px-6 pb-10 pt-10 md:pt-14">
      <Confetti burst={burst} />

      {/* celebratory hero */}
      <section
        className="animate-pop-in flex w-full flex-col items-center text-center"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(230,178,76,.18) 0%, transparent 62%)",
        }}
      >
        <div className="relative mb-6 flex h-44 w-44 items-center justify-center md:h-52 md:w-52">
          <span className="absolute inset-0 rounded-full bg-gold/30 blur-2xl" aria-hidden="true" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gold shadow-gold md:h-36 md:w-36">
            <span className="text-6xl" aria-hidden="true">
              🎉
            </span>
          </div>
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight text-teal md:text-4xl">
          {t("lsLessonDone", lang)}
        </h1>
        {lesson && (
          <p className="mt-1.5 font-medium text-muted">
            {pick(lang, lesson.titleEn, lesson.titleAr)}
          </p>
        )}
      </section>

      {/* bento stat cards */}
      <section className="mt-8 grid w-full max-w-md grid-cols-3 gap-3 md:gap-4">
        <StatCard
          tone="gold"
          label={t("lsXpEarned", lang)}
          value={`+${num(xp, lang)}`}
        />
        <StatCard
          tone="teal"
          label={t("accuracy", lang)}
          value={`${num(accuracy, lang)}%`}
        />
        <StatCard
          tone="coral"
          label={t("homeStreak", lang)}
          value={num(streak, lang)}
          icon="local_fire_department"
        />
      </section>

      {/* signs learned — horizontal snap rail */}
      {learned.length > 0 && (
        <section className="mt-10 w-full max-w-2xl">
          <h3 className="mb-3 px-1 font-display text-xl font-bold text-teal">
            {t("lsWhatsNext", lang)}
          </h3>
          <div className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {learned.map((s) => (
              <div
                key={s.id}
                className="flex min-w-[8.5rem] snap-center flex-col items-center rounded-3xl border-2 border-line bg-paper p-3 extruded-paper"
              >
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-sand/60">
                  {s.id === "iloveyou" ? (
                    <img
                      src="brand/stitch-30.png"
                      alt={pick(lang, s.glossEn, s.glossAr)}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  ) : s.type === "alphabet" ? (
                    <span className="font-display text-4xl font-bold text-teal" aria-hidden="true">
                      {s.code}
                    </span>
                  ) : (
                    <span className="text-4xl" aria-hidden="true">
                      {s.emoji}
                    </span>
                  )}
                </div>
                <p className="text-center font-display text-sm font-bold text-ink">
                  {pick("en", s.glossEn, s.glossAr)}
                  <span className="text-muted"> · </span>
                  <span dir="rtl">{pick("ar", s.glossEn, s.glossAr)}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* actions */}
      <section className="mt-auto flex w-full max-w-md flex-col gap-3 pt-8">
        <Button full variant="primary" onClick={onContinue}>
          {t("lsBackHome", lang)} →
        </Button>
        <button
          type="button"
          onClick={onCamera}
          className="flex items-center justify-center gap-2 py-2 font-display font-bold text-teal transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
        >
          <Icon name="videocam" className="text-xl" />
          <span>{t("practiceCamera", lang)}</span>
        </button>
      </section>
    </div>
  );
}

function StatCard({
  tone,
  label,
  value,
  icon,
}: {
  tone: "gold" | "teal" | "coral";
  label: string;
  value: string;
  icon?: string;
}) {
  const shell = {
    gold: "bg-gold text-ink extruded-gold",
    teal: "bg-teal text-white extruded-teal",
    coral: "bg-coral text-white extruded-coral",
  }[tone];
  const labelTone = tone === "gold" ? "text-ink/60" : "text-white/70";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl p-4 text-center transition hover:-translate-y-0.5 ${shell}`}
    >
      <span className={`mb-1 text-[10px] font-bold uppercase tracking-widest ${labelTone}`}>
        {label}
      </span>
      {icon && <Icon name={icon} fill className="mb-0.5 text-xl" />}
      <span className="font-display text-2xl font-extrabold leading-none md:text-3xl">{value}</span>
    </div>
  );
}
