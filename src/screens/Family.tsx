// Family Mode — the structural inverse of "fix the Deaf person" (PRD §6.7).
// The Deaf member flags signs; the household's queues follow them.
// Design reskin (Sawiyya Family.dc.html · STATE B "Family hub"): a warm,
// list-driven surface — data-driven household header, a horizontal member row
// that doubles as the profile switcher, a "Learning together" flag list, the
// coral household flag action, and a no-rankings league note. ScreenShell owns
// chrome; all store wiring, deep-links and the add-member flow are preserved.
import { useState } from "react";
import { num, pick, t } from "../i18n";
import { signById } from "../content/signs";
import {
  activeFlags,
  activeProfile,
  householdStreak,
  profilesActiveToday,
  signsAllCanDo,
  streakFor,
  todayKey,
  useApp,
} from "../store/app";
import { useUi } from "../store/ui";
import type { Persona } from "../types";
import { Icon } from "../components/ui";
import { Card, Pill, SpringButton, formatPercent } from "../components/dc";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { SignGlyph } from "../components/SignGlyph";

// H5: a flagged sign must open ITS OWN surface — camera only when gradable,
// otherwise the sign's dictionary/watch detail. The old generic-camera fallback
// dropped learners onto Alif, the wrong sign entirely.

const ROLES: { value: Persona; emoji: string }[] = [
  { value: "parent", emoji: "👨‍👩‍👧" },
  { value: "sibling", emoji: "🧒" },
  { value: "teacher", emoji: "🏫" },
  { value: "friend", emoji: "🤝" },
  { value: "deaf", emoji: "🧏" },
];

const ROLE_LABEL: Record<Persona, { en: string; ar: string }> = {
  parent: { en: "Parent", ar: "أب / أم" },
  sibling: { en: "Sibling", ar: "أخ / أخت" },
  teacher: { en: "Teacher", ar: "معلم/ة" },
  friend: { en: "Friend", ar: "صديق/ة" },
  deaf: { en: "Deaf — directs the curriculum", ar: "أصم — يوجّه المنهج" },
};

// Per-person avatar palette (Family.dc.html PEOPLE colours) — profiles carry no
// colour field, so we cycle this by their position in the household.
const AVATAR_PALETTE: { bg: string; fg: string }[] = [
  { bg: "#E6B24C", fg: "#16302E" }, // gold / ink
  { bg: "#0F6E6A", fg: "#FBF7EF" }, // teal / paper
  { bg: "#E8654C", fg: "#FBF7EF" }, // coral / paper
  { bg: "#0A4F4C", fg: "#FBF7EF" }, // teal-deep / paper
];
const avatarColors = (i: number) =>
  AVATAR_PALETTE[((i % AVATAR_PALETTE.length) + AVATAR_PALETTE.length) % AVATAR_PALETTE.length];
const initialOf = (name: string) => [...name.trim()][0] ?? "؟";

export function Family() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Persona>("sibling");
  if (!profile) return <NoProfileFallback />;
  const lang = profile.language;

  const flags = activeFlags(app);
  const board = signsAllCanDo(app);
  const goToSign = (sign: { id: string; cameraGradable: boolean }) =>
    sign.cameraGradable
      ? go({ name: "camera", targetSignId: sign.id })
      : go({ name: "allSigns", signId: sign.id });
  const sharedStreak = householdStreak(app);
  const activeToday = profilesActiveToday(app);
  const deafMembers = app.profiles.filter((p) => p.role === "deaf");
  const flagger = deafMembers[0];

  // "Signs we can all do" milestone progress (demoted celebratory secondary).
  const milestoneTarget = 25;
  const boardPct = Math.min(1, board.length / milestoneTarget);
  const honeycombCells = Math.max(milestoneTarget, board.length);
  const HEX = "[clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0%_50%)]";

  const addMember = () => {
    if (!newName.trim()) return;
    app.createProfile({
      displayName: newName.trim(),
      role: newRole,
      dominantHand: "R",
      language: lang,
      dailyGoal: "regular",
    });
    setNewName("");
    setAdding(false);
  };

  // Arabic can't be uppercased/letter-spaced without breaking joins — mono eyebrow
  // styling is EN-only; Arabic keeps its natural glyph shaping.
  const eyebrowCls = `text-[11px] font-bold text-teal ${
    lang === "ar" ? "" : "font-mono uppercase tracking-[0.14em]"
  }`;

  return (
    <ScreenShell lang={lang} chrome="tabs">
      <div className="mx-auto max-w-md px-[22px] pb-10 pt-1.5">
        {/* B5 · Header — data-driven household name + learners·signs subtitle ── */}
        <header>
          <p className={eyebrowCls}>{t("famTitle", lang)}</p>
          <h1 className="mt-1 font-display text-[25px] font-extrabold leading-[1.1] text-ink">
            <bdi>{t("famHousehold", lang)}</bdi>
          </h1>
          <p className="mt-1 font-sans text-[13px] leading-[1.35] text-muted">
            {num(app.profiles.length, lang)} {t("famLearners", lang)} ·{" "}
            {num(board.length, lang)} {t("famSignsTogether", lang)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Pill tone="coral">
              <span aria-hidden="true">🔥</span> {num(sharedStreak, lang)} · {t("famSharedStreak", lang)}
            </Pill>
            <span>
              {num(activeToday, lang)}/{num(app.profiles.length, lang)} {t("famSignedToday", lang)}
            </span>
          </div>
        </header>

        {/* B6 · Member row — horizontal scroll; each card switches active profile ─ */}
        <div className="no-scrollbar mt-4 flex gap-[10px] overflow-x-auto pb-1">
          {app.profiles.map((p, i) => {
            const isActive = p.id === app.activeProfileId;
            const signedToday = p.lastActiveDay === todayKey();
            const c = avatarColors(i);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => app.switchProfile(p.id)}
                aria-pressed={isActive}
                className="w-[74px] flex-none rounded-2xl border border-line bg-paper p-[11px_8px] text-center transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                style={isActive ? { boxShadow: "0 0 0 3px #1F8A5B" } : undefined}
              >
                <span
                  className="relative mx-auto flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-extrabold"
                  style={{ backgroundColor: c.bg, color: c.fg }}
                  aria-hidden="true"
                >
                  {p.role === "deaf" ? "🧏" : initialOf(p.displayName)}
                </span>
                <span className="mt-[7px] block truncate font-display text-xs font-bold text-ink">
                  <bdi>{p.displayName}</bdi>
                  {signedToday && <span className="text-success" aria-hidden="true"> ✓</span>}
                </span>
                <span className="mt-[5px] flex items-center justify-center gap-[3px]">
                  <span className="h-[9px] w-[9px] rounded-full bg-coral" aria-hidden="true" />
                  <span className="font-display text-[11px] font-bold text-muted">
                    {num(streakFor(p), lang)}
                  </span>
                </span>
              </button>
            );
          })}

          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-[74px] flex-none rounded-2xl border border-dashed border-teal/30 bg-paper/50 p-[11px_8px] text-center transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 text-teal">
                <Icon name="add" />
              </span>
              <span className="mt-[7px] block truncate text-xs font-bold text-muted">
                {t("famAdd", lang)}
              </span>
            </button>
          )}
        </div>

        {/* Add-member flow — inline elevated card (name + role chips + save/cancel) */}
        {adding && (
          <Card className="mt-3 flex flex-col gap-3 p-4">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("famName", lang)}
              maxLength={20}
              className="rounded-2xl border-2 border-line bg-sand px-4 py-3 font-semibold placeholder:text-muted/60 focus:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
            />
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setNewRole(r.value)}
                  aria-pressed={newRole === r.value}
                  className={`rounded-2xl border-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                    newRole === r.value ? "border-teal bg-teal text-paper" : "border-line bg-paper"
                  }`}
                >
                  {r.emoji} {pick(lang, ROLE_LABEL[r.value].en, ROLE_LABEL[r.value].ar)}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <SpringButton variant="teal" size="sm" full onClick={addMember}>
                {t("save", lang)}
              </SpringButton>
              <SpringButton variant="ghost" size="sm" onClick={() => setAdding(false)}>
                {t("cancel", lang)}
              </SpringButton>
            </div>
          </Card>
        )}

        {/* B7 · "Learning together" — the Deaf member's flags lead the household ── */}
        <section className="mt-[22px]">
          {/* Coral flagged badge + flagger hero line (distinct from the teal eyebrow). */}
          <span className="inline-block rounded-full bg-coral-deep px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-paper">
            {t("homeFlagged", lang)}
          </span>
          {flagger && (
            <p className="mt-2 flex items-center gap-1.5 font-display text-[15px] font-bold text-coral">
              <span>
                <bdi>{flagger.displayName}</bdi> {t("famFlagged", lang)}
              </span>
              <Icon name="flag" fill className="text-base" />
            </p>
          )}
          <p className={`mt-3 ${eyebrowCls}`}>{t("famLearningTogether", lang)}</p>
          {deafMembers.length > 0 && (
            <p className="mt-2 font-sans text-xs leading-snug text-muted">
              {deafMembers.map((d, i) => (
                <span key={d.id}>
                  <bdi>{d.displayName}</bdi>
                  {i < deafMembers.length - 1 ? "، " : ""}
                </span>
              ))}{" "}
              {t("famOnlyDeafFlags", lang)}
            </p>
          )}

          {/* B8 · Flags list — each row deep-links into practice for that sign. */}
          <div className="mt-[11px] flex flex-col gap-[10px]">
            {flags.length > 0 ? (
              flags.map((f) => {
                const sign = signById(f.signId);
                if (!sign) return null;
                const byIdx = app.profiles.findIndex((p) => p.id === f.raisedByProfileId);
                const by = byIdx >= 0 ? app.profiles[byIdx] : undefined;
                const c = avatarColors(byIdx >= 0 ? byIdx : 0);
                const gloss = pick(lang, sign.glossEn, sign.glossAr);
                const isSelf = by?.id === profile.id;
                const byline = by
                  ? isSelf
                    ? pick(lang, "You flagged it — for your family", "رفعتها — لعائلتك")
                    : pick(lang, `Flagged by ${by.displayName} — for you`, `رفعها ${by.displayName} — لك`)
                  : pick(lang, "Flagged for your family", "مطلوبة لعائلتك");
                // M8: the assigner sees each learner's mastery on the flagged
                // sign — one dot (0–3) per non-raiser hearing member.
                const learners = app.profiles.filter(
                  (p) => p.id !== f.raisedByProfileId && p.role !== "deaf",
                );
                const dotColor = (lvl: number) =>
                  lvl >= 3 ? "#0F6E6A" : lvl === 2 ? "#E6B24C" : lvl === 1 ? "#F0C879" : "#EDE3D2";
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => goToSign(sign)}
                    aria-label={`${gloss} — ${sign.cameraGradable ? t("practiceCamera", lang) : t("lsWatchTitle", lang)}`}
                    className="flex items-center gap-[11px] rounded-[15px] border border-line bg-paper p-3 text-start transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  >
                    <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[13px] bg-sand">
                      <SignGlyph
                        sign={sign}
                        lang={lang}
                        className="text-2xl"
                        imgClassName="h-10 w-10 rounded-lg object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[15px] font-bold leading-tight text-ink">
                        <bdi>{gloss}</bdi>
                      </span>
                      <span className="mt-0.5 block truncate font-sans text-[12px] leading-[1.3] text-muted">
                        {byline}
                      </span>
                      {learners.length > 0 && (
                        <span className="mt-1.5 flex items-center gap-1">
                          {learners.map((p) => {
                            const lvl = app.progress[p.id]?.[f.signId]?.masteryLevel ?? 0;
                            return (
                              <span
                                key={p.id}
                                title={`${p.displayName} · ${num(lvl, lang)}/3`}
                                aria-label={`${p.displayName} · ${num(lvl, lang)}/3`}
                                className="h-2.5 w-2.5 flex-none rounded-full"
                                style={{ backgroundColor: dotColor(lvl) }}
                              />
                            );
                          })}
                        </span>
                      )}
                    </span>
                    {by && (
                      <span
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-full font-display text-[13px] font-bold"
                        style={{ backgroundColor: c.bg, color: c.fg }}
                        aria-hidden="true"
                      >
                        {initialOf(by.displayName)}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <Card className="p-4 text-center text-sm text-muted">
                {flagger
                  ? pick(
                      lang,
                      `${flagger.displayName} hasn’t flagged a sign yet.`,
                      `لم يرفع ${flagger.displayName} أي إشارة بعد.`,
                    )
                  : pick(lang, "No flags yet.", "لا توجد إشارات بعد.")}
              </Card>
            )}
          </div>

          {/* B9 · Primary household action — coral flag CTA → the flag picker. */}
          <SpringButton
            variant="coral"
            size="lg"
            full
            onClick={() => go({ name: "flagPicker" })}
            className="mt-[18px] gap-2"
          >
            <Icon name="flag" fill />
            {t("famFlagTitle", lang)}
          </SpringButton>

          {/* B10 · League note — warm, no-rankings tone. */}
          <p className="mt-3 text-center font-sans text-[11px] leading-[1.4] text-muted">
            {t("famLeagueNote", lang)}
          </p>
          {/* H8 · honest single-device disclosure — the whole household lives in
              this browser's storage; export (Settings) is the only backup. */}
          <p className="mt-2 text-center font-sans text-[11px] leading-[1.4] text-muted">
            {t("famDataLocal", lang)}
          </p>
        </section>

        {/* Demoted celebratory secondary — "Signs we can all do" honeycomb + milestone.
            Preserves the board deep-links + the second flag-picker route. */}
        <section className="mt-7">
          <p className={eyebrowCls}>{t("famBoard", lang)}</p>
          {board.length === 0 ? (
            <Card className="mt-3 p-4 text-center text-sm text-muted">
              {t("famBoardEmpty", lang)}
            </Card>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {Array.from({ length: honeycombCells }).map((_, i) => {
                  const signId = board[i];
                  const sign = signId ? signById(signId) : null;
                  const cellClass = `flex aspect-square items-center justify-center text-lg ${HEX} ${
                    sign
                      ? "bg-gold text-ink shadow-gold motion-safe:animate-pop-in"
                      : "border-2 border-dashed border-teal/15 bg-paper/40 text-transparent"
                  } ${i % 2 === 1 ? "translate-y-1/4" : ""}`;
                  if (sign) {
                    return (
                      <button
                        key={signId}
                        type="button"
                        onClick={() => goToSign(sign)}
                        aria-label={pick(lang, sign.glossEn, sign.glossAr)}
                        className={`${cellClass} transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal`}
                        style={{ animationDelay: `${i * 40}ms` }}
                        title={pick(lang, sign.glossEn, sign.glossAr)}
                      >
                        {/* SignGlyph — real handshape / letter / honest icon, never emoji-as-sign (H14). */}
                        <span aria-hidden="true">
                          <SignGlyph sign={sign} lang={lang} className="text-lg" imgClassName="h-6 w-6 object-contain" />
                        </span>
                      </button>
                    );
                  }
                  return (
                    <div key={`empty-${i}`} className={cellClass}>
                      <span aria-hidden="true" />
                    </div>
                  );
                })}
              </div>

              {/* Board pills — quick-practice deep-links for mastered signs. */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {board.slice(0, 8).map((signId) => {
                  const sign = signById(signId);
                  if (!sign) return null;
                  return (
                    <Pill
                      key={signId}
                      tone="gold"
                      onClick={() => goToSign(sign)}
                      ariaLabel={pick(lang, sign.glossEn, sign.glossAr)}
                    >
                      <span aria-hidden="true">
                        <SignGlyph sign={sign} lang={lang} className="text-base" imgClassName="h-5 w-5 object-contain" />
                      </span>
                      {pick(lang, sign.glossEn, sign.glossAr)}
                    </Pill>
                  );
                })}
              </div>

              {/* Milestone teaser — the second flag-picker route. */}
              <Card
                onClick={() => go({ name: "flagPicker" })}
                className="mt-4 flex items-center justify-between gap-3 p-4"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/20 text-gold">
                    <Icon name="emoji_events" fill />
                  </span>
                  <span className="text-start">
                    <span className="block font-display text-sm font-bold text-teal">
                      {pick(
                        lang,
                        `${milestoneTarget} Combined Signs!`,
                        `${num(milestoneTarget, lang)} إشارة مشتركة!`,
                      )}
                    </span>
                    <span className="block font-sans text-xs text-muted">
                      {formatPercent(Math.round(boardPct * 100), lang)}{" "}
                      {pick(lang, "there", "من الطريق")}
                    </span>
                  </span>
                </span>
                <Icon name="arrow_forward_ios" className="text-gold rtl:rotate-180" />
              </Card>
            </>
          )}
        </section>
      </div>
    </ScreenShell>
  );
}
