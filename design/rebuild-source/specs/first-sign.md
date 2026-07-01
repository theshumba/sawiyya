# First Sign — build spec (design reskin)

Screen: **First Sign** — live camera-graded quick win.
Source of truth for values/copy: `design/rebuild-source/Sawiyya First Sign.dc.html`.
Existing implementation to preserve: `src/screens/FirstSign.tsx` (component `FirstSign`).

> **CRITICAL PRODUCT NOTE — read before building.**
> The design tells a *fiction*: it demos the "I love you" 🤟 sign and hard-codes a 96% result.
> The **real app grades the Arabic letter Alif (ا)** via `signById("alpha-alif")` — the only
> onboarding sign with real ground-truth seeds. **Do NOT hard-code "I love you", 🤟, or 96%.**
> Any string that names the sign or the score must stay dynamic: use `sign.glossEn/glossAr`
> and the real `CameraTrainer` result. Lift the design's *layout, color, motion, and
> sign-agnostic copy* exactly; keep the sign-specific slots wired to live data.
> The existing `.tsx` already runs a 3-step machine (`watch → try → celebrate`) driven by the
> real `CameraTrainer`. Map the design's 4 visual phases (intro/demo/live/done) onto that machine;
> the demo's `intro` phase is optional chrome — do not add a fake camera loop that replaces real grading.

---

## 1 · PRESERVE — functional contract (must stay wired)

Every identifier below is live in `FirstSign.tsx`. The reskin may re-style/re-arrange markup but must keep these calls intact.

**Store / profile hooks**
- `const app = useApp();` — store root.
- `const { go } = useUi();` — navigation dispatcher.
- `const profile = activeProfile(app);` — active learner profile; `if (!profile) return <NoProfileFallback />;` guard must remain.
- `const lang = profile.language;` — `"en" | "ar"`, drives all `pick()/t()` and `dir`.

**Content**
- `const sign = signById("alpha-alif");` — the real graded sign (Alif). `if (!sign) return null;` guard stays.
- `sign.glossEn` / `sign.glossAr` — rendered in the watch heading; keep dynamic (NOT "I love you").
- `import { signById } from "../content/signs";`

**Recognizer / camera**
- `<CameraTrainer sign={sign} lang={lang} onResult={handleResult} autoStart />` — the real on-device grader. This replaces the design's faked LIVE-camera phase (skeleton dots, confidence ring, status pills). Keep `CameraTrainer` mounted for the "try" step; do not simulate grading.
- `const handleResult = (result: TrainerResult) => {…}` — must keep calling, in order:
  - `app.recordDrillResult(sign.id, "good", { camera: result === "match", matched: result === "match", selfMark: result === "selfMark" });`
  - `app.markFirstSignTime();` — time-to-first-sign metric (G1). Do not drop.
  - `celebrate();` + `setBurst((b) => b + 1);` — confetti trigger.
  - `setStep("celebrate");`
- `import { CameraTrainer, type TrainerResult } from "../components/CameraTrainer";`
- `import { Confetti, celebrate } from "../components/Confetti";` and `<Confetti burst={burst} />`.

**Local state machine**
- `const [step, setStep] = useState<Step>("try");` — `Step = "watch" | "try" | "celebrate"`. Default is `"try"` (onboarding drops users straight into camera). Preserve the three states; `setStep("try")` / `setStep("celebrate")` transitions.
- `const [burst, setBurst] = useState(0);`

**Navigation calls**
- `onClick={() => go({ name: "home" })}` — used twice: the `ScreenShell` close button (`onClose`) AND the celebrate "Keep going" `Button`. Both must still route to `home`.

**Layout wrappers to keep**
- `<ScreenShell lang={lang} chrome="takeover" onClose={() => go({ name: "home" })}>` — chrome-light takeover (NO tab bar / profile button). Keep `chrome="takeover"`.
- `<SignDemo sign={sign} lang={lang} />` — the real looping demo clip (watch step). Replaces design's faked 🤟 demo circle.
- `<NoProfileFallback />` early return.
- `import { Button, Icon } from "../components/ui";` — reuse `Button` (springy variant) + `Icon` (Material Symbols).

**Share (keep, silent-optional)**
- `shareMoment()` → `navigator.share?.(shareData).catch(() => {})`; text via `pick(lang, "I just learned my first sign on Sawiyya!", "تعلّمت أول إشارة لي على سويّة!")`. Keep the try/catch no-op.

**i18n calls currently wired (must keep resolving)**
- `t("fsIntro", lang)` — watch-step eyebrow.
- `t("fsNowYou", lang)` — try-step heading + coral CTA (also used in `CameraTrainer.tsx:532`; changing its value affects that screen too — leave `fsNowYou` intact and add new keys for design phase titles).
- `t("fsCelebrate", lang)` — celebrate headline (Arabic value leads with "وصلت!"; the `.replace(/^\s*وصلت!\s*/, "")` strip logic must survive if you keep the split-glyph headline).
- `t("fsDone", lang)` — celebrate body.
- `t("fsKeepGoing", lang)` — celebrate primary CTA.
- `t("xp", lang)` — "+10 XP" chip.
- `pick(lang, "Day 1", "اليوم ١")` — streak badge.
- `pick(lang, "Share this moment", "شارك هذه اللحظة")` — share link.
- `pick(lang, s.en, s.ar)` for STEP labels Watch/Try/Celebrate (`شاهد / جرّب / افرح`) via `StepDots`.

**Brand assets referenced (keep or re-map, don't break paths)**
- `brand/stitch-22.png` (celebrate hero starburst), `brand/stitch-54.png` (coral CTA hand glyph).

---

## 2 · LAYOUT — target design as ordered blocks

The design renders inside a **322×660 phone frame** (device bezel `#16302E`, radius `47px`, padding `7px`, shadow `0 24px 60px rgba(22,48,46,.28)`; inner screen radius `40px`, bg `#F6EFE3`). In the real app this maps to the `ScreenShell chrome="takeover"` viewport (full-bleed mobile). The desktop harness around it (eyebrow pill "Sawiyya · Onboarding hook · Live camera grading", `h1` "Your first sign, graded live", the Phase/Restart control bar, footer paragraph) is **design-doc scaffolding only — do NOT build it.**

Shared chrome present on every phase (top of screen):

### Block A — Status bar (never mirrors)
- Height `34px`, padding `0 24px`, flex space-between.
- Left: time `9:41`, font `Rubik 700 13px`, color `#16302E`. **Time never mirrors** (stays left even in RTL).
- Center: notch pill `74×20px`, bg `#16302E`, radius `99px`, opacity `.5`, absolute `top:9px; left:50%`.
- Right: battery glyph `16×9px`, border `1.5px solid #16302E`, radius `3px`.

### Block B — Progress bar + step counter
- Padding `2px 24px 6px`, flex gap `10px`.
- Track: `flex:1`, height `7px`, radius `99px`, bg `#EDE3D2`, `overflow:hidden`.
- Fill: height `100%`, bg **`#E6B24C`** (gold/mid), radius `99px`, `transition:width .4s ease`. Width per phase: intro `8%`, demo `34%`, live `72%`, done `100%`.
- Counter text: `Rubik 700 11px`, color `#94A5A2`. Values: `1/4 · 2/4 · 3/4 · 4/4` (EN) → Eastern-Arabic `١/٤ · ٢/٤ · ٣/٤ · ٤/٤` (AR). **Progress fill mirrors** (fills from start edge).

> In the real 3-step app, map: watch→demo visuals (2/4), try→live visuals (3/4), celebrate→done (4/4). The intro (1/4) phase is optional; if omitted, start progress at the watch/demo value.

---
### PHASE: INTRO (`isIntro`, progress 8%, 1/4) — optional
Body: `flex:1`, centered column, padding `0 30px`, text-align center.
1. **Fanan** — `pose="wave"`, `scale="1.15"` (~140×138px), wrapped in `animation: float 2.6s ease-in-out infinite`. **Fanan never mirrors.**
2. Title — `Rubik 800 27px/1.15`, color `#16302E`, `margin-top:24px`, `animation: rise .4s ease both`. Copy `fsIntroTitle`.
3. Body — `Readex Pro 400 15px/1.5`, color `#5C726F`, `margin-top:10px`, `max-width:250px`. Copy `fsIntroBody`.
4. Privacy chip — inline-flex, gap `8px`, bg `#FBF7EF`, border `1px solid #EDE3D2`, radius `99px`, padding `8px 14px`, `margin-top:20px`. Icon dot `26×26px` circle bg `#0F6E6A` with 📷 (14px). Label `Readex Pro 600 12px/1.3` color `#16302E`. Copy `fsIntroChip`.

---
### PHASE: DEMO / "watch" step (`isDemo`, progress 34%, 2/4)
Header (`flex:none`, padding `2px 26px 0`, center):
- Title — `Rubik 800 22px/1.1`, `#16302E`. Copy `fsDemoTitle` ("Watch it once").
- Sub — `Readex Pro 400 13px/1.4`, `#5C726F`, `margin-top:4px`. Copy `fsDemoSub` ("A Deaf signer demonstrates").

Media card (`flex:1`, padding `16px 26px 22px`):
- Stage: radius `24px`, bg `radial-gradient(120% 90% at 50% 30%, #14827c, #0d5a56)`, `overflow:hidden`.
- Top-start tag pill: bg `rgba(0,0,0,.3)`, radius `99px`, padding `5px 10px`, `inset-inline-start:12px`; dot `7px` bg `#F0C879` + label `ui-monospace 700 10px` color `#FBF7EF` letter-spacing `.06em`. Copy `fsSignerTag` ("DEAF SIGNER"). **Mirrors** (anchored inline-start).
- Top-end timer pill: bg `rgba(0,0,0,.3)`, radius `99px`, padding `5px 9px`, `inset-inline-end:12px`, `ui-monospace 700 10px` `#FBF7EF`. Literal `0:03 ↺` (loop badge — keep LTR digits, it is a timecode; **never mirrors as a glyph pair**, anchored inline-end).
- Center demo: **in the real app this is `<SignDemo sign={sign} lang={lang} />`** (looping clip). Design placeholder = `132×132px` white circle, 🤟 68px, `animation: float 2.4s ease-in-out infinite`, shadow `0 8px 24px rgba(0,0,0,.25)`. **Handshape/demo never mirrors.**
- Scrub bar (design fiction — omit for real `SignDemo`, or keep `SignDemo`'s own controls): bottom `12px`, height `5px`, radius `99px`, track `rgba(255,255,255,.25)`, fill `#F0C879`, `animation: vidbar 3s linear infinite`.
- Caption below stage: `Readex Pro 600 15px/1.4`, `#16302E`, `margin-top:14px`, center. Copy `fsDemoMeans` — design shows `This sign means "I love you" ❤️`; **make dynamic** → `This sign means "{glossEn}"`.

Footer of watch step (real app): coral springy `Button full size="lg"` with `t("fsNowYou")` + `brand/stitch-54.png` hand chip, in the fixed bottom bar (`bg-paper/80 backdrop-blur`).

---
### PHASE: LIVE / "try" step (`isLive`, progress 72%, 3/4)
Header: title `Rubik 800 21px/1.1` `#16302E` (`fsLiveTitle` "Now make the sign" — or reuse `t("fsNowYou")` heading already present); sub `Readex Pro 400 12.5px/1.4` `#5C726F` (`fsLiveSub`).

**In the real app the camera stage = `<CameraTrainer …>`.** The elements below are the design's visual target for that stage; wire the real ones, don't fake them:
- Stage: `flex:1`, radius `26px`, bg `repeating-linear-gradient(135deg,#16302E,#16302E 16px,#1d3d3a 16px,#1d3d3a 32px)`, `overflow:hidden`.
- **LIVE badge** (top inline-start `12px`): bg `rgba(210,60,44,.92)`, radius `99px`, padding `5px 10px`; dot `7px` bg `#FBF7EF` `animation: livedot 1s ease-in-out infinite`; label `ui-monospace 800 10px` `#FBF7EF` letter-spacing `.1em`. Copy `fsLiveTag` ("LIVE"). **Mirrors** (inline-start).
- **PIP reference "copy this"** (top inline-end `12px`, width `62px`, center): tile `62×62px` radius `14px` bg `#0F6E6A` border `2px solid rgba(251,247,239,.85)`, 🤟 34px (**real app: the Alif ا glyph reference chip from CameraTrainer**); below it label `ui-monospace 700 8px/1.2` color `#F0C879` letter-spacing `.08em`, `margin-top:4px`. Copy `fsCopyThis` ("COPY"). Handshape **never mirrors**.
- **Hand skeleton** (real-time, gold): container `120×150px` at `top:44%; left:50%`, `animation: track 2.4s ease-in-out infinite`. Joints = `#F0C879` dots (`18px` glowing tip w/ `animation: tipglow 1.4s ease-in-out infinite`, plus `12px` knuckles); bones = `3px` bars `rgba(240,200,121,.55)` at various rotations. **Handshape never mirrors.** (Real app: CameraTrainer draws the actual MediaPipe skeleton.)
- **Matched lock ring** (only when matched): `150×150px` circle at `top:44%; left:50%; translate(-50%,-50%)`, border `3px solid #1F8A5B`, `animation: lockpulse 1s ease-out infinite`, `z-index:2`.
- **Confidence ring** (bottom `14px`, centered column, gap `7px`):
  - Outer `96×96px` circle, bg `conic-gradient(<ringColor> 0% <conf>%, rgba(240,200,121,.16) <conf>% 100%)`, shadow `0 6px 18px rgba(0,0,0,.3)`.
    - `ringColor` = matched→`#1F8A5B`; conf≥86→`#E6B24C`; else `#F0C879`.
  - Inner `74×74px` circle, bg `rgba(15,26,25,.82)`, centered column: number `Rubik 800 27px/1` `#FBF7EF` (`conf`, Eastern-Arabic digits in AR), label under it `Readex Pro 600 9px/1` `rgba(251,247,239,.7)` = `fsMatchLabel` ("match").
  - Status pill under ring: bg `<statusBg>` (matched→`rgba(31,138,91,.95)`, else `rgba(15,110,106,.92)`), color `#FBF7EF`, `Readex Pro 700 11px/1`, padding `7px 13px`, radius `99px`. Text = one of the status strings by `code`: `fsStatusFind / fsStatusHold / fsStatusMatch / fsStatusAlmost / fsStatusMatched`.
- **Privacy badge** (bottom inline-start `12px`): bg `rgba(0,0,0,.4)`, radius `99px`, padding `5px 9px`; dot `6px` bg `#7BE0A0` + label `Readex Pro 600 9px/1` `#FBF7EF`. Copy `fsOnDevice` ("On-device"). **Always visible — product promise. Mirrors** (inline-start).

---
### PHASE: DONE / "celebrate" step (`isDone`, progress 100%, 4/4)
Full-viewport takeover (real app uses `radial-gradient(circle at center,#148580 0%,#0F6E6A 70%)` teal bg + `<Confetti burst={burst} />`; design shows the confetti on paper — follow the existing `.tsx` teal celebration, it is already on-brand). Ordered content:
1. **Confetti** — 16 pieces, colors `['#0F6E6A','#E8654C','#E6B24C','#F0C879','#1F8A5B']`, `animation: conf …forwards` (fall + spin). Real app: `Confetti` component (keep).
2. **Fanan** — `pose="celebrate"`, `scale="1.2"` (~150×148px). **Never mirrors.** (Real app hero = `brand/stitch-22.png` starburst — keep.)
3. **Checkmark badge** — `66×66px` circle bg `#1F8A5B`, `margin-top:16px`, `animation: pop .5s ease both`, shadow `0 6px 18px rgba(31,138,91,.35)`; glyph ✓ `Rubik 800 34px` `#FBF7EF`. **Checkmark never mirrors.**
4. **Title** — `Rubik 800 25px/1.12` `#16302E`, `margin-top:16px`, `animation: rise .4s ease .1s both`. Design copy `You just signed "I love you"!` → **sign-agnostic** via `t("fsCelebrate")` ("Connection made!"), or dynamic `You just signed "{glossEn}"!`. Do NOT hard-code "I love you".
5. **Accuracy pill** — inline-flex baseline, gap `6px`, bg `#FBF7EF`, border `1px solid #EDE3D2`, radius `99px`, padding `8px 16px`, `margin-top:12px`. Big number `Rubik 800 22px` `#0F6E6A` = **real match %** (design `96%` / `٩٦٪`); small label `Readex Pro 600 12px` `#5C726F` = `fsDoneBadgeMatch` ("live match"). Do NOT hard-code 96%.
6. **Body** — `Readex Pro 400 14px/1.5` `#5C726F`, `margin-top:14px`, `max-width:250px`. Copy `t("fsDone")` (design `fsDoneMeans` "That's every Sawiyya lesson: watch once, sign it, get graded live. Ready for the rest?").
7. **CTA** — full-width springy `Button` `height:54px`, radius `17px`, bg `#0F6E6A`, `Rubik 700 16px` `#FBF7EF`, shadow `0 5px 0 #0A4F4C`; active `translateY(4px)` + shadow `0 1px 0 #0A4F4C`. Copy design `Start learning →` → real app uses `t("fsKeepGoing")` + `Icon arrow_forward` (`rtl:rotate-180`). `onClick={() => go({ name: "home" })}`. **Arrow mirrors** (→ in EN, ← in AR).
   - Plus existing secondary share link (`Share this moment` / `شارك هذه اللحظة`, `Icon ios_share`).
   - Existing +10 XP chip (`t("xp")`) and Day-1 streak badge remain.

---

## 3 · COPY — every visible string

| i18n key | English | Arabic (verbatim from RTL panel) |
|---|---|---|
| `fsIntroTitle` *(new)* | Your first sign is a real one | إشارتك الأولى حقيقية |
| `fsIntroBody` *(new)* | No typing, no quizzes — your camera turns on and grades the sign as you make it. | لا كتابة ولا اختبارات — تعمل الكاميرا وتقيّم إشارتك أثناء أدائها. |
| `fsIntroChip` *(new)* | Camera stays on-device. Nothing is uploaded. | الكاميرا تعمل على الجهاز. لا يُرفع شيء. |
| `fsDemoTitle` *(new)* | Watch it once | شاهدها مرّة |
| `fsDemoSub` *(new)* | A Deaf signer demonstrates | يعرضها شخص أصمّ |
| `fsSignerTag` *(new)* | DEAF SIGNER | مُشيرٌ أصمّ |
| `fsDemoMeans` *(new; make dynamic)* | This sign means "I love you" ❤️ | هذه الإشارة تعني «أحبّك» ❤️ |
| `fsLiveTitle` *(new)* | Now make the sign | الآن أدِّ الإشارة |
| `fsLiveSub` *(new)* | The camera is grading you live | الكاميرا تقيّمك مباشرةً |
| `fsLiveTag` *(new)* | LIVE | مباشر |
| `fsCopyThis` *(new)* | COPY | قلّد |
| `fsMatchLabel` *(new)* | match | تطابق |
| `fsOnDevice` *(new)* | On-device | على الجهاز |
| `fsStatusFind` *(new)* | Finding your hand… | نبحث عن يدك… |
| `fsStatusHold` *(new)* | Hold the sign steady… | اثبت على الإشارة… |
| `fsStatusMatch` *(new)* | Matching your shape… | نطابق شكل يدك… |
| `fsStatusAlmost` *(new)* | Almost — hold it… | اقتربت — اثبت… |
| `fsStatusMatched` *(new)* | Matched! ✓ | تطابق! ✓ |
| `fsDoneBadgeMatch` *(new)* | live match | تطابق مباشر |
| `fsDoneMeans` *(new)* | That's every Sawiyya lesson: watch once, sign it, get graded live. Ready for the rest? | هذا هو كل درس في سويّة: شاهِد مرّة، أشِر، واحصل على تقييم مباشر. جاهز للبقيّة؟ |
| `fsStartLearning` *(new)* | Start learning → | ابدأ التعلّم ← |
| `fsIntro` *(existing — reuse)* | Let's learn the first thing you'll say: | لنتعلم أول ما ستقوله: |
| `fsNowYou` *(existing — reuse)* | Now you try | الآن جرّب أنت |
| `fsCelebrate` *(existing — reuse, sign-agnostic done title)* | Connection made! | وصلت! 🎉 |
| `fsDone` *(existing — reuse, done body)* | That's one. Your family will feel this. | هذه أول إشارة. عائلتك ستشعر بها. |
| `fsKeepGoing` *(existing — reuse, done CTA)* | Keep going | أكمل |
| `xp` *(existing — reuse)* | XP | نقطة |
| — *(existing `pick()` literals, keep)* | Day 1 / Share this moment / Watch / Try / Celebrate | اليوم ١ / شارك هذه اللحظة / شاهد / جرّب / افرح |
| Timecode *(literal, not i18n)* | 0:03 ↺ | 0:03 ↺ |

> Copy conflict note: the numbered screenshots (`02/03-fs.png`) show slightly older strings ("Watch closely" / "A Deaf signer shows you how" / "Now your turn" / "Make the same sign to the camera"). The **`.dc.html` is authoritative** — use its values above. If the team prefers the screenshot phrasing, it is a copy swap only, same keys.
> `fsDemoMeans`, the done title, and the accuracy % are **sign-/score-specific** — interpolate `sign.glossEn/glossAr` and the real `TrainerResult`, don't ship the "I love you"/96% literals.

---

## 4 · NEW-I18N — keys to append to `src/i18n.ts`

```ts
  fsIntroTitle: { en: "Your first sign is a real one", ar: "إشارتك الأولى حقيقية" },
  fsIntroBody: { en: "No typing, no quizzes — your camera turns on and grades the sign as you make it.", ar: "لا كتابة ولا اختبارات — تعمل الكاميرا وتقيّم إشارتك أثناء أدائها." },
  fsIntroChip: { en: "Camera stays on-device. Nothing is uploaded.", ar: "الكاميرا تعمل على الجهاز. لا يُرفع شيء." },
  fsDemoTitle: { en: "Watch it once", ar: "شاهدها مرّة" },
  fsDemoSub: { en: "A Deaf signer demonstrates", ar: "يعرضها شخص أصمّ" },
  fsSignerTag: { en: "DEAF SIGNER", ar: "مُشيرٌ أصمّ" },
  fsDemoMeans: { en: "This sign means “{gloss}”", ar: "هذه الإشارة تعني «{gloss}»" },
  fsLiveTitle: { en: "Now make the sign", ar: "الآن أدِّ الإشارة" },
  fsLiveSub: { en: "The camera is grading you live", ar: "الكاميرا تقيّمك مباشرةً" },
  fsLiveTag: { en: "LIVE", ar: "مباشر" },
  fsCopyThis: { en: "COPY", ar: "قلّد" },
  fsMatchLabel: { en: "match", ar: "تطابق" },
  fsOnDevice: { en: "On-device", ar: "على الجهاز" },
  fsStatusFind: { en: "Finding your hand…", ar: "نبحث عن يدك…" },
  fsStatusHold: { en: "Hold the sign steady…", ar: "اثبت على الإشارة…" },
  fsStatusMatch: { en: "Matching your shape…", ar: "نطابق شكل يدك…" },
  fsStatusAlmost: { en: "Almost — hold it…", ar: "اقتربت — اثبت…" },
  fsStatusMatched: { en: "Matched! ✓", ar: "تطابق! ✓" },
  fsDoneBadgeMatch: { en: "live match", ar: "تطابق مباشر" },
  fsDoneMeans: { en: "That's every Sawiyya lesson: watch once, sign it, get graded live. Ready for the rest?", ar: "هذا هو كل درس في سويّة: شاهِد مرّة، أشِر، واحصل على تقييم مباشر. جاهز للبقيّة؟" },
  fsStartLearning: { en: "Start learning →", ar: "ابدأ التعلّم ←" },
```

> `fsDemoMeans` uses a `{gloss}` placeholder — interpolate `pick(lang, sign.glossEn, sign.glossAr)` at call site (or drop the token and just show the demo). If the i18n helper has no interpolation, split into prefix + `sign` gloss in JSX.

---

## 5 · MOTION / STATES

**Keyframes (lift literally):**
- `float` — `translateY(0)↔-7px`, `2.4–2.6s ease-in-out infinite` (Fanan intro, demo circle).
- `rise` — `translateY(16px);opacity:0 → 0;1`, `.4s ease both` (titles enter; done title delay `.1s`).
- `pop` — `scale(.4)→1.14→1` + fade, `.5s ease both` (checkmark badge).
- `conf` — `translateY(0)→340px rotate(540deg)`, opacity `1→0`, per-piece `1.1–1.76s ease-in`, staggered `(i%5)*0.06s`, `forwards` (confetti).
- `livedot` — opacity `1↔.35` + `scale 1↔.8`, `1s ease-in-out infinite` (LIVE dot).
- `track` — `translate(-50%,-50%)↔(+4px,-3px)`, `2.4s ease-in-out infinite` (hand skeleton drift).
- `tipglow` — box-shadow `0 0 10px 1px #E6B24C ↔ 0 0 18px 4px #F0C879`, `1.4s` (fingertip).
- `lockpulse` — box-shadow ring `0 0 0 0 rgba(31,138,91,.55) → 0 0 0 26px rgba(31,138,91,0)`, `1s ease-out infinite` (match lock).
- `vidbar` — width `6%→96%`, `3s linear infinite` (demo scrub — omit if using real `SignDemo`).
- Progress fill `transition: width .4s ease`.
- Button springy: press `translateY(3–4px)` + shadow collapse to `0 1px 0`.

**States (from the live machine):**
- **Loading / finding** (`conf=0`, `code='find'`, first ~650ms): status `fsStatusFind`, ring at 0%, color `#F0C879`. *(Real app: CameraTrainer's own hand-search state.)*
- **Detecting** (conf ramps 0→96 over ~2.35s): status cycles `hold` (<50%) → `match` (<86%) → `almost` (<86–96); ring color flips to `#E6B24C` at ≥86%.
- **Matched / success** (conf=96, `code='matched'`): green lock ring appears, ring color `#1F8A5B`, status `fsStatusMatched`, then auto-advance to done after ~950ms → in real app this is `handleResult('match')` → `celebrate()` + `setStep('celebrate')`.
- **Below threshold / "almost"** (design fiction always succeeds; real app): gentle retry — never a hard fail (HANDOFF §3.4). CameraTrainer surfaces the almost state; keep it.
- **Empty / no-profile**: `<NoProfileFallback />`.
- **Reduced motion**: freeze `float / livedot / track / tipglow / lockpulse / conf / pulse`; keep instant state changes (HANDOFF Motion; existing `.tsx` already gates `fs-float` under `prefers-reduced-motion`).

---

## 6 · RTL

Design the Arabic panel first; anchor with `dir="rtl"` + logical props.

**Mirrors (flip in AR):**
- Reading flow / column text alignment.
- Progress bar fill direction (fills from the start/right edge).
- Step counter position, and the "start edge" anchoring of the LIVE badge, DEAF-SIGNER tag, and On-device privacy badge (all `inset-inline-start`).
- The PIP "copy this" chip and timer pill (`inset-inline-end`) move to the AR start-side accordingly.
- CTA arrow: `→` (EN) becomes `←` (AR) — done CTA uses `rtl:rotate-180` on `Icon arrow_forward` (design AR shows `ابدأ التعلّم ←`).
- Numerals: percentages, `conf` number, and step counter use Eastern-Arabic glyphs `٠١٢٣٤٥٦٧٨٩` with trailing `٪` in AR (e.g. `٩٦٪`, `٣/٤`).

**Never mirrors (physical / fixed):**
- **Fanan** (both poses) — same character, never flipped.
- **Checkmark** ✓.
- **Sign-language handshapes** — the 🤟/Alif reference glyph, the PIP tile, and the gold hand skeleton are physical; they must render identically in EN and AR.
- **Camera / play / record glyphs** — 📷 icon, LIVE dot, video scrub, `0:03 ↺` timecode.
- **Status-bar time** `9:41` (stays left), notch, battery.
- Logos / brand marks.

---

## Summary
Blocks: 2 shared (status bar, progress) + 4 phase panels (intro, demo/watch, live/try, done/celebrate) = **6 layout blocks**.
New i18n keys: **21** (`fsIntroTitle, fsIntroBody, fsIntroChip, fsDemoTitle, fsDemoSub, fsSignerTag, fsDemoMeans, fsLiveTitle, fsLiveSub, fsLiveTag, fsCopyThis, fsMatchLabel, fsOnDevice, fsStatusFind, fsStatusHold, fsStatusMatch, fsStatusAlmost, fsStatusMatched, fsDoneBadgeMatch, fsDoneMeans, fsStartLearning`); existing keys reused: `fsIntro, fsNowYou, fsCelebrate, fsDone, fsKeepGoing, xp`.
