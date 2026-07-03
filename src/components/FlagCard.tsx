// FlagCard — the family-flag surface (spec §3), one component at two densities.
// compact: the single "N family requests" deep-link used on the Learn tab.
// full:    the richer need-card used on the Family tab.
// The cameraGradable→targetSignId gate stays the CALLER's responsibility (passed
// in via onClick) — this is presentation only.
import { pick } from "../i18n";
import type { Lang, Sign } from "../types";
import { ScreenCard, Icon } from "./ui";
import { SignGlyph } from "./SignGlyph";

export function FlagCard({
  sign,
  requestedBy,
  lang,
  compact = false,
  onClick,
}: {
  sign: Sign;
  /** display name of the family member who raised the flag */
  requestedBy?: string;
  lang: Lang;
  compact?: boolean;
  onClick?: () => void;
}) {
  const gloss = pick(lang, sign.glossEn, sign.glossAr);
  return (
    <ScreenCard variant="elevated" onClick={onClick} className="flex items-center gap-4 p-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sand">
        <SignGlyph sign={sign} lang={lang} className="text-3xl" imgClassName="h-12 w-12 rounded-lg object-cover" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold text-ink">{gloss}</p>
        {requestedBy && (
          <p className="truncate text-sm text-coral">
            <bdi>{requestedBy}</bdi>
          </p>
        )}
      </div>
      {!compact && onClick && <Icon name="videocam" className="text-2xl text-coral" />}
      {compact && <Icon name="arrow_forward" className="text-xl text-teal rtl:rotate-180" />}
    </ScreenCard>
  );
}
