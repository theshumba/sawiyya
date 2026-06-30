// All signs · القاموس — the Dictionary tab (Stitch v2 "all-signs--*").
// Browse every sign (A1 vocabulary + the Arabic alphabet) from the frozen content
// layer, see live mastery / flag / review status from the stores, and tap a sign to
// open its detail (mobile bottom-sheet, desktop right panel) → practise it on camera.
//
// Redesign: the global AppNav (via ScreenShell chrome="tabs") owns all navigation, so
// the in-screen Home button is gone and search reclaims that space at every breakpoint.
// The dialect "Coming Soon" affordance has moved to the onboarding / Practise picker —
// the filter row carries only live chips now. One dominant action ("Practise your N
// flagged signs") sits above the grid; the never-hard-fail fallbacks stay but quiet.
import { useMemo, useState } from "react";
import { pick, t } from "../i18n";
import type { Sign } from "../types";
import { ALL_SIGNS } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { isDue } from "../store/srs";
import { useUi } from "../store/ui";
import { Button, Card, Icon, Title } from "../components/ui";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { SignGlyph } from "../components/SignGlyph";
import { Chip } from "../components/Tile";

type Filter = "all" | "learned" | "flagged" | "alphabet" | "unit1" | "unit2";

type Status = "mastered" | "flagged" | "review" | "letter" | "unit" | "new";

const STATUS_META: Record<
  Status,
  { en: string; ar: string; icon: string | null; tone: string }
> = {
  mastered: { en: "Mastered", ar: "متقنة", icon: "check_circle", tone: "text-gold-deep" },
  flagged: { en: "Family list", ar: "قائمة العائلة", icon: "push_pin", tone: "text-coral-deep" },
  review: { en: "Review soon", ar: "للمراجعة", icon: "hourglass_top", tone: "text-gold-deep" },
  letter: { en: "Letter", ar: "حرف", icon: null, tone: "text-teal-deep/60" },
  unit: { en: "Unit 1", ar: "الوحدة ١", icon: null, tone: "text-teal-deep/60" },
  new: { en: "New", ar: "جديدة", icon: null, tone: "text-teal-deep/60" },
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
  const addToReview = useApp((s) => s.addToReview);
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
      if (filter === "learned" && (progress[sign.id]?.masteryLevel ?? 0) === 0) return false;
      if (filter === "flagged" && !flaggedIds.has(sign.id)) return false;
      if (filter === "alphabet" && sign.tier !== "alphabet") return false;
      if (filter === "unit1" && sign.tier !== "A1") return false;
      // Unit 2 is on the roadmap but has no content yet → resolves to the empty
      // "coming soon" state rather than a fabricated set. The chip no longer
      // surfaces this filter (dialect framing moved to the picker), but the rule
      // stays so any deep-link / future chip still gets the honest empty state.
      if (filter === "unit2") return false;
      if (q) {
        const hay = `${sign.glossEn} ${sign.glossAr} ${sign.code ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, query, app.progress, app.flags, app.srs, profile?.id]);

  const selected = selectedId ? ALL_SIGNS.find((s) => s.id === selectedId) ?? null : null;

  // Live filter chips only — the dialect "Coming Soon" pill moved to onboarding /
  // PractiseChooser, and Unit 2 (empty) is no longer offered here.
  const FILTERS: { id: Filter; en: string; ar: string }[] = [
    { id: "all", en: "All", ar: "الكل" },
    { id: "learned", en: "Learned", ar: "المتعلمة" },
    { id: "flagged", en: "Flagged", ar: "المحددة" },
    { id: "alphabet", en: t("prAlphabet", "en"), ar: t("prAlphabet", "ar") },
    { id: "unit1", en: "Unit 1", ar: "الوحدة ١" },
  ];

  // Only gradable (static/alphabet) signs get a camera target. Dynamic signs can't be
  // graded (§9.4); routing them into teach mode let the learner record bogus KNN samples
  // that pollute the recognizer (#2). DetailPanel hides the camera CTA for those.
  const practiceSign = (sign: Sign) => go({ name: "camera", targetSignId: sign.id });

  // ── ONE dominant action above the grid: practise the family-flagged signs ──────
  // Targets the first gradable flagged sign (dynamic flags can't be graded). Demoted
  // to nothing else fights it; falls back silently when no gradable flag exists.
  const flaggedCount = flaggedIds.size;
  const firstGradableFlag = ALL_SIGNS.find((s) => flaggedIds.has(s.id) && s.cameraGradable);

  if (!profile) return <NoProfileFallback />;

  return (
    <ScreenShell lang={lang} chrome="tabs">
      <div className="mx-auto max-w-6xl px-5 pt-6 md:px-8">
        {/* ── Page header: title + search (search reclaims the old Home-btn space) ── */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="min-w-0">
            <Title>{pick(lang, "Sign Dictionary", "القاموس")}</Title>
            <p className="mt-1 font-display text-sm font-semibold text-ink/60">
              {pick(lang, "Qatari Sign Language · خليجي", "لغة الإشارة القطرية · خليجي")}
            </p>
          </div>
          <div className="md:ms-auto md:w-full md:max-w-md">
            <SearchInput lang={lang} value={query} onChange={setQuery} />
          </div>
        </header>

        {/* ── Filter chips (live only) ──────────────────────────────────────────── */}
        <div
          className="no-scrollbar -mx-5 mb-6 flex items-center gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0"
          role="tablist"
          aria-label={pick(lang, "Filter signs", "تصفية الإشارات")}
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <Chip
                key={f.id}
                selected={active}
                onClick={() => setFilter(f.id)}
                ariaLabel={pick(lang, f.en, f.ar)}
                className="px-6"
              >
                <span role="tab" aria-selected={active}>
                  {pick(lang, f.en, f.ar)}
                  {f.id === "learned" && learnedCount > 0 ? (
                    <span className={active ? " text-white/70" : " text-teal/60"}> · {learnedCount}</span>
                  ) : null}
                </span>
              </Chip>
            );
          })}
        </div>

        {/* ── ONE dominant action: practise the flagged signs ───────────────────── */}
        {flaggedCount > 0 && (
          <Button
            variant="primary"
            size="lg"
            full
            // Target the first gradable flagged sign; when none is gradable, still
            // open the camera (generic) so flagged-but-non-gradable isn't a dead end.
            onClick={() => (firstGradableFlag ? practiceSign(firstGradableFlag) : go({ name: "camera" }))}
            className="mb-6 flex items-center justify-center gap-3"
          >
            <Icon name="videocam" className="text-2xl" />
            {pick(
              lang,
              `Practise your ${flaggedCount} flagged ${flaggedCount === 1 ? "sign" : "signs"}`,
              `تدرّب على ${flaggedCount} إشارة محدّدة`,
            )}
          </Button>
        )}

        {/* ── Grid + detail panel ─────────────────────────────────────────────── */}
        <div className="md:flex md:gap-8">
          <div className="md:flex-1">
            {signs.length === 0 ? (
              <Card variant="flat" className="flex flex-col items-center gap-4 p-8 text-center md:p-10">
                <p className="font-display font-semibold text-muted">
                  {filter === "unit2"
                    ? pick(lang, "Unit 2 is coming soon.", "الوحدة ٢ قريباً.")
                    : pick(lang, "No signs match.", "لا توجد إشارات مطابقة.")}
                </p>
                {filter !== "unit2" && (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {query && (
                      <Button variant="secondary" size="md" onClick={() => setQuery("")}>
                        {pick(lang, "Clear search", "مسح البحث")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setFilter("all");
                        setQuery("");
                      }}
                    >
                      {pick(lang, "Browse all signs", "تصفّح كل الإشارات")}
                    </Button>
                  </div>
                )}
              </Card>
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
            <div className="sticky top-8">
              {selected ? (
                <DetailPanel
                  sign={selected}
                  status={statusOf(selected)}
                  flagged={flaggedIds.has(selected.id)}
                  lang={lang}
                  rtl={rtl}
                  variant="panel"
                  onClose={() => setSelectedId(null)}
                  onPractice={() => practiceSign(selected)}
                  onToggleFlag={() => profile && toggleFlag(selected.id, profile.id)}
                  onAddReview={() => addToReview(selected.id)}
                />
              ) : (
                <Card variant="flat" className="flex flex-col items-center justify-center border-dashed bg-paper/50 px-8 py-20 text-center">
                  <Icon name="touch_app" className="mb-3 text-4xl text-teal/40" />
                  <p className="font-display font-semibold text-muted">
                    {pick(lang, "Pick a sign to see how it's made.", "اختر إشارة لترى كيف تُؤدّى.")}
                  </p>
                </Card>
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
          <div className="fixed inset-x-0 bottom-0 z-50 animate-rise rounded-t-3xl bg-paper p-6 pb-10 shadow-lift">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/10" aria-hidden="true" />
            <DetailPanel
              sign={selected}
              status={statusOf(selected)}
              flagged={flaggedIds.has(selected.id)}
              lang={lang}
              rtl={rtl}
              variant="sheet"
              onClose={() => setSelectedId(null)}
              onPractice={() => practiceSign(selected)}
              onToggleFlag={() => profile && toggleFlag(selected.id, profile.id)}
              onAddReview={() => addToReview(selected.id)}
            />
          </div>
        </div>
      )}
    </ScreenShell>
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
        className="w-full rounded-2xl border-2 border-line bg-paper py-3.5 ps-12 pe-4 font-sans font-medium text-ink transition placeholder:text-ink/30 focus-visible:border-teal focus-visible:outline-none"
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
    <Card
      variant={selected ? "selected" : "elevated"}
      onClick={onSelect}
      ariaPressed={selected}
      className="group relative flex flex-col items-center p-5 text-center md:p-6"
    >
      {meta.icon && (
        <span className={`absolute end-3 top-3 ${meta.tone}`}>
          <Icon name={meta.icon} fill className="text-lg md:text-2xl" />
        </span>
      )}
      <div className="mb-3 flex aspect-square w-full items-center justify-center rounded-2xl bg-sand/60 p-3">
        {/* Real hand (alphabet skeleton) / brand image (iloveyou) / honest sign icon
            for un-recorded words — via SignGlyph, the one source of truth. No emoji. */}
        <SignGlyph sign={sign} lang={lang} className="text-4xl md:text-5xl" imgClassName="h-4/5 w-4/5 rounded-2xl object-cover" />
      </div>
      <p className={`font-display font-bold ${selected ? "text-teal" : "text-ink"} md:text-lg`}>
        {label}
        <span className="text-ink/50"> · {sign.code ? sign.code : sign.glossAr}</span>
      </p>
      <p className={`mt-1 text-[11px] font-bold uppercase tracking-widest md:text-xs ${meta.tone}`}>
        {pick(lang, meta.en, meta.ar)}
      </p>
    </Card>
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
  onAddReview: () => void;
}) {
  const [watched, setWatched] = useState(false);
  const title = pick(lang, sign.glossEn, sign.glossAr);
  const hint = pick(lang, sign.hintEn, sign.hintAr);
  const isPanel = variant === "panel";
  const tags = categoryTags(sign, lang);

  // Watch is a pure preview of the reference — browsing a sign must not seed SRS
  // cards or inflate "Learned" counts (#M5); only drills and Add-to-Review do that.
  const handleWatch = () => setWatched(true);

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
          ? "flex flex-col rounded-3xl border border-line bg-paper p-6 shadow-lift"
          : "flex flex-col"
      }
    >
      {/* header row — favorite (desktop) + close, mobile-first single tree */}
      <div className="mb-5 flex items-start justify-between gap-3">
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
              ? "border-coral/30 bg-coral/10 text-coral-deep"
              : "border-line text-coral-deep hover:bg-coral/5"
          }`}
        >
          <Icon name="favorite" fill={flagged} />
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label={t("close", lang)}
          className="ms-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-line text-teal transition hover:bg-teal/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <Icon name="close" />
        </button>
      </div>

      {/* big demo illustration (honest placeholder asset from the content layer).
          The reference-clip slot lives behind the Watch chip (SRS-safe). */}
      <div className="relative mb-6 flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-sand">
        <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 via-transparent to-teal/5" aria-hidden="true" />
        {/* Real handshape / brand image / honest icon via SignGlyph — never an emoji. */}
        <span className="relative z-10 flex h-4/5 w-4/5 items-center justify-center">
          <SignGlyph sign={sign} lang={lang} className="text-8xl" imgClassName="h-full w-full rounded-3xl object-contain" />
        </span>

        {/* Watch / Watch Again replay chip — central preview affordance (NO store write). */}
        <button
          type="button"
          onClick={handleWatch}
          className="absolute bottom-6 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-paper/90 px-6 py-2 font-display font-bold text-teal shadow-lift backdrop-blur transition hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <Icon name="replay" className="text-xl" />
          {watched
            ? pick(lang, "Watch Again", "شاهد مجدداً")
            : pick(lang, "Watch", "شاهد")}
        </button>
      </div>

      {/* title + semantic category tags — ONE responsive block (de-twinned) */}
      <div className="mb-6 flex flex-col text-start md:items-center md:text-center">
        <h2 className="font-display text-2xl font-black text-ink md:text-3xl">
          {title}
          <span className="text-ink/50"> · {sign.code ? sign.code : sign.glossAr}</span>
        </h2>
        <div className="mt-3 flex flex-wrap gap-2 md:justify-center">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest md:px-4 ${
                tag.tone === "teal" ? "bg-teal/10 text-teal" : "bg-gold/20 text-teal-deep"
              }`}
            >
              {tag.label}
            </span>
          ))}
          {/* mobile carries the live status chip; desktop panel keeps it tag-only */}
          <span className={`rounded-full bg-ink/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest md:hidden ${STATUS_META[status].tone}`}>
            {pick(lang, STATUS_META[status].en, STATUS_META[status].ar)}
          </span>
        </div>
      </div>

      {/* how to sign */}
      <div className="mb-6 rounded-3xl border border-line bg-sand/50 p-5" dir={rtl ? "rtl" : "ltr"}>
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal">
          <Icon name="info" className="text-base" />
          {pick(lang, "How to sign", "كيف تُؤدّى")}
        </h3>
        <p className="text-sm leading-relaxed text-ink/80">{hint}</p>
      </div>

      {/* actions — 3-tier hierarchy: primary coral camera, secondary teal review/flag,
          tertiary share. cameraGradable gate keeps the camera off dynamic signs (§9.4). */}
      <div className="mt-auto flex flex-col gap-3">
        {sign.cameraGradable ? (
          <Button
            variant="primary"
            size="lg"
            full
            onClick={onPractice}
            className="flex items-center justify-center gap-3"
          >
            <Icon name="videocam" className="text-2xl" />
            {t("practiceCamera", lang)}
          </Button>
        ) : (
          // Non-gradable (moving) sign — camera can't grade it, so steer to Watch (§9.4).
          <p className="flex items-center justify-center gap-2 rounded-2xl bg-sand px-6 py-4 text-center font-display text-sm font-semibold text-ink/70">
            <Icon name="info" className="text-lg text-teal" />
            {pick(lang, "Watch the reference — this sign moves, so the camera can't grade it yet.", "شاهد المرجع — هذه إشارة متحركة، لا تستطيع الكاميرا تقييمها بعد.")}
          </p>
        )}

        {/* desktop: Add to Daily Review (SRS) — secondary teal. */}
        <Button
          variant="secondary"
          size="md"
          full
          onClick={onAddReview}
          className="hidden items-center justify-center gap-2 md:flex"
        >
          <Icon name="event_repeat" />
          {pick(lang, "Add to Daily Review", "أضِف للمراجعة اليومية")}
        </Button>

        {/* mobile: Flag (secondary teal, aria-pressed) + Share (tertiary ghost) row. */}
        <div className="flex gap-3 md:hidden">
          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={flagged}
            className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-display font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
              flagged
                ? "bg-teal text-white extruded-teal"
                : "border-2 border-teal/30 bg-transparent text-teal active:scale-[.98]"
            }`}
          >
            <Icon name="push_pin" fill={flagged} />
            {flagged
              ? pick(lang, "Flagged", "محدّدة")
              : pick(lang, "Flag", "حدّد")}
          </button>
          <Button
            variant="ghost"
            size="md"
            full
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2"
          >
            <Icon name="share" />
            {pick(lang, "Share", "شارك")}
          </Button>
        </div>
      </div>
    </div>
  );
}
