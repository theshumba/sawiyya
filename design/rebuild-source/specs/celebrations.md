# Celebrations — build spec (design reskin)

**Design source:** `design/rebuild-source/Sawiyya Celebrations.dc.html`
**Screenshots:** `01-celeb.png` (streak), `04-celeb.png` (level-up), `02-celeb.png` (connection-made), `03-celeb.png` (certificate). `celebrate.png` is a different screen (Practice Loop harness) — ignore.
**Branch:** `feat/design-rebuild`

## Orientation (read before building)

There is **no `Celebrations.tsx` today.** Celebrations are surfaced inline across the app:
- `src/screens/LessonPlayer.tsx` → `ResultsCard` (lesson-complete = XP/accuracy/streak + confetti hero) — the closest live analogue to design "goal/level".
- `src/components/Confetti.tsx` → `Confetti` (canvas burst) + `celebrate()` (chime+haptic).
- `src/components/GoalCard.tsx` → daily-goal ring widget (Home).
- `src/lesson/milestones.ts` → `nextMilestone()` ladder (the "human outcome" badges).
- Connection-made copy lives as `fsCelebrate` (FirstSign) and `camMatch` (CameraPractice).

The design file is a **6-state showcase** (streak / goal / badge / level / connect / cert) wrapped in a canvas harness (title, tab-switcher, dual EN+AR phone frames, "Motion in play" caption). **That harness chrome is design-doc scaffolding — DO NOT reproduce it.** Build a single reusable `Celebration` surface with a `variant` prop; each app trigger point mounts the matching variant full-screen (no device bezel, real status bar).

The tailwind config already ships matching keyframes: `animate-pop`, `animate-rise`, `animate-pulse-ring`, `animate-float`, `animate-confetti` (`tailwind.config.js` L50–93). `float` + `sparkle-pop` also live in `src/styles.css`. Reuse these; only `flick` (streak flame) and the design's exact `confettiFall` distances are new.

---

## 1 · PRESERVE — functional contract (must stay wired after reskin)

### `src/components/Confetti.tsx`
- `export function Confetti({ burst }: { burst: number })` — **`burst` prop is the re-trigger integer**; a new number replays the canvas burst (clears leftover particles first, M7 guard L38–41). Every celebration mounts `<Confetti burst={burst} />`. Keep prop name + type.
- Canvas is `pointer-events-none fixed inset-0 z-50`, `aria-hidden="true"` — keep.
- Bails on `prefers-reduced-motion: reduce` (L26) — keep.
- `export function celebrate()` — `navigator.vibrate?.([40, 60, 80])` + WebAudio arpeggio `[523.25, 659.25, 783.99]` (C5 E5 G5). Called alongside every celebration mount. Keep signature (no args), keep the try/catch swallow.
- `COLORS = ["#E6B24C","#F0C879","#E8654C","#0F6E6A","#FBF7EF"]` — already matches the design palette; keep.

### `src/components/GoalCard.tsx`
- `export function GoalCard({ label, caption, progress, done = false, onClick })` — props `label:string, caption:string, progress:number (0..1), done?:boolean, onClick?:()=>void`. Keep all five.
- Imports `Card, ProgressRing` from `./ui`. Keep.
- `Math.max(6, Math.min(1, progress) * 100)` fill floor (L40) — keep (empty bar still reads as a track).
- `role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}` — keep a11y.
- `done` toggles `text-gold`/`bg-gold` vs `text-teal`/`bg-teal` — keep this as the "goal met" gold state.

### `src/lesson/milestones.ts`
- `export function nextMilestone(s: AppState, profileId: string, lang: Lang): Milestone | null` — keep signature.
- `export interface Milestone { reached: boolean; emoji: string; label: string; progress: number }` — keep shape. The reskinned **badge/achievement** variant should source its title/body from this ladder (`label`, `progress`), not hard-code the design's "First Words" sample.
- Uses `signsAllCanDo(s)`, `pick(lang,en,ar)`, `p.masteryLevel >= 3`. Keep. The `emoji` field feeds the badge glyph (see LAYOUT note — design shows a handshape "أ", ladder currently emits 🌱/✋/🤟/👪/🏠/🏆; keep the ladder as source, render whatever it returns).

### `src/screens/LessonPlayer.tsx` → `ResultsCard` (live celebration surface)
- `<Confetti burst={burst} />` mount (L597) — keep.
- i18n calls that must survive: `t("lsLessonDone", lang)` (L616), `t("lsXpEarned", lang)` (L629), `t("accuracy", lang)` (L634), `t("homeStreak", lang)` (L639), `t("lsWhatsNext", lang)` (L649), `t("practiceCamera", lang)` (L678). Plus inline `pick(lang,"Continue","متابعة")` (L682).
- Value formatting: `num(xp, lang)`, `num(accuracy, lang)`, `num(streak, lang)` — Eastern-Arabic numerals in AR. Keep `num()`.
- Navigation callbacks: `onContinue` → `go({ name: "home" })`, `onPractice(targetSignId)` → `go({ name: "camera", targetSignId })` (wired at L116–117). `go` comes from `useUi()` (L26). `firstGradable?.id` pre-targets the just-learned sign (L594). Keep.
- Data hooks: `useApp()` (L25), `activeProfile` / `profileId`, `recordDrillResult` (the mutation that advances XP+streak, L232/263/298). Keep.
- `StatCard` tones `"gold" | "teal" | "coral"`, icon `local_fire_department` (streak stat), and the primary action `Icon name="videocam"` → camera. Keep these mappings.

### Connection-made copy already in `src/i18n.ts`
- `fsCelebrate` = `Connection made!` / `وصلت! 🎉` (FirstSign).
- `camMatch` = `✓ Connection made!` / `✓ وصلت!` (CameraPractice).
- These stay wired at their existing call sites. The design's **connect** variant eyebrow is a cleaner "Connection made" (no ✓/emoji) — use the new `celConnectEyebrow` key for the celebration surface; do **not** repurpose `fsCelebrate`/`camMatch`.

---

## 2 · LAYOUT — target design, ordered blocks

Build one `Celebration` component. Outer app frame = **full-screen** (drop the `#16302E` device bezel `border-radius:47px;padding:7px;box-shadow:0 24px 60px rgba(22,48,46,.28)` and the `9:41`/notch/battery status row L50–54 — those are design-doc chrome; the real OS status bar covers it). Inner screen `border-radius: 40px` only matters if shown in a device mock.

### Frame (all variants)
- **Screen bg** = per-variant (below). Column flex: body `flex:1; padding:12px 26px 0; align+justify center; text-align:center`. Footer `flex:none; padding:14px 26px 22px`.
- **CTA button (footer, all variants):** `width:100%; height:54px; border-radius:17px; border:none; font:700 16px/1 Rubik; box-shadow:0 5px 0 <ctaShadow>`. On press: `transform:translateY(4px); box-shadow:0 1px 0 <ctaShadow>` (the springy hard-shadow affordance, HANDOFF §Shape). Colours per-variant below.
- **Confetti overlay:** present on **streak, goal, badge, level** only (NOT connect, NOT cert). Mount `<Confetti burst={burst} />` + call `celebrate()`. (Design inline confetti: 42 chips, `top:-18px`, `left:<rand>%`, size `6–15px` w×`h=w*0.62`, `border-radius: 2px or 50%`, colors `#0F6E6A #E8654C #E6B24C #F0C879 #F08A75 #FBF7EF`, `animation: confettiFall 1.3–2.3s <0–.45s delay> ease-in forwards` — the existing 90-particle canvas `Confetti` already covers this; keep canvas, don't add DOM chips.)

### Variant: STREAK  (screenshot 01)
- **Screen bg:** `linear-gradient(160deg,#E8654C,#C54F3A)` · status/icon tint `#FBF7EF`.
- **Flame medallion** (150×150 relative, centered):
  - Pulse halo: `position:absolute; inset:0; border-radius:50%; background:rgba(255,255,255,.14); animation:pulseRing 2s ease-out infinite`.
  - Flame body: `118×132; background:#F0C879; border-radius:50% 50% 50% 50%/62% 62% 40% 40%; box-shadow:0 12px 30px rgba(0,0,0,.18); animation:flick 1.6s ease-in-out infinite`.
  - Flame inner: `bottom:14px; left:50% translateX(-50%); 58×66; background:#F6EFE3; same radius`.
  - **Count:** `position:absolute; font:800 46px/1 Rubik; color:#C54F3A`. Value = streak count (Eastern-Arabic in AR). Ticks 0→N in design; in app show final streak (keep `celebrate()` on mount).
- **Title:** `font:800 32px/1.05 Rubik; color:#FBF7EF; margin-top:22px; animation:rise .4s ease both`. Copy `celStreakTitle` (`{n}-day streak!`).
- **Body:** `font:400 15px/1.45 'Readex Pro'; color:rgba(255,255,255,.85); max-width:250px; margin-top:6px`. Copy `celStreakBody`.
- **CTA:** bg `#FBF7EF`, text `#16302E`, shadow `rgba(0,0,0,.18)`. Copy `celStreakCta` (`Keep it going →` / `واصل التقدّم ←`).

### Variant: GOAL  (screenshot analogous to 04 layout, teal)
- **Screen bg:** `linear-gradient(160deg,#0F6E6A,#0A4F4C)` · tint `#FBF7EF`.
- **Goal ring** (150×150):
  - Track+fill: `position:absolute; inset:0; border-radius:50%; background:conic-gradient(#F0C879 100%, rgba(255,255,255,.15) 0)` (full = 100% met).
  - Inner disc: `inset:16px; border-radius:50%; background:#0F6E6A; animation:pop .5s ease both`; centers the check.
  - **Checkmark (never mirrors):** `52×28; border-left:9px solid #FBF7EF; border-bottom:9px solid #FBF7EF; transform:rotate(-45deg) translateY(-4px); border-radius:2px`.
- **Title:** `font:800 30px/1.05 Rubik; color:#FBF7EF; margin-top:22px; animation:rise`. Copy `celGoalTitle` (`Daily goal met!`).
- **Body:** same style as streak body. Copy `celGoalBody` (`{xp} / {goal} XP today. Fanan is proud of you.`).
- **CTA:** bg `#FBF7EF`, text `#16302E`, shadow `rgba(0,0,0,.18)`. Copy = reuse `lsContinue` (`Continue` / `متابعة`).

### Variant: BADGE / ACHIEVEMENT
- **Screen bg:** `linear-gradient(160deg,#F0C879,#E6B24C)` · status tint `#16302E` (light).
- **Medallion** (150×150 flex center, `animation:pop .5s ease both`):
  - Halo: `absolute; inset:0; border-radius:50%; background:rgba(22,48,46,.1); animation:pulseRing 2s`.
  - Coin: `120×120; border-radius:50%; background:#16302E; box-shadow:0 12px 30px rgba(0,0,0,.2); border:5px solid #0F6E6A`.
  - Glyph (never mirrors): `font:800 30px Rubik; color:#F0C879`. Design sample = `أ`. **In app, render `milestone.emoji` from `nextMilestone()`** (handshape/emoji), not a hard-coded letter.
- **Eyebrow:** `font:700 12px/1 ui-monospace,Menlo; letter-spacing:.14em; text-transform:uppercase; color:#16302E; margin-top:22px`. Copy `celBadgeEyebrow` (`Achievement unlocked`).
- **Title:** `font:800 28px/1.08 Rubik; color:#16302E; margin-top:6px; animation:rise`. Copy = `milestone.label` (from ladder).
- **Body:** `font:400 14px/1.4 'Readex Pro'; color:rgba(22,48,46,.7); max-width:250px; margin-top:6px`. Copy = milestone description (per-badge; design sample `celBadgeBodySample` provided only as fallback).
- **CTA:** bg `#16302E`, text `#FBF7EF`, shadow `#0a1a19`. Copy `celBadgeCta` (`Collect ⭐` / `استلم ⭐`).

### Variant: LEVEL-UP  (screenshot 04)
- **Screen bg:** `linear-gradient(160deg,#0F6E6A,#0A4F4C)` · tint `#FBF7EF`.
- **Fanan (never mirrors):** `<Fanan pose="celebrate" scale={1.05} />` wrapped in `animation:float 2.6s ease-in-out infinite` (~128px). Use existing `src/components/Fanan.tsx`.
- **Eyebrow:** `font:700 12px/1 ui-monospace,Menlo; letter-spacing:.14em; uppercase; color:#F0C879; margin-top:16px`. Copy `celLevelEyebrow` (`Unit {n} complete`).
- **Title:** `font:800 30px/1.05 Rubik; color:#FBF7EF; margin-top:6px; animation:rise`. Copy `celLevelTitle` (`Level up!`).
- **Unlock pill:** `display:flex; align-items:center; gap:8px; margin-top:16px; background:rgba(255,255,255,.14); border-radius:99px; padding:9px 15px`. Dot `9×9; border-radius:50%; background:#F0C879`. Text `font:600 13px/1 'Readex Pro'; color:#FBF7EF`. Copy `celLevelBody` (`You unlocked "{unit}"`).
- **CTA:** bg `#FBF7EF`, text `#16302E`, shadow `rgba(0,0,0,.18)`. Copy `celLevelCta` (`Start Unit {n} →` / `ابدأ الوحدة {n} ←`).

### Variant: CONNECTION-MADE  (screenshot 02) — signature payoff, deliberately calmer, NO confetti
- **Screen bg:** flat `#F6EFE3` · status tint `#16302E`.
- **Avatar pair + heart** (row, `margin-bottom:6px`):
  - Me avatar: `78×78; border-radius:50%; background:#F0C879; color:#16302E; font:800 30px Rubik; box-shadow:0 8px 20px rgba(0,0,0,.12); z-index:1`. Content = learner initial.
  - Heart badge (never mirrors): `44×44; border-radius:50%; background:#E8654C; margin:0 -8px; z-index:2; box-shadow:0 6px 16px rgba(232,101,76,.4); animation:pop .5s ease .2s both`. Inner heart glyph `#FBF7EF`.
  - Them avatar: `78×78; border-radius:50%; background:#0F6E6A; color:#FBF7EF; font:800 30px Rubik; box-shadow:0 8px 20px rgba(0,0,0,.12); z-index:1`. Content = partner initial.
- **Eyebrow:** `font:700 12px/1 ui-monospace,Menlo; letter-spacing:.14em; uppercase; color:#E8654C; margin-top:20px`. Copy `celConnectEyebrow` (`Connection made`).
- **Title:** `font:800 27px/1.12 Rubik; color:#16302E; margin-top:8px; max-width:260px; animation:rise`. Copy `celConnectTitle` (`You signed "{sign}" with {name}.`).
- **Body:** `font:400 14px/1.5 'Readex Pro'; color:#5C726F; max-width:250px; margin-top:8px`. Copy `celConnectBody`.
- **CTA:** bg `#E8654C`, text `#FBF7EF`, shadow `#C54F3A`. Copy `celConnectCta` (`Share this moment` / `شارك هذه اللحظة`).

### Variant: CERTIFICATE  (screenshot 03) — share-ready card, NO confetti
- **Screen bg:** flat `#F6EFE3` · status tint `#16302E`.
- **Certificate card** (`width:100%`, `animation:pop .5s ease both`):
  - Shell: `background:#FBF7EF; border:2px solid #E6B24C; border-radius:20px; padding:22px 20px; box-shadow:0 14px 34px rgba(22,48,46,.14)`.
  - Inner frame line: `position:absolute; inset:6px; border:1px solid #F0C879; border-radius:14px; pointer-events:none`.
  - Eyebrow: `font:700 10px/1 ui-monospace,Menlo; letter-spacing:.18em; uppercase; color:#C89A3D`. Copy `celCertEyebrow`.
  - Title: `font:800 22px/1.15 Rubik; color:#16302E; margin-top:12px`. Copy `celCertTitle`.
  - Body: `font:400 13px/1.4 'Readex Pro'; color:#5C726F; margin-top:8px`. Copy `celCertBody`.
  - Seal (never mirrors): `66×66; border-radius:50%; background:#E6B24C; margin:18px auto 6px; box-shadow:0 6px 0 #C89A3D`. Glyph `font:800 26px Rubik; color:#FBF7EF` (`أ` sample; app = alphabet handshape).
  - Footer row: `display:flex; justify-content:space-between; margin-top:14px; padding-top:12px; border-top:1px dashed #EDE3D2`.
    - Name block (`text-align:start`): value `font:700 14px Rubik; color:#16302E` (learner name); label `font:500 10px 'Readex Pro'; color:#5C726F` = `celCertNameLbl`.
    - Date block (`text-align:end`): value `font:700 14px Rubik; color:#16302E` (completion date, `num()`-localised); label `font:500 10px 'Readex Pro'; color:#5C726F` = `celCertDateLbl`.
- **CTA:** bg `#0F6E6A`, text `#FBF7EF`, shadow `#0A4F4C`. Copy `celCertCta` (`Share certificate ↑` / `شارك الشهادة ↑`).

---

## 3 · COPY — every visible string

Dynamic tokens in `{…}` are interpolated by the caller (i18n `t()` returns the template; replace `{n}`/`{xp}`/`{goal}`/`{unit}`/`{sign}`/`{name}` at the call site, run values through `num()` for AR numerals).

| Element | i18n key | English | Arabic (from RTL panel) |
|---|---|---|---|
| Streak title | `celStreakTitle` *(new)* | `{n}-day streak!` | `تتابع {n} أيام!` |
| Streak body | `celStreakBody` *(new)* | `You've signed every day this week. You're on fire.` | `أشرت كل يوم هذا الأسبوع. أنت في أوجك.` |
| Streak CTA | `celStreakCta` *(new)* | `Keep it going →` | `واصل التقدّم ←` |
| Goal title | `celGoalTitle` *(new)* | `Daily goal met!` | `تحقّق هدف اليوم!` |
| Goal body | `celGoalBody` *(new)* | `{xp} / {goal} XP today. Fanan is proud of you.` | `{xp} / {goal} نقاط اليوم. فَنَن فخور بك.` |
| Goal CTA | `lsContinue` *(reuse)* | `Continue` | `متابعة` |
| Badge eyebrow | `celBadgeEyebrow` *(new)* | `Achievement unlocked` | `إنجاز مفتوح` |
| Badge title | *(from `nextMilestone().label`)* | e.g. `First Words` | e.g. `الكلمات الأولى` |
| Badge body (sample/fallback) | `celBadgeBodySample` *(new)* | `You mastered your first 5 signs. A whole conversation starts here.` | `أتقنت أول ٥ إشارات. محادثة كاملة تبدأ من هنا.` |
| Badge CTA | `celBadgeCta` *(new)* | `Collect ⭐` | `استلم ⭐` |
| Level eyebrow | `celLevelEyebrow` *(new)* | `Unit {n} complete` | `اكتملت الوحدة {n}` |
| Level title | `celLevelTitle` *(new)* | `Level up!` | `ترقية!` |
| Level body | `celLevelBody` *(new)* | `You unlocked "{unit}"` | `فتحت «{unit}»` |
| Level CTA | `celLevelCta` *(new)* | `Start Unit {n} →` | `ابدأ الوحدة {n} ←` |
| Connect eyebrow | `celConnectEyebrow` *(new)* | `Connection made` | `تمّ التواصل` |
| Connect title | `celConnectTitle` *(new)* | `You signed "{sign}" with {name}.` | `أشرت «{sign}» مع {name}.` |
| Connect body | `celConnectBody` *(new)* | `Not a lesson — a moment. This is why Sawiyya exists.` | `ليست حصّة — بل لحظة. لهذا وُجدت سويّة.` |
| Connect CTA | `celConnectCta` *(new)* | `Share this moment` | `شارك هذه اللحظة` |
| Cert eyebrow | `celCertEyebrow` *(new)* | `Certificate of achievement` | `شهادة إنجاز` |
| Cert title | `celCertTitle` *(new)* | `You learned the whole Arabic alphabet` | `تعلّمت الحروف العربية كاملة` |
| Cert body | `celCertBody` *(new)* | `All 28 letters, signed and camera-checked.` | `كل الحروف الـ٢٨، بالإشارة وبتحقّق الكاميرا.` |
| Cert name label | `celCertNameLbl` *(new)* | `Learner` | `المتعلّمة` |
| Cert date label | `celCertDateLbl` *(new)* | `Completed` | `أُنجزت` |
| Cert CTA | `celCertCta` *(new)* | `Share certificate ↑` | `شارك الشهادة ↑` |

Sample dynamic values from the design (use real app data at runtime): learner `Layla Al-Mansoori` / `ليلى المنصوري`; date `Jul 2026` / `يوليو ٢٠٢٦`; connect sign `I love you` / `أحبّك`, partner `Mama` / `ماما`, initials L·M / ل·م; streak `7`/`٧`; goal `10 / 10`/`١٠ / ١٠`; unlocked unit `The Alphabet` / `الحروف الأبجدية`.

**Tab labels** (`Streak/Daily goal/Achievement/Level up/Connection/Certificate`) are the design harness switcher — **not app copy, do not add keys.**

---

## 4 · NEW-I18N — append to `dict` in `src/i18n.ts` (before `} satisfies`)

```ts
  // celebrations
  celStreakTitle: { en: "{n}-day streak!", ar: "تتابع {n} أيام!" },
  celStreakBody: { en: "You've signed every day this week. You're on fire.", ar: "أشرت كل يوم هذا الأسبوع. أنت في أوجك." },
  celStreakCta: { en: "Keep it going →", ar: "واصل التقدّم ←" },
  celGoalTitle: { en: "Daily goal met!", ar: "تحقّق هدف اليوم!" },
  celGoalBody: { en: "{xp} / {goal} XP today. Fanan is proud of you.", ar: "{xp} / {goal} نقاط اليوم. فَنَن فخور بك." },
  celBadgeEyebrow: { en: "Achievement unlocked", ar: "إنجاز مفتوح" },
  celBadgeBodySample: { en: "You mastered your first 5 signs. A whole conversation starts here.", ar: "أتقنت أول ٥ إشارات. محادثة كاملة تبدأ من هنا." },
  celBadgeCta: { en: "Collect ⭐", ar: "استلم ⭐" },
  celLevelEyebrow: { en: "Unit {n} complete", ar: "اكتملت الوحدة {n}" },
  celLevelTitle: { en: "Level up!", ar: "ترقية!" },
  celLevelBody: { en: 'You unlocked "{unit}"', ar: "فتحت «{unit}»" },
  celLevelCta: { en: "Start Unit {n} →", ar: "ابدأ الوحدة {n} ←" },
  celConnectEyebrow: { en: "Connection made", ar: "تمّ التواصل" },
  celConnectTitle: { en: 'You signed "{sign}" with {name}.', ar: "أشرت «{sign}» مع {name}." },
  celConnectBody: { en: "Not a lesson — a moment. This is why Sawiyya exists.", ar: "ليست حصّة — بل لحظة. لهذا وُجدت سويّة." },
  celConnectCta: { en: "Share this moment", ar: "شارك هذه اللحظة" },
  celCertEyebrow: { en: "Certificate of achievement", ar: "شهادة إنجاز" },
  celCertTitle: { en: "You learned the whole Arabic alphabet", ar: "تعلّمت الحروف العربية كاملة" },
  celCertBody: { en: "All 28 letters, signed and camera-checked.", ar: "كل الحروف الـ٢٨، بالإشارة وبتحقّق الكاميرا." },
  celCertNameLbl: { en: "Learner", ar: "المتعلّمة" },
  celCertDateLbl: { en: "Completed", ar: "أُنجزت" },
  celCertCta: { en: "Share certificate ↑", ar: "شارك الشهادة ↑" },
```

`lsContinue` (goal CTA) already exists — reuse, do not re-add. 24 new keys total.

---

## 5 · MOTION / STATES

**Entry animations (all lifted literal from source):**
- Title/eyebrow rise-in: `animation:rise .4s ease both` — design keyframe `rise{0%{translateY(18px);opacity:0}100%{translateY(0);opacity:1}}`. (Tailwind `rise` uses `12px`; add an 18px variant or override — design says 18px.)
- Pop-in (goal disc, badge medallion, connect heart, cert card): `animation:pop .5s ease both` — `pop{0%{scale(.5);opacity:0}60%{scale(1.12)}100%{scale(1);opacity:1}}`. (Tailwind `pop` uses `scale(0)`→`1.1`; design uses `scale(.5)`→`1.12` — prefer design values for these.)
- Connect heart is delayed: `pop .5s ease .2s both` (lands after avatars settle).
- Fanan (level-up): `animation:float 2.6s ease-in-out infinite` (existing).

**Looping/ambient:**
- `pulseRing 2s ease-out infinite` — streak halo `rgba(255,255,255,.4)`→22px; badge halo tint `rgba(22,48,46,.1)`. (Design keyframe: `0%{box-shadow:0 0 0 0 rgba(255,255,255,.4)}70%{…22px…0}100%{…0}`. Tailwind `pulse-ring` currently gold-18px — add white-22px + ink variants, or parametrise the ring colour per variant.)
- `flick 1.6s ease-in-out infinite` — **NEW keyframe (streak flame only):** `flick{0%,100%{transform:scaleY(1) rotate(-2deg)}50%{transform:scaleY(1.08) rotate(2deg)}}`. Add to `src/styles.css` (flame uses inline anim string like Fanan).

**Confetti:** streak/goal/badge/level fire `<Confetti burst={++n} />` + `celebrate()` on mount. Design inline chips fall `confettiFall 1.3–2.3s`: `confettiFall{0%{translateY(0) rotate(0)}100%{translateY(460px) rotate(560deg);opacity:.2}}`. Existing canvas `Confetti` (90 particles, gravity model) already delivers this — keep canvas; no DOM chips.

**Sound/haptic:** `celebrate()` = C5-E5-G5 arpeggio + `vibrate([40,60,80])` on every celebration. Connection-made and certificate: still call `celebrate()` (they're payoffs) but **no confetti** — calmer on purpose (design caption: connection-made is the emotional one).

**States:**
- *Loading:* none — celebrations mount after an event resolves; there is no async/skeleton state.
- *Empty:* n/a (a celebration only shows when earned). If wiring a generic surface, guard: don't render badge variant when `nextMilestone()` returns `null`.
- *Error:* none surfaced; `celebrate()` audio failure is swallowed (never blocks the visual).
- *Reduce-motion:* `Confetti` self-bails on `prefers-reduced-motion` (keep). Also freeze `pulseRing`/`flick`/`float`/`rise`/`pop` → instant final state (HANDOFF §Motion: "freeze pulse/float/confetti; keep instant state change").
- *Interactive:* only the CTA (springy press: `translateY(4px)` + shadow collapse) and the just-learned-sign rail in the live `ResultsCard` (`onPractice(targetSignId)`).

---

## 6 · RTL (HANDOFF §2)

**Mirrors (flip in `dir="rtl"`):**
- Reading flow / text alignment (Arabic anchors to the start = right edge).
- CTA arrow direction — already handled by per-language copy (`→` in EN, `←` in AR for streak/level).
- Connect avatar pair order + cert footer name/date columns follow logical start/end (`text-align:start`/`end`), so they swap sides automatically.
- Numerals → Eastern-Arabic `٠١٢٣٤٥٦٧٨٩` via `num()` (streak count, XP/goal, unit number, date). Never mix scripts on one screen.

**Never mirrors (identical in RTL):**
- **Fanan** (level-up) — physical geometry, renders same inside `dir="rtl"` (Fanan.tsx comment L4–6).
- **Checkmark** (goal ring) — physical glyph.
- **Handshape glyphs / seals** — the badge `أ` and cert seal `أ` (and any real alphabet handshape) are physical signs, never flipped.
- **Heart** (connection-made) — symbol, not flipped.
- **Status-bar time**, logos.
- The `↑` share arrows (cert / vertical) are non-directional — leave as-is both languages.
