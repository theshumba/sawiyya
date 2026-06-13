// Settings — language, handedness, goal, profile name, camera permission +
// reset-training, transparency / privacy links, profiles (PRD §6.10).
// Version line / logo ×5 opens hidden dev metrics (§15).
// Rebuilt to Google Stitch v2 (settings--mobile / settings--desktop).
import { useEffect, useRef, useState } from "react";
import { num, pick, t } from "../i18n";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { clearClass, trainedClassIds } from "../recognizer/knn";
import type { DailyGoal, Hand, Lang } from "../types";
import { Icon, Logo, Wordmark } from "../components/ui";

// Chunky extruded card matching Stitch `.extruded-card` / `.card-chunky`.
function ChunkyCard({
  children,
  className = "",
  tone = "paper",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "paper" | "teal" | "white";
}) {
  const base =
    tone === "teal"
      ? "bg-teal/5 border-2 border-teal/20"
      : tone === "white"
        ? "bg-white border-2 border-ink/5 shadow-[0_6px_0_0_#D9D2C7]"
        : "bg-paper border-2 border-ink/5 shadow-[0_6px_0_0_#D9D2C7]";
  return <section className={`rounded-3xl ${base} ${className}`}>{children}</section>;
}

function SectionTitle({ icon, children, tone = "teal" }: { icon: string; children: React.ReactNode; tone?: "teal" | "gold" }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold md:text-xl">
      <Icon name={icon} fill={tone === "gold"} className={tone === "gold" ? "text-gold" : "text-teal"} />
      {children}
    </h2>
  );
}

export function Settings() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const [camState, setCamState] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const taps = useRef(0);

  useEffect(() => {
    let cancelled = false;
    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((res) => {
        if (!cancelled) setCamState(res.state);
      })
      .catch(() => setCamState(null));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!profile) return null;
  const lang = profile.language;

  const set = (patch: Partial<{ language: Lang; dominantHand: Hand; dailyGoal: DailyGoal; displayName: string }>) =>
    app.updateProfile(profile.id, patch);

  // Live wiring: wipe this device's on-device handshape training (recognizer/knn).
  const resetTraining = () => {
    const ids = trainedClassIds();
    ids.forEach((id) => clearClass(id));
    setResetMsg(pick(lang, `Cleared ${ids.length} trained sign(s)`, `تم مسح ${ids.length} إشارة مدرّبة`));
    window.setTimeout(() => setResetMsg(null), 3000);
  };

  const bump = () => {
    taps.current += 1;
    if (taps.current >= 5) {
      taps.current = 0;
      go({ name: "devMetrics" });
    }
  };

  const langLabel = pick(lang, "Language · اللغة", "اللغة · Language");
  const handLabel = pick(lang, "Signing hand · يد الإشارة", "يد الإشارة · Signing hand");
  const goalLabel = pick(lang, "Daily goal · الهدف اليومي", "الهدف اليومي · Daily goal");
  const profileLabel = pick(lang, "Your profile · ملفك الشخصي", "ملفك الشخصي · Your profile");
  const cameraLabel = pick(lang, "Your camera · كاميرتك", "كاميرتك · Your camera");
  const helpLabel = pick(lang, "Help · مساعدة", "مساعدة · Help");
  const contactLabel = pick(lang, "Contact support", "تواصل مع الدعم");
  const manualLabel = pick(lang, "Manual & signs library", "الدليل ومكتبة الإشارات");
  const proTipLabel = pick(
    lang,
    "Pro-tip: Use a plain background and good lighting for the fastest learning!",
    "نصيحة: استخدم خلفية بسيطة وإضاءة جيدة لتعلّم أسرع!",
  );

  // ----- shared controls -----------------------------------------------------

  const LanguageToggle = (
    <div className="flex gap-2 rounded-2xl border-2 border-ink/5 bg-ink/5 p-1.5">
      {([
        { v: "en" as Lang, label: "English" },
        { v: "ar" as Lang, label: "العربية" },
      ]).map((o) => {
        const on = lang === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => set({ language: o.v })}
            aria-pressed={on}
            className={`flex-1 rounded-xl py-3.5 text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 ${
              on ? "bg-teal text-paper shadow-inner" : "text-teal/60 hover:bg-teal/5"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  const HandCards = (
    <div className="grid grid-cols-2 gap-4">
      {([
        { v: "R" as Hand, en: "Right", ar: "اليمين", flip: false },
        { v: "L" as Hand, en: "Left", ar: "اليسار", flip: true },
      ]).map((o) => {
        const on = profile.dominantHand === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => set({ dominantHand: o.v })}
            aria-pressed={on}
            className={`flex flex-col items-center gap-3 rounded-3xl p-5 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 ${
              on
                ? "border-2 border-teal bg-teal/5 shadow-[0_6px_0_0_#D9D2C7] ring-4 ring-teal/10"
                : "border-2 border-ink/10 bg-white hover:border-teal/40"
            }`}
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${
                on ? "border-4 border-teal bg-white shadow-soft" : "border-2 border-ink/5 bg-white"
              } ${o.flip ? "scale-x-[-1]" : ""}`}
            >
              <Icon name="back_hand" fill={on} className={`text-4xl ${on ? "text-teal" : "text-ink/40"}`} />
            </div>
            <div className="text-center leading-tight">
              <p className={`font-bold ${on ? "text-teal" : "text-ink/60"}`}>{o.en}</p>
              <p className={`text-sm ${on ? "text-teal" : "text-ink/40"}`}>{o.ar}</p>
            </div>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border-4 ${
                on ? "border-teal bg-teal" : "border-ink/15"
              }`}
              aria-hidden="true"
            >
              {on && <Icon name="check" className="text-[14px] font-bold text-paper" />}
            </span>
          </button>
        );
      })}
    </div>
  );

  const goalOptions: { v: DailyGoal; en: string; ar: string; min: string }[] = [
    { v: "casual", en: "Casual", ar: "هادئ", min: "3 min" },
    { v: "regular", en: "Regular", ar: "منتظم", min: "7 min" },
    { v: "serious", en: "Serious", ar: "جاد", min: "15 min" },
  ];

  const GoalList = (
    <div className="space-y-3">
      {goalOptions.map((o) => {
        const on = profile.dailyGoal === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => set({ dailyGoal: o.v })}
            aria-pressed={on}
            className={`flex w-full items-center justify-between rounded-2xl p-4 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40 ${
              on
                ? "border-2 border-gold bg-gold/5 shadow-[0_6px_0_0_#D9D2C7]"
                : "border-2 border-ink/5 bg-paper hover:border-gold/50"
            }`}
          >
            <span className="flex items-center gap-3 font-bold text-ink">
              {on && <Icon name="stars" fill className="text-gold" />}
              {o.en} · {o.ar}
            </span>
            <span
              className={`rounded-lg px-3 py-1 text-sm font-bold ${
                on ? "bg-gold text-ink" : "bg-sand text-ink"
              }`}
            >
              {o.min}
            </span>
          </button>
        );
      })}
    </div>
  );

  const NameField = (
    <div>
      <label htmlFor="set-name" className="mb-2 block px-1 text-xs font-bold uppercase tracking-wider text-teal/60">
        {pick(lang, "Your name · اسمك", "اسمك · Your name")}
      </label>
      <input
        id="set-name"
        type="text"
        value={profile.displayName}
        onChange={(e) => set({ displayName: e.target.value })}
        placeholder={pick(lang, "Hamad Al-Thani", "حمد آل ثاني")}
        className="w-full rounded-2xl border-2 border-ink/5 bg-sand/40 px-6 py-4 text-xl font-bold text-teal transition-all placeholder:text-teal/20 focus:border-teal/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
      />
    </div>
  );

  // Camera card — Stitch desktop is a centered hero (big circle, intro copy,
  // secondary reset button, AI/Privacy links, Pro-tip callout). Mobile keeps the
  // live permission status + transparency/profile link rows.
  const CameraCard = (
    <div className="relative overflow-hidden rounded-3xl border-2 border-teal/20 bg-teal/5 p-6 md:flex md:flex-col md:items-center md:p-8 md:text-center">
      <Icon
        name="videocam"
        className="pointer-events-none absolute -right-4 -top-4 text-[120px] text-teal opacity-10 md:hidden"
      />
      <div className="mb-6 hidden h-32 w-32 items-center justify-center rounded-full bg-teal shadow-lift md:flex">
        <Icon name="videocam" fill className="text-6xl text-white" />
      </div>
      <div className="relative z-10 w-full">
        <h2 className="mb-2 font-display text-xl font-bold text-teal md:mb-3 md:text-2xl">{cameraLabel}</h2>
        <p className="mb-6 text-sm font-medium leading-relaxed text-teal/70 md:mb-8 md:px-4 md:text-lg md:text-ink/80">
          {pick(
            lang,
            "The camera learns YOUR hands — erase and re-teach anytime.",
            "تتعلم الكاميرا حركات يديك — يمكنك مسح التدريب وإعادته في أي وقت.",
          )}
        </p>

        {/* Reset: solid extruded teal on mobile, lighter secondary on desktop */}
        <button
          type="button"
          onClick={resetTraining}
          className="extruded-teal mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-4 font-display font-bold text-paper transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 md:hidden"
        >
          <Icon name="restart_alt" />
          {pick(lang, "Reset camera training", "إعادة ضبط الكاميرا")}
        </button>
        <button
          type="button"
          onClick={resetTraining}
          className="mb-2 hidden w-full items-center justify-center gap-2 rounded-2xl border-2 border-teal/10 bg-teal/10 py-4 font-display font-bold text-teal shadow-[0_4px_0_0_#cfdbda] transition active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 md:flex md:mb-6"
        >
          <Icon name="restart_alt" />
          {pick(lang, "Reset camera training", "إعادة ضبط الكاميرا")}
        </button>
        <p className="mb-4 h-5 text-center text-xs font-semibold text-coral md:mb-2" role="status" aria-live="polite">
          {resetMsg}
        </p>

        {/* Mobile-only: live permission status + transparency / profile rows */}
        <div className="space-y-4 border-t-2 border-teal/10 pt-4 md:hidden">
          <Row label={t("setCameraPermission", lang)}>
            <span className={`text-sm font-bold ${camState === "granted" ? "text-teal" : "text-muted"}`}>
              {camState === "granted" ? `✓ ${t("setGranted", lang)}` : t("setNotGranted", lang)}
            </span>
          </Row>
          <LinkRow icon="info" label={t("setAi", lang)} onClick={() => go({ name: "aiTransparency" })} />
          <LinkRow icon="verified_user" label={t("setPrivacy", lang)} onClick={() => go({ name: "privacy" })} />
          <LinkRow icon="group" label={t("setProfiles", lang)} onClick={() => go({ name: "family" })} />
        </div>

        {/* Desktop-only: centered AI/Privacy links + Pro-tip callout */}
        <div className="hidden w-full flex-col gap-3 md:flex">
          <button
            type="button"
            onClick={() => go({ name: "aiTransparency" })}
            className="flex items-center justify-center gap-2 font-bold text-teal hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
          >
            <Icon name="info" className="text-sm" />
            {t("setAi", lang)}
          </button>
          <button
            type="button"
            onClick={() => go({ name: "privacy" })}
            className="flex items-center justify-center gap-2 font-bold text-teal hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
          >
            <Icon name="verified_user" className="text-sm" />
            {t("setPrivacy", lang)}
          </button>
        </div>
        <div className="mt-8 hidden w-full border-t-2 border-teal/10 pt-8 md:block">
          <div className="flex items-start gap-4 rounded-2xl bg-white/50 p-4 text-start">
            <Icon name="tips_and_updates" className="text-coral" />
            <p className="text-sm font-medium text-ink/70">{proTipLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop-only: Help · مساعدة card (Contact support + Manual & Signs Library).
  const HelpCard = (
    <ChunkyCard tone="white" className="hidden p-6 md:block">
      <h2 className="mb-4 font-display text-lg font-bold md:text-xl">{helpLabel}</h2>
      <div className="space-y-4">
        <HelpRow icon="contact_support" label={contactLabel} onClick={() => go({ name: "family" })} />
        <HelpRow icon="description" label={manualLabel} onClick={() => go({ name: "allSigns" })} />
      </div>
    </ChunkyCard>
  );

  // Mobile footer (centered logo + version + tagline, dev-metrics tap target).
  const MobileFooter = (
    <footer className="flex w-full flex-col items-center gap-3 py-10 text-center opacity-70">
      <button
        type="button"
        onClick={bump}
        aria-label="Sawiyya v1.0"
        className="flex flex-col items-center gap-2 rounded-2xl p-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
      >
        <Logo size={32} />
        <p className="text-sm font-medium text-ink">
          {pick(lang, "Sawiyya · v1.0 · سويّة", "سويّة · Sawiyya · v1.0")}
          <br />
          {pick(lang, "Together as Equals", "معاً على قدم المساواة")}
        </p>
      </button>
    </footer>
  );

  // Desktop footer — horizontal bar (logo left; links + copyright right).
  const DesktopFooter = (
    <footer className="mt-auto hidden items-center justify-between border-t-2 border-teal/10 bg-sand px-12 py-8 md:flex">
      <button
        type="button"
        onClick={bump}
        aria-label="Sawiyya v1.0"
        className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal p-1">
          <Logo size={18} />
        </span>
        <span className="text-sm font-bold text-teal">{pick(lang, "Sawiyya v1.0 · سويّة", "سويّة · Sawiyya v1.0")}</span>
      </button>
      <div className="flex items-center gap-8">
        <button
          type="button"
          onClick={() => go({ name: "privacy" })}
          className="text-sm font-medium text-ink/40 transition-colors hover:text-coral focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
        >
          {pick(lang, "Privacy Policy", "سياسة الخصوصية")}
        </button>
        <button
          type="button"
          onClick={() => go({ name: "privacy" })}
          className="text-sm font-medium text-ink/40 transition-colors hover:text-coral focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
        >
          {pick(lang, "Terms of Service", "شروط الخدمة")}
        </button>
        <button
          type="button"
          onClick={() => go({ name: "aiTransparency" })}
          className="text-sm font-medium text-ink/40 transition-colors hover:text-coral focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
        >
          {pick(lang, "Mada Innovation", "ابتكار مدى")}
        </button>
      </div>
      <p className="text-xs text-ink/40">
        {pick(lang, "© 2024 Sawiyya. Teaching signs, growing families.", "© 2024 سويّة. نُعلّم الإشارات، نُقرّب العائلات.")}
      </p>
    </footer>
  );

  // ----- layout --------------------------------------------------------------

  return (
    <div className="min-h-screen bg-sand md:flex">
      {/* ───────── Desktop left side-nav rail (Stitch desktop) ───────── */}
      <aside className="sticky top-0 z-50 hidden h-screen w-64 shrink-0 flex-col border-e-4 border-teal/20 bg-sand p-6 md:flex">
        <div className="mb-10 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal shadow-soft">
            <Logo size={30} />
          </span>
          <div>
            <Wordmark className="font-display text-2xl leading-tight text-teal" />
            <p className="font-display text-sm font-bold tracking-[0.3em] text-teal" dir="rtl">
              سويّة
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <SideNavItem icon="home" label={t("navHome", lang)} onClick={() => go({ name: "home" })} />
          <SideNavItem icon="videocam" label={t("navCamera", lang)} onClick={() => go({ name: "camera" })} />
          <SideNavItem icon="diversity_3" label={t("navFamily", lang)} onClick={() => go({ name: "family" })} />
          <SideNavItem icon="bar_chart" label={t("navProgress", lang)} onClick={() => go({ name: "progress" })} />
          <SideNavItem icon="settings" label={t("setTitle", lang)} active />
        </nav>
        <p className="mt-auto px-2 text-xs font-medium text-ink/40">© 2024 Sawiyya</p>
      </aside>

      {/* ───────── Main content column ───────── */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top app bar (mobile) / header band (desktop) */}
        <header className="rounded-b-bowl border-b-4 border-teal-deep bg-teal px-6 py-5 text-paper shadow-lift md:rounded-none md:border-b-0 md:px-12 md:py-8 md:shadow-none">
          <div className="mx-auto flex max-w-6xl items-center justify-between md:max-w-none">
            <div className="flex items-center gap-3 md:gap-4">
              <Icon name="settings" fill className="text-3xl md:text-4xl" />
              <h1 className="font-display text-xl font-bold uppercase tracking-wider md:text-3xl md:normal-case md:tracking-normal">
                {t("setTitle", lang)} · الإعدادات
              </h1>
            </div>

            {/* Mobile: close button */}
            <button
              type="button"
              onClick={() => go({ name: "home" })}
              aria-label={t("back", lang)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-paper/20 transition hover:bg-paper/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paper/40 md:hidden"
            >
              <Icon name="close" />
            </button>

            {/* Desktop: XP pill + notifications + avatar */}
            <div className="hidden items-center gap-4 md:flex">
              <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
                <Icon name="stars" fill className="text-gold" />
                <span className="font-bold">
                  {num(profile.xp, lang)} {t("xp", lang)}
                </span>
              </span>
              <button
                type="button"
                aria-label={pick(lang, "Notifications", "الإشعارات")}
                className="flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paper/40"
              >
                <Icon name="notifications" className="text-3xl" />
              </button>
              <div className="h-12 w-12 rounded-2xl bg-gold p-0.5 shadow-md">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-teal-deep text-paper">
                  <span className="font-display text-lg font-bold leading-none">
                    {(profile.displayName?.trim()?.[0] ?? "S").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-12 md:pb-12 md:pt-10">
          {/* Desktop: two-column grid; mobile: single column stack */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {/* Column 1 */}
            <div className="space-y-6 md:space-y-8">
              <ChunkyCard className="p-5 md:p-6">
                <SectionTitle icon="person">{profileLabel}</SectionTitle>
                {NameField}
              </ChunkyCard>

              <ChunkyCard className="p-5 md:p-6">
                <SectionTitle icon="translate">{langLabel}</SectionTitle>
                {LanguageToggle}
              </ChunkyCard>

              <ChunkyCard className="p-5 md:p-6">
                <SectionTitle icon="front_hand">{handLabel}</SectionTitle>
                {HandCards}
              </ChunkyCard>

              <ChunkyCard className="p-5 md:p-6">
                <SectionTitle icon="bolt" tone="gold">{goalLabel}</SectionTitle>
                {GoalList}
              </ChunkyCard>
            </div>

            {/* Column 2 */}
            <div className="space-y-6 md:space-y-8">
              {CameraCard}
              {HelpCard}
            </div>
          </div>

          {/* Mobile footer */}
          <div className="md:hidden">{MobileFooter}</div>
        </div>

        {/* Desktop footer bar */}
        {DesktopFooter}
      </main>
    </div>
  );
}

// Label + value row (camera permission, mobile).
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-bold text-teal">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

// Chevron link row inside the mobile camera card.
function LinkRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-2 text-start focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
    >
      <span className="flex items-center gap-2 font-bold text-teal transition-colors group-hover:text-coral">
        <Icon name={icon} className="text-base text-teal/60" />
        {label}
      </span>
      <Icon
        name="chevron_right"
        className="text-teal/40 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
      />
    </button>
  );
}

// Help row (desktop Help · مساعدة card).
function HelpRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-ink/5 bg-sand/30 p-4 text-start transition-colors hover:bg-sand/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
    >
      <span className="flex items-center gap-4 font-bold text-ink">
        <Icon name={icon} className="text-teal" />
        {label}
      </span>
      <Icon name="chevron_right" className="text-ink/30 rtl:rotate-180" />
    </button>
  );
}

// Desktop left side-nav item — gold active pill (Stitch `.nav-item-active`).
function SideNavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center gap-4 rounded-full px-4 py-3 text-start transition active:translate-y-0.5 ${
        active
          ? "bg-gold text-ink shadow-[0_4px_0_0_#b88a30]"
          : "text-ink/70 hover:bg-teal/10 hover:text-teal"
      }`}
    >
      <Icon name={icon} fill={active} className="!text-2xl" />
      <span className="font-display text-sm font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
