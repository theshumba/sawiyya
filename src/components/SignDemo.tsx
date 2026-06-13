// Sign demonstration card — HONEST PLACEHOLDER [A] (PRD §11).
// Phase 2 [B]: grant-funded Deaf Qatari signer videos replace these.
// Visuals mirror the demonstration card in first-sign-watch-i-love-you / -demo (stitch-v2-brand).
import { useState } from "react";
import { t, pick } from "../i18n";
import type { Lang, Sign } from "../types";
import { Icon } from "./ui";

export function SignDemo({ sign, lang, compact = false }: { sign: Sign; lang: Lang; compact?: boolean }) {
  const gloss = pick(lang, sign.glossEn, sign.glossAr);
  const other = pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr);
  // "Replay" re-triggers the float/pulse animation on the demo (honest placeholder — no video yet).
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="relative flex flex-col items-center rounded-3xl border-4 border-teal/5 bg-sand/50 p-6 shadow-inner sm:p-8">
      {/* gold sparkle flourish — top-end corner */}
      <span className="absolute -top-4 -end-2 text-gold opacity-60" aria-hidden="true">
        <Icon name="auto_awesome" fill className={`leading-none ${compact ? "text-2xl" : "text-4xl"}`} />
      </span>

      {/* demonstration stage — square, spotlit, with the placeholder image */}
      <div
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-teal/15 via-paper to-gold/15 ${
          compact ? "aspect-square" : "aspect-square"
        }`}
      >
        <span
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: "radial-gradient(circle at 50% 32%, rgba(255,255,255,.7), transparent 62%)" }}
          aria-hidden="true"
        />
        {sign.id === "iloveyou" ? (
          <>
            {/* Mobile: warm signer photo (stitch-30). Desktop Stitch: the ILY hand
                illustration on its transparent checkerboard (stitch-54). */}
            <img
              key={`m-${replayKey}`}
              src="brand/stitch-30.png"
              alt={gloss}
              className="animate-pop-in relative z-10 h-full w-full object-cover md:hidden"
            />
            <img
              key={`d-${replayKey}`}
              src="brand/stitch-54.png"
              alt={gloss}
              className="animate-pop-in relative z-10 hidden h-full w-full object-contain p-4 drop-shadow-2xl md:block"
            />
          </>
        ) : sign.type === "alphabet" ? (
          <span
            key={replayKey}
            className={`animate-pop-in relative z-10 font-display font-bold text-teal ${compact ? "text-6xl" : "text-8xl"}`}
            role="img"
            aria-label={gloss}
          >
            {sign.code}
          </span>
        ) : (
          <Icon
            name="sign_language"
            className={`animate-pop-in relative z-10 leading-none text-teal/70 ${compact ? "text-6xl" : "text-8xl"}`}
          />
        )}

        {/* Replay chip — frosted, centred over the stage (mirrors Stitch play_arrow chip) */}
        {!compact && (
          <button
            type="button"
            onClick={() => setReplayKey((k) => k + 1)}
            className="extruded-teal absolute bottom-4 end-4 z-20 flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 font-display font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <Icon name="replay" className="text-lg leading-none" />
            <span className="text-sm">{pick(lang, "Replay", "إعادة")}</span>
          </button>
        )}
      </div>

      {/* footnote — honest placeholder (PRD §11). Tag pill + italic line. */}
      {!compact ? (
        <div className="mt-5 flex flex-col items-center gap-2 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1">
            <Icon name="info" className="text-xs leading-none text-ink/60" />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider text-ink/60">
              {pick(lang, "Demo placeholder", "عرض مؤقت")}
            </span>
          </span>
          <p className="max-w-[260px] text-xs italic leading-snug text-ink/40">
            {t("lsDemoPlaceholder", lang)}
          </p>
        </div>
      ) : (
        <div className="mt-3 w-full px-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-lg font-bold">{gloss}</h3>
            <span className="font-medium text-muted">{other}</span>
          </div>
        </div>
      )}
    </div>
  );
}
