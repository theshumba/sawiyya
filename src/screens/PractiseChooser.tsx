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
import { A1_SIGNS } from "../content/signs";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { Icon } from "../components/ui";
import { SignGlyph } from "../components/SignGlyph";
import { Fanan } from "../components/Fanan";

const GRADABLE_SIGNS = A1_SIGNS.filter((s) => s.cameraGradable);

// Springy hub tile — hard bottom shadow, drops + collapses on press (spec §5).
const TILE_BASE =
  "flex min-h-[118px] flex-col items-start rounded-[18px] p-4 text-start " +
  "shadow-[0_4px_0_rgba(0,0,0,0.18)] transition-transform ease-spring duration-200 " +
  "active:translate-y-[3px] active:shadow-[0_1px_0_rgba(0,0,0,0.18)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-sand cursor-pointer";
const CHIP =
  "flex h-11 w-11 items-center justify-center rounded-[13px] bg-white/20 font-display text-2xl font-black text-paper";
const TILE_TITLE = "mt-[11px] font-display text-[15px] font-bold leading-[1.1] text-paper text-start";
const TILE_SUB = "mt-[3px] text-[11px] font-medium leading-[1.3] text-white/80 text-start";

export function PractiseChooser() {
  const app = useApp();
  const go = useUi((s) => s.go);
  const profile = activeProfile(app);
  if (!profile) return <NoProfileFallback />;
  const lang = profile.language;
  const due = dueSignIds(app, profile.id);
  const reviewCapReached = reviewsTodayFor(profile) >= REVIEW_DAILY_CAP;

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
          {/* 1 · Alphabet — READY (real gradable data) */}
          <button
            type="button"
            onClick={() => go({ name: "camera", targetSignId: "alpha-alif" })}
            className={`${TILE_BASE} bg-teal`}
          >
            {/* أ — Arabic glyph, never mirrors (renders natively RTL) */}
            <div className={CHIP} aria-hidden>أ</div>
            <div className={TILE_TITLE}>{t("practiseAlphabet", lang)}</div>
            <div className={TILE_SUB}>{t("practiseAlphabetSub", lang)}</div>
          </button>

          {/* 2 · Words — teach-mode gradable subset (first gradable sign) */}
          <button
            type="button"
            onClick={() => go({ name: "camera", targetSignId: GRADABLE_SIGNS[0]?.id })}
            className={`${TILE_BASE} bg-coral`}
          >
            {/* 🤟 handshape — never mirrors */}
            <div className={CHIP} aria-hidden>🤟</div>
            <div className={TILE_TITLE}>{t("practiseWords", lang)}</div>
            <div className={TILE_SUB}>{t("practiseWordsSub", lang)}</div>
          </button>

          {/* 3 · Free camera — sign anything */}
          <button
            type="button"
            onClick={() => go({ name: "camera" })}
            className={`${TILE_BASE} bg-gold`}
          >
            {/* 📷 camera glyph — never mirrors */}
            <div className={CHIP} aria-hidden>📷</div>
            <div className={TILE_TITLE}>{t("practiseFreeCamera", lang)}</div>
            <div className={TILE_SUB}>{t("practiseFreeCameraSub", lang)}</div>
          </button>

          {/* 4 · Review — only when something is due AND under the daily cap;
              opens a real review session (10 cards, mixed drills — H3). */}
          {due.length > 0 && !reviewCapReached && (
            <button
              type="button"
              onClick={() => go({ name: "lesson", lessonId: "review" })}
              className={`${TILE_BASE} bg-teal-deep`}
            >
              <div className={CHIP} aria-hidden>↺</div>
              <div className={TILE_TITLE}>{t("practiseReview", lang)}</div>
              <div className={TILE_SUB}>
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

        {/* B2b · Everyday QSL signs — teach-mode gradable subset (SignGlyph tiles) */}
        <div className="mt-6">
          <p className="mb-2 px-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-teal">
            {pick(lang, "Everyday signs", "إشارات يومية")}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {GRADABLE_SIGNS.map((sign) => (
              <button
                key={sign.id}
                type="button"
                onClick={() => go({ name: "camera", targetSignId: sign.id })}
                className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper p-4 text-center transition hover:border-teal/40 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sand/60">
                  <SignGlyph sign={sign} lang={lang} className="text-3xl" imgClassName="h-10 w-10 rounded-lg object-cover" />
                </span>
                <span className="truncate font-display text-sm font-bold text-ink">
                  {pick(lang, sign.glossEn, sign.glossAr)}
                </span>
              </button>
            ))}
          </div>
        </div>

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
