// Fingerspell — "Spell your name" (M6, PRD §6.3 companion mode).
// Type any word — Arabic directly, or English letters (transliterated to the
// Arabic letters they sound like, always shown) — and watch it spelled letter
// by letter with REAL signer photos at 0.5×/1×/2×. An on-screen Arabic letter
// pad means nobody needs an Arabic keyboard installed. Honest notes cover
// characters we can't sign yet, and the practise-along steps the camera
// through the word's gradable letters (recording real drill results).
import { useEffect, useMemo, useState } from "react";
import { pick, t } from "../i18n";
import {
  ALPHABET,
  fingerspellSequence,
  hasLatin,
  signById,
  transliterateLatin,
} from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { CameraTrainer, type TrainerResult } from "../components/CameraTrainer";
import { HandSkeleton, hasHandShape } from "../components/HandSkeleton";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { Button, ScreenCard, Icon, Title } from "../components/ui";
import { toLocaleDigits } from "../components/dc";
import { Confetti, celebrate } from "../components/Confetti";

const BASE_MS = 1600; // per-letter dwell at 1×
const SPEEDS = [0.5, 1, 2] as const;
type Speed = (typeof SPEEDS)[number];

export function Fingerspell() {
  const app = useApp();
  const { backOrParent } = useUi();
  const profile = activeProfile(app);

  const [text, setText] = useState("");
  const [speed, setSpeed] = useState<Speed>(1);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [practising, setPractising] = useState(false);
  const [practiseIdx, setPractiseIdx] = useState(0);
  const [practiseDone, setPractiseDone] = useState(false);
  const [burst, setBurst] = useState(0);

  // English letters are transliterated to Arabic first (shown via fspLatinNote),
  // so typing "musa" spells موسا instead of skipping every character.
  const arabic = useMemo(() => (hasLatin(text) ? transliterateLatin(text) : text), [text]);
  const steps = useMemo(() => fingerspellSequence(arabic), [arabic]);
  const letters = useMemo(() => steps.filter((s) => s.kind === "letter"), [steps]);
  const skipped = useMemo(() => steps.filter((s) => s.kind === "skipped"), [steps]);
  const gradable = useMemo(
    () => letters.filter((s) => signById(s.signId)?.cameraGradable),
    [letters],
  );

  // playback clock — dwell per letter scales with speed; stops on the last one
  useEffect(() => {
    if (!playing || letters.length === 0) return;
    const id = window.setTimeout(() => {
      if (cursor >= letters.length - 1) setPlaying(false);
      else setCursor((c) => c + 1);
    }, BASE_MS / speed);
    return () => window.clearTimeout(id);
  }, [playing, cursor, letters.length, speed]);

  if (!profile) return <NoProfileFallback />;
  const lang = profile.language;

  const onText = (v: string) => {
    setText(v);
    setCursor(0);
    setPlaying(false);
    setPractising(false);
    setPractiseDone(false);
    setPractiseIdx(0);
  };

  const safeCursor = Math.min(cursor, Math.max(0, letters.length - 1));
  const current = letters[safeCursor];
  const currentSign = current ? signById(current.signId) : undefined;

  const startPlayback = () => {
    setCursor(0);
    setPlaying(true);
  };

  // ── practise-along: real drill results, exactly like CameraPractice (H2/L5) ──
  const practiseStep = gradable[Math.min(practiseIdx, Math.max(0, gradable.length - 1))];
  const practiseSign = practiseStep ? signById(practiseStep.signId) : undefined;
  const handleTrainerResult = (r: TrainerResult, meta?: { ownRecording?: boolean }) => {
    if (practiseStep && r !== "skip") {
      // Self-mark rates 'hard', never 'good' (H2); skip records nothing (L5).
      app.recordDrillResult(practiseStep.signId, r === "match" ? "good" : "hard", {
        camera: true,
        matched: r === "match",
        selfMark: r === "selfMark",
        ownRecording: meta?.ownRecording, // M2: KNN-only pass, counted apart
      });
    }
    if (r === "match") {
      celebrate();
      setBurst((b) => b + 1);
    }
    if (practiseIdx + 1 >= gradable.length) {
      setPractising(false);
      setPractiseDone(true);
    } else {
      setPractiseIdx((i) => i + 1);
    }
  };
  // Soft fail (H2): 20s hand-visible with no match → 'again', demo replays.
  const handleSoftFail = () => {
    if (!practiseStep) return;
    app.recordDrillResult(practiseStep.signId, "again", { camera: true, matched: false });
  };

  const exerciseLabel = t("fspLetterOf", lang)
    .replace("{i}", toLocaleDigits(Math.min(practiseIdx + 1, gradable.length), lang))
    .replace("{n}", toLocaleDigits(gradable.length, lang));

  return (
    <ScreenShell lang={lang} chrome="tabs">
      <div className="mx-auto max-w-md px-5 pb-8 pt-6 md:max-w-2xl md:px-8">
        <Confetti burst={burst} />

        {/* header — circle back button + title, mirroring CameraPractice */}
        <header className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => backOrParent({ name: "practiseChooser" })}
            aria-label={t("back", lang)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-ink transition hover:bg-line active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <Icon name="arrow_back" className="text-xl leading-none rtl:rotate-180" />
          </button>
          <div className="min-w-0 flex-1">
            <Title className="truncate">{t("fspTitle", lang)}</Title>
          </div>
        </header>
        <p className="mb-4 text-sm text-muted">{t("fspSubtitle", lang)}</p>

        {/* Arabic input — always RTL Arabic, whatever the UI language */}
        <label className="block">
          <span className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-teal">
            {t("fspInputLabel", lang)}
          </span>
          <input
            type="text"
            dir="auto"
            lang="ar"
            value={text}
            onChange={(e) => onText(e.target.value)}
            placeholder={t("fspPlaceholder", lang)}
            maxLength={24}
            className="w-full rounded-2xl border-2 border-line bg-paper px-4 py-3.5 text-end font-display text-2xl font-bold text-ink placeholder:text-ink/25 focus:border-teal focus:outline-none"
          />
        </label>

        {/* On-screen Arabic letter pad — nobody needs an Arabic keyboard installed.
            The 29 single-character letters in standard order + backspace. */}
        <div dir="rtl" className="mt-3 flex flex-wrap gap-1.5">
          {ALPHABET.filter((s) => s.code?.length === 1).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onText(text.length >= 24 ? text : text + s.code)}
              aria-label={pick(lang, s.glossEn, s.glossAr)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-paper font-display text-lg font-bold text-ink transition hover:border-teal/40 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {s.code}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onText([...text].slice(0, -1).join(""))}
            aria-label={t("fspBackspace", lang)}
            className="flex h-10 w-[52px] items-center justify-center rounded-xl bg-sand font-display text-ink shadow-[inset_0_0_0_1px_#EDE3D2] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {/* arrow_back is in the subsetted icon font (L8); "backspace" isn't */}
            <Icon name="arrow_back" className="text-lg leading-none rtl:rotate-180" />
          </button>
        </div>

        {/* Transliteration disclosure — English letters were converted; show the
            Arabic word we're actually spelling so nothing happens silently. */}
        {hasLatin(text) && letters.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-line bg-sand p-3">
            {/* "info" is in the subsetted icon font (L8); "translate" isn't */}
            <Icon name="info" className="mt-0.5 shrink-0 text-base leading-none text-ink/70" />
            <p className="text-[12.5px] leading-snug text-ink/70">
              {t("fspLatinNote", lang)}{" "}
              <span dir="rtl" className="font-display text-base font-bold text-ink">
                {letters.map((s) => s.char).join("")}
              </span>
            </p>
          </div>
        )}

        {practising && practiseSign ? (
          /* ── practise-along: the camera steps through the gradable letters ── */
          <div className="mt-5">
            <CameraTrainer
              key={`fsp-${practiseIdx}-${practiseSign.id}`}
              sign={practiseSign}
              lang={lang}
              onResult={handleTrainerResult}
              onSoftFail={handleSoftFail}
              exerciseLabel={exerciseLabel}
              allowSkip
              autoStart
            />
            {/* The only other ways out were skipping every remaining letter or
                leaving the screen, which threw the typed word away. This keeps
                the word and drops the learner back on the letter strip. */}
            <Button
              full
              variant="ghost"
              className="mt-2.5 !py-3"
              onClick={() => {
                setPractising(false);
                setPractiseIdx(0);
              }}
            >
              {t("fspStopPractising", lang)}
            </Button>
          </div>
        ) : (
          <>
            {/* letter strip — RTL, tap a letter to preview it */}
            {letters.length > 0 && (
              <div dir="rtl" className="mt-4 flex flex-wrap gap-2">
                {letters.map((s, i) => (
                  <button
                    key={`${s.char}-${i}`}
                    type="button"
                    onClick={() => {
                      setPlaying(false);
                      setCursor(i);
                    }}
                    aria-label={(() => {
                      const sn = signById(s.signId);
                      return sn ? pick(lang, sn.glossEn, sn.glossAr) : undefined;
                    })()}
                    aria-current={i === safeCursor}
                    className={`flex h-12 w-12 items-center justify-center rounded-[13px] font-display text-xl font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                      i === safeCursor
                        ? "bg-teal text-paper shadow-[0_3px_0_#0A4F4C]"
                        : "bg-paper text-ink shadow-[inset_0_0_0_1px_#EDE3D2]"
                    }`}
                  >
                    {s.char}
                  </button>
                ))}
              </div>
            )}

            {/* honest skipped-characters note */}
            {skipped.length > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-line bg-sand p-3">
                <Icon name="info" className="mt-0.5 shrink-0 text-base leading-none text-ink/70" />
                <p className="text-[12.5px] leading-snug text-ink/70">
                  {t("fspSkippedNote", lang)}{" "}
                  <span dir="rtl" className="font-bold">
                    {[...new Set(skipped.map((s) => s.char))].join(" ")}
                  </span>
                </p>
              </div>
            )}

            {/* stage — the current letter's real signer photo (or reference card) */}
            <div className="mt-5">
              {current && currentSign ? (
                currentSign.photo ? (
                  <>
                    <div
                      role="img"
                      aria-label={pick(lang, currentSign.glossEn, currentSign.glossAr)}
                      className="relative aspect-square w-full overflow-hidden rounded-3xl"
                    >
                      <img
                        key={`${currentSign.id}-${safeCursor}`}
                        src={currentSign.photo}
                        alt=""
                        className="animate-pop-in h-full w-full object-cover"
                      />
                      <span
                        className="absolute bottom-3 end-3 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-gold/40 bg-white/80 font-display text-2xl font-black text-teal backdrop-blur-sm"
                        dir="rtl"
                        aria-hidden="true"
                      >
                        {current.char}
                      </span>
                      <span className="absolute start-3 top-3 rounded-lg bg-black/25 px-2.5 py-1 font-mono text-[9px] font-bold uppercase leading-none tracking-[0.1em] text-white/85" dir="ltr">
                        ● {t("fsSignerTag", lang)}
                      </span>
                    </div>
                    {/* ة (and any future reference-only letter): honest no-grading note */}
                    {!currentSign.cameraGradable && (
                      <p className="mt-2 text-center text-xs italic leading-snug text-ink/70">
                        {t("fspRefOnly", lang)}
                      </p>
                    )}
                  </>
                ) : hasHandShape(currentSign.id) ? (
                  <div
                    role="img"
                    aria-label={pick(lang, currentSign.glossEn, currentSign.glossAr)}
                    className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-teal/15 via-paper to-gold/15 p-6"
                  >
                    <HandSkeleton
                      key={`${currentSign.id}-${safeCursor}`}
                      signId={currentSign.id}
                      className="animate-pop-in h-full w-full text-teal"
                    />
                    <span
                      className="absolute bottom-3 end-3 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-gold/40 bg-white/70 font-display text-2xl font-black text-teal backdrop-blur-sm"
                      dir="rtl"
                      aria-hidden="true"
                    >
                      {current.char}
                    </span>
                    <span className="absolute start-3 top-3 rounded-lg bg-black/25 px-2.5 py-1 font-mono text-[9px] font-bold uppercase leading-none tracking-[0.1em] text-white/85" dir="ltr">
                      ● {t("fsSignerTag", lang)}
                    </span>
                  </div>
                ) : (
                  // ة (and any future reference-only letter): the glyph + an honest note —
                  // never a fake handshape.
                  <ScreenCard className="flex flex-col items-center gap-3 p-8 text-center">
                    <span className="font-display text-7xl font-bold text-teal" role="img" aria-label={pick(lang, currentSign.glossEn, currentSign.glossAr)}>
                      {current.char}
                    </span>
                    <p className="max-w-[280px] text-xs italic leading-snug text-ink/70">
                      {t("fspRefOnly", lang)}
                    </p>
                  </ScreenCard>
                )
              ) : steps.length > 0 ? (
                // Digits, punctuation or a bare hamza: every character was
                // skipped, so the user HAS typed a word and "type a word to
                // begin" would contradict the skipped-characters note above.
                <ScreenCard className="flex flex-col items-center gap-2 p-8 text-center">
                  <Icon name="sign_language" className="text-5xl leading-none text-teal/30" />
                  <p className="font-display text-sm font-bold text-ink">
                    {pick(lang, "Nothing to spell here yet", "لا يوجد ما نتهجّاه هنا بعد")}
                  </p>
                  <p className="max-w-[280px] text-sm text-muted">
                    {pick(
                      lang,
                      "Try Arabic letters, or English letters we can convert.",
                      "جرّب حروفًا عربية، أو حروفًا إنجليزية يمكننا تحويلها.",
                    )}
                  </p>
                </ScreenCard>
              ) : (
                <ScreenCard className="flex flex-col items-center gap-2 p-8 text-center">
                  <Icon name="sign_language" className="text-5xl leading-none text-teal/30" />
                  <p className="text-sm text-muted">{t("fspEmpty", lang)}</p>
                </ScreenCard>
              )}
            </div>

            {/* playback controls — play/pause + 0.5× / 1× / 2× */}
            {letters.length > 0 && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <Button
                  variant="primary"
                  className="!min-h-0 flex-1 !py-3"
                  onClick={() => (playing ? setPlaying(false) : startPlayback())}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Icon name={playing ? "pause" : "play_arrow"} fill className="text-xl leading-none" />
                    {playing ? t("fspPause", lang) : t("fspPlay", lang)}
                  </span>
                </Button>
                <div className="flex items-center gap-1.5" role="group" aria-label={t("fspSpeed", lang)}>
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={speed === s}
                      onClick={() => setSpeed(s)}
                      className={`rounded-full px-3 py-2 font-display text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                        speed === s
                          ? "bg-teal text-paper shadow-[0_2px_0_#0A4F4C]"
                          : "bg-paper text-ink shadow-[inset_0_0_0_1px_#EDE3D2]"
                      }`}
                      dir="ltr"
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* practise-along entry + finished note */}
            {practiseDone && (
              <ScreenCard className="mt-4 flex items-center gap-3 bg-gold/15 p-4">
                <Icon name="celebration" fill className="shrink-0 text-2xl leading-none text-gold-deep" />
                <p className="font-display font-bold text-ink">{t("fspDone", lang)}</p>
              </ScreenCard>
            )}
            {gradable.length > 0 && (
              <ScreenCard
                variant="elevated"
                className="mt-4 flex items-center gap-4 p-5"
                onClick={() => {
                  setPractiseIdx(0);
                  setPractiseDone(false);
                  setPractising(true);
                }}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral/10">
                  <Icon name="videocam" fill className="!text-2xl text-coral" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-ink">{t("fspPractiseAlong", lang)}</p>
                  <p className="text-sm text-muted">
                    {t("fspPractiseAlongSub", lang)} ·{" "}
                    {pick(lang, `${toLocaleDigits(gradable.length, lang)} letters`, `${toLocaleDigits(gradable.length, lang)} حروف`)}
                  </p>
                </div>
                <Icon name="arrow_forward" className="text-2xl text-teal rtl:rotate-180" />
              </ScreenCard>
            )}
          </>
        )}
      </div>
    </ScreenShell>
  );
}
