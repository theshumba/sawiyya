// NoProfileFallback — the shared escape hatch for the `if (!profile)` screen guards.
// This is the **empty · no-profile** instance of the States family (see
// design/rebuild-source/specs/states.md). Reskinned to the empty-state layout:
// floating Fanan → title → body → one dominant teal CTA that drops back into
// Onboarding (App.tsx re-renders Onboarding whenever `onboarded` is false / there
// is no active profile). No dead ends: the single forward action is always live.
import { useApp } from "../store/app";
import { Button, Icon, Wordmark } from "./ui";
import { Fanan } from "./Fanan";
import { t } from "../i18n";

export function NoProfileFallback() {
  // The escape-hatch navigation — BOTH keys must be set together so App.tsx swaps
  // back to Onboarding. This is the load-bearing contract of the screen.
  const toOnboarding = () => useApp.setState({ onboarded: false, activeProfileId: null });
  // No active profile ⇒ no per-profile language. Borrow the first known profile's
  // language when one exists (e.g. added-but-not-active), else default to English.
  const lang = useApp((s) => s.profiles[0]?.language ?? "en");

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="flex min-h-dvh w-full flex-col bg-sand"
    >
      {/* brand anchor */}
      <div className="flex-none pt-8 text-center">
        <Wordmark className="font-display text-xl text-teal" />
      </div>

      {/* body zone — centered mascot + copy (spec §2 Body zone / empty·no-profile) */}
      <div className="flex flex-1 flex-col items-center justify-center px-[30px] pt-3 text-center">
        {/* Fanan never mirrors — same facing in EN + AR (HANDOFF §2) */}
        <div className="animate-float">
          <Fanan pose="wave" scale={1.05} />
        </div>

        <h1 className="mt-[22px] max-w-[260px] animate-rise font-display text-[28px] font-extrabold leading-[1.12] text-ink">
          {t("stNoProfileTitle", lang)}
        </h1>
        <p className="mt-2 max-w-[256px] font-sans text-[15px] leading-[1.5] text-muted">
          {t("stNoProfileBody", lang)}
        </p>
      </div>

      {/* footer zone — single forward CTA (spec §2 Footer). Design mandates a teal
          fill for empty·no-profile (§2 footer colours); in this codebase the teal,
          springy/extruded variant is `secondary` (`primary` = coral). The
          preserved contract is the onClick → toOnboarding, kept verbatim below. */}
      <div className="flex-none px-[30px] pb-5 pt-3">
        <Button size="lg" variant="secondary" full onClick={toOnboarding}>
          <span className="flex items-center justify-center gap-2">
            <Icon name="add" />
            {t("stSetUpProfile", lang)}
          </span>
        </Button>
      </div>
    </div>
  );
}
