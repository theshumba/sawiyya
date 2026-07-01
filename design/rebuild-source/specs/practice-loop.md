# Practice Loop — build spec (reskin)

**Screen:** the single-sign camera-graded practice loop — the core interaction.
**Design source:** `design/rebuild-source/Sawiyya Practice Loop.dc.html` (+ screenshots `*-loop.png`, `*-fanan-loop.png`, `*-live.png`, `*-ring.png`).
**Existing code (reskin these, do NOT rewrite logic):**
- `src/screens/CameraPractice.tsx` — the screen wrapper + target switcher.
- `src/components/CameraTrainer.tsx` — the grading loop (all states live here).
- `src/components/HandSkeleton.tsx` — real handshape SVG (leave as-is; recolour via `text-*` only).

The `.dc.html` is a **linear demo state-machine** (`watch → looking → detecting → correct | notquite`, plus `demo` for motion signs). The real app collapses `looking`/`detecting` into one live camera viewport with a confidence meter + hold-ring, and adds `teach` mode. Treat the design as the **visual language** for each state; keep the app's real state model. Every hex/size/copy below is lifted literally from the source.

---

## 1 · PRESERVE — functional contract (must stay wired)

### `CameraPractice.tsx`
- `const app = useApp();` — store hook. Keep.
- `const { go } = useUi();` — navigation. Keep.
- `const profile = activeProfile(app);` and `if (!profile) return <NoProfileFallback />;` — guard. Keep.
- `const lang = profile.language;` — drives EN/AR + RTL. Keep.
- `const [signId, setSignId] = useState(initialSignId ?? "alpha-alif");` — current target. Keep default + `initialSignId` prop.
- `const [burst, setBurst] = useState(0);` + `<Confetti burst={burst} />` — celebration confetti. Keep; maps to design confetti overlay.
- `const [round, setRound] = useState(0);` + `<CameraTrainer key={`${signId}-${round}`} …/>` — remount-on-change contract. **Keep the `key`** — it resets the trainer per target/round.
- `const sign = signById(signId); if (!sign) return null;` — Keep.
- `handleResult(result: "match" | "selfMark" | "skip")` — Keep the whole handler incl. `app.recordDrillResult(signId, "good", { camera, matched, selfMark })`, `celebrate()`, `setBurst`, and the `setTimeout(…, result === "match" ? 600 : 0)`.
- `choose(id)` → `setSignId(id); setRound(r => r + 1);` — target picker. Keep.
- Props of the screen: `{ initialSignId?: string }`. Keep.
- `onClick={() => go({ name: "home" })}` with `aria-label={t("back", lang)}` — the header close/back button. Keep the nav call + aria.
- Target switcher data: `GRADABLE_SIGNS = A1_SIGNS.filter(s => s.cameraGradable)`, `ALPHABET`, `isTrained(s.id)`, `<Chip selected state onClick ariaLabel>`, `pick(lang, s.glossEn, s.glossAr)`, `s.code`. Keep this data + `isTrained` state wiring; the `dir="rtl"` on the alphabet row must stay.
- `<ScreenShell lang={lang} chrome="tabs">` — shell + bottom nav. Keep.
- i18n calls used: `t("camPractice", lang)` (title), `t("back", lang)`.

### `CameraTrainer.tsx`
- Props: `{ sign: Sign; lang: Lang; onResult: (r: TrainerResult) => void; allowSkip?; autoStart?; exerciseLabel? }`. Keep signature — First Sign + lessons reuse this component.
- `type TrainerResult = "match" | "selfMark" | "skip";` — Keep.
- Constants `HOLD_FRAMES=24`, `TEACH_TARGET=24`, `UNSURE_AFTER_FRAMES=140`, `HOLD_RING_C = 2*Math.PI*36`, `DEBUG` — Keep (behavioural + the `?debug` readout).
- Recognizer/camera hooks — **all must stay wired**:
  - `modelKnows(sign.id)`, `isTrained(sign.id)` → initial `mode` (`grade`|`teach`).
  - `useHandTracker(onFrame)` → `tracker` (`.videoRef`, `.canvasRef`, `.start()`, `.stop()`, `.status`, `.handVisible`, `.fps`, `.error`).
  - `normalizeLandmarks`, `addSample`, `classifyAgainst`, `clearClass`, `flushSamples`, `sampleCount`, `userTaughtCount`, `gradeWithModel`.
  - `onFrame` grade/teach logic, refs (`consecutive`, `attemptFrames`, `frameSkip`, `finished`, `teaching`, `modeRef`, `lastConfPct`, `lastHoldPct`), `pushConfidence`/`pushHold`. **Do not touch** — visual reskin only.
  - `HOLD_FRAMES` confirm → `tracker.stop(); setMatched(true); setTimeout(() => onResult("match"), 900);`.
- State: `mode`, `teachPhase`, `captured`, `confidence`, `holdProgress`, `matched`, `showUnsure`, `dbg`. Keep.
- `startTeach()`, `finishResult(r)`, `advance`-equivalent handlers — Keep.
- Derived: `gloss = pick(lang, sign.glossEn, sign.glossAr)`, `target = sign.type === "alphabet" ? sign.code : gloss`, `meter = holdProgress > 0 ? holdProgress : confidence`. Keep.
- `referenceChip(sizeClass)` — renders `<img src="brand/stitch-34.png">` for `iloveyou`, `<HandSkeleton signId>` + gold `sign.code` for seeded alphabet, plain `sign.code`, or `<Icon name="sign_language">`. **Keep this exact branching** — it is the honest reference visual.
- Every `t(...)` call in this file MUST remain wired (reskin swaps classes/markup, not keys):
  - `t("camSign", lang)` (banner goal), `t("camResetClass", lang)` ("Teach my hand" link).
  - Meter: `t("camHold", lang)`, `t("camConfidence", lang)`, `t("camReached", lang)`.
  - Fallbacks: `t("camUnsure", lang)`, `t("camSelfMark", lang)`, `t("camSelfMarkSub", lang)`, `t("camSkip", lang)`.
  - Privacy: `t("camPrivacy", lang)` + `build ${__BUILD__}`.
  - Status pills: `t("camLoading", lang)`, `t("camHandSeen", lang)`, `t("camLooking", lang)`.
  - Idle/error: `t("camStart", lang)`, `t("camBlocked", lang)`, `t("camTryAgain", lang)`.
  - Teach: `t("camTeach", lang)`, `t("camTeachSub", lang)`, `t("camTeachHold", lang)`, `t("camTeachDone", lang)`, `t("camSamples", lang)`, `t("fsNowYou", lang)`.
  - Matched overlay: `t("camMatch", lang)`.
  - `pick(lang, "Hold steady for 2 seconds…", "ثبّت يدك ثانيتين…")`, `pick(lang, "Current Goal", "هدفك الآن")`, `pick(lang, "Follow the reference and copy the handshape.", "اتبع المرجع وقلّد شكل اليد.")`, `pick(lang, sign.hintEn, sign.hintAr)` — Keep (may be re-keyed per §4, but the call sites must render the same content).
- `liveMessage` aria-live `role="status"` region — Keep (a11y).
- Camera viewport: `<video ref={tracker.videoRef} … -scale-x-100>` + `<canvas ref={tracker.canvasRef} … -scale-x-100>`. **Keep the `-scale-x-100` (self-view mirror) and both refs.** `dir="ltr"` on the status-pill row must stay (glyphs never mirror).
- `role="progressbar"` + `aria-valuenow/min/max` on the meter — Keep.

**Nothing above may break.** The reskin is: new colours (teal `#0F6E6A`, ink `#16302E`, paper `#FBF7EF`/`#F6EFE3`, gold `#E6B24C`/`#F0C879`, coral `#E8654C`, line `#EDE3D2`), Rubik/Readex Pro type, springy hard-shadow buttons, the phase-title block, the Fanan mascot strip, and the confidence/hold visuals — all mapped onto the state blocks below.

---

## 2 · LAYOUT — target design, ordered blocks

Fonts: **Rubik** (display/UI/headings, weights 400–800), **Readex Pro** (body + all Arabic, 300–700). Mono labels use `ui-monospace, Menlo, monospace`. Phone shell in the design = bezel `#16302E`, screen `#FBF7EF`, screen radius `39px`, device radius `46px`. In-app these map to the existing `ScreenShell` + `rounded-bowl`/`rounded-3xl` viewport — lift **colours/type/spacing**, not the phone chrome.

### Block A — Status bar (design only; app uses OS bar)
Not rebuilt in-app. Reference values: height `34px`, time `9:41` Rubik 700 13px `#16302E`, notch pill `74×20 #16302E`, battery `16×9` `1.5px #16302E` border r`3px`.

### Block B — Header row
- Container: `flex none`, padding `6px 18px 10px`, `display:flex; align-items:center; gap:12px`.
- **Back button** (never-mirrors glyph): circle `34×34`, `border-radius:50%`, bg `#F6EFE3`, glyph Rubik 700 18px `#16302E` — `‹` (EN) / `›` (AR). App: existing close/back button, keep `go({name:"home"})`.
- **Step group** (flex:1):
  - Step label: Readex Pro 600 12px `#5C726F` — `Watch the sign` / `شاهد الإشارة` (steps 1 & demo) OR `Sign it back` / `أعد الإشارة` (steps 2). NEW keys `loopStepWatch`, `loopStepBack`.
  - Two progress dots, `margin-top:6px`, `gap:5px`. Active dot = `width:20px; height:6px; radius:99px; #0F6E6A`. Inactive = `6×6; radius:99px; #EDE3D2`. Step 1 → dot1 active; step 2 → dot2 active.
- **Streak pill**: `bg:#F6EFE3; radius:99px; padding:5px 10px; gap:5px`. Dot `14×14 radius:50% #E8654C` + count Rubik 700 13px `#16302E` (design shows `7`). App: reuse existing XP/streak source.

### Block C — Body title (animation `rise .3s ease both`)
- Main title: Rubik 800 26px/1.05 `#16302E`, `letter-spacing:-.01em`. Content per state:
  - watch/demo → sign name (`Alif`/`ألف`, `I love you`/`أحبّك`, `Hello`/`مرحبًا`) = `target`/`gloss`.
  - looking → `Looking for your hand…` / `نبحث عن يدك…` (NEW `loopLooking`).
  - detecting → `Hold it steady…` / `اثبت قليلًا…` (reuse `camHold` EN; AR verbatim differs — see §4 `loopDetecting`).
  - correct → `Beautiful!` / `رائع!` (NEW `loopCorrectTitle`).
  - notquite → `Almost!` / `اقتربت!` (NEW `loopNotquiteTitle`).
- Sub: Readex Pro 500 13px/1.35 `#5C726F`, `margin-top:4px`. Content:
  - watch/demo → kind label (`Arabic letter · static handshape`, `Word · static handshape`, `Word · motion sign` / AR equivalents — NEW kind keys §4).
  - looking → `Hold your hand inside the frame` / `ضع يدك داخل الإطار` (NEW `loopLookingSub`).
  - detecting → the sign name.
  - correct → `Your handshape matched.` / `تطابقت إشارتك.` (NEW `loopCorrectSub`).
  - notquite → `So close — one tiny fix:` / `تعديل بسيط:` (NEW `loopNotquiteSub`).

### Block D — Stage (state-specific media). One media surface, swapped by phase.

**D-watch** (Fanan pose `think`): rounded `24px`, height `196px`, teal diagonal stripe bg `repeating-linear-gradient(135deg,#0F6E6A,#0F6E6A 15px,#12817b 15px,#12817b 30px)`, centred.
- Corner cap (top-left `11px`): mono 700 9px `rgba(255,255,255,.85)` on `rgba(0,0,0,.28)`, pad `5px 9px` r`8px`, text `● SIGNER DEMO` / `● عرض المُشِير` (NEW `loopSignerCap`).
- Center disc `126×126 radius:50% #FBF7EF`, glyph 66px (the sign glyph/emoji), shadow `0 12px 30px rgba(0,0,0,.24)`.
- Play FAB bottom-right `11px`: `40×40 radius:50% #E6B24C`, glyph `▶` 15px `#16302E`, hard shadow `0 5px 0 #C89A3D` (**never mirrors**).
- App mapping: the "Watch" media = the signer demo; in-app the reference lives in `referenceChip` — reuse that + this teal stage treatment.

**D-hint card** (below D-watch): `margin-top:13px`, bg `#F6EFE3`, border `1px solid #EDE3D2`, radius `16px`, pad `12px 13px`, `flex; gap:10px; align-items:flex-start`.
- Badge tile `24×24 radius:8px #E6B24C`, `!` Rubik 800 13px `#16302E`.
- Label: mono 700 10px `.08em` uppercase `#C89A3D` — `Hint` / `تلميح` (NEW `loopHintLbl`), `margin-bottom:4px`.
- Body: Readex Pro 400 12.5px/1.4 `#16302E` — `sign.hintEn`/`sign.hintAr`.

**D-looking** (Fanan pose `idle`): rounded `24px`, height `238px`, ink diagonal stripe `repeating-linear-gradient(135deg,#16302E,#16302E 15px,#1d3d3a 15px,#1d3d3a 30px)`.
- Camera cap top-left: mono 700 9px `rgba(255,255,255,.7)` on `rgba(0,0,0,.3)` — `YOUR CAMERA` / `كاميرتك` (NEW `loopCameraCap`).
- Dashed target frame centred: `132×158`, `3px dashed rgba(240,200,121,.7)`, radius `34px`.
- Scan line: full-width `3px`, `linear-gradient(90deg,transparent,#F0C879,transparent)`, r`99px`, `animation:scan 1.4s ease-in-out infinite alternate`.
- Privacy pill bottom-centre: bg `rgba(15,110,106,.94)`, `#FBF7EF`, Readex 600 10px, pad `6px 12px` r`99px`, shadow `0 6px 16px rgba(0,0,0,.3)`, leading dot `7×7 radius:50% #7BE0A0` + `box-shadow:0 0 0 3px rgba(123,224,160,.3)`, text `100% on your device · nothing leaves your phone` / `١٠٠٪ على جهازك · لا شيء يغادر هاتفك` (NEW `loopPrivacy` — differs from `camPrivacy`).
- App mapping: this is `tracker.status running && !handVisible`. Keep `<video>`/`<canvas>` feed; overlay the dashed frame + scan line + privacy pill.

**D-detecting** (Fanan pose `idle`): same ink stripe bg, height `194px`, same camera cap + privacy pill.
- Gold hand-skeleton overlay: dots `11×11 radius:50% #F0C879` (5 knuckles) + wrist node `16×16 #F0C879` glow `box-shadow:0 0 12px #E6B24C`; bones `3px` `rgba(240,200,121,.6)`. **In-app this is the live `HandSkeleton`/landmark canvas — keep it, recolour to gold.** Never mirrors.
- **Accuracy meter** (below stage, `margin-top:14px`): row of label + value `justify-between`, Readex 600 11px `#5C726F` — label `Accuracy` / `الدقة` (reuse `accuracy`), value `#0F6E6A` 700 (e.g. `84%` / `٨٤٪`). Track `height:13px radius:99px #EDE3D2`; fill `linear-gradient(90deg,#F0C879,#E6B24C)` r`99px` `transition:width .09s linear`, width = `meterPct`. App: the existing `role="progressbar"` meter — recolour track `#EDE3D2`, fill gold gradient; keep `meter` value + aria. Existing label uses `camConfidence`/`camHold`; keep those, this design's `Accuracy` maps to the `camConfidence` idle label context.

**D-correct** (Fanan pose `celebrate`; confetti overlay active): `margin-top:20px`, `flex column; align-items:center; gap:16px`.
- Check medallion `104×104 radius:50% #0F6E6A`, `animation: pop .4s cubic-bezier(.2,1.4,.5,1) both, pulseRing 1.6s ease-out .4s infinite`, shadow `0 10px 26px rgba(15,110,106,.35)`. Check = CSS L-shape: `44×24`, `border-left:7px solid #FBF7EF; border-bottom:7px solid #FBF7EF; transform:rotate(-45deg) translateY(-4px); border-radius:2px`. **Checkmark never mirrors.** App: existing matched overlay (`check_circle` icon) — restyle to this teal medallion + pulse-ring.
- Stats row (`animation:rise .4s ease .15s both`, `gap:11px`):
  - Accuracy tile: bg `#F6EFE3` border `1px #EDE3D2` r`15px` pad `11px 16px` center. Value Rubik 800 24px `#0F6E6A` (e.g. `92%`/`٩٢٪`); label Readex 600 10px `#5C726F` uppercase `.06em` — `Accuracy` / `الدقة` (reuse `accuracy`).
  - XP tile: bg `#E8654C` r`15px` pad `11px 16px`, hard shadow `0 4px 0 #C54F3A`. Value Rubik 800 24px `#FBF7EF` (e.g. `+15`/`+١٥`); label Readex 600 10px `rgba(251,247,239,.85)` uppercase — `XP` / `نقاط` (NEW `loopXpLbl`; existing `xp` AR is `نقطة`).

**D-notquite** (Fanan pose `sad`): `margin-top:16px`, `flex column; align-items:center; gap:14px`.
- Retry medallion `96×96 radius:50% #F6EFE3`, `border:3px solid #F08A75`, `animation:pop .4s cubic-bezier(.2,1.4,.5,1) both`; glyph `↻` Rubik 800 42px `#E8654C`.
- Fix card (`width:100%`, bg `#FBF7EF`, `border:1px dashed #F08A75`, r`16px`, pad `13px`, `animation:rise .4s ease .1s both`): label mono 700 10px `.08em` uppercase `#C54F3A` = `Hint`/`تلميح` (`loopHintLbl`); body Readex 400 13px/1.45 `#16302E` = the sign hint. App: this maps to the `showUnsure` band + `camUnsure` — restyle to this dashed coral card.

**D-demo** (motion signs e.g. Hello; Fanan pose `wave`): teal stripe stage height `184px`, corner `● SIGNER DEMO`/`● عرض المُشِير`, centred disc `112×112 #FBF7EF` glyph 60px `animation:float 2.4s`.
- Demo badge bottom-centre: bg `#E6B24C` `#16302E` Rubik 700 11px pad `7px 13px` r`99px`, hard shadow `0 4px 0 #C89A3D`, text `◐ Watch & practise` / `◐ شاهد وتمرّن` (NEW `loopDemoBadge`).
- Demo note card below: bg `#F6EFE3` border `1px #EDE3D2` r`16px` pad `12px 13px`, Readex 400 12.5px/1.45 `#16302E` — `This is a motion sign — live grading is coming soon. For now, watch closely and practise along with the demo.` / `هذه إشارة حركية — التقييم المباشر قريبًا. شاهد جيدًا وتمرّن مع العرض الآن.` (NEW `loopDemoNote`).

### Block E — Mascot strip (all states; `margin-top:auto`, pad `12px 0 8px`, `flex; align-items:flex-end; gap:11px`)
- **Fanan** avatar `66×66` box, `<dc-import name="Fanan" pose="{{pose}}" scale="0.55">`. Pose by phase: watch→`think`, looking/detecting→`idle`, correct→`celebrate`, notquite→`sad`, demo→`wave`. **Fanan never mirrors.**
- Speech bubble: bg `#F6EFE3`, border `1px #EDE3D2`, radius `14px 14px 14px 3px` (tail toward Fanan — mirror the corner in RTL to `14px 14px 3px 14px`), pad `9px 12px`, Readex 500 12px/1.3 `#16302E`. Line per phase (NEW `loopLine*`): watch `Watch me first!`/`شاهدني أولًا!`, looking `Show me your hand`/`أرني يدك`, detecting `Ooh, nice…`/`جميل…`, correct `That's it!`/`أحسنت!`, notquite `So close — again!`/`اقتربت — مجددًا!`, demo `Wave with me!`/`لوّح معي!`.

### Block F — Footer
- **CTA button** (shown in watch/correct/notquite/demo; NOT in looking/detecting): full-width, `height:54px`, Rubik 700 16px, radius `17px`, spring hard shadow `box-shadow:0 5px 0 <shadow>`, `transition:all .08s`, on press `translateY(4px); box-shadow:0 1px 0 <shadow>`. Variants:
  - watch → bg `#E8654C`, text `#FBF7EF`, shadow `#C54F3A`, label `I'll try it →` / `سأجرّبها ←` (NEW `loopWatchCta`).
  - correct → bg `#0F6E6A`, text `#FBF7EF`, shadow `#0A4F4C`, label `Continue →` / `متابعة ←` (reuse `lsContinue` + arrow glyph; arrow mirrors).
  - notquite → bg `#E8654C`, text `#FBF7EF`, shadow `#C54F3A`, label `Try again` / `حاول مجددًا` (reuse `camTryAgain`).
  - demo → bg `#E6B24C`, text `#16302E`, shadow `#C89A3D`, label `Mark as practised ✓` / `تم التمرّن ✓` (NEW `loopMarkPractised`). Checkmark never mirrors.
- App mapping: CTAs drive `advance()`≈`onResult`. In-app the primary action while camera runs is signing (no CTA) + the ghost `camSelfMark` fallback; keep those. The design's watch→try CTA = "start camera".
- **Camera footnote** (shown only in looking/detecting, replaces CTA): pad `12px 18px 20px`, centred `gap:8px`. Coral dot `11×11 radius:50% #E8654C` `animation:ping 1.1s ease-out infinite` + Readex 600 12px `#5C726F` text = `Detecting your sign…`/`نكتشف إشارتك…` (looking, NEW `loopFootLooking`) or `Reading handshape…`/`نقرأ الإشارة…` (detecting, NEW `loopFootDetecting`).

### Block G — Confetti overlay (correct only)
Absolute inset over the phone, `overflow:hidden`, radius matches shell. 36 pieces, colours cycle `#0F6E6A,#E8654C,#E6B24C,#F0C879,#F08A75`, size `6–14px` (height ×0.66), random `border-radius:2px|50%`, random rotation, `animation:confettiFall 1.2–2.1s <delay> ease-in forwards`. **Reuse existing `<Confetti>`/`celebrate()` — do not rebuild.**

### Target switcher (screen-level, above the trainer — from `CameraPractice.tsx`)
Design "control bar" is a dev harness, but the in-app switcher maps to it visually:
- Section label: mono 600 10px `.1em` uppercase `#5C726F` — `Sign` (reuse copy from existing header, no new key needed; keep current markup).
- Active chip: bg `#0F6E6A`, radius `14px`, pad `10px 13px`, label Rubik 700 15px `#FBF7EF`, sub (AR name) Readex 500 13px `rgba(251,247,239,.82)` `direction:rtl`, badge mono 700 8px uppercase `#F0C879`, hard shadow `0 4px 0 #0A4F4C`.
- Idle chip: bg `#FBF7EF`, `box-shadow:inset 0 0 0 1px #EDE3D2`, label `#16302E`, sub `#5C726F`, badge `#0F6E6A`.
- Keep existing `Chip` component + `trained`/`idle`/`selected` states + scroll-edge fades (`from-sand`); apply these hexes via the reskinned token classes.

---

## 3 · COPY table (every visible string)

| i18n key | English | Arabic (verbatim) | Notes |
|---|---|---|---|
| `loopStepWatch` (new) | Watch the sign | شاهد الإشارة | header step label (step 1/demo) |
| `loopStepBack` (new) | Sign it back | أعد الإشارة | header step label (step 2) |
| `loopLooking` (new) | Looking for your hand… | نبحث عن يدك… | title, looking |
| `loopLookingSub` (new) | Hold your hand inside the frame | ضع يدك داخل الإطار | sub, looking |
| `camHold` (reuse) | Hold it steady… | ثبّت يدك… | title, detecting — EN matches design; AR variant `loopDetecting` if verbatim needed |
| `loopDetecting` (new, optional) | Hold it steady… | اثبت قليلًا… | design's verbatim AR for detecting title |
| `accuracy` (reuse) | Accuracy | الدقة | meter + correct tile label — exact match |
| `loopCorrectTitle` (new) | Beautiful! | رائع! | title, correct |
| `loopCorrectSub` (new) | Your handshape matched. | تطابقت إشارتك. | sub, correct |
| `loopXpLbl` (new) | XP | نقاط | correct XP tile (existing `xp` AR = نقطة) |
| `lsContinue` (reuse) | Continue | متابعة | correct CTA (append `→`/`←` glyph in JSX) |
| `loopNotquiteTitle` (new) | Almost! | اقتربت! | title, notquite |
| `loopNotquiteSub` (new) | So close — one tiny fix: | تعديل بسيط: | sub, notquite |
| `camTryAgain` (reuse) | Try again | حاول مجددًا | notquite CTA — exact match |
| `loopHintLbl` (new) | Hint | تلميح | hint card + fix card label |
| `loopSignerCap` (new) | SIGNER DEMO | عرض المُشِير | watch/demo corner cap (prefix `●` in JSX) |
| `loopCameraCap` (new) | YOUR CAMERA | كاميرتك | looking/detecting corner cap |
| `loopPrivacy` (new) | 100% on your device · nothing leaves your phone | ١٠٠٪ على جهازك · لا شيء يغادر هاتفك | privacy pill (differs from `camPrivacy`) |
| `loopDemoBadge` (new) | Watch & practise | شاهد وتمرّن | demo badge (prefix `◐` in JSX) |
| `loopDemoNote` (new) | This is a motion sign — live grading is coming soon. For now, watch closely and practise along with the demo. | هذه إشارة حركية — التقييم المباشر قريبًا. شاهد جيدًا وتمرّن مع العرض الآن. | demo note card |
| `loopWatchCta` (new) | I'll try it → | سأجرّبها ← | watch CTA |
| `loopMarkPractised` (new) | Mark as practised ✓ | تم التمرّن ✓ | demo CTA |
| `loopFootLooking` (new) | Detecting your sign… | نكتشف إشارتك… | footer note, looking |
| `loopFootDetecting` (new) | Reading handshape… | نقرأ الإشارة… | footer note, detecting |
| `loopLineWatch` (new) | Watch me first! | شاهدني أولًا! | Fanan bubble, watch |
| `loopLineLooking` (new) | Show me your hand | أرني يدك | Fanan bubble, looking |
| `loopLineDetecting` (new) | Ooh, nice… | جميل… | Fanan bubble, detecting |
| `loopLineCorrect` (new) | That's it! | أحسنت! | Fanan bubble, correct |
| `loopLineNotquite` (new) | So close — again! | اقتربت — مجددًا! | Fanan bubble, notquite |
| `loopLineDemo` (new) | Wave with me! | لوّح معي! | Fanan bubble, demo |
| `loopKindLetter` (new) | Arabic letter · static handshape | حرف عربي · إشارة ثابتة | kind label (alphabet) |
| `loopKindWordStatic` (new) | Word · static handshape | كلمة · إشارة ثابتة | kind label (gradable word) |
| `loopKindWordMotion` (new) | Word · motion sign | كلمة · إشارة حركية | kind label (motion word) |
| — (content) | Alif / I love you / Hello | ألف / أحبّك / مرحبًا | from `sign.glossEn`/`glossAr` + `sign.code` |
| — (content) | hint text | hint text | from `sign.hintEn`/`sign.hintAr` |
| `camPractice` (reuse) | Practise the alphabet | تدرّب على الحروف | screen title |
| `back` (reuse) | Back | رجوع | back button aria |

Also still rendered by the trainer in real states (keep): `camSign`, `camConfidence`, `camReached`, `camUnsure`, `camSelfMark`, `camSelfMarkSub`, `camSkip`, `camPrivacy`, `camLoading`, `camHandSeen`, `camLooking`, `camStart`, `camBlocked`, `camMatch`, `camTeach*`, `camSamples`, `camResetClass`, `fsNowYou`.

---

## 4 · NEW-I18N (append to `src/i18n.ts` `dict`)

```ts
  // practice loop (reskin)
  loopStepWatch: { en: "Watch the sign", ar: "شاهد الإشارة" },
  loopStepBack: { en: "Sign it back", ar: "أعد الإشارة" },
  loopLooking: { en: "Looking for your hand…", ar: "نبحث عن يدك…" },
  loopLookingSub: { en: "Hold your hand inside the frame", ar: "ضع يدك داخل الإطار" },
  loopDetecting: { en: "Hold it steady…", ar: "اثبت قليلًا…" },
  loopCorrectTitle: { en: "Beautiful!", ar: "رائع!" },
  loopCorrectSub: { en: "Your handshape matched.", ar: "تطابقت إشارتك." },
  loopXpLbl: { en: "XP", ar: "نقاط" },
  loopNotquiteTitle: { en: "Almost!", ar: "اقتربت!" },
  loopNotquiteSub: { en: "So close — one tiny fix:", ar: "تعديل بسيط:" },
  loopHintLbl: { en: "Hint", ar: "تلميح" },
  loopSignerCap: { en: "SIGNER DEMO", ar: "عرض المُشِير" },
  loopCameraCap: { en: "YOUR CAMERA", ar: "كاميرتك" },
  loopPrivacy: { en: "100% on your device · nothing leaves your phone", ar: "١٠٠٪ على جهازك · لا شيء يغادر هاتفك" },
  loopDemoBadge: { en: "Watch & practise", ar: "شاهد وتمرّن" },
  loopDemoNote: { en: "This is a motion sign — live grading is coming soon. For now, watch closely and practise along with the demo.", ar: "هذه إشارة حركية — التقييم المباشر قريبًا. شاهد جيدًا وتمرّن مع العرض الآن." },
  loopWatchCta: { en: "I'll try it →", ar: "سأجرّبها ←" },
  loopMarkPractised: { en: "Mark as practised ✓", ar: "تم التمرّن ✓" },
  loopFootLooking: { en: "Detecting your sign…", ar: "نكتشف إشارتك…" },
  loopFootDetecting: { en: "Reading handshape…", ar: "نقرأ الإشارة…" },
  loopLineWatch: { en: "Watch me first!", ar: "شاهدني أولًا!" },
  loopLineLooking: { en: "Show me your hand", ar: "أرني يدك" },
  loopLineDetecting: { en: "Ooh, nice…", ar: "جميل…" },
  loopLineCorrect: { en: "That's it!", ar: "أحسنت!" },
  loopLineNotquite: { en: "So close — again!", ar: "اقتربت — مجددًا!" },
  loopLineDemo: { en: "Wave with me!", ar: "لوّح معي!" },
  loopKindLetter: { en: "Arabic letter · static handshape", ar: "حرف عربي · إشارة ثابتة" },
  loopKindWordStatic: { en: "Word · static handshape", ar: "كلمة · إشارة ثابتة" },
  loopKindWordMotion: { en: "Word · motion sign", ar: "كلمة · إشارة حركية" },
```

Reused (do NOT re-add): `accuracy`, `camHold`, `camTryAgain`, `lsContinue`, `camPractice`, `back`, plus all `cam*`/`fs*` calls in the trainer.

---

## 5 · MOTION / STATES

Keyframes (lift literally):
- `float` 3–3.4s ease-in-out infinite — Fanan bob + demo disc `translateY(-7px)`.
- `pop` `.5→1.12→1`, `cubic-bezier(.2,1.4,.5,1) both`, `.4s` — correct/notquite medallions, chip pop-in.
- `rise` `translateY(14px→0)+opacity`, `.3–.4s` — titles + correct stats card enter.
- `pulseRing` `box-shadow 0→18px rgba(230,178,76,.55)→0`, `1.6s ease-out .4s infinite` — gold ring around correct check.
- `ping` scale `.9→1.25` opacity fade, `1.1s ease-out infinite` — footer live dot.
- `confettiFall` `translateY(420px) rotate(540deg)`, `1.2–2.1s ease-in forwards` — celebration.
- `scan` `top 12%→82%`, `1.4s ease-in-out infinite alternate` — looking scan line.
- Spring button: press `translateY(4px)` + shadow `0 5px 0` → `0 1px 0`, `transition:all .08s`.
- Meter fill `transition:width .09s linear` (design) — app keeps `duration-300`; use `.09s linear` per design during ramp.
- HANDOFF motion: Spring-out `cubic-bezier(.34,1.56,.64,1)` 260ms; Ease-out enter `0,0,.2,1` 240ms.

States in the design (map to real trainer states):
- **watch** → reference/demo shown, `think` pose, CTA "I'll try it". App = pre-start / idle with `camStart`.
- **looking** → camera live, hand not yet found (`tracker.handVisible === false`): dashed frame + scan + `camLooking` pill + footer live dot. No CTA.
- **detecting** → hand found, meter ramping (`confidence`/`holdProgress`): gold skeleton + accuracy meter + hold-ring + footer `Reading handshape…`.
- **correct** (`matched`) → check medallion + pulse-ring + stats (accuracy+XP) + confetti + `celebrate()`/haptic; CTA Continue. Never hard-fails.
- **notquite** (`showUnsure`) → coral retry medallion + dashed hint card + `camUnsure`; CTA Try again. Gentle, retry.
- **demo** (motion signs, `!sign.cameraGradable`) → teal demo stage + `◐ Watch & practise` badge + demo note; CTA "Mark as practised". No live grade.
- **loading** → `camLoading` pill ("Loading model…"), spinner-equivalent.
- **idle** → existing start overlay (`videocam` + `camStart` + `camPrivacy`). Keep.
- **error / blocked** → existing `videocam_off` + `camBlocked` + `camTryAgain`. Keep. (Not styled in this design file; use existing.)
- **teach** (intro/capturing/done) → not in this design file; keep existing teach overlay styling, recoloured to loop tokens (`#16302E`/gold).
- Reduce-motion: freeze `float`/`pulseRing`/`confetti`/`scan`; keep instant state changes + meter (per HANDOFF).

---

## 6 · RTL

- **Mirrors:** reading flow, header order (back button leads on the start edge), step dots order, progress-meter fill direction, the CTA arrow glyph (`→` EN → `←` AR), speech-bubble tail corner (`14 14 14 3` LTR → `14 14 3 14` RTL), scroll direction of the target switcher, tab/DOM order via `dir="rtl"`.
- **Never mirrors:** status-bar time (`9:41`), the play `▶` FAB, the camera feed self-view (`-scale-x-100` stays — it is the mirror, not an RTL flip), the correct **checkmark** L-shape, the `↺`/`↻` retry glyph reads either way but keep upright, **Fanan** (all poses), the gold **hand-skeleton / landmark overlay** and `HandSkeleton` reference (physical handshapes), any logo/brand glyph.
- Keep `dir="ltr"` on the status-pill row inside the camera viewport (existing code) so glyph pills don't reorder.
- Arabic numerals: Eastern-Arabic `٠١٢٣٤٥٦٧٨٩`, percent `٪` trailing (e.g. `٨٤٪`, `+١٥`). App already has `num(n, lang)` — use it for the meter %, accuracy, and XP values.
- Arabic type: Readex Pro, +0.15 line-height vs Latin at each step.
```
