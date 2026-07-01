# Reskin spec — Settings + Info pages (profile / settings / a11y / AI / privacy / about)

Source design: `design/rebuild-source/Sawiyya Settings.dc.html`
Screenshots: `01-set.png` (Settings list EN+AR), `02/03-set.png` (Accessibility EN+AR), `04-set.png` (How the AI works EN+AR).
Existing code to preserve: `src/screens/Settings.tsx`, `src/screens/InfoPages.tsx` (`AiTransparency`, `Privacy`).

The design shows FIVE sub-screens (profile, settings, a11y, ai, about). The live app currently implements three routed screens that this reskin restyles:
- `settings` → `Settings.tsx` (maps to design **settings** list + parts of **a11y**/**profile**/**about**).
- `aiTransparency` → `InfoPages.tsx::AiTransparency` (maps to design **ai** "How the AI works").
- `privacy` → `InfoPages.tsx::Privacy` (design has no dedicated privacy panel — keep the existing card structure, apply the tokens below).

**IMPORTANT:** This is a visual reskin. Apply the design's tokens/layout to the existing screens. Do NOT delete functionality that the design happens not to show (name field, hand cards, goal list, camera-permission row, reset-training, erase-everything, dev-metrics egg). Where the design shows features the store does not yet back (profile stats/badges, live a11y toggles for motion/sound/haptics/contrast), treat them as **visual reference only** — do not fabricate store state; keep them out unless a real selector exists.

---

## 1 · PRESERVE — functional contract (must stay wired)

### Settings.tsx
- `const app = useApp();` — store hook. Keep.
- `const { go } = useUi();` — navigation. Keep.
- `const profile = activeProfile(app);` and `if (!profile) return <NoProfileFallback />;` — no-profile guard. Keep.
- `const lang = profile.language;` — drives LTR/RTL + `pick`. Keep.
- `const [camState, setCamState] = useState<string | null>(null);` + the `useEffect` calling `navigator.permissions?.query({ name: "camera" })` — live camera-permission probe. Keep exactly.
- `const [resetMsg, setResetMsg] = useState<string | null>(null);` — reset toast. Keep.
- `const taps = useRef(0);` — 5-tap dev-metrics counter. Keep.
- `const set = (patch) => app.updateProfile(profile.id, patch);` — profile writer. Keep; wired to `language`, `dominantHand`, `dailyGoal`, `displayName`.
- `resetTraining()` — calls `trainedClassIds()` + `clearClass(id)` from `../recognizer/knn`, `window.confirm(pick(...))` guard, sets `resetMsg`. Keep the recognizer wiring intact.
- `bump()` — increments `taps.current`, at `>=5` calls `go({ name: "devMetrics" })`. Keep the 5-tap easter egg.
- Navigation calls to preserve verbatim: `go({ name: "home" })` (shell close), `go({ name: "family" })` (×2 — Manage learners / Manage profiles), `go({ name: "camera" })` (permission CTA), `go({ name: "aiTransparency" })`, `go({ name: "privacy" })` (×2), `go({ name: "allSigns" })`, `go({ name: "devMetrics" })`.
- Controls to keep functional: `NameField` (`value={profile.displayName}`, `onChange={set({displayName})}`), `LanguageToggle` (`onClick={set({language:o.v})}`, `aria-pressed`), `HandCards` (`onClick={set({dominantHand:o.v})}`, `aria-pressed`, `o.flip` scale-x mirror), `GoalList` (`onClick={set({dailyGoal:o.v})}`).
- i18n calls to keep: `t("setTitle","en")`, `t("setTitle","ar")`, `t("setProfiles", lang)`, `t("setCameraPermission", lang)`, `t("setGranted", lang)`, `t("setNotGranted", lang)`, `t("setAi", lang)`, `t("setPrivacy", lang)`. Plus every inline `pick(lang, en, ar)`: "Account/الحساب", "Preferences/التفضيلات", "Language/اللغة", "Signing hand/يد الإشارة", "Daily goal/الهدف اليومي", "Your name/اسمك", placeholder "Hamad Al-Thani/حمد آل ثاني", "Camera & privacy/الكاميرا والخصوصية", the camera body copy, Pro-tip copy, "Reset camera training/إعادة ضبط الكاميرا", the reset confirm string, `Cleared ${ids.length}…`, "About/حول", "Manage profiles/إدارة الملفات", "Signs dictionary/قاموس الإشارات", "Privacy policy/سياسة الخصوصية", the version block ("Sawiyya · v1.0 · سويّة" / "Together as Equals/معاً على قدم المساواة" / "© 2024 Sawiyya · Mada Innovation").
- Wrapper contract: `<ScreenShell lang={lang} chrome="takeover" title={…} onClose={() => go({name:"home"})}>` — keep. Shell owns the nav/close; do NOT add a self-hosted status bar/back button.
- `Group`, `Row`, `LinkRow` local components — may be restyled but keep their props (`icon`, `title`, `tone`, `label`, `onClick`, `children`) so call sites don't change. `LinkRow` chevron uses `rtl:rotate-180` + hover translate — keep the RTL flip.
- Reset-toast a11y: `role="status" aria-live="polite"` on the `resetMsg` node — keep.

### InfoPages.tsx — AiTransparency
- `useApp()`, `useUi().go`, `activeProfile(app)`, `if (!profile) return null;`, `lang = profile.language`, `T = (en,ar)=>pick(lang,en,ar)` — keep.
- The 4 `cards[]` + `proudCard` objects with `img` paths (`/brand/stitch-21.png`, `-02`, `-09`, `-28`, `-19`) and every `T(...)` bilingual string — keep verbatim (these are the responsible-AI copy; do not shorten).
- `<ScreenShell lang chrome="takeover" title={T("How the AI works", "كيف يعمل الذكاء الاصطناعي")} onClose={() => go({name:"settings"})}>` — keep.
- Primary CTA `go({ name: "camera" })` ("Let's Practice Together") and secondary `go({ name: "privacy" })` ("Read the privacy promise") — keep both nav targets.
- `AiCard` props (`img,title,subtitle,body`) and `motion-safe:animate-pop-in` — keep.

### InfoPages.tsx — Privacy
- `useApp()`, `useUi().go`, profile guard, `lang`, `T` — keep.
- `eraseEverything()` — `window.confirm(T(...))` guard then `localStorage.clear()` + `window.location.reload()`. This is the ONE destructive control — keep intact.
- `<ScreenShell … title={T("Privacy","الخصوصية")} onClose={() => go({name:"settings"})}>` — keep.
- Card structure + all `T(...)` copy, `StorageRow` (`index,label,detail,tone`), `PrivacyCard` (`icon,iconTone`), image `/brand/stitch-14.png`, secondary `go({name:"aiTransparency"})` link — keep.

---

## 2 · LAYOUT — target design blocks (apply these exact values)

Global surface tokens (lift exactly):
- Behind-app canvas `#F1E7D6`; phone screen bg `#F6EFE3`; elevated card `#FBF7EF`; hairline/border `#EDE3D2`; in-card row divider `#F1E7D6`.
- Text: deep `#16302E`, sub `#5C726F`, mute `#94A5A2`.
- Accents: teal `#0F6E6A` (deep-shadow `#0A4F4C`), gold-mid `#E6B24C` (shadow `#C89A3D`), gold-light `#F0C879`, coral `#E8654C`, success `#1F8A5B`, chevron grey `#C7D0CE`.
- Fonts: Latin = Rubik (400–800); Arabic + body = Readex Pro (300–700); mono eyebrow = `ui-monospace,Menlo` 10–12px, `letter-spacing:.1em`, uppercase.
- Radii: cards `16–18px`, inner tiles `9–16px`, pills `99px`. Card elevation `box-shadow:0 2px 0 #EDE3D2`. Content scroll padding `6px 22px 20px`.

Map ScreenShell to the phone frame implicitly — do not rebuild the `9:41`/notch/battery status bar (that is design-doc chrome, not app UI).

### Block list

**Screen A — SETTINGS list** (`Settings.tsx` primary layout) — screenshot 01
1. **Screen title** — `font:800 26px/1.1 Rubik; color:#16302E; margin-bottom:14px`. Copy: "Settings" / "الإعدادات" (reuse `setTitle`).
2. **Grouped section (repeat per group)** — each group is:
   - Group eyebrow: `font:700 10px/1 ui-monospace,Menlo; letter-spacing:.1em; text-transform:uppercase; color:#94A5A2; margin:16px 0 8px`. Labels: ACCOUNT/الحساب, LEARNING/التعلّم, APP/التطبيق, PRIVACY/الخصوصية.
   - Group card: `background:#FBF7EF; border:1px solid #EDE3D2; border-radius:16px; overflow:hidden`.
   - Row (repeat): `display:flex; align-items:center; gap:12px; padding:13px 14px; border-bottom:1px solid #F1E7D6`. Contents in order: colour icon chip `30×30px, border-radius:9px, flex:none, background:<row colour>`; label `flex:1; font:600 14px/1.2 'Readex Pro'; color:#16302E`; optional value `font:500 12px 'Readex Pro'; color:#94A5A2`; chevron `font:700 16px Rubik; color:#C7D0CE` (`›` LTR / `‹` RTL).
   - Row colours + values from design (retain existing routes): Account → "Profile & family/الملف والعائلة" chip `#E6B24C` (→ existing NameField/`family`), "Manage learners/إدارة المتعلّمين" value "4/٤" chip `#0F6E6A` (→ `family`). Learning → "Daily goal/الهدف اليومي" value "Regular/منتظم" chip `#E8654C`, "Notifications/التنبيهات" value "On/مُفعّل" chip `#E6B24C`. App → "Language & accessibility/اللغة وسهولة الوصول" chip `#0F6E6A`, "Sound & haptics/الصوت والاهتزاز" chip `#C89A3D`. Privacy → "How the AI works/كيف يعمل الذكاء" chip `#0F6E6A` (→ `aiTransparency`), "Your data/بياناتك" chip `#5C726F` (→ `privacy`).
   - **Reconciliation note:** the live Settings owns richer controls (name input, language/hand/goal pickers, live camera-permission row, reset-training danger button, version+dev-metrics egg). Keep those, restyled into this paper-card idiom: use the same card/row tokens; keep the danger controls but tint with coral (`#E8654C`) on a `#FBF7EF` card. Do not drop them to match the simpler mock.

**Screen B — ACCESSIBILITY panel** (design reference for the a11y controls) — screenshots 02/03
3. **A11y title + body** — title `font:800 25px/1.1 Rubik; color:#16302E`; body `font:400 13px/1.35 'Readex Pro'; color:#5C726F; margin-top:3px`. Copy: "Language & access" / "اللغة وسهولة الوصول"; body "Make Sawiyya comfortable for you." / "اجعل سويّة مريحة لك."
4. **Text-size card** — `background:#FBF7EF; border:1px solid #EDE3D2; border-radius:16px; padding:16px; margin-top:16px`. Label "Text size/حجم النص" `font:600 13px/1 'Readex Pro'; color:#16302E; margin-bottom:12px`. Slider row: small "A" `font:700 14px Rubik; color:#5C726F`; track `flex:1; height:6px; border-radius:99px; background:#EDE3D2`; knob `22×22px; border-radius:50%; background:#0F6E6A; box-shadow:0 2px 6px rgba(0,0,0,.2)` positioned `left:15% | 50% | 85%` for size 0/1/2; large "A" `font:800 22px Rubik; color:#16302E`.
5. **Toggle list card** — `background:#FBF7EF; border:1px solid #EDE3D2; border-radius:16px; overflow:hidden; margin-top:12px`. Each toggle is a full-width `button` `padding:14px; border-bottom:1px solid #F1E7D6; background:none; text-align:start; display:flex; align-items:center; gap:12px`. Left: label `font:600 14px/1.2 'Readex Pro'; color:#16302E` + hint `font:400 11px/1.3 'Readex Pro'; color:#94A5A2; margin-top:2px`. Right: track `46×27px; border-radius:99px; background:#0F6E6A` (on) / `#D6CDBB` (off); knob `21×21px; border-radius:50%; background:#FBF7EF; box-shadow:0 1px 3px rgba(0,0,0,.25); position:absolute; top:3px; inset-inline-start:22px` (on) / `3px` (off). Rows: Reduced motion/تقليل الحركة (Calms animations/يهدّئ الرسوم), Sound effects/المؤثرات الصوتية (Chimes & cheers/أنغام وتشجيع), Haptics/الاهتزاز (Gentle taps/نقرات لطيفة), High contrast/تباين عالٍ (Bolder colours/ألوان أوضح). **Only wire toggles that a real store selector backs; otherwise keep this as visual reference and do not add fake state.**

**Screen C — HOW THE AI WORKS** (`AiTransparency` — align to this design) — screenshot 04
6. **Title + body** — title `font:800 25px/1.1 Rubik; color:#16302E`; body `font:400 13px/1.4 'Readex Pro'; color:#5C726F; margin-top:4px`. Copy: "How the AI works" / "كيف يعمل الذكاء"; body "Sawiyya grades your signs with a model that runs entirely on your phone." / "تقيّم سويّة إشاراتك بنموذج يعمل بالكامل على هاتفك." (Existing screen uses richer "Mada Award / Built for your family" hero — keep the existing intro copy but adopt these type tokens; add the 3-step flow strip below as a new visual element.)
7. **Three-step flow strip** — `display:flex; align-items:center; justify-content:space-between; background:#FBF7EF; border:1px solid #EDE3D2; border-radius:18px; padding:16px 12px; margin-top:20px`. Three steps, each `flex:1; column; align-items:center; gap:7px`: tile `44×44px; border-radius:13px` with bg per step (Camera `#16302E`, On-device model `#0F6E6A`, Instant grade `#E6B24C`) containing a `16×16px` glyph `background:#FBF7EF` (step 0 `border-radius:4px` = camera square, steps 1–2 `border-radius:50%`); label `font:600 10px/1.2 'Readex Pro'; color:#16302E; text-align:center`. Between steps an arrow `font:700 16px Rubik; color:#C7D0CE` (`→` LTR / `←` RTL), shown only after steps 0 and 1. Labels: Camera/الكاميرا, On-device model/نموذج على الجهاز, Instant grade/تقييم فوري.
8. **Promise banner** — `background:#0F6E6A; border-radius:18px; padding:18px; margin-top:14px; text-align:center`. Text `font:800 19px/1.2 Rubik; color:#FBF7EF`. Copy: "Your video never leaves this device." / "الفيديو لا يغادر هذا الجهاز."
9. **Bullet list** — `column; gap:10px; margin-top:14px`. Each bullet: `display:flex; gap:11px; align-items:flex-start`; check badge `22×22px; border-radius:50%; background:#1F8A5B` containing a CSS checkmark (`9×5px; border-left:2.5px solid #FBF7EF; border-bottom:2.5px solid #FBF7EF; transform:rotate(-45deg)`); text `font:400 13px/1.4 'Readex Pro'; color:#16302E`. Items: "No video is ever uploaded/لا يُرفع أي فيديو إطلاقًا", "No account needed to practise/لا حساب مطلوب للتمرّن", "Works fully offline/يعمل دون اتصال تمامًا", "Delete your data anytime/احذف بياناتك متى شئت".

**Screen D — PROFILE** (design reference; header idiom for Settings)
10. **Profile header** — centred column: avatar `88×88px; border-radius:50%; background:#E6B24C; box-shadow:0 6px 0 #C89A3D`, initial `font:800 38px Rubik; color:#16302E` (init "L"/"ل"); name `font:800 24px/1.05 Rubik; color:#16302E; margin-top:14px`; since-line `font:500 12px/1 'Readex Pro'; color:#5C726F; margin-top:4px` ("Signing since March 2026/تتعلّم منذ مارس ٢٠٢٦").
11. **Stat grid** — `grid 1fr 1fr; gap:10px; margin-top:20px`. Each tile `background:#FBF7EF; border:1px solid #EDE3D2; border-radius:16px; padding:14px; text-align:center`: value `font:800 26px/1 Rubik; color:<per-stat>`, label `font:600 11px/1.2 'Readex Pro'; color:#5C726F; margin-top:5px`. Stats: 18 Signs mastered `#0F6E6A`, 7 Day streak `#E8654C`, 92% Accuracy `#0F6E6A`, 340 Minutes `#C89A3D` (AR numerals ١٨/٧/٩٢٪/٣٤٠).
12. **Achievements row** — eyebrow `font:700 11px/1 ui-monospace,Menlo; letter-spacing:.1em; uppercase; color:#0F6E6A; margin-top:22px` ("Achievements/الإنجازات"); badges `flex; gap:12px; margin-top:12px`. Each badge `56×56px; border-radius:16px; font-size:26px`; earned: `background:#FBF7EF; border:2px solid #E6B24C`; locked (4th): `background:#EDE3D2; border:2px dashed #C7BBA4; filter:grayscale(1); opacity:.6; glyph empty`. Glyphs 🌟🔥🤟🔒.
13. **Edit-profile button** — `width:100%; margin-top:22px; background:#FBF7EF; color:#16302E; font:700 15px/1 Rubik; height:50px; border-radius:15px; box-shadow:inset 0 0 0 1px #EDE3D2`; on active `transform:translateY(2px)`. Copy "Edit profile/تعديل الملف". **Reference only** unless a profile-stats store exists.

**Screen E — ABOUT & credits** (design reference; maps to Settings footer)
14. **Fanan + title** — centred; Fanan `pose="cheer" scale="0.8"` (~98px) inside a `animation:float 3s ease-in-out infinite` wrapper `margin-top:8px`; title `font:800 24px/1.1 Rubik; color:#16302E; margin-top:12px` ("Made with the Deaf community/صُنع مع مجتمع الصمّ"); body `font:400 14px/1.5 'Readex Pro'; color:#5C726F; margin-top:8px` ("Sawiyya teaches the hearing world to sign — so we can all meet as equals." / "تعلّم سويّة العالمَ السامعَ الإشارة — لنلتقي جميعًا كأنداد.").
15. **Credits card** — `background:#FBF7EF; border:1px solid #EDE3D2; border-radius:18px; padding:18px; margin-top:18px; text-align:start`. Eyebrow `font:700 11px/1 ui-monospace,Menlo; letter-spacing:.1em; uppercase; color:#E8654C` ("With gratitude to/بامتنان إلى"); body `font:500 14px/1.55 'Readex Pro'; color:#16302E; margin-top:8px` ("Every sign was taught, checked and approved by Deaf Qatari signers. This app exists because of them — thank you." / "كل إشارة علّمها وراجعها وأقرّها مُشيرون قطريون صُمّ. هذا التطبيق موجود بفضلهم — شكرًا لكم.").
16. **Version line** — `font:500 11px/1.4 'Readex Pro'; color:#94A5A2; margin-top:16px` ("Sawiyya v1.0 · Made in Qatar/سويّة الإصدار ١٫٠ · صُنع في قطر"). Fold this into the existing version+dev-metrics egg block (keep `bump()` 5-tap).

Fanan pose usage: **only** in About (`pose="cheer"`, floating). No Fanan on the settings list, a11y, or AI screens.

---

## 3 · COPY — every visible string

| Key (reuse / +new) | English | Arabic |
|---|---|---|
| `setTitle` (reuse) | Settings | الإعدادات |
| `setGroupAccount` (+new) | Account | الحساب |
| `setGroupLearning` (+new) | Learning | التعلّم |
| `setGroupApp` (+new) | App | التطبيق |
| `setGroupPrivacy` (+new) | Privacy | الخصوصية |
| `setProfiles` (reuse) | Manage profiles | إدارة الملفات |
| `setRowProfileFamily` (+new) | Profile & family | الملف والعائلة |
| `setRowManageLearners` (+new) | Manage learners | إدارة المتعلّمين |
| `setGoal` (reuse) | Daily goal | الهدف اليومي |
| `setRowNotifications` (+new) | Notifications | التنبيهات |
| `setValRegular` (+new) | Regular | منتظم |
| `setValOn` (+new) | On | مُفعّل |
| `setRowLangA11y` (+new) | Language & accessibility | اللغة وسهولة الوصول |
| `setRowSoundHaptics` (+new) | Sound & haptics | الصوت والاهتزاز |
| `setRowYourData` (+new) | Your data | بياناتك |
| `a11yTitle` (+new) | Language & access | اللغة وسهولة الوصول |
| `a11yBody` (+new) | Make Sawiyya comfortable for you. | اجعل سويّة مريحة لك. |
| `a11yTextSize` (+new) | Text size | حجم النص |
| `a11yReducedMotion` (+new) | Reduced motion | تقليل الحركة |
| `a11yReducedMotionHint` (+new) | Calms animations | يهدّئ الرسوم |
| `a11ySound` (+new) | Sound effects | المؤثرات الصوتية |
| `a11ySoundHint` (+new) | Chimes & cheers | أنغام وتشجيع |
| `a11yHaptics` (+new) | Haptics | الاهتزاز |
| `a11yHapticsHint` (+new) | Gentle taps | نقرات لطيفة |
| `a11yContrast` (+new) | High contrast | تباين عالٍ |
| `a11yContrastHint` (+new) | Bolder colours | ألوان أوضح |
| `aiTitleShort` (+new) | How the AI works | كيف يعمل الذكاء |
| `aiBodyShort` (+new) | Sawiyya grades your signs with a model that runs entirely on your phone. | تقيّم سويّة إشاراتك بنموذج يعمل بالكامل على هاتفك. |
| `aiFlowCamera` (+new) | Camera | الكاميرا |
| `aiFlowModel` (+new) | On-device model | نموذج على الجهاز |
| `aiFlowGrade` (+new) | Instant grade | تقييم فوري |
| `aiPromise` (+new) | Your video never leaves this device. | الفيديو لا يغادر هذا الجهاز. |
| `aiBulletNoUpload` (+new) | No video is ever uploaded | لا يُرفع أي فيديو إطلاقًا |
| `aiBulletNoAccount` (+new) | No account needed to practise | لا حساب مطلوب للتمرّن |
| `aiBulletOffline` (+new) | Works fully offline | يعمل دون اتصال تمامًا |
| `aiBulletDelete` (+new) | Delete your data anytime | احذف بياناتك متى شئت |
| `profSince` (+new) | Signing since March 2026 | تتعلّم منذ مارس ٢٠٢٦ |
| `profAchievements` (+new) | Achievements | الإنجازات |
| `profEdit` (+new) | Edit profile | تعديل الملف |
| `profStatSigns` (+new) | Signs mastered | إشارة مُتقَنة |
| `profStatStreak` (+new) | Day streak | أيام متتالية |
| `profStatAccuracy` (+new) | Accuracy | الدقّة |
| `profStatMinutes` (+new) | Minutes | دقيقة |
| `aboutTitle` (+new) | Made with the Deaf community | صُنع مع مجتمع الصمّ |
| `aboutBody` (+new) | Sawiyya teaches the hearing world to sign — so we can all meet as equals. | تعلّم سويّة العالمَ السامعَ الإشارة — لنلتقي جميعًا كأنداد. |
| `aboutCreditsLbl` (+new) | With gratitude to | بامتنان إلى |
| `aboutCredits` (+new) | Every sign was taught, checked and approved by Deaf Qatari signers. This app exists because of them — thank you. | كل إشارة علّمها وراجعها وأقرّها مُشيرون قطريون صُمّ. هذا التطبيق موجود بفضلهم — شكرًا لكم. |
| `aboutVersion` (+new) | Sawiyya v1.0 · Made in Qatar | سويّة الإصدار ١٫٠ · صُنع في قطر |

Strings already inline in the .tsx that stay as-is (do NOT re-key unless refactoring): "Preferences/التفضيلات", "Language/اللغة", "Signing hand/يد الإشارة", "Your name/اسمك", "Camera & privacy/الكاميرا والخصوصية", Pro-tip copy, "Reset camera training/إعادة ضبط الكاميرا", reset confirm, "About/حول", "Signs dictionary/قاموس الإشارات", "Privacy policy/سياسة الخصوصية", "Together as Equals/معاً على قدم المساواة", version/copyright, plus all `AiTransparency`/`Privacy` bilingual `T(...)` bodies. Existing keys reused: `setCameraPermission`, `setGranted`, `setNotGranted`, `setAi`, `setPrivacy`.

Note: profile avatar initial ("L"/"ل") and name ("Layla Al-Mansoori/ليلى المنصوري") are DEMO placeholders — bind to `profile.displayName`, not a hardcoded string.

---

## 4 · NEW-I18N — ready to append to `src/i18n.ts`

Append inside the `strings` object (before the closing `} satisfies …`). Only add the block(s) whose screen actually gets wired; a11y/profile keys are conditional on real store support (see §2 caveats).

```ts
  // settings — grouped list (reskin)
  setGroupAccount: { en: "Account", ar: "الحساب" },
  setGroupLearning: { en: "Learning", ar: "التعلّم" },
  setGroupApp: { en: "App", ar: "التطبيق" },
  setGroupPrivacy: { en: "Privacy", ar: "الخصوصية" },
  setRowProfileFamily: { en: "Profile & family", ar: "الملف والعائلة" },
  setRowManageLearners: { en: "Manage learners", ar: "إدارة المتعلّمين" },
  setRowNotifications: { en: "Notifications", ar: "التنبيهات" },
  setValRegular: { en: "Regular", ar: "منتظم" },
  setValOn: { en: "On", ar: "مُفعّل" },
  setRowLangA11y: { en: "Language & accessibility", ar: "اللغة وسهولة الوصول" },
  setRowSoundHaptics: { en: "Sound & haptics", ar: "الصوت والاهتزاز" },
  setRowYourData: { en: "Your data", ar: "بياناتك" },

  // accessibility panel
  a11yTitle: { en: "Language & access", ar: "اللغة وسهولة الوصول" },
  a11yBody: { en: "Make Sawiyya comfortable for you.", ar: "اجعل سويّة مريحة لك." },
  a11yTextSize: { en: "Text size", ar: "حجم النص" },
  a11yReducedMotion: { en: "Reduced motion", ar: "تقليل الحركة" },
  a11yReducedMotionHint: { en: "Calms animations", ar: "يهدّئ الرسوم" },
  a11ySound: { en: "Sound effects", ar: "المؤثرات الصوتية" },
  a11ySoundHint: { en: "Chimes & cheers", ar: "أنغام وتشجيع" },
  a11yHaptics: { en: "Haptics", ar: "الاهتزاز" },
  a11yHapticsHint: { en: "Gentle taps", ar: "نقرات لطيفة" },
  a11yContrast: { en: "High contrast", ar: "تباين عالٍ" },
  a11yContrastHint: { en: "Bolder colours", ar: "ألوان أوضح" },

  // how the AI works — short flow variant
  aiTitleShort: { en: "How the AI works", ar: "كيف يعمل الذكاء" },
  aiBodyShort: { en: "Sawiyya grades your signs with a model that runs entirely on your phone.", ar: "تقيّم سويّة إشاراتك بنموذج يعمل بالكامل على هاتفك." },
  aiFlowCamera: { en: "Camera", ar: "الكاميرا" },
  aiFlowModel: { en: "On-device model", ar: "نموذج على الجهاز" },
  aiFlowGrade: { en: "Instant grade", ar: "تقييم فوري" },
  aiPromise: { en: "Your video never leaves this device.", ar: "الفيديو لا يغادر هذا الجهاز." },
  aiBulletNoUpload: { en: "No video is ever uploaded", ar: "لا يُرفع أي فيديو إطلاقًا" },
  aiBulletNoAccount: { en: "No account needed to practise", ar: "لا حساب مطلوب للتمرّن" },
  aiBulletOffline: { en: "Works fully offline", ar: "يعمل دون اتصال تمامًا" },
  aiBulletDelete: { en: "Delete your data anytime", ar: "احذف بياناتك متى شئت" },

  // profile header (wire only if profile stats exist)
  profSince: { en: "Signing since March 2026", ar: "تتعلّم منذ مارس ٢٠٢٦" },
  profAchievements: { en: "Achievements", ar: "الإنجازات" },
  profEdit: { en: "Edit profile", ar: "تعديل الملف" },
  profStatSigns: { en: "Signs mastered", ar: "إشارة مُتقَنة" },
  profStatStreak: { en: "Day streak", ar: "أيام متتالية" },
  profStatAccuracy: { en: "Accuracy", ar: "الدقّة" },
  profStatMinutes: { en: "Minutes", ar: "دقيقة" },

  // about & credits
  aboutTitle: { en: "Made with the Deaf community", ar: "صُنع مع مجتمع الصمّ" },
  aboutBody: { en: "Sawiyya teaches the hearing world to sign — so we can all meet as equals.", ar: "تعلّم سويّة العالمَ السامعَ الإشارة — لنلتقي جميعًا كأنداد." },
  aboutCreditsLbl: { en: "With gratitude to", ar: "بامتنان إلى" },
  aboutCredits: { en: "Every sign was taught, checked and approved by Deaf Qatari signers. This app exists because of them — thank you.", ar: "كل إشارة علّمها وراجعها وأقرّها مُشيرون قطريون صُمّ. هذا التطبيق موجود بفضلهم — شكرًا لكم." },
  aboutVersion: { en: "Sawiyya v1.0 · Made in Qatar", ar: "سويّة الإصدار ١٫٠ · صُنع في قطر" },
```

---

## 5 · MOTION / STATES

- **Keyframe (lift):** `@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}` — used on the About Fanan wrapper `animation:float 3s ease-in-out infinite`. Wrap under `motion-safe:` (reduce-motion freezes it — HANDOFF Motion).
- **Toggle switch:** knob slides on `inset-inline-start` `3px→22px`; track colour `#D6CDBB→#0F6E6A`. Use Ease-standard `cubic-bezier(.4,0,.2,1) 220ms`. Instant (no slide) under reduce-motion.
- **Text-size slider:** knob snaps to `15% / 50% / 85%` on the track for 3 discrete sizes; transition Ease-standard 220ms.
- **Springy buttons (HANDOFF):** solid-fill buttons get hard bottom shadow `box-shadow:0 5px 0 <deep>`; on press `translateY(4px)` + drop shadow. Existing tab-active style in design uses `box-shadow:0 3px 0 #0A4F4C`; Edit-profile uses `inset 0 0 0 1px #EDE3D2` and `translateY(2px)` on active. Preserve `active:scale-[.99]` on the reset button, `motion-safe:animate-pop-in` on AI/Privacy cards.
- **Row/link hover:** `LinkRow` label `group-hover:text-coral` + chevron `group-hover:translate-x-1` (RTL `-translate-x-1`). Keep.
- **Camera-permission state (live):** `camState==="granted"` → green "✓ Granted" text; else → teal pill button routing to `camera`. Keep both states.
- **Reset-training states:** confirm dialog → on confirm sets `resetMsg` "Cleared N…", shown in `aria-live` node, auto-clears after 3000ms. Keep.
- **Erase-everything (Privacy):** confirm → `localStorage.clear()` + reload. Destructive; coral-bordered card.
- **Loading/empty/error:** the design shows no explicit loading/empty/error state for settings. No-profile → existing `NoProfileFallback` (Settings) / `return null` (info pages). Camera permission "not granted" is the only empty-ish state — keep the CTA affordance. No skeletons required.

---

## 6 · RTL — mirrors vs never-mirrors (HANDOFF §2)

Set `dir` from `lang` (Arabic RTL). MIRROR (flip with RTL):
- Reading/layout flow of every row (icon-chip leads on the start edge; value+chevron trail on the end edge). In AR the colour chip sits on the right, chevron on the left — screenshots 01 confirm.
- Chevrons: `›` (LTR) → `‹` (AR). Existing `LinkRow` uses `rtl:rotate-180` — keep.
- Flow-strip arrows: `→` (LTR) → `←` (AR).
- Toggle knob travel: uses `inset-inline-start` so it auto-mirrors (knob rests on the correct leading edge). Text-size slider small/large "A" order follows reading flow.
- Group eyebrows, titles, body text anchor to the start edge (`text-align:start`).
- Numerals: Arabic panel uses Eastern-Arabic glyphs (٤, ١٨, ٧, ٩٢٪, ٣٤٠, ١٫٠) and `٪` trails. Never mix scripts on one panel.

NEVER MIRROR:
- Status-bar clock `9:41` (design chrome only; not app UI).
- The success **checkmark** in AI bullets (CSS tick keeps its shape/orientation).
- **Fanan** (About, `pose="cheer"`) — physical character, never flipped.
- Camera/play/record glyphs and the camera-square flow tile (`border-radius:4px` step-0 dot).
- Sign-language handshapes and any hand illustration (physical; `HandCards` intentionally uses `scale-x-[-1]` ONLY to distinguish left/right hand choice — that is a deliberate hand-mirror, not an RTL mirror; keep it independent of `dir`).
- Logo / brand wordmark in the version block.

---

Blocks: 16 | New i18n keys: 45
