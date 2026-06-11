// Sign demonstration card — HONEST PLACEHOLDER [A] (PRD §11).
// Phase 2 [B]: grant-funded Deaf Qatari signer videos replace these.
import { t, pick } from "../i18n";
import type { Lang, Sign } from "../types";
import { Pill } from "./ui";

export function SignDemo({ sign, lang, compact = false }: { sign: Sign; lang: Lang; compact?: boolean }) {
  const gloss = pick(lang, sign.glossEn, sign.glossAr);
  const other = pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr);
  return (
    <div className="bg-paper border border-line rounded-3xl overflow-hidden">
      <div
        className={`relative flex items-center justify-center bg-gradient-to-b from-teal/10 to-gold/10 ${compact ? "h-36" : "h-56"}`}
      >
        <span className={compact ? "text-6xl" : "text-8xl"} role="img" aria-label={gloss}>
          {sign.type === "alphabet" ? (
            <span className="font-bold text-teal">{sign.code}</span>
          ) : (
            sign.emoji
          )}
        </span>
        <span className="absolute top-3 end-3 animate-pulse-ring rounded-full">
          <span className="block h-3 w-3 rounded-full bg-gold" />
        </span>
      </div>
      <div className={`px-5 ${compact ? "py-3" : "py-4"}`}>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className={`font-bold ${compact ? "text-lg" : "text-2xl"}`}>{gloss}</h3>
          <span className="text-muted font-medium">{other}</span>
        </div>
        {!compact && (
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
            {pick(lang, sign.hintEn, sign.hintAr)}
          </p>
        )}
        {!compact && sign.type !== "alphabet" && (
          <Pill tone="muted" className="mt-3 !text-xs !font-medium">
            {t("lsDemoPlaceholder", lang)}
          </Pill>
        )}
      </div>
    </div>
  );
}
