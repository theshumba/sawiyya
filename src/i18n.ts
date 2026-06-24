// Bilingual EN/AR, RTL-native (PRD §6.9). Arabic is home, not a translation layer.
import type { Lang } from "./types";

type Entry = { en: string; ar: string };

const dict = {
  // brand
  appName: { en: "sawiyya", ar: "سويّة" },
  tagline: { en: "Let's learn to talk to each other. سويّة.", ar: "خلّونا نتعلم نتكلم مع بعض. سويّة." },

  // nav
  navHome: { en: "Home", ar: "الرئيسية" },
  navCamera: { en: "Camera", ar: "الكاميرا" },
  navFamily: { en: "Family", ar: "العائلة" },
  navProgress: { en: "Progress", ar: "التقدم" },
  navLearn: { en: "Learn", ar: "تعلّم" },
  navPractise: { en: "Practise", ar: "تدرّب" },
  navDictionary: { en: "Signs", ar: "القاموس" },
  navProfile: { en: "Profile", ar: "حسابي" },

  // onboarding
  obChooseLang: { en: "اختر لغتك · Choose your language", ar: "اختر لغتك · Choose your language" },
  obWhoTitle: { en: "Who are you learning for?", ar: "لمن تتعلم الإشارة؟" },
  obWhoSub: { en: "We'll start you on the signs that matter most.", ar: "سنبدأ معك بالإشارات الأهم لك." },
  obParent: { en: "My child", ar: "طفلي" },
  obParentSub: { en: "I'm a parent", ar: "أنا أب / أم" },
  obSibling: { en: "My brother or sister", ar: "أخي أو أختي" },
  obSiblingSub: { en: "I'm a sibling", ar: "أنا أخ / أخت" },
  obTeacher: { en: "My student", ar: "طالبي" },
  obTeacherSub: { en: "I'm a teacher", ar: "أنا معلم / معلمة" },
  obFriend: { en: "My friend or colleague", ar: "صديقي أو زميلي" },
  obFriendSub: { en: "I'm a friend", ar: "أنا صديق / زميل" },
  obDeaf: { en: "I'm Deaf — setting up my family", ar: "أنا أصم — أجهّز عائلتي" },
  obDeafSub: { en: "You direct what they learn", ar: "أنت توجّه ما يتعلمونه" },
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
  obStart: { en: "Let's begin", ar: "لنبدأ" },

  // first sign
  fsIntro: { en: "Let's learn the first thing you'll say:", ar: "لنتعلم أول ما ستقوله:" },
  fsWatch: { en: "Watch how it's signed", ar: "شاهد كيف تُؤدّى الإشارة" },
  fsNowYou: { en: "Now you try", ar: "الآن جرّب أنت" },
  fsDone: { en: "That's one. Your family will feel this.", ar: "هذه أول إشارة. عائلتك ستشعر بها." },
  fsCelebrate: { en: "Connection made!", ar: "وصلت! 🎉" },
  fsKeepGoing: { en: "Keep going", ar: "أكمل" },

  // camera
  camStart: { en: "Start camera", ar: "شغّل الكاميرا" },
  camLoading: { en: "Loading model…", ar: "جاري تحميل النموذج…" },
  camLooking: { en: "Looking for a hand…", ar: "نبحث عن يد…" },
  camHandSeen: { en: "Hand detected ✋", ar: "تم رصد اليد ✋" },
  camBlocked: { en: "Camera blocked — allow camera access to practise.", ar: "الكاميرا محجوبة — اسمح بالوصول للكاميرا للتدريب." },
  camSign: { en: "Sign", ar: "أشِر" },
  camHold: { en: "Hold it steady…", ar: "ثبّت يدك…" },
  camMatch: { en: "✓ Connection made!", ar: "✓ وصلت!" },
  camUnsure: { en: "Almost — the camera isn't sure, but your hands might be right. Try once more?", ar: "قريب — الكاميرا غير متأكدة، لكن ربما يداك صحيحتان. جرّب مرة أخرى؟" },
  camSelfMark: { en: "I signed it right", ar: "أدّيتها صح" },
  camSelfMarkSub: { en: "Mark it yourself — you know your hands.", ar: "قيّم نفسك — أنت أدرى بيديك." },
  camTryAgain: { en: "Try again", ar: "حاول مجددًا" },
  camSkip: { en: "Skip this one", ar: "تجاوز هذه" },
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
  homeHeroEyebrow: { en: "On-device · Private", ar: "على جهازك · خصوصيّتك محفوظة" },
  homeHeroTitle: { en: "Sign it back. Your camera checks you.", ar: "أشِر بيدك، والكاميرا تتحقّق منك." },
  homeHeroSub: { en: "Practise any sign and get instant feedback — nothing ever leaves your phone.", ar: "تدرّب على أي إشارة واحصل على ملاحظات فوريّة — لا شيء يغادر هاتفك." },
  homeHeroCta: { en: "Practise now", ar: "ابدأ التدريب" },
  camNotTrained: { en: "The camera hasn't learned this handshape yet.", ar: "الكاميرا لم تتعلم شكل اليد هذا بعد." },
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

  // home
  homeToday: { en: "Today's lesson", ar: "درس اليوم" },
  homeContinueUnit: { en: "Continue", ar: "متابعة" },
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
  famSwitch: { en: "Switch profile", ar: "تبديل الملف" },
  famAdd: { en: "Add a family member", ar: "أضف فردًا من العائلة" },
  famName: { en: "Name", ar: "الاسم" },
  famRole: { en: "Role", ar: "الدور" },
  famFlagTitle: { en: "Flag signs we need", ar: "حدّد الإشارات التي نحتاجها" },
  famFlagSub: { en: "Pick the signs your family must learn this week. They jump to the top of everyone's queue.", ar: "اختر الإشارات التي على عائلتك تعلمها هذا الأسبوع. ستتصدر قائمة الجميع." },
  famFlagged: { en: "needs this", ar: "يحتاج هذه" },
  famBoard: { en: "Signs we can all do", ar: "إشارات نتقنها جميعًا" },
  famBoardEmpty: { en: "When every member masters a sign, it appears here — your shared language, growing.", ar: "عندما يتقن كل أفراد الأسرة إشارة، تظهر هنا — لغتكم المشتركة تنمو." },
  famSharedStreak: { en: "Household streak", ar: "مواظبة الأسرة" },
  famSignedToday: { en: "signed today", ar: "تمرّنوا اليوم" },
  famOnlyDeafFlags: { en: "flags the signs — the curriculum follows them.", ar: "يحدد الإشارات — والمنهج يتبعهم." },

  // progress
  prTitle: { en: "Progress", ar: "التقدم" },
  prMastered: { en: "signs mastered", ar: "إشارات متقنة" },
  prSeen: { en: "signs learned", ar: "إشارات متعلمة" },
  prUpcoming: { en: "Coming up for review", ar: "قادمة للمراجعة" },
  prAlphabet: { en: "Alphabet", ar: "الحروف" },
  prNothingDue: { en: "Nothing due — you're ahead.", ar: "لا شيء مستحق — أنت متقدم." },

  // settings
  setTitle: { en: "Settings", ar: "الإعدادات" },
  setLanguage: { en: "Language", ar: "اللغة" },
  setHand: { en: "Signing hand", ar: "يد الإشارة" },
  setGoal: { en: "Daily goal", ar: "الهدف اليومي" },
  setProfiles: { en: "Manage profiles", ar: "إدارة الملفات" },
  setAi: { en: "What the AI can and can't do", ar: "ما تستطيعه الكاميرا الذكية وما لا تستطيعه" },
  setPrivacy: { en: "Privacy", ar: "الخصوصية" },
  setCameraPermission: { en: "Camera permission", ar: "إذن الكاميرا" },
  setGranted: { en: "Granted", ar: "ممنوح" },
  setNotGranted: { en: "Not granted yet", ar: "لم يُمنح بعد" },
  setDevMetrics: { en: "Dev metrics", ar: "مقاييس المطور" },

  // generic
  back: { en: "Back", ar: "رجوع" },
  close: { en: "Close", ar: "إغلاق" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  save: { en: "Save", ar: "حفظ" },
  xp: { en: "XP", ar: "نقطة" },
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

/** Localised numerals (PRD §6.9). */
export function num(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-QA" : "en-GB").format(n);
}
