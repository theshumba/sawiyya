# States — build spec

Screen family: camera-permission / denied / no-camera / empty (no signs, no family, **no profile**) / offline, plus the **live-grader edge states** (no-hand / too-dark / out-of-frame).

Design source (lift values EXACTLY):
- `/Users/theshumba/Documents/GitHub/sawiyya/design/rebuild-source/Sawiyya States.dc.html` (permission, denied, no-camera, empty·signs, empty·family, offline)
- `/Users/theshumba/Documents/GitHub/sawiyya/design/rebuild-source/Sawiyya Live States.dc.html` (permission primer, permission denied, no-hand, too-dark, out-of-frame)

Existing implementation to preserve: `/Users/theshumba/Documents/GitHub/sawiyya/src/components/NoProfileFallback.tsx` (the shared `if (!profile)` escape hatch — this is the **empty · no-profile** instance of this state family; reskin it to match the empty-state layout below).

---

## 1 · PRESERVE — functional contract (must stay wired)

`NoProfileFallback.tsx` is imported and rendered by **11 screens** as the `if (!profile) return <NoProfileFallback />;` guard:
`LessonPlayer.tsx:43`, `Progress.tsx:40`, `Settings.tsx:61`, `FlagPicker.tsx:56`, `Family.tsx:54`, `Home.tsx:40`, `PractiseChooser.tsx:22`, `AllSigns.tsx:136`, `CameraPractice.tsx:28`, `FirstSign.tsx:77`. The component's public name, its zero-prop signature (`export function NoProfileFallback()`), and its default-export/import path **must not change** or all 11 call sites break.

Identifiers inside the component that MUST remain wired:

| Identifier | Current line | Contract |
|---|---|---|
| `import { useApp } from "../store/app";` | 6 | Store hook — keep the import path. |
| `const toOnboarding = () => useApp.setState({ onboarded: false, activeProfileId: null });` | 10 | **The escape-hatch navigation.** Both keys must be set together — this is what makes `App.tsx` re-render `Onboarding`. Keep this exact `setState` payload wired to the primary button's `onClick`. |
| `import { Button, Icon, Wordmark } from "./ui";` | 7 | Reskin may restyle these but must keep using the shared primitives (`Button variant/size`, `Icon name=…`, `Wordmark`). Do not inline a raw `<button>`. |
| `<Button size="lg" variant="primary" onClick={toOnboarding}>` | 29 | Primary CTA must call `toOnboarding`. `variant="primary"` = teal fill; keep the springy button. |
| `onClick={toOnboarding}` | 29 | Sole navigation handler on this screen. |

Notes:
- The current component has **no `t()` calls** — it hardcodes bilingual strings inline (`No profile yet · لا يوجد ملف بعد`). The reskin SHOULD migrate these to `t()` keys (see §3/§4) but that is additive; the load-bearing contract is the `toOnboarding` setState, not the copy.
- No recognizer/camera hooks are used by `NoProfileFallback` itself — the camera-permission / live-edge states below are **new surfaces** to be introduced by their owning screens (CameraPractice / FirstSign already gate on `!profile` first). This spec documents their target design so the camera screens can adopt it; it does not require rewiring the recognizer from within `NoProfileFallback`.

---

## 2 · LAYOUT — target design (ordered blocks)

All state cards share one device frame + one three-zone column (statusbar → centered body → footer buttons). Values below are literal from the `.dc.html`.

### Shared device shell (all states)
- Device frame: `width:322px; height:660px; background:#16302E; border-radius:47px; padding:7px; box-shadow:0 24px 60px rgba(22,48,46,.28)`.
- Screen inside: `border-radius:40px; overflow:hidden; display:flex; flex-direction:column; background:#F6EFE3` (paper/1-ish canvas). **Offline card uses the same `#F6EFE3`.**
- `dir` = `ltr` (EN) / `rtl` (AR) on the frame root.
- In-app statusbar: `height:34px; padding:0 24px; justify-content:space-between`.
  - Time `9:41` — `font:700 13px/1 Rubik; color:#16302E` (never mirrors, always left-of-clock-glyph position per RTL rules).
  - Notch pill: `top:9px; left:50%; translateX(-50%); width:74px; height:20px; background:#16302E; border-radius:99px; opacity:.5`.
  - Battery glyph: `width:16px; height:9px; border:1.5px solid #16302E; border-radius:3px`.
  - **Offline only:** prepend `OFFLINE` label — `font:700 9px/1 ui-monospace,Menlo; color:#C54F3A`, sits inline-before the battery glyph.

### Body zone (centered)
`flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:12px 30px 0`.

**Block A — Icon/Mascot zone** (one of two):
- **Camera glyph** (permission + denied only): `120px×120px; border-radius:34px; box-shadow:0 12px 30px rgba(22,48,46,.16)`.
  - bg = `#0F6E6A` (permission) / `#C54F3A` (denied).
  - Animation: `pulseRing 2s ease-out infinite` (permission) / `none` (denied). `@keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(15,110,106,.35)}70%{box-shadow:0 0 0 18px rgba(15,110,106,0)}100%{box-shadow:0 0 0 0 rgba(15,110,106,0)}}`.
  - Inner camera body: `56×42px; border-radius:11px; background:#FBF7EF`; lens = `20×20px` circle, `border:4px solid <iconBg>`, centered `top:11px`; flash bump `18×9px; border-radius:4px 4px 0 0; background:#FBF7EF; top:-7px; left:14px`.
  - **Denied strike-through:** `130px×6px; border-radius:99px; background:#C54F3A; transform:rotate(-45deg)` overlaid on the glyph (never mirrors).
- **Fanan mascot** (no-camera, empty·signs, empty·family, offline): wrapper `animation:float 3s ease-in-out infinite` (`@keyframes float{0%,100%{translateY(0)}50%{translateY(-6px)}}`), `<Fanan pose={…} scale=1.05>` at ~128px.
  - Pose map: **empty·signs → `think`**, **empty·family → `wave`**, **no-camera → `idle`**, **offline → `sad`**. (Screenshots 04-states + 01/02-live all render the `sad` fennec for offline/denied.)

**Block B — Title:** `font:800 28px/1.12 Rubik; color:#16302E; margin-top:22px; max-width:260px; animation:rise .4s ease both` (`@keyframes rise{0%{translateY(14px);opacity:0}100%{translateY(0);opacity:1}}`).

**Block C — Body copy:** `font:400 15px/1.5 'Readex Pro'; color:#5C726F; max-width:256px; margin-top:8px`.

**Block D — Privacy badge** (permission only): pill `display:flex; align-items:center; gap:8px; background:#F6EFE3; border:1px solid #EDE3D2; border-radius:99px; padding:9px 15px; margin-top:16px`. Dot = `9×9px; border-radius:50%; background:#1F8A5B; box-shadow:0 0 0 4px rgba(31,138,91,.18)`. Text = `font:700 12px/1 'Readex Pro'; color:#16302E`.

**Block E — Re-enable steps card** (denied only): `width:100%; background:#FBF7EF; border:1px solid #EDE3D2; border-radius:16px; padding:14px; margin-top:18px; text-align:start`. Each step row: `gap:10px; align-items:center; margin-bottom:9px`. Number chip = `22×22px; border-radius:50%; background:#0F6E6A; color:#FBF7EF; font:800 11px Rubik`. Step text = `font:500 13px/1.3 'Readex Pro'; color:#16302E`. AR numbers use `١٢٣`.

### Footer zone (buttons)
`flex:none; padding:12px 30px 20px; display:flex; flex-direction:column; gap:9px`.
- **Primary CTA:** `width:100%; height:54px; border-radius:17px; font:700 16px/1 Rubik; box-shadow:0 5px 0 <ctaShadow>`. On press: `transform:translateY(4px); box-shadow:0 1px 0 <ctaShadow>` (springy). Colors by state:
  - permission / no-camera / empty·signs / **empty·no-profile**: bg `#0F6E6A`, shadow `#0A4F4C`, text `#FBF7EF`.
  - denied / offline / empty·family: bg `#E8654C`, shadow `#C54F3A`, text `#FBF7EF`.
- **Secondary (text) button** (permission, denied, empty·family, offline): `background:none; color:#5C726F; font:600 14px/1 'Readex Pro'; padding:8px`.

### Live-grader edge states (from `Sawiyya Live States.dc.html`)
Same device shell, `background:#F6EFE3`. Statusbar z-index 6.

**Permission primer** (richer permission variant, screenshot states2.png):
- Icon: `112×112px; border-radius:32px; background:#0F6E6A; font-size:52px 📷; box-shadow:0 12px 28px rgba(15,110,106,.32); animation:float 3s`.
- Title `font:800 25px/1.15 Rubik; #16302E; margin-top:24px`; body `400 15px/1.5 'Readex Pro'; #5C726F; margin-top:10px; max-width:250px`.
- Lock chip: `background:#FBF7EF; border:1px solid #EDE3D2; border-radius:14px; padding:12px 14px; max-width:270px; text-align:start`. Icon bubble `30×30px; border-radius:50%; background:#E9F5EE; 🔒 15px`. Text `500 12px/1.4 'Readex Pro'; #16302E`.
- Footer: primary teal (`#0F6E6A`/shadow `#0A4F4C`, height 54, radius 17) + text skip (`transparent; #5C726F; 600 14px; height:40px`).

**Permission denied (live variant):** Fanan `pose="sad"`; title `800 23px/1.16 Rubik`; body `400 14.5px/1.5`. Steps card `background:#FBF7EF; border:1px solid #EDE3D2; border-radius:16px; padding:6px 4px`; each row `padding:9px 12px; gap:11px`; number chip `24×24px; #0F6E6A/#FBF7EF; 700 12px Rubik`; text `500 13px/1.35`. Footer: single teal "Open Settings".

**Camera edge states (no-hand / too-dark / out-of-frame):**
- Header (outside viewport): title `800 21px/1.1 Rubik; #16302E`; sub `400 12.5px/1.4 'Readex Pro'; #5C726F; margin-top:4px`.
- Camera viewport: `flex:1; border-radius:26px; overflow:hidden`. bg (normal) = `repeating-linear-gradient(135deg,#16302E,#16302E 16px,#1d3d3a 16px,#1d3d3a 32px)`; (dark) = `repeating-linear-gradient(135deg,#0c1a19,#0c1a19 16px,#122421 16px,#122421 32px)`.
- **PAUSED badge** (top, inset-inline-start:12px): `background:rgba(90,100,98,.85); border-radius:99px; padding:5px 10px`; gold dot `7×7px #F0C879`; label `800 10px/1 ui-monospace; #FBF7EF; letter-spacing:.1em`.
- **Confidence ring** (top, inset-inline-end:12px): `52×52px; border-radius:50%; border:4px solid rgba(240,200,121,.28)`; shows `--` in `800 17px/1 Rubik; color:rgba(251,247,239,.85)` (never a `0`).
- No-hand: dashed target `150×170px; border:3px dashed rgba(240,200,121,.85); border-radius:26px; animation:framepulse 1.8s`; faint ✋ `46px; opacity:.32`.
- Out-of-frame: ✋ `96px; filter:blur(1px); animation:swing 2.4s` at `inset-inline-end:-24px`; plus static dashed frame `border:3px dashed rgba(240,200,121,.7)`.
- Too-dark: veil `inset:0; background:rgba(0,0,0,.55)`; 🌙 `46px; opacity:.6`.
- Guidance banner (bottom, `inset-inline-start:14px; inset-inline-end:14px`): `background:rgba(251,247,239,.96); border-radius:16px; padding:13px 15px; box-shadow:0 8px 20px rgba(0,0,0,.28)`. Icon bubble `34×34px; border-radius:50%; background:<badgeBg>` (`#FCEFCF` no-hand/frame, `#E6E9EE` dark); banner title `700 14px/1.15 Rubik; #16302E`; tip `400 12px/1.35 'Readex Pro'; #5C726F`.

---

## 3 · COPY table (every visible string)

Reuse existing keys where they already carry the meaning; otherwise the proposed new key is in §4.

| Key | English | Arabic (verbatim) |
|---|---|---|
| **Permission (States)** | | |
| `stPermTitle` | Let's turn on your camera | لنفعّل كاميرتك |
| `stPermBody` | Sawiyya watches your hands so it can grade your signs — gently. | ترى سويّة يديك لتقيّم إشاراتك — برفق. |
| `stPermBadge` | 100% on-device · nothing is uploaded | ١٠٠٪ على الجهاز · لا شيء يُرفع |
| `stPermCta` | Allow camera | السماح بالكاميرا |
| `stNotNow` | Not now | ليس الآن |
| **Denied (States)** | | |
| `stDeniedTitle` | Your camera is off | كاميرتك مُطفأة |
| `stDeniedBody` | No worries — flip it back on in two taps whenever you're ready. | لا بأس — أعِد تشغيلها بنقرتين متى شئت. |
| `stOpenSettings` | Open Settings | فتح الإعدادات |
| `stKeepOff` | Keep it off for now | أبقِها مطفأة الآن |
| `stStep1` | Open your phone's Settings | افتح إعدادات هاتفك |
| `stStep2` | Tap Sawiyya | اختر سويّة |
| `stStep3` | Turn on Camera | فعّل الكاميرا |
| **No camera (States)** | | |
| `stNoCamTitle` | No camera? No problem. | لا كاميرا؟ لا مشكلة. |
| `stNoCamBody` | You can still watch every signer demo and learn the shapes. Grading unlocks when a camera's available. | يمكنك مشاهدة كل العروض وتعلّم الأشكال. يُفتح التقييم عند توفّر كاميرا. |
| `stBrowseSigns` | Browse the signs → | تصفّح الإشارات ← |
| **Empty · no signs** | | |
| `stEmptySignsTitle` | Your oasis is waiting | واحتك بانتظارك |
| `stEmptySignsBody` | You haven't learned a sign yet — let's plant the first one together. | لم تتعلّم إشارة بعد — لنزرع الأولى معًا. |
| `stLearnFirst` | Learn my first sign | تعلّم أول إشارة |
| **Empty · no family** | | |
| `stEmptyFamTitle` | Better together | أفضل معًا |
| `stEmptyFamBody` | Learning to sign is a shared act. Invite someone to learn with you. | تعلّم الإشارة فعلٌ مشترك. ادعُ من يتعلّم معك. |
| `stInviteFamily` | Invite family | ادعُ العائلة |
| `stMaybeLater` | Maybe later | ربما لاحقًا |
| **Offline** | | |
| `stOfflineLabel` | OFFLINE | غير متصل *(statusbar glyph stays Latin `OFFLINE` per design; AR panel keeps `OFFLINE` mono — see note)* |
| `stOfflineTitle` | You're offline | أنت غير متصل |
| `stOfflineBody` | That's okay — sign grading runs on your device. Your family feed will sync the moment you're back. | لا بأس — يعمل تقييم الإشارات على جهازك. ستُزامَن أخبار عائلتك فور عودتك. |
| `stTryAgain` | Try again | أعِد المحاولة |
| `stKeepPractising` | Keep practising offline | واصل التمرّن دون اتصال |
| **Empty · no profile (NoProfileFallback — reskin target)** | | |
| `appName` *(existing)* | sawiyya | سويّة |
| `stNoProfileTitle` | No profile yet | لا يوجد ملف بعد |
| `stNoProfileBody` | Set up a profile to start signing | أنشئ ملفًا لتبدأ الإشارة |
| `stSetUpProfile` | Set up profile | إنشاء ملف |
| **Permission primer (Live)** | | |
| `stPrimerTitle` | Sawiyya needs your camera | تحتاج سويّة إلى كاميرتك |
| `stPrimerBody` | It watches your hands so it can grade your signs in real time — that's the whole app. | تراقب يديك لتقيّم إشاراتك مباشرةً — هذا هو جوهر التطبيق. |
| `stPrimerLock` | Everything runs on-device. No video ever leaves your phone. | كل شيء يعمل على الجهاز. لا يغادر أيّ فيديو هاتفك أبدًا. |
| `stEnableCamera` | Enable camera | تفعيل الكاميرا |
| `stMaybeLaterAlt` | Maybe later | ربّما لاحقًا |
| **Permission denied (Live)** | | |
| `stDeniedLiveTitle` | Your camera is switched off | كاميرتك مُطفأة |
| `stDeniedLiveBody` | We can't grade a sign we can't see. Flip it back on and Fanan's ready when you are. | لا يمكننا تقييم إشارة لا نراها. أعِد تشغيلها وفَنَن جاهز متى استعددت. |
| `stDenStep1` | Open your phone Settings | افتح إعدادات هاتفك |
| `stDenStep2` | Find Sawiyya in the app list | ابحث عن سويّة في قائمة التطبيقات |
| `stDenStep3` | Turn Camera back on | أعِد تفعيل الكاميرا |
| **Live edge — paused / ring** | | |
| `stPaused` | PAUSED | متوقّف |
| **Live edge — no hand** | | |
| `stNoHandTitle` | Ready when you are | جاهزون متى استعددت |
| `stNoHandSub` | Show your hand to start grading | أظهر يدك لبدء التقييم |
| `stNoHandBanner` | We can't see your hand | لا نرى يدك |
| `stNoHandTip` | Hold it inside the frame | ضعها داخل الإطار |
| **Live edge — too dark** | | |
| `stDarkTitle` | It's a bit dark | الإضاءة خافتة قليلًا |
| `stDarkSub` | The grader needs to see clearly | يحتاج المُقيّم إلى رؤية واضحة |
| `stDarkBanner` | Too dark to read your sign | الإضاءة خافتة لقراءة إشارتك |
| `stDarkTip` | Move somewhere brighter | انتقل إلى مكان أكثر إضاءة |
| **Live edge — out of frame** | | |
| `stFrameTitle` | Almost there | اقتربتَ كثيرًا |
| `stFrameSub` | Keep your hand centred | أبقِ يدك في المنتصف |
| `stFrameBanner` | Your hand's out of frame | يدك خارج الإطار |
| `stFrameTip` | Bring your whole hand into view | أدخِل يدك كاملةً إلى الرؤية |

Note on `stOfflineLabel`: the design renders the mono statusbar chip as Latin `OFFLINE` in **both** panels (it's a system-style indicator). Keep it literal `OFFLINE` for both langs, OR wire it as a key with `ar: "غير متصل"` if product wants it localised — design shows Latin. Build agent: default to Latin `OFFLINE` both sides to match the reference.

Existing keys that already cover some meanings (prefer over new ones where a call site already uses them): `camBlocked` (camera-blocked line), `camPrivacy` (on-device privacy line), `setCameraPermission`, `setGranted`/`setNotGranted`, `camTryAgain` (= "Try again" — but AR differs: existing `camTryAgain.ar = "حاول مجددًا"` vs offline design `"أعِد المحاولة"`; use the new `stTryAgain` for the offline state to match the design copy exactly).

---

## 4 · NEW-I18N (append to `src/i18n.ts` `dict`, before the closing `} satisfies`)

Every key below is NOT already in `i18n.ts`. Drop-in block:

```ts
  // states — permission / empty / error / offline
  stPermTitle: { en: "Let's turn on your camera", ar: "لنفعّل كاميرتك" },
  stPermBody: { en: "Sawiyya watches your hands so it can grade your signs — gently.", ar: "ترى سويّة يديك لتقيّم إشاراتك — برفق." },
  stPermBadge: { en: "100% on-device · nothing is uploaded", ar: "١٠٠٪ على الجهاز · لا شيء يُرفع" },
  stPermCta: { en: "Allow camera", ar: "السماح بالكاميرا" },
  stNotNow: { en: "Not now", ar: "ليس الآن" },

  stDeniedTitle: { en: "Your camera is off", ar: "كاميرتك مُطفأة" },
  stDeniedBody: { en: "No worries — flip it back on in two taps whenever you're ready.", ar: "لا بأس — أعِد تشغيلها بنقرتين متى شئت." },
  stOpenSettings: { en: "Open Settings", ar: "فتح الإعدادات" },
  stKeepOff: { en: "Keep it off for now", ar: "أبقِها مطفأة الآن" },
  stStep1: { en: "Open your phone's Settings", ar: "افتح إعدادات هاتفك" },
  stStep2: { en: "Tap Sawiyya", ar: "اختر سويّة" },
  stStep3: { en: "Turn on Camera", ar: "فعّل الكاميرا" },

  stNoCamTitle: { en: "No camera? No problem.", ar: "لا كاميرا؟ لا مشكلة." },
  stNoCamBody: { en: "You can still watch every signer demo and learn the shapes. Grading unlocks when a camera's available.", ar: "يمكنك مشاهدة كل العروض وتعلّم الأشكال. يُفتح التقييم عند توفّر كاميرا." },
  stBrowseSigns: { en: "Browse the signs →", ar: "تصفّح الإشارات ←" },

  stEmptySignsTitle: { en: "Your oasis is waiting", ar: "واحتك بانتظارك" },
  stEmptySignsBody: { en: "You haven't learned a sign yet — let's plant the first one together.", ar: "لم تتعلّم إشارة بعد — لنزرع الأولى معًا." },
  stLearnFirst: { en: "Learn my first sign", ar: "تعلّم أول إشارة" },

  stEmptyFamTitle: { en: "Better together", ar: "أفضل معًا" },
  stEmptyFamBody: { en: "Learning to sign is a shared act. Invite someone to learn with you.", ar: "تعلّم الإشارة فعلٌ مشترك. ادعُ من يتعلّم معك." },
  stInviteFamily: { en: "Invite family", ar: "ادعُ العائلة" },
  stMaybeLater: { en: "Maybe later", ar: "ربما لاحقًا" },

  stOfflineLabel: { en: "OFFLINE", ar: "OFFLINE" },
  stOfflineTitle: { en: "You're offline", ar: "أنت غير متصل" },
  stOfflineBody: { en: "That's okay — sign grading runs on your device. Your family feed will sync the moment you're back.", ar: "لا بأس — يعمل تقييم الإشارات على جهازك. ستُزامَن أخبار عائلتك فور عودتك." },
  stTryAgain: { en: "Try again", ar: "أعِد المحاولة" },
  stKeepPractising: { en: "Keep practising offline", ar: "واصل التمرّن دون اتصال" },

  stNoProfileTitle: { en: "No profile yet", ar: "لا يوجد ملف بعد" },
  stNoProfileBody: { en: "Set up a profile to start signing", ar: "أنشئ ملفًا لتبدأ الإشارة" },
  stSetUpProfile: { en: "Set up profile", ar: "إنشاء ملف" },

  // states — live grader edge cases
  stPrimerTitle: { en: "Sawiyya needs your camera", ar: "تحتاج سويّة إلى كاميرتك" },
  stPrimerBody: { en: "It watches your hands so it can grade your signs in real time — that's the whole app.", ar: "تراقب يديك لتقيّم إشاراتك مباشرةً — هذا هو جوهر التطبيق." },
  stPrimerLock: { en: "Everything runs on-device. No video ever leaves your phone.", ar: "كل شيء يعمل على الجهاز. لا يغادر أيّ فيديو هاتفك أبدًا." },
  stEnableCamera: { en: "Enable camera", ar: "تفعيل الكاميرا" },
  stMaybeLaterAlt: { en: "Maybe later", ar: "ربّما لاحقًا" },

  stDeniedLiveTitle: { en: "Your camera is switched off", ar: "كاميرتك مُطفأة" },
  stDeniedLiveBody: { en: "We can't grade a sign we can't see. Flip it back on and Fanan's ready when you are.", ar: "لا يمكننا تقييم إشارة لا نراها. أعِد تشغيلها وفَنَن جاهز متى استعددت." },
  stDenStep1: { en: "Open your phone Settings", ar: "افتح إعدادات هاتفك" },
  stDenStep2: { en: "Find Sawiyya in the app list", ar: "ابحث عن سويّة في قائمة التطبيقات" },
  stDenStep3: { en: "Turn Camera back on", ar: "أعِد تفعيل الكاميرا" },

  stPaused: { en: "PAUSED", ar: "متوقّف" },

  stNoHandTitle: { en: "Ready when you are", ar: "جاهزون متى استعددت" },
  stNoHandSub: { en: "Show your hand to start grading", ar: "أظهر يدك لبدء التقييم" },
  stNoHandBanner: { en: "We can't see your hand", ar: "لا نرى يدك" },
  stNoHandTip: { en: "Hold it inside the frame", ar: "ضعها داخل الإطار" },

  stDarkTitle: { en: "It's a bit dark", ar: "الإضاءة خافتة قليلًا" },
  stDarkSub: { en: "The grader needs to see clearly", ar: "يحتاج المُقيّم إلى رؤية واضحة" },
  stDarkBanner: { en: "Too dark to read your sign", ar: "الإضاءة خافتة لقراءة إشارتك" },
  stDarkTip: { en: "Move somewhere brighter", ar: "انتقل إلى مكان أكثر إضاءة" },

  stFrameTitle: { en: "Almost there", ar: "اقتربتَ كثيرًا" },
  stFrameSub: { en: "Keep your hand centred", ar: "أبقِ يدك في المنتصف" },
  stFrameBanner: { en: "Your hand's out of frame", ar: "يدك خارج الإطار" },
  stFrameTip: { en: "Bring your whole hand into view", ar: "أدخِل يدك كاملةً إلى الرؤية" },
```

(45 new keys.)

---

## 5 · MOTION / STATES

Keyframes to port (literal from source):
- `float` — `0%,100%{translateY(0)} 50%{translateY(-6px)}` (States) / `translateY(-7px)` (Live), `3s ease-in-out infinite`. Mascot + primer camera glyph idle bob.
- `rise` — `0%{translateY(14px);opacity:0} 100%{translateY(0);opacity:1}`, `.4s ease both`. Title entrance on every state card.
- `pulseRing` — permission camera glyph only, `2s ease-out infinite` (see §2 Block A). Disabled (`none`) for denied.
- `framepulse` — no-hand dashed target, `0%,100%{scale(1);opacity:.85} 50%{scale(1.05);opacity:.5}`, `1.8s ease-in-out infinite`.
- `swing` — out-of-frame ✋, `0%,100%{rotate(-9deg)} 50%{rotate(9deg)}`, `2.4s ease-in-out infinite`.
- `livedot`, `spin` — declared in Live source but the edge-state cards use the static `--` ring (paused); include only if wiring the active grading ring elsewhere.

Interactive / button motion: springy CTA — press = `translateY(4px)` + shadow collapses to `0 1px 0 <shadow>`, `transition:all .08s`. (Matches HANDOFF §Motion "Spring out".)

State semantics (from source footnotes — enforce these):
- Live badge dims to **PAUSED**, never "Error".
- Confidence ring shows **`--`**, never a `0` score.
- Fanan appears **only** on the permission-wall / empty / offline moments that need reassurance — NOT inside the live camera viewport.
- Every state has a forward action (primary CTA) + most have a soft escape (secondary). **No dead ends.**

Reduce-motion (HANDOFF §Motion): freeze `float` / `pulseRing` / `framepulse` / `swing`; keep instant state swap. Screen enter/exit use Ease-out `0,0,.2,1` 240ms (push) / Ease-in `.4,0,1,1` 180ms (pop); RTL enters from the leading (left) edge.

---

## 6 · RTL (mirror vs never-mirror)

**Mirrors** (swap with `dir="rtl"` + logical props):
- Reading flow / text alignment of title, body, steps card (`text-align:start`).
- Statusbar layout order (time ↔ battery swap sides via `justify-content:space-between`).
- Re-enable step rows: number chip leads the start edge; use `gap` + flex order, not fixed left.
- Banner + PAUSED badge + confidence ring positions: already authored with `inset-inline-start` / `inset-inline-end` — keep logical, they auto-mirror.
- Directional arrow in "Browse the signs" — EN `→`, AR `←` (already flipped verbatim in copy).
- Secondary/skip button reading order.
- Numerals: step numbers use Eastern-Arabic `١٢٣` in AR; privacy badge `١٠٠٪` with trailing `٪`.

**Never mirrors** (HANDOFF §2 — physical/glyph invariants):
- **Fanan** (fox mascot) — same character, same facing, both panels.
- **Checkmark / success glyphs.**
- **Camera glyph & 📷 icon, play/record glyphs** — physical device iconography, identical both sides.
- **Handshape emoji ✋ / hand-skeleton overlay** — sign language is physical; never flip.
- **Statusbar clock `9:41`** and the `OFFLINE` mono chip — system indicators, stay as-is.
- The denied strike-through bar (`rotate(-45deg)`) — keep same rotation both panels.
- Lock 🔒 / moon 🌙 icons — no mirror.
- Confidence ring `--`, PAUSED gold dot — no mirror.

Author the **AR panel first** (dir="rtl", logical properties) per HANDOFF §2, then let LTR fall out.
