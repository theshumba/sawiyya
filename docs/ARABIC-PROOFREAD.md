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
- `famFlagSub` · "Pick the signs your family needs most. They jump to the top of everyone's queue." → **اختر الإشارات التي تحتاجها عائلتك أكثر. ستتصدر قائمة الجميع.**
- `prLeagueBody` · "Growing together." → **ننمو معًا.**
- `prLeagueSolo` (new) · "It's just you so far — add family members and you'll grow here together." → **أنت وحدك حتى الآن — أضف أفراد عائلتك لتنموا هنا معًا.**
- `practiseWordsSub` · "4 camera · 12 watch" → **٤ بالكاميرا · ١٢ للمشاهدة**
- `a1AslProvenance` (new) · "Adapted from ASL — not yet verified as Qatari Sign Language. Native recordings come with our Deaf signer partner in Phase 2." → **مقتبسة من لغة الإشارة الأمريكية — لم تُعتمد بعد بلغة الإشارة القطرية. التسجيلات الأصلية قادمة مع شريكنا المُشير الأصم في المرحلة الثانية.**
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
