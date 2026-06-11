// Settings — language, handedness, goal, camera permission, transparency,
// privacy, profiles (PRD §6.10). Version line ×5 opens hidden dev metrics (§15).
import { useEffect, useRef, useState } from "react";
import { pick, t } from "../i18n";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { DailyGoal, Hand, Lang } from "../types";
import { Card, Logo } from "../components/ui";

export function Settings() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const [camState, setCamState] = useState<string | null>(null);
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

  const set = (patch: Partial<{ language: Lang; dominantHand: Hand; dailyGoal: DailyGoal }>) =>
    app.updateProfile(profile.id, patch);

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="font-semibold">{label}</span>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );

  const Seg = <T extends string>({
    value,
    options,
    onPick,
  }: {
    value: T;
    options: { v: T; label: string }[];
    onPick: (v: T) => void;
  }) => (
    <>
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onPick(o.v)}
          aria-pressed={value === o.v}
          className={`rounded-xl border-2 px-3 py-1.5 text-sm font-bold ${
            value === o.v ? "border-teal bg-teal text-white" : "border-line bg-paper"
          }`}
        >
          {o.label}
        </button>
      ))}
    </>
  );

  return (
    <div className="mx-auto max-w-md px-5 pb-12 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("setTitle", lang)}</h1>
        <button
          type="button"
          onClick={() => go({ name: "home" })}
          aria-label={t("back", lang)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-lg"
        >
          ✕
        </button>
      </header>

      <Card className="mt-5 divide-y divide-line">
        <Row label={t("setLanguage", lang)}>
          <Seg
            value={lang}
            options={[
              { v: "en" as Lang, label: "EN" },
              { v: "ar" as Lang, label: "عربي" },
            ]}
            onPick={(v) => set({ language: v })}
          />
        </Row>
        <Row label={t("setHand", lang)}>
          <Seg
            value={profile.dominantHand}
            options={[
              { v: "R" as Hand, label: t("obRight", lang) },
              { v: "L" as Hand, label: t("obLeft", lang) },
            ]}
            onPick={(v) => set({ dominantHand: v })}
          />
        </Row>
        <Row label={t("setGoal", lang)}>
          <Seg
            value={profile.dailyGoal}
            options={[
              { v: "casual" as DailyGoal, label: "3m" },
              { v: "regular" as DailyGoal, label: "7m" },
              { v: "serious" as DailyGoal, label: "15m" },
            ]}
            onPick={(v) => set({ dailyGoal: v })}
          />
        </Row>
        <Row label={t("setCameraPermission", lang)}>
          <span className={`text-sm font-bold ${camState === "granted" ? "text-teal" : "text-muted"}`}>
            {camState === "granted" ? `✓ ${t("setGranted", lang)}` : t("setNotGranted", lang)}
          </span>
        </Row>
      </Card>

      <Card className="mt-3 divide-y divide-line">
        <button type="button" onClick={() => go({ name: "family" })} className="flex w-full items-center justify-between px-4 py-3.5 font-semibold">
          {t("setProfiles", lang)} <span aria-hidden="true">→</span>
        </button>
        <button type="button" onClick={() => go({ name: "aiTransparency" })} className="flex w-full items-center justify-between px-4 py-3.5 font-semibold">
          {t("setAi", lang)} <span aria-hidden="true">→</span>
        </button>
        <button type="button" onClick={() => go({ name: "privacy" })} className="flex w-full items-center justify-between px-4 py-3.5 font-semibold">
          {t("setPrivacy", lang)} <span aria-hidden="true">→</span>
        </button>
      </Card>

      <button
        type="button"
        className="mx-auto mt-8 flex flex-col items-center gap-1 opacity-60"
        onClick={() => {
          taps.current += 1;
          if (taps.current >= 5) {
            taps.current = 0;
            go({ name: "devMetrics" });
          }
        }}
        aria-label="Sawiyya v1.0"
      >
        <Logo size={32} />
        <span className="text-xs text-muted">
          {pick(lang, "Sawiyya MVP-A · v1.0 · سويّة", "سويّة · Sawiyya MVP-A · v1.0")}
        </span>
      </button>
    </div>
  );
}
