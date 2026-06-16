// PractiseChooser — the Practise tab landing (spec §5.3).
// A goal chooser that PRE-TARGETS the camera so CameraPractice opens in a focused
// "sign THIS" state instead of a wall of scroll strips. Honest about what's real:
//   • Arabic Alphabet — READY (real gradable data)
//   • Everyday QSL signs — teach-mode (gradable subset)
//   • More dialects — coming soon (no fabricated data, decision #6)
import { pick, t } from "../i18n";
import { activeProfile, dueSignIds, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { A1_SIGNS } from "../content/signs";
import { ScreenShell } from "../components/ScreenShell";
import { Card, Icon, Title, Eyebrow, Body } from "../components/ui";
import { SignGlyph } from "../components/SignGlyph";

const GRADABLE_SIGNS = A1_SIGNS.filter((s) => s.cameraGradable);

export function PractiseChooser() {
  const app = useApp();
  const go = useUi((s) => s.go);
  const profile = activeProfile(app);
  if (!profile) return null;
  const lang = profile.language;
  const due = dueSignIds(app, profile.id);

  return (
    <ScreenShell lang={lang}>
      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-2xl md:px-8">
        <Eyebrow lang={lang}>{t("navPractise", lang)}</Eyebrow>
        <Title className="mt-1">{pick(lang, "What do you want to practise?", "بماذا تريد أن تتدرّب؟")}</Title>
        <Body className="mt-2">
          {pick(
            lang,
            "Sign in front of your camera — it grades you privately, on your device.",
            "أشِر أمام الكاميرا — تقيّمك بخصوصية على جهازك.",
          )}
        </Body>

        <div className="mt-6 space-y-4">
          {/* Arabic Alphabet — READY */}
          <Card
            variant="elevated"
            onClick={() => go({ name: "camera", targetSignId: "alpha-alif" })}
            className="flex items-center gap-4 p-5"
          >
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal/10 font-display text-3xl font-black text-teal" dir="rtl">
              ا ب ت
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display text-lg font-bold text-ink">{pick(lang, "Arabic Alphabet", "الحروف العربية")}</p>
                <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {pick(lang, "Ready", "جاهز")}
                </span>
              </div>
              <p className="text-sm text-muted">{pick(lang, "Fingerspell all 32 letters", "تهجئة الحروف الـ32")}</p>
            </div>
            <Icon name="arrow_forward" className="text-2xl text-teal rtl:rotate-180" />
          </Card>

          {/* Review what's due */}
          {due.length > 0 && (
            <Card
              variant="elevated"
              onClick={() => go({ name: "lesson", lessonId: "review", reviewOnly: true })}
              className="flex items-center gap-4 p-5"
            >
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-gold">
                <Icon name="history" fill className="text-3xl" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold text-ink">{t("homeReviewDue", lang)}</p>
                <p className="text-sm text-muted">{due.length} {t("homeReviewCta", lang)}</p>
              </div>
              <Icon name="arrow_forward" className="text-2xl text-teal rtl:rotate-180" />
            </Card>
          )}

          {/* Everyday QSL signs — teach-mode gradable subset */}
          <div>
            <Eyebrow lang={lang} className="mb-2 px-1">{pick(lang, "Everyday signs", "إشارات يومية")}</Eyebrow>
            <div className="grid grid-cols-3 gap-3">
              {GRADABLE_SIGNS.map((sign) => (
                <button
                  key={sign.id}
                  type="button"
                  onClick={() => go({ name: "camera", targetSignId: sign.id })}
                  className="flex flex-col items-center gap-2 rounded-3xl border-2 border-line bg-paper p-4 text-center transition hover:border-teal/40 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand/60">
                    <SignGlyph sign={sign} lang={lang} className="text-3xl" imgClassName="h-10 w-10 rounded-lg object-cover" />
                  </span>
                  <span className="truncate text-sm font-display font-bold text-ink">{pick(lang, sign.glossEn, sign.glossAr)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* More dialects — coming soon (no fabricated data) */}
          <div className="rounded-3xl border-2 border-dashed border-teal/20 bg-paper/50 p-5 text-center">
            <Icon name="public" className="text-3xl text-teal/40" />
            <p className="mt-1 font-display font-bold text-ink">{pick(lang, "More dialects coming soon", "لهجات أخرى قريبًا")}</p>
            <p className="mt-1 text-sm text-muted">
              {pick(lang, "Emirati, Saudi & more Gulf sign languages are on the way.", "الإماراتية والسعودية ولغات إشارة خليجية أخرى قادمة.")}
            </p>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}
