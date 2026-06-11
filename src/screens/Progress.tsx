// Progress — signs mastered, per-tier progress, SRS upcoming (PRD §8).
import { num, pick, t } from "../i18n";
import { A1_SIGNS, ALPHABET, signById, UNIT_A1_U1 } from "../content/signs";
import { activeProfile, dueSignIds, useApp } from "../store/app";
import { isTrained } from "../recognizer/knn";
import { Card, Pill, ProgressRing } from "../components/ui";

export function Progress() {
  const app = useApp();
  const profile = activeProfile(app);
  if (!profile) return null;
  const lang = profile.language;
  const prog = app.progress[profile.id] ?? {};

  const mastered = Object.values(prog).filter((p) => p.masteryLevel >= 3).length;
  const seen = Object.values(prog).filter((p) => p.masteryLevel >= 1).length;
  const a1Done = A1_SIGNS.filter((s) => (prog[s.id]?.masteryLevel ?? 0) >= 2).length;
  const alphaTaught = ALPHABET.filter((s) => isTrained(s.id)).length;
  const due = dueSignIds(app, profile.id);
  const upcoming = Object.entries(app.srs[profile.id] ?? {})
    .filter(([, c]) => new Date(c.due).getTime() > Date.now())
    .sort((a, b) => new Date(a[1].due).getTime() - new Date(b[1].due).getTime())
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-md px-5 pb-28 pt-6">
      <h1 className="text-2xl font-bold">{t("prTitle", lang)}</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center gap-1 p-5 text-center">
          <span className="font-display text-4xl font-bold text-teal">{num(mastered, lang)}</span>
          <span className="text-sm font-semibold text-muted">{t("prMastered", lang)}</span>
        </Card>
        <Card className="flex flex-col items-center gap-1 p-5 text-center">
          <span className="font-display text-4xl font-bold text-gold">{num(seen, lang)}</span>
          <span className="text-sm font-semibold text-muted">{t("prSeen", lang)}</span>
        </Card>
      </div>

      <Card className="mt-3 flex items-center gap-4 p-4">
        <ProgressRing progress={a1Done / A1_SIGNS.length} size={64}>
          <span className="font-display text-xs font-bold text-teal">
            {num(a1Done, lang)}/{num(A1_SIGNS.length, lang)}
          </span>
        </ProgressRing>
        <div>
          <p className="font-bold">A1·1 — {pick(lang, UNIT_A1_U1.titleEn, UNIT_A1_U1.titleAr)}</p>
          <p className="text-sm text-muted">🔥 {num(profile.streak, lang)} {t("homeStreak", lang)} · ⚡ {num(profile.xp, lang)} {t("xp", lang)}</p>
        </div>
      </Card>

      <Card className="mt-3 flex items-center gap-4 p-4">
        <ProgressRing progress={alphaTaught / ALPHABET.length} size={64}>
          <span className="font-display text-xs font-bold text-teal">
            {num(alphaTaught, lang)}/{num(ALPHABET.length, lang)}
          </span>
        </ProgressRing>
        <div>
          <p className="font-bold">{t("prAlphabet", lang)} أ ب ت</p>
          <p className="text-sm text-muted">{t("camPractice", lang)}</p>
        </div>
      </Card>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-teal">
          {t("prUpcoming", lang)} ⏳
        </h2>
        {due.length === 0 && upcoming.length === 0 ? (
          <Card className="p-4 text-sm text-muted">{t("prNothingDue", lang)}</Card>
        ) : (
          <div className="flex flex-col gap-2">
            {due.slice(0, 4).map((signId) => {
              const sign = signById(signId);
              if (!sign) return null;
              return (
                <Card key={signId} className="flex items-center gap-3 p-3">
                  <span className="text-2xl" aria-hidden="true">
                    {sign.type === "alphabet" ? sign.code : sign.emoji}
                  </span>
                  <p className="flex-1 font-bold">{pick(lang, sign.glossEn, sign.glossAr)}</p>
                  <Pill tone="coral">{t("homeReviewDue", lang)}</Pill>
                </Card>
              );
            })}
            {upcoming.map(([signId, card]) => {
              const sign = signById(signId);
              if (!sign) return null;
              const days = Math.max(0, Math.round((new Date(card.due).getTime() - Date.now()) / 86400000));
              return (
                <Card key={signId} className="flex items-center gap-3 p-3">
                  <span className="text-2xl" aria-hidden="true">
                    {sign.type === "alphabet" ? sign.code : sign.emoji}
                  </span>
                  <p className="flex-1 font-bold">{pick(lang, sign.glossEn, sign.glossAr)}</p>
                  <Pill tone="muted">
                    {days === 0 ? "<1d" : `${num(days, lang)}d`}
                  </Pill>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
