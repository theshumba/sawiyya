// Settings — language, handedness, goal, profile name, camera permission +
// reset-training, transparency / privacy links, profiles (PRD §6.10).
// Version line / logo ×5 opens hidden dev metrics (§15).
// Reskin: grouped "paper-card" list (mono eyebrow + hairline rows w/ colour
// chips), a11y/pref controls kept inline, About footer floats Fanan "cheer".
// chrome="takeover" (shell owns nav). Reset-training is window.confirm-guarded.
import { useEffect, useRef, useState } from "react";
import { pick, t } from "../i18n";
import { activeProfile, todayKey, useApp } from "../store/app";
import {
  applyHouseholdImport,
  buildHouseholdExport,
  parseHouseholdImport,
} from "../store/household";
import { useUi } from "../store/ui";
import { clearAll } from "../recognizer/knn";
import type { DailyGoal, Hand, Lang } from "../types";
import { Icon, Logo } from "../components/ui";
import { Card, MonoLabel, toLocaleDigits } from "../components/dc";
import { Fanan } from "../components/Fanan";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";

// Grouped section — mono eyebrow above a paper card (0 2px 0 hairline shadow).
function Group({ title, lang, children }: { title: string; lang: Lang; children: React.ReactNode }) {
  return (
    <section>
      <MonoLabel lang={lang} className="mb-2 block px-1 text-muted">{title}</MonoLabel>
      <Card className="overflow-hidden rounded-2xl">{children}</Card>
    </section>
  );
}

// Padded block inside a group card (for inline controls), divider below.
function Block({ children, last = false }: { children: React.ReactNode; last?: boolean }) {
  return <div className={`p-4 ${last ? "" : "border-b border-paper2"}`}>{children}</div>;
}

export function Settings() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const [camState, setCamState] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const taps = useRef(0);
  // H8 · household export/import — local-first backup/restore.
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<unknown | null>(null);

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
    const ok = window.confirm(
      pick(
        lang,
        "Erase all camera training on this device? This cannot be undone.",
        "مسح كل تدريب الكاميرا على هذا الجهاز؟ لا يمكن التراجع عن هذا.",
      ),
    );
    if (!ok) return;
    // L15: a full wipe, not per-id — trainedClassIds() only counts classes
    // with ≥4 samples, so a per-id loop over it left partially-taught classes
    // (1-3 samples) behind despite the "erase all" promise. The toast counts
    // what clearAll() actually wiped (partial classes included) — counting
    // trainedClassIds() could say "Cleared 0" after erasing real partial
    // training.
    const n = toLocaleDigits(clearAll(), lang);
    setResetMsg(pick(lang, `Cleared ${n} trained sign(s)`, `تم مسح ${n} إشارة مدرّبة`));
    window.setTimeout(() => setResetMsg(null), 3000);
  };

  // H8: download the whole persisted household as one JSON file.
  const exportHousehold = () => {
    const json = buildHouseholdExport(__BUILD__);
    if (json === null) return;
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sawiyya-household-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg(t("setExportDone", lang));
    window.setTimeout(() => setExportMsg(null), 3000);
  };

  // H8: validate the picked file, then hold it behind the explicit bilingual
  // "this replaces everything" confirm — never a silent overwrite.
  const onImportFile = async (file: File | undefined) => {
    setImportErr(null);
    setPendingImport(null);
    if (!file) return;
    const parsed = parseHouseholdImport(await file.text());
    if (!parsed.ok) {
      setImportErr(t("setImportInvalid", lang));
      return;
    }
    setPendingImport(parsed.state);
  };

  const confirmImport = () => {
    if (pendingImport === null) return;
    applyHouseholdImport(pendingImport);
    // Reload so the imported blob rehydrates through migrate + normalizer (H13).
    window.location.reload();
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
      <label htmlFor="set-name" className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-muted">
        {pick(lang, "Your name", "اسمك")}
      </label>
      <input
        id="set-name"
        type="text"
        value={profile.displayName}
        onChange={(e) => set({ displayName: e.target.value })}
        placeholder={pick(lang, "Hamad Al-Thani", "حمد آل ثاني")}
        className="w-full rounded-xl border border-line bg-sand/50 px-4 py-3 text-base font-semibold text-ink transition placeholder:text-muted/40 focus:border-teal/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal/20"
      />
    </div>
  );

  const LanguageToggle = (
    <div className="flex gap-1.5 rounded-xl bg-paper2 p-1.5">
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
            className={`flex-1 rounded-lg py-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 ${
              on ? "bg-teal text-paper shadow-[0_3px_0_#0A4F4C]" : "text-muted hover:bg-teal/5"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  const HandCards = (
    <div className="grid grid-cols-2 gap-3">
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
            className={`relative flex flex-col items-center gap-2 rounded-xl p-4 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 ${
              on ? "border-2 border-teal bg-teal/5" : "border border-line bg-sand/40 hover:border-teal/40"
            }`}
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                on ? "bg-teal/10 text-teal" : "bg-paper2 text-muted"
              } ${o.flip ? "scale-x-[-1]" : ""}`}
            >
              <Icon name="back_hand" fill={on} className="text-3xl" />
            </div>
            <p className={`text-sm font-bold ${on ? "text-teal" : "text-muted"}`}>{pick(lang, o.en, o.ar)}</p>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                on ? "bg-teal" : "border-2 border-line"
              }`}
              aria-hidden="true"
            >
              {on && <Icon name="check" className="text-[12px] font-bold text-paper" />}
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
    <div className="space-y-2">
      {goalOptions.map((o) => {
        const on = profile.dailyGoal === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => set({ dailyGoal: o.v })}
            aria-pressed={on}
            className={`flex w-full items-center justify-between rounded-xl p-3.5 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40 ${
              on ? "border-2 border-gold bg-gold/10" : "border border-line bg-sand/40 hover:border-gold/50"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-ink">
              {on && <Icon name="stars" fill className="text-gold-deep" />}
              {pick(lang, o.en, o.ar)}
            </span>
            <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${on ? "bg-gold text-ink" : "bg-paper2 text-muted"}`}>
              {o.min}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ----- layout --------------------------------------------------------------

  return (
    <ScreenShell
      lang={lang}
      chrome="takeover"
      title={pick(lang, t("setTitle", "en"), t("setTitle", "ar"))}
      onClose={() => go({ name: "home" })}
    >
      <div className="mx-auto w-full max-w-xl space-y-1 px-5 pb-16 pt-4 md:px-8">
        {/* ── Account ───────────────────────────────────────────────── */}
        <Group lang={lang} title={pick(lang, "Account", "الحساب")}>
          <Block>{NameField}</Block>
          <ChipRow chip="bg-gold" label={t("setProfiles", lang)} onClick={() => go({ name: "family" })} last />
        </Group>

        {/* ── Preferences ──────────────────────────────────────────── */}
        <div className="pt-4">
          <Group lang={lang} title={pick(lang, "Preferences", "التفضيلات")}>
            <Block>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted">
                {pick(lang, "Language", "اللغة")}
              </p>
              {LanguageToggle}
            </Block>
            <Block>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted">
                {pick(lang, "Signing hand", "يد الإشارة")}
              </p>
              {HandCards}
            </Block>
            <Block last>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted">
                {pick(lang, "Daily goal", "الهدف اليومي")}
              </p>
              {GoalList}
            </Block>
          </Group>
        </div>

        {/* ── Camera & Privacy ─────────────────────────────────────── */}
        <div className="pt-4">
          <Group lang={lang} title={pick(lang, "Camera & privacy", "الكاميرا والخصوصية")}>
            <Block>
              <p className="text-[13px] leading-relaxed text-muted">
                {pick(
                  lang,
                  "The camera learns YOUR hands — erase and re-teach anytime.",
                  "تتعلم الكاميرا حركات يديك — يمكنك مسح التدريب وإعادته في أي وقت.",
                )}
              </p>
            </Block>

            {/* Live permission status. When not yet granted, offer a direct route
                into camera practice — that's where the real getUserMedia prompt
                fires (the browser won't grant from a passive settings row). */}
            <Block>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">{t("setCameraPermission", lang)}</span>
                {camState === "granted" ? (
                  <span className="text-sm font-bold text-success">✓ {t("setGranted", lang)}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => go({ name: "camera" })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1.5 text-sm font-bold text-teal transition hover:bg-teal/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  >
                    <Icon name="videocam" className="text-base" />
                    {t("setNotGranted", lang)}
                  </button>
                )}
              </div>
            </Block>

            {/* Transparency / privacy routes */}
            <ChipRow chip="bg-teal" label={t("setAi", lang)} onClick={() => go({ name: "aiTransparency" })} />
            <ChipRow chip="bg-muted" label={t("setPrivacy", lang)} onClick={() => go({ name: "privacy" })} />

            {/* Pro-tip callout */}
            <Block>
              <div className="flex items-start gap-3 rounded-xl bg-teal/5 p-3.5 text-start">
                <Icon name="tips_and_updates" className="text-coral" />
                <p className="text-[13px] font-medium text-ink/70">
                  {pick(
                    lang,
                    "Pro-tip: Use a plain background and good lighting for the fastest learning!",
                    "نصيحة: استخدم خلفية بسيطة وإضاءة جيدة لتعلّم أسرع!",
                  )}
                </p>
              </div>
            </Block>

            {/* Danger zone — secondary, irreversible reset (confirm-guarded) */}
            <Block last>
              <button
                type="button"
                onClick={resetTraining}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-coral/30 bg-coral/5 py-3 font-display text-sm font-bold text-coral-deep transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/30"
              >
                <Icon name="restart_alt" />
                {pick(lang, "Reset camera training", "إعادة ضبط الكاميرا")}
              </button>
              <p className="mt-2 h-5 text-center text-xs font-semibold text-teal-deep" role="status" aria-live="polite">
                {resetMsg}
              </p>
            </Block>
          </Group>
        </div>

        {/* ── Household data (H8) — the whole household lives in this browser's
            storage; export is the backup, import the restore. ─────────── */}
        <div className="pt-4">
          <Group lang={lang} title={t("setHousehold", lang)}>
            <Block>
              <button
                type="button"
                onClick={exportHousehold}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal/30 bg-teal/5 py-3 font-display text-sm font-bold text-teal transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
              >
                <Icon name="download" />
                {t("setExport", lang)}
              </button>
              <p className="mt-2 h-5 text-center text-xs font-semibold text-teal-deep" role="status" aria-live="polite">
                {exportMsg}
              </p>
              <p className="text-center text-[12px] leading-[1.4] text-muted">
                {t("famDataLocal", lang)}
              </p>
            </Block>
            <Block last>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  void onImportFile(e.target.files?.[0]);
                  e.target.value = ""; // allow re-picking the same file
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-paper py-3 font-display text-sm font-bold text-ink transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
              >
                <Icon name="upload" />
                {t("setImport", lang)}
              </button>
              {importErr && (
                <p className="mt-2 text-center text-xs font-semibold text-coral-deep" role="alert">
                  {importErr}
                </p>
              )}
              {pendingImport !== null && (
                <div className="mt-3 rounded-xl border border-coral/30 bg-coral/5 p-3.5">
                  <p className="font-display text-sm font-bold text-coral-deep">
                    {t("setImportConfirmTitle", lang)}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-[1.4] text-ink">
                    {t("setImportConfirmBody", lang)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={confirmImport}
                      className="flex-1 rounded-xl bg-coral py-2.5 font-display text-sm font-bold text-white transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/30"
                    >
                      {t("setImportReplace", lang)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingImport(null)}
                      className="flex-1 rounded-xl border border-line bg-paper py-2.5 font-display text-sm font-bold text-ink transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
                    >
                      {t("cancel", lang)}
                    </button>
                  </div>
                </div>
              )}
            </Block>
          </Group>
        </div>

        {/* ── About ────────────────────────────────────────────────── */}
        <div className="pt-4">
          <Group lang={lang} title={pick(lang, "About", "حول")}>
            <ChipRow
              chip="bg-gold"
              label={pick(lang, "Manage profiles", "إدارة الملفات")}
              onClick={() => go({ name: "family" })}
            />
            <ChipRow
              chip="bg-teal"
              label={pick(lang, "Signs dictionary", "قاموس الإشارات")}
              onClick={() => go({ name: "allSigns" })}
            />
            <ChipRow
              chip="bg-muted"
              label={pick(lang, "Privacy policy", "سياسة الخصوصية")}
              onClick={() => go({ name: "privacy" })}
              last
            />
          </Group>

          {/* About & credits — floating Fanan, gratitude card, version egg */}
          <div className="mt-8 flex flex-col items-center text-center">
            <div className="motion-safe:animate-float">
              <Fanan pose="cheer" scale={0.8} />
            </div>
            <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight text-ink">
              {t("aboutTitle", lang)}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{t("aboutBody", lang)}</p>
          </div>

          <div className="mt-5 rounded-[18px] border border-line bg-paper p-[18px] text-start shadow-[0_2px_0_#EDE3D2]">
            <MonoLabel lang={lang} className="text-coral">{t("aboutCreditsLbl", lang)}</MonoLabel>
            <p className="mt-2 text-sm font-medium leading-relaxed text-ink">{t("aboutCredits", lang)}</p>
          </div>

          {/* Version line + dev-metrics 5-tap easter egg */}
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <button
              type="button"
              onClick={bump}
              aria-label="Sawiyya v1.0"
              className="flex flex-col items-center gap-2 rounded-2xl p-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
            >
              <Logo size={30} />
              <span className="text-[11px] font-medium leading-relaxed text-muted">
                {pick(lang, "Sawiyya · v1.0 · سويّة", "سويّة · Sawiyya · v1.0")}
                <br />
                {pick(lang, "Together as Equals", "معاً على قدم المساواة")}
              </span>
            </button>
            <span className="text-[11px] font-medium text-muted">{t("aboutVersion", lang)}</span>
            <span className="text-[11px] font-medium text-muted">
              {pick(lang, "© 2026 Sawiyya", "© ٢٠٢٦ سويّة")}
            </span>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

// Design row: colour chip + label (+ optional value) + RTL-aware chevron.
function ChipRow({
  chip,
  label,
  value,
  onClick,
  last = false,
}: {
  chip: string;
  label: string;
  value?: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 px-3.5 py-3 text-start transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30 ${
        last ? "" : "border-b border-paper2"
      }`}
    >
      <span className={`h-[30px] w-[30px] flex-none rounded-[9px] ${chip}`} aria-hidden="true" />
      <span className="flex-1 text-sm font-semibold leading-tight text-ink transition-colors group-hover:text-coral">
        {label}
      </span>
      {value && <span className="text-xs font-medium text-muted">{value}</span>}
      <Icon
        name="chevron_right"
        className="text-[#C7D0CE] transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
      />
    </button>
  );
}
