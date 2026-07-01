# Build Spec — Home learning path

Reskin target: `src/screens/Home.tsx` → the winding-path/landscape hero is REPLACED by the
design reference's vertical scrolling node trail (banners + nodes + tappable start popover).
Design source (literal values lifted from): `design/rebuild-source/Sawiyya Home Path.dc.html`.

The design frame (status bar + device bezel + bottom nav) is chrome that the app already
owns via `ScreenShell`/`AppNav` (`chrome="tabs"`). Do NOT re-implement the status bar or the
bottom tab bar inside `Home.tsx` — keep them in `ScreenShell`. Everything from the teal app
bar down through the scrollable node trail and the node popover IS this screen's job.

---

## 1 · PRESERVE — functional contract (must stay wired after reskin)

All identifiers below are live in the current `Home.tsx`. The reskin is presentation-only;
none of these may be removed or renamed.

**Store / data hooks**
- `const app = useApp();` — root app store.
- `const { go } = useUi();` — navigation dispatcher.
- `const profile = activeProfile(app);` + early `if (!profile) return <NoProfileFallback />;` — keep the no-profile guard.
- `const lang = profile.language;` — drives EN/AR + RTL.
- `const goalXp = GOAL_XP[profile.dailyGoal];`
- `const xpToday = xpTodayFor(profile);` — today's XP (NOT stale total, bug #5).
- `const goalProgress = xpToday / goalXp;` and `const goalPct = Math.round(Math.min(1, goalProgress) * 100);`
- `const prog = app.progress[profile.id] ?? {};`
- `const nextLesson = LESSONS.find((l) => l.signIds.some((id) => (prog[id]?.masteryLevel ?? 0) < 2)) ?? LESSONS[0];`
- `const due = dueSignIds(app, profile.id);`
- `const flags = pinnedFlagSigns(app, profile.id).filter((f) => f.raisedByProfileId !== profile.id);`
- `const nodes = LESSONS.map(...)` deriving `status: "current" | "done" | "locked"` — this is the source of truth for node states; the design's done/current/locked/milestone rendering must bind to THIS, not to the design's hard-coded ITEMS array.
- `const ms = nextMilestone(app, profile.id, lang);` — milestone card/node.
- Imports that must remain: `signById`, `LESSONS`, `UNIT_A1_U1` from `../content/signs`; `GOAL_XP, activeProfile, dueSignIds, pinnedFlagSigns, useApp, xpTodayFor` from `../store/app`; `useUi` from `../store/ui`; `nextMilestone` from `../lesson/milestones`.
- Local helper `lessonCameraTarget(lesson)` — first `cameraGradable` sign id in a lesson; keep it and its practice-first gate semantics.

**Navigation calls (exact shapes — do not change)**
- Current node START: `const target = lessonCameraTarget(lesson); if (target) go({ name: "camera", targetSignId: target }); else go({ name: "lesson", lessonId: lesson.id });`
- Done / locked node tap: `go({ name: "camera", targetSignId: nodeTarget })` where `nodeTarget = lessonCameraTarget(lesson)`.
- Slim practise link + empty-state + goal + milestone cards: `go({ name: "camera" })`.
- Flags header deep-link: `go({ name: "family" })`.
- Flag card tap: `go({ name: "camera", targetSignId: sign.cameraGradable ? sign.id : undefined })`.
- Review-due card: `const first = due.map(signById).find((s) => s?.cameraGradable)?.id; go({ name: "camera", targetSignId: first });`

**i18n `t()` calls currently used (must all still render)**
`t("homeUnit", lang)`, `t("homeStreak", lang)`, `t("xp", lang)`, `t("homeToday", lang)` (section aria-label), `t("practiceCamera", lang)` (node aria-labels), `t("camPractice", lang)`, `t("camPrivacy", lang)`, `t("homeFlagged", lang)`, `t("homeNeeds", lang)`, `t("homeReviewDue", lang)`, `t("homeReviewCta", lang)`, `t("homeDailyGoal", lang)`, `t("homeAllDone", lang)`.

**`pick()` / `num()` calls**
- `pick(lang, UNIT_A1_U1.titleEn, UNIT_A1_U1.titleAr)` — unit title.
- Greeting literal `pick(lang, "Ahlan, ", "أهلًا، ")` + `<bdi>{profile.displayName}</bdi>` — reskin updates the literal to Marhaba (see §3) but the `<bdi>{profile.displayName}</bdi>` dynamic name binding must stay.
- `num(profile.streak, lang)`, `num(profile.xp, lang)`, `num(xpToday, lang)`, `num(goalXp, lang)`, `num(goalPct, lang)`, `num(slice.length, lang)`, `num(due.length, lang)` — all localized numerals; keep, and keep the `lang === "ar" ? "٪" : "%"` percent-sign switch.

**Components / props to keep**
- `<ScreenShell lang={lang} chrome="tabs">` wrapper.
- `<Card variant="elevated" onClick=…>`, `<Icon name=… />`, `<Eyebrow lang=…>`, `<Title>` from `../components/ui`.
- `<FlagCard sign requestedBy lang compact onClick />` — all five props.
- `<GoalCard label caption progress done onClick />` — all five props.
- `<NoProfileFallback />`.
- Local `PalmTree` sub-component may be DELETED (landscape is dropped) — it is not part of the contract.

---

## 2 · LAYOUT — target design as ordered blocks

Fonts: Latin = **Rubik**, Arabic = **Readex Pro**. Mono labels = `ui-monospace, Menlo, monospace`.
Screen surface bg `#FBF7EF`. (Device bezel `#16302E` r48 + status bar = ScreenShell chrome.)

### Block A — App bar (teal header) `flex:none`
- Container: bg `#0F6E6A`; padding `8px 20px 18px`; `border-radius: 0 0 24px 24px`; `box-shadow: 0 6px 16px rgba(15,110,106,.25)`; z above scroll.
- Row 1 (space-between, gap 12px):
  - Left column:
    - Greeting: `font: 800 21px/1.1 Rubik`; color `#FBF7EF`; EN "Marhaba, {name}" / AR "مرحبًا يا {name}" (name via `<bdi>{profile.displayName}</bdi>`).
    - Subtitle: `font: 500 12px/1.2 Readex Pro`; color `rgba(251,247,239,.72)`; margin-top 3px. EN "Ready to sign today?" / AR "مستعدة للإشارة اليوم؟".
  - Avatar chip (right): 44×44, `border-radius:50%`, bg `#F0C879`, `font: 800 18px Rubik`, color `#16302E`, `box-shadow: 0 4px 0 #C89A3D`, flex-none. Content = profile initial (EN "L" / AR "ل" in mock).
- Row 2 — three stat chips (`display:flex; gap:8px; margin-top:14px`), each `flex:1`, bg `rgba(255,255,255,.12)`, `border-radius:13px`, `padding:8px 10px`, inner flex gap 7px:
  1. **Streak** — leading dot 18×18 circle bg `#E8654C`; value `font: 800 15px/1 Rubik #FBF7EF` = `num(profile.streak)`; label `font: 500 9px/1 Readex rgba(251,247,239,.7)` margin-top 2px = `t("homeStreak")` ("day streak" / "أيام متتالية").
  2. **Gold** — dot 18×18 circle bg `#F0C879`; value = XP/gold number (`num`); label "gold" / "ذهب" (new key `homeGoldStat`).
  3. **Family** — leading marker 18×18 **rounded square r6** bg `#F08A75`; value = family count (`num`); label "family" / "العائلة" (new key `homeFamilyStat`).

### Block B — Scrollable node trail `flex:1; overflow-y:auto; padding:16px 20px 24px; min-height:0`
Scrollbar hidden (`::-webkit-scrollbar{width:0;height:0}`). On mount, auto-scroll ~210px down so the current node is centered (see §5). Trailing 8px spacer at bottom.

Sequence (bind to derived `nodes` + `ms`, not to design ITEMS; the design order is: unit banner → its nodes → unit-reward milestone node → next unit banner → its nodes):

**B1 · Unit banner** (one per unit) — `display:flex; align-items:center; justify-content:space-between; gap:10px; border-radius:18px; padding:13px 16px; margin:14px 0 6px`.
- Teal unit banner: bg `#0F6E6A`; `box-shadow: 0 4px 0 #0A4F4C`; unit label color `#F0C879`.
- Alternate (coral) unit banner: bg `#E8654C`; `box-shadow: 0 4px 0 #C54F3A`; unit label color `#F6EFE3`. (Design tones the 2nd unit coral.)
- Left text:
  - Unit label: `font: 700 10px/1 ui-monospace,Menlo; letter-spacing:.12em`; EN "UNIT 1"/"UNIT 2", AR "الوحدة ١"/"الوحدة ٢" (word from `t("homeUnit")` + unit number in localized numerals).
  - Name: `font: 800 18px/1.1 Rubik`; color `#FBF7EF`; margin-top 4px = `pick(lang, unit.titleEn, unit.titleAr)` (e.g. "First Words" / "كلمات أولى", "The Alphabet" / "الحروف الأبجدية").
- Right icon tile: 38×38, `border-radius:12px`, bg `rgba(255,255,255,.18)`; inner open-book glyph 16×13, `border:2.5px solid #FBF7EF; border-radius:2px; border-left-width:5px`.

**B2 · Node** — column, center, `padding:9px 0`. Row wrapper `transform: translateX({off}px)` to wind the trail (design offsets in px: 0, 50, -6, -52, 0, then 0, 54, 40 — reproduce alternating horizontal offsets; existing code used `ms-28/me-16/ms-20/-ms-10` — either approach OK as long as it winds).
- **Circle button** `<button onClick={open(node)}>`: `border-radius:50%` (milestone = `20px`); `border:none; cursor:pointer; transition: transform .08s`; sizes/colors by status:
  | status | size | bg | box-shadow |
  |---|---|---|---|
  | done | 62px | `#0F6E6A` | `0 5px 0 #0A4F4C` |
  | current | **72px** | `#E8654C` | `0 6px 0 #C54F3A` + `animation: pulseRing 1.8s ease-out infinite` |
  | locked | 62px | `#EDE3D2` | `0 4px 0 #D9CBB2` |
  | milestone | 62px, r20 | `#F6EFE3` | `0 4px 0 #D9CBB2` |
  - **done** glyph = white check: 20×11, `border-left:5px solid #FBF7EF; border-bottom:5px solid #FBF7EF; transform: rotate(-45deg) translate(1px,-2px); border-radius:2px`.
  - **face** glyph (shown when not-done, not-milestone, has a `face` — used for current emoji + locked alphabet letters): `<span>` `font-size: 30px` (current) / `26px`; `opacity: 0.4` if locked; `filter: grayscale(0.6)` if locked. Current node in mock = 🤟; alphabet nodes = ا / ب / ت dimmed. (In-app: current node shows Fanan/emoji per lesson; letter preview only for alphabet lessons.)
  - **lock** glyph (locked, no face, not milestone): body 15×12 r3 bg `#B8C4C1`; shackle above 11×11 `border:2.5px solid #B8C4C1; border-bottom:none; border-radius:6px 6px 0 0`.
  - **chest** glyph (milestone): 26×19 bg `#F0C879` r5 `box-shadow: inset 0 4px 0 #E6B24C`; keyhole 6×8 r2 bg `#C89A3D`.
- **Current START badge** (current node only): absolute `top:-24px; left:50%; transform:translateX(-50%)`; bg `#E8654C`; color `#FBF7EF`; `font: 800 10px/1 Rubik; letter-spacing:.08em`; `padding:6px 11px; border-radius:99px; box-shadow: 0 4px 0 #C54F3A; white-space:nowrap`. Text EN "START" / AR "ابدأ" (new key `homeStartBadge`, or reuse existing inline `startLabel`).
- **Fanan** (current node only): absolute `top:6px; left:100%; margin-left:2px; animation: bob 2.4s ease-in-out infinite`. Pose = **`cheer`**, scale ≈ `0.42` (≈52×52). In-app this replaces the old `brand/stitch-31.png` waving hand — use the real Fanan component with `pose="cheer"`. Never mirrors (see §6).
- **Label** (below circle): `margin-top:9px; text-align:center`; current `font: 700 13px/1.2 Rubik`, else `font: 500 12px/1.2 Readex Pro`; color locked `#A9B8B5`, current `#16302E`, else `#5C726F`. Text = `pick(lang, lesson.titleEn, lesson.titleAr)` (mock: Hello/مرحبًا, Thank you/شكرًا, I love you/أحبّك, More/المزيد, Unit reward/مكافأة الوحدة, Alif/ألف, Baa/باء, Taa/تاء).

### Block C — Node popover (bottom sheet), conditional on a node tap
- Overlay `<div onClick={close}>`: absolute `inset:0; background: rgba(22,48,46,.5); z-index:20; display:flex; align-items:flex-end; border-radius:41px` (matches inner screen radius).
- Sheet: `width:100%; background:#FBF7EF; border-radius:26px 26px 41px 41px; padding:22px 22px 26px; box-shadow: 0 -10px 40px rgba(0,0,0,.2); animation: rise .28s ease both`. Stop click propagation so taps inside don't close.
- Grabber: 42×5 r99 bg `#EDE3D2`; `margin:0 auto 16px`.
- Header row (flex, align-center, gap 13px):
  - Icon 56×56 flex-none, `border-radius:50%` (milestone `16px`), bg locked `#B8C4C1` / done `#0F6E6A` / current `#E8654C`. Content: locked = white lock glyph (body 16×13 r3 `#FBF7EF` + shackle 12×11 `border:2.5px solid #FBF7EF`); open (done/current) = `<span style="font-size:26px">` face or ✓; milestone = 🎁.
  - Text: title `font: 800 20px/1.1 Rubik #16302E` = node label; meta `font: 500 12px/1.3 Readex #5C726F; margin-top:3px` = state meta (see below).
- Action button: `margin-top:18px; text-align:center; font: 700 16px/1 Rubik; padding:15px; border-radius:16px`; bg locked `#EDE3D2` / done `#0F6E6A` / current `#E8654C`; box-shadow locked `none` / done `0 5px 0 #0A4F4C` / current `0 5px 0 #C54F3A`; color locked `#8FA09D` / else `#FBF7EF`; cursor locked `default` else `pointer`; opacity locked `0.85`.
  - **current** button wires the START nav (`lessonCameraTarget` gate); **done** button wires `go({name:"camera", targetSignId})`; **locked** button is inert.
- Popover meta/button copy by state:
  | state | meta | button |
  |---|---|---|
  | current | "New sign · camera-graded" / "إشارة جديدة · تقييم بالكاميرا" | "Start →" / "ابدأ ←" |
  | done | "Mastered · tap to review" / "مُتقَن · انقر للمراجعة" | "Review →" / "مراجعة ←" |
  | locked (sign) | "Finish the sign before this to unlock." / "أكمل الإشارة السابقة لفتحها." | "Locked" / "مقفل" |
  | locked (milestone chest) | "Clear Unit 1 to open the reward chest." / "أكمل الوحدة ١ لفتح الصندوق." | "Locked" / "مقفل" |

### Block D — Secondary cards (below the trail, KEEP from current Home.tsx)
The design's phone only shows the trail, but the existing secondary stack is part of the
functional contract and must remain (they can render below the scroll trail or as trailing
scroll content). Re-skin them to the token palette but keep structure + routes:
- **Slim Practise link** `Card` → `go({name:"camera"})`: coral chip (`bg-coral/10`, `Icon videocam` coral) + `t("camPractice")` title + `t("camPrivacy")` sub + forward chevron (`rtl:rotate-180`).
- **Flags** section (when `flags.length>0`): coral `Eyebrow` = `t("homeFlagged")`; count deep-link "{n} family requests" / "{n} طلبات العائلة" → `go({name:"family"})`; `<FlagCard … compact />`.
- **Review-due** `Card` (when `due.length>0`): gold chip (`Icon history`), `t("homeReviewDue")`, `{n} {t("homeReviewCta")}`.
- **Empty state** `Card` (when no flags AND no due): "All caught up — keep your hands warm" / "كل شيء مكتمل — أبقِ يديك جاهزتين" + "Practise any sign on camera" / "تدرّب على أي إشارة بالكاميرا".
- **Daily goal**: `Title` = `t("homeDailyGoal")` + `<GoalCard label caption progress done onClick />`.
- **Milestone** `Card` (when `ms`): gold `Icon emoji_events`, `ms.label`, gold progress bar `width: max(4, ms.progress*100)%`.

### Fanan poses used on this screen
- Current node: **`cheer`** (bobbing beside the active node). That is the only Fanan instance on the path itself. No other pose appears in this reference.

---

## 3 · COPY — every visible string

| Key (reuse / NEW) | English | Arabic |
|---|---|---|
| inline literal (update existing `pick(lang,"Ahlan, ","أهلًا، ")`) | `Marhaba, ` + name | `مرحبًا يا ` + name |
| `homeGreetSub` (NEW) | Ready to sign today? | مستعدة للإشارة اليوم؟ |
| `homeStreak` (exists) | day streak | أيام متتالية |
| `homeGoldStat` (NEW) | gold | ذهب |
| `homeFamilyStat` (NEW) | family | العائلة |
| `homeUnit` (exists) + numeral | Unit 1 / Unit 2 | الوحدة ١ / الوحدة ٢ |
| content `UNIT_A1_U1.titleEn/Ar` via `pick` | First Words | كلمات أولى |
| content (unit 2 title) | The Alphabet | الحروف الأبجدية |
| `homeStartBadge` (NEW) / existing inline `startLabel` | START | ابدأ |
| node labels — content `lesson.titleEn/Ar` | Hello / Thank you / I love you / More / Unit reward / Alif / Baa / Taa | مرحبًا / شكرًا / أحبّك / المزيد / مكافأة الوحدة / ألف / باء / تاء |
| `pathStartCta` (NEW) | Start → | ابدأ ← |
| `pathReview` (NEW) | Review → | مراجعة ← |
| `pathLocked` (NEW) | Locked | مقفل |
| `pathNewSign` (NEW) | New sign · camera-graded | إشارة جديدة · تقييم بالكاميرا |
| `pathDoneMeta` (NEW) | Mastered · tap to review | مُتقَن · انقر للمراجعة |
| `pathLockedMeta` (NEW) | Finish the sign before this to unlock. | أكمل الإشارة السابقة لفتحها. |
| `pathChestMeta` (NEW) | Clear Unit 1 to open the reward chest. | أكمل الوحدة ١ لفتح الصندوق. |
| Bottom nav (owned by ScreenShell — reference only): `navHome`/`navPractise`/`navDictionary`/`navFamily`/`navProgress` | Home / Practise / Signs / Family / Progress | الرئيسية / تمرين / الإشارات / العائلة / التقدّم |
| Status bar "9:41" | — (chrome, never localized time per §6) | — |
| Secondary cards | see §2 Block D + existing keys | as existing |

> Note: the design's bottom-nav Arabic for Signs is "الإشارات" whereas existing `navDictionary.ar` = "القاموس". Nav is owned by `ScreenShell`/`AppNav`, so do NOT change it in this screen. Flag the mismatch to the nav owner if AR "الإشارات" is desired — out of scope here.

---

## 4 · NEW-I18N — keys not yet in `src/i18n.ts` (append inside `dict`)

```ts
  // home path (design rebuild)
  homeGreetSub: { en: "Ready to sign today?", ar: "مستعدة للإشارة اليوم؟" },
  homeGoldStat: { en: "gold", ar: "ذهب" },
  homeFamilyStat: { en: "family", ar: "العائلة" },
  homeStartBadge: { en: "START", ar: "ابدأ" },
  pathStartCta: { en: "Start →", ar: "ابدأ ←" },
  pathReview: { en: "Review →", ar: "مراجعة ←" },
  pathLocked: { en: "Locked", ar: "مقفل" },
  pathNewSign: { en: "New sign · camera-graded", ar: "إشارة جديدة · تقييم بالكاميرا" },
  pathDoneMeta: { en: "Mastered · tap to review", ar: "مُتقَن · انقر للمراجعة" },
  pathLockedMeta: { en: "Finish the sign before this to unlock.", ar: "أكمل الإشارة السابقة لفتحها." },
  pathChestMeta: { en: "Clear Unit 1 to open the reward chest.", ar: "أكمل الوحدة ١ لفتح الصندوق." },
```

> `homeStartBadge` may be skipped if the existing inline `startLabel` literal is kept — then only 10 new keys. Spec counts 11 to fully key the screen.

---

## 5 · MOTION / STATES

**Keyframes (from design `<style>` — copy literally):**
- `@keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(232,101,76,.5)} 70%{box-shadow:0 0 0 16px rgba(232,101,76,0)} 100%{box-shadow:0 0 0 0 rgba(232,101,76,0)} }` — current node, `pulseRing 1.8s ease-out infinite`.
- `@keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }` — Fanan beside current node, `bob 2.4s ease-in-out infinite`.
- `@keyframes rise { 0%{transform:translateY(14px);opacity:0} 100%{transform:translateY(0);opacity:1} }` — popover sheet enters `rise .28s ease both`.
- `@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }` — available (START pill float); apply to the current START badge if desired.
- Node press: circle `transition: transform .08s` → spring/scale-down on tap (design "nodes spring on tap"; existing code used `active:scale-95`).

**States:**
- **current** — coral 72px node, pulse-ring, floating START badge, Fanan cheering, bold teal-ink label. Exactly ONE current node (the dominant action).
- **done** — teal 62px node, white check, 3D bottom edge (`0 5px 0 #0A4F4C`), sub-grey label.
- **locked** — sand `#EDE3D2` 62px node, muted padlock (or dimmed alphabet letter at opacity 0.4 + grayscale for alphabet nodes), grey `#A9B8B5` label; button inert.
- **milestone (chest)** — paper `#F6EFE3` r20 node, gold chest glyph; locked until unit cleared.
- **popover open** — overlay scrim + rise-in sheet; state-specific icon/meta/button; tap scrim or grabber region closes.
- **auto-scroll on mount** — after ~380ms set scroll ≈210px so the current node lands in view (design `scrollRef` sets `el.scrollTop=210`). Run once per mount.
- **loading / no-profile** — `if (!profile) return <NoProfileFallback />;` (existing guard) covers the pre-profile state.
- **empty secondary** — no flags + no due → warm "All caught up" card (Block D).
- **reduce-motion** — freeze `pulseRing`, `bob`, `float`; keep instant state changes; popover appears without translate (HANDOFF §Motion).

---

## 6 · RTL — mirrors vs never-mirrors (HANDOFF §2)

Design the AR panel first; anchor with `dir="rtl"` + logical props.

**Mirrors (flip in AR):**
- Reading flow / column alignment — app bar text right-aligned, greeting + subtitle start-anchored.
- Node horizontal offsets (`translateX`) — the winding direction flips (use `inset-inline`/logical or negate offsets).
- Fanan's position relative to the current node — it sits on the leading side; in AR it moves to the mirrored side (position anchor mirrors, but the artwork itself does NOT flip — see below).
- Forward chevrons / "→" arrows in CTAs (`rtl:rotate-180`); popover CTA arrow "Start →" becomes "ابدأ ←".
- Bottom-nav order (owned by ScreenShell).
- Progress fills, badge/count deep-link direction.
- Numerals → Eastern-Arabic glyphs `٠١٢٣٤٥٦٧٨٩`; percent `٪` trails.

**Never mirrors:**
- **Fanan** (the fox artwork) — same character both directions; only its container position mirrors.
- The **checkmark** glyph on done nodes.
- Status-bar time "9:41" (chrome).
- Play/camera/record glyphs (none on this screen except the Practise-link `videocam` icon — do not flip it).
- Sign-language handshapes / the alphabet-letter faces are physical/script glyphs — render as-is, not mirrored.
- Lock, chest, and open-book banner glyphs are symmetric — no visual change.

---

Block count: 7 layout blocks (A app-bar, B trail with B1 banner + B2 node, C popover, D secondary stack; frame/status-bar + bottom-nav are ScreenShell chrome). New i18n keys: 11 (10 if the inline START label literal is kept).
