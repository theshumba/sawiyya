// AppNav — the SINGLE navigation source of truth (spec §3).
// One component renders the mobile bottom bar AND the desktop left rail
// (progressive enhancement, NOT a twin tree). 4 tabs + a profile button that
// absorbs Progress + Settings, so they leave the tab bar entirely.
//
// Replaces the old BottomNav + every hand-rolled in-screen rail/top-bar, which
// drifted (same destination, different icons) and caused re-skin regressions.
import { useState } from "react";
import { t } from "../i18n";
import type { Lang } from "../types";
import { activeProfile, pinnedFlagSigns, useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { Screen } from "../store/ui";
import { Avatar, Badge, Icon } from "./ui";

interface Tab {
  /** screen this tab routes to */
  name: Screen["name"];
  /** screens that should show this tab as active (e.g. Practise → chooser + camera) */
  active: Screen["name"][];
  icon: string;
  label: (l: Lang) => string;
  /** the visually dominant centre tab (the camera moat) */
  hero?: boolean;
}

const TABS: Tab[] = [
  { name: "home", active: ["home"], icon: "home", label: (l) => t("navLearn", l) },
  {
    name: "practiseChooser",
    active: ["practiseChooser", "camera"],
    icon: "videocam",
    label: (l) => t("navPractise", l),
    hero: true,
  },
  { name: "allSigns", active: ["allSigns"], icon: "menu_book", label: (l) => t("navDictionary", l) },
  { name: "family", active: ["family"], icon: "favorite", label: (l) => t("navFamily", l) },
];

export function AppNav({ lang }: { lang: Lang }) {
  const app = useApp();
  const screen = useUi((s) => s.screen);
  const go = useUi((s) => s.go);
  const [menuOpen, setMenuOpen] = useState(false);

  const profile = activeProfile(app);
  const requests = profile
    ? pinnedFlagSigns(app, profile.id).filter((f) => f.raisedByProfileId !== profile.id).length
    : 0;

  const isActive = (tab: Tab) => tab.active.includes(screen.name);

  // shared profile menu (Progress + Settings live here, not in the tab bar)
  const profileMenu = menuOpen && (
    <>
      <button
        type="button"
        aria-label={t("close", lang)}
        className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
        onClick={() => setMenuOpen(false)}
      />
      <div
        role="menu"
        className="absolute bottom-full end-0 z-50 mb-3 w-52 overflow-hidden rounded-3xl border border-line bg-paper shadow-lift lg:bottom-auto lg:start-full lg:top-0 lg:mb-0 lg:ms-3"
      >
        {profile && (
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Avatar emoji={profile.emoji} />
            <span className="min-w-0">
              <span className="block truncate font-display font-bold text-ink"><bdi>{profile.displayName}</bdi></span>
              <span className="block text-xs text-muted">{t("navProfile", lang)}</span>
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
            className="flex w-full items-center gap-3 px-4 py-3 text-start font-display font-semibold text-ink transition hover:bg-teal/5 focus-visible:outline-none focus-visible:bg-teal/5"
          >
            <Icon name={it.icon} className="text-xl text-teal" />
            {it.label}
          </button>
        ))}
      </div>
    </>
  );

  const profileButton = (
    <div className="relative flex flex-col items-center justify-center">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={t("navProfile", lang)}
        onClick={() => setMenuOpen((v) => !v)}
        className="relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
      >
        {profile ? <Avatar emoji={profile.emoji} size="sm" /> : <Icon name="account_circle" className="text-2xl text-teal" />}
        {requests > 0 && (
          <span className="absolute end-1 top-0">
            <Badge count={requests} />
          </span>
        )}
        <span className="font-display text-[11px] font-bold text-ink/60">{t("navProfile", lang)}</span>
      </button>
      {profileMenu}
    </div>
  );

  const tabButton = (tab: Tab, vertical: boolean) => {
    const active = isActive(tab);
    return (
      <button
        key={tab.name}
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={() => go({ name: tab.name } as Screen)}
        className={`flex min-h-[48px] min-w-[48px] items-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
          vertical
            ? `w-full gap-3 rounded-2xl px-4 py-3 font-display font-bold ${active ? "bg-teal/10 text-teal" : "text-ink/60 hover:bg-teal/5"}`
            : "flex-col justify-center gap-0.5 rounded-2xl px-2"
        }`}
      >
        <span
          className={`flex items-center justify-center ${
            tab.hero && !vertical
              ? `-mt-5 h-14 w-14 rounded-full shadow-coral ${active ? "bg-coral text-white" : "bg-coral/90 text-white"}`
              : ""
          }`}
        >
          <Icon
            name={tab.icon}
            fill={active}
            className={`leading-none ${tab.hero && !vertical ? "text-3xl" : "text-2xl"} ${
              !(tab.hero && !vertical) ? (active ? "text-teal" : "text-ink/55") : ""
            }`}
          />
        </span>
        {!(tab.hero && !vertical) || vertical ? (
          <span className={`font-display ${vertical ? "" : "text-[11px] font-bold"} ${active ? "text-teal" : "text-ink/60"}`}>
            {tab.label(lang)}
          </span>
        ) : (
          <span className="font-display text-[11px] font-bold text-coral">{tab.label(lang)}</span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* MOBILE: bottom bar */}
      <nav
        aria-label={t("navProfile", lang)}
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-2">
          {TABS.map((tab) => tabButton(tab, false))}
          {profileButton}
        </div>
      </nav>

      {/* DESKTOP: left rail */}
      <nav
        aria-label={t("navProfile", lang)}
        className="fixed inset-y-0 start-0 z-30 hidden w-60 flex-col gap-2 border-e border-line bg-paper/95 px-4 py-8 backdrop-blur lg:flex"
      >
        <div className="mb-6 flex items-center gap-3 px-3">
          <Icon name="sign_language" fill className="text-2xl text-teal" />
          <span className="font-display text-xl font-bold tracking-tight text-teal" dir="ltr">
            sawiyya<span className="text-gold">.</span>
          </span>
        </div>
        {TABS.map((tab) => tabButton(tab, true))}
        <div className="mt-auto">{profileButton}</div>
      </nav>
    </>
  );
}
