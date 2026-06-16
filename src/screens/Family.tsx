// Family Mode — the structural inverse of "fix the Deaf person" (PRD §6.7).
// The Deaf member flags signs; the household's queues follow them.
// Visual target: Stitch v2 "Our Majlis" (our-majlis-family-space--mobile,
// family-our-majlis--desktop). Mobile-first, desktop at md:.
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
import { Button, Card, Icon, Logo, Pill, Wordmark } from "../components/ui";

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

// Chunky card border from the Stitch design ("card-chunky": 3px teal/15).
const CHUNKY = "border-[3px] border-teal/15";

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

  // ---- shared sub-blocks (mobile + desktop reuse) ----------------------

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

  // The large coral "Flag signs we need" button is the primary household action
  // in the Stitch target — shown to every member, not gated on role === "deaf"
  // (it routes everyone to the same flag picker; the deaf member's flags lead).
  const flagButton = (
    <Button
      variant="primary"
      full
      className="!rounded-3xl !py-5 md:!py-6 md:!text-xl flex items-center justify-center gap-3"
      onClick={() => go({ name: "flagPicker" })}
    >
      <Icon name="flag" fill />
      {t("famFlagTitle", lang)}
    </Button>
  );

  // "Layla needs this week" — flagged-sign cards (live data, styled to Stitch:
  // "blobby" white card, framed sign thumbnail, coral pin, gloss + Arabic line).
  const needCards = flags.length > 0 && (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      {flags.slice(0, 6).map((f) => {
        const sign = signById(f.signId);
        if (!sign) return null;
        return (
          <div
            key={f.id}
            className={`group relative rounded-2xl bg-paper p-2 md:p-3 ${CHUNKY} border-b-[6px] border-b-sand transition-transform hover:-translate-y-1`}
          >
            <span className="absolute end-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-white shadow-coral" aria-hidden="true">
              <Icon name="push_pin" fill className="text-base" />
            </span>
            {/* Framed sign thumbnail — emoji is the honest content-layer placeholder. */}
            <span className="mb-2 flex aspect-square w-full items-center justify-center rounded-2xl bg-sand text-4xl md:text-5xl" aria-hidden="true">
              {sign.type === "alphabet" ? sign.code : sign.emoji}
            </span>
            <div className="px-1 pb-1 text-center">
              <p className="font-display text-sm font-bold text-teal-deep md:text-lg">
                {pick(lang, sign.glossEn, sign.glossAr)}
              </p>
              {/* Secondary script line (the non-picked gloss), per Stitch sign cards. */}
              <p className="font-sans text-xs font-medium text-ink/40" dir={lang === "en" ? "rtl" : "ltr"}>
                {lang === "en" ? sign.glossAr : sign.glossEn}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Household streak "hearth" — illustration + live numbers + member avatars.
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
    <section className="relative">
      <div className={`relative overflow-hidden rounded-3xl bg-paper p-8 ${CHUNKY}`}>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="h-40 w-40 motion-safe:animate-rise" style={{ filter: "drop-shadow(0 0 12px rgba(230,178,76,.4))" }}>
            <img src="/brand/stitch-43.png" alt="" className="h-full w-full object-contain" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-teal">
              {t("famSharedStreak", lang)}
            </p>
            <h2 className="font-display text-5xl font-extrabold text-teal">{num(sharedStreak, lang)}</h2>
            <p className="font-display text-lg font-bold text-teal-deep">
              {num(activeToday, lang)} / {num(app.profiles.length, lang)} {t("famSignedToday", lang)}
            </p>
          </div>
          {memberAvatars}
        </div>
      </div>
      <div className="absolute -right-2 -top-4 text-gold motion-safe:animate-pulse-ring" aria-hidden="true">
        <Icon name="auto_awesome" fill className="text-4xl" />
      </div>
    </section>
  );

  // Family-members profile switcher (horizontal scroll, chunky tiles).
  const profileSwitcher = (
    <section className="space-y-4">
      <h3 className="px-1 font-display text-xl font-bold">{t("famHousehold", lang)}</h3>
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
              className="group flex flex-shrink-0 flex-col items-center gap-2 transition active:scale-95"
            >
              <div
                className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-paper text-3xl transition-all ${
                  isActive ? "ring-4 ring-teal" : CHUNKY
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
                className={`flex items-center gap-1 font-display text-xs font-bold uppercase tracking-widest ${
                  isActive ? "text-teal" : "text-ink"
                }`}
              >
                {p.displayName}
                {signedToday && <span className="text-teal" aria-hidden="true">✓</span>}
              </span>
            </button>
          );
        })}

        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="group flex flex-shrink-0 flex-col items-center gap-2"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-dashed border-teal/20 text-teal/40 transition-colors group-hover:border-teal/40">
              <Icon name="add" />
            </span>
            <span className="font-display text-xs font-bold uppercase tracking-widest text-ink/40">
              {t("famAdd", lang)}
            </span>
          </button>
        )}
      </div>

      {adding && (
        <Card className={`flex flex-col gap-3 p-4 ${CHUNKY}`}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("famName", lang)}
            maxLength={20}
            className="rounded-xl border-2 border-line bg-sand px-4 py-3 font-semibold placeholder:text-muted/60 focus:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
          />
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setNewRole(r.value)}
                aria-pressed={newRole === r.value}
                className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition ${
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
  );

  // "Needs this week" focus section (deaf member flags → everyone's queue).
  const focusSection = (
    <section className="space-y-5">
      <div className="space-y-1 px-1">
        <span className="inline-block rounded-full bg-coral px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-paper">
          {t("homeFlagged", lang)}
        </span>
        <h3 className="flex items-center gap-2 font-display text-2xl font-bold text-coral">
          {flagger ? (
            <span>
              <bdi>{flagger.displayName}</bdi> {t("famFlagged", lang)}
            </span>
          ) : (
            t("famFlagTitle", lang)
          )}
          <Icon name="flag" className="text-xl" />
        </h3>
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
      {flagButton}
    </section>
  );

  // Live honeycomb mosaic — one hex per mastered sign, fading empty cells up to
  // the next milestone tier. Cell count tracks board.length (not a static PNG).
  const HEX = "[clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0%_50%)]";
  const honeycombCells = Math.max(milestoneTarget, board.length);
  const liveHoneycomb = (
    <div className="grid grid-cols-5 gap-1.5 md:grid-cols-6">
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

  const milestonePill = (
    <div className="flex items-center justify-between gap-3 rounded-3xl border-2 border-gold/30 bg-white/80 p-4">
      <div className="flex items-center gap-3 text-start">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/20 text-gold">
          <Icon name="emoji_events" fill />
        </span>
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-ink/40">
            {pick(lang, "New Milestone", "إنجاز جديد")}
          </p>
          <p className="font-display font-bold text-teal">
            {pick(lang, `${milestoneTarget} Combined Signs!`, `${num(milestoneTarget, lang)} إشارة مشتركة!`)}
          </p>
        </div>
      </div>
      <Icon name="arrow_forward_ios" className="text-gold" />
    </div>
  );

  const growCard = (
    <button
      type="button"
      onClick={() => go({ name: "flagPicker" })}
      className="group flex flex-col items-center justify-center gap-2 rounded-[28px] border-4 border-dashed border-teal/20 bg-paper p-6 transition-colors hover:border-teal/40"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 text-teal transition-transform group-hover:scale-110">
        <Icon name="add" />
      </span>
      <span className="font-display font-bold text-teal/60">
        {pick(lang, "Grow the mosaic", "وسّع الفسيفساء")}
      </span>
    </button>
  );

  // "Signs we can all do" — live honeycomb mosaic + milestone progress.
  const boardSection = (
    <section className="space-y-5">
      <h3 className="px-1 font-display text-xl font-bold">{t("famBoard", lang)}</h3>
      <div className={`overflow-hidden rounded-3xl bg-teal/5 p-6 md:p-8 ${CHUNKY}`}>
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
              <p className="font-display text-[10px] font-bold uppercase tracking-widest text-teal-deep">
                {num(Math.round(boardPct * 100), lang)}%{" "}
                {pick(lang, `to Family Milestone (${milestoneTarget})`, `إلى إنجاز الأسرة (${num(milestoneTarget, lang)})`)}
              </p>
            </div>
            {/* Desktop-only Stitch flourishes: milestone pill + add-card. */}
            <div className="mt-6 hidden flex-col gap-4 md:flex">
              {milestonePill}
              {growCard}
            </div>
          </>
        )}
      </div>
    </section>
  );

  // ---- DESKTOP APP-SHELL (md+ only) -----------------------------------
  // The Stitch desktop target is a dashboard-with-rail, not a stretched mobile
  // page. App.tsx still renders the mobile BottomNav (fixed, hidden md:), so the
  // rail/top-bar below are md:-only and the mobile nav is suppressed at md: by
  // BottomNav itself is not — we simply pad desktop content past the 18rem rail.
  const navItems: { name: "home" | "camera" | "family" | "progress"; icon: string; label: string }[] = [
    { name: "home", icon: "home", label: t("navHome", lang) },
    { name: "camera", icon: "photo_camera", label: t("navCamera", lang) },
    { name: "family", icon: "favorite", label: t("navFamily", lang) },
    { name: "progress", icon: "analytics", label: t("navProgress", lang) },
  ];

  const deskRail = (
    <nav
      className="fixed start-0 top-0 z-40 hidden h-screen w-72 flex-col rounded-e-xl border-e-4 border-teal-deep bg-teal px-4 py-8 shadow-lift md:flex"
      aria-label="Main"
    >
      <div className="mb-10 flex items-center gap-3 px-4">
        <span className="rounded-xl bg-paper p-2">
          <Logo size={28} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-paper">
            <Wordmark />
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-paper/60">
            {pick(lang, "Our Majlis", "مجلسنا")}
          </p>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        {navItems.map((item) => {
          const isActive = item.name === "family";
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => go({ name: item.name })}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl p-4 font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper active:translate-y-1 ${
                isActive
                  ? "bg-paper text-teal shadow-[4px_4px_0_0_#0A4F4C] active:shadow-none"
                  : "text-paper/80 hover:bg-teal-deep/50 hover:text-paper"
              }`}
            >
              <Icon name={item.icon} fill={isActive} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto px-1">
        <Button
          variant="primary"
          full
          className="flex items-center justify-center gap-2 !rounded-2xl"
          onClick={() => go({ name: "camera" })}
        >
          <Icon name="play_circle" />
          {pick(lang, "Practice Now", "تدرّب الآن")}
        </Button>
      </div>
    </nav>
  );

  const deskTopBar = (
    <header className="hidden items-center justify-between border-b-4 border-sand bg-paper px-8 py-4 md:flex">
      <div className="flex items-center gap-6">
        <h2 className="font-display text-3xl font-bold text-teal">
          {t("famTitle", lang)} <span className="mx-2 font-normal opacity-40">·</span>
          <span className="font-normal">العائلة</span>
        </h2>
        <div className="flex items-center gap-3 rounded-full border-2 border-teal/10 bg-teal/5 px-4 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-xl" aria-hidden="true">🔥</span>
          <div className="leading-none">
            <p className="text-xs font-bold uppercase tracking-tighter text-teal/60">
              {t("famSharedStreak", lang)}
            </p>
            <p className="text-sm font-bold text-teal">
              {num(activeToday, lang)}/{num(app.profiles.length, lang)} {t("famSignedToday", lang)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {memberAvatars}
        <button
          type="button"
          onClick={() => app.profiles[0] && app.switchProfile(app.profiles[0].id)}
          className="flex items-center gap-2 rounded-xl bg-teal/10 px-4 py-2 font-bold text-teal transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <Icon name="sync_alt" />
          <span>{t("famSwitch", lang)}</span>
        </button>
        <div className="flex gap-2 text-ink/60">
          <span className="p-2" aria-hidden="true"><Icon name="local_fire_department" /></span>
          <span className="p-2" aria-hidden="true"><Icon name="notifications" /></span>
        </div>
      </div>
    </header>
  );

  const partyFab = (
    <button
      type="button"
      onClick={() => go({ name: "progress" })}
      className="fixed bottom-10 end-10 z-40 hidden items-center gap-3 rounded-full bg-gold px-5 py-4 font-display font-bold text-ink shadow-gold extruded-teal transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal md:flex"
    >
      <Icon name="celebration" fill className="text-3xl" />
      <span>{pick(lang, "Majlis Party Mode", "وضع احتفال المجلس")}</span>
    </button>
  );

  return (
    <>
      {deskRail}
      {partyFab}
      <div className="md:ps-72">
        {deskTopBar}

        {/* Mobile header (rail/top-bar replace this at md:) */}
        <h1 className="mb-6 px-5 pt-6 font-display text-2xl font-bold md:hidden">
          {t("famTitle", lang)} <span className="text-muted">· العائلة</span>
        </h1>

        {/* ---- MOBILE / single-column (base) ---- */}
        <div className="mx-auto max-w-md space-y-10 px-5 pb-28 md:hidden">
          {streakHearth}
          {profileSwitcher}
          {focusSection}
          {boardSection}
        </div>

        {/* ---- DESKTOP / dashboard content (md+) ---- */}
        <div className="hidden p-8 md:block">
          <div className="mb-10">{profileSwitcher}</div>
          <div className="grid grid-cols-12 items-start gap-8">
            <div className="col-span-12 space-y-6 lg:col-span-7">{focusSection}</div>
            <div className="col-span-12 lg:col-span-5">{boardSection}</div>
          </div>
        </div>
      </div>
    </>
  );
}
