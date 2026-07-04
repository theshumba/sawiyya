// All signs · القاموس — the Dictionary tab (design rebuild · "Sawiyya Signs.dc.html").
// Browse every sign (A1 vocabulary + the Arabic alphabet) from the frozen content
// layer, see live mastery / flag / review status from the stores, and tap a sign to
// open its detail (mobile bottom-sheet, desktop right panel) → practise it on camera.
//
// Reskin: four design states collapse into ONE screen — dict/browse (default),
// alphabet grid (filter === "alphabet"), sign detail (selectedId), and search
// (query). All logic, store wiring, camera gating, and honest empty/never-fake-grade
// branches are preserved; only the visuals are repainted to the design tokens.
import { useMemo, useState } from "react";
import { pick, t } from "../i18n";
import type { Lang, Sign } from "../types";
import { ALL_SIGNS } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { isDue } from "../store/srs";
import { useUi } from "../store/ui";
import { Icon, Title } from "../components/ui";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { SignGlyph } from "../components/SignGlyph";
import { MonoLabel, SpringButton, toLocaleDigits } from "../components/dc";
import { useDialog } from "../components/useDialog";

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

// Semantic category tags for the detail panel (design shows "Word / Letter"
// style chips). Derived honestly from the frozen content metadata.
function categoryTags(sign: Sign, lang: Lang): { label: string; tone: "teal" | "gold" }[] {
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

// Honest graded/motion signal — driven off sign.cameraGradable (§B6). Small
// mono pill: teal for camera-graded, gold for watch-&-practise (motion) signs.
function TypeBadge({ gradable, lang }: { gradable: boolean; lang: Lang }) {
  return (
    <span
      className="flex-none rounded-lg px-[9px] py-1.5 font-mono text-[9px] font-bold uppercase leading-none tracking-[0.04em]"
      style={
        gradable
          ? { backgroundColor: "#E6F0EE", color: "#0F6E6A" }
          : { backgroundColor: "#FBEFE6", color: "#C89A3D" }
      }
    >
      {gradable ? t("signBadgeGraded", lang) : t("signBadgeMotion", lang)}
    </span>
  );
}

export function AllSigns({ initialSignId }: { initialSignId?: string }) {
  const app = useApp();
  const go = useUi((s) => s.go);
  const toggleFlag = useApp((s) => s.toggleFlag);
  const addToReview = useApp((s) => s.addToReview);
  const profile = activeProfile(app);
  const lang = profile?.language ?? "en";
  const rtl = lang === "ar";

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  // Deep-linkable detail (H5): flagged non-gradable signs land here on their
  // exact watch/dictionary surface instead of the wrong camera target.
  const [selectedId, setSelectedId] = useState<string | null>(initialSignId ?? null);

  // ── live status off the real stores (mastery / flags / SRS due) ──────────────
  const progress = (profile && app.progress[profile.id]) || {};
  const cards = (profile && app.srs[profile.id]) || {};
  const flaggedIds = useMemo(
    () => new Set(app.flags.filter((f) => f.active && !f.archived).map((f) => f.signId)),
    [app.flags],
  );
  // H7 honesty for the detail panel's flag control: who is the caller to this flag?
  const flagRoleOf = (signId: string): FlagRole => {
    if (!profile) return "none";
    const f = app.flags.find((x) => x.signId === signId && x.active && !x.archived);
    if (!f) return "none";
    if (f.raisedByProfileId === profile.id || profile.role === "deaf") return "owner";
    return f.supporters.includes(profile.id) ? "supporter" : "other";
  };

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
  // H16: focus the mobile bottom-sheet on open, trap Tab, Escape/backdrop to
  // dismiss, restore focus to the card that opened it. Desktop's docked panel
  // is inline content, not a floating dialog, so it's untouched.
  const sheetRef = useDialog<HTMLDivElement>(Boolean(selected), () => setSelectedId(null));

  // ── alphabet grid (§B / §5): a dedicated 4-col letter treatment folded into the
  // existing alphabet filter — progress + learned/current/locked cell states. ──────
  const alphaMode = filter === "alphabet";
  const alphaSigns = useMemo(() => ALL_SIGNS.filter((s) => s.tier === "alphabet"), []);
  const alphaLearned = alphaSigns.filter((s) => (progress[s.id]?.masteryLevel ?? 0) > 0).length;
  const alphaCurrentId = alphaSigns.find((s) => (progress[s.id]?.masteryLevel ?? 0) === 0)?.id ?? null;
  const alphaPct = Math.min(100, Math.round((alphaLearned / 28) * 100));

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
  const firstFlaggedId = ALL_SIGNS.find((s) => flaggedIds.has(s.id))?.id;

  if (!profile) return <NoProfileFallback />;

  return (
    <ScreenShell lang={lang} chrome="tabs">
      <div className="mx-auto max-w-6xl px-5 pt-6 md:px-8">
        {/* ── Page header: title + search (search reclaims the old Home-btn space) ── */}
        <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="min-w-0">
            <Title as="h1">{pick(lang, "Sign Dictionary", "القاموس")}</Title>
            <p className="mt-1 font-sans text-sm font-semibold text-ink/70">
              {pick(lang, "Qatari Sign Language · خليجي", "لغة الإشارة القطرية · خليجي")}
            </p>
          </div>
          <div className="md:ms-auto md:w-full md:max-w-md">
            <SearchInput lang={lang} value={query} onChange={setQuery} />
          </div>
        </header>

        {/* ── Filter chips (live only, L11: role="group" — these are filters, not
            tabs with an associated tabpanel/keyboard arrow-nav) ─────────────── */}
        <div
          className="no-scrollbar -mx-5 mb-6 flex items-center gap-[7px] overflow-x-auto px-5 pb-1 md:mx-0 md:px-0"
          role="group"
          aria-label={pick(lang, "Filter signs", "تصفية الإشارات")}
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                aria-label={pick(lang, f.en, f.ar)}
                onClick={() => setFilter(f.id)}
                style={active ? { boxShadow: "0 3px 0 #0A4F4C" } : undefined}
                className={`flex-none rounded-full px-[13px] py-2 font-sans text-xs font-semibold leading-none transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${
                  active ? "bg-teal text-paper" : "border border-line bg-sand text-muted"
                }`}
              >
                {pick(lang, f.en, f.ar)}
                {f.id === "learned" && learnedCount > 0 ? (
                  <span className={active ? "text-paper/70" : "text-teal"}>
                    {" · "}
                    {toLocaleDigits(learnedCount, lang)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ── ONE dominant action: practise the flagged signs (springy primary) ─── */}
        {flaggedCount > 0 && (
          <SpringButton
            variant="teal"
            size="lg"
            full
            // Target the first gradable flagged sign; when none is gradable open
            // the first flagged sign's OWN detail (watch surface) — the old
            // generic-camera fallback dropped learners onto Alif, the wrong
            // sign entirely (H5).
            onClick={() =>
              firstGradableFlag
                ? practiceSign(firstGradableFlag)
                : setSelectedId(firstFlaggedId ?? null)
            }
            className="mb-6 gap-3"
          >
            <Icon name="videocam" className="text-2xl" />
            {pick(
              lang,
              `Practise your ${flaggedCount} flagged ${flaggedCount === 1 ? "sign" : "signs"}`,
              `تدرّب على ${toLocaleDigits(flaggedCount, lang)} إشارة محدّدة`,
            )}
          </SpringButton>
        )}

        {/* ── Content + detail panel ──────────────────────────────────────────── */}
        <div className="md:flex md:gap-8">
          <div className="md:flex-1">
            {signs.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-[20px] border border-line bg-paper p-8 text-center md:p-10">
                <p className="font-display font-semibold text-muted">
                  {filter === "unit2"
                    ? pick(lang, "Unit 2 is coming soon.", "الوحدة ٢ قريباً.")
                    : pick(lang, "No signs match.", "لا توجد إشارات مطابقة.")}
                </p>
                {filter !== "unit2" && (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {query && (
                      <SpringButton variant="ghost" size="md" onClick={() => setQuery("")}>
                        {pick(lang, "Clear search", "مسح البحث")}
                      </SpringButton>
                    )}
                    <SpringButton
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setFilter("all");
                        setQuery("");
                      }}
                    >
                      {pick(lang, "Browse all signs", "تصفّح كل الإشارات")}
                    </SpringButton>
                  </div>
                )}
              </div>
            ) : alphaMode ? (
              // ── STATE B: the alphabet as a dedicated 4-col letter grid ─────────
              <div>
                <h2 className="font-display text-2xl font-extrabold leading-tight text-ink">
                  {t("signsAlphaTitle", lang)}
                </h2>
                <p className="mt-1 font-sans text-[13px] leading-snug text-muted">
                  {t("signsAlphaBody", lang)}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${alphaPct}%`, background: "linear-gradient(90deg,#F0C879,#E6B24C)" }}
                  />
                </div>
                <p className="mt-[7px] font-sans text-[11px] font-semibold text-muted">
                  {toLocaleDigits(alphaLearned, lang)} {t("signsAlphaProgress", lang)}
                </p>
                <ul className="mt-4 grid grid-cols-4 gap-[10px] sm:grid-cols-6 lg:grid-cols-7">
                  {signs.map((sign) => {
                    const mastered = (progress[sign.id]?.masteryLevel ?? 0) > 0;
                    const state: "learned" | "current" | "locked" = mastered
                      ? "learned"
                      : sign.id === alphaCurrentId
                        ? "current"
                        : "locked";
                    return (
                      <li key={sign.id}>
                        <LetterCell sign={sign} state={state} lang={lang} onSelect={() => setSelectedId(sign.id)} />
                      </li>
                    );
                  })}
                </ul>
              </div>
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
                  flagRole={flagRoleOf(selected.id)}
                  lang={lang}
                  rtl={rtl}
                  variant="panel"
                  onClose={() => setSelectedId(null)}
                  onPractice={() => practiceSign(selected)}
                  onToggleFlag={() => profile && toggleFlag(selected.id, profile.id)}
                  onAddReview={() => addToReview(selected.id)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-line bg-paper/50 px-8 py-20 text-center">
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
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={pick(lang, selected.glossEn, selected.glossAr)}
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 animate-rise rounded-t-3xl bg-paper p-6 pb-10 shadow-lift focus:outline-none"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/10" aria-hidden="true" />
            <DetailPanel
              sign={selected}
              status={statusOf(selected)}
              flagged={flaggedIds.has(selected.id)}
              flagRole={flagRoleOf(selected.id)}
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

// ── Search input (resting sand + hairline · focus 2px teal border, §B2/§D) ──────
function SearchInput({
  lang,
  value,
  onChange,
}: {
  lang: Lang;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Icon
        name="search"
        className="pointer-events-none absolute inset-y-0 start-4 my-auto h-fit text-teal"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={pick(lang, "Search signs…", "ابحث عن إشارة…")}
        aria-label={pick(lang, "Search signs", "ابحث عن إشارة")}
        className="w-full rounded-[14px] border-2 border-line bg-sand py-3 ps-12 pe-4 font-sans text-[15px] font-medium text-ink transition placeholder:text-[#94A5A2] focus-visible:border-teal focus-visible:outline-none"
      />
    </div>
  );
}

// ── Alphabet cell (learned / current / locked, §B3) — the letter never mirrors ──
function LetterCell({
  sign,
  state,
  lang,
  onSelect,
}: {
  sign: Sign;
  state: "learned" | "current" | "locked";
  lang: Lang;
  onSelect: () => void;
}) {
  const cellStyle =
    state === "learned"
      ? { backgroundColor: "#0F6E6A", color: "#FBF7EF" }
      : state === "current"
        ? { backgroundColor: "#FBF3EF", color: "#E8654C", boxShadow: "0 0 0 2px #E8654C" }
        : { backgroundColor: "#F6EFE3", color: "#16302E", boxShadow: "inset 0 0 0 1px #EDE3D2" };
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={pick(lang, sign.glossEn, sign.glossAr)}
      style={cellStyle}
      className="flex aspect-square w-full items-center justify-center rounded-[15px] font-display text-[26px] font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60"
    >
      <span aria-hidden="true">{sign.code ?? sign.glossEn}</span>
    </button>
  );
}

// ── Grid card (white row token · glyph well · status caption + graded/motion) ───
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
  lang: Lang;
  onSelect: () => void;
}) {
  const meta = STATUS_META[status];
  const label = pick(lang, sign.glossEn, sign.glossAr);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{ boxShadow: "0 2px 0 #EDE3D2" }}
      className={`group relative flex w-full flex-col items-center gap-2 rounded-2xl border bg-white p-4 text-center transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 md:p-5 ${
        selected ? "border-teal ring-2 ring-teal" : "border-line"
      }`}
    >
      {/* honest graded/motion signal (start corner) */}
      <span className="absolute start-2 top-2">
        <TypeBadge gradable={sign.cameraGradable} lang={lang} />
      </span>
      {/* live status glyph (end corner) — check_circle etc. never mirrors */}
      {meta.icon && (
        <span className={`absolute end-3 top-3 ${meta.tone}`}>
          <Icon name={meta.icon} fill className="text-lg md:text-xl" />
        </span>
      )}
      <div className="mb-1 mt-4 flex aspect-square w-full max-w-[84px] items-center justify-center rounded-[13px] bg-sand p-3">
        {/* Real hand (alphabet skeleton) / brand image (iloveyou) / honest sign icon
            for un-recorded words — via SignGlyph, the one source of truth. No emoji. */}
        <SignGlyph sign={sign} lang={lang} className="text-4xl md:text-5xl" imgClassName="h-4/5 w-4/5 rounded-2xl object-cover" />
      </div>
      <p className={`font-display font-bold ${selected ? "text-teal" : "text-ink"} md:text-lg`}>
        {label}
        <span className="text-ink/70"> · {sign.code ? sign.code : sign.glossAr}</span>
      </p>
      <p className={`text-[11px] font-bold uppercase tracking-widest md:text-xs ${meta.tone}`}>
        {pick(lang, meta.en, meta.ar)}
      </p>
    </button>
  );
}

// ── Detail (shared by mobile sheet + desktop panel) ──────────────────────────────
/** The caller's relationship to this sign's live flag (H7 honesty):
 *  none = unflagged · owner = can deactivate (raiser or deaf role) ·
 *  other = can co-request · supporter = already co-requested. */
type FlagRole = "none" | "owner" | "other" | "supporter";

function DetailPanel({
  sign,
  status,
  flagged,
  flagRole,
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
  flagRole: FlagRole;
  lang: Lang;
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
  // H7: a non-raiser tapping an existing flag CO-REQUESTS (the store never
  // toggles it off for them) — so the control must say that, not "Remove".
  const flagLabel =
    flagRole === "owner"
      ? pick(lang, "Remove from family list", "أزِل من قائمة العائلة")
      : flagRole === "supporter"
        ? t("famCoRequested", lang)
        : flagRole === "other"
          ? t("famAskToo", lang)
          : pick(lang, "Add to family list", "أضِف إلى قائمة العائلة");

  // Honest graded/motion signal: teal barber-stripe for camera-graded signs,
  // gold barber-stripe for motion (watch-&-practise) signs (§C · B1).
  const frameBg = sign.cameraGradable
    ? "repeating-linear-gradient(135deg,#0F6E6A,#0F6E6A 15px,#12817b 15px,#12817b 30px)"
    : "repeating-linear-gradient(135deg,#C89A3D,#C89A3D 15px,#d4a94a 15px,#d4a94a 30px)";

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
        isPanel ? "flex flex-col rounded-3xl border border-line bg-paper p-6 shadow-lift" : "flex flex-col"
      }
    >
      {/* header row — favorite (desktop) + close, mobile-first single tree */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onToggleFlag}
          // pressed = the CALLER's own engagement (owner/supporter), not the
          // household's — an "other" member isn't pressed until they co-request.
          aria-pressed={flagRole === "owner" || flagRole === "supporter"}
          aria-label={flagLabel}
          title={flagLabel}
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

      {/* big demo frame — honest barber-stripe (graded=teal / motion=gold), medallion
          handshape (never mirrors), signer-demo badge + gold replay (§C · B1). */}
      <div
        className="relative mb-6 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[22px]"
        style={{ background: frameBg }}
      >
        {/* static "signer demo" marker (top-start) */}
        <div className="absolute start-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/30 px-2 py-1 font-mono text-[9px] font-bold uppercase leading-none tracking-[0.1em] text-white/85">
          <span className="h-1.5 w-1.5 rounded-full bg-white/85" aria-hidden="true" />
          {t("signSignerDemo", lang)}
        </div>

        {/* center medallion — real handshape / brand image / honest icon via SignGlyph */}
        <div
          className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-paper"
          style={{ boxShadow: "0 12px 30px rgba(0,0,0,.22)" }}
        >
          <SignGlyph sign={sign} lang={lang} className="text-7xl" imgClassName="h-4/5 w-4/5 rounded-full object-contain" />
        </div>

        {/* Watch / Watch Again replay chip — central preview affordance (NO store write). */}
        <button
          type="button"
          onClick={handleWatch}
          className="absolute bottom-4 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-paper/90 px-5 py-2 font-display font-bold text-teal shadow-lift backdrop-blur transition hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <Icon name="replay" className="text-xl" />
          {watched ? pick(lang, "Watch Again", "شاهد مجدداً") : pick(lang, "Watch", "شاهد")}
        </button>

        {/* gold play accent (end corner) — the play glyph never mirrors (§6). */}
        <button
          type="button"
          onClick={handleWatch}
          aria-label={watched ? pick(lang, "Watch Again", "شاهد مجدداً") : pick(lang, "Watch", "شاهد")}
          className="absolute bottom-3 end-3 z-20 flex h-[38px] w-[38px] items-center justify-center rounded-full text-ink transition active:translate-y-1"
          style={{ backgroundColor: "#E6B24C", boxShadow: "0 4px 0 #C89A3D" }}
        >
          <Icon name="play_arrow" fill className="text-xl" />
        </button>
      </div>

      {/* title + semantic category tags + honest graded/motion pill */}
      <div className="mb-6 flex flex-col text-start md:items-center md:text-center">
        <div className="flex w-full items-start justify-between gap-3 md:flex-col md:items-center md:gap-3">
          <h2 className="font-display text-2xl font-black text-ink md:text-3xl">
            {title}
            <span className="text-ink/70"> · {sign.code ? sign.code : sign.glossAr}</span>
          </h2>
          <span className="mt-1 shrink-0 md:mt-0">
            <TypeBadge gradable={sign.cameraGradable} lang={lang} />
          </span>
        </div>
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

      {/* how to sign — mono section label + hint block (single honest hint, no fabricated steps) */}
      <div className="mb-6" dir={rtl ? "rtl" : "ltr"}>
        <MonoLabel lang={lang} className="flex items-center gap-2 text-teal">
          <Icon name="info" className="text-base" />
          {pick(lang, "How to sign", "كيف تُؤدّى")}
        </MonoLabel>
        <div className="mt-3 flex items-start gap-3 rounded-[14px] border border-line bg-sand p-4">
          <span
            className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full font-display text-xs font-extrabold text-paper"
            style={{ backgroundColor: "#0F6E6A" }}
            aria-hidden="true"
          >
            {toLocaleDigits(1, lang)}
          </span>
          <p className="text-[13.5px] leading-relaxed text-ink">{hint}</p>
        </div>
        {/* Honest provenance: A1 word descriptions are ASL-adapted, not verified QSL (C3). */}
        {sign.tier === "A1" && (
          <p className="mt-2 px-1 text-[11px] italic leading-snug text-ink/70">
            {t("a1AslProvenance", lang)}
          </p>
        )}
      </div>

      {/* actions — camera CTA gated by cameraGradable; motion signs get the honest
          watch-&-practise path and NEVER a fake grade (§9.4). */}
      <div className="mt-auto flex flex-col gap-3">
        {sign.cameraGradable ? (
          <SpringButton variant="coral" size="lg" full onClick={onPractice} className="gap-3">
            <Icon name="videocam" className="text-2xl" />
            {t("practiceCamera", lang)}
          </SpringButton>
        ) : (
          // Non-gradable (moving) sign — camera can't grade it, so steer to Watch (§9.4).
          <>
            <SpringButton variant="gold" size="lg" full onClick={handleWatch} className="gap-3">
              <Icon name="visibility" className="text-2xl" />
              {t("signWatchPractise", lang)}
            </SpringButton>
            <p className="flex items-center justify-center gap-2 text-center font-sans text-xs font-medium text-ink/70">
              <Icon name="info" className="text-base text-teal" />
              {pick(lang, "This sign moves, so the camera can't grade it yet.", "هذه إشارة متحركة، لا تستطيع الكاميرا تقييمها بعد.")}
            </p>
          </>
        )}

        {/* desktop: Add to Daily Review (SRS) — secondary ghost. */}
        <SpringButton
          variant="ghost"
          size="md"
          full
          onClick={onAddReview}
          className="hidden gap-2 md:inline-flex"
        >
          <Icon name="event_repeat" />
          {pick(lang, "Add to Daily Review", "أضِف للمراجعة اليومية")}
        </SpringButton>

        {/* mobile: Flag (toggle, aria-pressed) + Share (ghost) row. */}
        <div className="flex gap-3 md:hidden">
          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={flagRole === "owner" || flagRole === "supporter"}
            aria-label={flagLabel}
            className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-display font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
              flagged
                ? "bg-teal text-white extruded-teal"
                : "border-2 border-teal/30 bg-transparent text-teal active:scale-[.98]"
            }`}
          >
            <Icon name="push_pin" fill={flagged} />
            {flagRole === "owner"
              ? pick(lang, "Flagged", "محدّدة")
              : flagRole === "supporter"
                ? t("famCoRequested", lang)
                : flagRole === "other"
                  ? t("famAskToo", lang)
                  : pick(lang, "Flag", "حدّد")}
          </button>
          <SpringButton variant="ghost" size="md" full onClick={handleShare} className="flex-1 gap-2">
            <Icon name="share" />
            {pick(lang, "Share", "شارك")}
          </SpringButton>
        </div>
      </div>
    </div>
  );
}
