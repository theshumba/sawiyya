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
import { ALL_SIGNS, LESSONS, SEEDED_ALPHABET, UNITS } from "../content/signs";
import { lessonPlayable } from "../lesson/unlock";
import { activeProfile, todayKey, useApp } from "../store/app";
import { isDue } from "../store/srs";
import { useUi } from "../store/ui";
import { Icon, Title } from "../components/ui";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { SignGlyph } from "../components/SignGlyph";
import { demoShowsHint, SignDemo } from "../components/SignDemo";
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
  // H·audit: text-teal-deep/60 measured 3.3:1 on the card surface at 11px bold.
  // text-muted (#566B68) is the AA-tuned token these three should have used.
  letter: { en: "Letter", ar: "حرف", icon: null, tone: "text-muted" },
  // The unit NUMBER is appended at render time by statusLabel(), never hardcoded.
  unit: { en: t("homeUnit", "en"), ar: t("homeUnit", "ar"), icon: null, tone: "text-muted" },
  new: { en: "New", ar: "جديدة", icon: null, tone: "text-muted" },
};

/** Which unit a sign belongs to, numbered exactly the way Home numbers it:
 *  the index in the frozen UNITS array + 1 (alphabet = 1, A1 words = 2).
 *  0 when the sign is in no unit (the 3 reference-only alphabet edge forms). */
function unitNumberOf(sign: Sign): number {
  const idx = UNITS.findIndex((u) => u.signIds.includes(sign.id));
  return idx < 0 ? 0 : idx + 1;
}

/** Caption for a card's live status. The `unit` status carries the derived unit
 *  number, so a word sign reads "Unit 2" here exactly as it does on Home. */
function statusLabel(status: Status, sign: Sign, lang: Lang): string {
  const meta = STATUS_META[status];
  const label = pick(lang, meta.en, meta.ar);
  if (status !== "unit") return label;
  const n = unitNumberOf(sign);
  return n > 0 ? `${label} ${toLocaleDigits(n, lang)}` : label;
}

// Semantic category tags for the detail panel (design shows "Word / Letter"
// style chips). Derived honestly from the frozen content metadata.
function categoryTags(sign: Sign, lang: Lang): { label: string; tone: "teal" | "gold" }[] {
  const tags: { label: string; tone: "teal" | "gold" }[] = [];
  if (sign.tier === "alphabet") {
    tags.push({ label: pick(lang, "Alphabet", "الحروف"), tone: "teal" });
  } else {
    const n = unitNumberOf(sign);
    tags.push({
      label: n > 0 ? `${t("homeUnit", lang)} ${toLocaleDigits(n, lang)}` : t("homeUnit", lang),
      tone: "teal",
    });
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
      // H15 tuning: #C89A3D on #FBEFE6 measured 2.28:1, so the honesty badge was
      // unreadable. #7F621F holds the same gold hue at ~5.0:1.
      style={
        gradable
          ? { backgroundColor: "#E6F0EE", color: "#0F6E6A" }
          : { backgroundColor: "#FBEFE6", color: "#7F621F" }
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

  // ── self-mark (watch-only signs) ─────────────────────────────────────────────
  // The confirmation is DERIVED FROM THE STORE, never from local state: the sheet
  // closes and reopens freely, so a local "marked" boolean would forget itself and
  // let the same sign be self-marked over and over.
  const markedToday = (signId: string): boolean => {
    const p = progress[signId];
    if (!p || (p.masteryLevel ?? 0) < 2) return false;
    return todayKey(new Date(p.lastSeen)) === todayKey();
  };
  const selfMark = (signId: string) => {
    if (markedToday(signId)) return;
    // Self-mark rates 'hard', never 'good' (H2): nothing confirmed it. Same call
    // Words.tsx makes, so a flagged word reaches mastery 2 and the flag archives.
    app.recordDrillResult(signId, "hard", { selfMark: true });
  };

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
  // ONE denominator: the 28 seeded letters. Counting the 3 reference-only edge
  // forms in the numerator while dividing by 28 produced "30 of 28 learned".
  const alphaLearned = SEEDED_ALPHABET.filter((s) => (progress[s.id]?.masteryLevel ?? 0) > 0).length;
  const alphaPct = Math.min(100, Math.round((alphaLearned / SEEDED_ALPHABET.length) * 100));
  // A letter is reachable when the lesson that teaches it is reachable — the same
  // rule the trail's padlocks draw (lesson/unlock.ts). These cells used to be a
  // background colour with a live onClick, so "locked" was a paint job and the
  // detail sheet's camera CTA opened on any letter in the alphabet. The three
  // reference-only edge forms (ة/لا/ال) belong to no lesson and stay open.
  const signUnlocked = (signId: string): boolean => {
    const lesson = LESSONS.find((l) => l.signIds.includes(signId));
    return lesson ? lessonPlayable(lesson.id, progress) : true;
  };

  // Live filter chips only — the dialect "Coming Soon" pill moved to onboarding /
  // PractiseChooser, and the empty roadmap unit is no longer offered here.
  // The word-unit chip takes its NUMBER from the content layer (UNITS order), so
  // it reads "Unit 2" here and on Home instead of contradicting the path.
  const wordUnitNo = UNITS.findIndex((u) => u.tier === "A1") + 1;
  const FILTERS: { id: Filter; en: string; ar: string }[] = [
    { id: "all", en: "All", ar: "الكل" },
    { id: "learned", en: "Learned", ar: "المتعلمة" },
    { id: "flagged", en: "Flagged", ar: "المحددة" },
    { id: "alphabet", en: t("prAlphabet", "en"), ar: t("prAlphabet", "ar") },
    {
      id: "unit1",
      en: `${t("homeUnit", "en")} ${toLocaleDigits(wordUnitNo, "en")}`,
      ar: `${t("homeUnit", "ar")} ${toLocaleDigits(wordUnitNo, "ar")}`,
    },
  ];

  // Only gradable (static/alphabet) signs get a camera target. Dynamic signs can't be
  // graded (§9.4); routing them into teach mode let the learner record bogus KNN samples
  // that pollute the recognizer (#2). DetailPanel hides the camera CTA for those.
  const practiceSign = (sign: Sign) => go({ name: "camera", targetSignId: sign.id });

  // ── ONE dominant action above the grid: open the family-flagged signs ─────────
  // Always the first flagged sign's own detail sheet. It used to jump straight to
  // the camera when that sign happened to be gradable, so the same button did two
  // different things under one label that named no sign.
  const flaggedCount = flaggedIds.size;
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
            onClick={() => setSelectedId(firstFlaggedId ?? null)}
            className="mb-6 gap-3"
          >
            <Icon name="visibility" className="text-2xl" />
            {pick(
              lang,
              `Open your ${flaggedCount} flagged ${flaggedCount === 1 ? "sign" : "signs"}`,
              `افتح ${toLocaleDigits(flaggedCount, lang)} إشارة محدّدة`,
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
                <p className="mt-3 font-sans text-[11px] leading-snug text-muted">
                  {t("signsAlphaLockedNote", lang)}
                </p>
                <ul className="mt-4 grid grid-cols-4 gap-[10px] sm:grid-cols-6 lg:grid-cols-7">
                  {signs.map((sign) => {
                    const mastered = (progress[sign.id]?.masteryLevel ?? 0) > 0;
                    const state: "learned" | "current" | "locked" = mastered
                      ? "learned"
                      : signUnlocked(sign.id)
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
                  marked={markedToday(selected.id)}
                  onClose={() => setSelectedId(null)}
                  onPractice={() => practiceSign(selected)}
                  onSelfMark={() => selfMark(selected.id)}
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
            // max-h + scroll (Words.tsx:115 pattern): the panel is ~800px tall on
            // a phone, so anchored to bottom-0 with no cap its close button and
            // demo frame were pushed above the top of the screen, unreachable.
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] animate-rise overflow-y-auto overscroll-contain rounded-t-3xl bg-paper p-6 pb-10 shadow-lift focus:outline-none"
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
              marked={markedToday(selected.id)}
              onClose={() => setSelectedId(null)}
              onPractice={() => practiceSign(selected)}
              onSelfMark={() => selfMark(selected.id)}
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
        className="w-full rounded-[14px] border-2 border-line bg-sand py-3 ps-12 pe-4 font-sans text-[15px] font-medium text-ink transition placeholder:text-muted focus-visible:border-teal focus-visible:outline-none"
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
  // Locked stays VISIBLE and politely blocked (Carroll & Carrithers 1984, and
  // what Duolingo does with locked stories): the letter is still legible, it just
  // carries a padlock and does not respond. Hiding it would cost the learner the
  // shape of what is ahead.
  const locked = state === "locked";
  const cellStyle =
    state === "learned"
      ? { backgroundColor: "#0F6E6A", color: "#FBF7EF" }
      : state === "current"
        ? { backgroundColor: "#FBF3EF", color: "#E8654C", boxShadow: "0 0 0 2px #E8654C" }
        : { backgroundColor: "#F6EFE3", color: "#566B68", boxShadow: "inset 0 0 0 1px #EDE3D2" };
  return (
    <button
      type="button"
      disabled={locked}
      onClick={locked ? undefined : onSelect}
      aria-label={
        locked
          ? `${pick(lang, sign.glossEn, sign.glossAr)}, ${t("pathLocked", lang)}`
          : pick(lang, sign.glossEn, sign.glossAr)
      }
      style={cellStyle}
      className={`relative flex aspect-square w-full items-center justify-center rounded-[15px] font-display text-[26px] font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${
        locked ? "cursor-default opacity-70" : "active:scale-95"
      }`}
    >
      <span aria-hidden="true">{sign.code ?? sign.glossEn}</span>
      {locked && (
        <Icon
          name="lock"
          fill
          className="absolute end-1 top-1 !text-[13px] leading-none text-muted"
          aria-hidden="true"
        />
      )}
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
  // Secondary gloss = the OTHER language (Words.tsx:214 pattern). Alphabet signs
  // carry glossAr === code, so printing "code or glossAr" made every Arabic card
  // read "ا · ا". Suppressed entirely when the two languages agree.
  const secondary = pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{ boxShadow: "0 2px 0 #EDE3D2" }}
      className={`group relative flex w-full flex-col items-center gap-2 rounded-2xl border bg-paper p-4 text-center transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 md:p-5 ${
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
        {secondary !== label && (
          <span className="text-ink/70" dir={lang === "ar" ? "ltr" : "rtl"}>
            {" · "}
            {secondary}
          </span>
        )}
      </p>
      <p className={`text-[11px] font-bold uppercase tracking-widest md:text-xs ${meta.tone}`}>
        {statusLabel(status, sign, lang)}
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
  marked,
  onClose,
  onPractice,
  onSelfMark,
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
  /** Already self-marked today. Derived from the store by the parent, so it
   *  survives the sheet being closed and reopened. */
  marked: boolean;
  onClose: () => void;
  onPractice: () => void;
  onSelfMark: () => void;
  onToggleFlag: () => void;
  onAddReview: () => void;
}) {
  const title = pick(lang, sign.glossEn, sign.glossAr);
  // Secondary gloss = the OTHER language, so Arabic stops printing "ا · ا".
  const secondary = pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr);
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
      {/* header row: favourite + close. Shown at EVERY width, because the panel used to
          hand phones and desktops different capabilities from one component. */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onToggleFlag}
          // pressed = the CALLER's own engagement (owner/supporter), not the
          // household's — an "other" member isn't pressed until they co-request.
          aria-pressed={flagRole === "owner" || flagRole === "supporter"}
          aria-label={flagLabel}
          title={flagLabel}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
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

      {/* The one "show me this sign" component, shared with Words and the lesson
          player. It carries the real signer photo, its own working replay, the
          teaching stage for footage-less words and the provenance footnote. The
          static medallion it replaces had three play controls that did nothing. */}
      <div className="mb-6">
        <SignDemo sign={sign} lang={lang} />
      </div>

      {/* title + semantic category tags + honest graded/motion pill */}
      <div className="mb-6 flex flex-col text-start md:items-center md:text-center">
        <div className="flex w-full items-start justify-between gap-3 md:flex-col md:items-center md:gap-3">
          <h2 className="font-display text-2xl font-black text-ink md:text-3xl">
            {title}
            {secondary !== title && (
              <span className="text-ink/70" dir={lang === "ar" ? "ltr" : "rtl"}>
                {" · "}
                {secondary}
              </span>
            )}
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
            {statusLabel(status, sign, lang)}
          </span>
        </div>
      </div>

      {/* how to sign: single honest hint, no fabricated steps. Skipped when the
          demo stage already IS the hint (footage-less words), or it prints twice;
          the A1 provenance line lives in SignDemo's footnote for the same reason.
          Words.tsx:135 does exactly this. */}
      {!demoShowsHint(sign) && (
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
        </div>
      )}

      {/* actions — camera CTA gated by cameraGradable; motion signs get the honest
          watch-&-practise path and NEVER a fake grade (§9.4). */}
      <div className="mt-auto flex flex-col gap-3">
        {sign.cameraGradable ? (
          <SpringButton variant="coral" size="lg" full onClick={onPractice} className="gap-3">
            <Icon name="videocam" className="text-2xl" />
            {t("practiceCamera", lang)}
          </SpringButton>
        ) : (
          // Non-gradable sign: the camera can't grade it, so the primary action is
          // the same never-hard-fail self-mark Words uses. It writes a real drill
          // result (rated 'hard', H2), which is what lets a flagged word reach
          // mastery 2 and archive its flag. The old CTA here only relabelled itself.
          <>
            {marked ? (
              <div className="flex items-center gap-3 rounded-2xl bg-gold/15 p-4">
                <Icon name="celebration" fill className="shrink-0 text-2xl leading-none text-gold-deep" />
                <p className="font-display font-bold text-ink">{t("wordsMarked", lang)}</p>
              </div>
            ) : (
              <SpringButton variant="gold" size="lg" full onClick={onSelfMark} className="gap-3">
                <Icon name="check_circle" className="text-2xl" />
                <span className="flex flex-col items-start text-start">
                  <span>{t("camSelfMark", lang)}</span>
                  {/* full-strength ink on gold (7.3:1). ink/70 would land at
                      3.9:1, under AA for a 10px label. */}
                  <span className="mt-1 text-[10px] font-normal uppercase tracking-widest text-ink">
                    {t("camSelfMarkSub", lang)}
                  </span>
                </span>
              </SpringButton>
            )}
            <p className="flex items-center justify-center gap-2 text-center font-sans text-xs font-medium text-ink/70">
              <Icon name="info" className="text-base text-teal" />
              {pick(lang, "This sign moves, so the camera can't grade it yet.", "هذه إشارة متحركة، لا تستطيع الكاميرا تقييمها بعد.")}
            </p>
          </>
        )}

        {/* Add to Daily Review (SRS), secondary ghost. Shown at every width: it is
            the app's only way to seed a review card without drilling, and it used
            to be desktop-only on a portrait-locked phone PWA. */}
        <SpringButton variant="ghost" size="md" full onClick={onAddReview} className="gap-2">
          <Icon name="event_repeat" />
          {pick(lang, "Add to Daily Review", "أضِف للمراجعة اليومية")}
        </SpringButton>

        {/* Flag (toggle, aria-pressed) + Share (ghost), also at every width, and
            wrapping when the two no longer fit side by side. */}
        <div className="flex flex-wrap gap-3">
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
