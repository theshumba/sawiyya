// AppNav — the SINGLE navigation source of truth (spec §3).
// One component renders the mobile bottom bar AND the desktop left rail
// (progressive enhancement, NOT a twin tree). 4 tabs + a profile button that
// absorbs Progress + Settings, so they leave the tab bar entirely.
//
// Replaces the old BottomNav + every hand-rolled in-screen rail/top-bar, which
// drifted (same destination, different icons) and caused re-skin regressions.
import { useState, type RefObject } from "react";
import { t } from "../i18n";
import type { Lang } from "../types";
import { activeProfile, pinnedFlagSigns, useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { Screen } from "../store/ui";
import { Avatar, Badge, Icon } from "./ui";
import { useDialog } from "./useDialog";

interface Tab {
  /** screen this tab routes to */
  name: Screen["name"];
  /** screens that should show this tab as active (e.g. Practise → chooser + camera) */
  active: Screen["name"][];
  icon: string;
  label: (l: Lang) => string;
}

const TABS: Tab[] = [
  { name: "home", active: ["home"], icon: "home", label: (l) => t("navLearn", l) },
  {
    // Practice-first: this tab drops you STRAIGHT into the camera (real-graded
    // alphabet on alpha-alif, with the full letter switcher) — no chooser detour.
    // PractiseChooser still exists as a reachable screen, just not the tab target.
    // Rendered flat (no coral hero) to match the design's 5-flat-icon bottom bar.
    name: "camera",
    active: ["practiseChooser", "camera"],
    icon: "videocam",
    label: (l) => t("navPractise", l),
  },
  { name: "allSigns", active: ["allSigns"], icon: "menu_book", label: (l) => t("navDictionary", l) },
  { name: "family", active: ["family"], icon: "favorite", label: (l) => t("navFamily", l) },
];

export function AppNav({ lang }: { lang: Lang }) {
  const app = useApp();
  const screen = useUi((s) => s.screen);
  const go = useUi((s) => s.go);
  const [menuOpen, setMenuOpen] = useState(false);
  // H16: focus the menu on open, trap Tab, Escape/backdrop to dismiss,
  // restore focus to the profile button that opened it.
  // The menu renders TWICE (mobile bottom bar + desktop rail — CSS hides one),
  // so each instance needs its own dialog ref: a single shared ref binds to the
  // last-mounted (desktop) copy, and on mobile that copy is display:none, which
  // silently no-ops every focus call. The hidden instance's hook is harmless —
  // focus() on a hidden node does nothing and its Tab trap sees no focusables.
  // Mobile is declared first to match DOM order (its effect must claim focus
  // before the hidden desktop instance captures a stale restore target).
  const menuRefMobile = useDialog<HTMLDivElement>(menuOpen, () => setMenuOpen(false));
  const menuRefDesktop = useDialog<HTMLDivElement>(menuOpen, () => setMenuOpen(false));

  const profile = activeProfile(app);
  const requests = profile
    ? pinnedFlagSigns(app, profile.id).filter((f) => f.raisedByProfileId !== profile.id).length
    : 0;

  const isActive = (tab: Tab) => tab.active.includes(screen.name);

  // shared profile menu (Progress + Settings live here, not in the tab bar)
  const profileMenu = (menuRef: RefObject<HTMLDivElement>) => menuOpen && (
    <>
      <button
        type="button"
        aria-label={t("close", lang)}
        className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
        onClick={() => setMenuOpen(false)}
      />
      <div
        ref={menuRef}
        role="menu"
        aria-label={t("navProfile", lang)}
        tabIndex={-1}
        className="absolute bottom-full end-0 z-50 mb-3 w-52 overflow-hidden rounded-3xl border border-line bg-paper shadow-lift focus:outline-none lg:bottom-auto lg:start-full lg:top-0 lg:mb-0 lg:ms-3"
      >
        {profile && (
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Avatar emoji={profile.emoji} />
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-extrabold text-ink"><bdi>{profile.displayName}</bdi></span>
              <span className="block text-xs font-medium text-muted">{t("navProfile", lang)}</span>
            </span>
          </div>
        )}
        {[
          { name: "progress" as const, icon: "monitoring", label: t("navProgress", lang) },
          { name: "settings" as const, icon: "settings", label: t("setTitle", lang) },
        ].map((it) => (
          <button
            key={it.name}
            type="button"
            role="menuitem"
            onClick={() => {
              go({ name: it.name });
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-start font-display text-[15px] font-semibold text-ink transition hover:bg-teal/5 focus-visible:outline-none focus-visible:bg-teal/5"
          >
            <Icon name={it.icon} className="text-xl text-teal" />
            {it.label}
          </button>
        ))}
      </div>
    </>
  );

  const profileButton = (menuRef: RefObject<HTMLDivElement>) => (
    <div className="relative flex flex-col items-center justify-center">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={t("navProfile", lang)}
        onClick={() => setMenuOpen((v) => !v)}
        className="relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-[5px] rounded-2xl px-2 py-1 transition duration-200 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
      >
        {profile ? <Avatar emoji={profile.emoji} size="sm" /> : <Icon name="account_circle" className="text-2xl text-teal" />}
        {requests > 0 && (
          <span className="absolute end-1 top-0">
            <Badge count={requests} />
          </span>
        )}
        <span className={`font-display text-[10px] leading-none ${menuOpen ? "font-bold text-teal" : "font-medium text-muted"}`}>{t("navProfile", lang)}</span>
      </button>
      {profileMenu(menuRef)}
    </div>
  );

  const tabButton = (tab: Tab, vertical: boolean) => {
    const active = isActive(tab);
    // Icon colour is independent of the label colour on the rail (design Block 5):
    // active teal, inactive muted (H15: was #B8C4C1/#8F9C99 — 1.68:1/2.66:1, both AA fails).
    const iconColor = active ? "text-teal" : "text-muted";
    return (
      <button
        key={tab.name}
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={() => go({ name: tab.name } as Screen)}
        className={`flex min-h-[48px] min-w-[48px] items-center transition duration-200 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
          vertical
            ? `w-full gap-3 rounded-2xl px-4 py-3 font-display font-bold ${active ? "bg-teal/10 text-teal" : "text-muted hover:bg-teal/5"}`
            : "flex-col justify-center gap-[5px] rounded-2xl px-2 py-1"
        }`}
      >
        {/* icon box — 26×24 in the design, glyph bottom-aligned */}
        <span className="flex h-6 items-end justify-center">
          <Icon name={tab.icon} fill={active} className={`text-2xl leading-none ${iconColor}`} />
        </span>
        <span
          className={
            vertical
              ? "leading-none"
              : `font-display text-[10px] leading-none ${active ? "font-bold text-teal" : "font-medium text-muted"}`
          }
        >
          {tab.label(lang)}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* MOBILE: bottom bar */}
      <nav
        aria-label={t("navMain", lang)}
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-start justify-around px-2 pb-4 pt-[9px]">
          {TABS.map((tab) => tabButton(tab, false))}
          {profileButton(menuRefMobile)}
        </div>
      </nav>

      {/* DESKTOP: left rail */}
      <nav
        aria-label={t("navMain", lang)}
        className="fixed inset-y-0 start-0 z-30 hidden w-60 flex-col gap-2 border-e border-line bg-paper/95 px-4 py-8 backdrop-blur lg:flex"
      >
        <div className="mb-6 flex items-center gap-3 px-3">
          <Icon name="sign_language" fill className="text-2xl text-teal" />
          <span className="font-display text-xl font-bold tracking-tight text-teal" dir="ltr">
            sawiyya<span className="text-gold">.</span>
          </span>
        </div>
        {TABS.map((tab) => tabButton(tab, true))}
        <div className="mt-auto">{profileButton(menuRefDesktop)}</div>
      </nav>
    </>
  );
}
