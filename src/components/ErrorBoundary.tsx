// Error boundary (H12) — one render throw must never white-screen the app,
// especially with an autoUpdate service worker that activates new builds for
// everyone. Class component: React only routes render errors to class
// lifecycles.
//
// The fallback card is shown in BOTH languages: at the top level the store
// (and with it the language preference) may be exactly what crashed, so we
// never guess which language the user reads.
//
// Recovery is honest and ordered: retry the subtree → reload the app → and
// only as an explicitly confirmed last resort, reset all app data.
import { Component, type ReactNode } from "react";
import { t } from "../i18n";
import { Card, SpringButton } from "./dc";

interface Props {
  children: ReactNode;
  /**
   * "app" (default): top level — primary action is a full reload.
   * "section": a subtree (e.g. camera screens) — offers "try again" first,
   * which just re-mounts the subtree; the rest of the app stayed alive.
   */
  scope?: "app" | "section";
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // On-device only — no telemetry in the app by design.
    console.error("[sawiyya] render error caught by boundary:", error);
  }

  private retry = () => this.setState({ error: null });

  private reload = () => window.location.reload();

  private resetData = () => {
    const confirmed = window.confirm(
      `${t("ebResetConfirm", "en")}\n\n${t("ebResetConfirm", "ar")}`,
    );
    if (!confirmed) return;
    try {
      localStorage.clear();
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    const section = this.props.scope === "section";
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand p-4" role="alert">
        <Card className="w-full max-w-md space-y-4 p-5">
          <div dir="ltr" lang="en">
            <p className="font-display text-lg font-bold text-ink">{t("ebTitle", "en")}</p>
            <p className="mt-1 text-sm text-ink/70">{t("ebBody", "en")}</p>
          </div>
          <div dir="rtl" lang="ar">
            <p className="font-display text-lg font-bold text-ink">{t("ebTitle", "ar")}</p>
            <p className="mt-1 text-sm text-ink/70">{t("ebBody", "ar")}</p>
          </div>

          <div className="space-y-2">
            {section && (
              <SpringButton variant="teal" full onClick={this.retry}>
                {t("ebRetry", "en")} · {t("ebRetry", "ar")}
              </SpringButton>
            )}
            <SpringButton variant={section ? "ghost" : "teal"} full onClick={this.reload}>
              {t("ebReload", "en")} · {t("ebReload", "ar")}
            </SpringButton>
          </div>

          {/* Last resort — small, separated, and gated behind a bilingual confirm. */}
          <div className="border-t border-line pt-3 text-center">
            <p className="text-xs text-ink/70">
              {t("ebResetHint", "en")} · {t("ebResetHint", "ar")}
            </p>
            <button
              type="button"
              onClick={this.resetData}
              className="mt-1 text-xs font-semibold text-coral underline underline-offset-2"
            >
              {t("ebReset", "en")} · {t("ebReset", "ar")}
            </button>
          </div>
        </Card>
      </div>
    );
  }
}
