// Bottom navigation — Home / Camera / Signs / Family / Progress (PRD §8).
// Visual design mirrored from the approved Stitch brand build (stitch-v2-brand):
// the all-signs--mobile layout adds a central "Signs" (dictionary) tab routing
// to the allSigns library screen. Active tab: filled icon + teal tint pill with a
// gold bottom edge, nudged down — matching the Stitch active treatment.
import { pick, t } from "../i18n";
import type { Lang } from "../types";
import { useUi, type Screen } from "../store/ui";
import { Icon } from "./ui";

type Tab = {
  name: Screen["name"];
  icon: string;
  label: (lang: Lang) => string;
};

const tabs: Tab[] = [
  { name: "home", icon: "home", label: (l) => t("navHome", l) },
  { name: "camera", icon: "video_camera_front", label: (l) => t("navCamera", l) },
  // No i18n key exists for the dictionary tab yet — bilingual literal per Stitch ("Signs · القاموس").
  { name: "allSigns", icon: "menu_book", label: (l) => pick(l, "Signs", "القاموس") },
  { name: "family", icon: "favorite", label: (l) => t("navFamily", l) },
  { name: "progress", icon: "monitoring", label: (l) => t("navProgress", l) },
];

export function BottomNav({ lang }: { lang: Lang }) {
  const { screen, go } = useUi();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t-4 border-sand bg-paper shadow-[0_-4px_10px_rgba(0,0,0,0.05)] safe-bottom"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-2">
        {tabs.map((tab) => {
          const active = screen.name === tab.name;
          return (
            <button
              key={tab.name}
              type="button"
              onClick={() => go({ name: tab.name } as Screen)}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-[60px] flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                active
                  ? "translate-y-0.5 border-b-4 border-gold bg-teal/10 text-teal"
                  : "text-ink/40 hover:text-teal"
              }`}
            >
              <Icon name={tab.icon} fill={active} className="text-3xl leading-none" />
              <span className="font-display text-[10px] font-bold uppercase tracking-wider">
                {tab.label(lang)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
