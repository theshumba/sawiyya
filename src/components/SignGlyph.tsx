// SignGlyph — the single source of truth for "how do we draw a sign?" (spec §3).
// Centralises the branching that was re-implemented (and drifted) across Home,
// Family, FlagPicker, AllSigns, LessonPlayer, CameraTrainer, Progress:
//   iloveyou → brand demo image · alphabet → the Arabic letter (dir=rtl) · else emoji.
// Honest-placeholder assets [A]; Phase-2 swaps in Deaf-signer video [B].
import { pick } from "../i18n";
import type { Lang, Sign } from "../types";
import { Icon } from "./ui";

export function SignGlyph({
  sign,
  lang,
  className = "text-5xl",
  imgClassName = "h-full w-full rounded-xl object-cover",
}: {
  sign: Sign;
  lang: Lang;
  /** sizing for the text/emoji/icon glyph */
  className?: string;
  /** sizing for the iloveyou brand image */
  imgClassName?: string;
}) {
  const gloss = pick(lang, sign.glossEn, sign.glossAr);
  if (sign.id === "iloveyou") {
    return <img src="brand/stitch-34.png" alt={gloss} className={imgClassName} />;
  }
  if (sign.type === "alphabet" && sign.code) {
    return (
      <span className={`font-display font-black text-teal ${className}`} dir="rtl" aria-label={gloss}>
        {sign.code}
      </span>
    );
  }
  if (sign.emoji) {
    return (
      <span className={className} aria-hidden="true">
        {sign.emoji}
      </span>
    );
  }
  return <Icon name="sign_language" className={`leading-none ${className}`} />;
}
