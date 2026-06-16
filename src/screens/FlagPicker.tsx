// "Flag signs we need" — the Deaf member directs the household curriculum
// (PRD §6.7). Flagged signs pin to every hearing member's Home and jump
// their SRS queues, tagged with who needs them.
//
// Redesign (spec §5.7): sub-route behind Family inside the shared takeover
// shell (close/back → Family). The desktop top-nav + mobile app-bar twins are
// deleted (the shell owns chrome). ONE horizontally-scrolling group Chip row at
// ALL sizes (fixes the md dead-zone). Flags persist on tap — Save was a no-op —
// so there is a single "Done" affordance. The fabricated weekly-goal /5 and the
// index-based priority labels are dropped (no fabrication in a judged demo). One
// card-radius/spacing scale; the secondary gloss follows the content language.
import { useMemo, useState } from "react";
import { num, pick, t } from "../i18n";
import { A1_SIGNS, signById } from "../content/signs";
import { activeFlags, activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { ScreenShell } from "../components/ScreenShell";
import { Button, Icon } from "../components/ui";
import { Chip } from "../components/Tile";
import type { Sign } from "../types";

// Learning-group taxonomy (mobile/desktop group switcher). No `category` field
// exists on Sign (frozen content), so groups are derived from a presentational
// id→group map; anything unmapped lives under "home".
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

  // Flagged signs, in flag order, for the summary rail. Resolve via signById (the
  // single source of truth) so flagged ALPHABET signs resolve too — A1_SIGNS.find
  // silently dropped them (#M3).
  const flaggedSigns = flags
    .map((f) => signById(f.signId))
    .filter((s): s is Sign => Boolean(s));

  const clearAll = () => {
    flaggedSigns.forEach((s) => app.toggleFlag(s.id, profile.id));
  };

  const headingAr = "علّم الإشارات اللي نحتاجها";

  return (
    <ScreenShell
      lang={lang}
      chrome="takeover"
      title={t("famFlagTitle", lang)}
      onClose={() => go({ name: "family" })}
    >
      <div className="pb-28">
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <header className="relative overflow-hidden bg-teal px-6 pb-10 pt-8 shadow-lift rounded-b-bowl">
          {/* abstract glows */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-gold/10 blur-[80px]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-coral/10 blur-[60px]" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:text-start">
            <img
              src="/brand/stitch-35.png"
              alt=""
              aria-hidden="true"
              className="h-32 w-32 object-contain drop-shadow-2xl md:order-2 md:h-44 md:w-44 motion-safe:animate-rise"
            />
            <div className="md:order-1">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1.5 text-paper">
                <Icon name="family_star" fill />
                <span className="font-display text-xs font-bold uppercase tracking-wider">
                  {t("famFlagTitle", lang)}
                </span>
              </span>
              <h2 className="font-display text-3xl font-bold leading-tight text-paper md:text-4xl">
                {t("famFlagTitle", lang)}
                <span className="mt-1 block font-sans text-xl font-normal opacity-90 md:text-2xl" dir="rtl">
                  {lang === "ar" ? "" : ` · ${headingAr}`}
                </span>
              </h2>
              <p className="mt-2 font-sans text-lg text-paper/80">
                {pick(lang, "You direct what they learn", "أنت توجّه ما يتعلمونه")}
              </p>
            </div>
          </div>
        </header>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <main className="mx-auto -mt-6 max-w-3xl space-y-6 px-6">
          {/* Search + sort */}
          <div className="space-y-4 rounded-3xl bg-paper p-5 shadow-lift">
            <div className="flex items-center gap-3">
              <div className="relative flex flex-1 items-center">
                <span className="pointer-events-none absolute left-4 text-teal rtl:left-auto rtl:right-4" aria-hidden="true">
                  <Icon name="search" />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={pick(lang, "Search for a sign…", "ابحث عن إشارة…")}
                  aria-label={pick(lang, "Search signs", "ابحث عن إشارة")}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  className={`w-full rounded-2xl border-2 border-line bg-sand py-3.5 font-sans text-ink outline-none transition placeholder:text-ink/40 focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/30 ${
                    lang === "ar" ? "pl-4 pr-12" : "pl-12 pr-4"
                  }`}
                />
              </div>
              <button
                type="button"
                aria-pressed={mostNeeded}
                onClick={() => setMostNeeded((v) => !v)}
                className={`shrink-0 whitespace-nowrap rounded-2xl border-2 px-4 py-3.5 font-display font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
                  mostNeeded
                    ? "border-teal bg-teal/5 text-teal"
                    : "border-line bg-paper text-teal hover:border-teal"
                }`}
              >
                {pick(lang, "Most Needed", "الأكثر طلبًا")}
              </button>
            </div>

            {/* One group switcher — a single horizontally-scrolling Chip row at
                ALL sizes (fixes the md dead-zone). */}
            <div
              className="-mb-1 flex gap-2 overflow-x-auto pb-1 no-scrollbar"
              role="tablist"
              aria-label={pick(lang, "Learning groups", "مجموعات التعلّم")}
            >
              {groups.map((gr) => {
                const active = group === gr.id && !q;
                return (
                  <Chip
                    key={gr.id}
                    selected={active}
                    onClick={() => {
                      setGroup(gr.id);
                      setQuery("");
                    }}
                  >
                    <Icon name={gr.icon} fill={active} className="text-base" />
                    {gr.label}
                  </Chip>
                );
              })}
            </div>
          </div>

          {/* Sign grid */}
          {signs.length === 0 ? (
            <p className="rounded-3xl bg-paper p-8 text-center font-sans text-muted shadow-soft">
              {pick(lang, "No signs match your search.", "لا توجد إشارات مطابقة.")}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3" role="list">
              {signs.map((sign) => {
                const flagged = flaggedIds.has(sign.id);
                return (
                  <li key={sign.id}>
                    <button
                      type="button"
                      aria-pressed={flagged}
                      onClick={() => app.toggleFlag(sign.id, profile.id)}
                      className={`relative flex w-full flex-col rounded-3xl border-2 p-5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 ${
                        flagged
                          ? "border-coral bg-paper shadow-coral ring-4 ring-coral/10 motion-safe:-translate-y-1"
                          : "border-line bg-paper shadow-soft hover:border-teal/30"
                      }`}
                    >
                      {/* pin = the one selection affordance (ring + filled pin) */}
                      <span
                        className={`absolute end-4 top-4 text-2xl ${
                          flagged ? "text-coral" : "text-ink/20"
                        }`}
                        aria-hidden="true"
                      >
                        <Icon name="push_pin" fill={flagged} />
                      </span>

                      {/* sign tile */}
                      <span
                        className={`mb-4 flex aspect-square items-center justify-center rounded-2xl ${
                          flagged ? "bg-sand" : "bg-sand/50"
                        }`}
                      >
                        <span className="text-5xl" aria-hidden="true">
                          {sign.emoji}
                        </span>
                      </span>

                      {/* label */}
                      <span className="block min-w-0">
                        <span className="block truncate font-display text-base font-bold text-teal">
                          {pick(lang, sign.glossEn, sign.glossAr)}
                        </span>
                        <span
                          className="block truncate font-display text-sm font-medium text-teal/60"
                          dir={lang === "ar" ? "ltr" : "rtl"}
                        >
                          {pick(lang, sign.glossAr, sign.glossEn)}
                        </span>
                      </span>

                      {flagged && (
                        <span className="mt-1 text-xs font-semibold text-coral">
                          {t("famFlagged", lang)}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Summary — real flag count, flagged-sign list, real requestors. */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-teal/10 bg-paper p-6 shadow-lift">
            <span className="absolute left-0 top-0 h-2 w-full bg-coral" aria-hidden="true" />
            <div className="relative z-10">
              <div className="mb-5 flex items-center gap-3">
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
                <ul className="mb-6 space-y-3" role="list">
                  {flaggedSigns.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 rounded-2xl border border-teal/5 bg-sand p-3"
                    >
                      <span className="text-2xl" aria-hidden="true">{s.emoji}</span>
                      <span className="font-bold text-teal">{pick(lang, s.glossEn, s.glossAr)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-6 rounded-2xl bg-sand p-4 text-sm text-muted">
                  {pick(lang, "Tap a sign to flag it.", "اضغط على إشارة لتحديدها.")}
                </p>
              )}

              {/* Requestors */}
              {requestors.length > 0 && (
                <div className="mb-6">
                  <p className="mb-3 font-display text-xs font-bold uppercase tracking-wide text-teal/40">
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

              {flaggedSigns.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="w-full rounded-2xl py-3 font-display font-bold text-teal transition hover:bg-teal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
                >
                  {pick(lang, "Clear all", "مسح الكل")}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Single "Done" affordance (flags persist on tap) ─────────────── */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-sand/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral" aria-hidden="true">
              <Icon name="push_pin" fill />
            </span>
            <p className="truncate text-sm font-bold text-teal">
              {num(flaggedSigns.length, lang)} {t("famFlagged", lang)}
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => go({ name: "family" })} className="shrink-0">
            {pick(lang, "Done", "تم")} ({num(flaggedSigns.length, lang)})
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
}
