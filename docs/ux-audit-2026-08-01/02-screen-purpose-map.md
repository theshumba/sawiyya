# Screen purpose map

Audit date 2026-08-01. Branch `main`, working tree at `src/`.

**The one question asked of every screen:** does the screen itself tell the user what it is for, what
to do on it, and what happens after? Or does it assume the user already knows?

This is not a bug hunt. Every claim below cites `file:line`. Quoted UI strings are verbatim from
`src/i18n.ts` unless marked as a hardcoded literal, in which case the component line is cited.

A note on routing: every screen also has a hash URL (`src/store/ui.ts:36-60`), so `#/words`,
`#/signs/<id>`, `#/camera/<id>` and so on are additional entry points a shared link can hit cold.
Those are not counted in the per-screen entry lists below, which cover in-app doors only.

---

## The rows

### 1. Home · `src/screens/Home.tsx`

| | |
|---|---|
| **Real title** | No screen title. The `<h1>` is a greeting: `pick(lang, "Marhaba, ", "مرحبًا يا ")` + display name (`Home.tsx:340-343`). |
| **Real subtitle** | `homeGreetSub` = `"Ready to sign today?"` / `"مستعد للإشارة اليوم؟"` (`Home.tsx:345-347`) |
| **Other names for this screen** | Nav tab label `navLearn` = `"Learn"` / `"تعلّم"` (`AppNav.tsx:27`); screen-reader route announcement also `navLearn` (`App.tsx:42`). |

**What it is actually FOR:** the curriculum path, a vertical trail of lesson nodes where the one
pulsing coral node is the next thing to do.

**Does its own copy make that obvious? NO.**
The trail carries no heading, no instruction and no explanation of what a circle is. The only
label on the trail section is `aria-label={t("homeToday", lang)}` = `"Today's lesson"`
(`Home.tsx:375`), which is invisible to sighted users. The current node's meaning is carried by a
`START` badge (`Home.tsx:300-302`, `homeStartBadge`) and by a pulse animation, nothing written.
Locked nodes are padlock glyphs (`Home.tsx:257-262`) whose explanation, `pathLockedMeta` =
`"Finish the sign before this to unlock."`, only appears after you tap one and open the sheet
(`Home.tsx:280-287`, `654`). The treasure chest node has no written meaning at all until tapped.

Below the trail, Block D (`Home.tsx:403-642`) adds eight more cards, each a different way to start:
`camPractice` "Practise the alphabet" (405), `wordsTitle` "Everyday words" (421), `fspHomeCard`
"Spell your name" (437), family flags (453), `homeReviewDue` "Review due" (506), `homeNewLetter`
"Learn a new letter" (537), an all-caught-up card (564), `homeDailyGoal` "Daily goal" (588) and a
milestone readout (603). The screen therefore answers "what do I do now" nine different ways.

**Entry points**
- `AppNav.tsx:27` Learn tab, `AppNav.tsx:149` tab click handler
- `FirstSign.tsx:208` "Keep going" (`fsKeepGoing`), `FirstSign.tsx:232` takeover close
- `LessonPlayer.tsx:78`, `106` (`lsBackHome` "Back home"), `153`, `164`, `185` (`lsContinue`
  "Continue"), `203` (takeover close)
- `Progress.tsx:173` takeover close
- `Settings.tsx:265` takeover close
- Cold hash load `#/` (`ui.ts:38-39`)

**What next, and does the screen say so?** Implicitly the current node, and the START badge is the
strongest signal in the app. But it is competing with eight cards below it, and the screen never
states that the trail is the main path. Partly says so.

**Unexplained jargon / icon-only controls**
- `homeGoldStat` = `"XP"` / `"نقطة"` on a gold dot chip (`Home.tsx:186-192`). Never defined anywhere
  in the app.
- Stat chip markers are bare coloured shapes: coral circle for streak, gold circle for XP, coral
  square for family (`Home.tsx:180`, `187`, `194`).
- `homeUnit` = `"Unit"` on the banner (`Home.tsx:379-391`) with a decorative white book outline
  (`388-390`) that has no meaning.
- `pathDoneMeta` = `"Practised · tap to review"` and `pathNewSign` = `"New sign · camera-graded"`
  are only in the sheet, and "camera-graded" is undefined jargon.
- **The Daily goal card is a button with no affordance.** `GoalCard` renders as a `<button>` when
  `onClick` is passed (`ui.tsx:146-157`, via `GoalCard.tsx:36`), and `Home.tsx:595` routes it to the
  camera. It shows a ring, a label, a percent and a bar, and nothing that says it opens anything.

---

### 2. PractiseChooser · `src/screens/PractiseChooser.tsx`

| | |
|---|---|
| **Real title** | `practiseTitle` = `"Practise"` / `"تمرّن"` (`PractiseChooser.tsx:61-63`) |
| **Real subtitle** | `practiseSubtitle` = `"Pick how you want to sign today."` / `"اختر كيف تشير اليوم."` (`PractiseChooser.tsx:64`) |
| **Other names** | Nav tab `navPractise` = `"Practise"` / `"تدرّب"` (`AppNav.tsx:36`). **In Arabic the tab and the screen use two different words for the same place:** `تدرّب` on the tab, `تمرّن` on the title. |

**What it is actually FOR:** a four-tile hub that routes to the camera on Alif, the Words room,
Fingerspell, and a review session.

**Does its own copy make that obvious? YES.** This is the clearest hub in the app. Title plus
subtitle plus four tiles each with a sub-line: `practiseAlphabetSub` = `"28 letters"`,
`practiseWordsSub` = `"Watch & copy, from day one"`, `practiseFingerspellSub` = `"Spell any word"`,
and a live due count on Review.

The one gap: the Alphabet tile (`PractiseChooser.tsx:70-85`) says "Alphabet · 28 letters" but opens
the live camera on Alif with a permission prompt. Nothing on the tile warns that a camera is about
to turn on.

**Entry points**
- `AppNav.tsx:33` Practise tab, `AppNav.tsx:149`
- `CameraPractice.tsx:122` back arrow (`backOrParent`)
- `Words.tsx:87` back arrow
- `Fingerspell.tsx:130` back arrow

**What next?** Pick a tile. Stated by the subtitle. Good.

**Unexplained jargon / icon-only**
- The Review tile's chip is a bare `↺` glyph (`PractiseChooser.tsx:128`).
- `practiseReviewCountSuffix` = `"due"` with no explanation of what "due" means or who decided it.
- The "More dialects coming soon" panel (`PractiseChooser.tsx:171-184`) is a hardcoded literal, not
  in `i18n.ts`, and is inert.

---

### 3. CameraPractice · `src/screens/CameraPractice.tsx`

| | |
|---|---|
| **Real title** | `camPractice` = `"Practise the alphabet"` / `"تدرّب على الحروف"` (`CameraPractice.tsx:128`) |
| **Real subtitle** | **None.** |
| **Other names** | Route announcement is `navPractise` = `"Practise"` (`App.tsx:44`), a third name again. |

**What it is actually FOR:** point the camera at your hand and have an on-device model grade one
target letter, with a 28-chip strip to change the target.

**Does its own copy make that obvious? PARTLY.** The `CameraTrainer` body does explain the moment
well: `"Current Goal"` eyebrow and `camSign` "Sign: {target}" (`CameraTrainer.tsx:527`, `541`), a
reference stage, `camStart` "Start camera" with `camPrivacy` "100% on your device" under it
(`CameraTrainer.tsx:853-855`), and live status lines `camLooking` / `camHandSeen` / `camHold` /
`camMatch`.

What the screen does NOT explain:
- **The letter strip has no instruction** (`CameraPractice.tsx:142-180`). Twenty-eight Arabic glyphs
  plus three dashed non-selectable ones. Nothing says tapping one changes what you are being graded
  on. The dashed chips carry `signRefOnlyNote` only as `title`/`aria-label` (`163-164`), invisible
  to a sighted user, so they read as broken.
- **The title lies when the screen is deep-linked.** Ten call sites open this screen with
  `targetSignId` set to a word sign, and the header still reads "Practise the alphabet".

**Entry points (11 in-app, the most of any screen)**
- `PractiseChooser.tsx:72` Alphabet tile, labelled `"Alphabet"` + `"28 letters"`
- `Home.tsx:408` card labelled `camPractice` "Practise the alphabet"
- `Home.tsx:495` family flag card, labelled with the sign gloss
- `Home.tsx:548` card labelled `homeNewLetter` "Learn a new letter"
- `Home.tsx:570` card labelled `"All caught up — keep your hands warm"` (hardcoded literal, 577)
- `Home.tsx:595` the unlabelled Daily goal card
- `Home.tsx:166` milestone fallback, labelled `lsPartDoneCta` "Keep going"
- `Home.tsx:753` sheet secondary, labelled `practiceCamera` "Practise with camera"
- `AllSigns.tsx:220` via detail CTA `practiceCamera` (754-757) and via the flagged CTA (290-303)
- `Family.tsx:75`, `FlagPicker.tsx:359`, `FlagPicker.tsx:433` ("Practise these", hardcoded 440)
- `Progress.tsx:227` (button labelled `practiceCamera`, 505-510), `Progress.tsx:233` Constellation tap
- `LessonPlayer.tsx:99` (`practiceCamera`), `LessonPlayer.tsx:186` results CTA
- `Settings.tsx:316` button labelled `setNotGranted` = **"Not granted yet"**
- `InfoPages.tsx:197` button labelled `"Let's Practice Together"` (hardcoded literal, 198)
- `Onboarding.tsx:150` alphabet track, `autoStart: true`

**What next?** On a match the screen auto-advances to the next letter after 600ms
(`CameraPractice.tsx:87-99`). Nothing tells the user that will happen. It just moves.

**Unexplained jargon / icon-only**
- Streak pill: a coral dot and a number, no label (`CameraPractice.tsx:129-134`).
- `camConfidence` = "Camera confidence" over a meter, with no explanation of what a good number is.
- `camMatchOwn` = "Matched your own recording", meaningless unless you used teach mode.
- `camSelfMark` "I signed it right" / `camSelfMarkSub` "Mark it yourself — you know your hands."
  is good copy, but appears without warning after a struggle.
- Chip star badge for "trained" state (`Tile.tsx:44-46`) has no legend.

---

### 4. Words · `src/screens/Words.tsx`

| | |
|---|---|
| **Real title** | `wordsTitle` = `"Everyday words"` / `"كلمات يومية"` (`Words.tsx:93`) |
| **Real subtitle** | `wordsSubtitle` = `"Watch, copy, mark yourself — no letters needed first."` / `"شاهد وقلّد وقيّم نفسك — لا تحتاج الحروف أولًا."` (`Words.tsx:95`) |
| **Other names** | `practiseWords` = `"Words"` on the Practise tile (`PractiseChooser.tsx:95`). |

**What it is actually FOR:** 16 everyday word signs you watch and then mark yourself on, no camera
grading.

**Does its own copy make that obvious? YES.** The subtitle names the entire loop in seven words and
tells you the prerequisite is nothing. It is the best subtitle in the app. Section headers
`wordsOneHand` "One hand" and `wordsTwoHands` "Two hands" are meaningful and the sheet carries the
demo, a hint, and one primary button.

**Entry points**
- `PractiseChooser.tsx:90` tile labelled `practiseWords` "Words"
- `Home.tsx:424` card labelled `wordsTitle` "Everyday words"
- `Home.tsx:164` milestone route, labelled with the milestone's own dynamic label
- `LessonPlayer.tsx:188` results, primary button labelled `wordsTitle` "Everyday words" (1073)

**What next?** `wordsMarked` = `"Marked — it'll come back in review."` (`Words.tsx:167`) states the
consequence honestly. Good.

**Unexplained jargon / icon-only**
- "review" in `wordsMarked` is never defined, and there is no route from here to the review session.
- The practised tick on a tile is `aria-hidden` with the state folded into the label
  (`Words.tsx:213-220`); visually it is a bare teal check with no legend.
- Emoji on tiles are meaning cues, not signs, and nothing says so (`Words.tsx:221-223`).

---

### 5. Fingerspell · `src/screens/Fingerspell.tsx`

| | |
|---|---|
| **Real title** | `fspTitle` = `"Fingerspell"` / `"التهجئة بالإشارة"` (`Fingerspell.tsx:137`) |
| **Real subtitle** | `fspSubtitle` = `"Type any word — Arabic or English letters — and watch it spelled letter by letter."` / `"اكتب أي كلمة — بالعربية أو بأحرف إنجليزية — وشاهدها تُتهجّى حرفًا حرفًا."` (`Fingerspell.tsx:140`) |
| **Other names** | `fspHomeCard` = `"Spell your name"` on Home (`Home.tsx:446`); `practiseFingerspell` = `"Fingerspell"` on the Practise tile (`PractiseChooser.tsx:116`). |

**What it is actually FOR:** type a word, watch it spelled with real signer photos, optionally
camera-check each gradable letter.

**Does its own copy make that obvious? YES, the strongest on the list.** The subtitle states the
whole mechanic, `fspInputLabel` labels the field, `fspEmpty` = `"Type a word to begin — try your
name."` fills the empty state with an instruction and an example, `fspLatinNote` and `fspSkippedNote`
disclose every silent transformation, and `fspPractiseAlong` / `fspPractiseAlongSub` =
`"Camera-check each letter of your word"` names the second mode before you enter it.

**Entry points**
- `PractiseChooser.tsx:109` tile labelled "Fingerspell · Spell any word"
- `Home.tsx:440` card labelled "Spell your name · Fingerspell any word, letter by letter"

**What next?** `fspDone` = `"You spelled the whole word!"` then nothing. The screen has no onward
route after practise-along completes.

**Unexplained jargon / icon-only**
- The backspace key uses the `arrow_back` icon, not a backspace glyph, because backspace is not in
  the subsetted font (`Fingerspell.tsx:179-181`). It is visually identical to the header back arrow
  two inches above it.
- The 29-key Arabic pad (`Fingerspell.tsx:161-182`) has no label; nothing says it types into the
  field above.
- `fsSignerTag` = `"REAL SIGNER"` overlay on the photo (`Fingerspell.tsx:293-295`) with no
  explanation of why that matters.

---

### 6. AllSigns · `src/screens/AllSigns.tsx`

| | |
|---|---|
| **Real title** | Hardcoded literal `pick(lang, "Sign Dictionary", "القاموس")` (`AllSigns.tsx:237`). **Not in `i18n.ts`.** |
| **Real subtitle** | Hardcoded literal `pick(lang, "Qatari Sign Language · خليجي", "لغة الإشارة القطرية · خليجي")` (`AllSigns.tsx:238-240`) |
| **Other names** | Nav tab `navDictionary` = `"Signs"` / `"القاموس"` (`AppNav.tsx:38`); route announcement `navDictionary` (`App.tsx:45`); Settings row `"Signs dictionary"` (hardcoded, `Settings.tsx:445`); the camera error escape says `stBrowseSigns` = `"Browse the signs →"` (`CameraTrainer.tsx:880`). **Four names in English for one screen.** |

**What it is actually FOR:** browse every sign, filter or search, tap one to open a detail panel with
a demo, a hint, a camera CTA or a self-mark, a flag toggle and a share.

**Does its own copy make that obvious? NO.** The subtitle describes the *content* ("Qatari Sign
Language"), not the *interaction*. On desktop an empty-panel placeholder does say
`"Pick a sign to see how it's made."` (`AllSigns.tsx:407-412`), but that block is inside
`md:block` and **never renders on a phone**, which is the app's primary form factor. On mobile this
is a grid of cards with no instruction whatsoever.

**Entry points**
- `AppNav.tsx:38` Signs tab, `AppNav.tsx:149`
- `Settings.tsx:446` row labelled "Signs dictionary"
- `Home.tsx:496` flag card for a non-gradable sign
- `Family.tsx:76` flag row / board pill / honeycomb cell
- `FlagPicker.tsx:360`, `FlagPicker.tsx:434` ("Watch these", hardcoded 441)
- `Progress.tsx:233` Constellation tap and forecast row tap
- `LessonPlayer.tsx:188` results chip
- `CameraTrainer.tsx:879` camera-error escape hatch, "Browse the signs →"
- `Onboarding.tsx:150` words track

**What next?** Nothing on the browse view says. The detail panel offers up to five actions with no
priority stated.

**Unexplained jargon / icon-only**
- `signBadgeGraded` = `"Graded"` and `signBadgeMotion` = `"Watch"` sit on every card
  (`AllSigns.tsx:85-99`, `553`) with no legend. "Graded" is meaningless before you have used the
  camera.
- Status captions use a third vocabulary: `STATUS_META.flagged.en` = `"Family list"`
  (`AllSigns.tsx:34`), while the filter chip for the same state says `"Flagged"` (`AllSigns.tsx:207`)
  and the detail button says `"Flag"` (`AllSigns.tsx:818`). Three words, one concept, one screen.
- `"Mastered"`, `"Review soon"`, `"Unit 2"`, `"New"` (`AllSigns.tsx:33-41`) are all undefined.
- **The heart button at the top of the detail panel is icon-only** (`AllSigns.tsx:658-673`) and does
  exactly the same thing as the labelled pin button further down (`AllSigns.tsx:800-819`). Two
  controls, one action, one of them unlabelled.
- `"Add to Daily Review"` (`AllSigns.tsx:794`) introduces a fourth noun for the review system.

---

### 7. Family · `src/screens/Family.tsx`

| | |
|---|---|
| **Real title** | `famHousehold` = `"Your household"` / `"أسرتك"` as the `<h1>` (`Family.tsx:129-131`), under an eyebrow `famTitle` = `"Family"` / `"العائلة"` (`Family.tsx:128`) |
| **Real subtitle** | Computed line: learner count + `famSignsTogether` = `"signs together"` (`Family.tsx:132-137`) |
| **Other names** | Nav tab `navFamily` = `"Family"` (`AppNav.tsx:39`); Settings routes here twice under `setProfiles` = `"Manage profiles"` (`Settings.tsx:271`) and again under a hardcoded `"Manage profiles"` (`Settings.tsx:441`). |

**What it is actually FOR:** the household surface. Switch active profile, add or remove members,
see the Deaf member's flagged signs, open the flag picker, see the shared board.

**Does its own copy make that obvious? PARTLY.** Every section has an eyebrow, and
`famOnlyDeafFlags` = `"flags the signs — the curriculum follows them."` (`Family.tsx:280`) states the
product's core idea in one line. But three things are silent:
- **The member row is the profile switcher and nothing says so.** Tapping a member card calls
  `app.switchProfile` (`Family.tsx:159-163`). The only signal is `aria-pressed` and a green ring. A
  hearing parent tapping their Deaf child's face to "see them" silently becomes that child.
- **The mastery dots have no legend.** Zero to three coloured dots per flag row
  (`Family.tsx:350-365`), colour-only, `aria-hidden`, meaning folded into the row's `aria-label`.
- The "Signs we can all do" honeycomb (`Family.tsx:425-458`) is 25 hexagons with no instruction.

**Entry points**
- `AppNav.tsx:39` Family tab, `AppNav.tsx:149`
- `Home.tsx:474` link labelled `"{n} family requests"` (hardcoded, 477-483)
- `Home.tsx:163` milestone route
- `Settings.tsx:271` "Manage profiles" and `Settings.tsx:441` "Manage profiles" (**the same label
  twice on one screen, in two different groups**)
- `Progress.tsx:257` league empty state, button labelled `famAdd` = `"Add a family member"`
- `FlagPicker.tsx:143` takeover close and `FlagPicker.tsx:470` "Done ({n})"

**What next?** The coral CTA `famFlagTitle` = `"Flag signs we need"` (`Family.tsx:393-402`) is the
one dominant action and it is clearly labelled. Good.

**Unexplained jargon / icon-only**
- `famSharedStreak` = `"Household streak"` next to a 🔥 emoji and a number (`Family.tsx:139-141`).
- The remove control is a bare `close` icon on each member tile (`Family.tsx:184-193`), labelled only
  for screen readers.
- `"25 Combined Signs!"` (`Family.tsx:492-497`) is an undefined milestone, and the card routes to the
  **flag picker** (`Family.tsx:483`) which has nothing to do with combined signs. See Q1.

---

### 8. FlagPicker · `src/screens/FlagPicker.tsx`

| | |
|---|---|
| **Real title** | `famFlagTitle` = `"Flag signs we need"` / `"حدّد الإشارات التي نحتاجها"` in the takeover header (`FlagPicker.tsx:142`) |
| **Real subtitle** | Hero `<h2>` hardcoded `"You direct what they learn"` / `"أنت توجّه ما يتعلمونه"` (`FlagPicker.tsx:163-165`) plus hardcoded `"Flag the signs your family needs — everyone's queue follows."` (`FlagPicker.tsx:166-172`) |

**What it is actually FOR:** the Deaf member picks which signs the household must learn.

**Does its own copy make that obvious? YES.** Title, hero line, hero body and an explicit
`"Tap a sign to flag it."` in the empty summary (`FlagPicker.tsx:384`). This screen teaches itself
better than any other, and it is also the app's least-visited screen.

**Entry points (2, both from Family)**
- `Family.tsx:397` coral CTA labelled `famFlagTitle` "Flag signs we need"
- `Family.tsx:483` milestone teaser card labelled `"25 Combined Signs!"` and `"X% there"`. **Same
  destination, completely unrelated label.**

**What next?** A sticky footer with a count and `"Done ({n})"` returning to Family
(`FlagPicker.tsx:457-474`), plus a "Practise these" CTA. Clearly stated.

**Unexplained jargon / icon-only**
- `"Most Needed"` toggle (`FlagPicker.tsx:203-216`) appears only once something is flagged, and never
  explains that it only reorders flagged items to the front.
- `"Requestors"` (`FlagPicker.tsx:391-393`) is not plain English.
- `famCoRequested` = `"You asked for this too"` and `famAskToo` = `"Ask for this too"` appear without
  explaining that a non-raiser cannot unflag.
- The pin icon (`FlagPicker.tsx:278-285`) is the only selection affordance on each tile.

---

### 9. LessonPlayer · `src/screens/LessonPlayer.tsx`

| | |
|---|---|
| **Real title** | **None at screen level.** The takeover is rendered with no `title` (`LessonPlayer.tsx:78`, `153`, `176`, `203`), so `ScreenShell` renders no `<h1>` (`ScreenShell.tsx:50`). |
| **Per-drill titles** | `lsWatchTitle` = `"A new sign"`, `lsRecogniseTitle` = `"What does this sign mean?"`, `lsRecallTitle` = `"Which sign means…"`, `lsReviewTitle` = `"Quick review"`. Step labels `lsWatchStep` = `"Watch the sign"` and `lsSignBack` = `"Sign it back"` (`LessonPlayer.tsx:195-200`). |
| **Screen-reader name** | `srLesson` = `"Lesson"` (`App.tsx:43`), which no sighted user ever sees. |

**What it is actually FOR:** a mixed drill session, one card at a time, ending in a results screen.

**Does its own copy make that obvious? PARTLY.** Each individual drill is well-labelled and the
progress bar with `n/total` (`LessonPlayer.tsx:266-268`) tells you how long it is. But the session as
a whole is never named. You tap "Start →" on Home and land in an unnamed takeover with no statement
of what lesson this is, how many signs it covers, or what finishing it unlocks. The lesson title is
shown only on the **end** cards (`LessonPlayer.tsx:896-900`, `988-992`), after it is over.

**Entry points**
- `Home.tsx:677` node sheet primary, labelled `pathStartCta` = `"Start →"`
- `Home.tsx:681` done-node replay, labelled `pathReview` = `"Review →"`
- `Home.tsx:510` card labelled `homeReviewDue` = `"Review due"` → `lessonId: "review"`
- `Home.tsx:165` milestone route
- `PractiseChooser.tsx:125` tile labelled `practiseReview` = `"Review"` → `"review"`
- `PractiseChooser.tsx:142` banner labelled `homeReviewDue` = `"Review due"` → `"review"`
- `Progress.tsx:159` button labelled hardcoded `"Start Review Session"` (`Progress.tsx:520`) → `"review"`

**What next?** Stated well at the end: `lsPartDoneBody` = `"{n} signs still to practise. One more
round finishes this lesson."` and `lsWhatsNext` = `"What's next"` with per-sign chips.

**Unexplained jargon / icon-only**
- The streak pill is again a coral dot plus a number, no label (`LessonPlayer.tsx:245-250`).
- `lsXpEarned` = `"XP earned"` with XP never defined.
- The results card is rendered with `chrome="takeover"` and **no `onClose`** (`LessonPlayer.tsx:176`),
  so there is no header and no back arrow. The only exits are the two buttons.
- `a1AslProvenance` (`LessonPlayer.tsx:414`) is an honest but heavy disclaimer mid-drill.

---

### 10. Progress · `src/screens/Progress.tsx`

| | |
|---|---|
| **Real title** | **Changes with the tab.** `title={headerTitle}` where `headerTitle` is the active tab's label (`Progress.tsx:168`, `173`). So the header reads `prTabOasis` = `"Your oasis"` / `"واحتك"` on arrival, then `prTabStats` = `"Stats"`, `prTabAchieve` = `"Achievements"`, `prTabLeague` = `"Family league"`. |
| **Real subtitle** | Per tab: `prOasisBody` = `"Every sign you learn plants something new."`; Stats and Achievements have none beyond `prAchieveSummary`; `prLeagueBody` = `"Growing together."` |
| **Other names** | The only door is labelled `navProgress` = `"Progress"` / `"التقدم"` (`AppNav.tsx:96`), and the route announcement is also `navProgress` (`App.tsx:47`). **The word "Progress" never appears anywhere on the screen itself.** |

**What it is actually FOR:** four read-only views of your own data plus a route into the review
session.

**Does its own copy make that obvious? NO.** A user taps a menu item called "Progress" and arrives at
a page headed "Your oasis" showing a cartoon desert. Nothing reconciles the two. The oasis metaphor
is never explained: `prPlanted` = `"signs planted"` and `prPalmsGrown` = `"palms grown"` are
invented units, and the palms are drawn one per letter practised (`Progress.tsx:367-391`) with no
key. A learner at zero letters sees bare sand and no explanation of why.

**Entry points (1, and it is hidden)**
- `AppNav.tsx:95-111` inside the profile menu, which opens from a button whose only label is
  `navProfile` = `"Profile"` under an avatar emoji (`AppNav.tsx:116-134`). Nothing anywhere in the
  app tells a user that Progress lives behind their own face.

**What next?** Only the Oasis tab offers an action (`"Start Review Session"`, `Progress.tsx:515-522`,
or the empty-state camera button, `503-510`). Stats, Achievements and League are dead ends with a
back arrow.

**Unexplained jargon / icon-only**
- `prMastered` = `"signs mastered"` vs `prPlanted` = `"signs planted"` vs `prStatMastered` =
  `"Signs mastered"`: two names for the same number on adjacent surfaces (`Progress.tsx:416`, `449`,
  `593`).
- `prBestStreak` is labelled `"Current streak"` in English (`i18n.ts:334`) and fed `streak`, while
  the Achievements tab reads `profile.bestStreak` (`Progress.tsx:247`). One word, two meanings.
- The month heatmap (`Progress.tsx:612-625`) has a `less`/`more` legend but binary data, and no
  explanation of what a cell is.
- **The Constellation is 31 tappable circles with no stated behaviour** (`Progress.tsx:808-858`).
  Unlit nodes show a **number**, lit ones show a letter, and the caption is
  `"Connect the signs to light the sky"` (hardcoded, `854`). Tapping opens the camera or the
  dictionary depending on `cameraGradable` (`Progress.tsx:231-234`), unannounced.
- Forecast row badges `"<1d"` / `"3d"` (`Progress.tsx:557`) with no key.
- The streak celebration takes over the whole screen unprompted on mount
  (`Progress.tsx:111-113`, `908`).

---

### 11. Settings · `src/screens/Settings.tsx`

| | |
|---|---|
| **Real title** | `setTitle` = `"Settings"` / `"الإعدادات"` (`Settings.tsx:264`) |
| **Real subtitle** | **None.** |

**What it is actually FOR:** name, language, daily goal, camera permission and training reset,
household export/import, links to the two info pages.

**Does its own copy make that obvious? YES.** Conventional grouped list with mono eyebrows:
"Account", "Preferences", "Camera & privacy", `setHousehold` = `"Household data"`, "About". Every row
is a labelled chevron row. This is the most conventional screen in the app and it reads correctly.

**Entry points**
- `AppNav.tsx:97` profile menu item labelled `setTitle` "Settings"
- `InfoPages.tsx:105` and `InfoPages.tsx:311` takeover close from the two info pages
- `DevMetrics.tsx:36`

**What next?** Nothing to finish. Back arrow to Home. Correct for a settings screen.

**Unexplained jargon / icon-only**
- **Duplicate rows.** `Settings.tsx:271` and `Settings.tsx:441` both read "Manage profiles" and both
  route to Family. `Settings.tsx:328` reads `setPrivacy` "Privacy" and `Settings.tsx:451` reads
  "Privacy policy"; both route to `privacy`. Four rows, two destinations.
- The camera permission row's action button is labelled `setNotGranted` = **"Not granted yet"**
  (`Settings.tsx:314-322`). That is a status, not an action, and tapping it opens the camera screen.
- Colour chips on every row (`Settings.tsx:520`) are `aria-hidden` decoration with no meaning; the
  same gold chip marks both "Manage profiles" rows and the same grey chip marks both privacy rows.
- The version logo is a hidden five-tap gate to a dev screen (`Settings.tsx:159-165`, `474-486`),
  with `aria-label="Sawiyya v1.0"`, so a screen-reader user can trip it.

---

### 12. InfoPages · `src/screens/InfoPages.tsx` (two screens)

**12a. AiTransparency**

| | |
|---|---|
| **Real title** | Hardcoded `"How the AI works"` / `"كيف يعمل الذكاء الاصطناعي"` (`InfoPages.tsx:104`) |
| **Other name** | The Settings row that opens it says `setAi` = `"What the AI can and can't do"` / `"ما تستطيعه الكاميرا الذكية وما لا تستطيعه"` (`Settings.tsx:327`), and `App.tsx:56` announces `setAi`. **Two different names.** |
| **Subtitle** | Hardcoded `"Built for your family, designed for trust."` (`InfoPages.tsx:115-119`) |

**Purpose:** state plainly what the on-device model does and does not do.
**Obvious? YES.** It is long-form explanatory prose and it does its job. The four cards each carry a
title and a paragraph; the guarantee bullets are `aiBulletNoUpload` through `aiBulletDelete`.
**Entry points:** `Settings.tsx:327`; `InfoPages.tsx:422` from Privacy.
**What next?** One dominant CTA `"Let's Practice Together"` → the camera (`InfoPages.tsx:197`), plus
a demoted link to Privacy (`221`). Stated.
**Jargon:** the three-step flow strip is three coloured boxes with abstract shapes inside
(`InfoPages.tsx:132-152`) labelled `aiFlowCamera` / `aiFlowModel` / `aiFlowGrade`; "On-device model"
is undefined. The `"Mada Innovation Award 2026 entry"` badge (`InfoPages.tsx:112-114`) is
award-submission chrome facing a learner.

**12b. Privacy**

| | |
|---|---|
| **Real title** | Hardcoded `"Privacy"` / `"الخصوصية"` (`InfoPages.tsx:310`) |
| **Real subtitle** | Hero `"Your hands stay home"` + `"Privacy as a feature, not small print."` (`InfoPages.tsx:322-330`) |

**Purpose:** the privacy promise plus the one destructive "erase everything" control.
**Obvious? YES.** Clear headings, plain paragraphs, an itemised storage list.
**Entry points:** `Settings.tsx:328` ("Privacy"), `Settings.tsx:451` ("Privacy policy"),
`InfoPages.tsx:221` ("Read the privacy promise"). **Three doors, three labels.**
**What next?** Nothing required. Back to Settings.
**Jargon:** `"Local Cache"` and `"Learned handshape samples"` (`InfoPages.tsx:385-392`) are developer
words. The destructive button reads `"Delete Local Data"` (`InfoPages.tsx:412`) while its heading
says `"Erase everything"` (`401`), and it wipes `localStorage` and reloads (`291-304`).

---

### 13. FirstSign · `src/screens/FirstSign.tsx`

| | |
|---|---|
| **Real title** | Per phase: `fsDemoTitle` = `"Watch it once"` / `"شاهدها مرّة"` (`FirstSign.tsx:246-248`), then `fsLiveTitle` = `"Now make the sign"` / `"الآن أدِّ الإشارة"` (`FirstSign.tsx:264-266`), then a celebration. |
| **Real subtitle** | `fsIntro` = `"Let's learn the first thing you'll say:"` above the title (`FirstSign.tsx:245`); `fsDemoSub` = `"A real signer's hand (ArSL21L dataset)"`; `fsLiveSub` = `"The camera is grading you live"`. |
| **Screen-reader name** | `srFirstSign` = `"Your first sign"` (`App.tsx:53`), never shown visually. |

**What it is actually FOR:** the onboarding hook. Watch Alif once, sign it back, celebrate.

**Does its own copy make that obvious? YES.** A three-beat arc, each beat titled and sub-titled, one
dominant button `fsNowYou` = `"Now you try"` (`FirstSign.tsx:279-286`).

**Entry points (1)**
- `Onboarding.tsx:150`, the default when the learner picked no track. Unreachable afterwards except
  by typing `#/first-sign` (`ui.ts:99`).

**What next?** `fsDone` = `"That's one. Your family will feel this."` then `fsKeepGoing` =
`"Keep going"` → Home (`FirstSign.tsx:204-215`). Stated clearly.

**Unexplained jargon / icon-only**
- **The progress counter starts at 2.** `num = idx + 2` (`FirstSign.tsx:37`), so the first screen a
  brand-new user ever sees reads `2/4`. Nothing explains the missing step 1.
- `fsDemoSub` names a dataset, "ArSL21L", to a first-time learner.
- `fsDoneBadgeMatch` = `"live match"` on the success pill (`FirstSign.tsx:191`).
- The `"Now you try"` button carries a decorative image chip (`FirstSign.tsx:282-285`).

---

### 14. AppNav · `src/components/AppNav.tsx`

| | |
|---|---|
| **Labels** | `navLearn` "Learn", `navPractise` "Practise" / `"تدرّب"`, `navDictionary` "Signs" / `"القاموس"`, `navFamily` "Family", plus `navProfile` "Profile" / `"حسابي"` (`AppNav.tsx:26-40`, `130`) |

**What it is actually FOR:** the single navigation source of truth. Four tabs plus a profile button
that absorbs Progress and Settings.

**Does its own copy make that obvious? PARTLY.** Four labelled tabs is right. But:
- **Two of the app's ten destinations are hidden behind an avatar.** Progress and Settings exist only
  inside the profile popover (`AppNav.tsx:95-111`). A first-time user has no reason to tap their own
  face to find their stats.
- Every tab label disagrees with the screen it opens in at least one language. "Practise" opens a
  screen titled "Practise" in English but `تدرّب` vs `تمرّن` in Arabic. "Signs" opens "Sign
  Dictionary". "Learn" opens a greeting. "Family" opens "Your household".
- The Practise tab stays lit for four different screens (`AppNav.tsx:34`: `practiseChooser`, `camera`,
  `words`, `fingerspell`), so the highlight stops meaning "you are here".
- **No takeover screen has a nav at all.** `ScreenShell` mounts `AppNav` only for `chrome="tabs"`
  (`ScreenShell.tsx:76-84`). Progress, Settings, FlagPicker, LessonPlayer, FirstSign, Privacy and
  AiTransparency all lose the tab bar entirely, and the only exit is one back arrow whose
  `aria-label` is `back` but whose destination varies per screen.

**Unexplained jargon / icon-only**
- The badge count on the Family tab (`AppNav.tsx:143`, `159-163`) is a bare number with no legend.
- Material icon names carry the meaning: `videocam` for Practise, `menu_book` for Signs, `favorite`
  for Family. A heart for "Family" is not a conventional mapping.

---

## Question 1 · Many doors, same room

Destinations reached from more than one place under more than one label.

### The camera (`{ name: "camera" }`) · 17 doors, 9 distinct labels

| Label shown to the user | file:line |
|---|---|
| `camPractice` "Practise the alphabet" | `Home.tsx:408` |
| `homeNewLetter` "Learn a new letter" | `Home.tsx:548` |
| "All caught up — keep your hands warm" (hardcoded) | `Home.tsx:570`, string at `577` |
| *no label at all*, the Daily goal card | `Home.tsx:595` |
| `lsPartDoneCta` "Keep going" via milestone | `Home.tsx:166` |
| `practiceCamera` "Practise with camera" | `Home.tsx:753` |
| the sign's own gloss, family flag card | `Home.tsx:495` |
| `practiseAlphabet` "Alphabet" + "28 letters" | `PractiseChooser.tsx:72` |
| `practiceCamera` "Practise with camera" | `AllSigns.tsx:220` / `754-757` |
| "Practise your N flagged signs" (hardcoded) | `AllSigns.tsx:290-303` |
| the sign's own gloss | `Family.tsx:75`, `FlagPicker.tsx:359` |
| "Practise these" (hardcoded) | `FlagPicker.tsx:433`, string at `440` |
| `practiceCamera` "Practise with camera" | `Progress.tsx:227` / `505-510` |
| a Constellation node, unlabelled | `Progress.tsx:233` |
| `practiceCamera` "Practise with camera" | `LessonPlayer.tsx:99`, `186` / `1057-1062` |
| `setNotGranted` **"Not granted yet"** | `Settings.tsx:316` |
| **"Let's Practice Together"** (hardcoded) | `InfoPages.tsx:197`, string at `198` |
| onboarding alphabet track, `autoStart` | `Onboarding.tsx:150` |

This is the single worst instance in the app. Note especially `Settings.tsx:316`, where a *status
label* is the button, and `InfoPages.tsx:197`, where an AI-explainer page's hero CTA drops you into
the grader.

### The dictionary (`allSigns`) · 9 doors, 4 distinct labels

`"Signs"` (`AppNav.tsx:38`) · `"Sign Dictionary"` on arrival (`AllSigns.tsx:237`) ·
`"Signs dictionary"` (`Settings.tsx:446`) · `stBrowseSigns` `"Browse the signs →"`
(`CameraTrainer.tsx:879`). Silent, gloss-labelled doors at `Home.tsx:496`, `Family.tsx:76`,
`FlagPicker.tsx:360`, `FlagPicker.tsx:434` ("Watch these"), `Progress.tsx:233`,
`LessonPlayer.tsx:188`, `Onboarding.tsx:150`.

### The review session (`lesson` with `lessonId: "review"`) · 4 doors, 3 distinct labels

`homeReviewDue` "Review due" (`Home.tsx:510`) · `practiseReview` "Review" (`PractiseChooser.tsx:125`)
· `homeReviewDue` "Review due" again on the banner (`PractiseChooser.tsx:142`) · hardcoded
`"Start Review Session"` (`Progress.tsx:159` / `520`).

### Family · 7 doors, 4 distinct labels

`navFamily` "Family" (`AppNav.tsx:39`) · `"{n} family requests"` (`Home.tsx:474`) ·
`setProfiles` "Manage profiles" (`Settings.tsx:271`) · hardcoded "Manage profiles" **again**
(`Settings.tsx:441`) · `famAdd` "Add a family member" (`Progress.tsx:257`) · `FlagPicker.tsx:143`,
`470` ("Done").

**`Settings.tsx:271` and `Settings.tsx:441` are the same label, the same destination and the same
colour chip, rendered twice on one screen in two different groups.**

### FlagPicker · 2 doors, 2 unrelated labels

`famFlagTitle` "Flag signs we need" (`Family.tsx:397`) and **"25 Combined Signs! · X% there"**
(`Family.tsx:483`). The second door's label describes a milestone, not flagging.

### Words · 4 doors, 3 distinct labels

`practiseWords` "Words" (`PractiseChooser.tsx:90`) · `wordsTitle` "Everyday words" (`Home.tsx:424`,
and again as the results CTA at `LessonPlayer.tsx:188` / `1073`) · a milestone label (`Home.tsx:164`).

### Fingerspell · 2 doors, 2 distinct labels

`practiseFingerspell` "Fingerspell" (`PractiseChooser.tsx:109`) · `fspHomeCard` "Spell your name"
(`Home.tsx:440`).

### Privacy · 3 doors, 3 distinct labels

`setPrivacy` "Privacy" (`Settings.tsx:328`) · "Privacy policy" (`Settings.tsx:451`) ·
"Read the privacy promise" (`InfoPages.tsx:221`).

### AiTransparency · 2 doors, 2 distinct labels

`setAi` "What the AI can and can't do" (`Settings.tsx:327`) · "How the AI works"
(`InfoPages.tsx:422`), which is also the page's own title (`InfoPages.tsx:104`).

---

## Question 2 · Pure lists with no instruction

Surfaces where the user must guess the interaction because nothing on screen states it.

1. **AllSigns browse grid on mobile** (`AllSigns.tsx:371-383`). The only instruction,
   `"Pick a sign to see how it's made."`, is inside a `hidden md:block` aside (`AllSigns.tsx:388`,
   `407-412`) and never renders on a phone.
2. **CameraPractice letter strip** (`CameraPractice.tsx:142-180`). Thirty-one glyph chips. Nothing
   says tapping one retargets the grader; nothing says the three dashed ones are inert.
3. **Progress Constellation** (`Progress.tsx:808-858`). Thirty-one circles, some numbered, some
   lettered. Caption is `"Connect the signs to light the sky"`, which is a slogan, not an
   instruction. Tapping routes to two different screens depending on the sign.
4. **Family member row** (`Family.tsx:149-215`). Cards that silently switch the active profile.
5. **Family "Signs we can all do" honeycomb** (`Family.tsx:425-458`). Twenty-five hexagons; the
   filled ones are buttons, the empty ones are not, and nothing says which.
6. **Family flag-row mastery dots** (`Family.tsx:350-365`). Colour-only, no legend, `aria-hidden`.
7. **Fingerspell Arabic letter pad** (`Fingerspell.tsx:161-182`). Twenty-nine unlabelled keys.
8. **Progress month heatmap** (`Progress.tsx:612-625`). A `less`/`more` legend and nothing else.
9. **Progress Achievements grid** (`Progress.tsx:674-710`). Six tiles, some dashed; the dash means
   locked and is never stated.
10. **Home stat chips** (`Home.tsx:355-369`). Three numbers under three coloured blobs, one of them
    labelled only "XP".
11. **AllSigns alphabet cell grid** (`AllSigns.tsx:354-368`) in learned/current/locked colours with
    no key.

---

## Question 3 · Screens that collide

**a. Home's Block D vs the Practise tab.** `Home.tsx:403-450` offers Practise the alphabet, Everyday
words and Spell your name as cards. `PractiseChooser.tsx:70-134` offers Alphabet, Words, Fingerspell
and Review as tiles. Same four destinations, different shapes, different words, on two screens the
user reaches with one tap of each other. A learner cannot say which is "the" practice menu.

**b. Words vs AllSigns (the Signs tab).** Both list sign cards. Both open a sheet containing the same
`SignDemo` component, the same hint block and the same `camSelfMark` "I signed it right" button
(`Words.tsx:140-178` vs `AllSigns.tsx:690`, `770-781`). Both write the identical drill result
(`Words.tsx:49` and `AllSigns.tsx:159` both call `recordDrillResult(id, "hard", {selfMark:true})`).
The only real difference is that AllSigns also contains the alphabet and has search. In plain words:
"Words" is a smaller copy of "Signs" with a nicer subtitle, and the tab bar calls one of them
"Signs" while the other is reached through a tab called "Practise".

**c. CameraPractice vs the lesson's camera drill.** `CameraPractice.tsx:182-189` and
`LessonPlayer.tsx:482-491` both mount `CameraTrainer` on one letter with the same props. The two are
visually identical inside the camera frame. One is reached from "Practise the alphabet" and the other
from "Start →". A user cannot tell whether they are in a lesson or in free practice, and the exits
differ: the lesson advances a queue, the practice screen advances the alphabet.

**d. Three different 28-letter alphabet screens.** The AllSigns alphabet filter grid
(`AllSigns.tsx:336-369`), the Progress Constellation (`Progress.tsx:808-858`) and the CameraPractice
target strip (`CameraPractice.tsx:142-180`). Three visual languages, three tap behaviours, three
progress denominators. Asked "where is the alphabet", a user has three correct answers.

**e. Family's flag list vs FlagPicker's flag summary.** `Family.tsx:285-390` lists active flags with
gloss, raiser and a tap that opens the sign. `FlagPicker.tsx:349-381` lists the same flags with the
same gloss and the same tap behaviour. Two screens, one list, and FlagPicker is opened *from* Family.

**f. Progress "Family league" tab vs the Family tab.** `Progress.tsx:719-804` shows household members
ranked by XP with avatars. `Family.tsx:149-215` shows household members with avatars and streaks. The
league's empty state even offers `famAdd` "Add a family member" and routes to Family
(`Progress.tsx:257`). One of these is a tab in the nav, the other is a tab inside a screen hidden
behind an avatar.

**g. AiTransparency vs Privacy.** Both say the video never leaves the device: `aiPromise` +
`aiBulletNoUpload` (`InfoPages.tsx:156`, `161-171`) vs the "No video ever leaves your device" card
(`InfoPages.tsx:337-347`). Each page carries a link to the other (`InfoPages.tsx:221`, `422`). Two
pages, one message, mutually cross-linked, both opened from Settings rows with different names.

**h. Fingerspell practise-along vs CameraPractice.** `Fingerspell.tsx:199-226` steps `CameraTrainer`
through the gradable letters of a typed word. `CameraPractice.tsx:87-99` steps `CameraTrainer` through
the alphabet in order. Same component, same grading, same self-mark, two screens.

---

## Question 4 · Ranked, most self-explanatory to most opaque

| # | Screen | Why |
|---|---|---|
| 1 | **Fingerspell** | Subtitle states the whole mechanic; empty state gives an instruction and an example; every silent transformation is disclosed. |
| 2 | **Words** | `wordsSubtitle` names the entire loop and the prerequisite in one line. |
| 3 | **FlagPicker** | Title, hero line, hero body and an explicit "Tap a sign to flag it." |
| 4 | **Privacy** | Long-form, plainly headed, one clearly-marked destructive control. |
| 5 | **Settings** | Conventional grouped list, every row labelled. Loses points only for duplicate rows. |
| 6 | **AiTransparency** | Explanatory by nature and it explains. Loses points for the award badge and the abstract flow strip. |
| 7 | **FirstSign** | A clear three-beat arc, one dominant button. Loses points for the `2/4` counter and the dataset name. |
| 8 | **PractiseChooser** | Title plus subtitle plus four described tiles. Loses points for not warning that the Alphabet tile turns on a camera. |
| 9 | **LessonPlayer** | Each drill is well-titled, but the session itself is never named until the end card. |
| 10 | **Family** | Every section has an eyebrow, but the profile switcher, the dots and the honeycomb are silent. |
| 11 | **AllSigns** | *bottom five, see below* |
| 12 | **CameraPractice** | *bottom five* |
| 13 | **Home** | *bottom five* |
| 14 | **AppNav** | *bottom five* |
| 15 | **Progress** | *bottom five, most opaque* |

### Justification for the bottom five

**11. AllSigns.** The screen has four names and uses none of them consistently: the nav says "Signs"
(`AppNav.tsx:38`), the header says "Sign Dictionary" (`AllSigns.tsx:237`), Settings says "Signs
dictionary" (`Settings.tsx:446`) and the camera error says "Browse the signs" (`CameraTrainer.tsx:880`).
Its subtitle describes the content, not the interaction, and the one line that *does* describe the
interaction is desktop-only (`AllSigns.tsx:407-412`) on a phone-first PWA. Every card carries two
pieces of undefined jargon: a `Graded`/`Watch` badge (`AllSigns.tsx:85-99`) and a status caption from
a vocabulary that contradicts the filter chips ("Family list" vs "Flagged" vs "Flag",
`AllSigns.tsx:34`, `207`, `818`). The detail panel puts an unlabelled heart at the top
(`AllSigns.tsx:658-673`) that does the same thing as the labelled pin at the bottom
(`AllSigns.tsx:800-819`).

**12. CameraPractice.** The header makes a promise the screen does not keep: it always reads
"Practise the alphabet" (`CameraPractice.tsx:128`), including when it was deep-linked to a word sign
from `Family.tsx:75`, `FlagPicker.tsx:359` or `AllSigns.tsx:220`. Its central control, a 31-chip
scrolling strip, carries no instruction at all, and three of those chips are deliberately inert with
the explanation hidden in a `title` attribute (`CameraPractice.tsx:159-169`). It has more entry points
than any other screen, 17, under 9 different labels, so a user meets it repeatedly without ever
building a name for it. And after a successful match it silently retargets itself to the next letter
600ms later (`CameraPractice.tsx:87-99`), which no copy anywhere predicts.

**13. Home.** The screen has no title. Its `<h1>` is a greeting (`Home.tsx:340-343`), the nav calls it
"Learn", and the trail, which is the actual product, is introduced by an invisible `aria-label`
(`Home.tsx:375`). Nothing written explains what a circle, a padlock or a chest is until you tap one.
Then, below the one thing that matters, it stacks eight more starting points (`Home.tsx:403-642`),
six of which lead to the same camera screen under six different names. One of those eight, the Daily
goal card, is a button with no arrow, no chevron and no verb (`Home.tsx:588-597` via
`GoalCard.tsx:36` and `ui.tsx:146`). Opening the app is a decision, not an action.

**14. AppNav.** It is the only map the user has, and it hides two of the ten destinations behind an
avatar (`AppNav.tsx:95-134`). Nothing in the app ever says that "Progress" and "Settings" live behind
your own face. Every tab label disagrees with the screen it opens: "Learn" opens a greeting,
"Practise" opens `تمرّن` in Arabic while the tab says `تدرّب`, "Signs" opens "Sign Dictionary",
"Family" opens "Your household". The Practise tab stays highlighted across four different screens
(`AppNav.tsx:34`), so the highlight stops answering "where am I". And seven screens drop the nav
entirely because they use `chrome="takeover"` (`ScreenShell.tsx:46-72`), leaving one back arrow whose
destination changes screen by screen.

**15. Progress, the most opaque screen in the app.** It is reached by exactly one door, labelled
"Progress", hidden inside a popover behind an avatar (`AppNav.tsx:95-111`). On arrival the header
says "Your oasis" (`Progress.tsx:168`, `173`) and the word "Progress" appears nowhere on the screen.
The main visual is a cartoon desert whose palms and sprouts are load-bearing data
(`Progress.tsx:367-405`) with no key, measured in invented units, `prPlanted` "signs planted" and
`prPalmsGrown` "palms grown", that contradict the same numbers elsewhere on the same screen
(`prStatMastered` "Signs mastered", `Progress.tsx:593`). Its title changes four times as you press
four unlabelled-purpose tabs. `prBestStreak` is captioned "Current streak" (`i18n.ts:334`) and is fed
two different values on two tabs (`Progress.tsx:238` vs `247`). Its Constellation is 31 tappable
circles with a slogan for a caption and two different destinations depending on invisible sign
metadata (`Progress.tsx:231-234`). And a full-screen celebration can take the screen over on mount,
unrequested (`Progress.tsx:111-113`, `908-1035`). Three of its four tabs have no action at all.

---

## Cross-cutting: what none of the screens ever explain

These words appear on multiple screens and are defined on none of them.

| Word | Where it appears |
|---|---|
| **XP** | `i18n.ts:161`, `homeGoldStat` `i18n.ts:222`, `Home.tsx:189`, `Progress.tsx:454`, `LessonPlayer.tsx:1009`, `FirstSign.tsx:150-156` |
| **Mastered** | `prMastered`, `prStatMastered`, `AllSigns.tsx:33`, `Family` board logic |
| **Due / Review** | `homeReviewDue`, `practiseReviewCountSuffix`, `prUpcoming`, `wordsMarked`, `signMarkedPractised`, `"Add to Daily Review"` (`AllSigns.tsx:794`) |
| **Graded / camera-graded** | `signBadgeGraded`, `pathNewSign`, `signRefOnlyNote`, `camGradingPaused` |
| **Unit** | `homeUnit`, `Home.tsx:379-391`, `AllSigns.tsx:40`, `70-73` |
| **Flag / flagged / family list** | `famFlagTitle`, `famFlagged`, `famFlaggedCount`, `AllSigns.tsx:34`, `207`, `818`, `FlagPicker` throughout |
| **Streak** | `homeStreak`, `famSharedStreak`, `prBestStreak`, and three unlabelled coral-dot pills (`Home.tsx:180`, `CameraPractice.tsx:129-134`, `LessonPlayer.tsx:245-250`) |

Fixing the doors without fixing this vocabulary would leave the app consistent and still unreadable.
