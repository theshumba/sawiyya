// PractiseChooser — the Practise tab landing (spec §5.3), reskinned to the
// "Sawiyya Practise" hub design (design/rebuild-source/specs/practise.md).
// A goal chooser that PRE-TARGETS the camera so CameraPractice opens in a focused
// "sign THIS" state instead of a wall of scroll strips. Honest about what's real:
//   • Arabic Alphabet — READY (real gradable data)
//   • Everyday QSL signs — teach-mode (gradable subset)
//   • More dialects — coming soon (no fabricated data, decision #6)
import { pick, t, num } from "../i18n";
import {
  REVIEW_DAILY_CAP,
  activeProfile,
  dueSignIds,
  reviewsTodayFor,
  useApp,
} from "../store/app";
import { useUi } from "../store/ui";
import { ALPHABET } from "../content/signs";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { Icon } from "../components/ui";
import { Fanan } from "../components/Fanan";

// Springy hub tile — hard bottom shadow, drops + collapses on press (spec §5).
const TILE_BASE =
  "flex min-h-[118px] flex-col items-start rounded-[18px] p-4 text-start " +
  "shadow-[0_4px_0_rgba(0,0,0,0.18)] transition-transform ease-spring duration-200 " +
  "active:translate-y-[3px] active:shadow-[0_1px_0_rgba(0,0,0,0.18)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-sand cursor-pointer";
// Tile foreground is a parameter, not a constant: paper reads on the dark teal
// and coral fills but is 1.8:1 on gold, and both button systems in the codebase
// already pair a gold fill with ink for exactly that reason.
type TileFg = "paper" | "ink";
const FG: Record<TileFg, { chip: string; title: string; sub: string }> = {
  paper: { chip: "bg-white/20 text-paper", title: "text-paper", sub: "text-white/80" },
  ink: { chip: "bg-ink/10 text-ink", title: "text-ink", sub: "text-ink/70" },
};
const CHIP = (fg: TileFg = "paper") =>
  `flex h-11 w-11 items-center justify-center rounded-[13px] font-display text-2xl font-black ${FG[fg].chip}`;
const TILE_TITLE = (fg: TileFg = "paper") =>
  `mt-[11px] font-display text-[15px] font-bold leading-[1.1] text-start ${FG[fg].title}`;
const TILE_SUB = (fg: TileFg = "paper") =>
  `mt-[3px] text-[11px] font-medium leading-[1.3] text-start ${FG[fg].sub}`;

export function PractiseChooser() {
  const app = useApp();
  const go = useUi((s) => s.go);
  const profile = activeProfile(app);
  if (!profile) return <NoProfileFallback />;
  const lang = profile.language;
  const due = dueSignIds(app, profile.id);
  const reviewCapReached = reviewsTodayFor(profile) >= REVIEW_DAILY_CAP;
  const progress = app.progress[profile.id] ?? {};
  const lettersPractised = ALPHABET.filter(
    (s) => s.cameraGradable && (progress[s.id]?.masteryLevel ?? 0) >= 1,
  ).length;

  return (
    <ScreenShell lang={lang}>
      <div className="mx-auto max-w-md px-[22px] pb-6 pt-6 md:max-w-2xl md:px-8">
        {/* B1 · Header */}
        <h1 className="font-display text-[26px] font-extrabold leading-[1.1] text-ink">
          {t("practiseTitle", lang)}
        </h1>
        <p className="mt-[3px] text-[13px] leading-[1.35] text-muted">{t("practiseSubtitle", lang)}</p>

        {/* B2 · Hub card grid */}
        <div className="mt-[18px] grid grid-cols-2 gap-3">
          {/* 1 · Alphabet — READY (real gradable data). Sub goes live once any
              letter has been practised: "n of 28" beats a static "28 letters". */}
          <button
            type="button"
            onClick={() => go({ name: "camera", targetSignId: "alpha-alif" })}
            className={`${TILE_BASE} bg-teal`}
          >
            {/* أ — Arabic glyph, never mirrors (renders natively RTL) */}
            <div className={CHIP()} aria-hidden>أ</div>
            <div className={TILE_TITLE()}>{t("practiseAlphabet", lang)}</div>
            <div className={TILE_SUB()}>
              {lettersPractised > 0
                ? t("practiseAlphabetSubOf", lang)
                    .replace("{n}", num(lettersPractised, lang))
                    .replace("{t}", num(28, lang))
                : t("practiseAlphabetSub", lang)}
            </div>
          </button>

          {/* 2 · Words — Phase 4: the word room is the dictionary's "Everyday
              words" filter, not a screen of its own. Same signs, same sheet,
              same self-mark, one fewer name for it. */}
          <button
            type="button"
            onClick={() => go({ name: "allSigns", filter: "words" })}
            className={`${TILE_BASE} bg-coral-deep`}
          >
            {/* 🤟 handshape — never mirrors */}
            <div className={CHIP()} aria-hidden>🤟</div>
            <div className={TILE_TITLE()}>{t("wordsTitle", lang)}</div>
            <div className={TILE_SUB()}>{t("practiseWordsSub", lang)}</div>
          </button>

          {/* The old tile 3, "Free camera · Sign anything", is gone (2026-08-01).
              It called go({ name: "camera" }) with no target, and CameraPractice
              defaults to Alif, so it opened the exact same screen as tile 1. A
              real free mode needs the recognizer's out-of-distribution gate, not
              a bare argmax that names a letter for any random hand, so the honest
              move was three real destinations instead of four with a duplicate. */}

          {/* 3 · Fingerspell (M6) — spell any word letter by letter */}
          <button
            type="button"
            onClick={() => go({ name: "fingerspell" })}
            className={`${TILE_BASE} bg-teal-deep`}
          >
            {/* spellcheck glyph — never mirrors */}
            <div className={CHIP()} aria-hidden>
              <Icon name="spellcheck" className="text-2xl leading-none" />
            </div>
            <div className={TILE_TITLE()}>{t("practiseFingerspell", lang)}</div>
            <div className={TILE_SUB()}>{t("practiseFingerspellSub", lang)}</div>
          </button>

          {/* 4 · Review — only when something is due AND under the daily cap;
              opens a real review session (10 cards, mixed drills — H3). */}
          {due.length > 0 && !reviewCapReached && (
            <button
              type="button"
              onClick={() => go({ name: "lesson", lessonId: "review" })}
              className={`${TILE_BASE} bg-teal-deep`}
            >
              <div className={CHIP()} aria-hidden>↺</div>
              <div className={TILE_TITLE()}>{t("practiseReview", lang)}</div>
              <div className={TILE_SUB()}>
                {num(due.length, lang)} {t("practiseReviewCountSuffix", lang)}
              </div>
            </button>
          )}
        </div>

        {/* B3 · Review-due banner — opens the session; past the daily cap it turns
            into the honest "30 done today" note instead of an endless queue (H3). */}
        {due.length > 0 && !reviewCapReached && (
          <button
            type="button"
            onClick={() => go({ name: "lesson", lessonId: "review" })}
            className="mt-[14px] flex w-full items-center gap-3 rounded-[18px] bg-teal p-[15px] text-start shadow-[0_4px_0_#0A4F4C] transition-transform ease-spring duration-200 active:translate-y-[3px] active:shadow-[0_1px_0_#0A4F4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          >
            {/* Fanan wave — never mirrors */}
            <div className="shrink-0 animate-float">
              <Fanan pose="wave" scale={0.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[15px] font-bold leading-[1.1] text-paper">
                {t("homeReviewDue", lang)}
              </div>
              <div className="mt-[3px] text-[12px] leading-[1.3] text-white/80">
                {num(due.length, lang)} {t("practiseReviewBody", lang)}
              </div>
            </div>
            <div className="shrink-0 rounded-[11px] bg-gold-soft px-3 py-1.5 font-display text-[15px] font-extrabold text-ink">
              {num(due.length, lang)}
            </div>
          </button>
        )}
        {due.length > 0 && reviewCapReached && (
          <div className="mt-[14px] flex w-full items-center gap-3 rounded-[18px] border border-line bg-paper p-[15px]">
            <Icon name="task_alt" className="shrink-0 text-2xl text-teal" />
            <p className="min-w-0 flex-1 font-display text-[14px] font-bold leading-[1.25] text-ink">
              {t("reviewCapDone", lang)}
            </p>
          </div>
        )}

        {/* B4 · More dialects — coming soon (no fabricated data, decision #6) */}
        <div className="mt-6 rounded-3xl border-2 border-dashed border-teal/20 bg-paper/50 p-5 text-center">
          <Icon name="public" className="text-3xl text-teal/40" />
          <p className="mt-1 font-display font-bold text-ink">
            {pick(lang, "More dialects coming soon", "لهجات أخرى قريبًا")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {pick(
              lang,
              "Emirati, Saudi & more Gulf sign languages are on the way.",
              "الإماراتية والسعودية ولغات إشارة خليجية أخرى قادمة.",
            )}
          </p>
        </div>
      </div>
    </ScreenShell>
  );
}
