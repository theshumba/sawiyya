# Practise hub — reskin spec

Source design: `design/rebuild-source/Sawiyya Practise.dc.html`
Screenshots: `screenshots/01-prac.png` (quiz, unanswered) · `02-prac.png` (quiz, answered — correct springs teal + ✓, wrong picks stay pale) · `03-prac.png` (match, 0/4) · `04-prac.png` (match, 1/4 locked pair teal)
Existing implementation: `src/screens/PractiseChooser.tsx`

> **Scope note.** The `.dc.html` renders FOUR states (`hub`, `quiz`, `match`, `results`) side-by-side via a demo tab bar — that tab bar is a *design harness device, not app chrome*. The only state that maps to a shipping screen today is **`hub`**, which is exactly `PractiseChooser.tsx`. Reskin the hub against the design's `isHub` block. The `quiz` / `match` / `results` blocks are speced below as **reference (future drills)** — they have NO route in `src/store/ui.ts` and NO existing code; do not wire them unless a follow-up phase adds them. Every color/size/copy value below is lifted literally from the source.

---

## 1 · PRESERVE — functional contract (must stay wired)

All identifiers below are in `src/screens/PractiseChooser.tsx` and MUST survive the reskin.

- **Store hooks**
  - `const app = useApp();` — `import { activeProfile, dueSignIds, useApp } from "../store/app"`
  - `const go = useUi((s) => s.go);` — navigation dispatcher, `import { useUi } from "../store/ui"`
  - `const profile = activeProfile(app);` → `if (!profile) return <NoProfileFallback />;` — keep the no-profile guard.
  - `const lang = profile.language;` — drives `ScreenShell lang` + every `pick(lang,…)` / `t(key, lang)`.
  - `const due = dueSignIds(app, profile.id);` — the review-due list.
  - `const firstDueGradable = due.map(signById).find((s) => s?.cameraGradable)?.id;` — target for the review card.
- **Content**
  - `const GRADABLE_SIGNS = A1_SIGNS.filter((s) => s.cameraGradable);` — `import { A1_SIGNS, signById } from "../content/signs"`
  - `<SignGlyph sign={sign} lang={lang} … />` — keep for each everyday-sign tile; do NOT swap for a raw emoji.
- **Navigation calls (all four destinations MUST remain reachable)**
  - Alphabet tile → `onClick={() => go({ name: "camera", targetSignId: "alpha-alif" })}`
  - Review card (only when `due.length > 0`) → `onClick={() => go({ name: "camera", targetSignId: firstDueGradable })}`
  - Each everyday-sign tile → `onClick={() => go({ name: "camera", targetSignId: sign.id })}`
  - (No `setScreen`; navigation is `go({ name, … })` from `useUi`.)
- **i18n calls already present (keep the exact keys):**
  - `t("navPractise", lang)` — eyebrow
  - `t("homeReviewDue", lang)` — review card title
  - `t("homeReviewCta", lang)` — review card sub (`{due.length} {t("homeReviewCta", lang)}`)
  - Inline `pick(lang, en, ar)` calls for: title, body, "Arabic Alphabet"/"Ready", "Fingerspell all 28 letters", "Everyday signs", `pick(lang, sign.glossEn, sign.glossAr)`, "More dialects coming soon" + its sub.
- **Components to keep:** `ScreenShell`, `NoProfileFallback`, `Card` (variant="elevated"), `Icon`, `Title`, `Eyebrow`, `Body`, `SignGlyph`.
- **Conditional render:** the review block stays gated by `{due.length > 0 && (…)}`. The "More dialects coming soon" honest-placeholder block stays (decision #6 — no fabricated dialects).

> The reskin changes visuals only. The 4 nav destinations, the profile guard, the due-gating, and the honest "coming soon" block are the contract.

---

## 2 · LAYOUT — target design as ordered blocks

Device frame (all states): outer bezel `#16302E`, radius `47px`, padding `7px`, shadow `0 24px 60px rgba(22,48,46,.28)`; inner screen radius `40px`, bg `#F6EFE3` (paper/1), `overflow:hidden`, column flex. **Do not build the bezel/status bar into the app** — they are mock chrome; the app already has `ScreenShell`. App background behind cards = `#F6EFE3`.

### HUB (the shipping screen — `PractiseChooser`)

**B1 · Header**
- Title: font `800 26px/1.1 Rubik`, color `#16302E`. Copy EN "Practise" / AR "تمرّن".
- Subtitle: font `400 13px/1.35 'Readex Pro'`, color `#5C726F`, `margin-top:3px`. EN "Pick how you want to sign today." / AR "اختر كيف تشير اليوم."
- Container padding: `6px 22px 20px` (scroll area).
- *Reskin mapping:* replace the current `Eyebrow` + long `Title` + `Body`. Keep eyebrow only if desired; design shows title+sub, no eyebrow. Recommend: drop eyebrow, use B1 title/sub.

**B2 · Hub card grid** — `display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:18px`.
Each tile (button): `border:none; border-radius:18px; padding:16px; display:flex; flex-direction:column; align-items:flex-start; box-shadow:0 4px 0 rgba(0,0,0,.18); min-height:118px; cursor:pointer`.
- Icon chip: `44×44px; border-radius:13px; background:rgba(255,255,255,.2); display:flex; center; font:800 24px Rubik; color:#FBF7EF`.
- Tile title: `font:700 15px/1.1 Rubik; color:#FBF7EF; margin-top:11px; text-align:start`.
- Tile sub: `font:500 11px/1.3 'Readex Pro'; color:rgba(255,255,255,.8); margin-top:3px; text-align:start`.

| # | bg | glyph | EN title / sub | AR title / sub | wire to |
|---|----|-------|----------------|----------------|---------|
| 1 | `#0F6E6A` (teal) | `أ` | Alphabet / 28 letters | الأبجدية / ٢٨ حرفًا | `go({name:"camera",targetSignId:"alpha-alif"})` |
| 2 | `#E8654C` (coral) | 🤟 | Words / 16 signs | الكلمات / ١٦ إشارة | `go({name:"camera"})` (or first `GRADABLE_SIGNS` id) |
| 3 | `#E6B24C` (gold/mid) | 📷 | Free camera / Sign anything | كاميرا حرّة / أشِر أي شيء | `go({name:"camera"})` |
| 4 | `#0A4F4C` (teal/ink) | `↺` | Review / 6 due | مراجعة / ٦ مستحقّة | `go({name:"camera",targetSignId:firstDueGradable})` — render only when `due.length>0` |

Notes: cards 1 & 4 use dark teal fills; 2 & 3 use warm fills. All four titles/subs are white-on-color per above. Glyphs 1 (`أ`) & 4 (`↺`) render inside the icon chip as text; 2 (🤟) & 3 (📷) are emoji. The "Words" tile is the design's compaction of the current everyday-signs grid — you MAY keep the existing 3-col `GRADABLE_SIGNS` grid below the hub tiles (reskinned to paper tiles, see B2b) OR fold it behind this tile; preserve reachability of each `sign.id` either way.

**B2b · Everyday-signs grid (keep from current impl, reskin surface only)**
If retained: `Eyebrow` "Everyday signs / إشارات يومية"; `grid grid-cols-3 gap-3`; each tile — `border-radius:` inner tile, bg `#FBF7EF` (paper/0), `1px` hairline border `#EDE3D2`, sign glyph via `SignGlyph` in a `bg-sand/60` chip, label `font:700 ~14px Rubik; color:#16302E`, `active:scale-[.97]`, focus ring teal. One tile per `GRADABLE_SIGNS` item → `go({name:"camera",targetSignId:sign.id})`.

**B3 · Review-due banner** (distinct from tile #4; the design shows BOTH — a compact tile AND this rich banner. Ship whichever fits; banner is the richer honest-review surface, gated by `due.length>0`.)
- Container: `display:flex; align-items:center; gap:12px; background:#0F6E6A; border-radius:18px; padding:15px; margin-top:14px; box-shadow:0 4px 0 #0A4F4C`.
- Left: **Fanan `pose="wave"` scale 0.5** (~62×62px), wrapped in `animation:float 3s ease-in-out infinite`.
- Middle (`flex:1`): title `font:700 15px/1.1 Rubik; color:#FBF7EF` = EN "Review due" / AR "مراجعة مستحقّة" (reuse `homeReviewDue`); body `font:400 12px/1.3 'Readex Pro'; color:rgba(255,255,255,.8); margin-top:3px` = EN "6 signs are ready for a quick refresh." / AR "٦ إشارات جاهزة لتذكير سريع." (count = `num(due.length, lang)`).
- Right badge: `background:#F0C879; color:#16302E; font:800 15px Rubik; padding:6px 12px; border-radius:11px` = `num(due.length, lang)` (design literal "6" / "٦").
- Tap → `go({name:"camera",targetSignId:firstDueGradable})`.

**B4 · "More dialects coming soon"** (keep — honest placeholder, current impl): dashed teal/20 border, `bg-paper/50`, radius 3xl, `Icon name="public"` teal/40, title + sub. Copy unchanged (see COPY table).

---

### QUIZ — reference / future drill (screenshots 01–02). No route yet.

**B5 · Progress + question header** — `padding:6px 22px 0`.
- Progress row: `display:flex; align-items:center; gap:10px`. Track: `height:8px; flex:1; border-radius:99px; background:#EDE3D2; overflow:hidden`; fill: `height:100%; width:60%; background:#E6B24C; border-radius:99px` (RTL: fill anchors to start/right). Count: `font:700 12px/1 Rubik; color:#5C726F` = "3/5".
- Question title: `font:800 22px/1.15 Rubik; color:#16302E; margin-top:16px`. EN "Which meaning is this sign?" / AR "ما معنى هذه الإشارة؟".

**B6 · Sign prompt panel** — `padding:14px 22px 20px` scroll area top. Card `border-radius:20px; height:150px` with diagonal teal stripes `repeating-linear-gradient(135deg,#0F6E6A,#0F6E6A 15px,#12817b 15px,#12817b 30px)`, centered white disc `104×104px; border-radius:50%; background:#FBF7EF; font-size:56px; box-shadow:0 10px 26px rgba(0,0,0,.22)` holding the handshape glyph (🤟). **Stripes never mirror**; glyph never mirrors.

**B7 · Options list** — `display:flex; flex-direction:column; gap:10px; margin-top:16px`.
Each option button: `display:flex; align-items:center; gap:11px; width:100%; border:none; text-align:start; padding:15px 16px; border-radius:15px; font:700 15px/1.1 Rubik; cursor:pointer`. Left mark chip `22×22px; border-radius:50%`.
- **Idle:** bg `#FBF7EF`; text `#16302E`; shadow `inset 0 0 0 1px #EDE3D2`; mark empty, `border:2px solid #EDE3D2`.
- **Correct pick (`o.correct`):** bg `#0F6E6A`; text `#FBF7EF`; shadow `0 3px 0 #0A4F4C`; mark `✓`, chip bg `rgba(255,255,255,.22)`, color `rgba(255,255,255,.9)`.
- **Wrong pick (`o.id===pick`):** bg `#E8654C`; text `#FBF7EF`; shadow `0 3px 0 #C54F3A`; mark `✕`.
- **Other options after a pick:** bg `#F6EFE3`; text `#94A5A2` (dimmed); no mark.
Labels: I love you / Hello / Thank you / More (AR: أحبّك / مرحبًا / شكرًا / المزيد).

**B8 · Quiz CTA** — `padding:10px 22px 20px`; full-width button `height:52px; border-radius:16px; border:none; color:#FBF7EF; font:700 15px/1 Rubik`.
- Before a pick: bg `#C7D0CE`, shadow `0 4px 0 #aab6b3`, label "Pick an answer" / "اختر إجابة".
- After a pick: bg `#0F6E6A`, shadow `0 4px 0 #0A4F4C`, label "Next →" / "التالي ←" (arrow mirrors: `←` in AR).
Active/press: `translateY(3px); box-shadow:0 1px 0 <shadow>`.

---

### MATCH — reference / future drill (screenshots 03–04). No route yet.

**B9 · Header** — `padding:6px 22px 0`. Title `font:800 22px/1.15 Rubik; color:#16302E` = "Match the pairs" / "طابِق الأزواج". Body `font:400 13px/1.35 'Readex Pro'; color:#5C726F; margin-top:3px` = "Tap a sign, then its meaning." / "انقر إشارة ثم معناها.".

**B10 · Two-column board** — `display:flex; gap:12px`. Left col = glyph buttons, right col = meaning buttons; each col `flex:1; flex-direction:column; gap:11px`. Every button `height:58px; border-radius:15px; border:none; display:flex; center; cursor:pointer`.
- Left glyph button: idle bg `#FBF7EF`, shadow `inset 0 0 0 1px #EDE3D2`; glyph `font-size:26px`. Selected (`sel===id`): shadow `0 0 0 3px #E6B24C` (gold ring). Matched: bg `#0F6E6A`, shadow `0 3px 0 #0A4F4C`, `opacity:.9; filter:grayscale(.2)`.
- Right meaning button: `font:700 14px/1.1 Rubik`; idle bg `#FBF7EF`, text `#16302E`, shadow `inset 0 0 0 1px #EDE3D2`. Matched: bg `#0F6E6A`, text `#FBF7EF`, shadow `0 3px 0 #0A4F4C`.
- Left glyphs: 👋 🤟 🙏 🤏 ; Right labels: I love you / Milk / Hello / Thank you (AR meanings: أحبّك / حليب / مرحبًا / شكرًا). Columns are independently ordered (glyph order ≠ meaning order) — that mismatch is the puzzle.

**B11 · Match status** — `text-align:center; font:600 12px/1.3 'Readex Pro'; color:#5C726F; margin-top:16px` = `"{matched} / 4 matched"` / `"{matched} / 4 مطابَقة"` (AR renders as `٤ / ١ مطابقة` — number order follows RTL).

---

### RESULTS — reference / future drill. No route yet. (No screenshot; lifted from source.)

**B12 · Celebration head** — centered scroll area `padding:6px 22px 20px`. **Fanan `pose="celebrate"` scale 0.85** (~102×102px), `animation:float 2.6s ease-in-out infinite`. Title `font:800 27px/1.1 Rubik; color:#16302E; margin-top:12px; animation:pop .5s ease both` = "Great session!" / "جلسة رائعة!". Body `font:400 14px/1.4 'Readex Pro'; color:#5C726F; margin-top:6px` = "You reviewed 6 signs with Fanan." / "راجعت ٦ إشارات مع فَنَن.".

**B13 · Stats row** — `display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:20px`. Each cell: bg `#FBF7EF; border:1px solid #EDE3D2; border-radius:15px; padding:13px 6px`. Value `font:800 22px/1 Rubik`; label `font:600 10px/1.2 'Readex Pro'; color:#5C726F; margin-top:4px`.
- 90% · Accuracy · value color `#0F6E6A` (AR ٩٠٪ · الدقّة)
- +45 · XP · value color `#E8654C` (AR +٤٥ · نقاط)
- 6 · Signs · value color `#C89A3D` (AR ٦ · إشارات)

**B14 · "Review next" card** — bg `#FBF3EF; border:1px solid #F5C9BE; border-radius:16px; padding:14px; margin-top:14px; text-align:start`. Label `font:700 11px/1 ui-monospace,Menlo; letter-spacing:.08em; text-transform:uppercase; color:#C54F3A` = "Review next" / "راجع تاليًا". Chips row `display:flex; gap:8px; margin-top:10px`; each chip `display:flex; align-items:center; gap:7px; background:#FBF7EF; border:1px solid #EDE3D2; border-radius:11px; padding:7px 11px` — glyph `font-size:18px` + label `font:600 12px 'Readex Pro'; color:#16302E`. Chips: 👋 Hello / 🤏 Milk (AR: مرحبًا / حليب).

**B15 · Results CTA** — `padding:12px 22px 20px`; full-width button `height:54px; border-radius:17px; border:none; background:#E8654C; color:#FBF7EF; font:700 16px/1 Rubik; box-shadow:0 5px 0 #C54F3A` = "Back to practise" / "العودة للتمرّن". Active: `translateY(4px); box-shadow:0 1px 0 #C54F3A`.

**B16 · Confetti overlay** — `position:absolute; inset:0; overflow:hidden; pointer-events:none`. 34 pieces, each `6–14px` wide × `0.66×` tall, colors cycle `['#0F6E6A','#E8654C','#E6B24C','#F0C879','#F08A75']`, `border-radius` 2px or 50% (random), random start `left`, `animation:confettiFall 1.3–2.2s <delay> ease-in forwards`. Keyframe: `translateY(0) rotate(0) → translateY(440px) rotate(560deg); opacity→.2`. Freeze under reduce-motion.

---

## 3 · COPY — every visible string

| Key | EN | AR |
|---|---|---|
| `practiseTitle` *(new)* | Practise | تمرّن |
| `practiseSubtitle` *(new)* | Pick how you want to sign today. | اختر كيف تشير اليوم. |
| `practiseAlphabet` *(new)* | Alphabet | الأبجدية |
| `practiseAlphabetSub` *(new)* | 28 letters | ٢٨ حرفًا |
| `practiseWords` *(new)* | Words | الكلمات |
| `practiseWordsSub` *(new)* | 16 signs | ١٦ إشارة |
| `practiseFreeCamera` *(new)* | Free camera | كاميرا حرّة |
| `practiseFreeCameraSub` *(new)* | Sign anything | أشِر أي شيء |
| `practiseReview` *(new)* | Review | مراجعة |
| `practiseReviewCountSuffix` *(new)* | due | مستحقّة |
| `homeReviewDue` *(reuse)* | Review due | مراجعة مستحقة |
| `practiseReviewBody` *(new)* | signs are ready for a quick refresh. | إشارات جاهزة لتذكير سريع. |
| `navPractise` *(reuse — eyebrow, optional)* | Practise | تدرّب |
| — Everyday signs eyebrow *(current `pick`, keep)* | Everyday signs | إشارات يومية |
| — sign tile labels *(from `sign.glossEn/glossAr`)* | I love you / Milk / Hello / Thank you / More | أحبّك / حليب / مرحبًا / شكرًا / المزيد |
| — coming-soon title *(current `pick`, keep)* | More dialects coming soon | لهجات أخرى قريبًا |
| — coming-soon body *(current `pick`, keep)* | Emirati, Saudi & more Gulf sign languages are on the way. | الإماراتية والسعودية ولغات إشارة خليجية أخرى قادمة. |
| **Quiz (reference)** | | |
| `quizProgress` *(format `n/5`, no i18n needed — use `num`)* | 3/5 | ٣/٥ |
| `quizQuestion` *(new; AR == `lsRecogniseTitle`)* | Which meaning is this sign? | ما معنى هذه الإشارة؟ |
| `quizPick` *(new)* | Pick an answer | اختر إجابة |
| `quizNext` *(new)* | Next → | التالي ← |
| **Match (reference)** | | |
| `matchTitle` *(new)* | Match the pairs | طابِق الأزواج |
| `matchBody` *(new)* | Tap a sign, then its meaning. | انقر إشارة ثم معناها. |
| `matchStatusSuffix` *(new; format `"{n} / 4 {suffix}"`)* | matched | مطابَقة |
| **Results (reference)** | | |
| `resultsTitle` *(new)* | Great session! | جلسة رائعة! |
| `resultsBody` *(new)* | You reviewed 6 signs with Fanan. | راجعت ٦ إشارات مع فَنَن. |
| `resultsReviewNext` *(new)* | Review next | راجع تاليًا |
| `resultsCta` *(new)* | Back to practise | العودة للتمرّن |
| `statAccuracy` *(reuse `accuracy`)* | Accuracy | الدقة |
| `statXp` *(new; `xp` exists but ="نقطة")* | XP | نقاط |
| `statSigns` *(new)* | Signs | إشارات |

---

## 4 · NEW-I18N — keys to append to `src/i18n.ts`

Only keys NOT already in `dict`. (`homeReviewDue`, `homeReviewCta`, `navPractise`, `accuracy`, `xp` already exist — reuse.) Ready to paste inside the `dict` object:

```ts
  // practise hub
  practiseTitle: { en: "Practise", ar: "تمرّن" },
  practiseSubtitle: { en: "Pick how you want to sign today.", ar: "اختر كيف تشير اليوم." },
  practiseAlphabet: { en: "Alphabet", ar: "الأبجدية" },
  practiseAlphabetSub: { en: "28 letters", ar: "٢٨ حرفًا" },
  practiseWords: { en: "Words", ar: "الكلمات" },
  practiseWordsSub: { en: "16 signs", ar: "١٦ إشارة" },
  practiseFreeCamera: { en: "Free camera", ar: "كاميرا حرّة" },
  practiseFreeCameraSub: { en: "Sign anything", ar: "أشِر أي شيء" },
  practiseReview: { en: "Review", ar: "مراجعة" },
  practiseReviewCountSuffix: { en: "due", ar: "مستحقّة" },
  practiseReviewBody: { en: "signs are ready for a quick refresh.", ar: "إشارات جاهزة لتذكير سريع." },

  // practise drills (reference — quiz / match / results; only add when routed)
  quizQuestion: { en: "Which meaning is this sign?", ar: "ما معنى هذه الإشارة؟" },
  quizPick: { en: "Pick an answer", ar: "اختر إجابة" },
  quizNext: { en: "Next →", ar: "التالي ←" },
  matchTitle: { en: "Match the pairs", ar: "طابِق الأزواج" },
  matchBody: { en: "Tap a sign, then its meaning.", ar: "انقر إشارة ثم معناها." },
  matchStatusSuffix: { en: "matched", ar: "مطابَقة" },
  resultsTitle: { en: "Great session!", ar: "جلسة رائعة!" },
  resultsBody: { en: "You reviewed 6 signs with Fanan.", ar: "راجعت ٦ إشارات مع فَنَن." },
  resultsReviewNext: { en: "Review next", ar: "راجع تاليًا" },
  resultsCta: { en: "Back to practise", ar: "العودة للتمرّن" },
  statXp: { en: "XP", ar: "نقاط" },
  statSigns: { en: "Signs", ar: "إشارات" },
```

> If the quiz/match/results drills are not being built in this reskin phase, append only the first block (`practiseTitle`…`practiseReviewBody`). Use `num(count, lang)` for the "6"/"٦" counts rather than hard-coding the numeral.

---

## 5 · MOTION / STATES

- **Springy buttons** (all CTAs + hub tiles): hard bottom shadow `0 4px 0`/`0 5px 0 <deep>`, no blur. On press `translateY(3–4px)` and collapse shadow to `0 1px 0`. Curve: Spring-out `cubic-bezier(.34,1.56,.64,1)` ~260ms (HANDOFF §Motion).
- **Fanan float:** `@keyframes float{0%,100%{translateY(0)}50%{translateY(-6px)}}` — 3s (hub banner), 2.6s (results). Freeze under reduce-motion.
- **Results title pop-in:** `@keyframes pop{0%{scale(.6);opacity:0}60%{scale(1.1)}100%{scale(1)}}` .5s.
- **Confetti:** `@keyframes confettiFall` linear-ish fall + spin, 1.3–2.2s per piece, staggered delay; opacity fades to .2. Freeze under reduce-motion.
- **Quiz interactive states** (see B7): idle → on pick, correct answer springs to teal + ✓, the tapped-wrong answer turns coral + ✕, all other options dim to `#94A5A2` on `#F6EFE3`. Logic: first tap locks (`if(pick) return`); CTA switches label/color; reset clears `pick`.
- **Match interactive states** (see B10, screenshots 03→04): tap a left glyph → gold ring `0 0 0 3px #E6B24C`; tap the correct right meaning → BOTH lock to teal (`0 3px 0 #0A4F4C`), glyph dims (`opacity:.9; grayscale(.2)`); wrong right tap clears selection. Status text counts `matched.length / 4` up. Matched tiles are inert (`if(matched.includes(id)) return`).
- **Empty state:** review banner/tile (B3 / tile #4) renders ONLY when `due.length > 0` — otherwise omit entirely (current `{due.length > 0 && …}` gate). No due list ⇒ no banner, no empty text.
- **Loading:** none on the hub (synchronous store read). Drill screens: rely on camera/model loading states from `camLoading`/`camLooking` when they hand off to `{name:"camera"}` — not on this screen.
- **Error:** no profile → `<NoProfileFallback />` (preserved). No other error surface on hub.
- **"More dialects" state:** static honest placeholder (dashed border), non-interactive — deliberately not a button.

---

## 6 · RTL

Design the AR panel first; anchor with `dir="rtl"` + logical props (`text-align:start`, `inset-inline-start`, `margin-inline`, flex order). Per HANDOFF §2:

**Mirrors (flip in RTL):**
- Reading flow + all block/tile/column order (hub grid, match two-column board).
- Progress-bar fill origin (quiz B5 fill anchors to the start/right edge in AR).
- The "Next →" CTA arrow becomes "التالي ←".
- The alphabet tile's demo strip `ا ب ت` reads RTL naturally (already `dir="rtl"` in current impl).
- Tab/scroll order.

**Never mirrors (physical / semantic):**
- **Fanan** the fox (hub banner wave pose, results celebrate pose) — same character both directions.
- The **checkmark ✓** and **✕** mark glyphs in quiz options.
- **Camera / play / record** glyphs — the 📷 "Free camera" tile glyph.
- **Sign-language handshapes / emoji glyphs** (🤟 👋 🙏 🤏 `أ`) — they represent physical hands; never flip.
- The quiz sign-prompt **diagonal stripe pattern** (135° gradient) and the white prompt disc.
- Status-bar clock `9:41`.

**Numerals:** AR uses Eastern-Arabic glyphs `٠١٢٣٤٥٦٧٨٩`; percent `٪` trails (`٩٠٪`). Counts (due count, `3/5`, `1/4`) go through `num(n, lang)`. Never mix scripts on one panel.
