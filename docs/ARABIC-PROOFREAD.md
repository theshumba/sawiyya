# Arabic strings pending native proofread

Machine-written Arabic must be checked by a native speaker (Ahmed qualifies — see
audit M29) before Mada submission. Every NEW/CHANGED Arabic string added by the
overhaul batches is logged here with its source location and English pair.

Format: `location` · EN → **AR**

## Batch 1 — Truth pass (2026-07-02)

### App (`src/i18n.ts` unless noted)

- `fsDemoSub` · "The average handshape from real signers (Zenodo ArSL)" → **متوسط شكل اليد من مُشيرين حقيقيين (Zenodo ArSL)**
- `fsSignerTag` · "REAL HANDSHAPE" → **شكل يد حقيقي**
- `obCamBody` · "Watch the handshape demo, then sign it back. Fanan checks your handshape live." → **شاهد عرض شكل اليد ثم أعِد الإشارة. يتحقّق فَنَن من إشارتك مباشرة.**
- `aboutTitle` · "Built to meet the Deaf community as equals" → **بُني للقاء مجتمع الصمّ كأنداد**
- `aboutCredits` · "The 28-letter alphabet is graded from real signers' hands in the open Zenodo ArSL dataset (CC-BY-4.0) — thank you to everyone who contributed to it. Recordings by Deaf Qatari signers arrive in Phase 2." → **تُقيَّم الحروف الـ٢٨ من أيدي مُشيرين حقيقيين في مجموعة بيانات Zenodo ArSL المفتوحة (CC-BY-4.0) — شكرًا لكل من ساهم فيها. تسجيلات مُشيرين قطريين صُمّ قادمة في المرحلة الثانية.**
- `prLeagueBody` · "Growing together." → **ننمو معًا.**
- `prLeagueSolo` (new) · "It's just you so far — add family members and you'll grow here together." → **أنت وحدك حتى الآن — أضف أفراد عائلتك لتنموا هنا معًا.**
- `practiseWordsSub` · "4 camera · 12 watch" → **٤ بالكاميرا · ١٢ للمشاهدة**
- `a1AslProvenance` (new) · "Adapted from ASL — not yet verified as Qatari Sign Language. A Deaf Qatari signer records the native versions in Phase 2." → **مقتبسة من لغة الإشارة الأمريكية — لم تُعتمد بعد بلغة الإشارة القطرية. سيسجّل النسخ الأصلية شخص أصم قطري في المرحلة الثانية.**
- `prDrillsDone` (new) · "Drills completed" → **تمارين مكتملة**
- `prBestStreak` · "Current streak" → **التتابع الحالي**
- `src/screens/InfoPages.tsx` badge · "Mada Innovation Award 2026 entry" → **مشاركة في جائزة مدى للابتكار ٢٠٢٦**
- `src/screens/Settings.tsx` footer · "© 2026 Sawiyya" → **© ٢٠٢٦ سويّة**
- `src/screens/FlagPicker.tsx` summary heading · "{n} signs flagged for your family" → **{n} إشارات محدّدة لعائلتك**
- `src/components/SignDemo.tsx` caption (fixed توقيعات mistranslation) · "Average hand from real signers (Zenodo ArSL). Deaf-signer video lands in Phase 2." → **متوسط اليد من مُشيرين حقيقيين (Zenodo ArSL). فيديو من شخص أصمّ في المرحلة الثانية.**
- `src/components/SignDemo.tsx` pill · "Unverified as QSL" → **غير معتمدة بلغة الإشارة القطرية**
- `lsSignerDemo` / `loopSignerCap` / `signSignerDemo` · "SIGN DEMO" (was "SIGNER DEMO" — no signer footage exists yet) → **عرض الإشارة**

### Landing (`~/Desktop/Projects/sawiyya-landing/index.html`, `data-ar` attributes)

- Hero eyebrow · "See Sawiyya in action" → **شاهد سويّة مباشرة**
- Hero sub · "Real camera practice from the app — your first sign takes about 3 minutes, just you and your camera." → **تمرين حقيقي بالكاميرا من التطبيق — إشارتك الأولى تستغرق نحو ٣ دقائق، أنت وكاميرتك فقط.**
- Hero CTA · "Start learning →" → **ابدأ التعلّم ←**
- How-it-works step 1 · "A clear, looping demo shows you the exact handshape — built from real signers' hands in open Arabic sign-language data. Deaf Qatari signer videos come in Phase 2." → **عرضٌ واضح ومتكرر يُريك شكل اليد بدقة — مأخوذ من أيدي مُشيرين حقيقيين في بيانات مفتوحة للغة الإشارة العربية. فيديوهات مُشيرين صُمّ قطريين قادمة في المرحلة الثانية.**
- QSL live card · "Live now — the full 28-letter alphabet, camera-graded on your device with instant feedback. Deaf Qatari signers join in Phase 2." → **متاحة الآن — الأبجدية كاملة بحروفها الـ٢٨، بتقييم فوري بالكاميرا على جهازك. مُشيرون صُمّ قطريون في المرحلة الثانية.**
- Movement heading · "Be among the first to meet halfway." → **كن من أوائل من يلتقون في منتصف الطريق.**
- Early-family invite · "Sawiyya is brand new — the very first families are starting now. Learn your first signs together, tell us what matters to your family, and help shape what we build next." → **سويّة جديدة تمامًا — العائلات الأولى تبدأ رحلتها الآن. تعلّموا إشاراتكم الأولى معًا، وأخبرونا بما يهمّ عائلتك، وساعدونا في تشكيل ما نبنيه.**
- Early-family CTA · "Be an early family →" → **كن عائلة من الأوائل ←**
- Impact stat · "camera-graded letters — the full Arabic alphabet, from day one" → **حرفًا مُقيَّمًا بالكاميرا — الأبجدية العربية كاملة، من يومك الأول**

## Batch 2 — Deploy & state safety net (2026-07-02)

### App (`src/i18n.ts`)

Error boundary (H12):

- `ebTitle` · "Something went wrong" → **حدث خطأ ما**
- `ebBody` · "An unexpected error stopped this screen. Your progress is saved on this device — reloading usually fixes it." → **أوقف خطأ غير متوقع هذه الشاشة. تقدمك محفوظ على هذا الجهاز — وإعادة التحميل عادةً ما تحل المشكلة.**
- `ebRetry` · "Try again" → **حاول مجددًا**
- `ebReload` · "Reload the app" → **أعد تحميل التطبيق**
- `ebResetHint` · "Still stuck after reloading?" → **ما زالت المشكلة بعد إعادة التحميل؟**
- `ebReset` · "Reset app data (last resort)" → **امسح بيانات التطبيق (كحل أخير)**
- `ebResetConfirm` · "This deletes ALL Sawiyya data on this device — every profile, all progress and your teach-mode recordings. This cannot be undone. Continue?" → **سيؤدي هذا إلى حذف كل بيانات سويّة على هذا الجهاز — جميع الملفات الشخصية وكل التقدم وتسجيلات وضع التعليم. لا يمكن التراجع عن ذلك. هل تريد المتابعة؟**

Storage recovery notice (M21):

- `recoveryTitle` · "We couldn't read your saved progress" → **تعذّرت قراءة تقدمك المحفوظ**
- `recoveryBody` · "The data saved on this device was damaged, so the app has started fresh. A backup copy of the damaged data is kept on this device." → **تلفت البيانات المحفوظة على هذا الجهاز، فبدأ التطبيق من جديد. احتفظنا بنسخة احتياطية من البيانات التالفة على جهازك.**
- `recoveryDismiss` · "OK" → **حسنًا**

## Batch 3 — Funnel & measurement honesty (2026-07-02)

### App (`src/i18n.ts`)

- `obCamEyebrow` (edited — dropped the dangling "· 1" after the camera+privacy merge) · "How it works" → **كيف يعمل**
- `obRemindBody` (rewritten honest — the app sends no notifications) · "Sawiyya doesn't send notifications — nothing leaves your device. Want a daily nudge? Add a practice reminder to your own calendar." → **سويّة لا ترسل إشعارات — لا شيء يغادر جهازك. أتريد تذكيرًا يوميًا؟ أضِف موعد تدريب إلى تقويمك.**
- `obRemindEventTitle` (new — .ics event summary + preview card) · "Practise Sawiyya" → **تمرّن على سويّة**
- `obRemindEventWhen` (new) · "Every day · 6:00 pm · in your calendar" → **كل يوم · ٦:٠٠ مساءً · في تقويمك**
- `obRemindCal` (new) · "Add to my calendar (.ics)" → **أضِفه إلى تقويمي (.ics)**
- `obRemindCalDone` (new) · "Downloaded — open it to add the reminder" → **تم التنزيل — افتحه لإضافة التذكير**

### Landing (`~/Desktop/Projects/sawiyya-landing/index.html`, notify-me pills)

- Notify-me confirmation (shown only after the PostHog event is captured) · "Interest noted ✓" → **سجّلنا اهتمامك ✓**

## Step 1 — Batch 4 core loop (2026-07-03)

### App (`src/i18n.ts` + inline pairs)

- `camStillTricky` (new — 20s soft-fail banner, demo replays) · "Still tricky — let's see it again" → **ما زالت صعبة — لنشاهدها من جديد**
- `reviewCapDone` (new — daily review cap reached) · "30 done today — the rest will wait for tomorrow" → **أنجزت ٣٠ مراجعة اليوم — والبقية تنتظر حتى الغد**
- `homeNewLetter` (new — empty-queue new-content offer) · "Learn a new letter" → **تعلّم حرفًا جديدًا**
- `homeNewLetterSub` (new) · "Nothing due right now — start the next letter" → **لا شيء مستحق الآن — ابدأ الحرف التالي**
- LessonPlayer capped-review sub (inline) · "Spacing the load out is how it sticks — see you tomorrow." → **توزيع المراجعة هو سرّ ثباتها — نراك غدًا.**

## Step 2 — Batch 5 Family Mode (2026-07-03)

### App (`src/i18n.ts`)

- `famDataLocal` (new — single-device disclosure, Family + Settings) · "Your family's data lives on this device — export it from Settings to move or back it up." → **بيانات عائلتك محفوظة على هذا الجهاز — صدّرها من الإعدادات لنقلها أو نسخها احتياطيًا.**
- `famClearMine` (new — H7-scoped clear) · "Clear my flags" → **مسح إشاراتي**
- `famCoRequested` (new — non-raiser tap on an existing flag) · "You asked for this too" → **طلبتها أنت أيضًا**
- `famAskToo` (new — dictionary detail co-request affordance) · "Ask for this too" → **اطلبها أنت أيضًا**
- `setHousehold` (new — Settings group) · "Household data" → **بيانات الأسرة**
- `setExport` (new) · "Export household (JSON file)" → **تصدير بيانات الأسرة (ملف JSON)**
- `setExportDone` (new) · "Saved — keep the file somewhere safe." → **تم الحفظ — احتفظ بالملف في مكان آمن.**
- `setImport` (new) · "Import household" → **استيراد بيانات الأسرة**
- `setImportConfirmTitle` (new) · "Replace everything on this device?" → **استبدال كل شيء على هذا الجهاز؟**
- `setImportConfirmBody` (new) · "Importing replaces every profile, flag and progress record on this device with the file's contents. This cannot be undone." → **الاستيراد يستبدل جميع الملفات الشخصية والإشارات المحددة وسجل التقدم على هذا الجهاز بمحتوى الملف. لا يمكن التراجع عن هذا.**
- `setImportReplace` (new) · "Replace & restart" → **استبدل وأعد التشغيل**
- `setImportInvalid` (new) · "That file isn't a Sawiyya household export." → **هذا الملف ليس ملف تصدير أسرة من سويّة.**

## Step 0 — Adversarial review fixes (2026-07-03)

### Landing (`~/Desktop/Projects/sawiyya-landing/index.html`, `data-ar` attributes)

- Hero showcase pill (was "QSL"/"قطر" — removed the ASL-as-QSL mislabel) · "Live demo" → **عرض مباشر**
- Hero sub (rewritten — replaces the Batch 1 entry above; the app's first graded content is the alphabet, not ILY) · "Real camera practice from the app — you start with the Arabic alphabet, and your first letter takes about 3 minutes." → **تمرين حقيقي بالكاميرا من التطبيق — تبدأ بالحروف الأبجدية، وحرفك الأول يستغرق نحو ٣ دقائق.**
- Camera-mock goal (was "الإشارة: أحبّك") · "Sign: Alif" → **الإشارة: ألف**
- Camera-mock success (was "أحسنت — هذه «أحبّك»!") · "Correct — that's Alif!" → **أحسنت — هذا حرف الألف!**

## Step 3 — Batch 6 alphabet curriculum + fingerspelling (2026-07-03)

### App (`src/content/signs.ts` — curriculum data)

- `UNIT_ALPHA.titleAr` (new — alphabet unit banner) · "The Arabic Alphabet" → **الحروف العربية**
- `alpha-u1-l1.titleAr` (new lesson title) · "Alif to Kha" → **من الألف إلى الخاء**
- `alpha-u1-l2.titleAr` (new lesson title) · "Dal to Sad" → **من الدال إلى الصاد**
- `alpha-u1-l3.titleAr` (new lesson title) · "Dad to Qaf" → **من الضاد إلى القاف**
- `alpha-u1-l4.titleAr` (new lesson title) · "Kaf to Ya" → **من الكاف إلى الياء**

### App (`src/lesson/milestones.ts` — inline pairs)

- Whole-alphabet milestone (new, at 28) · "Whole alphabet mastered" → **الأبجدية كاملة متقنة**
- Word-unit milestone (relabelled — the A1 unit is now Unit 2) · "All the word unit mastered" → **كل وحدة الكلمات متقنة**

### App (`src/i18n.ts`)

- `signRealRecording` (new — pill on real signer footage, H23) · "Deaf signer recording" → **تسجيل مُشير أصمّ**
- `fspTitle` (new — Fingerspell screen) · "Fingerspell" → **التهجئة بالإشارة**
- `fspSubtitle` (new) · "Type an Arabic word — watch it spelled letter by letter." → **اكتب كلمة عربية — وشاهدها تُتهجّى حرفًا حرفًا.**
- `fspInputLabel` (new) · "Arabic word" → **كلمة عربية**
- `fspPlaceholder` (new — Arabic in both langs by design) · **مثال: سلام**
- `fspEmpty` (new) · "Type a word to begin — try your name." → **اكتب كلمة للبدء — جرّب اسمك.**
- `fspPlay` (new) · "Play" → **تشغيل**
- `fspPause` (new) · "Pause" → **إيقاف**
- `fspSpeed` (new — speed group aria label) · "Speed" → **السرعة**
- `fspSkippedNote` (new — honest unsignable-characters note) · "We can't fingerspell these characters yet, so they were skipped:" → **لا يمكننا تهجئة هذه الرموز بعد، لذا تجاوزناها:**
- `fspRefOnly` (new — ة reference-only card) · "Reference only — ة has no camera grading until a signer records it." → **للاطلاع فقط — لا تقييم بالكاميرا لحرف التاء المربوطة حتى يسجّلها مُشير.**
- `fspPractiseAlong` (new) · "Practise along" → **تدرّب معها**
- `fspPractiseAlongSub` (new) · "Camera-check each letter of your word" → **تحقّق بالكاميرا من كل حرف في كلمتك**
- `fspLetterOf` (new — exercise label, {i}/{n} localised digits) · "Letter {i} of {n}" → **الحرف {i} من {n}**
- `fspDone` (new — practise-along finished) · "You spelled the whole word!" → **تهجّيت الكلمة كاملة!**
- `fspHomeCard` (new — Home entry card) · "Spell your name" → **تهجَّ اسمك**
- `fspHomeCardSub` (new) · "Fingerspell any word, letter by letter" → **تهجَّ أي كلمة حرفًا حرفًا**
- `practiseFingerspell` (new — Practise hub tile) · "Fingerspell" → **التهجئة**
- `practiseFingerspellSub` (new) · "Spell any word" → **تهجَّ أي كلمة**
- `practiseWordsSub` (UPDATED — M7 honest count after yes/no became watch-only) · "2 camera · 14 watch" → **٢ بالكاميرا · ١٤ للمشاهدة**

### App (`src/screens/Fingerspell.tsx` — inline pair)

- Practise-along letter count suffix (inline) · "{n} letters" → **{n} حروف**

## Step 4 — Batch 7 (engine hardening)

### App (`src/i18n.ts`)

- `camMatchOwn` (NEW — M2 honest disclosure when a match was confirmed only by the learner's OWN taught samples, not the dataset model) · "Matched your own recording" → **طابَق تسجيلك الخاص**
  - *Proofread note:* conveys "this matched what YOU recorded", distinct from the celebratory `camMatch` ("✓ وصلت!"). Confirm phrasing / whether **طابَق تسجيلك** (shorter) reads more naturally.

### App (`src/components/CameraTrainer.tsx` — removed literal)

- L1 removed the stale desktop hold caption literal **ثبّت يدك ثانيتين…** ("hold steady two seconds") — the gate is now ~1.2 s, so the caption reuses the already-proofread `camHold` (**ثبّت يدك…**). No new string; noted for completeness.

## Step 5 — Batch 8 a11y & polish (2026-07-03)

### App (`src/i18n.ts` + inline pairs)

- `skipToContent` (NEW — keyboard/screen-reader skip link, first focusable element on every screen) · "Skip to content" → **تخطَّ إلى المحتوى**
- LessonPlayer progress-bar aria-label (NEW inline — screen-reader only) · "Lesson progress" → **تقدّم الدرس**
- FirstSign progress-bar aria-label (NEW inline — screen-reader only) · "First-sign progress" → **تقدّم الإشارة الأولى**
- `srLesson` (NEW — screen-reader route announcement only) · "Lesson" → **الدرس**
- `srFirstSign` (NEW — screen-reader route announcement only) · "Your first sign" → **إشارتك الأولى**
- `stNoCamTitle` (previously shipped but DEAD — now live UI: the camera-denied/absent fallback, H21) · "No camera? No problem." → **لا كاميرا؟ لا مشكلة.**
- `stNoCamBody` (same — now live; EN edited "signer demo" → "sign demo" to match the Batch-1 truth rename, AR unchanged) · "You can still watch every sign demo and learn the shapes. Grading unlocks when a camera's available." → **يمكنك مشاهدة كل العروض وتعلّم الأشكال. يُفتح التقييم عند توفّر كاميرا.**
- `stBrowseSigns` (same — now live; routes to the dictionary) · "Browse the signs →" → **تصفّح الإشارات ←**

### Housekeeping (no proofread needed)

- M24 deleted 176 dead i18n keys — none were listed here except `famFlagSub` (Batch 1), which has been pruned from this document.
- M20/L12 localised the remaining aria-labels and Eastern-Arabic numerals (camera chips, FPS pill, teach counter, reset toast) — all reuse strings already listed above; no new Arabic.
- Everything else in Batch 8 was visual/behavioural (contrast tokens, focus management, landmarks, fonts) — no string changes.

---

## Handoff — how to review (M29, for Ahmed)

**This list is complete.** Every machine-written Arabic string that was added or changed across the entire overhaul (Batches 1–8, 2026-07-02 → 2026-07-03) is logged above. Nothing else in the app's Arabic changed — strings not listed here predate the overhaul.

1. Strings live in `src/i18n.ts` (app) and `index.html` `data-ar` attributes (landing repo). Each entry gives the key/location, the English pair, and the shipped Arabic in bold.
2. For each entry: confirm the Arabic is natural, correctly inflected, and matches the English *meaning* (not word-for-word). Watch especially the entries with a *proofread note* (e.g. `camMatchOwn`).
3. Digits: UI numerals render as Eastern Arabic (٣، ٢٨…) via `toLocaleDigits`; placeholders like `{n}` are substituted at runtime.
4. RTL: arrows in copy (←) are pre-mirrored; the app mirrors layout automatically. Flag anything that reads backwards in context.
5. Reply with corrections as `key · current → suggested`; they can be applied in one pass.
