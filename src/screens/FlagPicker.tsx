// "Flag signs we need" — the Deaf member directs the household curriculum
// (PRD §6.7). Flagged signs pin to every hearing member's Home and jump
// their SRS queues, tagged with who needs them.
import { num, pick, t } from "../i18n";
import { A1_SIGNS } from "../content/signs";
import { activeFlags, activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { Button } from "../components/ui";

export function FlagPicker() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  if (!profile) return null;
  const lang = profile.language;
  const flaggedIds = new Set(activeFlags(app).map((f) => f.signId));

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("famFlagTitle", lang)} 📌</h1>
        <button
          type="button"
          onClick={() => go({ name: "family" })}
          aria-label={t("back", lang)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-lg"
        >
          ✕
        </button>
      </header>
      <p className="mt-1 text-muted">{t("famFlagSub", lang)}</p>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {A1_SIGNS.map((sign) => {
          const flagged = flaggedIds.has(sign.id);
          return (
            <button
              key={sign.id}
              type="button"
              aria-pressed={flagged}
              onClick={() => app.toggleFlag(sign.id, profile.id)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition ${
                flagged
                  ? "border-coral bg-coral/10 ring-2 ring-coral/30"
                  : "border-line bg-paper"
              }`}
            >
              <span className="text-4xl" aria-hidden="true">{sign.emoji}</span>
              <span className="font-bold">{pick(lang, sign.glossEn, sign.glossAr)}</span>
              <span className={`text-xs font-semibold ${flagged ? "text-coral" : "text-muted"}`}>
                {flagged ? `📌 ${t("famFlagged", lang)}` : pick(lang, sign.glossAr, sign.glossEn)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-4 mt-6">
        <Button full variant="secondary" onClick={() => go({ name: "family" })}>
          {t("save", lang)} ({num(flaggedIds.size, lang)})
        </Button>
      </div>
    </div>
  );
}
