// CameraTrainer — the core grading loop (PRD §6.4, §9).
// Live landmarks → normalise → KNN → confidence → match / "not sure".
// Never hard-fails: self-mark is always one tap away (§9.5).
// Teach mode (§9.2): record samples of a handshape → KNN learns it live.
// Visuals mirror design/stitch-v2-brand lesson-camera-practice + practise-the-alphabet.
import { useEffect, useRef, useState } from "react";
import { pick, t } from "../i18n";
import type { Lang, Sign } from "../types";
import { normalizeLandmarks } from "../recognizer/normalize";
import { addSample, classifyAgainst, clearClass, flushSamples, isTrained, sampleCount, userTaughtCount } from "../recognizer/knn";
import { gradeWithModel, modelKnows } from "../recognizer/classifier";
import { HandSkeleton } from "./HandSkeleton";
import { useHandTracker, type FrameInfo } from "../recognizer/useHandTracker";
import { Button, Icon } from "./ui";
import { Fanan, type FananPose } from "./Fanan";
import { formatPercent } from "./dc";

export type TrainerResult = "match" | "selfMark" | "skip";

const HOLD_FRAMES = 24; // consecutive matching frames to confirm (>1 s @20fps — no insta-pass)
const TEACH_TARGET = 24; // samples recorded in teach mode
const UNSURE_AFTER_FRAMES = 140; // ~7 s of trying → show encouragement band

const HOLD_RING_C = 2 * Math.PI * 36; // hold-to-confirm ring circumference

// Opt-in grading diagnostics (?debug in the URL) — surfaces the KNN decision
// internals on-screen so a single screenshot tells us WHY a sign won't confirm.
const DEBUG =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

export function CameraTrainer({
  sign,
  lang,
  onResult,
  allowSkip = false,
  autoStart = false,
  exerciseLabel,
}: {
  sign: Sign;
  lang: Lang;
  onResult: (result: TrainerResult) => void;
  allowSkip?: boolean;
  autoStart?: boolean;
  /** Optional "EXERCISE 4 OF 12" progress label shown inside the prompt card
   *  (lesson-camera-practice--mobile / camera-drill-i-love-you--desktop). */
  exerciseLabel?: string;
}) {
  // The trained MLP knows the 28 seeded alphabet letters from real signers, so
  // those open straight into grade mode and never need teaching. Everything else
  // (un-seeded word signs) starts in teach mode unless the learner already taught it.
  const knowsModel = modelKnows(sign.id);
  const [mode, setMode] = useState<"grade" | "teach">(
    knowsModel || isTrained(sign.id) ? "grade" : "teach",
  );
  const [teachPhase, setTeachPhase] = useState<"intro" | "capturing" | "done">("intro");
  const [captured, setCaptured] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [matched, setMatched] = useState(false);
  const [showUnsure, setShowUnsure] = useState(false);
  const [dbg, setDbg] = useState("");
  const lastDbg = useRef("");

  const consecutive = useRef(0);
  const attemptFrames = useRef(0);
  const frameSkip = useRef(0);
  const finished = useRef(false);
  const teaching = useRef(false);

  // refs so the per-frame callback never goes stale
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // The frame loop runs ~20fps; only push a state update when the displayed
  // (rounded) percentage actually changes, so the ~120-line prompt/controls JSX
  // isn't rebuilt every frame (Q1).
  const lastConfPct = useRef(-1);
  const lastHoldPct = useRef(-1);
  const pushConfidence = (v: number) => {
    const pct = Math.round(v * 100);
    if (pct !== lastConfPct.current) {
      lastConfPct.current = pct;
      setConfidence(v);
    }
  };
  const pushHold = (v: number) => {
    const pct = Math.round(v * 100);
    if (pct !== lastHoldPct.current) {
      lastHoldPct.current = pct;
      setHoldProgress(v);
    }
  };

  const onFrame = (frame: FrameInfo | null) => {
    if (finished.current) return;
    if (!frame) {
      pushConfidence(0);
      pushHold(0);
      consecutive.current = 0;
      return;
    }
    const mirror = frame.detectedHand === "Left"; // canonicalise both hands (§6.8)
    const vec = normalizeLandmarks(frame.landmarks, mirror);

    if (modeRef.current === "teach") {
      if (!teaching.current) return;
      frameSkip.current = (frameSkip.current + 1) % 3;
      if (frameSkip.current !== 0) return; // sample every 3rd frame for variety
      addSample(sign.id, vec);
      const n = sampleCount(sign.id);
      setCaptured(n);
      if (n >= TEACH_TARGET) {
        teaching.current = false;
        flushSamples(); // force a durable write now that capture is done (Q3)
        setTeachPhase("done");
      }
      return;
    }

    // grade mode
    attemptFrames.current += 1;
    if (attemptFrames.current > UNSURE_AFTER_FRAMES) setShowUnsure(true);
    // The real engine: for the 28 seeded alphabet letters the trained MLP
    // (ground truth from real signers, ~98.7% held-out) is the primary grader.
    // For teach-mode / un-seeded signs we fall back to the live KNN over the
    // learner's own samples. Both grade against THIS sign specifically — never the
    // global argmax, which sticks the meter at 0% once another class is trained.
    let confidence: number;
    let matched: boolean;
    if (knowsModel) {
      // Primary: the dataset MLP (honest, geometry-only → skin-tone independent).
      const r = gradeWithModel(vec, sign.id);
      confidence = r.confidence;
      matched = r.matched;
      let dbg = `MLP best=${r.debug?.bestClass ?? "—"} p=${Math.round((r.debug?.bestP ?? 0) * 100)}% targetP=${Math.round((r.debug?.targetP ?? 0) * 100)}%`;
      // Fallback: if the learner taught THEIR OWN version of this letter, let the
      // KNN over their samples confirm too — so it "works for my hands" even when
      // the dataset model is strict cross-person. Take whichever is more confident.
      if (userTaughtCount(sign.id) >= 8) {
        const k = classifyAgainst(vec, sign.id);
        if (k.confidence > confidence) confidence = k.confidence;
        matched = matched || k.matched;
        dbg += ` | KNN share=${Math.round((k.debug?.targetShare ?? 0) * 100)}%${k.matched ? "✓" : ""}`;
      }
      if (DEBUG) {
        dbg += ` ${matched ? "MATCH✓" : "✗"}`;
        if (dbg !== lastDbg.current) { lastDbg.current = dbg; setDbg(dbg); }
      }
    } else {
      const r = classifyAgainst(vec, sign.id);
      confidence = r.confidence;
      matched = r.matched;
      if (DEBUG && r.debug) {
        const d = r.debug;
        const s = `KNN n=${d.targetSamples} best=${d.bestClass ?? "—"} share=${Math.round(d.targetShare * 100)}% meanD=${d.meanTopD.toFixed(2)} ${d.gated ? "gate✓" : "GATE✗"}`;
        if (s !== lastDbg.current) { lastDbg.current = s; setDbg(s); }
      }
    }
    pushConfidence(confidence);
    consecutive.current = matched ? consecutive.current + 1 : 0;
    pushHold(Math.min(1, consecutive.current / HOLD_FRAMES));
    if (consecutive.current >= HOLD_FRAMES) {
      finished.current = true;
      tracker.stop(); // release the camera the moment the match confirms
      setMatched(true);
      setTimeout(() => onResult("match"), 900);
    }
  };

  const tracker = useHandTracker(onFrame);

  // auto-start camera when asked (lesson flow) — browsers allow this after a tap navigation
  useEffect(() => {
    if (autoStart) void tracker.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const startTeach = () => {
    clearClass(sign.id);
    setCaptured(0);
    setTeachPhase("capturing");
    teaching.current = true;
    if (tracker.status !== "running") void tracker.start();
  };

  const finishResult = (r: TrainerResult) => {
    if (finished.current) return;
    finished.current = true;
    flushSamples(); // persist any debounced teach samples before leaving (Q3)
    tracker.stop();
    onResult(r);
  };

  const gloss = pick(lang, sign.glossEn, sign.glossAr);
  const target = sign.type === "alphabet" ? sign.code : gloss;
  const meter = holdProgress > 0 ? holdProgress : confidence;

  // ── Loop visual language (reskin only — no behaviour change) ────────────────
  // Map the live grading state onto the design's phase visuals: which Fanan pose
  // + speech line to show, and the "kind" label under the goal title. `isDemo` is
  // the honest no-live-grade path for motion signs reused via lessons.
  const running = tracker.status === "running";
  const isDemo = !sign.cameraGradable;
  const pose: FananPose = matched
    ? "celebrate"
    : showUnsure
      ? "sad"
      : isDemo
        ? "wave"
        : running
          ? "idle"
          : "think";
  const mascotLine = matched
    ? t("loopLineCorrect", lang)
    : showUnsure
      ? t("loopLineNotquite", lang)
      : isDemo
        ? t("loopLineDemo", lang)
        : running
          ? tracker.handVisible
            ? t("loopLineDetecting", lang)
            : t("loopLineLooking", lang)
          : t("loopLineWatch", lang);
  const kindLabel =
    sign.type === "alphabet"
      ? t("loopKindLetter", lang)
      : sign.cameraGradable
        ? t("loopKindWordStatic", lang)
        : t("loopKindWordMotion", lang);

  // Reference chip content — the gold hero chip in the prompt banner. For seeded
  // letters this is the REAL handshape to copy (averaged real-signer geometry),
  // not just the written letter — so the learner sees the hand they're aiming for.
  const referenceChip = (sizeClass: string) =>
    sign.id === "iloveyou" ? (
      <img src="brand/stitch-34.png" alt={gloss} className="h-full w-full rounded-2xl object-cover" />
    ) : sign.type === "alphabet" && knowsModel ? (
      <span className="relative flex h-full w-full items-center justify-center" role="img" aria-label={gloss}>
        <HandSkeleton signId={sign.id} className="h-[88%] w-[88%] text-white" />
        <span className="absolute bottom-0 end-0 font-display text-sm font-black text-gold" dir="rtl" aria-hidden="true">
          {sign.code}
        </span>
      </span>
    ) : sign.type === "alphabet" ? (
      <span className={`font-display font-bold text-white ${sizeClass}`} aria-label={gloss}>
        {sign.code}
      </span>
    ) : (
      <Icon name="sign_language" className={`leading-none text-white ${sizeClass}`} />
    );

  // The prompt banner (teal hero card) — ONE reflowing banner used in every layout.
  // "Sign the target" is the visual hero: big goal title + gold reference chip.
  // No i18n key exists for these strings yet — documented bilingual literals.
  const goalEyebrow = pick(lang, "Current Goal", "هدفك الآن");
  const referenceHelper = pick(
    lang,
    "Follow the reference and copy the handshape.",
    "اتبع المرجع وقلّد شكل اليد.",
  );
  const promptBanner = (
    <div className="animate-rise space-y-3">
      {/* Block C · title — big goal name + kind label (Rubik 800 ink). */}
      <div>
        <p className="font-mono text-[10px] font-bold uppercase leading-none tracking-[0.14em] text-teal">
          {goalEyebrow}
        </p>
        <h2 className="mt-1.5 font-display text-2xl font-extrabold leading-[1.05] tracking-[-0.01em] text-ink md:text-3xl">
          {t("camSign", lang)}: {target}
        </h2>
        <p className="mt-1 font-sans text-[13px] font-medium leading-[1.35] text-muted">{kindLabel}</p>
      </div>

      {/* Block D-watch · teal-stripe reference stage — the honest handshape to copy.
          The reference chip keeps its exact branching; the stage lifts the design
          diagonal-stripe treatment + corner cap + play FAB (glyphs never mirror). */}
      <div
        className="relative flex h-48 items-center justify-center overflow-hidden rounded-3xl"
        style={{
          background:
            "repeating-linear-gradient(135deg,#0F6E6A,#0F6E6A 15px,#12817b 15px,#12817b 30px)",
        }}
      >
        <span className="absolute inset-inline-start-3 top-3 rounded-lg bg-black/30 px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase leading-none tracking-[0.1em] text-white/85">
          ● {t("loopSignerCap", lang)}
        </span>
        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-gold bg-white/20 p-2 backdrop-blur-md">
          {referenceChip("text-6xl")}
        </div>
        <span
          className="absolute bottom-3 end-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold text-[15px] text-ink"
          style={{ boxShadow: "0 5px 0 #C89A3D", direction: "ltr" }}
          aria-hidden="true"
        >
          ▶
        </span>
      </div>

      {/* Block D-hint · gold-badge hint card (or the lesson exercise label). */}
      {exerciseLabel ? (
        <p className="font-display text-sm font-bold uppercase tracking-widest text-teal">
          {exerciseLabel}
        </p>
      ) : (
        <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-sand p-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gold font-display text-[13px] font-extrabold leading-none text-ink">
            !
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-gold-deep">
              {t("loopHintLbl", lang)}
            </p>
            <p className="mt-1 font-sans text-[12.5px] leading-[1.4] text-ink">
              {pick(lang, sign.hintEn, sign.hintAr)}
            </p>
          </div>
        </div>
      )}

      <p className="font-sans text-[12px] font-medium leading-snug text-muted">{referenceHelper}</p>
      {/* "Teach my hand": the MLP grades the 28 letters from real signers, but a
          learner can always teach their OWN version as a fallback (it then helps
          confirm alongside the model — see the grade loop). Shown in grade mode. */}
      {mode === "grade" && (
        <button
          type="button"
          onClick={() => {
            setMode("teach");
            setTeachPhase("intro");
          }}
          className="text-xs font-semibold text-teal underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {t("camResetClass", lang)}
        </button>
      )}
    </div>
  );

  // Confidence meter + never-hard-fail actions + privacy chip — shared block.
  const controls = (
    <>
      {/* accuracy meter (Block D-detecting) — muted label, teal value, gold-gradient
          fill on a #EDE3D2 track. role/aria + meter value preserved. */}
      {mode === "grade" && tracker.status === "running" && !matched && (
        <div className="space-y-2 px-1">
          <div className="flex items-end justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">
              {holdProgress > 0 ? t("camHold", lang) : t("camConfidence", lang)}
            </span>
            <div className="text-end">
              <span className="font-display text-2xl font-black leading-none text-teal md:text-4xl">
                {formatPercent(meter * 100, lang)}
              </span>
              {/* "reached!" sublabel — localised (was hard-coded Arabic for both langs) */}
              <span className="mt-0.5 hidden font-display text-base font-bold leading-none text-teal-deep md:block">
                {t("camReached", lang)}
              </span>
            </div>
          </div>
          <div
            className="h-[13px] w-full overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={Math.round(meter * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-soft to-gold"
              style={{ width: `${Math.max(6, meter * 100)}%`, transition: "width .09s linear" }}
            />
          </div>
        </div>
      )}

      {/* never-hard-fail controls (§6.4 — self-mark ALWAYS available, including
          teach mode and blocked/absent cameras) — demoted to a quiet secondary
          fallback so signing the target stays the dominant action (§5.13). */}
      {!matched && (
        <div className="flex flex-col items-center gap-3">
          {showUnsure && (
            <div className="animate-rise w-full rounded-2xl border border-dashed border-coral-soft bg-paper p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-coral-deep">
                {t("loopHintLbl", lang)}
              </p>
              <p className="mt-1.5 font-sans text-[13px] font-medium leading-[1.45] text-ink">
                {t("camUnsure", lang)}
              </p>
            </div>
          )}
          <Button variant="ghost" full onClick={() => finishResult("selfMark")} className="!py-3">
            <span className="flex items-center justify-center gap-2 font-display text-sm">
              <Icon name="check_circle" className="text-base leading-none" />
              {t("camSelfMark", lang)}
            </span>
            <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-widest text-teal/50">
              {t("camSelfMarkSub", lang)}
            </span>
          </Button>
          {allowSkip && (
            <Button variant="ghost" full onClick={() => finishResult("skip")} className="!border-0 !min-h-0 !py-2 text-sm uppercase tracking-[0.2em] !text-teal/60">
              {t("camSkip", lang)}
            </Button>
          )}
        </div>
      )}

      {/* Block E · mascot strip — Fanan reacts per phase (never mirrors). The tail
          corner mirrors in RTL (14 14 14 3 → 14 14 3 14). */}
      <div className="flex items-end gap-3 pt-1">
        <div className="h-16 w-16 shrink-0">
          <Fanan pose={pose} scale={0.55} />
        </div>
        <div
          className="border border-line bg-sand px-3 py-2.5 font-sans text-[12px] font-medium leading-[1.3] text-ink"
          style={{ borderRadius: lang === "ar" ? "14px 14px 3px 14px" : "14px 14px 14px 3px" }}
        >
          {mascotLine}
        </div>
      </div>

      {/* privacy chip — rendered in every state */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-sand px-3.5 py-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
          <span className="font-sans text-[11px] font-medium leading-tight text-muted">
            {t("camPrivacy", lang)} <span className="text-ink/30">· build {__BUILD__}</span>
          </span>
        </span>
      </div>
    </>
  );

  // One aria-live region announces the screen-reader-relevant state changes
  // (match / teach progress / unsure / blocked) without forking the visuals.
  const liveMessage = matched
    ? t("camMatch", lang)
    : tracker.status === "error"
      ? t("camBlocked", lang)
      : mode === "teach" && teachPhase === "done"
        ? t("camTeachDone", lang)
        : showUnsure
          ? t("camUnsure", lang)
          : "";

  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(300px,360px)] md:items-start md:gap-8">
      <span role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </span>

      {/* ONE reflowing prompt banner — top on mobile, top of the panel on desktop. */}
      <div className="md:order-2">{promptBanner}</div>

      {/* camera viewport — dark teal-ink rounded stage (left column on desktop) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-bowl border-4 border-white/10 bg-teal-ink shadow-chunky md:order-1 md:row-span-2 md:aspect-auto md:min-h-[620px] md:rounded-3xl">
        <video
          ref={tracker.videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        <canvas
          ref={tracker.canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        {/* feed vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-teal-ink/80 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* gold fit_screen corner badge (camera-drill-i-love-you--desktop) */}
        <div className="pointer-events-none absolute bottom-4 end-4 z-10" aria-hidden="true">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-gold/40">
            <Icon name="fit_screen" className="text-2xl leading-none text-gold" />
          </div>
        </div>

        {/* status pills */}
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between" dir="ltr">
          <span className="flex items-center gap-1.5 rounded-full bg-teal/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <Icon
              name="back_hand"
              fill
              className={`text-sm leading-none ${tracker.handVisible ? "text-gold" : "text-white/50"}`}
            />
            {tracker.status === "loading"
              ? t("camLoading", lang)
              : tracker.handVisible
                ? t("camHandSeen", lang)
                : t("camLooking", lang)}
          </span>
          {tracker.status === "running" && (
            <span className="rounded-lg bg-black/40 px-2 py-1 font-display text-[10px] font-bold text-white/80">
              {tracker.fps} FPS
            </span>
          )}
        </div>

        {/* ?debug grading readout — opt-in, intentionally unstyled/mono */}
        {DEBUG && dbg && mode === "grade" && (
          <div
            className="absolute inset-x-2 top-12 z-20 rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] leading-tight text-lime-300"
            dir="ltr"
          >
            {dbg}
          </div>
        )}

        {/* idle → start */}
        {tracker.status === "idle" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <Icon name="videocam" fill className="text-6xl leading-none text-white/80" />
            <Button variant="gold" onClick={() => void tracker.start()}>
              {t("camStart", lang)}
            </Button>
            <p className="text-xs text-white/70">{t("camPrivacy", lang)}</p>
          </div>
        )}

        {/* camera blocked */}
        {tracker.status === "error" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Icon name="videocam_off" className="text-5xl leading-none text-white/70" />
            <p className="font-semibold text-white">{t("camBlocked", lang)}</p>
            <p className="text-xs text-white/60">{tracker.error}</p>
            <Button variant="gold" onClick={() => void tracker.start()}>
              {t("camTryAgain", lang)}
            </Button>
          </div>
        )}

        {/* looking frame + scan line (Block D-looking) — shown while the camera runs
            but no hand is seen yet. Pointer-none decoration; never mirrors. */}
        {mode === "grade" && tracker.status === "running" && !matched && !tracker.handVisible && (
          <div className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center" aria-hidden="true">
            <style>{"@keyframes loopScan{0%{top:10%}100%{top:80%}}"}</style>
            <div className="relative h-3/5 w-1/2">
              <div
                className="absolute inset-0 rounded-[34px] border-[3px] border-dashed"
                style={{ borderColor: "rgba(240,200,121,.7)" }}
              />
              <div
                className="absolute inset-x-0 h-[3px] rounded-full"
                style={{
                  top: "10%",
                  background: "linear-gradient(90deg,transparent,#F0C879,transparent)",
                  animation: "loopScan 1.4s ease-in-out infinite alternate",
                }}
              />
            </div>
          </div>
        )}

        {/* hold-to-confirm ring */}
        {mode === "grade" && tracker.status === "running" && !matched && (
          <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 md:bottom-10 md:gap-6">
            {/* 80px ring on mobile, 128px on desktop (camera-drill-i-love-you--desktop) */}
            <div className="relative flex h-20 w-20 items-center justify-center md:h-32 md:w-32">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,.12)" strokeWidth="8" />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="transparent"
                  stroke="#E6B24C"
                  strokeLinecap="round"
                  strokeWidth="8"
                  strokeDasharray={HOLD_RING_C}
                  strokeDashoffset={HOLD_RING_C * (1 - holdProgress)}
                  style={{ transition: "stroke-dashoffset .15s linear" }}
                />
              </svg>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg md:h-20 md:w-20">
                <Icon name="check" className="text-3xl font-bold leading-none text-teal md:text-4xl" />
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white drop-shadow-md md:hidden">
              {t("camHold", lang)}
            </span>
            {/* desktop: pulsing "Hold steady for 2 seconds" caption */}
            <p className="hidden animate-pulse text-center font-bold text-gold drop-shadow-md md:block">
              {pick(lang, "Hold steady for 2 seconds…", "ثبّت يدك ثانيتين…")}
            </p>
          </div>
        )}

        {/* teach overlay */}
        {mode === "teach" && tracker.status !== "idle" && tracker.status !== "error" && (
          <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-teal-deep/80 p-4 text-white backdrop-blur">
            {teachPhase === "intro" && (
              <>
                <p className="flex items-center gap-2 font-display font-bold">
                  <Icon name="psychology" className="text-xl leading-none text-gold" />
                  {t("camTeach", lang)}
                </p>
                <p className="mt-1 text-sm text-white/85">{t("camTeachSub", lang)}</p>
                <Button variant="gold" className="mt-3 w-full !py-3" onClick={startTeach}>
                  {t("camStart", lang)}
                </Button>
              </>
            )}
            {teachPhase === "capturing" && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display font-bold">{t("camTeachHold", lang)}</p>
                  {/* samples counter chip */}
                  <span className="shrink-0 rounded-full bg-teal-deep px-2.5 py-1 font-display text-xs font-bold uppercase tracking-wide text-gold">
                    {captured}/{TEACH_TARGET} {t("camSamples", lang)}
                  </span>
                </div>
                <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${(captured / TEACH_TARGET) * 100}%`, boxShadow: "0 0 10px rgba(230,178,76,.6)" }}
                  />
                </div>
              </>
            )}
            {teachPhase === "done" && (
              <>
                <p className="flex items-center gap-1.5 font-bold text-gold">
                  <Icon name="check_circle" fill className="text-xl leading-none" />
                  {t("camTeachDone", lang)}
                </p>
                <Button
                  variant="gold"
                  className="mt-3 w-full !py-3"
                  onClick={() => {
                    consecutive.current = 0;
                    attemptFrames.current = 0;
                    setShowUnsure(false);
                    setMode("grade");
                  }}
                >
                  {t("fsNowYou", lang)}
                </Button>
              </>
            )}
          </div>
        )}

        {/* matched! (Block D-correct) — teal check medallion + gold pulse-ring +
            accuracy tile. The CSS L-check never mirrors (direction:ltr). */}
        {matched && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-teal-deep/80 backdrop-blur-sm">
            <span
              className="animate-pop-in relative flex h-24 w-24 items-center justify-center rounded-full bg-teal"
              style={{ boxShadow: "0 10px 26px rgba(15,110,106,.35)" }}
            >
              <span
                className="animate-pulse-ring absolute inset-0 rounded-full"
                aria-hidden="true"
              />
              <span
                aria-hidden="true"
                style={{
                  width: 40,
                  height: 22,
                  borderLeft: "7px solid #FBF7EF",
                  borderBottom: "7px solid #FBF7EF",
                  borderRadius: 2,
                  transform: "rotate(-45deg) translateY(-4px)",
                  direction: "ltr",
                }}
              />
            </span>
            <p className="animate-rise font-display text-2xl font-extrabold text-paper">
              {t("camMatch", lang)}
            </p>
            <div className="animate-rise rounded-2xl border border-line bg-sand px-4 py-2.5 text-center">
              <div className="font-display text-2xl font-extrabold leading-none text-teal">
                {formatPercent(Math.max(confidence, meter) * 100, lang)}
              </div>
              <div className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
                {t("accuracy", lang)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls — one block, no twin. Flows under the viewport on mobile;
          sits beneath the banner in the right column on desktop. The `contents`
          wrapper keeps the children flat in the mobile flex column; at md+ it
          becomes a real panel pinned to grid row 2 / col 2. */}
      <div className="contents md:order-3 md:flex md:flex-col md:gap-5 md:rounded-3xl md:bg-paper/60 md:p-6 md:shadow-soft">
        {controls}
      </div>
    </div>
  );
}
