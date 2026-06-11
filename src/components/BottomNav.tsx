// Bottom navigation — Home / Camera / Family / Progress (PRD §8).
import { t } from "../i18n";
import type { Lang } from "../types";
import { useUi, type Screen } from "../store/ui";

const tabs: { name: Screen["name"]; key: "navHome" | "navCamera" | "navFamily" | "navProgress"; icon: string }[] = [
  { name: "home", key: "navHome", icon: "🏠" },
  { name: "camera", key: "navCamera", icon: "📷" },
  { name: "family", key: "navFamily", icon: "👪" },
  { name: "progress", key: "navProgress", icon: "📈" },
];

export function BottomNav({ lang }: { lang: Lang }) {
  const { screen, go } = useUi();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur safe-bottom"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around pt-1.5">
        {tabs.map((tab) => {
          const active = screen.name === tab.name;
          return (
            <button
              key={tab.name}
              type="button"
              onClick={() => go({ name: tab.name } as Screen)}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-[64px] flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-xs font-semibold transition ${
                active ? "text-teal" : "text-muted"
              }`}
            >
              <span className={`text-xl leading-none ${active ? "" : "grayscale opacity-70"}`} aria-hidden="true">
                {tab.icon}
              </span>
              {t(tab.key, lang)}
              <span
                className={`mt-0.5 h-1 w-6 rounded-full transition ${active ? "bg-gold" : "bg-transparent"}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
