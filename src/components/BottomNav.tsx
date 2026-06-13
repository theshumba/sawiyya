// Bottom navigation — Home / Camera / Family / Progress (PRD §8).
// Visual design mirrored from the approved Stitch brand build (stitch-v2-brand).
import { t } from "../i18n";
import type { Lang } from "../types";
import { useUi, type Screen } from "../store/ui";
import { Icon } from "./ui";

const tabs: { name: Screen["name"]; key: "navHome" | "navCamera" | "navFamily" | "navProgress"; icon: string }[] = [
  { name: "home", key: "navHome", icon: "home" },
  { name: "camera", key: "navCamera", icon: "video_camera_front" },
  { name: "family", key: "navFamily", icon: "favorite" },
  { name: "progress", key: "navProgress", icon: "monitoring" },
];

export function BottomNav({ lang }: { lang: Lang }) {
  const { screen, go } = useUi();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t-4 border-sand bg-paper shadow-[0_-4px_10px_rgba(0,0,0,0.05)] safe-bottom"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-4 pt-2">
        {tabs.map((tab) => {
          const active = screen.name === tab.name;
          return (
            <button
              key={tab.name}
              type="button"
              onClick={() => go({ name: tab.name } as Screen)}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-full px-4 py-1 transition-all ${
                active
                  ? "translate-y-0.5 border-b-4 border-gold bg-teal/10 text-teal"
                  : "text-ink/40"
              }`}
            >
              <Icon name={tab.icon} fill={active} className="text-3xl leading-none" />
              <span className="font-display text-[10px] font-bold uppercase tracking-wider">{t(tab.key, lang)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
