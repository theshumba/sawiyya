// ScreenShell — the ONE responsive layout container (spec §3).
// chrome="tabs":    mounts AppNav (mobile bottom bar + desktop rail) and pads
//                   content to clear them. Used by Learn/Practise/Dictionary/Family.
// chrome="takeover": a chrome-light bar (close/back + brand only), NO AppNav.
//                   Used by lesson/firstSign/flagPicker/info/settings/progress/devMetrics.
//
// Replaces every per-screen hand-rolled rail / top-bar / footer.
import type { ReactNode } from "react";
import { t } from "../i18n";
import type { Lang } from "../types";
import { Icon } from "./ui";
import { AppNav } from "./AppNav";

export function ScreenShell({
  children,
  lang,
  chrome = "tabs",
  title,
  onClose,
}: {
  children: ReactNode;
  lang: Lang;
  chrome?: "tabs" | "takeover";
  /** takeover header title */
  title?: string;
  /** takeover close/back handler — renders the close affordance when provided */
  onClose?: () => void;
}) {
  if (chrome === "takeover") {
    return (
      <div className="min-h-dvh bg-sand">
        {(title || onClose) && (
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-sand/95 px-4 py-3 backdrop-blur">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t("back", lang)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-teal transition hover:bg-teal/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <Icon name="arrow_back" className="text-2xl rtl:rotate-180" />
              </button>
            )}
            {title && <h1 className="font-display text-xl font-bold text-teal">{title}</h1>}
            <span className="ms-auto flex items-center gap-2 text-teal" aria-hidden="true">
              <Icon name="sign_language" fill className="text-xl" />
            </span>
          </header>
        )}
        {children}
      </div>
    );
  }

  // tabs chrome — content area clears the mobile bottom bar + desktop rail
  return (
    <div className="min-h-dvh bg-sand lg:ps-60">
      <div className="pb-28 lg:pb-12">{children}</div>
      <AppNav lang={lang} />
    </div>
  );
}
