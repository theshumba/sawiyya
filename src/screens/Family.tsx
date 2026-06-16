// Family Mode — the structural inverse of "fix the Deaf person" (PRD §6.7).
// The Deaf member flags signs; the household's queues follow them.
// Redesign §5.6: ScreenShell(chrome=tabs) owns nav; the in-file desktop shell
// (rail/top-bar/party FAB) is deleted; ONE responsive tree; focusSection ("needs
// this week") is the hero with the single coral "Flag signs we need" CTA; the
// honeycomb board is demoted to a celebratory secondary card.
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
import { Button, Card, Eyebrow, Icon, Pill, Subtitle, Title } from "../components/ui";
import { ScreenShell } from "../components/ScreenShell";
import { SignGlyph } from "../components/SignGlyph";

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
  const flagger = deafMembers[0];

  // Honeycomb "Signs we can all do" milestone progress (next 25-sign tier).
  const milestoneTarget = 25;
  const boardPct = Math.min(1, board.length / milestoneTarget);

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

  // ── Household streak "hearth" — illustration + live numbers + member avatars ──
  const memberAvatars = (
    <div className="flex -space-x-3">
      {app.profiles.slice(0, 5).map((p, i) => (
        <span
          key={p.id}
          className={`flex h-11 w-11 items-center justify-center rounded-full border-4 border-paper bg-sand text-xl ${
            p.id === app.activeProfileId ? "ring-4 ring-teal/20" : ""
          }`}
          style={{ zIndex: app.profiles.length - i }}
          aria-hidden="true"
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );

  const streakHearth = (
    <Card variant="elevated" className="relative overflow-hidden p-8">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-40 w-40 motion-safe:animate-rise" style={{ filter: "drop-shadow(0 0 12px rgba(230,178,76,.4))" }}>
          <img src="/brand/stitch-43.png" alt="" className="h-full w-full object-contain" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <Eyebrow lang={lang}>{t("famSharedStreak", lang)}</Eyebrow>
          <h2 className="font-display text-5xl font-extrabold text-teal">{num(sharedStreak, lang)}</h2>
          <Subtitle className="text-teal-deep">
            {num(activeToday, lang)} / {num(app.profiles.length, lang)} {t("famSignedToday", lang)}
          </Subtitle>
        </div>
        {memberAvatars}
      </div>
    </Card>
  );

  // ── Family-members profile switcher (horizontal scroll, chunky tiles) ──
  const profileSwitcher = (
    <section className="space-y-4">
      <Subtitle className="px-1">{t("famHousehold", lang)}</Subtitle>
      <div className="no-scrollbar -mx-2 flex gap-4 overflow-x-auto px-2 py-2">
        {app.profiles.map((p) => {
          const isActive = p.id === app.activeProfileId;
          const signedToday = p.lastActiveDay === todayKey();
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => app.switchProfile(p.id)}
              aria-pressed={isActive}
              className="group flex flex-shrink-0 flex-col items-center gap-2 transition active:scale-95 focus-visible:outline-none"
            >
              <div
                className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-paper text-3xl transition-all ${
                  isActive ? "ring-4 ring-teal" : "border border-line"
                }`}
              >
                <span aria-hidden="true">{p.emoji}</span>
                {p.role === "deaf" && (
                  <span className="absolute start-1 top-1 text-sm" aria-hidden="true">🧏</span>
                )}
                {isActive && (
                  <span className="absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-paper bg-teal text-paper">
                    <Icon name="check" className="text-[14px]" />
                  </span>
                )}
              </div>
              <span
                className={`flex items-center gap-1 font-display text-xs font-bold ${
                  isActive ? "text-teal" : "text-ink"
                }`}
              >
                <bdi>{p.displayName}</bdi>
                {signedToday && <span className="text-teal" aria-hidden="true">✓</span>}
              </span>
            </button>
          );
        })}

        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="group flex flex-shrink-0 flex-col items-center gap-2 focus-visible:outline-none"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-dashed border-teal/20 text-teal/40 transition-colors group-hover:border-teal/40">
              <Icon name="add" />
            </span>
            <span className="font-display text-xs font-bold text-ink/40">{t("famAdd", lang)}</span>
          </button>
        )}
      </div>

      {adding && (
        <Card variant="elevated" className="flex flex-col gap-3 p-5">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("famName", lang)}
            maxLength={20}
            className="rounded-2xl border-2 border-line bg-sand px-4 py-3 font-semibold placeholder:text-muted/60 focus:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
          />
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setNewRole(r.value)}
                aria-pressed={newRole === r.value}
                className={`rounded-2xl border-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                  newRole === r.value ? "border-teal bg-teal text-white" : "border-line bg-paper"
                }`}
              >
                {r.emoji} {pick(lang, ROLE_LABEL[r.value].en, ROLE_LABEL[r.value].ar)}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" full onClick={addMember}>
              {t("save", lang)}
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {t("cancel", lang)}
            </Button>
          </div>
        </Card>
      )}
    </section>
  );

  // ── HERO: "needs this week" — deaf member's flags lead everyone's queue ──
  const flagsRow = flags.length > 0 && (
    <div className="flex flex-wrap gap-2">
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
  );

  const needCards = flags.length > 0 && (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {flags.slice(0, 6).map((f) => {
        const sign = signById(f.signId);
        if (!sign) return null;
        return (
          <div
            key={f.id}
            className="group relative rounded-2xl bg-paper p-2 border border-line transition-transform hover:-translate-y-1"
          >
            <span className="absolute end-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-white shadow-coral" aria-hidden="true">
              <Icon name="push_pin" fill className="text-base" />
            </span>
            {/* Framed sign thumbnail — alphabet code / emoji / icon via SignGlyph. */}
            <span className="mb-2 flex aspect-square w-full items-center justify-center rounded-2xl bg-sand">
              <SignGlyph sign={sign} lang={lang} className="text-4xl md:text-5xl" imgClassName="h-12 w-12 rounded-lg object-cover" />
            </span>
            <div className="px-1 pb-1 text-center">
              <p className="font-display text-sm font-bold text-teal-deep md:text-base">
                {pick(lang, sign.glossEn, sign.glossAr)}
              </p>
              {/* Secondary script line (the non-picked gloss). */}
              <p className="font-sans text-xs font-medium text-ink/40" dir={lang === "en" ? "rtl" : "ltr"}>
                {lang === "en" ? sign.glossAr : sign.glossEn}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  const focusSection = (
    <section className="space-y-5">
      <div className="space-y-2 px-1">
        <span className="inline-block rounded-full bg-coral px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-paper">
          {t("homeFlagged", lang)}
        </span>
        <Title className="flex items-center gap-2 text-coral">
          {flagger ? (
            <span>
              <bdi>{flagger.displayName}</bdi> {t("famFlagged", lang)}
            </span>
          ) : (
            t("famFlagTitle", lang)
          )}
          <Icon name="flag" className="text-xl" />
        </Title>
        {deafMembers.length > 0 && (
          <p className="text-sm text-muted">
            {deafMembers.map((d, i) => (
              <span key={d.id}>
                <bdi>{d.displayName}</bdi>
                {i < deafMembers.length - 1 ? "، " : ""}
              </span>
            ))}{" "}
            {t("famOnlyDeafFlags", lang)}
          </p>
        )}
      </div>
      {flagsRow}
      {needCards}
      {/* The ONE dominant household action — routes everyone to the flag picker. */}
      <Button
        variant="primary"
        size="lg"
        full
        onClick={() => go({ name: "flagPicker" })}
        className="flex items-center justify-center gap-3"
      >
        <Icon name="flag" fill />
        {t("famFlagTitle", lang)}
      </Button>
    </section>
  );

  // ── Secondary: "Signs we can all do" — live honeycomb mosaic + milestone ──
  const HEX = "[clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0%_50%)]";
  const honeycombCells = Math.max(milestoneTarget, board.length);
  const liveHoneycomb = (
    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
      {Array.from({ length: honeycombCells }).map((_, i) => {
        const signId = board[i];
        const sign = signId ? signById(signId) : null;
        const filled = !!sign;
        return (
          <div
            key={signId ?? `empty-${i}`}
            className={`flex aspect-square items-center justify-center text-lg ${HEX} ${
              filled
                ? "bg-gold text-ink shadow-gold motion-safe:animate-pop-in"
                : "border-2 border-dashed border-teal/15 bg-paper/40 text-transparent"
            } ${i % 2 === 1 ? "translate-y-1/4" : ""}`}
            style={filled ? { animationDelay: `${i * 40}ms` } : undefined}
            title={filled ? pick(lang, sign!.glossEn, sign!.glossAr) : undefined}
          >
            <span aria-hidden="true">
              {filled ? (sign!.type === "alphabet" ? sign!.code : sign!.emoji) : ""}
            </span>
          </div>
        );
      })}
    </div>
  );

  // Milestone teaser — now wired to the flag picker (was a dead pill before).
  const milestonePill = (
    <button
      type="button"
      onClick={() => go({ name: "flagPicker" })}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-gold/30 bg-white/80 p-4 text-start transition hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/20 text-gold">
          <Icon name="emoji_events" fill />
        </span>
        <div>
          <Eyebrow className="text-ink/40">{pick(lang, "New Milestone", "إنجاز جديد")}</Eyebrow>
          <p className="font-display font-bold text-teal">
            {pick(lang, `${milestoneTarget} Combined Signs!`, `${num(milestoneTarget, lang)} إشارة مشتركة!`)}
          </p>
        </div>
      </div>
      <Icon name="arrow_forward_ios" className="text-gold rtl:rotate-180" />
    </button>
  );

  const boardSection = (
    <section className="space-y-4">
      <Subtitle className="px-1">{t("famBoard", lang)}</Subtitle>
      <Card variant="flat" className="overflow-hidden bg-teal/5 p-6">
        <p className="mb-6 text-center text-sm italic text-ink/60">
          {pick(lang, "Your shared language, growing.", "لغتكم المشتركة تنمو.")}
        </p>
        {board.length === 0 ? (
          <p className="text-center text-sm text-muted">{t("famBoardEmpty", lang)}</p>
        ) : (
          <>
            <div className="relative px-2 pb-2">{liveHoneycomb}</div>
            <div className="mt-6 flex flex-wrap justify-center gap-1.5">
              {board.slice(0, 8).map((signId) => {
                const sign = signById(signId);
                if (!sign) return null;
                return (
                  <Pill key={signId} tone="gold">
                    <span aria-hidden="true">
                      {sign.type === "alphabet" ? sign.code : sign.emoji}
                    </span>
                    {pick(lang, sign.glossEn, sign.glossAr)}
                  </Pill>
                );
              })}
            </div>
            <div className="mt-6 space-y-2 text-center">
              <div className="h-2 w-full overflow-hidden rounded-full bg-sand">
                <div
                  className="relative h-full rounded-full bg-gold"
                  style={{ width: `${Math.max(6, boardPct * 100)}%` }}
                >
                  <span className="absolute inset-0 bg-white/20 motion-safe:animate-pulse" aria-hidden="true" />
                </div>
              </div>
              <Eyebrow lang={lang} className="text-teal-deep">
                {num(Math.round(boardPct * 100), lang)}%{" "}
                {pick(lang, `to Family Milestone (${milestoneTarget})`, `إلى إنجاز الأسرة (${num(milestoneTarget, lang)})`)}
              </Eyebrow>
            </div>
            <div className="mt-6">{milestonePill}</div>
          </>
        )}
      </Card>
    </section>
  );

  // ── ONE responsive render ─────────────────────────────────────────────
  return (
    <ScreenShell lang={lang} chrome="tabs">
      <div className="mx-auto max-w-md space-y-8 px-5 pt-6 lg:max-w-5xl">
        <header className="px-1">
          <Title>
            {t("famTitle", lang)} <span className="font-normal text-muted">· العائلة</span>
          </Title>
        </header>

        {streakHearth}
        {profileSwitcher}

        {/* Hero (needs this week) + secondary board — side-by-side on wide screens. */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">{focusSection}</div>
          <div className="lg:col-span-5">{boardSection}</div>
        </div>
      </div>
    </ScreenShell>
  );
}
