// SignGlyph — the single source of truth for "how do we draw a sign?" (spec §3).
// Centralises the branching that was re-implemented (and drifted) across Home,
// Family, FlagPicker, AllSigns, LessonPlayer, CameraTrainer, Progress:
//   sign.photo     → REAL signer photo (ArSL21L, CC BY 4.0) — all 31 letters
//   iloveyou       → brand demo image
//   alphabet       → averaged-handshape skeleton (fallback if a photo is missing)
//   alphabet edge  → the Arabic letter (dir=rtl)
//   else (words)   → honest sign icon (NO emoji — we don't fake a hand we lack)
// Phase-2 swaps in Deaf-signer video [B].
import { pick } from "../i18n";
import type { Lang, Sign } from "../types";
import { Icon } from "./ui";
import { HandSkeleton, hasHandShape } from "./HandSkeleton";

export function SignGlyph({
  sign,
  lang,
  className = "text-5xl",
  imgClassName = "h-full w-full rounded-xl object-cover",
}: {
  sign: Sign;
  lang: Lang;
  /** sizing for the text/icon glyph (also sizes the handshape box via em units) */
  className?: string;
  /** sizing for the iloveyou brand image */
  imgClassName?: string;
}) {
  const gloss = pick(lang, sign.glossEn, sign.glossAr);
  // Real signer photo — the letter's actual hand, cropped square. Sized to the
  // text box (1.5em) exactly like the skeleton so every call-site lays out
  // unchanged.
  if (sign.photo) {
    return (
      <span className={`inline-flex ${className}`} role="img" aria-label={gloss}>
        <span className="inline-flex h-[1.5em] w-[1.5em] items-center justify-center overflow-hidden rounded-[0.28em]">
          <img src={sign.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
        </span>
      </span>
    );
  }
  if (sign.id === "iloveyou") {
    return <img src="brand/stitch-34.png" alt={gloss} className={imgClassName} />;
  }
  // The 28 seeded letters draw their real averaged hand; sized to the text box so
  // every existing call-site (text-3xl/4xl/5xl) lays out unchanged.
  if (sign.type === "alphabet" && hasHandShape(sign.id)) {
    return (
      <span className={`inline-flex ${className}`} role="img" aria-label={gloss}>
        <span className="inline-flex h-[1.5em] w-[1.5em] items-center justify-center">
          <HandSkeleton signId={sign.id} className="h-full w-full text-teal" />
        </span>
      </span>
    );
  }
  if (sign.type === "alphabet" && sign.code) {
    return (
      <span className={`font-display font-black text-teal ${className}`} dir="rtl" aria-label={gloss}>
        {sign.code}
      </span>
    );
  }
  return <Icon name="sign_language" className={`leading-none ${className}`} />;
}
