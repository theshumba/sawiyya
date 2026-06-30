// Settings — language, handedness, goal, profile name, camera permission +
// reset-training, transparency / privacy links, profiles (PRD §6.10).
// Version line / logo ×5 opens hidden dev metrics (§15).
// Redesign: chrome="takeover" (shell owns nav). One responsive layout grouped
// into Account / Preferences / Camera & Privacy / About. Reset-training is
// window.confirm-guarded, demoted to a secondary danger control, success toast.
import { useEffect, useRef, useState } from "react";
import { pick, t } from "../i18n";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { clearClass, trainedClassIds } from "../recognizer/knn";
import type { DailyGoal, Hand, Lang } from "../types";
import { Body, Caption, Eyebrow, Icon, Logo } from "../components/ui";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";

// Grouped settings section — paper card with chunky edge (shadow-chunky token).
function Group({
  icon,
  title,
  tone = "teal",
  children,
}: {
  icon: string;
  title: string;
  tone?: "teal" | "gold";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border-2 border-ink/5 bg-paper p-5 shadow-chunky md:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold md:text-xl">
        <Icon name={icon} fill={tone === "gold"} className={tone === "gold" ? "text-gold" : "text-teal"} />
        {title}
      </h2>
      {children}
    </section>
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

  if (!profile) return <NoProfileFallback />;
  const lang = profile.language;

  const set = (patch: Partial<{ language: Lang; dominantHand: Hand; dailyGoal: DailyGoal; displayName: string }>) =>
    app.updateProfile(profile.id, patch);

  // Live wiring: wipe this device's on-device handshape training (recognizer/knn).
  // Irreversible → confirm dialog first (spec §5.10).
  const resetTraining = () => {
    const ids = trainedClassIds();
    const ok = window.confirm(
      pick(
        lang,
        "Erase all camera training on this device? This cannot be undone.",
        "مسح كل تدريب الكاميرا على هذا الجهاز؟ لا يمكن التراجع عن هذا.",
      ),
    );
    if (!ok) return;
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

  // ----- shared controls -----------------------------------------------------

  const NameField = (
    <div>
      <label htmlFor="set-name" className="mb-2 block px-1 text-xs font-bold uppercase tracking-wider text-teal/60">
        {pick(lang, "Your name", "اسمك")}
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
            className={`relative flex flex-col items-center gap-3 rounded-3xl p-5 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 ${
              on
                ? "border-2 border-teal bg-teal/5 shadow-chunky ring-4 ring-teal/10"
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
              <p className={`font-bold ${on ? "text-teal" : "text-ink/60"}`}>{pick(lang, o.en, o.ar)}</p>
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
                ? "border-2 border-gold bg-gold/5 shadow-chunky"
                : "border-2 border-ink/5 bg-paper hover:border-gold/50"
            }`}
          >
            <span className="flex items-center gap-3 font-bold text-ink">
              {on && <Icon name="stars" fill className="text-gold" />}
              {pick(lang, o.en, o.ar)}
            </span>
            <span className={`rounded-lg px-3 py-1 text-sm font-bold ${on ? "bg-gold text-ink" : "bg-sand text-ink"}`}>
              {o.min}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ----- layout (one responsive tree; shell owns chrome) ---------------------

  return (
    <ScreenShell
      lang={lang}
      chrome="takeover"
      title={pick(lang, `${t("setTitle", "en")} · الإعدادات`, t("setTitle", "ar"))}
      onClose={() => go({ name: "home" })}
    >
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-16 pt-6 md:px-8 md:pt-8">
        {/* ── Account ───────────────────────────────────────────────── */}
        <Group icon="person" title={pick(lang, "Account", "الحساب")}>
          <div className="space-y-4">
            {NameField}
            <LinkRow
              icon="group"
              label={t("setProfiles", lang)}
              onClick={() => go({ name: "family" })}
            />
          </div>
        </Group>

        {/* ── Preferences ──────────────────────────────────────────── */}
        <Group icon="tune" title={pick(lang, "Preferences", "التفضيلات")}>
          <div className="space-y-6">
            <div>
              <Eyebrow lang={lang} className="mb-2 px-1">
                {pick(lang, "Language", "اللغة")}
              </Eyebrow>
              {LanguageToggle}
            </div>
            <div>
              <Eyebrow lang={lang} className="mb-2 px-1">
                {pick(lang, "Signing hand", "يد الإشارة")}
              </Eyebrow>
              {HandCards}
            </div>
            <div>
              <Eyebrow lang={lang} className="mb-2 px-1">
                {pick(lang, "Daily goal", "الهدف اليومي")}
              </Eyebrow>
              {GoalList}
            </div>
          </div>
        </Group>

        {/* ── Camera & Privacy ─────────────────────────────────────── */}
        <Group icon="videocam" title={pick(lang, "Camera & privacy", "الكاميرا والخصوصية")}>
          <div className="space-y-4">
            <Body className="!text-teal/80">
              {pick(
                lang,
                "The camera learns YOUR hands — erase and re-teach anytime.",
                "تتعلم الكاميرا حركات يديك — يمكنك مسح التدريب وإعادته في أي وقت.",
              )}
            </Body>

            {/* Live permission status. When not yet granted, offer a direct route
                into camera practice — that's where the real getUserMedia prompt
                fires (the browser won't grant from a passive settings row). */}
            <Row label={t("setCameraPermission", lang)}>
              {camState === "granted" ? (
                <span className="text-sm font-bold text-teal">✓ {t("setGranted", lang)}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => go({ name: "camera" })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal/10 px-3 py-1.5 text-sm font-bold text-teal transition hover:bg-teal/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                >
                  <Icon name="videocam" className="text-base" />
                  {t("setNotGranted", lang)}
                </button>
              )}
            </Row>

            {/* Transparency / privacy links */}
            <div className="space-y-3 border-t-2 border-teal/10 pt-4">
              <LinkRow icon="info" label={t("setAi", lang)} onClick={() => go({ name: "aiTransparency" })} />
              <LinkRow icon="verified_user" label={t("setPrivacy", lang)} onClick={() => go({ name: "privacy" })} />
            </div>

            {/* Pro-tip callout */}
            <div className="flex items-start gap-3 rounded-2xl bg-teal/5 p-4 text-start">
              <Icon name="tips_and_updates" className="text-coral" />
              <p className="text-sm font-medium text-ink/70">
                {pick(
                  lang,
                  "Pro-tip: Use a plain background and good lighting for the fastest learning!",
                  "نصيحة: استخدم خلفية بسيطة وإضاءة جيدة لتعلّم أسرع!",
                )}
              </p>
            </div>

            {/* Danger zone — secondary, irreversible reset (confirm-guarded) */}
            <div className="space-y-2 border-t-2 border-coral/15 pt-4">
              <button
                type="button"
                onClick={resetTraining}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-coral/30 bg-coral/5 py-3.5 font-display font-bold text-coral-deep transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/30"
              >
                <Icon name="restart_alt" />
                {pick(lang, "Reset camera training", "إعادة ضبط الكاميرا")}
              </button>
              <p
                className="h-5 text-center text-xs font-semibold text-teal-deep"
                role="status"
                aria-live="polite"
              >
                {resetMsg}
              </p>
            </div>
          </div>
        </Group>

        {/* ── About / Help ─────────────────────────────────────────── */}
        <Group icon="help" title={pick(lang, "About", "حول")}>
          <div className="space-y-4">
            <LinkRow
              icon="contact_support"
              label={pick(lang, "Manage profiles", "إدارة الملفات")}
              onClick={() => go({ name: "family" })}
            />
            <LinkRow
              icon="menu_book"
              label={pick(lang, "Signs dictionary", "قاموس الإشارات")}
              onClick={() => go({ name: "allSigns" })}
            />
            <LinkRow
              icon="description"
              label={pick(lang, "Privacy policy", "سياسة الخصوصية")}
              onClick={() => go({ name: "privacy" })}
            />
          </div>

          {/* Version line + dev-metrics 5-tap easter egg */}
          <div className="mt-6 flex flex-col items-center gap-2 border-t-2 border-teal/10 pt-6 text-center">
            <button
              type="button"
              onClick={bump}
              aria-label="Sawiyya v1.0"
              className="flex flex-col items-center gap-2 rounded-2xl p-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
            >
              <Logo size={32} />
              <Caption>
                {pick(lang, "Sawiyya · v1.0 · سويّة", "سويّة · Sawiyya · v1.0")}
                <br />
                {pick(lang, "Together as Equals", "معاً على قدم المساواة")}
              </Caption>
            </button>
            <Caption className="!text-ink/40">
              {pick(lang, "© 2024 Sawiyya · Mada Innovation", "© 2024 سويّة · ابتكار مدى")}
            </Caption>
          </div>
        </Group>
      </div>
    </ScreenShell>
  );
}

// Label + value row (camera permission).
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-bold text-teal">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

// Chevron link row.
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
