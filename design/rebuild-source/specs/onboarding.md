# Onboarding — build spec (reskin)

Source design: `design/rebuild-source/Sawiyya Onboarding.dc.html`
Existing impl to preserve: `src/screens/Onboarding.tsx`
Screenshots: `screenshots/01-onb.png` (s0 welcome), `02-onb.png` (s1 meet Fanan), `03-onb.png` (s2 language), `04-onb.png` (s3 who-with).
Tokens/RTL/Motion: `design/rebuild-source/HANDOFF.md` §1/§2/Motion.

> **Reconciliation note (read first).** The `.dc.html` reference is a **10-step** narrated flow (s0–s9). The live `Onboarding.tsx` is a **7-step** state machine (`splash → lang → learn → why → hand → goal → name`) whose `why` step is actually the *persona/who-with* chooser. The reskin **keeps the existing 7-step machine and all its wiring** (that is the functional contract in §1), and **restyles each existing step into the design's visual language**. The design's headline moment — **the on-device privacy screen (s6)** — plus the **welcome (s0)**, **meet-Fanan (s1)**, **your-why (s4)**, **camera-how-it-works (s5)**, **reminders (s8)** and **all-set (s9)** screens are *design-only* moments not currently in the machine. Insert them as **new inert/additive steps** that advance the flow (they carry no new store writes except s8 which may call a reminders opt-in if wired later); do **not** delete `learn`, `hand`, or `name` — they own real `createProfile` inputs. Where a design step maps to an existing step, reuse the existing step's wiring and swap only presentation + copy.

Step mapping used throughout this spec:

| Design step | Existing `Step` | Wiring owner |
|---|---|---|
| s0 Welcome | (new, before `splash`) or reskin `splash` | `setStep("lang")` |
| s1 Meet Fanan | (new) | advance only |
| s2 Language | `lang` | `chooseLang(l)` |
| s3 Who with | `why` (persona chooser) | `setPersona` |
| s4 Your why | (new) | local reason state, advance only |
| s5 How it works · camera | (new) | advance only |
| s6 On-device privacy | (new — required) | advance only |
| s7 Daily goal | `goal` | `setGoal` |
| s8 Reminders | (new) | advance only (future: reminders opt-in) |
| s9 All set | (new) | `finish()` |
| — Learning path chooser | `learn` | `finish({destination…})` / `setStep("why")` |
| — Handedness | `hand` | `setHand` |
| — Name | `name` | `setName` + `finish()` |

---

## 1 · PRESERVE (functional contract — must stay wired)

All identifiers below are from `src/screens/Onboarding.tsx`. The reskin may change className/markup but must keep these calls, names, and behaviour.

### Store / hooks
- `const { createProfile, completeOnboarding } = useApp();` — profile creation + onboarding-complete flag.
- `const { go } = useUi();` — navigation.
- Local state hooks (keep all): `useState<Step>("splash")` → `[step, setStep]`; `useState<Lang>("en")` → `[lang, setLang]`; `useState<Persona>("parent")` → `[persona, setPersona]`; `useState<Hand>("R")` → `[hand, setHand]`; `useState<DailyGoal>("regular")` → `[goal, setGoal]`; `useState("")` → `[name, setName]`.

### Core functions (keep signatures + bodies)
- `finish(overrides?)` — builds `displayName` (falls back to `lang === "ar" ? "أنا" : "Me"`), calls `createProfile({ displayName, role, dominantHand, language, dailyGoal })`, then `completeOnboarding()`, then `go(overrides?.destination ?? { name: "firstSign" })`. **`overrides.skipAll` must still force `role:"parent"`, `dominantHand:"R"`, `dailyGoal:"regular"`.**
- `chooseLang(l)` — `setLang(l); applyDir(l); setStep("learn");` **`applyDir(l)` must run on language pick (sets document dir).**
- `STEP_ORDER = ["splash","lang","learn","why","hand","goal","name"]`, `stepIndex`, and `back()` (guards `stepIndex > 0`). If new design steps are inserted, extend `STEP_ORDER` so `back`/progress stay honest.

### Navigation / handlers that must survive
- Splash CTA: `onClick={() => setStep("lang")}`.
- Language cards: `onClick={() => chooseLang("ar")}` and `onClick={() => chooseLang("en")}`.
- Learn step: Arabic-alphabet card `onClick={() => finish({ destination: { name: "camera", targetSignId: "alpha-alif" } })}` (**practice-first: this exact destination must stay**); "Everyday signs" and "Other dialects" cards + Continue → `setStep("why")`.
- Persona cards (`why` step): `onClick={() => setPersona(p.value)}`; footer Continue → `setStep("hand")`.
- Handedness cards: `onClick={() => { setHand(h.value); setStep("goal"); }}` for values `"R"`/`"L"`.
- Goal cards: `onClick={() => { setGoal(g.value); setStep("name"); }}` for values `casual`/`regular`/`serious`.
- Name form: `onSubmit` → `e.preventDefault(); finish();`; input `onChange={(e) => setName(e.target.value)}`, `maxLength={20}`, `autoFocus`.
- Back button: `onClick={back}`, `aria-label={lang === "ar" ? "رجوع" : "Back"}`, back-arrow glyph `rtl:-scale-x-100`.
- Skip button: `onClick={() => finish({ skipAll: true })}`.
- Progressbar: `role="progressbar"` + `aria-valuenow/min/max` + `aria-label={pick(lang, "Setup progress", "تقدّم الإعداد")}`.

### Data tables that must stay
- `PERSONAS` array (values `parent/sibling/teacher/friend/deaf`, keys `obParent/obSibling/obTeacher/obFriend/obDeaf`, `.ar` labels, icons). `deaf` renders the gold "Special Path" variant with the `check` badge.
- `GOALS` array (values `casual/regular/serious`, keys `obCasual/obRegular/obSerious`, icons).
- `PERSONA_TAGLINE[persona]` lookup on the `name` step.
- `cardBase` class constant (reskin may retune, but the choice-card affordance stays).

### Every `t(...)` / `pick(...)` call currently in the file (keep the key, may restyle container)
`t("obSkip", lang)`, `t("obStart", "en")`, `t("tagline", "en")`, `t("obChooseLang", lang)`, `t("obContinue", lang)` (and `t("obContinue","en")`, `t("obContinue","ar")`), `t("obWhoTitle","en")`, `t("obWhoTitle","ar")`, `t("obWhoSub", lang)`, `t(p.key, lang)` (persona labels), `t("obHandTitle", lang)`, `t("obHandSub", lang)`, `t(h.key, lang)` (`obRight`/`obLeft`), `t("obGoalTitle", lang)`, `t("obGoalSub", lang)`, `t(g.key, lang)` (goal labels), `t("obNameTitle", lang)`.
`pick(lang, "Setup progress", "تقدّم الإعداد")`, `pick(lang, "What do you want to learn?", "ماذا تريد أن تتعلّم؟")`, `pick(lang, "Qatari Sign Language — start here, on your device.", "لغة الإشارة القطرية — ابدأ هنا، على جهازك.")`, `pick(lang, "Arabic Alphabet", "الحروف العربية")`, `pick(lang, "Ready", "جاهز")`, `pick(lang, "28 core letters, camera-graded", "٢٨ حرفًا أساسيًا، بتقييم الكاميرا")`, `pick(lang, "Everyday signs", "إشارات يومية")`, `pick(lang, "Hello, milk, more, thank you…", "مرحبا، حليب، المزيد، شكرًا…")`, `pick(lang, "Teach & practise", "علّم وتدرّب")`, `pick(lang, "Other Gulf dialects", "لهجات خليجية أخرى")`, `pick(lang, "Emirati, Saudi & more — coming soon", "الإماراتية والسعودية وغيرها — قريبًا")`, `pick(lang, "Special Path", "مسار خاص")`, `pick(lang, PERSONA_TAGLINE[persona].en, …ar)`.

---

## 2 · LAYOUT (target design, ordered blocks)

**Global device frame (every step):** phone shell `background:#16302E`, `border-radius:47px`, `padding:7px`, `box-shadow:0 24px 60px rgba(22,48,46,.28)`. Inner screen `border-radius:40px`, `overflow:hidden`, column flex. Screen background: **`#F6EFE3`** on the dark/hero steps (s0 welcome & s9 all-set), **`#FBF7EF`** on all other steps. Font family: body `'Readex Pro'`, headings `Rubik`; Arabic panel uses `dir="rtl"`. (These map to app `bg-sand`/`bg-paper`.)

### Block A — Status bar (all steps)
- Height `34px`, padding `0 24px`, space-between.
- Left: time `9:41`, `font:700 13px/1 Rubik`, color `#16302E`. **Never mirrors** (stays left in RTL).
- Center: notch pill `74px × 20px`, `background:#16302E`, `border-radius:99px`, absolute top `9px`, centered.
- Right: battery glyph `16×9px`, `border:1.5px solid #16302E`, `border-radius:3px`.

### Block B — Progress track (all steps)
- Container padding `8px 22px 4px`. Track `height:7px`, `border-radius:99px`, `background:#EDE3D2`, overflow-hidden.
- Fill: `background:#E6B24C`, `border-radius:99px`, width = `((step+1)/TOTAL)*100%` (10 steps → 10%,20%…100%). Transition `width .35s cubic-bezier(.3,1.2,.5,1)` (spring). **Fill mirrors in RTL** (fills from start edge).

### Block C — Body (per-step; padding `12px 24px 0`, flex:1, overflow hidden)

**s0 · Welcome** (bg `#F6EFE3`) — centered column, gap `8px`, `justify-content:center`.
- Fanan pose **`wave`**, `scale:1.15` (~140px), wrapper `animation:float 3s ease-in-out infinite`.
- Title `font:800 34px/1.05 Rubik`, color `#16302E`, letter-spacing `-.02em`, margin-top `14px`, `animation:rise .4s ease both`. Copy: "Teach the world to sign."
- Body `font:400 15px/1.45 'Readex Pro'`, color `#5C726F`, max-width `250px`, `animation:rise .4s ease .1s both`. Copy: "Learn to sign and connect with someone who can't hear you — as equals."

**s1 · Meet Fanan** (bg `#FBF7EF`) — centered column, gap `6px`.
- Fanan pose **`cheer`**, `scale:1.2` (~145px), wrapper `animation:float 2.6s ease-in-out infinite`.
- Eyebrow (mono) `font:700 12px/1 ui-monospace,Menlo`, letter-spacing `.14em`, uppercase, color `#E8654C`, margin-top `12px`. Copy: "Meet your guide".
- Title `font:800 32px/1.05 Rubik`, `#16302E`, margin-top `6px`, `rise`. Copy: "Hi, I'm Fanan!"
- Body `font:400 15px/1.45 'Readex Pro'`, `#5C726F`, max-width `252px`, margin-top `4px`. Copy: "I'll cheer you on, catch your signs, and never let you learn alone."

**s2 · Language** (bg `#FBF7EF`) — top-aligned.
- Fanan pose **`idle`**, `scale:0.7` (~86px), margin-top `8px`.
- Title `font:800 26px/1.1 Rubik`, `#16302E`, margin-top `8px`. Copy: "Choose your language".
- Body `font:400 14px/1.4 'Readex Pro'`, `#5C726F`, margin-top `6px`. Copy: "You can switch anytime in settings."
- Two language cards, column gap `12px`, margin-top `22px`. Card: `display:flex;justify-content:space-between;padding:16px 18px;border-radius:16px`.
  - **Selected** card: `background:#0F6E6A`, color `#FBF7EF`, `box-shadow:0 4px 0 #0A4F4C`.
  - **Unselected** card: `background:#FBF7EF`, color `#16302E`, `box-shadow:inset 0 0 0 1px #EDE3D2`.
  - EN card selected when `lang==="en"`; AR card selected when `lang==="ar"`. Left label `font:700 17px Rubik`, right sublabel `font:500 13px 'Readex Pro';opacity:.7`.
  - EN card: "English" / "Left-to-right". AR card: "العربية" / "من اليمين لليسار".

**s3 · Who with** (bg `#FBF7EF`) — header row + chip list. *(Maps to existing `why`/persona step.)*
- Header row `display:flex;align-items:center;gap:12px;margin-top:4px`: Fanan pose **`think`**, `scale:0.56` (~70px), then title/body stack.
  - Title `font:800 24px/1.08 Rubik`, `#16302E`. Copy: "Who are you signing with?"
  - Body `font:400 13px/1.35 'Readex Pro'`, `#5C726F`, margin-top `3px`. Copy: "We'll tailor your first words to them."
- Chip list column, gap `10px`, margin-top `20px`. Each chip: `display:flex;align-items:center;gap:11px;width:100%;text-align:start;padding:14px 16px;border-radius:15px;font:600 15px/1.2 'Readex Pro'`.
  - **Active:** `background:#0F6E6A`, color `#FBF7EF`, `box-shadow:0 4px 0 #0A4F4C`; leading dot `12×12` circle `#F0C879`.
  - **Inactive:** `background:#FBF7EF`, color `#16302E`, `box-shadow:inset 0 0 0 1px #EDE3D2`; leading dot `#EDE3D2`.
  - Labels (reuse existing `PERSONAS` copy, not the design's literal 5): render the 5 `PERSONAS` cards' labels. *(Design literals for reference: "A parent / A family member / A teacher / A friend / Just me".)*

**s4 · Your why** (bg `#FBF7EF`) — same header pattern (Fanan **`think`**, scale `0.56`).
- Title "What brings you here?"; body "Your reason shapes your journey."
- Wrapped pill row `display:flex;flex-wrap:wrap;gap:10px;margin-top:20px`. Each pill: `padding:11px 15px;border-radius:99px;font:600 13px/1 'Readex Pro'`.
  - **Active:** `background:#E8654C`, color `#FBF7EF`, `box-shadow:0 3px 0 #C54F3A`.
  - **Inactive:** `background:#FBF7EF`, color `#16302E`, `box-shadow:inset 0 0 0 1px #EDE3D2`.
  - Labels: "Connect with family / For work / Curiosity / A specific person / The Deaf community".

**s5 · How it works · camera** (bg `#FBF7EF`) — top-aligned.
- Eyebrow (mono) `font:700 12px/1 ui-monospace,Menlo`, letter-spacing `.14em`, uppercase, color `#0F6E6A`. Copy: "How it works · 1".
- Title `font:800 26px/1.1 Rubik`, `#16302E`, margin-top `6px`. Copy: "Sign it to the camera".
- Camera preview box: margin-top `18px`, `border-radius:22px`, `height:220px`, overflow-hidden, `background:repeating-linear-gradient(135deg,#16302E,#16302E 15px,#1d3d3a 15px,#1d3d3a 30px)`, centered content.
  - Hand-guide frame `120×140`, `border:3px dashed rgba(240,200,121,.75)`, `border-radius:32px`, centered.
  - Inside: teal disc `56×56` circle `#0F6E6A`, `box-shadow:0 0 0 8px rgba(15,110,106,.25)`, containing a **camera/check chevron glyph** (`22×12`, `border-left:5px solid #FBF7EF;border-bottom:5px solid #FBF7EF;transform:rotate(-45deg) translateY(-2px)`). **Camera glyph never mirrors.**
- Body `font:400 14px/1.45 'Readex Pro'`, `#5C726F`, margin-top `16px`. Copy: "Watch a real signer, then sign it back. Fanan checks your handshape live."

**s6 · On-device privacy** (bg `#FBF7EF`) — **the headline moment**, centered column, gap `6px`.
- Shield/lock badge: `118×118`, `border-radius:36px`, `background:#0F6E6A`, centered, `animation:pulseRing 2s ease-out infinite`, `box-shadow:0 12px 30px rgba(15,110,106,.3)`.
  - Inside lock body: `44×52` rounded rect `background:#FBF7EF`, `border-radius:8px`; shackle arc on top (`30×30`, `border:6px solid #FBF7EF;border-bottom:none;border-radius:16px 16px 0 0`, offset top `-18px`); keyhole (`9×14` `#0F6E6A`, `border-radius:3px`).
- Title `font:800 27px/1.1 Rubik`, `#16302E`, margin-top `20px`, `rise`. Copy: "100% on your device".
- Body `font:400 15px/1.5 'Readex Pro'`, `#5C726F`, max-width `250px`, margin-top `4px`. Copy: "Your camera never leaves your phone. No video is uploaded, ever."
- Reassurance badge pill: `display:flex;align-items:center;gap:8px;background:#F6EFE3;border:1px solid #EDE3D2;border-radius:99px;padding:9px 15px;margin-top:14px`. Green dot `9×9` `#1F8A5B` + `box-shadow:0 0 0 4px rgba(31,138,91,.2)`. Text `font:700 12px/1 'Readex Pro'`, `#16302E`. Copy: "Nothing leaves this device".

**s7 · Daily goal** (bg `#FBF7EF`) — same header pattern (Fanan **`cheer`**, scale `0.56`). *(Maps to existing `goal` step.)*
- Title "Pick a daily goal"; body "Small and steady wins. You can change it later."
- Goal list column gap `11px`, margin-top `20px`. Each goal row: `display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:14px 16px;border-radius:16px`.
  - **Active:** `background:#0F6E6A`, color `#FBF7EF`, `box-shadow:0 4px 0 #0A4F4C`.
  - **Inactive:** `background:#FBF7EF`, color `#16302E`, `box-shadow:inset 0 0 0 1px #EDE3D2`.
  - Left stack (`text-align:start`): label `font:700 16px Rubik`; sub `font:500 12px 'Readex Pro';opacity:.72;margin-top:2px`.
  - Right minutes badge: `font:700 12px/1 Rubik;padding:7px 11px;border-radius:99px`. Active: `background:rgba(255,255,255,.18)`, color `#F0C879`. Inactive: `background:#F6EFE3`, color `#0F6E6A`.
  - Rows (design literals — but reuse existing `GOALS`/`obCasual…` copy): Casual / "A sign a day" / 5 min · Regular / "Build a habit" / 10 min · Serious / "Go all in" / 15 min.

**s8 · Reminders** (bg `#FBF7EF`) — centered header.
- Fanan pose **`idle`**, `scale:0.82` (~100px), centered.
- Title `font:800 25px/1.1 Rubik`, `#16302E`, margin-top `10px`, centered. Copy: "A gentle nudge?"
- Body `font:400 14px/1.45 'Readex Pro'`, `#5C726F`, margin-top `6px`, centered. Copy: "I'll only remind you when it helps."
- Sample notification card: margin-top `20px`, `background:#FBF7EF;border:1px solid #EDE3D2;border-radius:18px;padding:13px;display:flex;gap:11px;align-items:center;box-shadow:0 6px 18px rgba(22,48,46,.08)`.
  - App icon tile `38×38`, `border-radius:11px`, `background:#E6B24C`.
  - Text col: title `font:700 12px/1.2 Rubik`, `#16302E` → "Sawiyya · now". Body `font:400 12px/1.35 'Readex Pro'`, `#5C726F`, margin-top `3px` → "Ready for today's sign? Your family is one word closer. ✨".

**s9 · All set** (bg `#F6EFE3`) — centered column, gap `8px`, + confetti overlay.
- Fanan pose **`celebrate`**, `scale:1.25` (~150px), wrapper `animation:float 2.4s ease-in-out infinite`.
- Title `font:800 34px/1.05 Rubik`, `#16302E`, margin-top `16px`, `animation:pop .5s ease both`. Copy: "You're all set!"
- Body `font:400 15px/1.45 'Readex Pro'`, `#5C726F`, max-width `250px`. Copy: "Let's learn your very first sign together."

### Block D — Footer CTA (all steps)
- Container `flex:none;padding:12px 24px 20px`.
- Button full-width, `border:none;font:700 16px/1 Rubik;height:54px;border-radius:17px;transition:all .08s`. Press: `translateY(4px)` and shadow collapses to `0 1px 0 <shadow>`.
- CTA colors by step:
  - **s0, s9:** `background:#E8654C`, color `#FBF7EF`, `box-shadow:0 5px 0 #C54F3A` (coral).
  - **all other steps (incl. s6):** `background:#0F6E6A`, color `#FBF7EF`, `box-shadow:0 5px 0 #0A4F4C` (teal).
- CTA copy per step: s0 "Get started", s1 "Nice to meet you", s2 "Continue", s3 "Continue", s4 "Continue", s5 "Got it", s6 "I feel safe", s7 "Set my goal", s8 "Allow reminders", s9 "Teach me a sign →".

### Block E — Confetti overlay (s9 only)
- `position:absolute;inset:0;overflow:hidden;pointer-events:none;border-radius:47px`. 38 pieces, colors cycle `['#0F6E6A','#E8654C','#E6B24C','#F0C879','#F08A75']`, size `6–14px` (height = width × .66), radius `2px` or `50%`, random rotation, `animation:confettiFall 1.3–2.2s <0–.4s delay> ease-in forwards`.

---

## 3 · COPY (every visible string)

Eastern-Arabic numerals in AR panel (`٥ ١٠ ١٥ ١٠٠٪ ١`). Reuse existing keys where noted; new keys marked ✚.

| Key | English | Arabic |
|---|---|---|
| `obWelcomeTitle` ✚ | Teach the world to sign. | علّم العالم الإشارة. |
| `obWelcomeBody` ✚ | Learn to sign and connect with someone who can't hear you — as equals. | تعلّم الإشارة وتواصل مع من لا يسمعك — كأنداد. |
| `obWelcomeCta` ✚ | Get started | لنبدأ |
| `obFananEyebrow` ✚ | Meet your guide | تعرّف على مرشدك |
| `obFananTitle` ✚ | Hi, I'm Fanan! | مرحبًا، أنا فَنَن! |
| `obFananBody` ✚ | I'll cheer you on, catch your signs, and never let you learn alone. | سأشجّعك، وألتقط إشاراتك، ولن أدعك تتعلّم وحدك أبدًا. |
| `obFananCta` ✚ | Nice to meet you | تشرّفنا |
| `obLangTitle` ✚ | Choose your language | اختر لغتك |
| `obLangBody` ✚ | You can switch anytime in settings. | يمكنك التبديل في أي وقت من الإعدادات. |
| `obLangEn` ✚ | English | English |
| `obLangEnSub` ✚ | Left-to-right | Left-to-right |
| `obLangAr` ✚ | العربية | العربية |
| `obLangArSub` ✚ | من اليمين لليسار | من اليمين لليسار |
| `obContinue` (exists) | Continue | متابعة |
| `obWhoTitle` (exists — reuse for s3 header) | Who are you learning for? | لمن تتعلم الإشارة؟ |
| `obWhoSub` (exists) | We'll start you on the signs that matter most. | سنبدأ معك بالإشارات الأهم لك. |
| `obParent`/`obSibling`/`obTeacher`/`obFriend`/`obDeaf` (exist) | persona labels — reuse | — |
| `obWhyTitle` ✚ | What brings you here? | ما الذي جاء بك؟ |
| `obWhyBody` ✚ | Your reason shapes your journey. | سببك يرسم رحلتك. |
| `obWhyFamily` ✚ | Connect with family | التواصل مع العائلة |
| `obWhyWork` ✚ | For work | للعمل |
| `obWhyCuriosity` ✚ | Curiosity | الفضول |
| `obWhyPerson` ✚ | A specific person | شخص بعينه |
| `obWhyCommunity` ✚ | The Deaf community | مجتمع الصمّ |
| `obCamEyebrow` ✚ | How it works · 1 | كيف يعمل · ١ |
| `obCamTitle` ✚ | Sign it to the camera | أشِر أمام الكاميرا |
| `obCamBody` ✚ | Watch a real signer, then sign it back. Fanan checks your handshape live. | شاهد مُشيرًا حقيقيًا ثم أعِد الإشارة. يتحقّق فَنَن من إشارتك مباشرة. |
| `obCamCta` ✚ | Got it | فهمت |
| `obPrivacyTitle` ✚ | 100% on your device | ١٠٠٪ على جهازك |
| `obPrivacyBody` ✚ | Your camera never leaves your phone. No video is uploaded, ever. | كاميرتك لا تغادر هاتفك. لا يُرفع أي فيديو، إطلاقًا. |
| `obPrivacyBadge` ✚ | Nothing leaves this device | لا شيء يغادر هذا الجهاز |
| `obPrivacyCta` ✚ | I feel safe | أشعر بالأمان |
| `obGoalTitle` (exists) | Your daily goal *(design: "Pick a daily goal")* | هدفك اليومي |
| `obGoalSub` (exists) | Small and steady beats heroic and rare. | القليل المستمر خير من الكثير المنقطع. |
| `obCasual`/`obRegular`/`obSerious` (exist) | goal labels — reuse | — |
| `obGoalCasualSub` ✚ | A sign a day | إشارة كل يوم |
| `obGoalRegularSub` ✚ | Build a habit | ابنِ عادة |
| `obGoalSeriousSub` ✚ | Go all in | انغمس تمامًا |
| `obGoalCta` ✚ | Set my goal | حدّد هدفي |
| `obRemindTitle` ✚ | A gentle nudge? | تذكير لطيف؟ |
| `obRemindBody` ✚ | I'll only remind you when it helps. | سأذكّرك فقط حين يفيدك ذلك. |
| `obRemindNow` ✚ | now | الآن |
| `obRemindSample` ✚ | Ready for today's sign? Your family is one word closer. ✨ | مستعد لإشارة اليوم؟ عائلتك أقرب بكلمة. ✨ |
| `obRemindCta` ✚ | Allow reminders | السماح بالتذكير |
| `obAllSetTitle` ✚ | You're all set! | أصبحت جاهزًا! |
| `obAllSetBody` ✚ | Let's learn your very first sign together. | لنتعلّم أول إشارة لك معًا. |
| `obAllSetCta` ✚ | Teach me a sign → | علّمني إشارة ← |
| `obSkip` (exists) | Skip | تخطّي |
| — (existing splash retained if kept) `tagline`, `obStart`, `obChooseLang` | — | — |

*(App name literal "Sawiyya" in the s8 notification card is brand-locked; no i18n key. The "→"/"←" arrow in the all-set CTA is directional and swaps with `dir`.)*

---

## 4 · NEW-I18N (append to `src/i18n.ts`)

```ts
  // Onboarding — welcome + meet-Fanan
  obWelcomeTitle: { en: "Teach the world to sign.", ar: "علّم العالم الإشارة." },
  obWelcomeBody: { en: "Learn to sign and connect with someone who can’t hear you — as equals.", ar: "تعلّم الإشارة وتواصل مع من لا يسمعك — كأنداد." },
  obWelcomeCta: { en: "Get started", ar: "لنبدأ" },
  obFananEyebrow: { en: "Meet your guide", ar: "تعرّف على مرشدك" },
  obFananTitle: { en: "Hi, I’m Fanan!", ar: "مرحبًا، أنا فَنَن!" },
  obFananBody: { en: "I’ll cheer you on, catch your signs, and never let you learn alone.", ar: "سأشجّعك، وألتقط إشاراتك، ولن أدعك تتعلّم وحدك أبدًا." },
  obFananCta: { en: "Nice to meet you", ar: "تشرّفنا" },
  // Onboarding — language step (design copy)
  obLangTitle: { en: "Choose your language", ar: "اختر لغتك" },
  obLangBody: { en: "You can switch anytime in settings.", ar: "يمكنك التبديل في أي وقت من الإعدادات." },
  obLangEn: { en: "English", ar: "English" },
  obLangEnSub: { en: "Left-to-right", ar: "Left-to-right" },
  obLangAr: { en: "العربية", ar: "العربية" },
  obLangArSub: { en: "من اليمين لليسار", ar: "من اليمين لليسار" },
  // Onboarding — your why
  obWhyTitle: { en: "What brings you here?", ar: "ما الذي جاء بك؟" },
  obWhyBody: { en: "Your reason shapes your journey.", ar: "سببك يرسم رحلتك." },
  obWhyFamily: { en: "Connect with family", ar: "التواصل مع العائلة" },
  obWhyWork: { en: "For work", ar: "للعمل" },
  obWhyCuriosity: { en: "Curiosity", ar: "الفضول" },
  obWhyPerson: { en: "A specific person", ar: "شخص بعينه" },
  obWhyCommunity: { en: "The Deaf community", ar: "مجتمع الصمّ" },
  // Onboarding — how it works (camera)
  obCamEyebrow: { en: "How it works · 1", ar: "كيف يعمل · ١" },
  obCamTitle: { en: "Sign it to the camera", ar: "أشِر أمام الكاميرا" },
  obCamBody: { en: "Watch a real signer, then sign it back. Fanan checks your handshape live.", ar: "شاهد مُشيرًا حقيقيًا ثم أعِد الإشارة. يتحقّق فَنَن من إشارتك مباشرة." },
  obCamCta: { en: "Got it", ar: "فهمت" },
  // Onboarding — on-device privacy
  obPrivacyTitle: { en: "100% on your device", ar: "١٠٠٪ على جهازك" },
  obPrivacyBody: { en: "Your camera never leaves your phone. No video is uploaded, ever.", ar: "كاميرتك لا تغادر هاتفك. لا يُرفع أي فيديو، إطلاقًا." },
  obPrivacyBadge: { en: "Nothing leaves this device", ar: "لا شيء يغادر هذا الجهاز" },
  obPrivacyCta: { en: "I feel safe", ar: "أشعر بالأمان" },
  // Onboarding — daily goal (subs + cta)
  obGoalCasualSub: { en: "A sign a day", ar: "إشارة كل يوم" },
  obGoalRegularSub: { en: "Build a habit", ar: "ابنِ عادة" },
  obGoalSeriousSub: { en: "Go all in", ar: "انغمس تمامًا" },
  obGoalCta: { en: "Set my goal", ar: "حدّد هدفي" },
  // Onboarding — reminders
  obRemindTitle: { en: "A gentle nudge?", ar: "تذكير لطيف؟" },
  obRemindBody: { en: "I’ll only remind you when it helps.", ar: "سأذكّرك فقط حين يفيدك ذلك." },
  obRemindNow: { en: "now", ar: "الآن" },
  obRemindSample: { en: "Ready for today’s sign? Your family is one word closer. ✨", ar: "مستعد لإشارة اليوم؟ عائلتك أقرب بكلمة. ✨" },
  obRemindCta: { en: "Allow reminders", ar: "السماح بالتذكير" },
  // Onboarding — all set
  obAllSetTitle: { en: "You’re all set!", ar: "أصبحت جاهزًا!" },
  obAllSetBody: { en: "Let’s learn your very first sign together.", ar: "لنتعلّم أول إشارة لك معًا." },
  obAllSetCta: { en: "Teach me a sign →", ar: "علّمني إشارة ←" },
```

*(Reuse existing `obContinue`, `obWhoTitle`, `obWhoSub`, `obGoalTitle`, `obGoalSub`, `obCasual/obRegular/obSerious`, persona keys, `obSkip`. Existing `obStart`/`tagline`/`obChooseLang` stay if the current `splash` screen is retained alongside the new `obWelcome*` screen.)*

---

## 5 · MOTION / STATES

Keyframes (lift literally):
- `@keyframes float{0%,100%{translateY(0)}50%{translateY(-7px)}}` — Fanan idle bob (s0 3s, s1 2.6s, s9 2.4s).
- `@keyframes rise{0%{translateY(16px);opacity:0}100%{translateY(0);opacity:1}}` — titles/bodies enter (`.4s ease`, body delayed `.1s`).
- `@keyframes pop{0%{scale .6;opacity 0}60%{scale 1.1}100%{scale 1;opacity 1}}` — s9 title (`.5s ease`).
- `@keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(15,110,106,.4)}70%{box-shadow:0 0 0 20px rgba(15,110,106,0)}100%{…0}}` — s6 shield (`2s ease-out infinite`).
- `@keyframes confettiFall{0%{translateY(0) rotate(0)}100%{translateY(440px) rotate(560deg);opacity:.2}}` — s9 confetti (`1.3–2.2s ease-in forwards`).
- Progress fill transition: `width .35s cubic-bezier(.3,1.2,.5,1)` — springs forward each step.
- Button press: `transition:all .08s`; active → `translateY(4px)` + shadow → `0 1px 0 <deep>`.

States:
- **Selection (interactive):** language / who / why / goal items toggle active↔inactive on tap (color fill + hard shadow appears; who-chip dot recolors to gold; why-pill uses coral; goal badge recolors). Selected persona in the live app also shows the ring + `check` badge (`-end-3 -top-3`, gold for Deaf / coral for others) — **preserve**.
- **Loading/empty/error:** none in this design (onboarding has no async). Camera on s5 is an illustrative mock, not a live feed — no permission/error state here (real permission prompt lives in `Sawiyya States.dc.html`).
- **Progress:** honest per-step; `back` disabled at step 0 (guarded).
- **Reduce-motion (HANDOFF Motion):** freeze `float`, `pulseRing`, `confettiFall`; keep instant state changes and progress-width jump.

---

## 6 · RTL

Arabic panel is `dir="rtl"`; author AR first (HANDOFF §2). App uses logical props (`text-align:start`, `margin-inline`, `inset-inline`).

**Mirrors:** overall reading flow + card/chip alignment (anchor to start edge), progress-bar fill (fills from start), back-arrow glyph (`rtl:-scale-x-100` / `rtl:rotate-180`), the all-set CTA arrow (`→` EN becomes `←` AR — already separate AR string), forward/continue arrows, step-slide direction (enters from leading edge), Eastern-Arabic numerals (`٥ ١٠ ١٥ ١٠٠٪ ١`).

**Never mirrors:** status-bar clock `9:41` + battery glyph (stay left), the **camera/check chevron glyph** on s5, the **Fanan** mascot (all poses), the **checkmark** on selected persona, the privacy **lock/shield** icon, the app-icon tile on s8, brand wordmark/logo, and any sign-language **handshapes** (physical). Green success dot on s6 badge is symmetric (n/a).
