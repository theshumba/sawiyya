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
  // Skip link (L13) — first focusable element on every screen; sr-only until
  // keyboard focus, then a visible pill. Explicit focus() because Chrome only
  // scrolls to a same-page fragment — it doesn't move focus to a tabindex=-1
  // target — and preventDefault keeps the SPA's URL free of a stray #content.
  const skipLink = (
    <a
      href="#content"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById("content")?.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-teal focus:px-4 focus:py-2 focus:font-bold focus:text-paper focus:outline-none focus:ring-2 focus:ring-gold"
    >
      {t("skipToContent", lang)}
    </a>
  );

  if (chrome === "takeover") {
    return (
      <div className="min-h-dvh bg-sand">
        {skipLink}
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
        <div id="content" tabIndex={-1} className="focus:outline-none">
          {children}
        </div>
      </div>
    );
  }

  // tabs chrome — content area clears the mobile bottom bar + desktop rail
  return (
    <div className="min-h-dvh bg-sand lg:ps-60">
      {skipLink}
      <div id="content" tabIndex={-1} className="pb-28 focus:outline-none lg:pb-12">
        {children}
      </div>
      <AppNav lang={lang} />
    </div>
  );
}
