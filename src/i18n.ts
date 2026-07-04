// Bilingual EN/AR, RTL-native (PRD §6.9). Arabic is home, not a translation layer.
import type { Lang } from "./types";

type Entry = { en: string; ar: string };

const dict = {
  // brand

  // nav
  navFamily: { en: "Family", ar: "العائلة" },
  navProgress: { en: "Progress", ar: "التقدم" },
  navMain: { en: "Main navigation", ar: "التنقل الرئيسي" },
  navLearn: { en: "Learn", ar: "تعلّم" },
  navPractise: { en: "Practise", ar: "تدرّب" },
  navDictionary: { en: "Signs", ar: "القاموس" },
  navProfile: { en: "Profile", ar: "حسابي" },

  // onboarding
  obWhoTitle: { en: "Who are you learning for?", ar: "لمن تتعلم الإشارة؟" },
  obWhoSub: { en: "We'll start you on the signs that matter most.", ar: "سنبدأ معك بالإشارات الأهم لك." },
  obParent: { en: "My child", ar: "طفلي" },
  obSibling: { en: "My brother or sister", ar: "أخي أو أختي" },
  obTeacher: { en: "My student", ar: "طالبي" },
  obFriend: { en: "My friend or colleague", ar: "صديقي أو زميلي" },
  obDeaf: { en: "I'm Deaf — setting up my family", ar: "أنا أصم — أجهّز عائلتي" },
  obHandTitle: { en: "Which hand do you sign with?", ar: "بأي يد تستخدم الإشارة؟" },
  obHandSub: { en: "So the camera reads your hands fairly.", ar: "حتى تقرأ الكاميرا يديك بإنصاف." },
  obRight: { en: "Right hand", ar: "اليد اليمنى" },
  obLeft: { en: "Left hand", ar: "اليد اليسرى" },
  obGoalTitle: { en: "Your daily goal", ar: "هدفك اليومي" },
  obGoalSub: { en: "Small and steady beats heroic and rare.", ar: "القليل المستمر خير من الكثير المنقطع." },
  obCasual: { en: "Casual · 3 min", ar: "خفيف · ٣ دقائق" },
  obRegular: { en: "Regular · 7 min", ar: "منتظم · ٧ دقائق" },
  obSerious: { en: "Serious · 15 min", ar: "جاد · ١٥ دقيقة" },
  obNameTitle: { en: "What should we call you?", ar: "ماذا نناديك؟" },
  obSkip: { en: "Skip", ar: "تخطّي" },
  obContinue: { en: "Continue", ar: "متابعة" },

  // first sign
  fsIntro: { en: "Let's learn the first thing you'll say:", ar: "لنتعلم أول ما ستقوله:" },
  fsNowYou: { en: "Now you try", ar: "الآن جرّب أنت" },
  fsDone: { en: "That's one. Your family will feel this.", ar: "هذه أول إشارة. عائلتك ستشعر بها." },
  fsCelebrate: { en: "Connection made!", ar: "وصلت!" },
  fsKeepGoing: { en: "Keep going", ar: "أكمل" },

  // camera
  camStart: { en: "Start camera", ar: "شغّل الكاميرا" },
  camLoading: { en: "Loading model…", ar: "جاري تحميل النموذج…" },
  camLooking: { en: "Looking for a hand…", ar: "نبحث عن يد…" },
  camHandSeen: { en: "Hand detected", ar: "تم رصد اليد" },
  camSign: { en: "Sign", ar: "أشِر" },
  camHold: { en: "Hold it steady…", ar: "ثبّت يدك…" },
  camMatch: { en: "✓ Connection made!", ar: "✓ وصلت!" },
  // M2: honest disclosure when the confirming hold was carried only by the
  // learner's OWN taught samples (KNN), not the dataset model.
  camMatchOwn: { en: "Matched your own recording", ar: "طابَق تسجيلك الخاص" },
  camUnsure: { en: "Almost — the camera isn't sure, but your hands might be right. Try once more?", ar: "قريب — الكاميرا غير متأكدة، لكن ربما يداك صحيحتان. جرّب مرة أخرى؟" },
  camSelfMark: { en: "I signed it right", ar: "أدّيتها صح" },
  camSelfMarkSub: { en: "Mark it yourself — you know your hands.", ar: "قيّم نفسك — أنت أدرى بيديك." },
  camTryAgain: { en: "Try again", ar: "حاول مجددًا" },
  camSkip: { en: "Skip this one", ar: "تجاوز هذه" },
  camStillTricky: { en: "Still tricky — let's see it again", ar: "ما زالت صعبة — لنشاهدها من جديد" },
  reviewCapDone: { en: "30 done today — the rest will wait for tomorrow", ar: "أنجزت ٣٠ مراجعة اليوم — والبقية تنتظر حتى الغد" },
  homeNewLetter: { en: "Learn a new letter", ar: "تعلّم حرفًا جديدًا" },
  homeNewLetterSub: { en: "Nothing due right now — start the next letter", ar: "لا شيء مستحق الآن — ابدأ الحرف التالي" },
  camTeach: { en: "Teach Sawiyya this sign", ar: "علّم سويّة هذه الإشارة" },
  camTeachSub: { en: "Record it once, then practise it — this sign isn't pre-loaded yet.", ar: "سجّلها مرة، ثم تدرّب عليها — هذه الإشارة ليست محمّلة مسبقًا بعد." },
  camTeachHold: { en: "Hold the handshape in view…", ar: "ثبّت شكل اليد أمام الكاميرا…" },
  camTeachDone: { en: "Learned! The camera knows this one now.", ar: "تعلّمتها! الكاميرا تعرف هذه الآن." },
  camSamples: { en: "samples", ar: "عيّنات" },
  camReached: { en: "Reached!", ar: "وصلت!" },
  camPractice: { en: "Practise the alphabet", ar: "تدرّب على الحروف" },
  practiceCamera: { en: "Practise with camera", ar: "تدرّب بالكاميرا" },
  accuracy: { en: "Accuracy", ar: "الدقة" },
  camPrivacy: { en: "100% on your device — no video ever leaves your phone.", ar: "١٠٠٪ على جهازك — لا يغادر أي فيديو هاتفك أبدًا." },
  camConfidence: { en: "Camera confidence", ar: "ثقة الكاميرا" },
  camResetClass: { en: "Re-teach", ar: "إعادة التعليم" },

  // lesson
  lsContinue: { en: "Continue", ar: "متابعة" },
  lsCheck: { en: "Check", ar: "تحقق" },
  lsWatchTitle: { en: "A new sign", ar: "إشارة جديدة" },
  lsRecogniseTitle: { en: "What does this sign mean?", ar: "ما معنى هذه الإشارة؟" },
  lsRecallTitle: { en: "Which sign means…", ar: "أي إشارة تعني…" },
  lsReviewTitle: { en: "Quick review", ar: "مراجعة سريعة" },
  lsCorrect: { en: "Beautiful — that's it!", ar: "ممتاز — هذه هي!" },
  lsSoftMiss: { en: "Not quite — here it is. You'll get it next time.", ar: "ليست هذه — ها هي الإجابة. ستصيبها المرة القادمة." },
  lsLessonDone: { en: "Lesson complete!", ar: "اكتمل الدرس!" },
  lsXpEarned: { en: "XP earned", ar: "نقاط الخبرة" },
  lsWhatsNext: { en: "What's next", ar: "ما التالي" },
  lsBackHome: { en: "Back home", ar: "العودة للرئيسية" },
  lsDemoPlaceholder: { en: "Demo placeholder — a Deaf Qatari signer records the real demonstrations in Phase 2.", ar: "عرض مؤقت — سيسجّل العروض الحقيقية شخص أصم قطري في المرحلة الثانية." },
  a1AslProvenance: { en: "Adapted from ASL — not yet verified as Qatari Sign Language. A Deaf Qatari signer records the native versions in Phase 2.", ar: "مقتبسة من لغة الإشارة الأمريكية — لم تُعتمد بعد بلغة الإشارة القطرية. سيسجّل النسخ الأصلية شخص أصم قطري في المرحلة الثانية." },

  // home
  homeToday: { en: "Today's lesson", ar: "درس اليوم" },
  homeStreak: { en: "day streak", ar: "أيام متتالية" },
  homeNeeds: { en: "needs this", ar: "بحاجة لهذه" },
  homeFlagged: { en: "Flagged for your family", ar: "مطلوبة من عائلتك" },
  homeReviewDue: { en: "Review due", ar: "مراجعة مستحقة" },
  homeReviewCta: { en: "signs to review", ar: "إشارات للمراجعة" },
  homeDailyGoal: { en: "Daily goal", ar: "الهدف اليومي" },
  homeAllDone: { en: "Goal met — beautiful work today.", ar: "تحقق الهدف — عمل رائع اليوم." },
  homeUnit: { en: "Unit", ar: "الوحدة" },

  // family
  famTitle: { en: "Family", ar: "العائلة" },
  famHousehold: { en: "Your household", ar: "أسرتك" },
  famAdd: { en: "Add a family member", ar: "أضف فردًا من العائلة" },
  famName: { en: "Name", ar: "الاسم" },
  famFlagTitle: { en: "Flag signs we need", ar: "حدّد الإشارات التي نحتاجها" },
  famFlagged: { en: "needs this", ar: "يحتاج هذه" },
  famBoard: { en: "Signs we can all do", ar: "إشارات نتقنها جميعًا" },
  famBoardEmpty: { en: "When every member masters a sign, it appears here — your shared language, growing.", ar: "عندما يتقن كل أفراد الأسرة إشارة، تظهر هنا — لغتكم المشتركة تنمو." },
  famSharedStreak: { en: "Household streak", ar: "مواظبة الأسرة" },
  famSignedToday: { en: "signed today", ar: "تمرّنوا اليوم" },
  famOnlyDeafFlags: { en: "flags the signs — the curriculum follows them.", ar: "يحدد الإشارات — والمنهج يتبعهم." },

  // progress
  prMastered: { en: "signs mastered", ar: "إشارات متقنة" },
  prUpcoming: { en: "Coming up for review", ar: "قادمة للمراجعة" },
  prAlphabet: { en: "Alphabet", ar: "الحروف" },
  prNothingDue: { en: "Nothing due — you're ahead.", ar: "لا شيء مستحق — أنت متقدم." },

  // settings
  setTitle: { en: "Settings", ar: "الإعدادات" },
  setProfiles: { en: "Manage profiles", ar: "إدارة الملفات" },
  setAi: { en: "What the AI can and can't do", ar: "ما تستطيعه الكاميرا الذكية وما لا تستطيعه" },
  setPrivacy: { en: "Privacy", ar: "الخصوصية" },
  setCameraPermission: { en: "Camera permission", ar: "إذن الكاميرا" },
  setGranted: { en: "Granted", ar: "ممنوح" },
  setNotGranted: { en: "Not granted yet", ar: "لم يُمنح بعد" },

  // generic
  back: { en: "Back", ar: "رجوع" },
  close: { en: "Close", ar: "إغلاق" },
  skipToContent: { en: "Skip to content", ar: "تخطَّ إلى المحتوى" },
  // M16 screen-reader route announcements for screens without a nav/title key
  srLesson: { en: "Lesson", ar: "الدرس" },
  srFirstSign: { en: "Your first sign", ar: "إشارتك الأولى" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  save: { en: "Save", ar: "حفظ" },
  xp: { en: "XP", ar: "نقطة" },

  // ── reskin: celebrations
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

  // ── reskin: family
  famLearners: { en: "learners", ar: "متعلّمين" },
  famSignsTogether: { en: "signs together", ar: "إشارة معًا" },
  famLearningTogether: { en: "Learning together", ar: "نتعلّم معًا" },
  famLeagueNote: { en: "We celebrate everyone — no rankings, no losers.", ar: "نحتفي بالجميع — لا ترتيب ولا خاسرين." },
  famDataLocal: { en: "Your family's data lives on this device — export it from Settings to move or back it up.", ar: "بيانات عائلتك محفوظة على هذا الجهاز — صدّرها من الإعدادات لنقلها أو نسخها احتياطيًا." },
  famClearMine: { en: "Clear my flags", ar: "مسح إشاراتي" },
  famCoRequested: { en: "You asked for this too", ar: "طلبتها أنت أيضًا" },
  famAskToo: { en: "Ask for this too", ar: "اطلبها أنت أيضًا" },
  setHousehold: { en: "Household data", ar: "بيانات الأسرة" },
  setExport: { en: "Export household (JSON file)", ar: "تصدير بيانات الأسرة (ملف JSON)" },
  setExportDone: { en: "Saved — keep the file somewhere safe.", ar: "تم الحفظ — احتفظ بالملف في مكان آمن." },
  setImport: { en: "Import household", ar: "استيراد بيانات الأسرة" },
  setImportConfirmTitle: { en: "Replace everything on this device?", ar: "استبدال كل شيء على هذا الجهاز؟" },
  setImportConfirmBody: { en: "Importing replaces every profile, flag and progress record on this device with the file's contents. This cannot be undone.", ar: "الاستيراد يستبدل جميع الملفات الشخصية والإشارات المحددة وسجل التقدم على هذا الجهاز بمحتوى الملف. لا يمكن التراجع عن هذا." },
  setImportReplace: { en: "Replace & restart", ar: "استبدل وأعد التشغيل" },
  setImportInvalid: { en: "That file isn't a Sawiyya household export.", ar: "هذا الملف ليس ملف تصدير أسرة من سويّة." },
  setImportFailed: { en: "Couldn't save the import on this device — nothing was replaced.", ar: "تعذّر حفظ الملف المستورد على هذا الجهاز — لم يُستبدل أي شيء." },
  famFlagFrom: { en: "flagged this for you", ar: "رفع لك هذه" },

  // ── reskin: first sign
  fsDemoTitle: { en: "Watch it once", ar: "شاهدها مرّة" },
  fsDemoSub: { en: "The average handshape from real signers (Zenodo ArSL)", ar: "متوسط شكل اليد من مُشيرين حقيقيين (Zenodo ArSL)" },
  fsSignerTag: { en: "REAL HANDSHAPE", ar: "شكل يد حقيقي" },
  fsDemoMeans: { en: "This sign means “{gloss}”", ar: "هذه الإشارة تعني «{gloss}»" },
  fsLiveTitle: { en: "Now make the sign", ar: "الآن أدِّ الإشارة" },
  fsLiveSub: { en: "The camera is grading you live", ar: "الكاميرا تقيّمك مباشرةً" },
  fsDoneBadgeMatch: { en: "live match", ar: "تطابق مباشر" },

  // ── reskin: home path
  homeGreetSub: { en: "Ready to sign today?", ar: "مستعد للإشارة اليوم؟" },
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

  // ── reskin: lesson
  lsWatchStep: { en: "Watch the sign", ar: "شاهد الإشارة" },
  lsSignBack: { en: "Sign it back", ar: "أعد الإشارة" },
  lsSignerDemo: { en: "SIGN DEMO", ar: "عرض الإشارة" },
  lsHint: { en: "Hint", ar: "تلميح" },
  lsSessionTitle: { en: "Great session!", ar: "جلسة رائعة!" },

  // ── reskin: onboarding
  obWelcomeTitle: { en: "Teach the world to sign.", ar: "علّم العالم الإشارة." },
  obWelcomeBody: { en: "Learn to sign and connect with someone who can’t hear you — as equals.", ar: "تعلّم الإشارة وتواصل مع من لا يسمعك — كأنداد." },
  obWelcomeCta: { en: "Get started", ar: "لنبدأ" },
  obFananEyebrow: { en: "Meet your guide", ar: "تعرّف على مرشدك" },
  obFananTitle: { en: "Hi, I’m Fanan!", ar: "مرحبًا، أنا فَنَن!" },
  obFananBody: { en: "I’ll cheer you on, catch your signs, and never let you learn alone.", ar: "سأشجّعك، وألتقط إشاراتك، ولن أدعك تتعلّم وحدك أبدًا." },
  obFananCta: { en: "Nice to meet you", ar: "تشرّفنا" },
  obLangTitle: { en: "Choose your language", ar: "اختر لغتك" },
  obLangBody: { en: "You can switch anytime in settings.", ar: "يمكنك التبديل في أي وقت من الإعدادات." },
  obLangEn: { en: "English", ar: "English" },
  obLangEnSub: { en: "Left-to-right", ar: "Left-to-right" },
  obLangAr: { en: "العربية", ar: "العربية" },
  obLangArSub: { en: "من اليمين لليسار", ar: "من اليمين لليسار" },
  obCamEyebrow: { en: "How it works", ar: "كيف يعمل" },
  obCamTitle: { en: "Sign it to the camera", ar: "أشِر أمام الكاميرا" },
  obCamBody: { en: "Watch the handshape demo, then sign it back. Fanan checks your handshape live.", ar: "شاهد عرض شكل اليد ثم أعِد الإشارة. يتحقّق فَنَن من إشارتك مباشرة." },
  obCamCta: { en: "Got it", ar: "فهمت" },
  obPrivacyBody: { en: "Your camera never leaves your phone. No video is uploaded, ever.", ar: "كاميرتك لا تغادر هاتفك. لا يُرفع أي فيديو، إطلاقًا." },
  obPrivacyBadge: { en: "Nothing leaves this device", ar: "لا شيء يغادر هذا الجهاز" },
  obGoalCasualSub: { en: "A sign a day", ar: "إشارة كل يوم" },
  obGoalRegularSub: { en: "Build a habit", ar: "ابنِ عادة" },
  obGoalSeriousSub: { en: "Go all in", ar: "انغمس تمامًا" },
  obGoalCta: { en: "Set my goal", ar: "حدّد هدفي" },
  // Honest reminders (H20): the app sends no notifications — the offer is a
  // real .ics download that the user's own calendar app takes over.
  obRemindTitle: { en: "A gentle nudge?", ar: "تذكير لطيف؟" },
  obRemindBody: {
    en: "Sawiyya doesn’t send notifications — nothing leaves your device. Want a daily nudge? Add a practice reminder to your own calendar.",
    ar: "سويّة لا ترسل إشعارات — لا شيء يغادر جهازك. أتريد تذكيرًا يوميًا؟ أضِف موعد تدريب إلى تقويمك.",
  },
  obRemindEventTitle: { en: "Practise Sawiyya", ar: "تمرّن على سويّة" },
  obRemindEventWhen: { en: "Every day · 6:00 pm · in your calendar", ar: "كل يوم · ٦:٠٠ مساءً · في تقويمك" },
  obRemindCal: { en: "Add to my calendar (.ics)", ar: "أضِفه إلى تقويمي (.ics)" },
  obRemindCalDone: { en: "Downloaded — open it to add the reminder", ar: "تم التنزيل — افتحه لإضافة التذكير" },

  // ── reskin: practice loop
  loopHintLbl: { en: "Hint", ar: "تلميح" },
  loopSignerCap: { en: "SIGN DEMO", ar: "عرض الإشارة" },
  loopLineWatch: { en: "Watch me first!", ar: "شاهدني أولًا!" },
  loopLineLooking: { en: "Show me your hand", ar: "أرني يدك" },
  loopLineDetecting: { en: "Ooh, nice…", ar: "جميل…" },
  loopLineCorrect: { en: "That's it!", ar: "أحسنت!" },
  loopLineNotquite: { en: "So close — again!", ar: "اقتربت — مجددًا!" },
  loopLineDemo: { en: "Wave with me!", ar: "لوّح معي!" },
  loopKindLetter: { en: "Arabic letter · static handshape", ar: "حرف عربي · إشارة ثابتة" },
  loopKindWordStatic: { en: "Word · static handshape", ar: "كلمة · إشارة ثابتة" },
  loopKindWordMotion: { en: "Word · motion sign", ar: "كلمة · إشارة حركية" },

  // ── reskin: practise hub
  practiseTitle: { en: "Practise", ar: "تمرّن" },
  practiseSubtitle: { en: "Pick how you want to sign today.", ar: "اختر كيف تشير اليوم." },
  practiseAlphabet: { en: "Alphabet", ar: "الأبجدية" },
  practiseAlphabetSub: { en: "28 letters", ar: "٢٨ حرفًا" },
  practiseWords: { en: "Words", ar: "الكلمات" },
  // M7: yes/no are motion signs — honest count is 2 gradable / 14 watch-only.
  practiseWordsSub: { en: "2 camera · 14 watch", ar: "٢ بالكاميرا · ١٤ للمشاهدة" },
  practiseFreeCamera: { en: "Free camera", ar: "كاميرا حرّة" },
  practiseFreeCameraSub: { en: "Sign anything", ar: "أشِر أي شيء" },
  practiseReview: { en: "Review", ar: "مراجعة" },
  practiseReviewCountSuffix: { en: "due", ar: "مستحقّة" },
  practiseReviewBody: { en: "signs are ready for a quick refresh.", ar: "إشارات جاهزة لتذكير سريع." },

  // ── reskin: progress
  prTabOasis: { en: "Your oasis", ar: "واحتك" },
  prTabStats: { en: "Stats", ar: "إحصاءات" },
  prTabAchieve: { en: "Achievements", ar: "الإنجازات" },
  prTabLeague: { en: "Family league", ar: "دوري العائلة" },
  prOasisTitle: { en: "The world you're building", ar: "العالم الذي تبنيه" },
  prOasisBody: { en: "Every sign you learn plants something new.", ar: "كل إشارة تتعلّمها تزرع شيئًا جديدًا." },
  prPlanted: { en: "signs planted", ar: "إشارة مزروعة" },
  prPalmsGrown: { en: "palms grown", ar: "نخلات نمت" },
  prNextMilestone: { en: "Next milestone", ar: "المحطة التالية" },
  prStatsTitle: { en: "Your stats", ar: "إحصاءاتك" },
  prStatMastered: { en: "Signs mastered", ar: "إشارة مُتقَنة" },
  prAvgAccuracy: { en: "Avg accuracy", ar: "متوسط الدقّة" },
  prDrillsDone: { en: "Drills completed", ar: "تمارين مكتملة" },
  prBestStreak: { en: "Current streak", ar: "التتابع الحالي" },
  prThisMonth: { en: "This month", ar: "هذا الشهر" },
  prLess: { en: "less", ar: "أقل" },
  prMore: { en: "more", ar: "أكثر" },
  prAchievements: { en: "Achievements", ar: "الإنجازات" },
  prAchieveSummary: { en: "{n} of {total} unlocked.", ar: "{n} من {total} مفتوحة." },
  prUnlocked: { en: "Unlocked", ar: "مفتوح" },
  prAchFirstSign: { en: "First sign", ar: "أول إشارة" },
  prAch7Day: { en: "7-day streak", ar: "تتابع ٧ أيام" },
  // Relabelled from "5 words": mastered counts ALL signs, and the alphabet-first
  // curriculum means the first 5 mastered are letters — "words" was a fabricated
  // category claim.
  prAch5Words: { en: "5 signs", ar: "٥ إشارات" },
  prAchAlphabetStarted: { en: "Alphabet started", ar: "بدء الأبجدية" },
  prAchFamilyFlag: { en: "Family flag", ar: "علم عائلي" },
  prAchWholeAlphabet: { en: "Whole alphabet", ar: "الأبجدية كاملة" },
  prLeagueTitle: { en: "Family league", ar: "دوري العائلة" },
  prLeagueBody: { en: "Growing together.", ar: "ننمو معًا." },
  prLeagueSolo: { en: "It's just you so far — add family members and you'll grow here together.", ar: "أنت وحدك حتى الآن — أضف أفراد عائلتك لتنموا هنا معًا." },
  prLeagueWarm: { en: "We climb together — no losers here, only progress.", ar: "نصعد معًا — لا خاسرين هنا، فقط تقدّم." },

  // ── reskin: settings
  aiFlowCamera: { en: "Camera", ar: "الكاميرا" },
  aiFlowModel: { en: "On-device model", ar: "نموذج على الجهاز" },
  aiFlowGrade: { en: "Instant grade", ar: "تقييم فوري" },
  aiPromise: { en: "Your video never leaves this device.", ar: "الفيديو لا يغادر هذا الجهاز." },
  aiBulletNoUpload: { en: "No video is ever uploaded", ar: "لا يُرفع أي فيديو إطلاقًا" },
  aiBulletNoAccount: { en: "No account needed to practise", ar: "لا حساب مطلوب للتمرّن" },
  aiBulletOffline: { en: "Works fully offline", ar: "يعمل دون اتصال تمامًا" },
  aiBulletDelete: { en: "Delete your data anytime", ar: "احذف بياناتك متى شئت" },
  aboutTitle: { en: "Built to meet the Deaf community as equals", ar: "بُني للقاء مجتمع الصمّ كأنداد" },
  aboutBody: { en: "Sawiyya teaches the hearing world to sign — so we can all meet as equals.", ar: "تعلّم سويّة العالمَ السامعَ الإشارة — لنلتقي جميعًا كأنداد." },
  aboutCreditsLbl: { en: "With gratitude to", ar: "بامتنان إلى" },
  aboutCredits: { en: "The 28-letter alphabet is graded from real signers' hands in the open Zenodo ArSL dataset (CC-BY-4.0) — thank you to everyone who contributed to it. Recordings by Deaf Qatari signers arrive in Phase 2.", ar: "تُقيَّم الحروف الـ٢٨ من أيدي مُشيرين حقيقيين في مجموعة بيانات Zenodo ArSL المفتوحة (CC-BY-4.0) — شكرًا لكل من ساهم فيها. تسجيلات مُشيرين قطريين صُمّ قادمة في المرحلة الثانية." },
  aboutVersion: { en: "Sawiyya v1.0 · Made in Qatar", ar: "سويّة الإصدار ١٫٠ · صُنع في قطر" },

  // ── reskin: signs dictionary
  signsAlphaTitle: { en: "The alphabet", ar: "الأبجدية" },
  signsAlphaBody: { en: "All 28 Arabic letters.", ar: "كل الحروف العربية الـ٢٨." },
  signsAlphaProgress: { en: "of 28 learned", ar: "من ٢٨ مُتعلَّمة" },
  signSignerDemo: { en: "Sign demo", ar: "عرض الإشارة" },
  signBadgeGraded: { en: "Graded", ar: "مُقيَّم" },
  signBadgeMotion: { en: "Motion", ar: "حركة" },
  signWatchPractise: { en: "Watch & practise", ar: "شاهد وتمرّن" },

  // ── reskin: states (permission / empty / error / offline / grader edge cases)
  stNoCamTitle: { en: "No camera? No problem.", ar: "لا كاميرا؟ لا مشكلة." },
  stNoCamBody: { en: "You can still watch every sign demo and learn the shapes. Grading unlocks when a camera's available.", ar: "يمكنك مشاهدة كل العروض وتعلّم الأشكال. يُفتح التقييم عند توفّر كاميرا." },
  stBrowseSigns: { en: "Browse the signs →", ar: "تصفّح الإشارات ←" },
  stNoProfileTitle: { en: "No profile yet", ar: "لا يوجد ملف بعد" },
  stNoProfileBody: { en: "Set up a profile to start signing", ar: "أنشئ ملفًا لتبدأ الإشارة" },
  stSetUpProfile: { en: "Set up profile", ar: "إنشاء ملف" },

  // ── Batch 6: real signer media (H23)
  signRealRecording: { en: "Deaf signer recording", ar: "تسجيل مُشير أصمّ" },

  // ── Batch 6: fingerspelling (M6)
  fspTitle: { en: "Fingerspell", ar: "التهجئة بالإشارة" },
  fspSubtitle: { en: "Type an Arabic word — watch it spelled letter by letter.", ar: "اكتب كلمة عربية — وشاهدها تُتهجّى حرفًا حرفًا." },
  fspInputLabel: { en: "Arabic word", ar: "كلمة عربية" },
  fspPlaceholder: { en: "مثال: سلام", ar: "مثال: سلام" },
  fspEmpty: { en: "Type a word to begin — try your name.", ar: "اكتب كلمة للبدء — جرّب اسمك." },
  fspPlay: { en: "Play", ar: "تشغيل" },
  fspPause: { en: "Pause", ar: "إيقاف" },
  fspSpeed: { en: "Speed", ar: "السرعة" },
  fspSkippedNote: { en: "We can't fingerspell these characters yet, so they were skipped:", ar: "لا يمكننا تهجئة هذه الرموز بعد، لذا تجاوزناها:" },
  fspRefOnly: { en: "Reference only — ة has no camera grading until a signer records it.", ar: "للاطلاع فقط — لا تقييم بالكاميرا لحرف التاء المربوطة حتى يسجّلها مُشير." },
  fspPractiseAlong: { en: "Practise along", ar: "تدرّب معها" },
  fspPractiseAlongSub: { en: "Camera-check each letter of your word", ar: "تحقّق بالكاميرا من كل حرف في كلمتك" },
  fspLetterOf: { en: "Letter {i} of {n}", ar: "الحرف {i} من {n}" },
  fspDone: { en: "You spelled the whole word!", ar: "تهجّيت الكلمة كاملة!" },
  fspHomeCard: { en: "Spell your name", ar: "تهجَّ اسمك" },
  fspHomeCardSub: { en: "Fingerspell any word, letter by letter", ar: "تهجَّ أي كلمة حرفًا حرفًا" },
  practiseFingerspell: { en: "Fingerspell", ar: "التهجئة" },
  practiseFingerspellSub: { en: "Spell any word", ar: "تهجَّ أي كلمة" },

  // error boundary (H12) — honest recovery, reset only as a confirmed last resort
  ebTitle: { en: "Something went wrong", ar: "حدث خطأ ما" },
  ebBody: {
    en: "An unexpected error stopped this screen. Your progress is saved on this device — reloading usually fixes it.",
    ar: "أوقف خطأ غير متوقع هذه الشاشة. تقدمك محفوظ على هذا الجهاز — وإعادة التحميل عادةً ما تحل المشكلة.",
  },
  ebRetry: { en: "Try again", ar: "حاول مجددًا" },
  ebReload: { en: "Reload the app", ar: "أعد تحميل التطبيق" },
  ebResetHint: { en: "Still stuck after reloading?", ar: "ما زالت المشكلة بعد إعادة التحميل؟" },
  ebReset: { en: "Reset app data (last resort)", ar: "امسح بيانات التطبيق (كحل أخير)" },
  ebResetConfirm: {
    en: "This deletes ALL Sawiyya data on this device — every profile, all progress and your teach-mode recordings. This cannot be undone. Continue?",
    ar: "سيؤدي هذا إلى حذف كل بيانات سويّة على هذا الجهاز — جميع الملفات الشخصية وكل التقدم وتسجيلات وضع التعليم. لا يمكن التراجع عن ذلك. هل تريد المتابعة؟",
  },

  // storage recovery notice (M21) — honest, never a silent wipe
  recoveryTitle: { en: "We couldn't read your saved progress", ar: "تعذّرت قراءة تقدمك المحفوظ" },
  recoveryBody: {
    en: "The data saved on this device was damaged, so the app has started fresh. A backup copy of the damaged data is kept on this device.",
    ar: "تلفت البيانات المحفوظة على هذا الجهاز، فبدأ التطبيق من جديد. احتفظنا بنسخة احتياطية من البيانات التالفة على جهازك.",
  },
  recoveryDismiss: { en: "OK", ar: "حسنًا" },
} satisfies Record<string, Entry>;

export type TKey = keyof typeof dict;

export function t(key: TKey, lang: Lang): string {
  return dict[key][lang];
}

/** Pick a bilingual field pair off content objects. */
export function pick(lang: Lang, en: string, ar: string): string {
  return lang === "ar" ? ar : en;
}

export function applyDir(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

/**
 * Landing→app language handoff (M27): the landing page appends ?lang=ar when
 * the visitor chose Arabic, so first-run onboarding (and the boot splash in
 * index.html, which inlines the same check) opens in the right language and
 * direction instead of defaulting to English LTR.
 */
export function langFromSearch(search: string): Lang | null {
  const q = new URLSearchParams(search).get("lang");
  return q === "ar" || q === "en" ? q : null;
}

/** Localised numerals (PRD §6.9). */
export function num(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-QA" : "en-GB").format(n);
}
