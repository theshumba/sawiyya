// All signs · القاموس — the Library / Sign Dictionary (Stitch v2 "all-signs--*").
// Browse every sign (A1 vocabulary + the Arabic alphabet) from the frozen content
// layer, see live mastery / flag / review status from the stores, and tap a sign to
// open its detail (mobile bottom-sheet, desktop right panel) → practise it on camera.
//
// Faithful to: design/stitch-v2-brand/all-signs--mobile.png + all-signs--desktop.png
// and the matching html/ files. The global BottomNav (App.tsx) provides nav on both
// breakpoints, so this screen owns only the dictionary chrome (top bar, filters,
// search, grid, detail panel) and leaves room for that nav.
import { useMemo, useState } from "react";
import { pick, t } from "../i18n";
import type { Sign } from "../types";
import { ALL_SIGNS } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { isDue } from "../store/srs";
import { useUi } from "../store/ui";
import { Icon } from "../components/ui";

type Filter = "all" | "learned" | "flagged" | "alphabet" | "unit1" | "unit2";

type Status = "mastered" | "flagged" | "review" | "letter" | "unit" | "new";

const STATUS_META: Record<
  Status,
  { en: string; ar: string; icon: string | null; tone: string }
> = {
  mastered: { en: "Mastered", ar: "متقنة", icon: "check_circle", tone: "text-gold" },
  flagged: { en: "Family list", ar: "قائمة العائلة", icon: "push_pin", tone: "text-coral" },
  review: { en: "Review soon", ar: "للمراجعة", icon: "hourglass_top", tone: "text-gold" },
  letter: { en: "Letter", ar: "حرف", icon: null, tone: "text-teal/40" },
  unit: { en: "Unit 1", ar: "الوحدة ١", icon: null, tone: "text-teal/40" },
  new: { en: "New", ar: "جديدة", icon: null, tone: "text-teal/40" },
};

// Semantic category tags for the detail panel (Stitch shows "Phrase / Common"
// style chips, not status). Derived honestly from the frozen content metadata.
function categoryTags(sign: Sign, lang: "en" | "ar"): { label: string; tone: "teal" | "gold" }[] {
  const tags: { label: string; tone: "teal" | "gold" }[] = [];
  if (sign.tier === "alphabet") {
    tags.push({ label: pick(lang, "Alphabet", "الحروف"), tone: "teal" });
  } else {
    tags.push({ label: pick(lang, "Unit 1", "الوحدة ١"), tone: "teal" });
  }
  tags.push(
    sign.type === "dynamic"
      ? { label: pick(lang, "Phrase", "عبارة"), tone: "gold" }
      : { label: pick(lang, "Common", "شائعة"), tone: "gold" },
  );
  return tags;
}

export function AllSigns() {
  const app = useApp();
  const go = useUi((s) => s.go);
  const toggleFlag = useApp((s) => s.toggleFlag);
  const recordDrillResult = useApp((s) => s.recordDrillResult);
  const profile = activeProfile(app);
  const lang = profile?.language ?? "en";
  const rtl = lang === "ar";

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── live status off the real stores (mastery / flags / SRS due) ──────────────
  const progress = (profile && app.progress[profile.id]) || {};
  const cards = (profile && app.srs[profile.id]) || {};
  const flaggedIds = useMemo(
    () => new Set(app.flags.filter((f) => f.active).map((f) => f.signId)),
    [app.flags],
  );

  const statusOf = (sign: Sign): Status => {
    const mastery = progress[sign.id]?.masteryLevel ?? 0;
    if (flaggedIds.has(sign.id)) return "flagged";
    if (mastery >= 3) return "mastered";
    const card = cards[sign.id];
    if (card && isDue(card)) return "review";
    if (sign.tier === "alphabet") return "letter";
    if (mastery > 0) return "unit";
    return sign.tier === "A1" ? "unit" : "new";
  };

  const learnedCount = ALL_SIGNS.filter((s) => (progress[s.id]?.masteryLevel ?? 0) > 0).length;

  // ── filter + search ──────────────────────────────────────────────────────────
  const signs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_SIGNS.filter((sign) => {
      const st = statusOf(sign);
      if (filter === "learned" && (progress[sign.id]?.masteryLevel ?? 0) === 0) return false;
      if (filter === "flagged" && !flaggedIds.has(sign.id)) return false;
      if (filter === "alphabet" && sign.tier !== "alphabet") return false;
      if (filter === "unit1" && sign.tier !== "A1") return false;
      // Unit 2 is on the roadmap (Stitch shows the chip) but has no content yet →
      // resolves to the empty "coming soon" state rather than a fabricated set.
      if (filter === "unit2") return false;
      void st;
      if (q) {
        const hay = `${sign.glossEn} ${sign.glossAr} ${sign.code ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, query, app.progress, app.flags, app.srs, profile?.id]);

  const selected = selectedId ? ALL_SIGNS.find((s) => s.id === selectedId) ?? null : null;

  const FILTERS: { id: Filter; en: string; ar: string }[] = [
    { id: "all", en: "All", ar: "الكل" },
    { id: "learned", en: "Learned", ar: "المتعلمة" },
    { id: "flagged", en: "Flagged", ar: "المحددة" },
    { id: "alphabet", en: t("prAlphabet", "en"), ar: t("prAlphabet", "ar") },
    { id: "unit1", en: "Unit 1", ar: "الوحدة ١" },
    { id: "unit2", en: "Unit 2", ar: "الوحدة ٢" },
  ];

  // Replay / "Watch" — honest SRS engagement: seeds the card + marks the sign seen
  // (watch-level XP, never a fake graded success) so the dictionary stays wired.
  const watchSign = (id: string) => recordDrillResult(id, "good", { watch: true });

  return (
    <div className="min-h-dvh bg-sand pb-28 md:pb-24">
      {/* ── Top app bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b-4 border-teal/10 bg-sand/95 backdrop-blur md:px-8">
        <div className="mx-auto flex h-20 max-w-6xl items-center gap-4 px-5">
          <h1 className="font-display text-2xl font-black tracking-tight text-teal md:text-3xl">
            {pick(lang, "Sign Dictionary", "القاموس")}
            <span className="hidden text-teal/40 md:inline"> · {pick(lang, "القاموس", "Sign Dictionary")}</span>
          </h1>

          {/* desktop search lives in the bar */}
          <div className="ms-auto hidden max-w-md flex-1 md:block">
            <SearchInput lang={lang} value={query} onChange={setQuery} />
          </div>

          <button
            type="button"
            onClick={() => go({ name: "home" })}
            className="ms-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-teal transition hover:bg-teal/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal md:ms-3"
            aria-label={t("navHome", lang)}
          >
            <Icon name="home" className="text-2xl" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-5 md:px-8 md:pt-6">
        {/* mobile subtitle line (desktop carries the dialect pill inline in the filter row) */}
        <div className="mb-5 md:hidden">
          <p className="flex flex-wrap items-center gap-2 font-display text-sm font-semibold text-ink/70">
            {pick(lang, "Qatari Sign Language · خليجي", "لغة الإشارة القطرية · خليجي")}
          </p>
        </div>

        {/* mobile search */}
        <div className="mb-5 md:hidden">
          <SearchInput lang={lang} value={query} onChange={setQuery} />
        </div>

        {/* ── Filter chips ────────────────────────────────────────────────── */}
        <div
          className="no-scrollbar -mx-5 mb-6 flex items-center gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0"
          role="tablist"
          aria-label={pick(lang, "Filter signs", "تصفية الإشارات")}
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`whitespace-nowrap rounded-full px-6 py-2 font-display font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                  active
                    ? "bg-teal text-paper extruded-teal"
                    : "border-2 border-teal/10 bg-paper text-ink/70 hover:bg-teal/5"
                }`}
              >
                {pick(lang, f.en, f.ar)}
                {f.id === "learned" && learnedCount > 0 ? (
                  <span className={active ? " text-paper/70" : " text-teal/50"}> · {learnedCount}</span>
                ) : null}
              </button>
            );
          })}

          {/* Dialect "Coming Soon" pill — right-aligned, inline in the filter row (desktop). */}
          <div className="ms-auto hidden shrink-0 ps-3 md:flex md:items-center">
            <span className="group relative inline-flex items-center gap-2 overflow-hidden whitespace-nowrap rounded-full border-2 border-gold/40 bg-gold/20 px-6 py-2 font-display font-bold text-teal-deep">
              {pick(lang, "Qatari Sign Language · خليجي", "لغة الإشارة القطرية · خليجي")}
              <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-ink">
                {pick(lang, "Coming Soon", "قريباً")}
              </span>
              <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-1000 group-hover:translate-x-full" aria-hidden="true" />
            </span>
          </div>
        </div>

        {/* ── Grid + detail panel ─────────────────────────────────────────── */}
        <div className="md:flex md:gap-8">
          <div className="md:flex-1">
            {signs.length === 0 ? (
              <p className="rounded-3xl border-2 border-teal/10 bg-paper p-10 text-center font-display font-semibold text-muted">
                {filter === "unit2"
                  ? pick(lang, "Unit 2 is coming soon.", "الوحدة ٢ قريباً.")
                  : pick(lang, "No signs match.", "لا توجد إشارات مطابقة.")}
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {signs.map((sign) => (
                  <li key={sign.id}>
                    <SignCard
                      sign={sign}
                      status={statusOf(sign)}
                      selected={selectedId === sign.id}
                      lang={lang}
                      onSelect={() => setSelectedId(sign.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* desktop detail panel (docked) */}
          <aside className="hidden md:block md:w-[380px] md:shrink-0">
            <div className="sticky top-28">
              {selected ? (
                <DetailPanel
                  sign={selected}
                  status={statusOf(selected)}
                  flagged={flaggedIds.has(selected.id)}
                  lang={lang}
                  rtl={rtl}
                  variant="panel"
                  onClose={() => setSelectedId(null)}
                  onPractice={() => go({ name: "camera", targetSignId: selected.id })}
                  onToggleFlag={() => profile && toggleFlag(selected.id, profile.id)}
                  onWatch={() => watchSign(selected.id)}
                  onAddReview={() => watchSign(selected.id)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-teal/15 bg-paper/50 px-8 py-20 text-center">
                  <Icon name="touch_app" className="mb-3 text-4xl text-teal/40" />
                  <p className="font-display font-semibold text-muted">
                    {pick(lang, "Pick a sign to see how it's made.", "اختر إشارة لترى كيف تُؤدّى.")}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* mobile bottom-sheet detail */}
      {selected && (
        <div className="md:hidden">
          <button
            type="button"
            aria-label={t("close", lang)}
            onClick={() => setSelectedId(null)}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 animate-rise rounded-t-[2.5rem] bg-paper p-6 pb-10 shadow-lift">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/10" aria-hidden="true" />
            <DetailPanel
              sign={selected}
              status={statusOf(selected)}
              flagged={flaggedIds.has(selected.id)}
              lang={lang}
              rtl={rtl}
              variant="sheet"
              onClose={() => setSelectedId(null)}
              onPractice={() => go({ name: "camera", targetSignId: selected.id })}
              onToggleFlag={() => profile && toggleFlag(selected.id, profile.id)}
              onWatch={() => watchSign(selected.id)}
              onAddReview={() => watchSign(selected.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Search input ───────────────────────────────────────────────────────────────
function SearchInput({
  lang,
  value,
  onChange,
}: {
  lang: "en" | "ar";
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Icon
        name="search"
        className="pointer-events-none absolute inset-y-0 start-4 my-auto h-fit text-teal/60"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={pick(lang, "Search signs…", "ابحث عن إشارة…")}
        aria-label={pick(lang, "Search signs", "ابحث عن إشارة")}
        className="w-full rounded-2xl border-4 border-teal/10 bg-paper py-4 ps-12 pe-4 font-sans font-medium text-ink transition placeholder:text-ink/30 focus-visible:border-teal focus-visible:outline-none md:rounded-full md:border-2 md:py-3"
      />
    </div>
  );
}

// ── Grid card ──────────────────────────────────────────────────────────────────
function SignCard({
  sign,
  status,
  selected,
  lang,
  onSelect,
}: {
  sign: Sign;
  status: Status;
  selected: boolean;
  lang: "en" | "ar";
  onSelect: () => void;
}) {
  const meta = STATUS_META[status];
  const label = pick(lang, sign.glossEn, sign.glossAr);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex w-full flex-col items-center rounded-3xl border-2 p-4 text-center transition active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal md:p-6 ${
        selected
          ? "border-teal bg-teal/5 ring-4 ring-teal/10"
          : "border-teal/10 bg-paper extruded-paper hover:border-teal/40"
      }`}
    >
      {meta.icon && (
        <span className={`absolute end-3 top-3 ${meta.tone}`}>
          <Icon name={meta.icon} fill className="text-lg md:text-2xl" />
        </span>
      )}
      <div className="mb-3 flex aspect-square w-full items-center justify-center rounded-2xl bg-sand/60">
        {sign.code ? (
          <span className="font-display text-4xl font-black text-teal md:text-5xl" dir="rtl">
            {sign.code}
          </span>
        ) : (
          <span className="text-5xl md:text-6xl" aria-hidden="true">
            {sign.emoji}
          </span>
        )}
      </div>
      <p className={`font-display font-bold ${selected ? "text-teal" : "text-ink"} md:text-lg`}>
        {label}
        <span className="text-ink/50"> · {sign.code ? sign.code : sign.glossAr}</span>
      </p>
      <p className={`mt-1 text-[11px] font-bold uppercase tracking-widest md:text-xs ${meta.tone}`}>
        {pick(lang, meta.en, meta.ar)}
      </p>
    </button>
  );
}

// ── Detail (shared by mobile sheet + desktop panel) ──────────────────────────────
function DetailPanel({
  sign,
  status,
  flagged,
  lang,
  rtl,
  variant,
  onClose,
  onPractice,
  onToggleFlag,
  onWatch,
  onAddReview,
}: {
  sign: Sign;
  status: Status;
  flagged: boolean;
  lang: "en" | "ar";
  rtl: boolean;
  variant: "sheet" | "panel";
  onClose: () => void;
  onPractice: () => void;
  onToggleFlag: () => void;
  onWatch: () => void;
  onAddReview: () => void;
}) {
  const [watched, setWatched] = useState(false);
  const title = pick(lang, sign.glossEn, sign.glossAr);
  const hint = pick(lang, sign.hintEn, sign.hintAr);
  const isPanel = variant === "panel";
  const tags = categoryTags(sign, lang);

  const handleWatch = () => {
    onWatch();
    setWatched(true);
  };

  const handleShare = async () => {
    const text = `${pick(lang, sign.glossEn, sign.glossAr)} · ${sign.code ?? sign.glossAr}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Sawiyya", text });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  };

  return (
    <div
      className={
        isPanel
          ? "flex flex-col rounded-[40px] border-2 border-teal/5 bg-paper p-6 shadow-lift"
          : "flex flex-col"
      }
    >
      {/* header row */}
      <div className="mb-5 flex items-start justify-between gap-3">
        {/* desktop: close on the left, heart/favorite on the right (Stitch frame) */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close", lang)}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-teal/10 text-teal transition hover:bg-teal/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal md:flex"
        >
          <Icon name="close" />
        </button>

        <div className="md:hidden">
          <h2 className="font-display text-2xl font-black text-ink">
            {title}
            <span className="text-ink/50"> · {sign.code ? sign.code : sign.glossAr}</span>
          </h2>
        </div>

        {/* mobile close (right) / desktop favorite (right) */}
        <button
          type="button"
          onClick={onToggleFlag}
          aria-pressed={flagged}
          aria-label={
            flagged
              ? pick(lang, "Remove from family list", "أزِل من قائمة العائلة")
              : pick(lang, "Add to family list", "أضِف إلى قائمة العائلة")
          }
          className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral md:flex ${
            flagged
              ? "border-coral/30 bg-coral/10 text-coral"
              : "border-teal/10 text-coral hover:bg-coral/5"
          }`}
        >
          <Icon name="favorite" fill={flagged} />
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label={t("close", lang)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-teal/10 text-teal transition hover:bg-teal/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal md:hidden"
        >
          <Icon name="close" />
        </button>
      </div>

      {/* desktop title + semantic tags (centred under the illustration in Stitch; here above it for panel flow) */}

      {/* big demo illustration (honest placeholder asset from the content layer) */}
      <div className="relative mb-6 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white bg-sand">
        <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 via-transparent to-teal/5" aria-hidden="true" />
        {sign.code ? (
          <span className="relative z-10 font-display text-8xl font-black text-teal" dir="rtl">
            {sign.code}
          </span>
        ) : (
          <span className="relative z-10 text-8xl" aria-hidden="true">
            {sign.emoji}
          </span>
        )}

        {/* Watch / Watch Again replay chip — the central affordance in both Stitch frames. */}
        <button
          type="button"
          onClick={handleWatch}
          className={`absolute z-20 inline-flex items-center gap-2 rounded-full bg-paper/90 px-6 py-2 font-display font-bold text-teal shadow-lift backdrop-blur transition hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
            isPanel ? "bottom-6 left-1/2 -translate-x-1/2" : "bottom-4 end-4 border-2 border-gold text-ink"
          }`}
        >
          <Icon
            name="replay"
            fill={!isPanel}
            className={isPanel ? "text-xl" : "text-xl text-gold"}
          />
          {watched
            ? pick(lang, "Watch Again", "شاهد مجدداً")
            : pick(lang, "Watch", "شاهد")}
        </button>
      </div>

      {/* desktop title + semantic category tags */}
      <div className="mb-6 hidden flex-col items-center text-center md:flex">
        <h2 className="font-display text-3xl font-black text-ink">
          {title}
          <span className="text-ink/50"> · {sign.code ? sign.code : sign.glossAr}</span>
        </h2>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className={`rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest ${
                tag.tone === "teal" ? "bg-teal/10 text-teal" : "bg-gold/20 text-teal-deep"
              }`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* mobile semantic category tags */}
      <div className="mb-6 flex flex-wrap gap-2 md:hidden">
        {tags.map((tag) => (
          <span
            key={tag.label}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
              tag.tone === "teal" ? "bg-teal/10 text-teal" : "bg-gold/20 text-teal-deep"
            }`}
          >
            {tag.label}
          </span>
        ))}
        <span className={`rounded-full bg-ink/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_META[status].tone}`}>
          {pick(lang, STATUS_META[status].en, STATUS_META[status].ar)}
        </span>
      </div>

      {/* how to sign */}
      <div className="mb-6 rounded-3xl border-2 border-teal/5 bg-sand/50 p-5" dir={rtl ? "rtl" : "ltr"}>
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal">
          <Icon name="info" className="text-base" />
          {pick(lang, "How to sign", "كيف تُؤدّى")}
        </h3>
        <p className="text-sm leading-relaxed text-ink/80">{hint}</p>
      </div>

      {/* actions */}
      <div className="mt-auto flex flex-col gap-3">
        <button
          type="button"
          onClick={onPractice}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-coral px-6 py-4 font-display text-lg font-bold text-white extruded-coral transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <Icon name="videocam" className="text-2xl" />
          {pick(lang, "Practise with camera", "تدرّب بالكاميرا")}
        </button>

        {/* desktop: Add to Daily Review (SRS). mobile: Flagged + Share row (Stitch sheet). */}
        <button
          type="button"
          onClick={onAddReview}
          className="hidden w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-teal/20 bg-teal/10 px-6 py-3.5 font-display font-bold text-teal transition hover:bg-teal/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal md:flex"
        >
          <Icon name="event_repeat" />
          {pick(lang, "Add to Daily Review", "أضِف للمراجعة اليومية")}
        </button>

        <div className="flex gap-3 md:hidden">
          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={flagged}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-display font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
              flagged
                ? "bg-teal text-paper extruded-teal"
                : "border-b-4 border-teal/20 bg-teal/10 text-teal hover:bg-teal/20"
            }`}
          >
            <Icon name="push_pin" fill={flagged} />
            {flagged
              ? pick(lang, "Flagged", "محدّدة")
              : pick(lang, "Flag", "حدّد")}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-b-4 border-teal/20 bg-sand px-4 py-3.5 font-display font-bold text-teal transition hover:bg-teal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <Icon name="share" />
            {pick(lang, "Share", "شارك")}
          </button>
        </div>
      </div>
    </div>
  );
}
