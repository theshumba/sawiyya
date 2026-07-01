# Lesson player — reskin build spec

Target file: `/Users/theshumba/Documents/GitHub/sawiyya/src/screens/LessonPlayer.tsx`
Design refs: `Sawiyya Practice Loop.dc.html` (watch / camera phases + results), `Sawiyya Practise.dc.html` (MCQ quiz, tile grid, results card, review-next band).
Branch: `feat/design-rebuild`.

**Scope note.** `LessonPlayer` renders one drill at a time and delegates the live camera drill to `<CameraTrainer>` (its own screen/spec). The Practice-Loop states `looking / detecting / correct / notquite` are owned by `CameraTrainer`, NOT this file — do not rebuild them here. This spec covers what `LessonPlayer` itself renders: the takeover shell + progress, the **watch** drill, the **recognise/recall/review** choice drills, the soft-feedback band, the drill footer CTA, the **results** end card, and the **empty** state. The Practise.dc.html MCQ maps to `recognise`; its tile pairs map to `recall`; its results screen maps to `ResultsCard`.

---

## 1 · PRESERVE — functional contract (must stay wired)

These identifiers in `LessonPlayer.tsx` MUST remain wired after the reskin. Reskin changes markup/classes ONLY.

### Store / hooks
- `const app = useApp();` — Zustand app store (root of everything below).
- `const { go } = useUi();` — navigation. Every screen change goes through `go({...})`.
- `activeProfile(app)` → `profile`; guard `if (!profile) return <NoProfileFallback />;` must stay.
- `profile.language` → `lang`; `profile.streak` (results streak stat); `profile.id` (queue key).
- `useApp.getState()` passed into `buildDrillQueue(lessonId, useApp.getState(), profileId)`.
- `const { recordDrillResult } = useApp();` — called inside **every** drill (WatchDrill, CameraDrill, ChoiceDrill). Signatures to keep:
  - `recordDrillResult(sign.id, "good", { watch: true })` (WatchDrill)
  - `recordDrillResult(sign.id, id === sign.id ? "good" : "again")` (ChoiceDrill on pick)
  - `recordDrillResult(sign.id, "hard")` / `recordDrillResult(sign.id, "good", { camera, matched, selfMark })` (CameraDrill)
- `app.recordLessonComplete()` — fired once when `next >= queue.length` in `advance()`. Keep.

### Content / engine
- `lessonById(lessonId)`, `signById(id)`, `A1_SIGNS`, `ALPHABET` (choice pools), `buildDrillQueue(...)`, `buildChoices(sign.id, pool)`.
- `queue` computed via `useMemo(..., [lessonId, profileId])`; `index`/`setIndex`, `xpEarned`/`scored`/`correctCount` refs, `burst`/`setBurst` — the whole scoring/advance state machine (`advance`, `DrillOutcome`) must remain intact.
- `drill.type` switch in `<Drill>`: `"watch" | "camera" | "recognise" | "review" | "recall"`. Preserve the routing.
- `CameraDrill` returns `<CameraTrainer sign={sign} lang={lang} onResult={handleResult} allowSkip autoStart />` — keep as-is (its result mapping `"skip" | "match" | "selfMark"` feeds `onDone`).

### Components to keep mounted
- `<ScreenShell lang={lang} chrome="takeover" onClose={...}>` wraps every state. `onClose` → `go({ name: "home" })`. Results state uses `chrome="takeover"` with **no** onClose (intentional — no escape hatch mid-celebration; CTA drives navigation).
- `<MeetingBar progress={index / queue.length} />` — the progress indicator. (Reskin may restyle to the pill bar in §2 block B, but keep a progress element driven by `index / queue.length`.)
- `<Confetti burst={burst} />` and `celebrate()` (fired in `advance`).
- `<SignDemo sign={sign} lang={lang} />` (WatchDrill body), `<SignGlyph sign={sign} lang={lang} .../>` (miss card + results rail), `<Button>`, `<Card>`, `<Icon>`, `<NoProfileFallback>`.

### Navigation calls (exact)
- `go({ name: "home" })` — empty-state back, results Continue.
- `go({ name: "camera" })` — empty-state practice CTA.
- `go({ name: "camera", targetSignId })` — results `onPractice(targetSignId)` (pre-targets a just-learned gradable sign; `firstGradable?.id`).

### i18n `t()` calls currently in the file (keep every key wired)
`t("practiceCamera", lang)`, `t("lsBackHome", lang)`, `t("lsWatchTitle", lang)`, `t("lsContinue", lang)`, `t("lsReviewTitle", lang)`, `t("lsRecogniseTitle", lang)`, `t("lsRecallTitle", lang)`, `t("lsCorrect", lang)`, `t("lsSoftMiss", lang)`, `t("lsCheck", lang)`, `t("lsLessonDone", lang)`, `t("lsXpEarned", lang)`, `t("accuracy", lang)`, `t("homeStreak", lang)`, `t("lsWhatsNext", lang)`.

### Inline `pick(lang, en, ar)` calls (keep or migrate to new keys — see §4)
Empty state: `pick(lang, "Nothing due right now", "لا شيء مستحق الآن")`, `pick(lang, "You're ahead — keep your hands warm with some camera practice.", "أنت متقدّم — أبقِ يديك جاهزتين بتدريب على الكاميرا.")`. DemoFace replay chip: `pick(lang, "Watch again", "شاهد مرة أخرى")`. Recall card + gloss: `pick(lang, sign.glossEn, sign.glossAr)`. Results Continue: `pick(lang, "Continue", "متابعة")`.

### Props
- Component signature `LessonPlayer({ lessonId }: { lessonId: string })` — unchanged.
- Sub-component prop shapes (`Drill`, `ChoiceDrill`, `ChoiceRow`, `ChoiceTile`, `DemoFace`, `ResultsCard`, `StatCard`, `BilingualGloss`) may be restyled but their inputs (sign, lang, state enum `"idle"|"correct"|"wrong"|"dim"`, onDone/onClick, xp/accuracy/streak) must stay.

---

## 2 · LAYOUT — target design as ordered blocks

Global: canvas behind app `#F1E7D6`; app/screen surface `#FBF7EF` (watch) or `#F6EFE3` (quiz/results sand). Ink text `#16302E`. Latin = **Rubik**, Arabic + body = **Readex Pro** (Arabic +0.15 line-height). Signature spring button = solid fill + hard bottom shadow `box-shadow: 0 5px 0 <deep>`; on press `translateY(4px)` and shadow → `0 1px 0 <deep>`.

### Block A — Takeover shell (all states)
- Full-bleed `ScreenShell chrome="takeover"`, surface `#FBF7EF`. Close affordance = back glyph, start-edge. Back glyph chip: 34×34px circle, bg `#F6EFE3`, glyph `‹` (EN) / `›` (AR), font 700 18px Rubik, color `#16302E`. Fires `go({ name: "home" })`.

### Block B — Header + step progress (drill states)
- Row: `[back chip] [step block flex:1] [streak pill]`, padding `6px 18px 10px`.
- Step label: `font 600 12px Readex`, color `#5C726F`. Text = "Watch the sign" (watch) / "Sign it back" (camera step). New keys `lsWatchStep` / `lsSignBack`.
- Step dots (below label, gap 5px): active dot `20×6px radius 99px bg #0F6E6A`; inactive dot `6×6px radius 99px bg #EDE3D2`. Step 1 = watch/demo, step 2 = camera.
- Streak pill (end-edge): bg `#F6EFE3`, radius 99px, padding `5px 10px`, coral dot `14px circle #E8654C`, count `font 700 13px Rubik #16302E`. (Feed from `profile.streak`.)
- **Quiz/choice variant** (from Practise.dc.html): thin progress bar in place of dots — track `height 8px, flex:1, radius 99px, bg #EDE3D2`; fill `bg #E6B24C, radius 99px` width = `index/queue.length`; trailing counter `font 700 12px Rubik #5C726F` e.g. `3/5` (localise numerals). This is where `<MeetingBar>` maps; restyle to this pill.

### Block C — WatchDrill (drill.type "watch")
Question heading centered above a signer-demo card + hint card + spring CTA.
- **Heading** (`DrillTitle`): `font 800 26px/1.05 Rubik`, color `#16302E`, letter-spacing -.01em. Copy = sign name (`sign.glossEn`/`glossAr`, active lang). Sub-line under it: `font 500 13px/1.35 Readex #5C726F` = sign kind label (e.g. "Arabic letter · static handshape"). Enter with `rise` animation.
- **Signer demo card** (holds `<SignDemo>`): radius 24px, height ~196px, overflow hidden. Background diagonal signer texture `repeating-linear-gradient(135deg,#0F6E6A,#0F6E6A 15px,#12817b 15px,#12817b 30px)`. Centered glyph medallion: 126×126px circle, bg `#FBF7EF`, font-size 66px, `box-shadow 0 12px 30px rgba(0,0,0,.24)`.
  - Signer badge top-start: text `● SIGNER DEMO` (new key `lsSignerDemo`), `font 700 9px ui-monospace/Menlo`, letter-spacing .1em, color `rgba(255,255,255,.85)`, bg `rgba(0,0,0,.28)`, padding `5px 9px`, radius 8px.
  - Play button bottom-end: 40×40px circle, bg `#E6B24C`, glyph `▶` color `#16302E`, `box-shadow 0 5px 0 #C89A3D`. (Wire to the existing DemoFace `replayKey` re-trigger.) **Never mirrors** (§6).
- **Hint card** (below demo, margin-top ~13px): bg `#F6EFE3`, border `1px #EDE3D2`, radius 16px, padding `12px 13px`, flex gap 10px.
  - Leading badge: 24×24px, radius 8px, bg `#E6B24C`, `!` `font 800 13px Rubik #16302E`.
  - Label: "HINT" / "تلميح" (new key `lsHint`) `font 700 10px ui-monospace uppercase`, letter-spacing .08em, color `#C89A3D`.
  - Hint body: `font 400 12.5px/1.4 Readex #16302E`. (Feed from `sign.hintEn/hintAr`.)
- **Footer CTA** (`DrillFooter` + `Button`): full-width spring button, height 54px, radius 17px, `font 700 16px Rubik`. WATCH tone = **coral**: bg `#E8654C`, text `#FBF7EF`, shadow `0 5px 0 #C54F3A`. Label `t("lsContinue")` + ` →` (design copy "I'll try it →"; keep `lsContinue`, or add trailing arrow). Fires `recordDrillResult(...,"good",{watch:true})` then `onDone({xp:5,...})`.

### Block D — ChoiceDrill · recognise / review (drill.type "recognise" | "review")
Maps to Practise.dc.html MCQ.
- **Heading**: `t("lsRecogniseTitle")` ("What does this sign mean?") — review appends `⏳` via `t("lsReviewTitle")`. Style as Block C heading (Rubik 800, teal `#0F6E6A` in current impl — keep teal `#0F6E6A` for drill titles).
- **Question medallion card** (`Card variant="elevated"`, holds `DemoFace` without gloss): radius 20px, height ~150px, bg diagonal teal texture `repeating-linear-gradient(135deg,#0F6E6A,#0F6E6A 15px,#12817b 15px,#12817b 30px)`. Centered medallion 104×104px circle bg `#FBF7EF`, glyph font-size 56px, `box-shadow 0 10px 26px rgba(0,0,0,.22)`. Watch-again replay chip bottom-end (frosted): bg `#F6EFE3` @ 85%, border `2px #0F6E6A`@10%, radius 99px, `play_circle` teal + label "Watch again"/"شاهد مرة أخرى" `font 700 11px Rubik uppercase teal`.
- **Answer rows** (`ChoiceRow`, one column mobile / 2-col desktop, gap 10–12px). Each row `padding 15px 16px`, radius 15px, `font 700 15px/1.1 Rubik`, flex gap 11px, text-align start. State palette:
  - `idle`: bg `#FBF7EF`, text `#16302E`, `box-shadow inset 0 0 0 1px #EDE3D2`. Leading mark = empty circle 22px, border `2px #EDE3D2`.
  - `correct`: bg `#0F6E6A`, text `#FBF7EF`, `box-shadow 0 3px 0 #0A4F4C`. Mark = `✓` in 22px circle bg `rgba(255,255,255,.22)`, color `rgba(255,255,255,.9)`.
  - `wrong` (the picked-wrong): bg `#E8654C`, text `#FBF7EF`, `box-shadow 0 3px 0 #C54F3A`. Mark = `✕` same circle.
  - `dim` (unpicked after answer): bg `#F6EFE3`, text `#94A5A2`.
  - Label = bilingual gloss (EN · AR), current impl keeps the `·` separator; AR span `dir="rtl"`.
- **Numbered badge** in current impl (`n`) may be replaced by the design's leading check/x mark circle; keep the `n` for a11y aria if desired but the design uses the state mark, not a number.

### Block E — ChoiceDrill · recall (drill.type "recall")
- **Heading**: `t("lsRecallTitle")` ("Which sign means…").
- **Prompt card** (`Card variant="elevated"`, bg `#0F6E6A`@5%): centered gloss — primary `font 800 30px/1 Rubik #0F6E6A`, secondary script under it `font 500 18px Readex #5C726F` (opposite-lang, `dir` flipped).
- **Answer tiles** (`ChoiceTile`, 2-col grid, gap 12px): each tile `height ~58–72px`, radius 15px, centered. State palette mirrors Block D (idle inset hairline / correct teal+`0 3px 0 #0A4F4C` / wrong coral / dim sand). Big glyph `font-size 26–40px` (alphabet code or emoji), tiny hint caption `font 12px Readex #5C726F` (truncate >38 chars). Corner number badge top-start (`start-3 top-3`).

### Block F — Soft-feedback band (choice drills, after pick)
`aria-live="polite"`, `animate-rise`, max-w-md.
- Banner pill: radius 16px, padding `4px 12px`-ish `font 600–700`. Correct tone: bg `gold #E6B24C`@20%, text ink, icon `check_circle` filled. Miss tone: bg `teal #0F6E6A`@10%, text teal, icon `favorite` filled. Copy `t("lsCorrect")` / `t("lsSoftMiss")`. **Never a hard fail.**
- On miss only, reveal card below: `Card` flex, `SignGlyph` 48px + correct gloss `font 800 Rubik`. (This is the design's "here it is" reveal.)

### Block G — DrillFooter CTA (choice drills)
- Full-width spring `Button variant="primary"`, height 54px, radius 17px, `font 700 16px Rubik`.
- Before pick: **disabled/idle** — design uses muted fill bg `#C7D0CE`, shadow `#aab6b3`, label `lsPickAnswer` ("Pick an answer" / "اختر إجابة") — NEW key (current impl uses `t("lsCheck")`; you may keep `lsCheck` or switch to `lsPickAnswer` to match design copy).
- After pick: **active** — bg teal `#0F6E6A`, shadow `0 3px 0 #0A4F4C`, label `lsNext` ("Next →" / "التالي ←") — NEW key (current impl uses `lsContinue`+`→`; either works). Fires `onDone({ xp: correct ? 10 : 4, scored:true, correct })`.

### Block H — ResultsCard (state `done`)
Maps to Practise.dc.html results screen. Sand-ish takeover, centered column, `<Confetti burst={burst}>` overlaid (radius clip). Order:
1. **Fanan celebrate**: mascot `pose="celebrate"` scale ~0.85, `float` idle animation. (Replaces the 🎉 gold medallion.) Fanan **never mirrors**.
2. **Title**: `font 800 27px/1.1 Rubik #16302E`, `pop` animation. Copy = `lsSessionTitle` ("Great session!" / "جلسة رائعة!") — NEW (current impl uses `t("lsLessonDone")`="Lesson complete!"; keep either, design says "Great session!"). Optional sub-body `font 400 14px Readex #5C726F` = lesson title (`pick(lang, lesson.titleEn, lesson.titleAr)`), or `lsSessionBody`.
3. **Stat trio** (grid 3-col, gap 10px). Each: bg `#FBF7EF`, border `1px #EDE3D2`, radius 15px, padding `13px 6px`, centered. Value `font 800 22px Rubik` (colored), label `font 600 10px Readex #5C726F`. Three cards, in order:
   - Accuracy → value `${num(accuracy,lang)}%`, value color teal `#0F6E6A`, label `t("accuracy")`.
   - XP → value `+${num(xp,lang)}`, value color coral `#E8654C`, label `t("lsXpEarned")`.
   - Signs → value `num(signIds.length,lang)`, value color gold `#C89A3D`, label `lsSigns` NEW. (Current impl's third card is Streak `homeStreak`+fire icon — you MAY keep Streak instead of Signs; both are valid. If keeping Streak, no new key needed.)
4. **Review-next band** (optional, from design): bg `#FBF3EF`, border `1px #F5C9BE`, radius 16px, padding 14px, text-align start. Label `lsReviewNext` ("Review next" / "راجع تاليًا") `font 700 11px ui-monospace uppercase #C54F3A`. Chips per due sign: bg `#FBF7EF`, border `1px #EDE3D2`, radius 11px, padding `7px 11px`, glyph 18px + label `font 600 12px Readex #16302E`. — Feed from `learned` signs. (This restyles the current "signs learned" snap rail; keep the `onPractice(s.cameraGradable ? s.id : undefined)` handler on each chip.)
5. **Actions** (mt-auto): primary spring CTA `Button variant="primary"` — design coral bg `#E8654C`, shadow `0 5px 0 #C54F3A`, height 54px, radius 17px, label = camera-first `t("practiceCamera")` with `videocam` icon → `onPractice(firstGradable?.id)`. Secondary `Button variant="secondary"` → `onContinue` (`go home`), label `lsBackToPractise` ("Back to practise") OR keep `pick(lang,"Continue","متابعة")`+`→`. **Keep the practice-first ordering: camera dominant, continue secondary.**

### Block I — Empty state (`empty` queue)
Keep close-to-home chrome (has `onClose`). Centered column:
- Icon medallion 64×64px circle, bg teal `#0F6E6A`@10%, `task_alt` filled teal 36px.
- Title `font 800 24px Rubik #0F6E6A` = `pick(lang,"Nothing due right now","لا شيء مستحق الآن")`.
- Body `#5C726F` = `pick(lang,"You're ahead — keep your hands warm with some camera practice.", …)`.
- Primary CTA `Button primary` → `go({name:"camera"})`, `videocam` icon + `t("practiceCamera")`.
- Ghost CTA → `go({name:"home"})`, `t("lsBackHome")`.

---

## 3 · COPY — every visible string

| Key (existing unless "NEW") | English | Arabic (verbatim from RTL panel) |
|---|---|---|
| `lsWatchStep` **NEW** | Watch the sign | شاهد الإشارة |
| `lsSignBack` **NEW** (camera step, CameraTrainer) | Sign it back | أعد الإشارة |
| `lsSignerDemo` **NEW** | SIGNER DEMO | عرض المُشِير |
| `lsHint` **NEW** | Hint | تلميح |
| (inline) DemoFace chip | Watch again | شاهد مرة أخرى |
| `lsWatchTitle` (existing) | A new sign | إشارة جديدة |
| `lsContinue` (existing) | Continue | متابعة |
| `lsRecogniseTitle` (existing) | What does this sign mean? | ما معنى هذه الإشارة؟ |
| `lsRecallTitle` (existing) | Which sign means… | أي إشارة تعني… |
| `lsReviewTitle` (existing) | Quick review | مراجعة سريعة |
| `lsCorrect` (existing) | Beautiful — that's it! | ممتاز — هذه هي! |
| `lsSoftMiss` (existing) | Not quite — here it is. You'll get it next time. | ليست هذه — ها هي الإجابة. ستصيبها المرة القادمة. |
| `lsPickAnswer` **NEW** (idle CTA) | Pick an answer | اختر إجابة |
| `lsNext` **NEW** (active CTA) | Next | التالي |
| `lsCheck` (existing, alt idle CTA) | Check | تحقق |
| `lsSessionTitle` **NEW** (results) | Great session! | جلسة رائعة! |
| `lsLessonDone` (existing, alt) | Lesson complete! | اكتمل الدرس! |
| `accuracy` (existing) | Accuracy | الدقة |
| `lsXpEarned` (existing) | XP earned | نقاط الخبرة |
| `lsSigns` **NEW** (stat) | Signs | إشارات |
| `homeStreak` (existing, alt stat) | day streak | أيام متتالية |
| `lsReviewNext` **NEW** | Review next | راجع تاليًا |
| `lsWhatsNext` (existing, alt heading) | What's next | ما التالي |
| `lsBackToPractise` **NEW** (secondary CTA) | Back to practise | العودة للتمرّن |
| `practiceCamera` (existing) | Practise with camera | تدرّب بالكاميرا |
| (inline) results Continue | Continue | متابعة |
| `lsBackHome` (existing) | Back home | العودة للرئيسية |
| (inline) empty title | Nothing due right now | لا شيء مستحق الآن |
| (inline) empty body | You're ahead — keep your hands warm with some camera practice. | أنت متقدّم — أبقِ يديك جاهزتين بتدريب على الكاميرا. |

**Fanan speech-bubble lines** (Practice Loop; owned by `CameraTrainer`, listed for completeness — do NOT add to LessonPlayer): watch "Watch me first!" / "شاهدني أولًا!"; looking "Show me your hand" / "أرني يدك"; detecting "Ooh, nice…" / "جميل…"; correct "That's it!" / "أحسنت!"; notquite "So close — again!" / "اقتربت — مجددًا!"; demo "Wave with me!" / "لوّح معي!". Privacy line "100% on your device · nothing leaves your phone" already exists as `camPrivacy`.

---

## 4 · NEW-I18N — keys not in `src/i18n.ts` (append to `dict`, keep in `// lesson` block)

```ts
  // lesson — reskin (Practice Loop / Practise)
  lsWatchStep: { en: "Watch the sign", ar: "شاهد الإشارة" },
  lsSignBack: { en: "Sign it back", ar: "أعد الإشارة" },
  lsSignerDemo: { en: "SIGNER DEMO", ar: "عرض المُشِير" },
  lsHint: { en: "Hint", ar: "تلميح" },
  lsPickAnswer: { en: "Pick an answer", ar: "اختر إجابة" },
  lsNext: { en: "Next", ar: "التالي" },
  lsSessionTitle: { en: "Great session!", ar: "جلسة رائعة!" },
  lsSigns: { en: "Signs", ar: "إشارات" },
  lsReviewNext: { en: "Review next", ar: "راجع تاليًا" },
  lsBackToPractise: { en: "Back to practise", ar: "العودة للتمرّن" },
```

All other copy reuses existing keys (§3). `lsWatchStep`/`lsSignBack` are header step labels; `lsPickAnswer`/`lsNext` can replace or complement `lsCheck`/`lsContinue`; `lsSessionTitle`/`lsSigns`/`lsBackToPractise` optionally replace `lsLessonDone`/`homeStreak`/inline-Continue if you adopt the design copy exactly.

---

## 5 · MOTION / STATES

Keyframes (lift literal from design):
- `float`: `0%,100%{translateY(0)} 50%{translateY(-6/-7px)}` — Fanan idle, demo medallion (2.4–3.4s ease-in-out infinite).
- `rise`: `translateY(12–14px)+opacity0 → 0` — titles/hint cards enter (`.3–.4s ease both`). Matches current `animate-rise`.
- `pop`: `scale(.5/.6)+op0 → scale(1.1/1.12) → scale(1)` — results title, medallions (`.4–.5s cubic-bezier(.2,1.4,.5,1)`). Matches current `animate-pop-in`.
- `pulseRing`: gold expanding ring on the correct check (`1.6s ease-out infinite`) — CameraTrainer correct state.
- `confettiFall`: `translateY(0)rotate(0) → translateY(420–440px)rotate(540–560deg), opacity→.2` (`1.2–2.1s ease-in forwards`), 34–36 pieces, colors `#0F6E6A #E8654C #E6B24C #F0C879 #F08A75`, random square/circle — keep `<Confetti>`.
- Spring button press: `transition all .08s`; active → `translateY(4px)` + shadow collapses `0 5px 0 → 0 1px 0`.

Interactive states:
- **Choice pick**: disabled after first pick (`if (picked) return`). Correct springs teal+check, wrong turns coral+✕, others dim to sand/`#94A5A2`. Soft-feedback band `rise`-enters; miss reveals the answer card. Footer CTA flips idle→active.
- **Watch**: play/replay chip re-triggers `pop-in` on the demo glyph (`replayKey`).
- **Quiz CTA idle→active**: muted `#C7D0CE`/`#aab6b3` → teal `#0F6E6A`/`#0A4F4C`.
- **Results**: mount fires `celebrate()` + `setBurst`, confetti falls, Fanan celebrates, title pops.
- **Loading**: model/camera loading lives in `CameraTrainer`, not here.
- **Empty**: static centered CTA screen (Block I) — never a dead end.
- **Error / no-profile**: `<NoProfileFallback />` early-returns.
- **Reduce-motion**: freeze `float`/`pop`/`pulseRing`/confetti; keep instant state changes (HANDOFF §Motion).

---

## 6 · RTL — mirrors vs never-mirrors (this screen)

**Mirrors** (flip with `dir="rtl"` + logical props): reading order, header layout (back chip leads start-edge, streak pill trails end-edge), step-dot / progress-bar fill direction, answer-row/tile grid flow and text-align (`text-align:start`), soft-feedback band alignment, the `→`/`←` arrow on CTAs (EN "Next →" → AR "التالي ←"; back glyph `‹`→`›`), review-next chips, results column start-alignment. Numerals switch to Eastern-Arabic `٠١٢٣٤٥٦٧٨٩` and `٪` trails (use `num()`; progress counter e.g. `٣/٥`).

**Never mirrors** (physical / brand): **Fanan** (all poses — celebrate/think/wave), the **checkmark** ✓ on correct rows/results, the **play ▶ / camera / record** glyphs (watch demo play button, `play_circle` replay chip, `videocam`), the **sign-language handshapes / demo medallion glyphs** (they are physical gestures — the medallion, emoji glyphs, alphabet codes render identically both directions), status-bar time `9:41`, logos.

---

### Summary
9 layout blocks (A shell, B header/progress, C watch, D recognise, E recall, F soft-feedback, G choice-CTA, H results, I empty). 10 new i18n keys.
