// Sign demonstration card — HONEST PLACEHOLDER [A] (PRD §11).
// Phase 2 [B]: grant-funded Deaf Qatari signer videos replace these.
// Visuals mirror the demonstration card in first-sign-watch (stitch-v2-brand).
import { t, pick } from "../i18n";
import type { Lang, Sign } from "../types";
import { Icon } from "./ui";

export function SignDemo({ sign, lang, compact = false }: { sign: Sign; lang: Lang; compact?: boolean }) {
  const gloss = pick(lang, sign.glossEn, sign.glossAr);
  const other = pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr);
  return (
    <div className="relative rounded-bowl border-4 border-teal/5 bg-sand/60 p-4 shadow-inner">
      {/* gold sparkle flourish */}
      <span className="absolute -top-3 -end-1 text-gold opacity-70" aria-hidden="true">
        <Icon name="auto_awesome" fill className={`leading-none ${compact ? "text-2xl" : "text-4xl"}`} />
      </span>

      {/* demonstration stage — teal-to-gold gradient with spotlight */}
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-teal/15 via-paper to-gold/15 ${compact ? "h-36" : "h-60"}`}
      >
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at 50% 32%, rgba(255,255,255,.75), transparent 62%)" }}
          aria-hidden="true"
        />
        {sign.id === "iloveyou" ? (
          <img
            src="brand/stitch-30.png"
            alt={gloss}
            className="relative h-full w-full rounded-3xl object-cover"
          />
        ) : sign.type === "alphabet" ? (
          <span
            className={`relative font-display font-bold text-teal ${compact ? "text-6xl" : "text-8xl"}`}
            role="img"
            aria-label={gloss}
          >
            {sign.code}
          </span>
        ) : (
          <Icon
            name="sign_language"
            className={`relative leading-none text-teal/70 ${compact ? "text-6xl" : "text-8xl"}`}
          />
        )}
      </div>

      <div className={`px-2 ${compact ? "py-3" : "py-4"}`}>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className={`font-display font-bold ${compact ? "text-lg" : "text-2xl"}`}>{gloss}</h3>
          <span className="font-medium text-muted">{other}</span>
        </div>
        {!compact && (
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
            {pick(lang, sign.hintEn, sign.hintAr)}
          </p>
        )}
        {/* footnote tag — honest placeholder */}
        {!compact && sign.type !== "alphabet" && (
          <div className="mt-3 flex items-start gap-1.5 rounded-full bg-ink/5 px-3 py-1.5">
            <Icon name="info" className="mt-0.5 text-xs leading-none text-ink/60" />
            <p className="text-[11px] font-medium italic leading-snug text-ink/60">
              {t("lsDemoPlaceholder", lang)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
