// Family Mode — the structural inverse of "fix the Deaf person" (PRD §6.7).
// The Deaf member flags signs; the household's queues follow them.
import { useState } from "react";
import { num, pick, t } from "../i18n";
import { signById } from "../content/signs";
import {
  activeFlags,
  activeProfile,
  householdStreak,
  profilesActiveToday,
  signsAllCanDo,
  todayKey,
  useApp,
} from "../store/app";
import { useUi } from "../store/ui";
import type { Persona } from "../types";
import { Button, Card, Pill } from "../components/ui";

const ROLES: { value: Persona; emoji: string }[] = [
  { value: "parent", emoji: "👨‍👩‍👧" },
  { value: "sibling", emoji: "🧒" },
  { value: "teacher", emoji: "🏫" },
  { value: "friend", emoji: "🤝" },
  { value: "deaf", emoji: "🧏" },
];

const ROLE_LABEL: Record<Persona, { en: string; ar: string }> = {
  parent: { en: "Parent", ar: "أب / أم" },
  sibling: { en: "Sibling", ar: "أخ / أخت" },
  teacher: { en: "Teacher", ar: "معلم/ة" },
  friend: { en: "Friend", ar: "صديق/ة" },
  deaf: { en: "Deaf — directs the curriculum", ar: "أصم — يوجّه المنهج" },
};

export function Family() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Persona>("sibling");
  if (!profile) return null;
  const lang = profile.language;

  const flags = activeFlags(app);
  const board = signsAllCanDo(app);
  const sharedStreak = householdStreak(app);
  const activeToday = profilesActiveToday(app);
  const deafMembers = app.profiles.filter((p) => p.role === "deaf");

  const addMember = () => {
    if (!newName.trim()) return;
    app.createProfile({
      displayName: newName.trim(),
      role: newRole,
      dominantHand: "R",
      language: lang,
      dailyGoal: "regular",
    });
    setNewName("");
    setAdding(false);
  };

  return (
    <div className="mx-auto max-w-md px-5 pb-28 pt-6">
      <h1 className="text-2xl font-bold">{t("famTitle", lang)}</h1>

      {/* shared streak */}
      <Card className="mt-4 flex items-center gap-4 p-4">
        <span className="text-4xl" aria-hidden="true">🔥</span>
        <div className="flex-1">
          <p className="font-bold">{t("famSharedStreak", lang)}</p>
          <p className="text-sm text-muted">
            {num(activeToday, lang)} / {num(app.profiles.length, lang)} {t("famSignedToday", lang)}
          </p>
        </div>
        <span className="font-display text-3xl font-bold text-gold">
          {num(sharedStreak, lang)}
        </span>
      </Card>

      {/* profiles */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-teal">
          {t("famHousehold", lang)}
        </h2>
        <div className="flex flex-col gap-2">
          {app.profiles.map((p) => {
            const isActive = p.id === app.activeProfileId;
            const signedToday = p.lastActiveDay === todayKey();
            return (
              <Card
                key={p.id}
                className={`flex items-center gap-3 p-3.5 ${isActive ? "!border-teal ring-2 ring-teal/25" : ""}`}
                onClick={() => app.switchProfile(p.id)}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-2xl" aria-hidden="true">
                  {p.emoji}
                </span>
                <div className="flex-1">
                  <p className="font-bold">
                    {p.displayName}
                    {p.role === "deaf" && <span className="ms-1.5" aria-hidden="true">🧏</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {pick(lang, ROLE_LABEL[p.role].en, ROLE_LABEL[p.role].ar)}
                    {" · "}🔥 {num(p.streak, lang)}
                    {signedToday && " · ✓"}
                  </p>
                </div>
                {isActive && <Pill tone="teal">✓</Pill>}
              </Card>
            );
          })}
        </div>

        {!adding ? (
          <Button variant="ghost" full className="mt-3" onClick={() => setAdding(true)}>
            + {t("famAdd", lang)}
          </Button>
        ) : (
          <Card className="mt-3 flex flex-col gap-3 p-4">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("famName", lang)}
              maxLength={20}
              className="rounded-xl border-2 border-line bg-sand px-4 py-3 font-semibold placeholder:text-muted/60 focus:border-teal"
            />
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setNewRole(r.value)}
                  className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold ${
                    newRole === r.value ? "border-teal bg-teal text-white" : "border-line bg-paper"
                  }`}
                >
                  {r.emoji} {pick(lang, ROLE_LABEL[r.value].en, ROLE_LABEL[r.value].ar)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 !py-3" onClick={addMember}>
                {t("save", lang)}
              </Button>
              <Button variant="ghost" className="!py-3" onClick={() => setAdding(false)}>
                {t("cancel", lang)}
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* flags */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-coral">
          {t("famFlagTitle", lang)} 📌
        </h2>
        {deafMembers.length > 0 && (
          <p className="mb-2 text-sm text-muted">
            {deafMembers.map((d) => d.displayName).join("، ")} {t("famOnlyDeafFlags", lang)}
          </p>
        )}
        {flags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {flags.map((f) => {
              const sign = signById(f.signId);
              const by = app.profiles.find((p) => p.id === f.raisedByProfileId);
              if (!sign) return null;
              return (
                <Pill key={f.id} tone="coral">
                  {sign.type === "alphabet" ? sign.code : sign.emoji}{" "}
                  {pick(lang, sign.glossEn, sign.glossAr)}
                  {by && <span className="opacity-70">· {by.emoji}</span>}
                </Pill>
              );
            })}
          </div>
        )}
        {profile.role === "deaf" ? (
          <Button variant="primary" full onClick={() => go({ name: "flagPicker" })}>
            📌 {t("famFlagTitle", lang)}
          </Button>
        ) : (
          flags.length === 0 && (
            <Card className="p-4 text-sm text-muted">{t("famFlagSub", lang)}</Card>
          )
        )}
      </section>

      {/* signs we can all do */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-teal">
          {t("famBoard", lang)} 🏠
        </h2>
        {board.length === 0 ? (
          <Card className="p-4 text-sm text-muted">{t("famBoardEmpty", lang)}</Card>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {board.map((signId) => {
              const sign = signById(signId);
              if (!sign) return null;
              return (
                <Card key={signId} className="flex flex-col items-center gap-1 !bg-gold/10 !border-gold/40 p-3 text-center">
                  <span className="text-3xl" aria-hidden="true">
                    {sign.type === "alphabet" ? sign.code : sign.emoji}
                  </span>
                  <span className="text-xs font-bold">{pick(lang, sign.glossEn, sign.glossAr)}</span>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
