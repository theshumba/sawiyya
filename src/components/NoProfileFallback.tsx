// NoProfileFallback — the shared escape hatch for the `if (!profile)` screen guards.
// Previously every screen returned a bare `null` here, rendering a permanent blank
// with no way out. This shows a one-line bilingual message + a single dominant
// "Set up profile" action that drops back into Onboarding (App.tsx re-renders
// Onboarding whenever `onboarded` is false / there's no active profile).
import { useApp } from "../store/app";
import { Button, Icon, Wordmark } from "./ui";

export function NoProfileFallback() {
  const toOnboarding = () => useApp.setState({ onboarded: false, activeProfileId: null });
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-sand px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-bowl border-2 border-teal/10 bg-paper text-teal shadow-soft">
        <Icon name="account_circle" className="text-4xl" />
      </span>
      <div className="space-y-1">
        <Wordmark className="font-display text-2xl text-teal" />
        <p className="font-display text-lg font-bold text-ink">
          No profile yet
          <span className="mx-2 text-muted">·</span>
          <span dir="rtl">لا يوجد ملف بعد</span>
        </p>
        <p className="text-sm text-muted">
          Set up a profile to start signing
          <span className="mx-2">·</span>
          <span dir="rtl">أنشئ ملفًا لتبدأ الإشارة</span>
        </p>
      </div>
      <Button size="lg" variant="primary" onClick={toOnboarding}>
        <span className="flex items-center gap-2">
          <Icon name="add" />
          Set up profile · إنشاء ملف
        </span>
      </Button>
    </div>
  );
}
