// AI transparency + privacy pages (PRD §6.10, §9.6).
// Responsible-AI signal: state plainly what the AI does and does NOT do.
// Restyled to Google Stitch v2 brand (how-the-ai-works--*, privacy--*).
import type { ReactNode } from "react";
import { pick, t } from "../i18n";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { Screen } from "../store/ui";
import type { Lang } from "../types";
import { Button, Icon } from "../components/ui";

/* ------------------------------------------------------------------ *
 * Shared chrome — teal top app bar that matches the Stitch TopAppBar. *
 * On desktop the Stitch comps add a "Learning Portal / Family         *
 * Practice" portal bar, a left sidebar nav, and a rich footer; those  *
 * live in DesktopChrome below and are layered around this bar.        *
 * ------------------------------------------------------------------ */

function TopBar({ title, lang }: { title: string; lang: Lang }) {
  const { go } = useUi();
  return (
    <header className="sticky top-0 z-30 flex w-full items-center gap-4 bg-teal px-5 py-4 text-paper shadow-[0_4px_0_0_theme(colors.teal.deep)] md:px-10">
      <button
        type="button"
        onClick={() => go({ name: "settings" })}
        aria-label={pick(lang, "Back", "رجوع")}
        className="flex h-10 w-10 items-center justify-center rounded-full text-paper transition active:translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <Icon name="arrow_back" className="text-2xl" />
      </button>
      <h1 className="flex-1 font-display text-xl font-bold tracking-tight text-paper md:text-2xl">{title}</h1>
      {/* Portal links — desktop only (Stitch "Learning Portal / Family Practice"). */}
      <nav aria-hidden="true" className="hidden items-center gap-6 md:flex">
        <span className="font-display text-sm font-bold text-paper">{pick(lang, "Learning Portal", "بوابة التعلّم")}</span>
        <span className="font-display text-sm font-bold text-paper/70">{pick(lang, "Family Practice", "تدريب العائلة")}</span>
      </nav>
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper font-display text-lg font-bold text-teal"
      >
        س
      </span>
    </header>
  );
}

/* ------------------------------------------------------------------ *
 * Desktop sidebar nav + footer — mirrors the marketing-style chrome   *
 * shown in privacy---desktop / how-the-ai-works---desktop. Hidden on  *
 * mobile, where the app's own BottomNav handles navigation.           *
 * ------------------------------------------------------------------ */

function SidebarNav({ lang, active }: { lang: Lang; active: Screen["name"] }) {
  const { go } = useUi();
  const items: { name: Screen["name"]; icon: string; label: string; screen: Screen }[] = [
    { name: "home", icon: "home", label: t("navHome", lang), screen: { name: "home" } },
    { name: "camera", icon: "videocam", label: t("navCamera", lang), screen: { name: "camera" } },
    { name: "family", icon: "favorite", label: t("navFamily", lang), screen: { name: "family" } },
    { name: "progress", icon: "leaderboard", label: t("navProgress", lang), screen: { name: "progress" } },
    { name: "settings", icon: "settings", label: t("setTitle", lang), screen: { name: "settings" } },
  ];
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-teal px-4 py-8 text-paper lg:flex">
      <div className="mb-10 flex items-center gap-3 px-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper font-display text-2xl font-bold text-teal">
          س
        </span>
        <div>
          <p className="font-display text-xl font-bold leading-none text-paper">Sawiyya</p>
          <p className="text-sm text-paper/60" dir="auto">
            سويّة
          </p>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        {items.map((it) => {
          const isActive = it.name === active;
          return (
            <button
              key={it.name}
              type="button"
              onClick={() => go(it.screen)}
              className={`flex items-center gap-4 rounded-full px-4 py-3 text-start font-display text-base font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                isActive
                  ? "bg-sand text-teal shadow-[0_4px_0_0_theme(colors.gold.DEFAULT)]"
                  : "text-paper hover:bg-teal-deep"
              }`}
            >
              <Icon name={it.icon} fill={isActive} className="text-2xl" />
              <span>{it.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function DesktopFooter({ lang }: { lang: Lang }) {
  const { go } = useUi();
  return (
    <footer className="hidden bg-teal px-10 pb-10 pt-14 text-paper md:block">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper font-display text-2xl font-bold text-teal">
              س
            </span>
            <h3 className="font-display text-2xl font-bold tracking-tight" dir="auto">
              Sawiyya · سويّة
            </h3>
          </div>
          <p className="max-w-md text-base leading-relaxed text-paper/70">
            {pick(
              lang,
              "Teaching the world to sign, one family at a time. Empowering communication between hearing families and Deaf children.",
              "نعلّم العالم لغة الإشارة، عائلةً تلو الأخرى. نمكّن التواصل بين العائلات السامعة والأطفال الصُّم."
            )}
          </p>
        </div>
        <div>
          <h4 className="mb-5 font-display text-sm font-bold uppercase tracking-widest text-gold">
            {pick(lang, "Resources", "المصادر")}
          </h4>
          <ul className="space-y-3 font-display text-base font-bold">
            <li>
              <button type="button" onClick={() => go({ name: "allSigns" })} className="transition hover:text-gold">
                {pick(lang, "Dictionary", "القاموس")}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go({ name: "home" })} className="transition hover:text-gold">
                {pick(lang, "Lesson Map", "خريطة الدروس")}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go({ name: "privacy" })} className="transition hover:text-gold">
                {pick(lang, "Privacy Policy", "سياسة الخصوصية")}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go({ name: "settings" })} className="transition hover:text-gold">
                {pick(lang, "Support", "الدعم")}
              </button>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-5 font-display text-sm font-bold uppercase tracking-widest text-gold">
            {pick(lang, "Community", "المجتمع")}
          </h4>
          <div className="flex gap-4" aria-hidden="true">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-paper/20 text-paper">
              <Icon name="share" />
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-paper/20 text-paper">
              <Icon name="mail" />
            </span>
          </div>
        </div>
      </div>
      {/* Building Bridges with Dignity band */}
      <div className="mx-auto mt-12 max-w-6xl border-t border-paper/10 pt-8 text-center">
        <h4 className="font-display text-lg font-bold text-paper">
          {pick(lang, "Building Bridges with Dignity", "نبني الجسور بكرامة")}
        </h4>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-paper/60">
          {pick(
            lang,
            "Sawiyya is a bridge between the hearing and the Deaf world, built with Gulf values of respect and family warmth.",
            "سويّة جسر بين عالم السامعين وعالم الصُّم، مبنيّ على قيم الخليج في الاحترام ودفء العائلة."
          )}
        </p>
      </div>
    </footer>
  );
}

/** Wraps an info page in the desktop sidebar + footer shell. */
function PageShell({
  lang,
  active,
  children,
}: {
  lang: Lang;
  active: Screen["name"];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sand md:flex">
      <SidebarNav lang={lang} active={active} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {children}
        <DesktopFooter lang={lang} />
      </div>
    </div>
  );
}

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
    <article className="relative flex flex-col items-center overflow-hidden rounded-bowl border border-line border-b-4 border-b-sand bg-paper p-7 text-center shadow-[0_6px_0_0_rgba(15,110,106,0.10)] motion-safe:animate-pop-in">
      <div aria-hidden="true" className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full bg-teal/5 blur-2xl" />
      <div className="mb-5 flex h-40 w-40 items-center justify-center md:h-44 md:w-44">
        <img src={img} alt="" className="h-full w-full object-contain" loading="lazy" />
      </div>
      <h3 className="font-display text-xl font-bold text-teal">{title}</h3>
      <h4 className="mt-1 font-display text-base font-bold text-teal-deep" dir="auto">
        {subtitle}
      </h4>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{body}</p>
    </article>
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
        "It tracks the 21 joints of one hand in real time and recognises static handshapes — all on this phone. No camera frame, hand landmark, or recording is ever uploaded. There is no server to upload to.",
        "تتبّع ٢١ مفصلًا في يد واحدة لحظيًا وتتعرف على أشكال اليد الثابتة — كل ذلك على هذا الجهاز. لا تُرفع أي لقطة كاميرا أو نقطة يد أو تسجيل. ولا يوجد خادم أصلًا للرفع إليه."
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

  // The 5th "You're always right" card is the desktop hero band; it uses a
  // distinct gold thumbs-up illustration (stitch-19) and a coral CTA.
  const proudCard = {
    img: "/brand/stitch-19.png",
    title: T("You're always right about your hands", "أنت دايماً على حق"),
    subtitle: T("أنت أبخص بيدك", "أنت أبخص بيدك"),
    body: T(
      "You know your hands best. Signs with motion are taught by watching and self-marking — if you think you signed it right, you can always mark it correct.",
      "أنت أعرف بيديك. الإشارات المتحركة تُتعلم بالمشاهدة والتقييم الذاتي — وإن رأيت أنك أديتها صح، يمكنك دائمًا تقييمها صحيحة."
    ),
  };

  return (
    <PageShell lang={lang} active="settings">
      <TopBar lang={lang} title={T("How the AI works", "كيف يعمل الذكاء الاصطناعي")} />

      <main className="mx-auto w-full max-w-md px-5 py-8 md:max-w-6xl md:px-10 md:py-12">
        {/* Intro */}
        <section className="space-y-4 text-center">
          <span className="font-label inline-block rounded-full border-2 border-gold/30 bg-gold/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-deep">
            {T("Mada Innovation Award Winner", "الفائز بجائزة مدى للابتكار")}
          </span>
          {/* Mobile heading matches the mobile comp; desktop swaps to the
              "Privacy, Kindness, and Togetherness" comp heading. */}
          <h2 className="font-display text-3xl font-bold leading-tight text-teal md:hidden">
            {T("Built for your family,", "مصمّم لعائلتك،")}
            <br />
            <span className="text-coral">{T("designed for trust.", "مصمّم على الثقة.")}</span>
          </h2>
          <h2 className="hidden font-display text-4xl font-bold leading-tight text-teal-deep md:block lg:text-5xl">
            {T("Privacy, Kindness, and Togetherness", "خصوصية ولطف وترابط")}
          </h2>
          <p className="mx-auto hidden max-w-2xl text-lg text-ink/70 md:block" dir="auto">
            {T(
              "Designed to be safe, supportive, and focused on your family connection.",
              "مصمّم ليكون آمنًا وداعمًا ومركزًا على ترابط عائلتكم."
            )}
          </p>
        </section>

        {/* Storybook cards */}
        <div className="mt-10 grid grid-cols-1 gap-8 md:mt-12 md:grid-cols-2 md:gap-8">
          {cards.map((c, i) => (
            <AiCard key={i} {...c} />
          ))}
        </div>

        {/* "You're always right" — full-width hero band with the coral CTA. */}
        <section className="mt-8 flex flex-col items-center gap-8 overflow-hidden rounded-bowl border-4 border-gold bg-white p-8 text-center shadow-lift motion-safe:animate-pop-in md:mt-8 md:flex-row md:p-10 md:text-start rtl:md:flex-row-reverse">
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
              <Button variant="primary" onClick={() => go({ name: "home" })}>
                {T("Let's Practice Together", "لنتدرّب معًا")}
              </Button>
            </div>
          </div>
        </section>

        {/* Secondary link to the privacy promise */}
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => go({ name: "privacy" })}
            className="font-display text-base font-bold text-teal underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            {T("Read the privacy promise", "اقرأ وعد الخصوصية")}
          </button>
        </div>
      </main>
    </PageShell>
  );
}

/* --------------------------------------------------- *
 * Privacy — teal hero + meeting curve + card grid.     *
 * --------------------------------------------------- */

function PrivacyCard({
  children,
  className = "",
  icon,
  iconTone = "sand",
  img,
}: {
  children: ReactNode;
  className?: string;
  icon?: string;
  iconTone?: "sand" | "gold";
  img?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-bowl border border-line border-b-[6px] border-b-ink/10 bg-paper p-7 ${className}`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 ${
          iconTone === "gold" ? "border-gold/20 bg-gold/10 text-gold" : "border-teal/10 bg-sand text-teal"
        }`}
      >
        {img ? (
          <img src={img} alt="" className="h-10 w-10 object-contain" loading="lazy" />
        ) : (
          <Icon name={icon ?? "shield"} fill className="text-4xl" />
        )}
      </div>
      {children}
    </div>
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
    <PageShell lang={lang} active="settings">
      <TopBar lang={lang} title={T("Privacy", "الخصوصية")} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-teal px-6 pb-12 pt-10 text-center text-paper">
        <div className="mx-auto max-w-md md:max-w-3xl">
          <div className="relative mx-auto mb-6 h-52 w-52 md:h-60 md:w-60">
            <img
              src="/brand/stitch-14.png"
              alt=""
              className="h-full w-full object-contain"
              loading="eager"
            />
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

      {/* Meeting-curve transition */}
      <div
        aria-hidden="true"
        className="h-12 w-full bg-teal"
        style={{ clipPath: "ellipse(60% 100% at 50% 100%)", marginTop: "-1px" }}
      />

      {/* Cards */}
      <main className="mx-auto -mt-2 w-full max-w-md px-5 pb-8 md:max-w-6xl md:px-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PrivacyCard icon="videocam_off" iconTone="sand">
            <h3 className="font-display text-xl font-bold text-ink">
              {T("No video ever leaves your device", "لا يغادر أي فيديو جهازك أبدًا")}
            </h3>
            <p className="text-[15px] leading-relaxed text-ink/80">
              {T(
                "All hand tracking and recognition runs 100% on this device. No camera frame, no hand landmark, no recording is ever uploaded — there is no server to upload to.",
                "كل تتبّع اليد والتعرف يعمل ١٠٠٪ على هذا الجهاز. لا تُرفع أي لقطة كاميرا ولا أي نقطة يد ولا أي تسجيل — ولا يوجد خادم أصلًا للرفع إليه."
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

          {/* What we keep on your device — itemised storage detail (Stitch
              desktop comp): labelled Progress Data + Local Cache rows. */}
          <div className="flex flex-col gap-6 rounded-bowl border border-line border-b-[6px] border-b-ink/10 bg-white p-7 md:col-span-2 md:flex-row md:items-center md:gap-12">
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={eraseEverything}
                  className="inline-flex items-center gap-2 font-display text-sm font-bold text-coral underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                >
                  <Icon name="delete_forever" className="text-lg" />
                  {T("Clear Local Data", "حذف البيانات المحلية")}
                </button>
              </div>
            </div>
          </div>

          {/* Erase everything — destructive, coral-bordered */}
          <div className="flex flex-col items-center gap-5 rounded-bowl border-4 border-coral/20 bg-white p-7 text-center md:col-span-2 md:flex-row md:justify-between md:text-start">
            <div>
              <h3 className="font-display text-xl font-bold text-ink">{T("Erase everything", "امسح كل شيء")}</h3>
              <p className="mt-1 text-[15px] text-ink/60">
                {T("One tap to wipe all progress and local data forever.", "ضغطة واحدة لمحو كل التقدم والبيانات المحلية إلى الأبد.")}
              </p>
            </div>
            <Button variant="primary" onClick={eraseEverything} className="shrink-0">
              {T("Delete Local Data", "حذف البيانات المحلية")}
            </Button>
          </div>
        </div>

        {/* Secondary link */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => go({ name: "aiTransparency" })}
            className="mx-auto flex items-center justify-center gap-2 font-display text-base font-bold text-teal opacity-80 transition hover:underline hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            {T("How the AI works", "كيف يعمل الذكاء الاصطناعي")}
            <Icon name="open_in_new" className="text-lg" />
          </button>
        </div>
      </main>
    </PageShell>
  );
}
