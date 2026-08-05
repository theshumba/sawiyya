// Home → Learn tab: a teal app bar (greeting + streak / today's goal / family)
// above a winding vertical node trail — unit banner → nodes (done / current /
// locked) → treasure milestone — with Fanan cheering beside the current node and
// a bottom-sheet start popover on tap.
//
// Phase 1, "one road" (2026-08-01 UX audit): the trail IS the screen. The eight-
// card secondary stack that used to sit beneath it offered nine different answers
// to "what do I do now", six of them the same camera screen under six names, so
// opening Sawiyya was a decision rather than an action. It is gone. The only card
// that survives is the family flag request, promoted ABOVE the trail because it is
// the one thing on this screen nobody else's app does. Node status now comes from
// lesson/unlock.ts, so the padlocks mean what they say.
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { num, pick, t, weekdayName, WEEKDAY_COUNT } from "../i18n";
import { signById, LESSONS, UNITS } from "../content/signs";
import {
  GOAL_XP,
  activeProfile,
  dueSignIds,
  pinnedFlagSigns,
  streakFor,
  useApp,
  xpTodayFor,
} from "../store/app";
import { useUi } from "../store/ui";
import { Icon, Eyebrow } from "../components/ui";
import { ScreenShell } from "../components/ScreenShell";
import { FlagCard } from "../components/FlagCard";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { Fanan } from "../components/Fanan";
import { JourneyStrip } from "../components/Journey";
import { useDialog } from "../components/useDialog";
import { nextMilestone } from "../lesson/milestones";
import { currentLessonId, lessonState } from "../lesson/unlock";
import type { Lesson } from "../types";

type NodeStatus = "current" | "done" | "locked" | "milestone";
interface PathNode {
  id: string;
  status: NodeStatus;
  lesson?: Lesson;
  title: string;
  off: number;
}

// Coral pulse-ring + Fanan bob keyframes, lifted literally from the design
// <style>. Kept local (the global sheet has a gold pulse-ring only). The global
// prefers-reduced-motion rule in styles.css freezes these via !important.
const PATH_KEYFRAMES = `
@keyframes sw-pulse{0%{box-shadow:0 0 0 0 rgba(232,101,76,.5)}70%{box-shadow:0 0 0 16px rgba(232,101,76,0)}100%{box-shadow:0 0 0 0 rgba(232,101,76,0)}}
@keyframes sw-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
`;

export function Home() {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const [openId, setOpenId] = useState<string | null>(null);
  const currentRef = useRef<HTMLDivElement | null>(null);
  const scrolled = useRef(false);
  // H16: focus the sheet on open, trap Tab inside it, Escape/backdrop-click
  // to dismiss, restore focus to the node button that opened it.
  const sheetRef = useDialog<HTMLDivElement>(openId !== null, () => setOpenId(null));

  // Centre the current node on first mount (design scrollRef → scrollTop 210).
  useEffect(() => {
    if (scrolled.current || !currentRef.current) return;
    scrolled.current = true;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const el = currentRef.current;
    const id = window.setTimeout(() => {
      // Manual centring instead of scrollIntoView: Chromium moves the
      // sequential-focus starting point to a scrollIntoView target, which made
      // the first Tab land on the current node instead of the skip link (L13).
      const r = el.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + r.top - (window.innerHeight - r.height) / 2,
        behavior: reduce ? "auto" : "smooth",
      });
    }, 380);
    return () => window.clearTimeout(id);
  }, []);

  if (!profile) return <NoProfileFallback />;
  const lang = profile.language;

  const goalXp = GOAL_XP[profile.dailyGoal];
  const xpToday = xpTodayFor(profile); // today's XP, not yesterday's stale total (#5)
  const goalProgress = xpToday / goalXp;

  const prog = app.progress[profile.id] ?? {};
  // The lesson to do next, or undefined once the whole path is behind them.
  const nextLessonId = currentLessonId(prog);

  // A one-person household is the default after onboarding, and there the raiser
  // IS the learner, so hiding own-flags left flagging with no visible effect
  // anywhere. Households of two or more still hide them, otherwise a Deaf member
  // would see their own requests come back as incoming ones.
  const solo = app.profiles.length === 1;
  const flags = pinnedFlagSigns(app, profile.id).filter(
    (f) => solo || f.raisedByProfileId !== profile.id,
  );

  // Node status comes from the shared trail rule, not from each lesson's own
  // signs: four Words self-marks reach mastery 2 on the whole of "First
  // connections", which used to draw a green tick on the fifth node while the
  // four alphabet nodes before it were still locked.
  const nodes = LESSONS.map((lesson) => ({
    lesson,
    status: lessonState(lesson.id, prog),
  }));

  const ms = nextMilestone(app, profile.id, lang);

  // Winding horizontal offsets (design uses px translateX; mirror in RTL).
  const nodeOffsets = [0, 48, -48];
  const pathNodes: PathNode[] = nodes.map(({ lesson, status }, i) => ({
    id: lesson.id,
    status,
    lesson,
    title: pick(lang, lesson.titleEn, lesson.titleAr),
    off: nodeOffsets[i % nodeOffsets.length],
  }));
  // One banner per unit (H22). The trail carries every lesson, so a single
  // banner filed the four word lessons under "The Arabic Alphabet".
  const unitGroups = UNITS.map((u, i) => ({
    unit: u,
    number: i + 1,
    nodes: pathNodes.filter((n) => n.lesson?.unitId === u.id),
  })).filter((g) => g.nodes.length > 0);
  // Treasure milestone closes the trail (bound to `ms`, not a mock ITEM).
  const milestoneNode: PathNode | null = ms
    ? { id: "__milestone", status: "milestone", title: ms.label, off: 0 }
    : null;

  const openNode =
    (milestoneNode?.id === openId ? milestoneNode : null) ??
    pathNodes.find((n) => n.id === openId) ??
    null;

  // The milestone's own numbers, so the chest sheet describes the rung it
  // actually represents instead of a fixed "Clear Unit 1" line.
  const milestoneMeta = ms ? `${num(ms.done, lang)} / ${num(ms.target, lang)}` : "";

  // Route a rung at whatever advances it. With the path finished there is no
  // lesson left to route to, so the rung hands over to the Practise tab rather
  // than opening a bare camera. (The "words" rung went with the A1 word unit,
  // 2026-08-05 — docs/RECORD-WORD-SIGNS.md.)
  const goMilestone = () => {
    if (!ms) return;
    if (ms.kind === "family") go({ name: "family" });
    else if (nextLessonId) go({ name: "lesson", lessonId: nextLessonId });
    else go({ name: "practiseChooser" });
  };

  const initial = profile.displayName.trim().charAt(0) || "•";

  // Phase 2 item 4 — onboarding asked which days they'd practise, so Home has
  // to show it knows. null when they picked none (or every day, where "today is
  // one of your practice days" is true but says nothing), and the greeting's
  // usual line stands.
  const practiseLine = (() => {
    const picked = profile.practiseDays;
    if (picked.length === 0 || picked.length === WEEKDAY_COUNT) return null;
    const today = new Date().getDay();
    if (picked.includes(today)) return t("homePractiseToday", lang);
    // The next picked day at or after tomorrow, wrapping through the week.
    const next = Array.from({ length: WEEKDAY_COUNT }, (_, i) => (today + 1 + i) % WEEKDAY_COUNT).find(
      (d) => picked.includes(d),
    );
    return next === undefined
      ? null
      : t("homePractiseNext", lang).replace("{day}", weekdayName(next, lang));
  })();

  // App-bar stat chips (streak / today's goal / family). The gold chip used to
  // carry lifetime XP, a number nothing on this screen can move; today's goal is
  // the one the trail actually advances, so it lives here now and the Daily goal
  // card below the trail is gone.
  const stats: { marker: JSX.Element; value: string; label: string }[] = [
    {
      marker: (
        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#E8654C", flex: "none" }} />
      ),
      value: num(streakFor(profile), lang), // read-time: lapsed streaks show 0, not stale (M26)
      label: t("homeStreak", lang),
    },
    {
      marker: (
        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#F0C879", flex: "none" }} />
      ),
      value:
        goalProgress >= 1
          ? `${num(goalXp, lang)} / ${num(goalXp, lang)}`
          : `${num(xpToday, lang)} / ${num(goalXp, lang)}`,
      label: t("homeGoalStat", lang),
    },
    {
      marker: (
        <span style={{ width: 18, height: 18, borderRadius: 6, background: "#F08A75", flex: "none" }} />
      ),
      value: num(app.profiles.length, lang),
      label: t("homeFamilyStat", lang),
    },
  ];

  // ── per-status node styling ──────────────────────────────────────────────
  const circleStyle = (status: NodeStatus): CSSProperties => {
    const base: CSSProperties = {
      position: "relative",
      border: "none",
      padding: 0,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "transform .08s",
    };
    switch (status) {
      case "done":
        return { ...base, width: 62, height: 62, borderRadius: "50%", background: "#0F6E6A", boxShadow: "0 5px 0 #0A4F4C" };
      case "current":
        return {
          ...base,
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "#E8654C",
          boxShadow: "0 6px 0 #C54F3A",
          animation: "sw-pulse 1.8s ease-out infinite",
        };
      case "milestone":
        return { ...base, width: 62, height: 62, borderRadius: 20, background: "#F6EFE3", boxShadow: "0 4px 0 #D9CBB2" };
      default: // locked
        return { ...base, width: 62, height: 62, borderRadius: "50%", background: "#EDE3D2", boxShadow: "0 4px 0 #D9CBB2" };
    }
  };

  const nodeGlyph = (status: NodeStatus) => {
    switch (status) {
      case "done": // white check — never mirrors (§6)
        return (
          <span
            style={{
              display: "block",
              width: 20,
              height: 11,
              borderInlineStart: "5px solid #FBF7EF",
              borderBottom: "5px solid #FBF7EF",
              transform: "rotate(-45deg) translate(1px,-2px)",
              borderRadius: 2,
            }}
          />
        );
      case "current":
        return <Icon name="sign_language" className="!text-4xl text-white" />;
      case "milestone": // treasure chest
        return (
          <span style={{ position: "relative", display: "block", width: 26, height: 19, background: "#F0C879", borderRadius: 5, boxShadow: "inset 0 4px 0 #E6B24C" }}>
            <span style={{ position: "absolute", top: 7, left: "50%", transform: "translateX(-50%)", width: 6, height: 8, borderRadius: 2, background: "#C89A3D" }} />
          </span>
        );
      default: // padlock
        return (
          <span style={{ position: "relative", display: "block", width: 15, height: 12, borderRadius: 3, background: "#B8C4C1" }}>
            <span style={{ position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)", width: 11, height: 11, border: "2.5px solid #B8C4C1", borderBottom: "none", borderRadius: "6px 6px 0 0" }} />
          </span>
        );
    }
  };

  const labelStyle = (status: NodeStatus): CSSProperties =>
    status === "current"
      ? { font: "700 13px/1.2 Rubik,sans-serif", color: "#16302E", marginTop: 9, textAlign: "center" }
      : {
          font: "500 12px/1.2 'Readex Pro',sans-serif",
          // H15: #A9B8B5 (1.79:1) and #5C726F (4.49:1) both fail AA on sand —
          // one passing muted tone; the circle treatment still marks locked.
          color: "#566B68",
          marginTop: 9,
          textAlign: "center",
        };

  // One line per status, shared by the node's aria-label and its sheet, so a
  // locked node stops announcing itself as camera practice.
  const nodeMeta = (status: NodeStatus): string =>
    status === "current"
      ? t("pathNewSign", lang)
      : status === "done"
        ? t("pathDoneMeta", lang)
        : status === "milestone"
          ? milestoneMeta
          : t("pathLockedMeta", lang);

  const renderNode = (node: PathNode) => {
    const isCurrent = node.status === "current";
    const off = lang === "ar" ? -node.off : node.off;
    return (
      <div
        key={node.id}
        ref={isCurrent ? currentRef : undefined}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "9px 0" }}
      >
        <div style={{ position: "relative", transform: `translateX(${off}px)` }}>
          {isCurrent && (
            <div style={{ position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)", background: "#B54834", color: "#FBF7EF", font: "800 10px/1 Rubik,sans-serif", letterSpacing: ".08em", padding: "6px 11px", borderRadius: 99, boxShadow: "0 4px 0 #9C3D2C", whiteSpace: "nowrap", zIndex: 3 }}>
              {t("homeStartBadge", lang)}
            </div>
          )}
          <button
            type="button"
            aria-label={`${node.title} · ${nodeMeta(node.status)}`}
            aria-haspopup="dialog"
            onClick={() => setOpenId(node.id)}
            className="active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
            style={circleStyle(node.status)}
          >
            {nodeGlyph(node.status)}
          </button>
          {isCurrent && (
            // Fanan cheers beside the current node; artwork never mirrors (§6),
            // only its anchor swaps sides via the logical inset.
            <div style={{ position: "absolute", top: 6, insetInlineStart: "100%", marginInlineStart: 2, animation: "sw-bob 2.4s ease-in-out infinite" }}>
              <Fanan pose="cheer" scale={0.42} />
            </div>
          )}
        </div>
        <div style={labelStyle(node.status)}>{node.title}</div>
      </div>
    );
  };

  return (
    <ScreenShell lang={lang} chrome="tabs">
      <style>{PATH_KEYFRAMES}</style>

      {/* Block A — teal app bar (greeting + stat chips). NOT navigation. */}
      <header
        className="sticky top-0 z-10"
        style={{ background: "#0F6E6A", borderRadius: "0 0 24px 24px", boxShadow: "0 6px 16px rgba(15,110,106,.25)" }}
      >
        <div className="mx-auto max-w-xl" style={{ padding: "8px 20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              {/* M17: Home had zero headings — this greeting is the natural h1. */}
              <h1 className="font-display" style={{ fontWeight: 800, fontSize: 21, lineHeight: 1.1, color: "#FBF7EF", margin: 0 }}>
                {pick(lang, "Marhaba, ", "مرحبًا يا ")}
                <bdi>{profile.displayName}</bdi>
              </h1>
              {/* Phase 2 item 4: the practise-days answer written back here, so
                  the question visibly mattered. Silent when they never picked
                  any — an unanswered question must not become a claim. */}
              <div style={{ font: "500 12px/1.2 'Readex Pro',sans-serif", color: "rgba(251,247,239,.9)", marginTop: 3 }}>
                {practiseLine ?? t("homeGreetSub", lang)}
              </div>
            </div>
            <div
              className="font-display"
              style={{ width: 44, height: 44, borderRadius: "50%", background: "#F0C879", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", boxShadow: "0 4px 0 #C89A3D" }}
            >
              <bdi style={{ fontWeight: 800, fontSize: 18, color: "#16302E" }}>{initial}</bdi>
            </div>
          </div>
          {/* Phase 4 · the chip row is the door to Progress. Progress used to be
              reachable only from a menu behind the learner's own avatar, and
              nothing in the app said so. These three numbers ARE the summary of
              that screen, so tapping them to see the rest is the obvious move —
              and it costs the trail nothing, unlike another card under it. */}
          <button
            type="button"
            onClick={() => go({ name: "progress" })}
            aria-label={t("homeSeeProgress", lang)}
            className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-teal active:scale-[.99]"
            style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "stretch", border: "none", background: "none", padding: 0, cursor: "pointer", textAlign: "start" }}
          >
            {stats.map((s, i) => (
              <span key={i} style={{ flex: 1, background: "rgba(255,255,255,.08)", borderRadius: 13, padding: "8px 10px", display: "flex", alignItems: "center", gap: 7 }}>
                {s.marker}
                <span>
                  <span className="font-display" style={{ display: "block", fontWeight: 800, fontSize: 15, lineHeight: 1, color: "#FBF7EF" }}>
                    {s.value}
                  </span>
                  <span style={{ display: "block", font: "500 9px/1 'Readex Pro',sans-serif", color: "#FBF7EF", marginTop: 2 }}>
                    {s.label}
                  </span>
                </span>
              </span>
            ))}
            <span style={{ display: "flex", alignItems: "center", color: "#FBF7EF", flex: "none" }} aria-hidden="true">
              <Icon name="chevron_right" className="!text-xl rtl:rotate-180" />
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-5">
        {/* Family requests — ABOVE the trail, and only when someone has actually
            raised one. This is the differentiator: the Deaf member picks what the
            household learns. Buried at the bottom of an eight-card stack it was
            the least visible thing on the screen. The sign opens its own detail,
            never a camera pre-targeted at a sign the learner has not met. */}
        {flags.length > 0 &&
          (() => {
            const flag = flags[0];
            const sign = signById(flag.signId);
            // "You needs this" is not a sentence: name the requester only when it
            // is someone else, which in a solo household it never is.
            const by =
              flag.raisedByProfileId === profile.id
                ? undefined
                : app.profiles.find((p) => p.id === flag.raisedByProfileId);
            if (!sign) return null;
            return (
              <section className="space-y-3 pt-5" aria-label={t("homeFlagged", lang)}>
                <div className="flex items-center justify-between gap-3">
                  <Eyebrow lang={lang} className="!text-coral">
                    {t("homeFlagged", lang)}
                  </Eyebrow>
                  <button
                    type="button"
                    onClick={() => go({ name: "family" })}
                    className="inline-flex items-center gap-1 rounded-full px-1 text-sm font-bold text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  >
                    {/* One flag is the common case, and it read "1 family
                        requests". Same singular/plural shape Family.tsx uses
                        for its learner count. */}
                    {flags.length === 1
                      ? t("homeFlagOne", lang)
                      : `${num(flags.length, lang)} ${t("homeFlagMany", lang)}`}
                    <Icon name="arrow_forward" className="!text-base rtl:rotate-180" />
                  </button>
                </div>
                <FlagCard
                  sign={sign}
                  requestedBy={by ? `${by.displayName} ${t("homeNeeds", lang)}` : undefined}
                  lang={lang}
                  compact
                  onClick={() => go({ name: "allSigns", signId: sign.id })}
                />
              </section>
            );
          })()}

        {/* Block B — the winding node trail. This is the screen. */}
        <section aria-labelledby="trail-title" className="pt-4 pb-4">
          {/* Phase 4 · the trail says what it is, out loud. Home's only heading
              was "Marhaba, <name>", and the trail itself was named for screen
              readers and nobody else. The word is navLearn — the same word on
              the tab that opens this screen, not a fifth name for it. */}
          <h2
            id="trail-title"
            className="font-display"
            style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.1, color: "#16302E", marginTop: 4 }}
          >
            {t("navLearn", lang)}
          </h2>
          <p style={{ font: "500 13px/1.35 'Readex Pro',sans-serif", color: "#566B68", marginTop: 3 }}>
            {t("homeTrailSub", lang)}
          </p>

          {/* B1 · One teal unit banner per unit, each followed by its own nodes. */}
          {unitGroups.map((g) => (
            <div key={g.unit.id}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#0F6E6A", borderRadius: 18, padding: "13px 16px", margin: "14px 0 6px", boxShadow: "0 4px 0 #0A4F4C" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "700 10px/1 ui-monospace,Menlo,monospace", letterSpacing: ".12em", color: "#F6E3BC", textTransform: "uppercase" }}>
                    {`${t("homeUnit", lang)} ${num(g.number, lang)}`}
                  </div>
                  <div className="font-display" style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1, color: "#FBF7EF", marginTop: 4 }}>
                    {pick(lang, g.unit.titleEn, g.unit.titleAr)}
                  </div>
                </div>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <div style={{ width: 16, height: 13, border: "2.5px solid #FBF7EF", borderRadius: 2, borderInlineStartWidth: 5 }} />
                </div>
              </div>

              {/* B2 · Nodes for this unit. */}
              {g.nodes.map(renderNode)}
            </div>
          ))}

          {/* B3 · Treasure milestone closes the trail, after the last unit. */}
          {milestoneNode && renderNode(milestoneNode)}
        </section>

        {/* Phase 3 · one getting-started row, BELOW the trail and only when the
            trail cannot carry it itself — install, review, the family flag. The
            road keeps primacy; this is the app naming a part of itself the road
            never passes. It renders nothing at all once there is nothing left to
            introduce, which is why Phase 1's card stack is not creeping back. */}
        <JourneyStrip lang={lang} dueCount={dueSignIds(app, profile.id).length} />
      </div>

      {/* Block C — node start popover (bottom sheet). */}
      {openNode &&
        (() => {
          const st = openNode.status;
          const isMilestone = st === "milestone";
          // Only a real locked node is a dead end now. The chest used to count
          // as locked, which made it un-openable at every level of progress.
          const locked = st === "locked";
          const teal = st === "done" || isMilestone;
          const meta = nodeMeta(st);
          const btnLabel = isMilestone
            ? t("lsPartDoneCta", lang)
            : st === "current"
              ? t("pathStartCta", lang)
              : st === "done"
                ? t("pathReview", lang)
                : t("pathLocked", lang);
          // H15 tones: the pre-H15 coral (#E8654C under #FBF7EF) measured 3.07:1
          // and the locked label 2.1:1. coral-deep and the passing muted grey.
          const iconBg = locked ? "#B8C4C1" : teal ? "#0F6E6A" : "#B54834";
          const btnBg = locked ? "#EDE3D2" : teal ? "#0F6E6A" : "#B54834";
          const btnSh = locked ? "none" : teal ? "0 5px 0 #0A4F4C" : "0 5px 0 #9C3D2C";
          // One node, one action. The sheet used to carry a second "Practise with
          // camera" button under the primary one, which is how the trail became
          // its own camera door: the lesson already mixes watch, quiz and camera
          // drills via engine.ts, so the lesson IS the way to the camera.
          const onAction = () => {
            if (openNode.lesson && (st === "current" || st === "done")) {
              go({ name: "lesson", lessonId: openNode.lesson.id });
            } else if (isMilestone) {
              goMilestone();
            }
            setOpenId(null);
          };
          return (
            <div
              onClick={() => setOpenId(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(22,48,46,.5)", zIndex: 40, display: "flex", alignItems: "flex-end" }}
            >
              <div
                ref={sheetRef}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={openNode.title}
                tabIndex={-1}
                className="mx-auto w-full max-w-xl animate-rise focus:outline-none"
                style={{ background: "#FBF7EF", borderRadius: "26px 26px 0 0", padding: "22px 22px 26px", boxShadow: "0 -10px 40px rgba(0,0,0,.2)" }}
              >
                <div style={{ width: 42, height: 5, borderRadius: 99, background: "#EDE3D2", margin: "0 auto 16px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={{ width: 56, height: 56, flex: "none", borderRadius: isMilestone ? 16 : "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isMilestone ? (
                      <Icon name="card_giftcard" fill className="!text-2xl text-white" />
                    ) : locked ? (
                      <span style={{ position: "relative", display: "block", width: 16, height: 13, borderRadius: 3, background: "#FBF7EF" }}>
                        <span style={{ position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)", width: 12, height: 11, border: "2.5px solid #FBF7EF", borderBottom: "none", borderRadius: "6px 6px 0 0" }} />
                      </span>
                    ) : st === "done" ? (
                      <span style={{ fontSize: 26, lineHeight: 1, color: "#FBF7EF" }}>✓</span>
                    ) : (
                      <Icon name="sign_language" className="!text-2xl text-white" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-display" style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.1, color: "#16302E" }}>
                      {openNode.title}
                    </div>
                    <div style={{ font: "500 12px/1.3 'Readex Pro',sans-serif", color: "#5C726F", marginTop: 3 }}>{meta}</div>
                  </div>
                </div>
                {/* The chest shows how far along its own rung is, so it stops
                    being a gold box with no readable state. */}
                {isMilestone && ms && (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-teal/10">
                    <div
                      className="h-full rounded-full bg-gold transition-all"
                      style={{ width: `${Math.max(4, ms.progress * 100)}%` }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  disabled={locked}
                  onClick={locked ? undefined : onAction}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                  style={{ display: "block", width: "100%", marginTop: 18, textAlign: "center", font: "700 16px/1 Rubik,sans-serif", padding: 15, borderRadius: 16, border: "none", background: btnBg, boxShadow: btnSh, color: locked ? "#566B68" : "#FBF7EF", cursor: locked ? "default" : "pointer", opacity: locked ? 0.85 : 1 }}
                >
                  {btnLabel}
                </button>
              </div>
            </div>
          );
        })()}
    </ScreenShell>
  );
}
