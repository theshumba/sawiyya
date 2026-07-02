// Home → Learn tab. Presentation-only re-skin to the "Home learning path" design
// (design/rebuild-source/Sawiyya Home Path.dc.html): a teal app bar (greeting +
// three stat chips) above a winding vertical node trail — unit banner → nodes
// (done / current / locked) → treasure milestone — with Fanan cheering beside the
// current node and a bottom-sheet start popover on tap. The old landscape/palm
// hero is dropped. Logic unchanged (contract §1) — every store hook, route (incl.
// cameraGradable→targetSignId gate + lessonId fallback), guard and i18n key is
// preserved; ScreenShell/AppNav still own the status bar + bottom tab bar.
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { num, pick, t } from "../i18n";
import { signById, LESSONS, UNIT_A1_U1 } from "../content/signs";
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
import { Card, Icon, Eyebrow, Title } from "../components/ui";
import { ScreenShell } from "../components/ScreenShell";
import { FlagCard } from "../components/FlagCard";
import { GoalCard } from "../components/GoalCard";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { Fanan } from "../components/Fanan";
import { nextMilestone } from "../lesson/milestones";
import type { Lesson } from "../types";

/** First camera-gradable sign in a lesson, gated so non-gradable lessons open the
 *  generic camera (practice-first) rather than dropping into a stale lesson. */
const lessonCameraTarget = (lesson: Lesson): string | undefined =>
  lesson.signIds.map(signById).find((s) => s?.cameraGradable)?.id;

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

  // Centre the current node on first mount (design scrollRef → scrollTop 210).
  useEffect(() => {
    if (scrolled.current || !currentRef.current) return;
    scrolled.current = true;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const el = currentRef.current;
    const id = window.setTimeout(() => {
      el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    }, 380);
    return () => window.clearTimeout(id);
  }, []);

  if (!profile) return <NoProfileFallback />;
  const lang = profile.language;

  const goalXp = GOAL_XP[profile.dailyGoal];
  const xpToday = xpTodayFor(profile); // today's XP, not yesterday's stale total (#5)
  const goalProgress = xpToday / goalXp;
  const goalPct = Math.round(Math.min(1, goalProgress) * 100);

  // next lesson = first lesson with an unseen sign; falls back to L1 replay
  const prog = app.progress[profile.id] ?? {};
  const nextLesson =
    LESSONS.find((l) => l.signIds.some((id) => (prog[id]?.masteryLevel ?? 0) < 2)) ?? LESSONS[0];

  const due = dueSignIds(app, profile.id);
  const flags = pinnedFlagSigns(app, profile.id).filter(
    (f) => f.raisedByProfileId !== profile.id,
  );

  // journey node status derived from existing progress data
  const nodes = LESSONS.map((lesson) => {
    const complete = lesson.signIds.every((id) => (prog[id]?.masteryLevel ?? 0) >= 2);
    const status: "current" | "done" | "locked" =
      lesson.id === nextLesson.id ? "current" : complete ? "done" : "locked";
    return { lesson, status };
  });

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
  // Treasure milestone closes the unit trail (bound to `ms`, not a mock ITEM).
  if (ms) pathNodes.push({ id: "__milestone", status: "milestone", title: ms.label, off: 0 });

  const openNode = pathNodes.find((n) => n.id === openId) ?? null;

  const goalLabel =
    goalProgress >= 1
      ? t("homeAllDone", lang)
      : `${num(xpToday, lang)} / ${num(goalXp, lang)} ${t("xp", lang)}`;

  const initial = profile.displayName.trim().charAt(0) || "•";

  // App-bar stat chips (streak / gold / family), matching the design markers.
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
      value: num(profile.xp, lang),
      label: t("homeGoldStat", lang),
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
          color: status === "locked" || status === "milestone" ? "#A9B8B5" : "#5C726F",
          marginTop: 9,
          textAlign: "center",
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
              <div className="font-display" style={{ fontWeight: 800, fontSize: 21, lineHeight: 1.1, color: "#FBF7EF" }}>
                {pick(lang, "Marhaba, ", "مرحبًا يا ")}
                <bdi>{profile.displayName}</bdi>
              </div>
              <div style={{ font: "500 12px/1.2 'Readex Pro',sans-serif", color: "rgba(251,247,239,.72)", marginTop: 3 }}>
                {t("homeGreetSub", lang)}
              </div>
            </div>
            <div
              className="font-display"
              style={{ width: 44, height: 44, borderRadius: "50%", background: "#F0C879", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", boxShadow: "0 4px 0 #C89A3D" }}
            >
              <bdi style={{ fontWeight: 800, fontSize: 18, color: "#16302E" }}>{initial}</bdi>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,.12)", borderRadius: 13, padding: "8px 10px", display: "flex", alignItems: "center", gap: 7 }}>
                {s.marker}
                <div>
                  <div className="font-display" style={{ fontWeight: 800, fontSize: 15, lineHeight: 1, color: "#FBF7EF" }}>
                    {s.value}
                  </div>
                  <div style={{ font: "500 9px/1 'Readex Pro',sans-serif", color: "rgba(251,247,239,.7)", marginTop: 2 }}>
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-5">
        {/* Block B — winding node trail. The current-node START is the one dominant action. */}
        <section aria-label={t("homeToday", lang)} className="pt-4">
          {/* B1 · Unit banner (teal). */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#0F6E6A", borderRadius: 18, padding: "13px 16px", margin: "14px 0 6px", boxShadow: "0 4px 0 #0A4F4C" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: "700 10px/1 ui-monospace,Menlo,monospace", letterSpacing: ".12em", color: "#F0C879", textTransform: "uppercase" }}>
                {`${t("homeUnit", lang)} ${num(1, lang)}`}
              </div>
              <div className="font-display" style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1, color: "#FBF7EF", marginTop: 4 }}>
                {pick(lang, UNIT_A1_U1.titleEn, UNIT_A1_U1.titleAr)}
              </div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <div style={{ width: 16, height: 13, border: "2.5px solid #FBF7EF", borderRadius: 2, borderInlineStartWidth: 5 }} />
            </div>
          </div>

          {/* B2 · Nodes. */}
          {pathNodes.map((node) => {
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
                    <div style={{ position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)", background: "#E8654C", color: "#FBF7EF", font: "800 10px/1 Rubik,sans-serif", letterSpacing: ".08em", padding: "6px 11px", borderRadius: 99, boxShadow: "0 4px 0 #C54F3A", whiteSpace: "nowrap", zIndex: 3 }}>
                      {t("homeStartBadge", lang)}
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={`${node.title} — ${t("practiceCamera", lang)}`}
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
          })}
        </section>

        {/* Block D — secondary stack (functional contract; reskinned to tokens). */}
        <section className="mt-6 space-y-6 pb-2">
          {/* Slim secondary "Practise" link — keeps the camera route alive. */}
          <Card
            variant="elevated"
            className="flex items-center gap-3 p-5"
            onClick={() => go({ name: "camera" })}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral/10">
              <Icon name="videocam" fill className="!text-2xl text-coral" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-ink">{t("camPractice", lang)}</p>
              <p className="text-sm text-muted">{t("camPrivacy", lang)}</p>
            </div>
            <Icon name="arrow_forward" className="text-2xl text-teal rtl:rotate-180" />
          </Card>

          {/* Family flags — one compact FlagCard + a count deep-link to the Family tab. */}
          {flags.length > 0 &&
            (() => {
              const slice = flags.slice(0, 3);
              const flag = slice[0];
              const sign = signById(flag.signId);
              const by = app.profiles.find((p) => p.id === flag.raisedByProfileId);
              if (!sign) return null;
              return (
                <section className="space-y-3" aria-label={t("homeFlagged", lang)}>
                  <div className="flex items-center justify-between gap-3">
                    <Eyebrow lang={lang} className="!text-coral">
                      {t("homeFlagged", lang)}
                    </Eyebrow>
                    <button
                      type="button"
                      onClick={() => go({ name: "family" })}
                      className="inline-flex items-center gap-1 text-sm font-bold text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded-full px-1"
                    >
                      {pick(
                        lang,
                        `${num(slice.length, lang)} family requests`,
                        `${num(slice.length, lang)} طلبات العائلة`,
                      )}
                      <Icon name="arrow_forward" className="!text-base rtl:rotate-180" />
                    </button>
                  </div>
                  <FlagCard
                    sign={sign}
                    requestedBy={by ? `${by.displayName} ${t("homeNeeds", lang)}` : undefined}
                    lang={lang}
                    compact
                    onClick={() =>
                      go({
                        name: "camera",
                        targetSignId: sign.cameraGradable ? sign.id : undefined,
                      })
                    }
                  />
                </section>
              );
            })()}

          {/* Review-due — routes straight to the camera on the first due sign. */}
          {due.length > 0 && (
            <Card
              variant="elevated"
              className="flex items-center gap-4 p-5"
              onClick={() => {
                const first = due.map(signById).find((s) => s?.cameraGradable)?.id;
                go({ name: "camera", targetSignId: first });
              }}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/20">
                <Icon name="history" className="!text-3xl text-gold-deep" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-ink">{t("homeReviewDue", lang)}</p>
                <p className="text-sm text-muted">
                  {num(due.length, lang)} {t("homeReviewCta", lang)}
                </p>
              </div>
              <Icon name="arrow_forward" className="text-2xl text-teal rtl:rotate-180" />
            </Card>
          )}

          {/* Empty state — nothing flagged AND nothing due. */}
          {flags.length === 0 && due.length === 0 && (
            <Card
              variant="elevated"
              className="flex items-center gap-4 p-5"
              onClick={() => go({ name: "camera" })}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral/10">
                <Icon name="videocam" fill className="!text-2xl text-coral" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-ink">
                  {pick(lang, "All caught up — keep your hands warm", "كل شيء مكتمل — أبقِ يديك جاهزتين")}
                </p>
                <p className="text-sm text-muted">
                  {pick(lang, "Practise any sign on camera", "تدرّب على أي إشارة بالكاميرا")}
                </p>
              </div>
              <Icon name="arrow_forward" className="text-2xl text-teal rtl:rotate-180" />
            </Card>
          )}

          {/* Daily goal — the single GoalCard widget. */}
          <div className="space-y-3">
            <Title className="!text-2xl">{t("homeDailyGoal", lang)}</Title>
            <GoalCard
              label={goalLabel}
              caption={`${num(goalPct, lang)}${lang === "ar" ? "٪" : "%"}`}
              progress={goalProgress}
              done={goalProgress >= 1}
              onClick={() => go({ name: "camera" })}
            />
          </div>

          {/* Milestone — lightweight secondary card (tappable → camera practice). */}
          {ms && (
            <Card
              variant="elevated"
              className="flex items-center gap-4 p-5"
              onClick={() => go({ name: "camera" })}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/20">
                <Icon name="emoji_events" fill className="!text-3xl text-gold-deep" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-ink">{ms.label}</p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-teal/10">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${Math.max(4, ms.progress * 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          )}
        </section>
      </div>

      {/* Block C — node start popover (bottom sheet). */}
      {openNode &&
        (() => {
          const st = openNode.status;
          const locked = st === "locked" || st === "milestone";
          const meta =
            st === "current"
              ? t("pathNewSign", lang)
              : st === "done"
                ? t("pathDoneMeta", lang)
                : st === "milestone"
                  ? t("pathChestMeta", lang)
                  : t("pathLockedMeta", lang);
          const btnLabel =
            st === "current" ? t("pathStartCta", lang) : st === "done" ? t("pathReview", lang) : t("pathLocked", lang);
          const iconBg = locked ? "#B8C4C1" : st === "done" ? "#0F6E6A" : "#E8654C";
          const btnBg = locked ? "#EDE3D2" : st === "done" ? "#0F6E6A" : "#E8654C";
          const btnSh = locked ? "none" : st === "done" ? "0 5px 0 #0A4F4C" : "0 5px 0 #C54F3A";
          const onAction = () => {
            if (st === "current" && openNode.lesson) {
              // Practice-first: open camera on the lesson's first gradable sign;
              // fall back to the lesson only when none is gradable.
              const target = lessonCameraTarget(openNode.lesson);
              if (target) go({ name: "camera", targetSignId: target });
              else go({ name: "lesson", lessonId: openNode.lesson.id });
            } else if (st === "done" && openNode.lesson) {
              go({ name: "camera", targetSignId: lessonCameraTarget(openNode.lesson) });
            }
            setOpenId(null);
          };
          return (
            <div
              onClick={() => setOpenId(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(22,48,46,.5)", zIndex: 40, display: "flex", alignItems: "flex-end" }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="mx-auto w-full max-w-xl animate-rise"
                style={{ background: "#FBF7EF", borderRadius: "26px 26px 0 0", padding: "22px 22px 26px", boxShadow: "0 -10px 40px rgba(0,0,0,.2)" }}
              >
                <div style={{ width: 42, height: 5, borderRadius: 99, background: "#EDE3D2", margin: "0 auto 16px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={{ width: 56, height: 56, flex: "none", borderRadius: st === "milestone" ? 16 : "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {st === "milestone" ? (
                      <span style={{ fontSize: 26, lineHeight: 1 }}>🎁</span>
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
                <button
                  type="button"
                  disabled={locked}
                  onClick={locked ? undefined : onAction}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                  style={{ display: "block", width: "100%", marginTop: 18, textAlign: "center", font: "700 16px/1 Rubik,sans-serif", padding: 15, borderRadius: 16, border: "none", background: btnBg, boxShadow: btnSh, color: locked ? "#8FA09D" : "#FBF7EF", cursor: locked ? "default" : "pointer", opacity: locked ? 0.85 : 1 }}
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
