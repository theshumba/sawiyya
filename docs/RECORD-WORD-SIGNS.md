# The 19 word signs — parked, and what it would take to bring them back

**Status: removed from the app on 2026-08-05.** They were adapted from American Sign
Language and never verified as Qatari, so the app was teaching signs that may be wrong.
This file is the complete record: the exact source that was removed, and the research
into where real Qatari signs actually live.

Restoring is a copy-paste of the block below back into `src/content/signs.ts`, plus
re-adding `UNIT_A1_U1` to `UNITS` and the four `a1-u1-l*` lessons to `LESSONS`.
The removal commit is the other half of the record.

---

## 1. Why they went

Qatari Sign Language is what Sawiyya claims to teach. These 19 were ASL descriptions
carrying an in-app disclosure that they were unverified. A disclosure does not make a
wrong sign right, and a dictionary is exactly where someone looks a sign up and trusts
the answer.

Six of the 19 now have a confirmed Qatari counterpart documented (hello, name, more,
sleep, help, hungry — see §3), which means our versions of those six were most likely
wrong, not merely unverified.

---

## 2. What replaces them

Nothing, until a Qatari source is licensed or a native Deaf Qatari signer records them.
The app teaches the 28 Arabic letters, which come from a CC BY 4.0 dataset of real
signers and are genuinely camera-graded.

---

## 3. Where real Qatari signs live (researched 2026-08-05)

Every route below is real and every one is currently closed. None of this content may be
copied into the app without written permission.

| Source | Qatari? | Form | Licence | Blocker |
|---|---|---|---|---|
| [Jumla Dictionary](https://jumla.mada.org.qa/dictionary/?lang=en), Mada Center | Yes | Live 3D avatar (BuHamad), streamed | CC BY-**NC** 4.0 | Non-commercial; nothing downloadable; no video or stills |
| [Sokoon app](https://sokoon.msdf.gov.qa/ar.php), Ministry of Social Development and Family | No — unified Arab | Per-word **video clips**, 2,637 words | All rights reserved | App-only, no reuse grant |
| [JUMLA-QSL-22](https://ieee-dataport.org/open-access/jumla-qsl-22-dataset-qatari-sign-language-sentences) | Yes | 6,300 depth-camera records, 3TB+ | Unstated (paper is CC BY-NC-ND) | Continuous **sentences**, healthcare domain — no isolated words |
| [Arab sign dictionary scan](https://archive.org/details/20210823_20210823_0847) | No — pan-Arab | Scanned print, photographs | None stated | Unlicensed scan of a copyrighted book — do not use |
| [Qatari sign grammar PDF](https://selaa.org/files/%D9%82%D9%88%D8%A7%D8%B9%D8%AF%20%D9%84%D8%BA%D8%A9%20%D8%A7%D9%84%D8%A5%D8%B4%D8%A7%D8%B1%D8%A9.pdf), Supreme Council for Family Affairs 2009 | Qatari-published | 180pp linguistics textbook | Unstated | Grammar, not a word lexicon |

**Coverage of our 19 in the one usable Qatari dictionary (Jumla, 217 public entries):**
present — hello, name, more, sleep, help, hungry. Absent — I love you, yes, no, stop,
all done, milk, mum, dad, thank you, careful, me, man, woman. **Thirteen of nineteen have
no public Qatari source of any kind.**

**The finding that changes the framing:** Qatar officially adopted the Unified Arab
lexicon in 2001 and calls it Qatari. The government's own 2009 book
*قواعد لغة الإشارة القطرية العربية الموحدة* defines the language as the one "agreed by Arab
deaf people... which has become the language of the deaf in Qatar". So a pan-Arab source
is not automatically wrong for this app, provided we say which we used. An American one
still is.

**The unlock is one email.** Mada built the dictionary, runs the Innovation Award Sawiyya
entered, has a published request process for developers, and already works with the
Qatari Center of Social Cultural for the Deaf — the body that would have to bless any
sign as genuinely Qatari. Draft letter: `~/Desktop/mada-qsl-licence-request.md`.

Contacts, all verified on the organisations' own pages:
- Mada Center — info@mada.org.qa · +974 4459 4050 · https://mada.org.qa/contact/
- Mada research (JUMLA author, Achraf Othman) — aothman@mada.org.qa
- Mada Innovation Program developer request — https://mip.mada.org.qa/contact-us/
- Ministry of Social Development and Family (Sokoon) — info@msdf.gov.qa · 16080
- Translation and Interpreting Institute, HBKU — tii.languagecenter@hbku.edu.qa · +974 4454 1429
- Qatar Society for Rehabilitation of Special Needs — +974 4404 1271 (no email published)

Note: the Qatari Center of Social Cultural for the Deaf's own site (qdeaf.org) is dead —
it now redirects to a domain-for-sale page. Reach them through Mada.

---

## 4. If a signer records them instead

The player is already built and needs no new code. Drop clips into `public/signs/<id>.webm`
(720p, a few hundred KB, 2–4s, one clean repetition, waist-up so face and hands are both
in frame), then add to each sign in `signs.ts`:

```ts
media: { type: "video", src: "signs/<id>.webm", signer: "deaf" }
```

`signer: "deaf"` is only for footage by a Deaf signer; anything else is `"reference"`, and
the in-app label follows that field. `hasVisual()` in `src/lesson/engine.ts` then upgrades
those words into real recognise drills automatically.

Camera *grading* is a separate problem and footage does not solve it: 16 of the 19 are
movement signs, and the recogniser is a still-frame classifier trained only on the 28
letters. Motion capability exists in `src/recognizer/pointHistory.ts` but has no ground
truth behind it.

---

## 5. The exact source that was removed

Verbatim from `src/content/signs.ts` before removal. Paste back to restore.

```ts
const S = (
  id: string,
  glossEn: string,
  glossAr: string,
  emoji: string,
  type: "static" | "dynamic",
  cameraGradable: boolean,
  hintEn: string,
  hintAr: string,
  hands: 1 | 2 = 1,
): Sign => ({ id, tier: "A1", glossEn, glossAr, emoji, hintEn, hintAr, type, cameraGradable, hands });

// iloveyou/stop demoted to watch-only (2026-07-04): the MLP knows the 28
// letters ONLY, so "gradable" for a word sign could only mean teach-then-
// match-your-own-recording — circular for a learner (you can't record a
// correct reference for a sign you don't know). Watch + self-mark until a
// native signer records real reference data (Phase 2, real-sign-content-plan).
export const A1_SIGNS: Sign[] = [
  S("iloveyou", "I love you", "أحبك", "🤟", "static", false,
    "Thumb, index and little finger up — middle and ring folded. Hold it steady, palm out.",
    "الإبهام والسبابة والخنصر مرفوعة — الوسطى والبنصر مطويتان. ثبّت يدك وراحتها للأمام."),
  S("hello", "Hello", "مرحبا", "👋", "dynamic", false,
    "Open hand by your temple, small wave outward.",
    "يد مفتوحة قرب الصدغ، تلويحة صغيرة للخارج."),
  // M7: both hints describe MOTION (nodding / tapping), so a static camera
  // grade would pass a frozen wrong sign — dynamic + watch-only is the honest
  // typing until real signer footage lands.
  S("yes", "Yes", "نعم", "✊", "dynamic", false,
    "Make a fist and nod it gently — like a head saying yes.",
    "اقبض يدك وحرّكها كأنها رأس يقول نعم."),
  S("no", "No", "لا", "🤞", "dynamic", false,
    "Index and middle finger tap against the thumb.",
    "السبابة والوسطى تنقران على الإبهام."),
  S("stop", "Stop", "قف", "✋", "static", false,
    "Flat open hand, palm facing forward — hold it firm.",
    "يد مفتوحة مسطّحة، الراحة للأمام — ثبّتها."),
  S("more", "More", "زيادة", "🤏", "dynamic", false,
    "Fingertips of both hands pinched, tapping together.",
    "أطراف أصابع اليدين مضمومة تتلامس معًا.", 2),
  S("finished", "All done", "خلاص", "🙌", "dynamic", false,
    "Both open hands flip outward — all done!",
    "اليدان المفتوحتان تنقلبان للخارج — خلاص!", 2),
  S("hungry", "Hungry", "جوعان", "🍽️", "dynamic", false,
    "Cupped hand moves down the chest from throat.",
    "يد مقعّرة تنزل على الصدر من الحلق."),
  S("milk", "Milk", "حليب", "🥛", "dynamic", false,
    "Squeeze a fist — like milking. Repeat softly.",
    "اقبض اليد وافتحها — كأنك تحلب. كرّرها بلطف."),
  S("sleep", "Bedtime", "نوم", "😴", "dynamic", false,
    "Open hand draws down over your face, eyes closing.",
    "اليد المفتوحة تنزل على وجهك، والعينان تغمضان."),
  S("mum", "Mum", "ماما", "👩", "dynamic", false,
    "Open hand, thumb to chin.",
    "يد مفتوحة، الإبهام على الذقن."),
  S("dad", "Dad", "بابا", "👨", "dynamic", false,
    "Open hand, thumb to forehead.",
    "يد مفتوحة، الإبهام على الجبين."),
  S("thankyou", "Thank you", "شكرًا", "🙏", "dynamic", false,
    "Flat hand from chin moving forward — giving thanks.",
    "يد مسطّحة من الذقن تتحرك للأمام — تقديم الشكر."),
  S("help", "Help", "ساعدني", "🤲", "dynamic", false,
    "Fist on open palm, both rise together.",
    "قبضة على راحة مفتوحة، ترتفعان معًا.", 2),
  S("careful", "Careful", "انتبه", "👀", "dynamic", false,
    "Two fingers from your eyes outward — watch out.",
    "إصبعان من عينيك إلى الخارج — انتبه."),
  S("name", "Name", "اسم", "🔤", "dynamic", false,
    "Two fingers of each hand tap crossed.",
    "إصبعان من كل يد ينقران متقاطعين.", 2),
  // "People" trio (2026-07-31, owner ask): simple one-handed words available
  // from day one in the Words hub. Same provenance rule as the rest of A1 —
  // ASL-adapted descriptions, disclosed via a1AslProvenance, watch-only.
  S("me", "Me", "أنا", "🙋", "static", false,
    "Point to the middle of your chest with your index finger.",
    "أشِر إلى منتصف صدرك بسبابتك."),
  S("man", "Man", "رجل", "🧔", "dynamic", false,
    "Open hand, thumb taps your forehead, then moves down to your chest.",
    "يد مفتوحة، الإبهام يلمس الجبين ثم ينزل إلى الصدر."),
  S("woman", "Woman", "امرأة", "🧕", "dynamic", false,
    "Open hand, thumb taps your chin, then moves down to your chest.",
    "يد مفتوحة، الإبهام يلمس الذقن ثم ينزل إلى الصدر."),
];
```

And the four lessons removed from `LESSONS`:

```ts
  { id: "a1-u1-l1", unitId: "a1-u1", titleEn: "First connections", titleAr: "أولى الوصلات",
    signIds: ["iloveyou", "hello", "yes", "no"] },
  { id: "a1-u1-l2", unitId: "a1-u1", titleEn: "Everyday needs", titleAr: "احتياجات اليوم",
    signIds: ["more", "finished", "hungry", "milk", "stop"] },
  { id: "a1-u1-l3", unitId: "a1-u1", titleEn: "Home & people", titleAr: "البيت والناس",
    signIds: ["mum", "dad", "sleep", "thankyou", "help", "careful", "name"] },
  { id: "a1-u1-l4", unitId: "a1-u1", titleEn: "People around you", titleAr: "الناس من حولك",
    signIds: ["me", "man", "woman"] },
```

And the unit:

```ts
export const UNIT_A1_U1: Unit = {
  id: "a1-u1",
  tier: "A1",
  titleEn: "Family & First Words",
  titleAr: "العائلة وأول الكلمات",
  signIds: A1_SIGNS.map((s) => s.id),
};
```

## 6. Unit 2 candidates, if the door ever opens

Proposed 2026-07-03 for a future word unit, never built, listed here so the shot list is
one place: water, eat, drink, come, go, where, what, wait, look, home, school, play, hurt,
bathroom. This is a proposal for a signer to correct, not a specification.
