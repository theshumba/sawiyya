// Celebration — the reusable full-screen payoff surface (Celebrations.dc.html).
// One component, six variants: streak · goal · badge · level · connect · cert.
// Faithful reskin of the design showcase with the device-mock chrome dropped
// (real OS status bar covers it, LAYOUT §Frame). PRESENTATIONAL ONLY — this file
// is not wired into any flow; each trigger point mounts the matching variant.
//
// Composes the shared primitives: Fanan (level-up, never mirrors), Confetti +
// celebrate() (chime/haptic), toLocaleDigits (Eastern-Arabic numerals in AR).
// RTL is handled by dir + logical text flow; the checkmark, heart, seal, Fanan
// and handshape glyphs deliberately never mirror (HANDOFF §2).
import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Fanan } from "./Fanan";
import { Confetti, celebrate } from "./Confetti";
import { toLocaleDigits } from "./dc";
import { t } from "../i18n";
import type { Lang } from "../types";

export type CelebrationVariant = "streak" | "goal" | "badge" | "level" | "connect" | "cert";

type Base = { lang: Lang; onCta?: () => void };

export type CelebrationProps =
  | (Base & { variant: "streak"; streak: number })
  | (Base & { variant: "goal"; xp: number; goal: number })
  | (Base & { variant: "badge"; emoji: string; title: string; body?: string })
  | (Base & { variant: "level"; unitNum: number; nextUnitNum: number; unitName: string })
  | (Base & { variant: "connect"; sign: string; name: string; meInitial: string; themInitial: string })
  | (Base & { variant: "cert"; learnerName: string; date: string; sealGlyph?: string });

// Design keyframes lifted literally (rise 18px, pop scale .5→1.12, flame flick,
// white/ink halo pulse). Injected once; reduce-motion is frozen by the global
// @layer base rule in styles.css.
const CEL_CSS = `
@keyframes celRise{0%{transform:translateY(18px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes celPop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes celFlick{0%,100%{transform:scaleY(1) rotate(-2deg)}50%{transform:scaleY(1.08) rotate(2deg)}}
@keyframes celPulseWhite{0%{box-shadow:0 0 0 0 rgba(255,255,255,.4)}70%{box-shadow:0 0 0 22px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}
@keyframes celPulseInk{0%{box-shadow:0 0 0 0 rgba(22,48,46,.28)}70%{box-shadow:0 0 0 22px rgba(22,48,46,0)}100%{box-shadow:0 0 0 0 rgba(22,48,46,0)}}
.cel-cta{transition:all .08s}
.cel-cta:active{transform:translateY(4px);box-shadow:0 1px 0 var(--cel-cta-shadow)}
`;

function useCelStyles() {
  useEffect(() => {
    if (document.getElementById("cel-css")) return;
    const el = document.createElement("style");
    el.id = "cel-css";
    el.textContent = CEL_CSS;
    document.head.appendChild(el);
  }, []);
}

function fill(tmpl: string, tokens: Record<string, string>): string {
  return tmpl.replace(/\{(\w+)\}/g, (_, k: string) => tokens[k] ?? `{${k}}`);
}

const RUBIK = "Rubik, sans-serif";
const READEX = "'Readex Pro', sans-serif";
const MONO = "ui-monospace, Menlo, monospace";

const eyebrow = (color: string): CSSProperties => ({
  fontFamily: MONO,
  fontWeight: 700,
  fontSize: 12,
  lineHeight: 1,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color,
});

function CtaButton({ label, bg, color, shadow, onClick }: {
  label: string;
  bg: string;
  color: string;
  shadow: string;
  onClick?: () => void;
}) {
  const style = {
    width: "100%",
    height: 54,
    border: "none",
    cursor: "pointer",
    background: bg,
    color,
    fontFamily: RUBIK,
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1,
    borderRadius: 17,
    boxShadow: `0 5px 0 ${shadow}`,
    "--cel-cta-shadow": shadow,
  } as CSSProperties;
  return (
    <button type="button" className="cel-cta" style={style} onClick={onClick}>
      {label}
    </button>
  );
}

export function Celebration(props: CelebrationProps) {
  const { lang, variant } = props;
  useCelStyles();

  const hasConfetti = variant === "streak" || variant === "goal" || variant === "badge" || variant === "level";
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    celebrate();
    if (hasConfetti) setBurst((b) => b + 1);
  }, [hasConfetti]);

  // Per-variant screen background + CTA colours (LAYOUT §Frame + each variant).
  let bg = "#F6EFE3";
  let ctaBg = "#FBF7EF";
  let ctaColor = "#16302E";
  let ctaShadow = "rgba(0,0,0,.18)";
  let ctaLabel = "";
  let content: ReactNode = null;

  const riseTitle = (text: string, color: string, size: number): ReactNode => (
    <div
      style={{
        fontFamily: RUBIK,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.05,
        color,
        marginTop: 22,
        animation: "celRise .4s ease both",
      }}
    >
      {text}
    </div>
  );

  const bodyText = (text: string, color: string): ReactNode => (
    <div style={{ fontFamily: READEX, fontWeight: 400, fontSize: 15, lineHeight: 1.45, color, maxWidth: 250, marginTop: 6 }}>
      {text}
    </div>
  );

  switch (variant) {
    case "streak": {
      bg = "linear-gradient(160deg,#E8654C,#C54F3A)";
      ctaLabel = t("celStreakCta", lang);
      content = (
        <>
          <div style={{ position: "relative", width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(255,255,255,.14)", animation: "celPulseWhite 2s ease-out infinite" }} />
            <div style={{ width: 118, height: 132, background: "#F0C879", borderRadius: "50% 50% 50% 50%/62% 62% 40% 40%", position: "relative", animation: "celFlick 1.6s ease-in-out infinite", boxShadow: "0 12px 30px rgba(0,0,0,.18)" }}>
              <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", width: 58, height: 66, background: "#F6EFE3", borderRadius: "50% 50% 50% 50%/62% 62% 40% 40%" }} />
            </div>
            <div style={{ position: "absolute", fontFamily: RUBIK, fontWeight: 800, fontSize: 46, lineHeight: 1, color: "#C54F3A" }}>
              {toLocaleDigits(props.streak, lang)}
            </div>
          </div>
          {riseTitle(fill(t("celStreakTitle", lang), { n: toLocaleDigits(props.streak, lang) }), "#FBF7EF", 32)}
          {bodyText(t("celStreakBody", lang), "rgba(255,255,255,.85)")}
        </>
      );
      break;
    }
    case "goal": {
      bg = "linear-gradient(160deg,#0F6E6A,#0A4F4C)";
      ctaLabel = t("lsContinue", lang);
      content = (
        <>
          <div style={{ position: "relative", width: 150, height: 150 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "conic-gradient(#F0C879 100%, rgba(255,255,255,.15) 0)" }} />
            <div style={{ position: "absolute", inset: 16, borderRadius: "50%", background: "#0F6E6A", display: "flex", alignItems: "center", justifyContent: "center", animation: "celPop .5s ease both" }}>
              {/* Goal-met check — physical glyph, never mirrors. */}
              <div style={{ width: 52, height: 28, borderLeft: "9px solid #FBF7EF", borderBottom: "9px solid #FBF7EF", transform: "rotate(-45deg) translateY(-4px)", borderRadius: 2 }} />
            </div>
          </div>
          {riseTitle(t("celGoalTitle", lang), "#FBF7EF", 30)}
          {bodyText(fill(t("celGoalBody", lang), { xp: toLocaleDigits(props.xp, lang), goal: toLocaleDigits(props.goal, lang) }), "rgba(255,255,255,.85)")}
        </>
      );
      break;
    }
    case "badge": {
      bg = "linear-gradient(160deg,#F0C879,#E6B24C)";
      ctaBg = "#16302E";
      ctaColor = "#FBF7EF";
      ctaShadow = "#0a1a19";
      ctaLabel = t("celBadgeCta", lang);
      content = (
        <>
          <div style={{ position: "relative", width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center", animation: "celPop .5s ease both" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(22,48,46,.1)", animation: "celPulseInk 2s ease-out infinite" }} />
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "#16302E", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px rgba(0,0,0,.2)", border: "5px solid #0F6E6A" }}>
              {/* Handshape / achievement glyph from nextMilestone().emoji — never mirrors. */}
              <div style={{ fontFamily: RUBIK, fontWeight: 800, fontSize: 30, color: "#F0C879" }}>{props.emoji}</div>
            </div>
          </div>
          <div style={{ ...eyebrow("#16302E"), marginTop: 22 }}>{t("celBadgeEyebrow", lang)}</div>
          <div style={{ fontFamily: RUBIK, fontWeight: 800, fontSize: 28, lineHeight: 1.08, color: "#16302E", marginTop: 6, animation: "celRise .4s ease both" }}>
            {props.title}
          </div>
          {bodyText(props.body ?? t("celBadgeBodySample", lang), "rgba(22,48,46,.7)")}
        </>
      );
      break;
    }
    case "level": {
      bg = "linear-gradient(160deg,#0F6E6A,#0A4F4C)";
      ctaLabel = fill(t("celLevelCta", lang), { n: toLocaleDigits(props.nextUnitNum, lang) });
      content = (
        <>
          {/* Fanan never mirrors — renders identically in dir="rtl". */}
          <div style={{ animation: "float 2.6s ease-in-out infinite" }}>
            <Fanan pose="celebrate" scale={1.05} />
          </div>
          <div style={{ ...eyebrow("#F0C879"), marginTop: 16 }}>
            {fill(t("celLevelEyebrow", lang), { n: toLocaleDigits(props.unitNum, lang) })}
          </div>
          {riseTitle(t("celLevelTitle", lang), "#FBF7EF", 30)}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, background: "rgba(255,255,255,.14)", borderRadius: 99, padding: "9px 15px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#F0C879" }} />
            <span style={{ fontFamily: READEX, fontWeight: 600, fontSize: 13, lineHeight: 1, color: "#FBF7EF" }}>
              {fill(t("celLevelBody", lang), { unit: props.unitName })}
            </span>
          </div>
        </>
      );
      break;
    }
    case "connect": {
      bg = "#F6EFE3";
      ctaBg = "#E8654C";
      ctaColor = "#FBF7EF";
      ctaShadow = "#C54F3A";
      ctaLabel = t("celConnectCta", lang);
      content = (
        <>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 0, marginBottom: 6 }}>
            <div style={{ width: 78, height: 78, borderRadius: "50%", background: "#F0C879", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: RUBIK, fontWeight: 800, fontSize: 30, color: "#16302E", boxShadow: "0 8px 20px rgba(0,0,0,.12)", zIndex: 1 }}>
              {props.meInitial}
            </div>
            {/* Heart — symbol, never mirrors; pops after the avatars settle. */}
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#E8654C", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 -8px", zIndex: 2, animation: "celPop .5s ease .2s both", boxShadow: "0 6px 16px rgba(232,101,76,.4)" }}>
              <div style={{ width: 18, height: 16, background: "#FBF7EF", borderRadius: "50% 50% 0 0", transform: "rotate(45deg)", position: "relative" }}>
                <div style={{ position: "absolute", left: -9, top: 0, width: 18, height: 16, background: "#FBF7EF", borderRadius: "50% 50% 0 0" }} />
              </div>
            </div>
            <div style={{ width: 78, height: 78, borderRadius: "50%", background: "#0F6E6A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: RUBIK, fontWeight: 800, fontSize: 30, color: "#FBF7EF", boxShadow: "0 8px 20px rgba(0,0,0,.12)", zIndex: 1 }}>
              {props.themInitial}
            </div>
          </div>
          <div style={{ ...eyebrow("#E8654C"), marginTop: 20 }}>{t("celConnectEyebrow", lang)}</div>
          <div style={{ fontFamily: RUBIK, fontWeight: 800, fontSize: 27, lineHeight: 1.12, color: "#16302E", marginTop: 8, maxWidth: 260, animation: "celRise .4s ease both" }}>
            {fill(t("celConnectTitle", lang), { sign: props.sign, name: props.name })}
          </div>
          <div style={{ fontFamily: READEX, fontWeight: 400, fontSize: 14, lineHeight: 1.5, color: "#5C726F", maxWidth: 250, marginTop: 8 }}>
            {t("celConnectBody", lang)}
          </div>
        </>
      );
      break;
    }
    case "cert": {
      bg = "#F6EFE3";
      ctaBg = "#0F6E6A";
      ctaColor = "#FBF7EF";
      ctaShadow = "#0A4F4C";
      ctaLabel = t("celCertCta", lang);
      content = (
        <div style={{ width: "100%", background: "#FBF7EF", border: "2px solid #E6B24C", borderRadius: 20, padding: "22px 20px", position: "relative", boxShadow: "0 14px 34px rgba(22,48,46,.14)", animation: "celPop .5s ease both" }}>
          <div style={{ position: "absolute", inset: 6, border: "1px solid #F0C879", borderRadius: 14, pointerEvents: "none" }} />
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 10, lineHeight: 1, letterSpacing: ".18em", textTransform: "uppercase", color: "#C89A3D" }}>
            {t("celCertEyebrow", lang)}
          </div>
          <div style={{ fontFamily: RUBIK, fontWeight: 800, fontSize: 22, lineHeight: 1.15, color: "#16302E", marginTop: 12 }}>
            {t("celCertTitle", lang)}
          </div>
          <div style={{ fontFamily: READEX, fontWeight: 400, fontSize: 13, lineHeight: 1.4, color: "#5C726F", marginTop: 8 }}>
            {t("celCertBody", lang)}
          </div>
          {/* Seal — handshape glyph, never mirrors. */}
          <div style={{ width: 66, height: 66, borderRadius: "50%", background: "#E6B24C", margin: "18px auto 6px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 0 #C89A3D" }}>
            <div style={{ fontFamily: RUBIK, fontWeight: 800, fontSize: 26, color: "#FBF7EF" }}>{props.sealGlyph ?? "أ"}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px dashed #EDE3D2" }}>
            <div style={{ textAlign: "start" }}>
              <div style={{ fontFamily: RUBIK, fontWeight: 700, fontSize: 14, color: "#16302E" }}>{props.learnerName}</div>
              <div style={{ fontFamily: READEX, fontWeight: 500, fontSize: 10, color: "#5C726F" }}>{t("celCertNameLbl", lang)}</div>
            </div>
            <div style={{ textAlign: "end" }}>
              <div style={{ fontFamily: RUBIK, fontWeight: 700, fontSize: 14, color: "#16302E" }}>{props.date}</div>
              <div style={{ fontFamily: READEX, fontWeight: 500, fontSize: 10, color: "#5C726F" }}>{t("celCertDateLbl", lang)}</div>
            </div>
          </div>
        </div>
      );
      break;
    }
  }

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", background: bg }}
    >
      {hasConfetti && <Confetti burst={burst} />}
      <div style={{ flex: 1, minHeight: 0, padding: "12px 26px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        {content}
      </div>
      <div style={{ flex: "none", padding: "14px 26px 22px" }}>
        <CtaButton label={ctaLabel} bg={ctaBg} color={ctaColor} shadow={ctaShadow} onClick={props.onCta} />
      </div>
    </div>
  );
}

export default Celebration;
