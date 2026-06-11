// AI transparency + privacy pages (PRD §6.10, §9.6).
// Responsible-AI signal: state plainly what the AI does and does NOT do.
import { pick } from "../i18n";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { Lang } from "../types";
import { Card } from "../components/ui";

function InfoShell({ title, children, lang }: { title: string; children: React.ReactNode; lang: Lang }) {
  const { go } = useUi();
  return (
    <div className="mx-auto max-w-md px-5 pb-12 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button
          type="button"
          onClick={() => go({ name: "settings" })}
          aria-label={pick(lang, "Back", "رجوع")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-lg"
        >
          ✕
        </button>
      </header>
      <div className="mt-5 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Block({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <Card className="p-4">
      <p className="font-bold">
        <span className="me-2" aria-hidden="true">{emoji}</span>
        {title}
      </p>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">{body}</p>
    </Card>
  );
}

export function AiTransparency() {
  const app = useApp();
  const profile = activeProfile(app);
  if (!profile) return null;
  const lang = profile.language;
  const T = (en: string, ar: string) => pick(lang, en, ar);

  return (
    <InfoShell lang={lang} title={T("What the AI can and can't do", "ما تستطيعه الكاميرا الذكية وما لا تستطيعه")}>
      <Block
        emoji="✅"
        title={T("What it CAN do", "ما تستطيعه")}
        body={T(
          "It tracks the 21 joints of one hand in real time and recognises STATIC handshapes — the Arabic alphabet and a small set of held signs — after you teach it each shape. Recognition is scaffolding to encourage you, not an exam.",
          "تتبّع ٢١ مفصلًا في يد واحدة لحظيًا وتتعرف على أشكال اليد الثابتة — الحروف العربية ومجموعة صغيرة من الإشارات الثابتة — بعد أن تعلّمها كل شكل. التعرف وسيلة تشجيع، وليس امتحانًا."
        )}
      />
      <Block
        emoji="❌"
        title={T("What it can NOT do", "ما لا تستطيعه")}
        body={T(
          "It cannot grade moving signs, full sentences, or facial grammar — those are open research problems, and pretending otherwise would be dishonest. Signs with motion are taught by watching and self-marking.",
          "لا تستطيع تقييم الإشارات المتحركة أو الجمل الكاملة أو تعابير الوجه النحوية — تلك مسائل بحثية مفتوحة، وادعاء غير ذلك ليس صادقًا. الإشارات المتحركة تُتعلم بالمشاهدة والتقييم الذاتي."
        )}
      />
      <Block
        emoji="🤲"
        title={T("Fairness", "الإنصاف")}
        body={T(
          "The camera learns YOUR hands — left or right, any skin tone, any lighting — because you teach it on your own device. If it's unsure, you are never blocked: mark it yourself and move on.",
          "الكاميرا تتعلم يديك أنت — يسرى أو يمنى، بأي لون بشرة، وفي أي إضاءة — لأنك تعلّمها على جهازك. وإن لم تتأكد، لن تُحجَب أبدًا: قيّم نفسك وواصل."
        )}
      />
      <Block
        emoji="🧏"
        title={T("Honest content", "محتوى صادق")}
        body={T(
          "Current sign demonstrations are labelled placeholders. Phase 2 replaces every one with recordings by a Deaf Qatari signer, reviewed by a Deaf board, with revenue share and on-screen credit.",
          "العروض الحالية مؤقتة ومُعلَّمة بوضوح. في المرحلة الثانية تُستبدل كلها بتسجيلات شخص أصم قطري، بمراجعة لجنة من الصم، مع حصة من العائد وذكر الاسم."
        )}
      />
    </InfoShell>
  );
}

export function Privacy() {
  const app = useApp();
  const profile = activeProfile(app);
  if (!profile) return null;
  const lang = profile.language;
  const T = (en: string, ar: string) => pick(lang, en, ar);

  return (
    <InfoShell lang={lang} title={T("Privacy", "الخصوصية")}>
      <Block
        emoji="📵"
        title={T("No video ever leaves your device", "لا يغادر أي فيديو جهازك أبدًا")}
        body={T(
          "All hand tracking and recognition runs 100% on this device. No camera frame, no hand landmark, no recording is ever uploaded — there is no server to upload to.",
          "كل تتبّع اليد والتعرف يعمل ١٠٠٪ على هذا الجهاز. لا تُرفع أي لقطة كاميرا ولا أي نقطة يد ولا أي تسجيل — ولا يوجد خادم أصلًا للرفع إليه."
        )}
      />
      <Block
        emoji="👤"
        title={T("No accounts, no tracking", "لا حسابات ولا تتبّع")}
        body={T(
          "Sawiyya collects no personal data and uses no analytics. Profiles, progress and the camera's learned handshapes live only in this browser's local storage. Delete the app data and they're gone.",
          "سويّة لا تجمع أي بيانات شخصية ولا تستخدم أدوات تحليل. الملفات والتقدم وأشكال اليد المتعلمة تبقى في التخزين المحلي لهذا المتصفح فقط. احذف بيانات التطبيق وستختفي."
        )}
      />
      <Block
        emoji="🧒"
        title={T("Built for families", "مصمم للعائلات")}
        body={T(
          "Because households include children, on-device-only is a design rule, not a setting. Any future cloud feature will be explicit opt-in with child-data safeguards.",
          "لأن الأسر تضم أطفالًا، العمل على الجهاز فقط قاعدة تصميم لا خيارًا. أي ميزة سحابية مستقبلية ستكون باختيار صريح ومع ضمانات لبيانات الأطفال."
        )}
      />
    </InfoShell>
  );
}
