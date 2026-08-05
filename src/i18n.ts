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
  // Phase 4 · ONE name for this screen. It answered to four in English — "Signs"
  // on the tab, "Sign Dictionary" on arrival, "Signs dictionary" in Settings and
  // "Browse the signs" on the camera's error escape. Every one of those doors
  // now says this, and the screen's own title is this key, not a literal.
  navDictionary: { en: "Dictionary", ar: "القاموس" },
  navProfile: { en: "Profile", ar: "حسابي" },

  // onboarding
  obWhoTitle: { en: "Who are you learning for?", ar: "لمن تتعلم الإشارة؟" },
  // The old sub said "We'll start you on the signs that matter most." Nothing
  // implemented it, and Phase 2 makes it untrue BY DESIGN: everyone gets the
  // same lesson one, because the asking is the mechanism, not the matching.
  obWhoSub: {
    en: "This changes what we say, not what you learn.",
    ar: "هذا يغيّر ما نقوله، لا ما تتعلّمه.",
  },
  obParent: { en: "My child", ar: "طفلي" },
  obSibling: { en: "My brother or sister", ar: "أخي أو أختي" },
  obTeacher: { en: "My student", ar: "طالبي" },
  obFriend: { en: "My friend or colleague", ar: "صديقي أو زميلي" },
  obDeaf: { en: "I'm Deaf — setting up my family", ar: "أنا أصم — أجهّز عائلتي" },
  obHandTitle: { en: "Which hand do you sign with?", ar: "بأي يد تستخدم الإشارة؟" },
  // Honest copy: nothing reads dominantHand. The recognizer canonicalises both
  // hands per frame from MediaPipe's own handedness label, so this line must not
  // promise a camera effect the app does not have.
  obHandSub: { en: "Either hand works: the camera reads both the same way.", ar: "أي يد تصلح: الكاميرا تقرأ كلتيهما بالطريقة نفسها." },
  obRight: { en: "Right hand", ar: "اليد اليمنى" },
  obLeft: { en: "Left hand", ar: "اليد اليسرى" },
  // obGoalTitle / obGoalSub / obGoalCta are gone with the standalone daily-goal
  // step: the length choice now sits under the days question on `plan`, since
  // both answer the same thing. Dead keys read as live copy to the next person.
  obCasual: { en: "Casual · 3 min", ar: "خفيف · ٣ دقائق" },
  obRegular: { en: "Regular · 7 min", ar: "منتظم · ٧ دقائق" },
  obSerious: { en: "Serious · 15 min", ar: "جاد · ١٥ دقيقة" },
  obNameTitle: { en: "What should we call you?", ar: "ماذا نناديك؟" },
  obSkip: { en: "Skip", ar: "تخطّي" },
  obContinue: { en: "Continue", ar: "متابعة" },

  // Phase 2 · question 2 — what you already know. Recorded and shown back on
  // the recap. It does NOT change the curriculum: everyone starts at lesson one.
  obKnowTitle: { en: "What do you know already?", ar: "ماذا تعرف من قبل؟" },
  obKnowSub: {
    en: "No wrong answer. Everyone starts at the same first lesson.",
    ar: "لا توجد إجابة خاطئة. الجميع يبدأ من الدرس الأول نفسه.",
  },
  obKnowNone: { en: "Nothing yet", ar: "لا شيء بعد" },
  obKnowNoneSub: { en: "I have never signed", ar: "لم أستخدم لغة الإشارة من قبل" },
  obKnowSome: { en: "A few signs", ar: "بضع إشارات" },
  obKnowSomeSub: { en: "I can do a handful", ar: "أعرف عددًا قليلًا" },
  obKnowFluent: { en: "I sign already", ar: "أُشير بالفعل" },
  obKnowFluentSub: { en: "I am here for the Qatari dialect", ar: "أنا هنا من أجل اللهجة القطرية" },

  // Phase 2 · question 3 — which days, and how long. One screen: it is one
  // decision about commitment asked two ways.
  obPlanTitle: { en: "Which days will you practise?", ar: "في أي أيام ستتدرّب؟" },
  obPlanSub: {
    en: "Pick the days that are realistic, not the ones that sound good.",
    ar: "اختر الأيام الواقعية، لا التي تبدو جيدة.",
  },
  obPlanEveryDay: { en: "Every day", ar: "كل يوم" },
  obPlanHowLong: { en: "And how long each time?", ar: "وكم المدة في كل مرة؟" },

  // Phase 2 · the recap. Shows the three answers back, and names the four tabs
  // — which nothing in the app did anywhere before this screen.
  obRecapTitle: { en: "That's your setup", ar: "هذا هو إعدادك" },
  // Deliberately NOT "change it later in Settings": Settings carries the daily
  // goal but not the other two, and a promise the app cannot keep is the exact
  // defect this phase deleted from the persona step.
  obRecapSub: {
    en: "Your first lesson is the same either way.",
    ar: "درسك الأول هو نفسه في كل الأحوال.",
  },
  obRecapLearningFor: { en: "Learning for", ar: "تتعلم من أجل" },
  obRecapStartingFrom: { en: "Starting from", ar: "تبدأ من" },
  obRecapPractising: { en: "Practising", ar: "تتدرّب" },
  obRecapNoDays: { en: "No days picked", ar: "لم تختر أيامًا" },
  // Digits even under ten (Duolingo's published rule, Phase 4 tone pass).
  obRecapTabsTitle: { en: "4 tabs, and that's the whole app", ar: "٤ تبويبات، وهذا كل التطبيق" },
  obRecapTabLearn: { en: "Your lesson, one at a time", ar: "درسك، واحدًا تلو الآخر" },
  obRecapTabPractise: { en: "The camera, whenever you want it", ar: "الكاميرا، متى شئت" },
  obRecapTabSigns: { en: "Every sign, to look up", ar: "كل الإشارات، للبحث" },
  obRecapTabFamily: { en: "Who you're learning with", ar: "من تتعلم معهم" },
  obRecapCta: { en: "Looks right", ar: "يبدو صحيحًا" },

  // Phase 2 · the practise-days answer, written back onto Home so the question
  // visibly mattered. Silent when no days were picked.
  homePractiseToday: { en: "Today is one of your practice days", ar: "اليوم من أيام تدريبك" },
  homePractiseNext: { en: "Your next practice day is {day}", ar: "يوم تدريبك القادم هو {day}" },

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
  // No punctuation inside a button, and this line renders inside one.
  camSelfMarkSub: { en: "Mark it yourself — you know your hands", ar: "قيّم نفسك — أنت أدرى بيديك" },
  camTryAgain: { en: "Try again", ar: "حاول مجددًا" },
  camSkip: { en: "Skip this one", ar: "تجاوز هذه" },
  camStillTricky: { en: "Still tricky — let's see it again", ar: "ما زالت صعبة — لنشاهدها من جديد" },
  // Sign Coach (2026-07-07): ONE corrective hint while visibly not matching a
  // seeded letter. Complete strings per finger+direction (not templates) so the
  // Arabic reads naturally; masculine imperative matches the app's register.
  coachExtendThumb: { en: "Extend your thumb", ar: "مُدَّ إبهامك" },
  coachCurlThumb: { en: "Curl your thumb in", ar: "اثنِ إبهامك" },
  coachExtendIndex: { en: "Extend your index finger", ar: "مُدَّ سبابتك" },
  coachCurlIndex: { en: "Curl your index finger in", ar: "اثنِ سبابتك" },
  coachExtendMiddle: { en: "Extend your middle finger", ar: "مُدَّ إصبعك الوسطى" },
  coachCurlMiddle: { en: "Curl your middle finger in", ar: "اثنِ إصبعك الوسطى" },
  coachExtendRing: { en: "Extend your ring finger", ar: "مُدَّ بنصرك" },
  coachCurlRing: { en: "Curl your ring finger in", ar: "اثنِ بنصرك" },
  coachExtendPinky: { en: "Extend your little finger", ar: "مُدَّ خنصرك" },
  coachCurlPinky: { en: "Curl your little finger in", ar: "اثنِ خنصرك" },
  coachReference: { en: "Compare your hand with the reference shape", ar: "قارن يدك بالشكل المرجعي" },
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
  // homeToday is gone: it was the trail section's screen-reader-only label, and
  // the trail now has a visible heading that labels it for everyone.
  homeStreak: { en: "day streak", ar: "أيام متتالية" },
  homeNeeds: { en: "needs this", ar: "بحاجة لهذه" },
  homeFlagged: { en: "Flagged for your family", ar: "مطلوبة من عائلتك" },
  homeFlagOne: { en: "1 family request", ar: "طلب واحد من العائلة" },
  homeFlagMany: { en: "family requests", ar: "طلبات العائلة" },
  homeReviewDue: { en: "Review due", ar: "مراجعة مستحقة" },
  // Phase 4 · Home says what it is above the trail. Its only heading was the
  // greeting, and the trail itself was named for screen readers and nobody
  // else. The heading is navLearn, the same word as the tab that opens it.
  homeTrailSub: { en: "Your road, one lesson at a time", ar: "طريقك، درسًا بعد درس" },
  homeSeeProgress: { en: "See your progress", ar: "اطّلع على تقدّمك" },
  homeReviewCta: { en: "signs to review", ar: "إشارات للمراجعة" },
  homeDailyGoal: { en: "Daily goal", ar: "الهدف اليومي" },
  homeAllDone: { en: "Goal met — beautiful work today.", ar: "تحقق الهدف — عمل رائع اليوم." },
  homeUnit: { en: "Unit", ar: "الوحدة" },

  // family
  famTitle: { en: "Family", ar: "العائلة" },
  famHousehold: { en: "Your household", ar: "أسرتك" },
  famAdd: { en: "Add a family member", ar: "أضف فردًا من العائلة" },
  famAddShort: { en: "Add", ar: "أضف" },
  famName: { en: "Name", ar: "الاسم" },
  famFlagTitle: { en: "Flag signs we need", ar: "حدّد الإشارات التي نحتاجها" },
  famFlagged: { en: "needs this", ar: "يحتاج هذه" },
  famBoard: { en: "Signs we can all do", ar: "إشارات نتقنها جميعًا" },
  famBoardEmpty: { en: "When every member masters a sign, it appears here — your shared language, growing.", ar: "عندما يتقن كل أفراد الأسرة إشارة، تظهر هنا — لغتكم المشتركة تنمو." },
  famSharedStreak: { en: "Household streak", ar: "مواظبة الأسرة" },
  famSignedToday: { en: "signed today", ar: "تمرّنوا اليوم" },
  famOnlyDeafFlags: { en: "flags the signs — the curriculum follows them.", ar: "يحدد الإشارات — والمنهج يتبعهم." },

  // progress
  // prMastered ("signs mastered") is gone with the readout rebuild: it was the
  // third name for the number prStatMastered already carries.
  prUpcoming: { en: "Coming up for review", ar: "قادمة للمراجعة" },
  prAlphabet: { en: "Alphabet", ar: "الحروف" },
  // No full stop in a headline (Phase 4 tone pass) — this is the empty state's
  // heading, not its body.
  prNothingDue: { en: "Nothing due — you're ahead", ar: "لا شيء مستحق — أنت متقدم" },

  // settings
  setTitle: { en: "Settings", ar: "الإعدادات" },
  setProfiles: { en: "Manage profiles", ar: "إدارة الملفات" },
  setAi: { en: "What the AI can and can't do", ar: "ما تستطيعه الكاميرا الذكية وما لا تستطيعه" },
  setPrivacy: { en: "Privacy", ar: "الخصوصية" },
  setCameraPermission: { en: "Camera permission", ar: "إذن الكاميرا" },
  setGranted: { en: "Granted", ar: "ممنوح" },
  setNotGranted: { en: "Not granted yet", ar: "لم يُمنح بعد" },
  // The browser only ever asks on a screen that opens the camera, so a settings
  // row cannot grant it. Say where it happens instead of pretending to be a button.
  setGrantWhere: {
    en: "Your browser asks the first time you practise on camera, on the Practise tab.",
    ar: "يسألك المتصفح أول مرة تتدرّب فيها بالكاميرا، من تبويب التدرّب.",
  },

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
  // Phase 4 tone pass: no trailing arrows or ornaments in button labels.
  celStreakCta: { en: "Keep it going", ar: "واصل التقدّم" },
  celGoalTitle: { en: "Daily goal met!", ar: "تحقّق هدف اليوم!" },
  celGoalBody: { en: "{xp} / {goal} XP today. Fanan is proud of you.", ar: "{xp} / {goal} نقاط اليوم. فَنَن فخور بك." },
  celBadgeEyebrow: { en: "Achievement unlocked", ar: "إنجاز مفتوح" },
  celBadgeBodySample: { en: "You mastered your first 5 signs. A whole conversation starts here.", ar: "أتقنت أول ٥ إشارات. محادثة كاملة تبدأ من هنا." },
  celBadgeCta: { en: "Collect", ar: "استلم" },
  celLevelEyebrow: { en: "Unit {n} complete", ar: "اكتملت الوحدة {n}" },
  celLevelTitle: { en: "Level up!", ar: "ترقية!" },
  celLevelBody: { en: 'You unlocked "{unit}"', ar: "فتحت «{unit}»" },
  celLevelCta: { en: "Start Unit {n}", ar: "ابدأ الوحدة {n}" },
  celConnectEyebrow: { en: "Connection made", ar: "تمّ التواصل" },
  celConnectTitle: { en: 'You signed "{sign}" with {name}', ar: "أشرت «{sign}» مع {name}" },
  celConnectBody: { en: "Not a lesson — a moment. This is why Sawiyya exists.", ar: "ليست حصّة — بل لحظة. لهذا وُجدت سويّة." },
  celConnectCta: { en: "Share this moment", ar: "شارك هذه اللحظة" },
  celCertEyebrow: { en: "Certificate of achievement", ar: "شهادة إنجاز" },
  celCertTitle: { en: "You learned the whole Arabic alphabet", ar: "تعلّمت الحروف العربية كاملة" },
  celCertBody: { en: "All 28 letters, signed and camera-checked.", ar: "كل الحروف الـ٢٨، بالإشارة وبتحقّق الكاميرا." },
  celCertNameLbl: { en: "Learner", ar: "المتعلّمة" },
  celCertDateLbl: { en: "Completed", ar: "أُنجزت" },
  celCertCta: { en: "Share certificate", ar: "شارك الشهادة" },

  // ── reskin: family
  famLearners: { en: "learners", ar: "متعلّمين" },
  famLearnerOne: { en: "1 learner", ar: "متعلّم واحد" },
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
  fsDemoSub: { en: "A real signer's hand (ArSL21L dataset)", ar: "يد مُشير حقيقي (بيانات ArSL21L)" },
  fsSignerTag: { en: "REAL SIGNER", ar: "مُشير حقيقي" },
  fsDemoMeans: { en: "This sign means “{gloss}”", ar: "هذه الإشارة تعني «{gloss}»" },
  fsLiveTitle: { en: "Now make the sign", ar: "الآن أدِّ الإشارة" },
  fsLiveSub: { en: "The camera is grading you live", ar: "الكاميرا تقيّمك مباشرةً" },
  fsDoneBadgeMatch: { en: "live match", ar: "تطابق مباشر" },

  // ── reskin: home path
  homeGreetSub: { en: "Ready to sign today?", ar: "مستعد للإشارة اليوم؟" },
  // One number, one name: this chip renders profile.xp, the same value Progress,
  // the lesson results card and the family league all label "XP". There is no
  // gold currency in the app, so "gold" was a second name for the same counter.
  homeGoldStat: { en: "XP", ar: "نقطة" },
  homeFamilyStat: { en: "family", ar: "العائلة" },
  homeStartBadge: { en: "START", ar: "ابدأ" },
  pathStartCta: { en: "Start", ar: "ابدأ" },
  pathReview: { en: "Review", ar: "مراجعة" },
  pathLocked: { en: "Locked", ar: "مقفل" },
  pathNewSign: { en: "New sign · camera-graded", ar: "إشارة جديدة · تقييم بالكاميرا" },
  // A done node only needs mastery 2 ("practised"). Mastery 3 is the far harder
  // FSRS + camera gate that Progress, the Constellation and the family board all
  // count as "mastered", so the node must not claim that word.
  pathDoneMeta: { en: "Practised · tap to review", ar: "تمرّنت عليها · انقر للمراجعة" },
  // The lock is real now (lesson/unlock.ts): the path runs in order and this
  // string has to describe that, not a per-sign rule the app never had.
  pathLockedMeta: { en: "Finish the lesson before this one to unlock it.", ar: "أكمل الدرس السابق لفتح هذا." },
  pathChestMeta: { en: "Clear Unit 1 to open the reward chest.", ar: "أكمل الوحدة ١ لفتح الصندوق." },
  // Home's top bar carries today's goal, not a lifetime total: a number you can
  // move today is the only one worth putting next to the streak.
  homeGoalStat: { en: "today's goal", ar: "هدف اليوم" },

  // ── reskin: lesson
  lsLockedGoCurrent: { en: "Go to your lesson", ar: "اذهب إلى درسك" },
  lsWatchStep: { en: "Watch the sign", ar: "شاهد الإشارة" },
  lsSignBack: { en: "Sign it back", ar: "أعد الإشارة" },
  lsSignerDemo: { en: "SIGN DEMO", ar: "عرض الإشارة" },
  lsHint: { en: "Hint", ar: "تلميح" },
  lsSessionTitle: { en: "Great session!", ar: "جلسة رائعة!" },

  // ── reskin: onboarding
  obWelcomeTitle: { en: "Teach the world to sign", ar: "علّم العالم الإشارة" },
  obWelcomeBody: { en: "Learn to sign and connect with someone who can’t hear you — as equals.", ar: "تعلّم الإشارة وتواصل مع من لا يسمعك — كأنداد." },
  obWelcomeCta: { en: "Get started", ar: "لنبدأ" },
  obFananEyebrow: { en: "Meet your guide", ar: "تعرّف على مرشدك" },
  // Exclamation marks are for success, not for greetings (Phase 4 tone pass).
  obFananTitle: { en: "Hi, I’m Fanan", ar: "مرحبًا، أنا فَنَن" },
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
  // Honest reminders (H20): the app sends no notifications — the offer is a
  // real .ics download that the user's own calendar app takes over.
  obRemindTitle: { en: "A gentle nudge?", ar: "تذكير لطيف؟" },
  obRemindBody: {
    en: "Sawiyya doesn’t send notifications — nothing leaves your device. Want a daily nudge? Add a practice reminder to your own calendar.",
    ar: "سويّة لا ترسل إشعارات — لا شيء يغادر جهازك. أتريد تذكيرًا يوميًا؟ أضِف موعد تدريب إلى تقويمك.",
  },
  obRemindEventTitle: { en: "Practise Sawiyya", ar: "تمرّن على سويّة" },
  // The preview has to describe the .ics the button actually writes, so the
  // days half is filled in from the answer given one screen earlier. It said
  // "Every day" no matter what was picked, while the file said otherwise.
  obRemindEventWhen: { en: "{days} · 6:00 pm · in your calendar", ar: "{days} · ٦:٠٠ مساءً · في تقويمك" },
  obRemindCal: { en: "Add to my calendar (.ics)", ar: "أضِفه إلى تقويمي (.ics)" },
  obRemindCalDone: { en: "Downloaded — open it to add the reminder", ar: "تم التنزيل — افتحه لإضافة التذكير" },

  // ── reskin: practice loop
  loopHintLbl: { en: "Hint", ar: "تلميح" },
  loopSignerCap: { en: "SIGN DEMO", ar: "عرض الإشارة" },
  // Only loopLineCorrect keeps its exclamation mark: it is the one line here
  // that marks a success (Phase 4 tone pass).
  loopLineWatch: { en: "Watch me first", ar: "شاهدني أولًا" },
  loopLineLooking: { en: "Show me your hand", ar: "أرني يدك" },
  loopLineDetecting: { en: "Ooh, nice…", ar: "جميل…" },
  loopLineCorrect: { en: "That's it!", ar: "أحسنت!" },
  loopLineNotquite: { en: "So close — again", ar: "اقتربت — مجددًا" },
  loopLineDemo: { en: "Wave with me", ar: "لوّح معي" },
  loopKindLetter: { en: "Arabic letter · static handshape", ar: "حرف عربي · إشارة ثابتة" },
  loopKindWordStatic: { en: "Word · static handshape", ar: "كلمة · إشارة ثابتة" },
  loopKindWordMotion: { en: "Word · motion sign", ar: "كلمة · إشارة حركية" },

  // ── reskin: practise hub
  practiseTitle: { en: "Practise", ar: "تمرّن" },
  practiseSubtitle: { en: "Pick how you want to sign today.", ar: "اختر كيف تشير اليوم." },
  practiseAlphabet: { en: "Alphabet", ar: "الأبجدية" },
  practiseAlphabetSub: { en: "28 letters", ar: "٢٨ حرفًا" },
  practiseAlphabetSubOf: { en: "{n} of {t} practised", ar: "تدرّبت على {n} من {t}" },
  // practiseWords ("Words") is gone: the tile that used it now carries
  // wordsTitle, so the door and the thing behind it say the same word.
  // All 16 A1 words are watch-only: no trained model exists for any word sign
  // (iloveyou/stop demoted 2026-07-04 — teach-then-match-yourself was circular).
  practiseWordsSub: { en: "Watch & copy, from day one", ar: "شاهد وقلّد من اليوم الأول" },

  // Phase 4 · the Words screen is gone: it listed sign cards, opened the same
  // SignDemo sheet and wrote the identical self-mark as the dictionary, so it
  // was a smaller copy of a screen one tab away. "Everyday words" is now a
  // FILTER inside the dictionary, and this key labels that chip. wordsSubtitle
  // went with the screen — a dead key reads as live copy to the next person.
  wordsTitle: { en: "Everyday words", ar: "كلمات يومية" },
  wordsOneHand: { en: "One hand", ar: "بيد واحدة" },
  wordsTwoHands: { en: "Two hands", ar: "بيدين" },
  wordsMarked: { en: "Marked — it'll come back in review.", ar: "سجّلناها — ستعود في المراجعة." },
  wdHowTo: { en: "How to sign it", ar: "كيف تُشير بها" },
  wdMoving: { en: "Moving sign", ar: "إشارة متحركة" },
  practiseFreeCamera: { en: "Free camera", ar: "كاميرا حرّة" },
  practiseFreeCameraSub: { en: "Sign anything", ar: "أشِر أي شيء" },
  practiseReview: { en: "Review", ar: "مراجعة" },
  practiseReviewCountSuffix: { en: "due", ar: "مستحقّة" },
  practiseReviewBody: { en: "signs are ready for a quick refresh.", ar: "إشارات جاهزة لتذكير سريع." },

  // ── progress · Phase 4 rebuilt it as ONE readout ──────────────────────────
  // The four tabs are gone. Three of them (Stats, Achievements, Family league)
  // were dead ends with a back arrow, and the league duplicated the Family tab
  // it also linked to. The header no longer changes with the tab either: it is
  // "Progress" always, the same word as the door that opens it.
  prReadoutSub: {
    en: "Everything Sawiyya has recorded about your learning",
    ar: "كل ما سجّلته سويّة عن تعلّمك",
  },
  prOasisTitle: { en: "The world you're building", ar: "العالم الذي تبنيه" },
  prOasisBody: { en: "Every sign you learn plants something new.", ar: "كل إشارة تتعلّمها تزرع شيئًا جديدًا." },
  // The scene's key. "signs planted" and "palms grown" were invented units that
  // contradicted "Signs mastered" one tab away; the numbers now live once, in
  // the stats grid, and the picture explains what it is drawing.
  prOasisKey: {
    en: "A palm for every letter you have started, a sprout for every sign you have mastered",
    ar: "نخلة لكل حرف بدأته، وشتلة لكل إشارة أتقنتها",
  },
  prNextMilestone: { en: "Next milestone", ar: "المحطة التالية" },
  prWeeklyStreak: { en: "Weekly streak", ar: "المواظبة الأسبوعية" },
  prConstellation: { en: "The Constellation", ar: "الكوكبة" },
  // Thirty-one tappable circles with a slogan under them was one of the audit's
  // "pure lists with no instruction". Say what a tap does.
  prConstellationTap: { en: "Tap a letter to open it", ar: "انقر حرفًا لفتحه" },
  prConstellationFound: { en: "found", ar: "مكتشفة" },
  // The heatmap had a less/more legend and no statement of what a cell is.
  prMonthKey: {
    en: "One square is one day. A filled square is a day you practised",
    ar: "كل مربع يوم واحد. المربع الملوّن يوم تدرّبت فيه",
  },
  prComingUp: { en: "Coming up", ar: "قادمة قريبًا" },
  prStartReview: { en: "Start review session", ar: "ابدأ جلسة المراجعة" },
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
  // prLeague* are gone with the Family league tab: it ranked the same household
  // the Family tab already lists, from inside a screen hidden behind an avatar,
  // and its own empty state linked to Family. One place for the household.

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

  // ── the dictionary ────────────────────────────────────────────────────────
  // What the screen is for, said on the screen, at every width. The only
  // instruction it had lived in a `hidden md:block` aside, so on a phone — the
  // only shape this app really ships in — nothing said what a card does.
  signsSubtitle: {
    en: "Every sign in Sawiyya, to look up",
    ar: "كل إشارات سويّة، للبحث",
  },
  signsTapHint: {
    en: "Tap a sign to see how it's made",
    ar: "انقر إشارة لترى كيف تُؤدّى",
  },
  signsFilterAll: { en: "All", ar: "الكل" },
  signsFilterLearned: { en: "Learned", ar: "المتعلمة" },
  signsFilterFlagged: { en: "Flagged", ar: "المحدّدة" },
  signsAlphaTitle: { en: "The alphabet", ar: "الأبجدية" },
  signsAlphaBody: { en: "All 28 Arabic letters.", ar: "كل الحروف العربية الـ٢٨." },
  signsAlphaProgress: { en: "of 28 learned", ar: "من ٢٨ مُتعلَّمة" },
  // The grid's key. Three cell colours with no legend was one of the audit's
  // "pure lists with no instruction", and the padlock now means something.
  signsAlphaLockedNote: {
    en: "Teal is learned, coral is open now, padlocked letters open with their lesson.",
    ar: "الأخضر مُتعلَّم، والمرجاني متاح الآن، والحروف المقفلة تُفتح مع درسها.",
  },
  signSignerDemo: { en: "Sign demo", ar: "عرض الإشارة" },
  signBadgeGraded: { en: "Graded", ar: "مُقيَّم" },
  // "Watch" not "Motion": since the iloveyou/stop demotion the non-graded set
  // includes static handshapes too — the badge signals watch-only, not movement.
  signBadgeMotion: { en: "Watch", ar: "مشاهدة" },
  signWatchPractise: { en: "Watch & practise", ar: "شاهد وتمرّن" },

  // ── reskin: states (permission / empty / error / offline / grader edge cases)
  stNoCamTitle: { en: "No camera? No problem", ar: "لا كاميرا؟ لا مشكلة" },
  stNoCamBody: { en: "You can still watch every sign demo and learn the shapes. Grading unlocks when a camera's available.", ar: "يمكنك مشاهدة كل العروض وتعلّم الأشكال. يُفتح التقييم عند توفّر كاميرا." },
  // Names the destination the way the destination names itself.
  stBrowseSigns: { en: "Open the dictionary", ar: "افتح القاموس" },
  stNoProfileTitle: { en: "No profile yet", ar: "لا يوجد ملف بعد" },
  stNoProfileBody: { en: "Set up a profile to start signing", ar: "أنشئ ملفًا لتبدأ الإشارة" },
  stSetUpProfile: { en: "Set up profile", ar: "إنشاء ملف" },

  // ── Batch 6: real signer media (H23)
  signRealRecording: { en: "Deaf signer recording", ar: "تسجيل مُشير أصمّ" },
  signRefRecording: { en: "Reference recording", ar: "تسجيل مرجعي" },

  // ── Batch 6: fingerspelling (M6)
  fspTitle: { en: "Fingerspell", ar: "التهجئة بالإشارة" },
  fspSubtitle: { en: "Type any word — Arabic or English letters — and watch it spelled letter by letter.", ar: "اكتب أي كلمة — بالعربية أو بأحرف إنجليزية — وشاهدها تُتهجّى حرفًا حرفًا." },
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
  fspBackspace: { en: "Delete letter", ar: "احذف حرفًا" },
  fspLatinNote: { en: "English letters converted — you're spelling:", ar: "حوّلنا الأحرف الإنجليزية — أنت تتهجّى:" },
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

  // ── coherence batch (2026-08-01) ──────────────────────────────────────────
  // Keys added so the fix batches stop hardcoding English in components.

  // Flag picker: a count needs a state word, not the predicate "needs this".
  // famFlagged stays as-is because Family reads it as a sentence about a person.
  famFlaggedCount: { en: "flagged", ar: "محدّدة" },
  famGroupLetters: { en: "Letters", ar: "الحروف" },

  // Family: removing a member is destructive and local-only, so the confirm has
  // to name what disappears.
  famRemove: { en: "Remove", ar: "إزالة" },
  famRemoveTitle: { en: "Remove {name} from this household?", ar: "إزالة {name} من الأسرة؟" },
  famRemoveBody: {
    en: "This deletes their progress, their flagged signs and their place on the family board on this device. It cannot be undone.",
    ar: "سيؤدي هذا إلى حذف تقدّمهم وإشاراتهم المحدّدة ومكانهم في لوحة العائلة على هذا الجهاز. لا يمكن التراجع عن ذلك.",
  },

  // Camera errors, split three ways. A refused permission and a failed model
  // download were both reported as "No camera? No problem." A hard denial cannot
  // be re-prompted, so that branch points at the browser instead of a retry.
  camErrDeniedTitle: { en: "Camera access is blocked", ar: "الوصول إلى الكاميرا محجوب" },
  camErrDeniedBody: {
    en: "Your browser is blocking the camera for Sawiyya. Allow it in this site's settings, then come back.",
    ar: "متصفحك يحجب الكاميرا عن سويّة. اسمح بها من إعدادات هذا الموقع، ثم عُد.",
  },
  camErrDeniedHint: { en: "Look for the padlock or camera icon in the address bar.", ar: "ابحث عن أيقونة القفل أو الكاميرا في شريط العنوان." },
  camErrNotFoundTitle: { en: "No camera found", ar: "لم نعثر على كاميرا" },
  camErrNotFoundBody: {
    en: "There is no camera we can use on this device. You can still watch every sign and mark yourself.",
    ar: "لا توجد كاميرا يمكننا استخدامها على هذا الجهاز. يمكنك مشاهدة كل الإشارات وتقييم نفسك.",
  },
  camErrLoadTitle: { en: "The camera model didn't load", ar: "لم يُحمَّل نموذج الكاميرا" },
  camErrLoadBody: {
    en: "Sawiyya couldn't load the hand-tracking model. Check your connection, then try again.",
    ar: "تعذّر على سويّة تحميل نموذج تتبّع اليد. تحقّق من اتصالك، ثم حاول مجددًا.",
  },

  // Seed chunk failed: grading is paused, so say so instead of holding the meter
  // at 0% and letting the copy imply it is still grading.
  camGradingPaused: {
    en: "Grading isn't available right now. You can still watch the reference and mark yourself.",
    ar: "التقييم غير متاح الآن. يمكنك مشاهدة المرجع وتقييم نفسك.",
  },
  camRetryGrading: { en: "Retry grading", ar: "أعد محاولة التقييم" },

  // Streak celebration, name-free: the old line told the learner their own name
  // was going to be proud of them.
  celStreakMastered: {
    en: "You've mastered {n} signs so far. Every one of them is a way to be understood.",
    ar: "أتقنت {n} إشارة حتى الآن. كل واحدة منها طريق لأن تُفهَم.",
  },

  // Lesson continuation card: the queue caps in two passes, so a drained queue
  // with signs below mastery 2 is part 1, not a completed lesson.
  lsPartDoneTitle: { en: "Part 1 done", ar: "انتهى الجزء الأول" },
  lsPartDoneBody: {
    en: "{n} signs still to practise. One more round finishes this lesson.",
    ar: "بقيت {n} إشارة للتمرّن. جولة أخرى تُنهي هذا الدرس.",
  },
  lsPartDoneCta: { en: "Keep going", ar: "واصل" },

  // Fingerspell practise-along needs a way out that is not skipping every letter.
  fspStopPractising: { en: "Stop practising", ar: "أوقف التمرين" },

  // Watch-only signs: no model exists for any word sign, so the honest action is
  // watch, then mark yourself. Used by the dictionary and the camera reference.
  signRefOnlyNote: { en: "Reference only, no camera grading", ar: "للاطلاع فقط، بلا تقييم بالكاميرا" },

  // ── Phase 3 · stages (2026-08-05) ─────────────────────────────────────────
  // The ladder's own rows live in journey/journey.ts, next to the order that
  // ranks them — these are the chrome around them. "Getting started" and not
  // "milestones": lesson/milestones.ts already owns that word for the mastery
  // ladder that Home's chest and Progress's "Next milestone" both read.
  jrTitle: { en: "Getting started", ar: "لنبدأ" },
  jrBody: {
    en: "6 things that show you the whole app. They tick themselves off as you go.",
    ar: "٦ أشياء تعرّفك بالتطبيق كله. تُشطب من تلقاء نفسها كلما تقدّمت.",
  },
  jrDone: { en: "Done", ar: "تم" },
  jrNext: { en: "Next", ar: "التالي" },
  jrLater: { en: "Later", ar: "لاحقًا" },
  jrNotNow: { en: "Not now", ar: "ليس الآن" },
  jrPutAside: { en: "Put aside — it's still here whenever you want it.", ar: "أُجّلت — تبقى هنا متى أردتها." },
  // The review row cannot be honoured with an empty queue, so it says why
  // instead of sending the learner to a screen with nothing on it.
  jrWaitingReview: {
    en: "Nothing is due yet. Signs come back a day after you first learn them.",
    ar: "لا شيء مستحق بعد. تعود الإشارات بعد يوم من تعلّمها أول مرة.",
  },

  // Install. Never "install the app": what is actually at stake is the progress,
  // and iOS Safari deletes an uninstalled site's storage after seven unused days.
  jrInstallTitle: { en: "Keep your progress", ar: "احفظ تقدّمك" },
  jrInstallWhy: {
    en: "Everything you've learned is saved in this browser, and phones clear that on their own. Adding Sawiyya to your home screen stops it happening.",
    ar: "كل ما تعلّمته محفوظ في هذا المتصفح، والهواتف تمسحه من تلقاء نفسها. إضافة سويّة إلى شاشتك الرئيسية تمنع ذلك.",
  },
  jrInstallCta: { en: "Add to home screen", ar: "أضِف إلى الشاشة الرئيسية" },
  jrInstallIos1: {
    en: "On iPhone: tap the Share button in Safari's toolbar.",
    ar: "على الآيفون: اضغط زر المشاركة في شريط سفاري.",
  },
  jrInstallIos2: {
    en: "Choose “Add to Home Screen”, then Add.",
    ar: "اختر «إضافة إلى الشاشة الرئيسية»، ثم أضِف.",
  },
  jrInstallAndroid: {
    en: "On Android: open the browser menu and choose “Install app” or “Add to Home screen”.",
    ar: "على أندرويد: افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
  },
  signMarkPractised: { en: "I practised this", ar: "تمرّنت على هذه" },
  signMarkedPractised: { en: "Marked as practised. It will come back in review.", ar: "سجّلناها كتمرين. ستعود في المراجعة." },
} satisfies Record<string, Entry>;

export type TKey = keyof typeof dict;

/** The whole dictionary, exported for the Phase 4 tone gate in i18n.tone.test.ts.
 *  Nothing in the app should read this: use `t()`. */
export const DICT: Record<string, Entry> = dict;

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

/** Weekday names, indexed the way `Date.getDay()` indexes them: 0 = Sunday.
 *  The week starts on Sunday in Qatar, so index order is also display order. */
const WEEKDAYS: { en: string; ar: string; ics: string }[] = [
  { en: "Sun", ar: "الأحد", ics: "SU" },
  { en: "Mon", ar: "الاثنين", ics: "MO" },
  { en: "Tue", ar: "الثلاثاء", ics: "TU" },
  { en: "Wed", ar: "الأربعاء", ics: "WE" },
  { en: "Thu", ar: "الخميس", ics: "TH" },
  { en: "Fri", ar: "الجمعة", ics: "FR" },
  { en: "Sat", ar: "السبت", ics: "SA" },
];

export function weekdayName(day: number, lang: Lang): string {
  const d = WEEKDAYS[day];
  return d ? pick(lang, d.en, d.ar) : "";
}

/** RFC 5545 BYDAY codes for an .ics recurrence rule. */
export function weekdayIcsCode(day: number): string {
  return WEEKDAYS[day]?.ics ?? "";
}

export const WEEKDAY_COUNT = WEEKDAYS.length;
