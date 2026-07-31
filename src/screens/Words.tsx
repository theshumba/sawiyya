// Words — the Practise hub's word room (2026-07-31, owner ask): simple everyday
// words, available INSTANTLY — no letter progress required. One-handed words
// lead (you can copy them while holding a phone); two-handed words follow,
// labelled. Every card opens a watch → copy → mark-yourself sheet; the self-mark
// records a real drill result (rated 'hard', same as every self-mark — H2), so
// practised words enter the review loop like everything else. All A1 words stay
// watch-only until real QSL footage lands (docs/real-sign-content-plan.md).
import { useState } from "react";
import { num, pick, t } from "../i18n";
import { A1_SIGNS, signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { Lang, Sign } from "../types";
import { SignDemo } from "../components/SignDemo";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { Button, Icon, Title } from "../components/ui";
import { useDialog } from "../components/useDialog";
import { Confetti, celebrate } from "../components/Confetti";

const ONE_HAND = A1_SIGNS.filter((s) => (s.hands ?? 1) === 1);
const TWO_HAND = A1_SIGNS.filter((s) => s.hands === 2);

export function Words() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [marked, setMarked] = useState(false);
  const [burst, setBurst] = useState(0);
  const selected = selectedId ? signById(selectedId) : undefined;
  // H16: focus the sheet on open, trap Tab, Escape/backdrop dismiss, restore focus.
  const sheetRef = useDialog<HTMLDivElement>(Boolean(selected), () => setSelectedId(null));
  if (!profile) return <NoProfileFallback />;
  const lang = profile.language;

  const open = (id: string) => {
    setMarked(false);
    setSelectedId(id);
  };
  const selfMark = () => {
    if (!selected || marked) return;
    // Self-mark rates 'hard', never 'good' (H2) — nothing confirmed it.
    app.recordDrillResult(selected.id, "hard", { selfMark: true });
    setMarked(true);
    celebrate();
    setBurst((b) => b + 1);
  };
  const practisedIds = new Set(
    Object.entries(app.progress[profile.id] ?? {})
      .filter(([, p]) => (p?.masteryLevel ?? 0) >= 2)
      .map(([id]) => id),
  );

  const section = (signs: Sign[], titleKey: "wordsOneHand" | "wordsTwoHands") => (
    <section className="mt-6 first:mt-4">
      <p className="mb-2 flex items-center gap-1.5 px-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-teal">
        <Icon name={titleKey === "wordsOneHand" ? "front_hand" : "sign_language"} className="text-sm leading-none" />
        {t(titleKey, lang)} · {num(signs.length, lang)}
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {signs.map((sign) => (
          <WordCard
            key={sign.id}
            sign={sign}
            lang={lang}
            practised={practisedIds.has(sign.id)}
            onClick={() => open(sign.id)}
          />
        ))}
      </div>
    </section>
  );

  return (
    <ScreenShell lang={lang} chrome="tabs">
      <div className="mx-auto max-w-md px-[22px] pb-10 pt-6 md:max-w-2xl md:px-8">
        <Confetti burst={burst} />

        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go({ name: "practiseChooser" })}
            aria-label={t("back", lang)}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-sand text-ink transition hover:bg-line active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <Icon name="arrow_back" className="text-xl leading-none rtl:rotate-180" />
          </button>
          <Title className="min-w-0 flex-1 truncate">{t("wordsTitle", lang)}</Title>
        </header>
        <p className="mt-1.5 text-[13px] leading-[1.35] text-muted">{t("wordsSubtitle", lang)}</p>

        {section(ONE_HAND, "wordsOneHand")}
        {section(TWO_HAND, "wordsTwoHands")}
      </div>

      {/* watch → copy → mark-yourself sheet (mobile + desktop share one dialog).
          Flex-centred wrapper, NOT translate classes: animate-rise's keyframes
          pin `transform` (fill both), which silently cancels -translate-x/y-1/2
          and left the desktop card hanging half off-screen. */}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center md:p-6">
          <button
            type="button"
            aria-label={t("close", lang)}
            onClick={() => setSelectedId(null)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={pick(lang, selected.glossEn, selected.glossAr)}
            tabIndex={-1}
            className="relative z-10 max-h-[88dvh] w-full animate-rise overflow-y-auto rounded-t-3xl bg-paper p-6 pb-10 shadow-lift focus:outline-none md:w-[440px] md:rounded-3xl md:pb-6"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/10 md:hidden" aria-hidden="true" />
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-extrabold leading-[1.1] text-ink">
                  {pick(lang, selected.glossEn, selected.glossAr)}
                </h2>
                <p className="mt-0.5 text-sm text-muted" dir={lang === "ar" ? "ltr" : "rtl"}>
                  {pick(lang === "ar" ? "en" : "ar", selected.glossEn, selected.glossAr)}
                </p>
              </div>
              <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-teal">
                <Icon name="front_hand" className="text-xs leading-none" />
                {t(selected.hands === 2 ? "wordsTwoHands" : "wordsOneHand", lang)}
              </span>
            </div>

            <SignDemo sign={selected} lang={lang} />

            {/* hint card — how the sign is performed (provenance disclosed) */}
            <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl border border-line bg-sand p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gold font-display text-[13px] font-extrabold text-ink">
                !
              </span>
              <div className="min-w-0">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-gold-deep">
                  {t("lsHint", lang)}
                </span>
                {/* provenance not repeated here — SignDemo's footnote already
                    carries the a1AslProvenance disclosure for A1 words */}
                <p className="mt-0.5 text-[12.5px] leading-[1.4] text-ink">
                  {pick(lang, selected.hintEn, selected.hintAr)}
                </p>
              </div>
            </div>

            {/* mark yourself — the same never-hard-fail self-mark as everywhere */}
            <div className="mt-4">
              {marked ? (
                <div className="flex items-center gap-3 rounded-2xl bg-gold/15 p-4">
                  <Icon name="celebration" fill className="shrink-0 text-2xl leading-none text-gold-deep" />
                  <p className="font-display font-bold text-ink">{t("wordsMarked", lang)}</p>
                </div>
              ) : (
                <Button full variant="primary" className="!py-3.5" onClick={selfMark}>
                  <span className="flex items-center justify-center gap-2 font-display text-sm">
                    <Icon name="check_circle" className="text-base leading-none" />
                    {t("camSelfMark", lang)}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-widest text-white/80">
                    {t("camSelfMarkSub", lang)}
                  </span>
                </Button>
              )}
              <Button full variant="ghost" className="mt-2.5 !py-3" onClick={() => setSelectedId(null)}>
                {t("close", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

/** Word tile — emoji as a MEANING cue (never presented as the sign itself),
 *  bilingual gloss, practised tick once mastery ≥ 2. */
function WordCard({
  sign,
  lang,
  practised,
  onClick,
}: {
  sign: Sign;
  lang: Lang;
  practised: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-paper p-4 text-center transition hover:border-teal/40 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
    >
      {practised && (
        <span className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-paper" aria-hidden="true">
          <Icon name="check" className="text-sm leading-none" />
        </span>
      )}
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sand/60 text-3xl" aria-hidden="true">
        {sign.emoji}
      </span>
      <span className="w-full truncate font-display text-sm font-bold text-ink">
        {pick(lang, sign.glossEn, sign.glossAr)}
      </span>
      <span className="w-full truncate text-[11px] text-muted" dir={lang === "ar" ? "ltr" : "rtl"}>
        {pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr)}
      </span>
    </button>
  );
}
