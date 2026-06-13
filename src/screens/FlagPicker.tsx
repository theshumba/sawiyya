// "Flag signs we need" — the Deaf member directs the household curriculum
// (PRD §6.7). Flagged signs pin to every hearing member's Home and jump
// their SRS queues, tagged with who needs them.
//
// Rebuilt to the Google Stitch v2 brand design (flag-signs-we-need--*):
// a teal hero with the crown/hand illustration, learning-group category
// navigation (mobile pills · desktop "Learning Groups" sidebar), a search +
// sort/filter bar, a 2-col (mobile) / 3-col (desktop) grid of pinnable sign
// cards, and a status cluster (mobile) / right-rail summary + weekly-goal
// achievement card (desktop) showing the real flag count, flagged-sign list
// and the actual requestors.
import { useMemo, useState } from "react";
import { num, pick, t } from "../i18n";
import { A1_SIGNS } from "../content/signs";
import { activeFlags, activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { Button, Icon } from "../components/ui";
import type { Sign } from "../types";

// Learning-group taxonomy (Stitch "Learning Groups" sidebar / mobile pills).
// No `category` field exists on Sign (frozen content), so groups are derived
// from a presentational id→group map; anything unmapped lives under "home".
type GroupId = "all" | "home" | "food" | "feelings" | "school";

const SIGN_GROUP: Record<string, Exclude<GroupId, "all">> = {
  // Food & drink
  milk: "food",
  hungry: "food",
  more: "food",
  finished: "food",
  // Feelings & social
  iloveyou: "feelings",
  hello: "feelings",
  yes: "feelings",
  no: "feelings",
  thankyou: "feelings",
  // School / instruction
  help: "school",
  careful: "school",
  name: "school",
  stop: "school",
};

const groupOf = (sign: Sign): Exclude<GroupId, "all"> => SIGN_GROUP[sign.id] ?? "home";

export function FlagPicker() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupId>("home");
  const [mostNeeded, setMostNeeded] = useState(true);
  if (!profile) return null;
  const lang = profile.language;

  const flags = activeFlags(app);
  const flaggedIds = new Set(flags.map((f) => f.signId));

  // Real requestors: the distinct profiles who raised an active flag.
  const requestorIds = Array.from(new Set(flags.map((f) => f.raisedByProfileId)));
  const requestors = requestorIds
    .map((id) => app.profiles.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  // Learning groups — labels via existing copy, counts from the live signs.
  const groups: { id: GroupId; label: string; icon: string }[] = [
    { id: "home", label: pick(lang, "Home", "المنزل"), icon: "home" },
    { id: "food", label: pick(lang, "Food", "طعام"), icon: "restaurant" },
    { id: "feelings", label: pick(lang, "Feelings", "مشاعر"), icon: "mood" },
    { id: "school", label: pick(lang, "School", "مدرسة"), icon: "school" },
  ];

  const q = query.trim().toLowerCase();
  const signs = useMemo(() => {
    let list = A1_SIGNS.filter((s) => groupOf(s) === group);
    if (q) {
      list = A1_SIGNS.filter(
        (s) => s.glossEn.toLowerCase().includes(q) || s.glossAr.includes(query.trim()),
      );
    }
    if (mostNeeded) {
      // "Most needed" = flagged signs first, preserving content order otherwise.
      list = [...list].sort(
        (a, b) => Number(flaggedIds.has(b.id)) - Number(flaggedIds.has(a.id)),
      );
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, q, query, mostNeeded, flags.length]);

  // Flagged signs, in flag order, for the summary rail.
  const flaggedSigns = flags
    .map((f) => A1_SIGNS.find((s) => s.id === f.signId))
    .filter((s): s is Sign => Boolean(s));

  // Priority labels (Stitch summary rail) — first two flags High, rest Medium.
  const priorityLabel = (i: number) =>
    i < 2
      ? pick(lang, "Priority High", "أولوية عالية")
      : pick(lang, "Priority Medium", "أولوية متوسطة");

  const clearAll = () => {
    flaggedSigns.forEach((s) => app.toggleFlag(s.id, profile.id));
  };

  const headingAr = "علّم الإشارات اللي نحتاجها";

  return (
    <div className="min-h-screen bg-sand pb-44 md:pb-12">
      {/* ── Top bar (desktop) ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 hidden h-20 items-center justify-between border-b-4 border-teal-deep bg-teal px-8 text-paper shadow-md md:flex">
        <div className="flex items-center gap-4">
          <span className="font-display text-2xl font-bold tracking-tight text-paper">
            sawiyya<span className="text-gold">.</span>
          </span>
        </div>
        <div className="hidden items-center gap-8 lg:flex">
          <button type="button" onClick={() => go({ name: "home" })} className="font-sans font-medium text-paper/80 transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold">
            {pick(lang, "Home", "الرئيسية")}
          </button>
          <button type="button" onClick={() => go({ name: "camera" })} className="font-sans font-bold text-gold transition-colors focus-visible:outline-none">
            {pick(lang, "Camera", "الكاميرا")}
          </button>
          <button type="button" onClick={() => go({ name: "family" })} className="font-sans font-medium text-paper/80 transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold">
            {pick(lang, "Family", "العائلة")}
          </button>
          <button type="button" onClick={() => go({ name: "progress" })} className="font-sans font-medium text-paper/80 transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold">
            {pick(lang, "Progress", "التقدّم")}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 rounded-full bg-paper/10 px-3 py-1.5 text-paper" aria-hidden="true">
            <Icon name="local_fire_department" fill className="text-gold" />
            <span className="font-display text-sm font-bold">{num(profile.streak, lang)}</span>
          </span>
          <span className="hidden h-10 w-10 items-center justify-center rounded-full border-2 border-paper bg-paper/10 text-lg lg:flex" aria-hidden="true">
            {profile.emoji}
          </span>
          <Button variant="ghost" onClick={() => go({ name: "family" })} className="border-paper/30 !text-paper">
            {t("cancel", lang)}
          </Button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-teal px-6 pb-12 pt-6 md:rounded-none md:pb-12 md:pt-28 rounded-b-[40px] shadow-lift">
        {/* mobile top app bar */}
        <div className="mb-2 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-paper/10 p-2 text-paper">
              <Icon name="crown" fill />
            </span>
            <h1 className="font-display text-xl font-bold uppercase tracking-wider text-paper">
              {t("famFlagTitle", lang)}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => go({ name: "family" })}
            aria-label={t("back", lang)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10 text-paper transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* abstract glows */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-gold/10 blur-[80px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-coral/10 blur-[60px]" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center text-center md:flex-row md:items-center md:justify-between md:gap-8 md:text-start">
          <img
            src="/brand/stitch-35.png"
            alt=""
            aria-hidden="true"
            className="mb-6 h-40 w-40 object-contain drop-shadow-2xl md:order-2 md:mb-0 md:h-56 md:w-56 motion-safe:animate-rise"
          />
          <div className="md:order-1 md:max-w-2xl">
            <h2 className="mb-2 font-display text-3xl font-bold leading-tight text-paper md:text-5xl">
              {t("famFlagTitle", lang)}
              <span className="mt-1 block font-sans text-2xl font-normal opacity-90 md:mt-2 md:inline md:text-4xl" dir="rtl">
                {lang === "ar" ? "" : ` · ${headingAr}`}
              </span>
            </h2>
            <p className="font-sans text-lg text-paper/80 md:text-xl">
              {pick(lang, "You direct what they learn", "أنت توجّه ما يتعلمونه")}
            </p>
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <main className="relative z-20 mx-auto -mt-8 max-w-7xl px-6 md:mt-0 md:flex md:gap-8 md:px-8 md:py-12 lg:gap-12">
        {/* ── Learning Groups sidebar (desktop) ───────────────────────── */}
        <aside className="hidden shrink-0 lg:flex lg:w-72 lg:flex-col">
          <nav
            aria-label={pick(lang, "Learning groups", "مجموعات التعلّم")}
            className="rounded-2xl border-2 border-teal/10 bg-paper p-8 shadow-soft"
          >
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-teal/60">
              {pick(lang, "Learning Groups", "مجموعات التعلّم")}
            </h3>
            <div className="space-y-4">
              {groups.map((gr) => {
                const active = group === gr.id && !q;
                return (
                  <button
                    key={gr.id}
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      setGroup(gr.id);
                      setQuery("");
                    }}
                    className={`flex w-full items-center gap-4 rounded-xl p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
                      active
                        ? "bg-teal text-paper shadow-[0_4px_0_0_#0A4F4C] active:translate-y-1 active:shadow-[0_1px_0_0_#0A4F4C]"
                        : "text-teal hover:bg-teal/5"
                    }`}
                  >
                    <Icon name={gr.icon} fill={active} />
                    <span className={active ? "font-bold" : "font-medium"}>{gr.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 border-t-2 border-teal/5 pt-8">
              <button
                type="button"
                disabled
                title={pick(lang, "Coming soon", "قريبًا")}
                className="w-full rounded-xl border-2 border-teal py-4 font-bold text-teal transition hover:bg-teal hover:text-paper disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
              >
                {pick(lang, "+ New Category", "+ مجموعة جديدة")}
              </button>
            </div>
          </nav>
        </aside>

        {/* canvas (search + grid) */}
        <section className="md:flex-1 md:space-y-8">
          {/* Search + sort/filter */}
          <div className="mb-6 rounded-3xl bg-paper p-4 shadow-lift md:mb-0 md:bg-transparent md:p-0 md:shadow-none">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex flex-1 items-center">
                <span className="pointer-events-none absolute left-4 text-teal" aria-hidden="true">
                  <Icon name="search" />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={pick(lang, "Search for a sign…", "ابحث عن إشارة…")}
                  aria-label={pick(lang, "Search signs", "ابحث عن إشارة")}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  className={`w-full rounded-2xl border-2 border-line bg-sand py-4 font-sans text-ink outline-none transition placeholder:text-ink/40 focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/30 md:bg-paper md:text-lg ${
                    lang === "ar" ? "pl-4 pr-12" : "pl-12 pr-4"
                  }`}
                />
              </div>

              {/* sort + filter (desktop) */}
              <div className="hidden gap-2 md:flex">
                <button
                  type="button"
                  aria-pressed={mostNeeded}
                  onClick={() => setMostNeeded((v) => !v)}
                  className={`whitespace-nowrap rounded-2xl border-2 px-6 py-4 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
                    mostNeeded
                      ? "border-teal bg-teal/5 text-teal"
                      : "border-line bg-paper text-teal hover:border-teal"
                  }`}
                >
                  {pick(lang, "Most Needed", "الأكثر طلبًا")}
                </button>
                <button
                  type="button"
                  aria-label={pick(lang, "Filter", "تصفية")}
                  disabled
                  title={pick(lang, "Coming soon", "قريبًا")}
                  className="rounded-2xl border-2 border-line bg-paper px-6 py-4 text-teal transition hover:border-teal disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
                >
                  <Icon name="filter_list" className="align-middle" />
                </button>
              </div>
            </div>

            {/* category pills (mobile) */}
            <div className="-mb-1 mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden" role="tablist" aria-label={pick(lang, "Learning groups", "مجموعات التعلّم")}>
              {groups.map((gr) => {
                const active = group === gr.id && !q;
                return (
                  <button
                    key={gr.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setGroup(gr.id);
                      setQuery("");
                    }}
                    className={`whitespace-nowrap rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
                      active ? "bg-teal text-sand" : "bg-sand text-teal hover:bg-teal/10"
                    }`}
                  >
                    {gr.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sign grid */}
          {signs.length === 0 ? (
            <p className="rounded-2xl bg-paper p-8 text-center font-sans text-muted">
              {pick(lang, "No signs match your search.", "لا توجد إشارات مطابقة.")}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6" role="list">
              {signs.map((sign) => {
                const flagged = flaggedIds.has(sign.id);
                return (
                  <li key={sign.id}>
                    <button
                      type="button"
                      aria-pressed={flagged}
                      onClick={() => app.toggleFlag(sign.id, profile.id)}
                      className={`relative flex w-full flex-col rounded-[32px] border-2 p-4 text-start transition md:rounded-2xl md:p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 ${
                        flagged
                          ? "border-coral bg-paper shadow-coral motion-safe:-translate-y-1"
                          : "border-line bg-paper shadow-soft hover:border-teal/30"
                      }`}
                    >
                      {/* pin */}
                      <span
                        className={`absolute end-4 top-4 text-2xl md:text-3xl ${
                          flagged ? "text-coral" : "text-ink/20"
                        }`}
                        aria-hidden="true"
                      >
                        <Icon name="push_pin" fill={flagged} />
                      </span>

                      {/* sign tile */}
                      <span
                        className={`mb-3 flex aspect-square items-center justify-center rounded-2xl md:mb-4 md:aspect-auto md:h-44 ${
                          flagged ? "bg-sand" : "bg-sand/50"
                        }`}
                      >
                        <span className="text-5xl md:text-6xl" aria-hidden="true">
                          {sign.emoji}
                        </span>
                      </span>

                      {/* label */}
                      <span className="flex w-full items-end justify-between">
                        <span className="min-w-0">
                          <span className="block truncate font-display text-base font-bold text-teal md:text-2xl">
                            {pick(lang, sign.glossEn, sign.glossAr)}
                          </span>
                          <span className="block truncate font-display text-sm font-medium text-teal/60 md:text-xl" dir="rtl">
                            {pick(lang, sign.glossAr, sign.glossEn)}
                          </span>
                        </span>
                        {flagged && (
                          <span className="ms-2 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-paper md:flex" aria-hidden="true">
                            <Icon name="star" fill className="text-sm" />
                          </span>
                        )}
                      </span>

                      {flagged && (
                        <span className="mt-1 text-xs font-semibold text-coral md:hidden">
                          {t("famFlagged", lang)}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Right rail / summary (desktop) ───────────────────────────── */}
        <aside className="hidden w-80 shrink-0 space-y-6 md:block">
          <div className="relative overflow-hidden rounded-3xl border-4 border-teal/5 bg-paper p-8 shadow-lift">
            <span className="absolute left-0 top-0 h-2 w-full bg-coral" aria-hidden="true" />
            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral" aria-hidden="true">
                  <Icon name="push_pin" fill className="text-2xl" />
                </span>
                <h3 className="font-display text-xl font-bold leading-tight text-teal">
                  {pick(
                    lang,
                    `${num(flaggedSigns.length, lang)} signs flagged for this week`,
                    `${num(flaggedSigns.length, lang)} إشارات محدّدة لهذا الأسبوع`,
                  )}
                </h3>
              </div>

              {flaggedSigns.length > 0 ? (
                <ul className="mb-8 space-y-3" role="list">
                  {flaggedSigns.map((s, i) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-teal/5 bg-sand p-3"
                    >
                      <span className="font-bold text-teal">{pick(lang, s.glossEn, s.glossAr)}</span>
                      <span className="text-sm text-teal/60">{priorityLabel(i)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-8 rounded-xl bg-sand p-4 text-sm text-muted">
                  {pick(lang, "Tap a sign to flag it.", "اضغط على إشارة لتحديدها.")}
                </p>
              )}

              {/* Requestors */}
              {requestors.length > 0 && (
                <div className="mb-8">
                  <p className="mb-4 text-sm font-bold uppercase tracking-widest text-teal/40">
                    {pick(lang, "Requestors", "مَن طلبها")}
                  </p>
                  <div className="flex -space-x-3 overflow-hidden">
                    {requestors.slice(0, 4).map((p) => (
                      <span
                        key={p.id}
                        title={p.displayName}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sand text-2xl ring-4 ring-paper"
                        aria-hidden="true"
                      >
                        {p.emoji}
                      </span>
                    ))}
                    {requestors.length > 4 && (
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold text-xs font-bold text-paper ring-4 ring-paper">
                        +{num(requestors.length - 4, lang)}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-teal/60">
                    {pick(
                      lang,
                      "Family members waiting for these signs",
                      "أفراد العائلة في انتظار هذه الإشارات",
                    )}
                  </p>
                </div>
              )}

              <Button full variant="primary" onClick={() => go({ name: "family" })} className="mb-4">
                {t("save", lang)} ({num(flaggedSigns.length, lang)})
              </Button>
              {flaggedSigns.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="w-full rounded-xl py-3 font-bold text-teal transition hover:bg-teal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
                >
                  {pick(lang, "Clear all", "مسح الكل")}
                </button>
              )}
            </div>
          </div>

          {/* Weekly-goal achievement card */}
          {(() => {
            const goalPct =
              flaggedSigns.length > 0
                ? Math.min(100, Math.round((flaggedSigns.length / 5) * 100))
                : 0;
            return (
              <div className="relative overflow-hidden rounded-3xl bg-gold p-6 text-paper shadow-gold">
                <div className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-paper/20" aria-hidden="true" />
                <div className="relative z-10 flex items-center gap-4">
                  <span className="text-4xl" aria-hidden="true">🔥</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                      {pick(lang, "Weekly Goal", "الهدف الأسبوعي")}
                    </p>
                    <h4 className="font-display text-2xl font-bold leading-tight">
                      {pick(lang, `${num(goalPct, lang)}% Complete`, `${num(goalPct, lang)}٪ مكتمل`)}
                    </h4>
                  </div>
                </div>
                <div
                  className="relative z-10 mt-4 h-4 overflow-hidden rounded-full bg-paper/20"
                  role="progressbar"
                  aria-valuenow={goalPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={pick(lang, "Weekly goal progress", "تقدّم الهدف الأسبوعي")}
                >
                  <div
                    className="h-full rounded-full bg-paper transition-all duration-500"
                    style={{ width: `${goalPct}%`, boxShadow: "0 0 15px rgba(255,255,255,0.5)" }}
                  />
                </div>
              </div>
            );
          })()}
        </aside>
      </main>

      {/* ── Sticky status cluster (mobile) ────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="mx-6 mb-4 flex items-center justify-between gap-3 rounded-3xl border-t border-teal/5 bg-paper/95 p-4 shadow-lift backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex -space-x-3">
              {(requestors.length > 0 ? requestors.slice(0, 2) : [profile]).map((p) => (
                <span
                  key={p.id}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-paper bg-sand text-lg"
                  aria-hidden="true"
                >
                  {p.emoji}
                </span>
              ))}
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-paper bg-sand text-teal" aria-hidden="true">
                <Icon name="groups" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-teal">
                {num(flaggedSigns.length, lang)} {t("famFlagged", lang)}
              </p>
              <p className="truncate text-xs text-muted">{t("famFlagSub", lang)}</p>
            </div>
          </div>
          <Button variant="primary" onClick={() => go({ name: "family" })} className="shrink-0 !px-6 !py-3">
            {t("save", lang)}
          </Button>
        </div>
      </div>
    </div>
  );
}
