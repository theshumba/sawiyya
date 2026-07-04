// AI transparency + privacy pages (PRD §6.10, §9.6).
// Responsible-AI signal: state plainly what the AI does and does NOT do.
// Both pages live behind the profile button and render inside the global
// ScreenShell takeover chrome (close → settings). No self-hosted nav.
import { Fragment, type ReactNode } from "react";
import { pick, t } from "../i18n";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { Button, ScreenCard, Icon } from "../components/ui";
import { ScreenShell } from "../components/ScreenShell";

/* ----------------------------------------------------------------- *
 * How the AI works — storybook cards, illustration-led (stitch v2). *
 * ----------------------------------------------------------------- */

function AiCard({
  img,
  title,
  subtitle,
  body,
}: {
  img: string;
  title: string;
  subtitle: string;
  body: string;
}) {
  return (
    <ScreenCard variant="elevated" className="flex h-full flex-col items-center p-6 text-center motion-safe:animate-pop-in">
      <div className="mb-5 flex h-40 w-40 items-center justify-center md:h-44 md:w-44">
        <img src={img} alt="" className="h-full w-full object-contain" loading="lazy" />
      </div>
      <h3 className="font-display text-xl font-bold text-teal">{title}</h3>
      <h4 className="mt-1 font-display text-base font-bold text-teal-deep" dir="auto">
        {subtitle}
      </h4>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{body}</p>
    </ScreenCard>
  );
}

export function AiTransparency() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  if (!profile) return null;
  const lang = profile.language;
  const T = (en: string, ar: string) => pick(lang, en, ar);

  const cards = [
    {
      img: "/brand/stitch-21.png",
      title: T("Everything runs on your device", "كل شي يتم على جهازك"),
      subtitle: T("كل شي يتم على جهازك", "Everything runs on your device"),
      body: T(
        "It tracks the 21 joints of one hand in real time and recognises static handshapes — all on this phone. No camera frame, hand landmark, or recording is ever uploaded. The only network use is a one-time download of the AI model and fonts on first open; after that it works offline.",
        "تتبّع ٢١ مفصلًا في يد واحدة لحظيًا وتتعرف على أشكال اليد الثابتة — كل ذلك على هذا الجهاز. لا تُرفع أي لقطة كاميرا أو نقطة يد أو تسجيل. الاستخدام الوحيد للشبكة هو تنزيل نموذج الذكاء الاصطناعي والخطوط لمرة واحدة عند أول فتح؛ بعدها يعمل دون اتصال."
      ),
    },
    {
      img: "/brand/stitch-02.png",
      title: T("You teach it YOUR hands", "أنت تعلّم التطبيق يدينك"),
      subtitle: T("أنت تعلّم التطبيق يدينك", "You teach it YOUR hands"),
      body: T(
        "The camera learns your hands — left or right, any skin tone, any lighting — because you give it samples on your own device. It recognises the unique way you sign.",
        "تتعلم الكاميرا يديك أنت — يسرى أو يمنى، بأي لون بشرة، وفي أي إضاءة — لأنك تعطيها عيّنات على جهازك. وتتعرف على طريقتك الخاصة في الإشارة."
      ),
    },
    {
      img: "/brand/stitch-09.png",
      title: T("It grades with kindness", "التقييم بلطف"),
      subtitle: T("التقييم بلطف", "It grades with kindness"),
      body: T(
        "Recognition is scaffolding to encourage you, not an exam. The AI looks for progress, not perfection — and if it's unsure, you are never blocked.",
        "التعرف وسيلة تشجيع وليس امتحانًا. تبحث الكاميرا عن التقدم لا الكمال — وإن لم تتأكد، لن تُحجَب أبدًا."
      ),
    },
    {
      img: "/brand/stitch-28.png",
      title: T("It knows its limits", "يعرف حدوده"),
      subtitle: T("يعرف حدوده", "It knows its limits"),
      body: T(
        "It cannot grade moving signs, full sentences, or facial grammar — those are open research problems. Sawiyya is built for the Arabic alphabet and individual signs: the building blocks of language.",
        "لا تستطيع تقييم الإشارات المتحركة أو الجمل الكاملة أو تعابير الوجه النحوية — تلك مسائل بحثية مفتوحة. سويّة مبنية للحروف العربية والإشارات المفردة: لبنات اللغة."
      ),
    },
  ];

  // The 5th "You're always right" card is the hero band; it uses a distinct
  // gold thumbs-up illustration (stitch-19) and carries the one dominant CTA.
  const proudCard = {
    img: "/brand/stitch-19.png",
    title: T("You're always right about your hands", "أنت دايماً على حق"),
    subtitle: T("أنت أبخص بيدك", "You're always right about your hands"),
    body: T(
      "You know your hands best. Signs with motion are taught by watching and self-marking — if you think you signed it right, you can always mark it correct.",
      "أنت أعرف بيديك. الإشارات المتحركة تُتعلم بالمشاهدة والتقييم الذاتي — وإن رأيت أنك أديتها صح، يمكنك دائمًا تقييمها صحيحة."
    ),
  };

  return (
    <ScreenShell
      lang={lang}
      chrome="takeover"
      title={T("How the AI works", "كيف يعمل الذكاء الاصطناعي")}
      onClose={() => go({ name: "settings" })}
    >
      {/* M17: not <main> — ScreenShell's takeover header already renders the
          real <h1> from `title`; App.tsx's screen router owns the one <main>. */}
      <div className="mx-auto w-full max-w-md space-y-6 px-5 py-8 md:max-w-5xl md:px-8 md:py-12">
        {/* Intro — one reconciled bilingual heading story */}
        <section className="space-y-4 text-center">
          <span className="font-label inline-block rounded-full border-2 border-gold/30 bg-gold/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-deep">
            {T("Mada Innovation Award 2026 entry", "مشاركة في جائزة مدى للابتكار ٢٠٢٦")}
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight text-teal md:text-4xl">
            {T("Built for your family,", "مصمّم لعائلتك،")}
            <br />
            <span className="text-coral">{T("designed for trust.", "مصمّم على الثقة.")}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-ink/70 md:text-lg" dir="auto">
            {T(
              "Privacy, kindness, and togetherness — safe, supportive, and focused on your family connection.",
              "خصوصية ولطف وترابط — آمن وداعم ومركّز على ترابط عائلتكم."
            )}
          </p>
        </section>

        {/* On-device promise — three-step flow, banner, guarantees (design C) */}
        <section className="space-y-4">
          {/* Three-step flow strip. Camera-square glyph + arrows never mirror as
              shapes; arrow direction follows reading flow. */}
          <div className="flex items-center justify-between rounded-[18px] border border-line bg-paper px-3 py-4 shadow-[0_2px_0_#EDE3D2] md:mx-auto md:max-w-lg">
            {([
              { bg: "bg-ink", round: "rounded-[4px]", label: t("aiFlowCamera", lang) },
              { bg: "bg-teal", round: "rounded-full", label: t("aiFlowModel", lang) },
              { bg: "bg-gold", round: "rounded-full", label: t("aiFlowGrade", lang) },
            ]).map((s, i) => (
              <Fragment key={i}>
                <div className="flex flex-1 flex-col items-center gap-1.5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-[13px] ${s.bg}`}>
                    <span className={`h-4 w-4 bg-paper ${s.round}`} aria-hidden="true" />
                  </div>
                  <span className="text-center text-[10px] font-semibold leading-tight text-ink">{s.label}</span>
                </div>
                {i < 2 && (
                  <span aria-hidden="true" className="px-1 font-display text-base font-bold text-[#C7D0CE]">
                    {lang === "ar" ? "←" : "→"}
                  </span>
                )}
              </Fragment>
            ))}
          </div>

          {/* Promise banner */}
          <div className="rounded-[18px] bg-teal p-[18px] text-center md:mx-auto md:max-w-lg">
            <p className="font-display text-[19px] font-extrabold leading-tight text-paper">{t("aiPromise", lang)}</p>
          </div>

          {/* Guarantee bullets — CSS checkmark keeps its orientation (never mirrors) */}
          <div className="flex flex-col gap-2.5 md:mx-auto md:max-w-lg">
            {(["aiBulletNoUpload", "aiBulletNoAccount", "aiBulletOffline", "aiBulletDelete"] as const).map((k) => (
              <div key={k} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-success"
                  aria-hidden="true"
                >
                  <span className="mb-[3px] h-[5px] w-[9px] -rotate-45 border-b-2 border-l-2 border-paper" />
                </span>
                <span className="text-[13px] leading-relaxed text-ink">{t(k, lang)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Storybook cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((c, i) => (
            <AiCard key={i} {...c} />
          ))}
        </div>

        {/* "You're always right" — hero band carrying the ONE dominant CTA. */}
        <ScreenCard
          variant="elevated"
          className="flex flex-col items-center gap-6 border-4 border-gold p-8 text-center motion-safe:animate-pop-in md:flex-row md:p-8 md:text-start rtl:md:flex-row-reverse"
        >
          <div className="flex h-32 w-32 shrink-0 items-center justify-center">
            <img src={proudCard.img} alt="" className="h-full w-full object-contain" loading="lazy" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-2xl font-bold text-teal md:text-3xl">{proudCard.title}</h3>
            <h4 className="mt-1 font-display text-lg font-bold text-ink" dir="auto">
              {proudCard.subtitle}
            </h4>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/80 md:text-base">{proudCard.body}</p>
            <div className="mt-6 flex justify-center md:justify-start">
              <Button variant="primary" size="lg" onClick={() => go({ name: "camera" })}>
                {T("Let's Practice Together", "لنتدرّب معًا")}
              </Button>
            </div>
          </div>
        </ScreenCard>

        {/* Secondary link to the privacy promise (demoted). */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => go({ name: "privacy" })}
            className="font-display text-base font-bold text-teal underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            {T("Read the privacy promise", "اقرأ وعد الخصوصية")}
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}

/* --------------------------------------------------- *
 * Privacy — teal hero + card grid (no clip-path).      *
 * --------------------------------------------------- */

function PrivacyCard({
  children,
  className = "",
  icon,
  iconTone = "sand",
}: {
  children: ReactNode;
  className?: string;
  icon?: string;
  iconTone?: "sand" | "gold";
}) {
  return (
    <ScreenCard variant="elevated" className={`flex flex-col gap-4 p-6 ${className}`}>
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 ${
          iconTone === "gold" ? "border-gold/20 bg-gold/10 text-gold" : "border-teal/10 bg-sand text-teal"
        }`}
      >
        <Icon name={icon ?? "shield"} fill className="text-4xl" />
      </div>
      {children}
    </ScreenCard>
  );
}

/** A labelled storage row inside the "what we keep on your device" card. */
function StorageRow({ index, label, detail, tone }: { index: number; label: string; detail: string; tone: "gold" | "teal" }) {
  return (
    <li className="flex items-center gap-4 rounded-2xl border-2 border-teal/5 bg-sand/60 p-4">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-base font-bold text-white ${
          tone === "gold" ? "bg-gold" : "bg-teal"
        }`}
      >
        {index}
      </span>
      <span className="min-w-0">
        <span className="font-display text-base font-bold text-ink">{label}</span>{" "}
        <span className="text-[15px] text-ink/60">{detail}</span>
      </span>
    </li>
  );
}

export function Privacy() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  if (!profile) return null;
  const lang = profile.language;
  const T = (en: string, ar: string) => pick(lang, en, ar);

  // Destructive wipe of local-only data. Sawiyya stores everything in this
  // browser (PRD §9.6), so an explicit confirm + localStorage clear honours
  // the "Erase everything" promise without touching any frozen store.
  const eraseEverything = () => {
    const ok = window.confirm(
      T(
        "Delete all profiles, progress and learned handshapes from this device? This cannot be undone.",
        "حذف كل الملفات والتقدم وأشكال اليد المتعلمة من هذا الجهاز؟ لا يمكن التراجع."
      )
    );
    if (!ok) return;
    try {
      localStorage.clear();
    } finally {
      window.location.reload();
    }
  };

  return (
    <ScreenShell
      lang={lang}
      chrome="takeover"
      title={T("Privacy", "الخصوصية")}
      onClose={() => go({ name: "settings" })}
    >
      {/* Hero */}
      <section className="bg-teal px-6 pb-12 pt-10 text-center text-paper">
        <div className="mx-auto max-w-md md:max-w-3xl">
          <div className="relative mx-auto mb-6 h-52 w-52 md:h-60 md:w-60">
            <img src="/brand/stitch-14.png" alt="" className="h-full w-full object-contain" loading="eager" />
            <span aria-hidden="true" className="absolute -end-2 -top-2 text-gold motion-safe:animate-pulse">
              <Icon name="auto_awesome" fill className="text-4xl" />
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            {T("Your hands stay home", "يداك تبقى في بيتك")}
            <span className="mt-2 block text-paper/90" dir="auto">
              {T("يداك تبقى في بيتك", "Your hands stay home")}
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base font-medium text-paper/90 md:text-lg">
            {T("Privacy as a feature, not small print.", "الخصوصية ميزة، لا شرطًا في الهامش.")}
          </p>
        </div>
      </section>

      {/* Cards — M17: not <main>, see the AiTransparency screen above. */}
      <div className="mx-auto w-full max-w-md space-y-6 px-5 py-8 md:max-w-5xl md:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PrivacyCard icon="videocam_off" iconTone="sand">
            <h3 className="font-display text-xl font-bold text-ink">
              {T("No video ever leaves your device", "لا يغادر أي فيديو جهازك أبدًا")}
            </h3>
            <p className="text-[15px] leading-relaxed text-ink/80">
              {T(
                "All hand tracking and recognition runs 100% on this device. Your camera images and hand-landmark data never leave your phone — no video is ever uploaded. The app only reaches the network once, on first open, to download the AI model and fonts; then it runs offline.",
                "كل تتبّع اليد والتعرف يعمل ١٠٠٪ على هذا الجهاز. صور الكاميرا وبيانات نقاط اليد لا تغادر هاتفك أبدًا — ولا يُرفع أي فيديو. يتصل التطبيق بالشبكة مرة واحدة فقط عند أول فتح لتنزيل نموذج الذكاء الاصطناعي والخطوط؛ ثم يعمل دون اتصال."
              )}
            </p>
          </PrivacyCard>

          <PrivacyCard icon="no_accounts" iconTone="gold">
            <h3 className="font-display text-xl font-bold text-ink">
              {T("No accounts, no tracking", "لا حسابات ولا تتبّع")}
            </h3>
            <p className="text-[15px] leading-relaxed text-ink/80">
              {T(
                "Sawiyya collects no personal data and uses no analytics. Profiles, progress and the camera's learned handshapes live only in this browser's local storage. Delete the app data and they're gone.",
                "سويّة لا تجمع أي بيانات شخصية ولا تستخدم أدوات تحليل. الملفات والتقدم وأشكال اليد المتعلمة تبقى في التخزين المحلي لهذا المتصفح فقط. احذف بيانات التطبيق وستختفي."
              )}
            </p>
          </PrivacyCard>

          {/* What we keep on your device — itemised storage detail. */}
          <ScreenCard variant="elevated" className="flex flex-col gap-6 p-6 md:col-span-2 md:flex-row md:items-center md:gap-12">
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-teal/10 bg-sand text-teal">
                  <Icon name="folder_managed" fill className="text-3xl" />
                </span>
                <h3 className="font-display text-2xl font-bold text-ink">
                  {T("What we keep on your device", "ما نحفظه على جهازك")}
                </h3>
              </div>
              <p className="text-[15px] leading-relaxed text-ink/70">
                {T(
                  "Because households include children, on-device-only is a design rule, not a setting. We store a tiny amount of data strictly on this device:",
                  "لأن الأسر تضم أطفالًا، العمل على الجهاز فقط قاعدة تصميم لا خيارًا. نحفظ قدرًا صغيرًا جدًا من البيانات على هذا الجهاز فقط:"
                )}
              </p>
              <ul className="space-y-4">
                <StorageRow
                  index={1}
                  tone="gold"
                  label={T("Progress Data", "بيانات التقدم")}
                  detail={T("Unlocked signs, XP, and your daily streak.", "الإشارات المفتوحة والنقاط وسلسلتك اليومية.")}
                />
                <StorageRow
                  index={2}
                  tone="teal"
                  label={T("Local Cache", "الذاكرة المؤقتة")}
                  detail={T(
                    "Learned handshape samples and temporary files that make the app run faster.",
                    "عيّنات أشكال اليد المتعلمة وملفات مؤقتة تجعل التطبيق أسرع."
                  )}
                />
              </ul>
            </div>
          </ScreenCard>

          {/* Erase everything — the ONE clearly-destructive control. */}
          <ScreenCard variant="flat" className="flex flex-col items-center gap-5 border-4 border-coral/20 p-6 text-center md:col-span-2 md:flex-row md:justify-between md:text-start">
            <div>
              <h3 className="font-display text-xl font-bold text-ink">{T("Erase everything", "امسح كل شيء")}</h3>
              <p className="mt-1 text-[15px] text-ink/60">
                {T(
                  "One tap to wipe all progress and local data forever.",
                  "ضغطة واحدة لمحو كل التقدم والبيانات المحلية إلى الأبد."
                )}
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={eraseEverything} className="shrink-0">
              <span className="inline-flex items-center gap-2">
                <Icon name="delete_forever" className="text-xl" />
                {T("Delete Local Data", "حذف البيانات المحلية")}
              </span>
            </Button>
          </ScreenCard>
        </div>

        {/* Secondary link (demoted). */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => go({ name: "aiTransparency" })}
            className="mx-auto flex items-center justify-center gap-2 font-display text-base font-bold text-teal opacity-80 transition hover:underline hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            {T("How the AI works", "كيف يعمل الذكاء الاصطناعي")}
            <Icon name="open_in_new" className="text-lg" />
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}
