# First-run trace · what a brand-new user actually sees

Audit date 2026-08-01. Scope: launch to first meaningful completion. This is a **learnability**
audit, not a correctness audit. The 130-defect coherence pass (commit `c27bbc8`) already fixed
whether each screen behaves; this asks whether a non-technical person can tell what to do and why.

Every claim below cites `file:line`. Where I could not find evidence I say "not found in code".

---

## 0. The single most important structural fact

**There are three different first runs, and which one you get is decided by a tap on step 4 that
looks like a topic choice, not a routing choice.**

`src/screens/Onboarding.tsx:150-156`:

```
go(
  track === "alphabet"
    ? { name: "camera", targetSignId: "alpha-alif", autoStart: true }
    : track === "words"
      ? { name: "allSigns" }
      : { name: "firstSign" },
);
```

- Tap the **Arabic Alphabet** card (`Onboarding.tsx:354-381`) and you jump straight to the name
  step (`Onboarding.tsx:356-358`), skipping four screens, then land in a live camera with the
  permission prompt firing.
- Tap the **Everyday signs** card (`Onboarding.tsx:384-406`) and you finish onboarding in the
  **Sign Dictionary** (`AllSigns.tsx:237` renders `"Sign Dictionary" / "القاموس"`), a browse-and-search
  screen.
- Tap neither, press the footer **Continue** (`Onboarding.tsx:198`), and you get `FirstSign`, the
  only screen in the app that actually teaches the watch-then-try loop
  (`FirstSign.tsx:242-289`).

The guided tutorial is the reward for **not** engaging with the choice on screen. Tapping a card,
which is the obvious action because the cards are large, coloured, and carry a "Ready" badge,
opts you out of the tutorial silently. Nothing tells the user this.

---

## 1. Step-by-step trace

### Step 0 · Pre-React boot splash

**Sees** (`index.html:140-180`): teal gradient, animated Fanan mascot (pure divs, `index.html:144-169`),
`Sawiyya`, `سويّة`, and the tagline `"Learn to sign. Connect with someone who can't hear you."`
(`index.html:177`, Arabic swapped in at `index.html:208`), plus three pulsing dots.

**Asked to do**: nothing. It self-replaces when React mounts (`index.html:22-25` comment).

**Explains why**: the tagline is the only "why" statement in the entire app that names the human
outcome. It is on screen for well under a second.

**Silently assumed**: nothing. This screen is fine.

---

### Step 1 · Splash (`step === "splash"`, `Onboarding.tsx:272-284`)

**Sees**, exact strings:
- `obWelcomeTitle`: `"Teach the world to sign."` / `"علّم العالم الإشارة."` (`i18n.ts:244`)
- `obWelcomeBody`: `"Learn to sign and connect with someone who can’t hear you — as equals."` (`i18n.ts:245`)
- CTA `obWelcomeCta`: `"Get started"` / `"لنبدأ"` (`i18n.ts:246`, wired `Onboarding.tsx:192`)
- A progress bar already showing 1 of 9 (`Onboarding.tsx:236-249`, `total = STEP_ORDER.length = 9`
  at `Onboarding.tsx:166-178`)

**Asked to do**: tap one button.

**Why**: partial. "Teach the world to sign" is a mission statement, not a description of what the
product does. It does not say this is a course, that it uses your camera, that it teaches the Arabic
alphabet first, or how long anything takes.

**Silently assumed**: nothing yet.

**Where a first-timer is lost**: not here.

---

### Step 2 · Meet Fanan (`Onboarding.tsx:287-298`)

**Sees**:
- `obFananEyebrow`: `"Meet your guide"` (`i18n.ts:247`)
- `obFananTitle`: `"Hi, I’m Fanan!"` (`i18n.ts:248`)
- `obFananBody`: `"I’ll cheer you on, catch your signs, and never let you learn alone."` (`i18n.ts:249`)
- CTA `obFananCta`: `"Nice to meet you"` (`i18n.ts:250`)

**Asked to do**: tap one button.

**Why**: no. This is the only place the word "catch your signs" appears, and it is the app's one
oblique reference to camera grading before the camera screen. A non-technical reader does not
decode "catch your signs" as "your phone camera will watch your hand and score it".

**Silently assumed**: that a cartoon fox mascot is a meaningful entity. Fanan later appears as a
grader persona (`CameraTrainer.tsx:444-465` picks a Fanan pose and a speech line from live grading
state), so the mascot is doing real work later, but nothing connects the two.

---

### Step 3 · Language (`Onboarding.tsx:301-335`)

**Sees**:
- `obLangTitle`: `"Choose your language"` (`i18n.ts:251`)
- `obLangBody`: `"You can switch anytime in settings."` (`i18n.ts:252`)
- Two chips: `"English" / "Left-to-right"` (`i18n.ts:253-254`), `"العربية" / "من اليمين لليسار"` (`i18n.ts:255-256`)
- Footer CTA `obContinue`: `"Continue"` (`i18n.ts:40`, wired `Onboarding.tsx:196`)

**Asked to do**: pick a language.

**Interaction inconsistency, first appearance**: tapping either chip calls `chooseLang`
(`Onboarding.tsx:159-163`), which **immediately advances the step**. The footer "Continue" button
below it does the same thing. So the screen has two controls that both navigate, and the user who
taps a chip never learns that the footer button was there for a reason. On the persona step
(step 5) tapping a chip does **not** advance (`Onboarding.tsx:452` only calls `setPersona`), and on
the goal step tapping **does** advance again (`Onboarding.tsx:567-570`). Three steps, two different
rules, no visual difference between them.

**Why**: not needed here.

**Silently assumed**: nothing. `"Left-to-right"` is untranslated in both entries (`i18n.ts:254`
gives the same English string for `ar`), which is a deliberate call but reads as an untranslated
string to an Arabic reader.

---

### Step 4 · "What do you want to learn?" (`Onboarding.tsx:338-429`) — **the fork**

**Sees**, and note these are **hardcoded `pick()` literals, not i18n keys**
(`Onboarding.tsx:341`, `344-348`, `371`, `374`, `378`, `397`, `400`, `404`, `420`, `423`):
- Title: `"What do you want to learn?"` / `"ماذا تريد أن تتعلّم؟"`
- Sub: `"Qatari Sign Language, start here on your device."`
- Card 1: `"Arabic Alphabet"` + badge `"Ready"` + `"28 core letters, camera-graded"`
- Card 2: `"Everyday signs"` + `"Hello, milk, more, thank you…"` + badge `"Teach & practise"`
- Card 3 (disabled, `aria-disabled="true"`, `Onboarding.tsx:411-426`): `"Other Gulf dialects"` +
  `"Emirati, Saudi and more, coming soon"`
- Footer CTA: `"Continue"`

**Asked to do**: unclear. Three cards and a Continue button. Two cards are tappable, one is not,
and the Continue button does something different from both.

**Why**: no. Nothing says the alphabet card is a fast path that skips setup, or that the words card
lands you in a dictionary rather than a lesson, or that Continue gives you a guided first sign.

**Silently assumed, all unexplained**:
- `"camera-graded"` (`Onboarding.tsx:378`). First appearance of the core mechanic, as a four-word
  sub-label on a card. Never defined.
- `"Teach & practise"` (`Onboarding.tsx:404`). "Teach" here means teach-mode, the flow where you
  record 24 samples of your own handshape so the KNN can recognise it
  (`CameraTrainer.tsx:26 TEACH_TARGET = 24`, `CameraTrainer.tsx:205-228`). A first-timer reads
  "teach" as "the app teaches me". The badge means the opposite.
- `"Ready"` versus no badge on card 2 implies card 2 is not ready. In fact all 19 A1 word signs are
  `cameraGradable: false` (`signs.ts:94-159`, comment at `signs.ts:89-93`), so card 2 genuinely
  cannot be camera-graded. The UI never says why.

**Exact moment a first-timer is lost, and what they do wrong**: **here**. Most people tap the
big teal "Arabic Alphabet · Ready" card, because it is the only element with a positive-state
badge. That single tap:
1. discards the camera explainer they were about to be shown (step 6 below),
2. discards the on-device privacy statement,
3. discards the daily-goal question, leaving the hardcoded default `"regular"`
   (`Onboarding.tsx:124`), which is 50 XP per day (`app.ts:25-29`),
4. discards the persona question, leaving the hardcoded default `"parent"` (`Onboarding.tsx:123`),
5. and delivers them to a live camera permission prompt within two more taps.

The progress bar jumps from 4/9 to 9/9 with no explanation, because `stepIndex` is derived from
`STEP_ORDER.indexOf(step)` (`Onboarding.tsx:177`) and the jump lands directly on `"name"`.

---

### Step 4a · The path most users never see

The remaining onboarding steps only render for users who pressed **Continue** on step 4, or who
tapped "Everyday signs". A learner who took the alphabet card sees **none** of steps 5, 6, 7 or 8.

#### Step 5 · Persona (`Onboarding.tsx:432-490`)

**Sees**: `obWhoTitle` `"Who are you learning for?"` (`i18n.ts:19`), `obWhoSub`
`"We'll start you on the signs that matter most."` (`i18n.ts:20`), five chips: `"My child"`,
`"My brother or sister"`, `"My student"`, `"My friend or colleague"`,
`"I'm Deaf — setting up my family"` (`i18n.ts:21-25`), the last carrying a
`"Special Path"` / `"مسار خاص"` badge (`Onboarding.tsx:473`).

**Why**: it makes an explicit promise, and **the promise is not kept anywhere in the code**. `persona`
becomes `profile.role` (`Onboarding.tsx:139`), and `role` is read in exactly four places:
flag ownership (`app.ts:562`, `AllSigns.tsx:129`), the Deaf-member streak rule (`app.ts:632`),
the family board's hearing-only intersection (`app.ts:499`, `app.ts:779`), and the Family screen's
avatar and label (`Family.tsx:79`, `171`). It never touches curriculum. `LESSONS` is a fixed array
(`signs.ts:207-241`) and `Home` always starts at `alpha-u1-l1` (`Home.tsx:100-102`). The code even
admits it: `signs.ts:322` comments `"Persona → which lesson the tailored copy points at first (all
start at L1 [A])"`.

There is no "Special Path". The badge is on a chip that changes flag permissions and a streak rule,
nothing a new user could observe.

#### Step 6 · How it works (`Onboarding.tsx:493-539`)

**Sees**: `obCamEyebrow` `"How it works"` (`i18n.ts:257`), `obCamTitle` `"Sign it to the camera"`
(`i18n.ts:258`), a static illustration (a dashed rectangle with a teal check, `Onboarding.tsx:499-527`),
`obCamBody` `"Watch the handshape demo, then sign it back. Fanan checks your handshape live."`
(`i18n.ts:259`), `obPrivacyBody` `"Your camera never leaves your phone. No video is uploaded, ever."`
(`i18n.ts:261`), badge `obPrivacyBadge` `"Nothing leaves this device"` (`i18n.ts:262`), CTA
`obCamCta` `"Got it"` (`i18n.ts:260`).

**This is the single most important explanatory screen in the app.** It is the only place the core
loop is stated in plain language. It is also the screen the fastest path skips.

**Still missing even here**: it does not say the camera will ask for permission, does not say you
have to hold the shape still, and does not say what happens if the camera cannot see your hand.

#### Step 7 · Daily goal (`Onboarding.tsx:542-582`)

**Sees**: `obGoalTitle` `"Your daily goal"` (`i18n.ts:33`), `obGoalSub`
`"Small and steady beats heroic and rare."` (`i18n.ts:34`), three chips:
`"Casual · 3 min"` / `"A sign a day"`, `"Regular · 7 min"` / `"Build a habit"`,
`"Serious · 15 min"` / `"Go all in"` (`i18n.ts:35-37`, `263-265`), CTA `obGoalCta` `"Set my goal"`
(`i18n.ts:266`).

**Silently assumed**: the goal is stored and displayed as **XP**, not minutes. `GOAL_XP`
(`app.ts:25-29`) maps casual/regular/serious to 20/50/100 XP. Home then shows
`"20 / 50 XP"` (`Home.tsx:169-172`). The user chose "7 minutes" and is measured in a unit they were
never shown, with no conversion stated anywhere. `xp` is defined in i18n as literally `"XP"` /
`"نقطة"` (`i18n.ts:161`), which is not a definition.

#### Step 8 · Reminders (`Onboarding.tsx:586-624`)

**Sees**: `obRemindTitle` `"A gentle nudge?"` (`i18n.ts:269`), `obRemindBody`
`"Sawiyya doesn’t send notifications — nothing leaves your device. Want a daily nudge? Add a
practice reminder to your own calendar."` (`i18n.ts:270-273`), a preview card
`"Practise Sawiyya"` / `"Every day · 6:00 pm · in your calendar"` (`i18n.ts:274-275`), and a
button `"Add to my calendar (.ics)"` → `"Downloaded — open it to add the reminder"`
(`i18n.ts:276-277`).

This step is honest and well written. It is also the step most likely to be abandoned on mobile,
because a downloaded `.ics` on iOS Safari lands in Files, not in Calendar, and
`obRemindCalDone` tells the user to "open it" with no further help.

---

### Step 9 · Name (`Onboarding.tsx:627-658`) — terminal

**Sees**: `obNameTitle` `"What should we call you?"` (`i18n.ts:38`), a persona tagline
(`Onboarding.tsx:631`, from `PERSONA_TAGLINE`, `signs.ts:323-343`, default persona `parent` gives
`"Your child's first language starts with your hands."`), a text input placeholder `"Your name"`,
and `obContinue` `"Continue"`.

**The alphabet-track user hits this screen cold.** They tapped a card about Arabic letters and are
now told `"Your child's first language starts with your hands."` They were never asked whether they
have a child. The default `persona = "parent"` (`Onboarding.tsx:123`) put those words there.

**Empty name is allowed**: `finish()` falls back to `"Me"` / `"أنا"` (`Onboarding.tsx:136`).

---

### Step 10 · The landing, three versions

`finish()` (`Onboarding.tsx:135-157`) creates the profile, calls `completeOnboarding()`, and routes.

#### 10-A · Alphabet track → `CameraPractice` with `autoStart: true`

`App.tsx:152-160` mounts `CameraPractice` (lazy, `App.tsx:25-27`), which mounts `CameraTrainer`
with `autoStart={cameraLive}` where `cameraLive` initialises to `autoStart`
(`CameraPractice.tsx:48`). `CameraTrainer.tsx:374-377` fires `tracker.start()` on mount, which calls
`navigator.mediaDevices.getUserMedia` (`useHandTracker.ts:131`).

**So the first thing after typing your name is the browser's camera permission dialog**, with no
in-app sentence preceding it, because the screen that would have explained it (step 6) was skipped.

**What is on screen behind that dialog** (`CameraPractice.tsx:113-192`):
- A back arrow that goes to `practiseChooser` (`CameraPractice.tsx:122`), a screen the user has
  never seen
- Title `camPractice`: `"Practise the alphabet"` (`i18n.ts:89`)
- A streak pill showing `0` (`CameraPractice.tsx:129-134`)
- A horizontally scrolling strip of **31 Arabic letter chips**, 28 tappable and 3 dashed and
  non-selectable (`CameraPractice.tsx:142-180`)
- The four-tab bottom bar, appearing for the first time, unexplained (`ScreenShell.tsx:82`,
  `AppNav.tsx:26-40`)

**And inside `CameraTrainer` (`CameraTrainer.tsx:533-752`)**:
- Eyebrow `"Current Goal"` / `"هدفك الآن"` (hardcoded, `CameraTrainer.tsx:527`)
- `camSign` + target: `"Sign: ا"` (`i18n.ts:54`, `CameraTrainer.tsx:540-542`)
- `loopKindLetter`: `"Arabic letter · static handshape"` (`i18n.ts:288`)
- A teal striped stage with a real signer's photo in a gold circle (`CameraTrainer.tsx:552-564`)
- A hint card: `"Static handshape for the letter ا"` (`signs.ts:26`)
- `referenceHelper`, hardcoded at `CameraTrainer.tsx:528-532`:
  `"Follow the reference and copy the handshape."` — **this is the actual instruction, rendered at
  12px in `text-muted`** (`CameraTrainer.tsx:593`)
- `camResetClass`: `"Re-teach"` (`i18n.ts:94`), an underlined link that drops you into teach mode
  (`CameraTrainer.tsx:599-610`). Nothing explains what re-teaching is or why you would want it.
- A meter labelled `camConfidence` `"Camera confidence"` (`i18n.ts:93`) rendered at
  `text-2xl … md:text-4xl font-black` (`CameraTrainer.tsx:626`)
- `camSelfMark` `"I signed it right"` with sub `"Mark it yourself — you know your hands."`
  (`i18n.ts:61-62`)
- A privacy chip `camPrivacy` `"100% on your device — no video ever leaves your phone."`
  (`i18n.ts:92`)
- Fanan with a speech bubble cycling `"Show me your hand"` → `"Ooh, nice…"` →
  `"So close — again!"` (`i18n.ts:283-286`)

**Visual hierarchy is inverted.** The biggest, boldest element is a percentage the user cannot act
on. The instruction that tells them what to physically do is the smallest text on the screen.

**Exact moment a first-timer is lost**: the permission prompt, and then the confidence meter.
The most likely wrong actions are (a) denying camera permission, which routes to
`camErrDeniedTitle` `"Camera access is blocked"` with no retry button by design
(`CameraTrainer.tsx:882-892`), a dead end for a first-timer who does not know how to reopen site
settings; and (b) tapping `"I signed it right"` immediately, which rates the card `'hard'`
(`CameraPractice.tsx:71`) and awards 4 XP for something nothing verified.

#### 10-B · Words track → `AllSigns` (the dictionary)

`App.tsx:174-176`. Header reads `"Sign Dictionary"` / `"القاموس"` (`AllSigns.tsx:237`), with a
search box placeholder `"Search signs…"` (`AllSigns.tsx:482`) and filter chips
(`AllSigns.tsx:205`, `254`).

**Mismatch**: the card they tapped said `"Everyday signs · Hello, milk, more, thank you… ·
Teach & practise"` (`Onboarding.tsx:397-405`). There **is** a screen that matches that description
exactly, `Words` (`Words.tsx:24-189`, title `wordsTitle` `"Everyday words"`, subtitle
`"Watch, copy, mark yourself — no letters needed first."`, `i18n.ts:304-308`). Onboarding does not
route there. It routes to the dictionary. The user asked for a practice room and got a search index.

**No meaningful thing is completed on this path.** The user has to find the detail sheet, then
`signWatchPractise` `"Watch & practise"` (`i18n.ts:379`), before anything happens.

#### 10-C · Continue-through track → `FirstSign` (the intended experience)

`App.tsx:161-165`, `FirstSign.tsx:62-292`.

**Phase "watch" (2/4)** (`FirstSign.tsx:242-259`):
- `fsIntro`: `"Let's learn the first thing you'll say:"` (`i18n.ts:43`)
- `fsDemoTitle`: `"Watch it once"` (`i18n.ts:209`)
- `fsDemoSub`: `"A real signer's hand (ArSL21L dataset)"` (`i18n.ts:210`)
- A looping `SignDemo` showing the real photo for Alif (`SignDemo.tsx:55-72`, photo from
  `signs.ts:34`)
- `fsDemoMeans`: `"This sign means “Alif”"` (`i18n.ts:212`, gloss from `signs.ts:39`)
- CTA `fsNowYou`: `"Now you try"` (`i18n.ts:44`)

**Copy-to-content mismatch**: `"Let's learn the first thing you'll say"` followed by
`"This sign means Alif"`. Alif is a letter of the alphabet. It is not a thing anybody says. A
first-timer expecting to learn "hello" or "I love you" gets the letter A.

`"ArSL21L dataset"` in `fsDemoSub` is a dataset citation shown to a beginner. Honest, and
unreadable.

**Phase "try" (3/4)** (`FirstSign.tsx:260-272`):
- `fsLiveTitle`: `"Now make the sign"` (`i18n.ts:213`)
- `fsLiveSub`: `"The camera is grading you live"` (`i18n.ts:214`)
- Then the same `CameraTrainer` described in 10-A, with `autoStart` (`FirstSign.tsx:269`), so the
  permission prompt fires here too, but at least after a sentence that named the camera.

**Phase "celebrate" (4/4)** (`FirstSign.tsx:120-228`):
- `"وصلت!"` on its own line plus `fsCelebrate` `"Connection made!"` (`i18n.ts:46`,
  `FirstSign.tsx:179-183`)
- A gold chip `"+10 XP"` on a real camera match, `"+4 XP"` on a self-mark
  (`FirstSign.tsx:150-157`)
- A `"Day 1"` streak badge with a flame icon (`FirstSign.tsx:159-164`)
- `fsDoneBadgeMatch` `"live match"` pill, only on a genuine match (`FirstSign.tsx:187-194`)
- `fsDone`: `"That's one. Your family will feel this."` (`i18n.ts:45`)
- CTA `fsKeepGoing` `"Keep going"` → `{ name: "home" }` (`FirstSign.tsx:204-215`)
- A secondary `"Share this moment"` (`FirstSign.tsx:216-224`)

**Three unexplained concepts land in one celebration screen**: XP, a streak, and a "live match"
badge. `+10` versus `+4` is never explained (the difference is camera-confirmed versus self-marked,
`FirstSign.tsx:83`). `"Day 1"` implies a counter the user has not been told exists. And
`"That's one. Your family will feel this."` is an emotional claim attached to having held the Arabic
letter Alif in front of a camera, for a user whose household has exactly one member.

---

### Step 11 · Home, the first real landing

All three tracks converge here eventually (`Home.tsx:58-768`, `ScreenShell chrome="tabs"`,
`Home.tsx:328`).

**Sees, top to bottom**:
1. Teal bar: `"Marhaba, {name}"` (`Home.tsx:341-343`), `homeGreetSub` `"Ready to sign today?"`
   (`i18n.ts:218`)
2. **Three unlabelled coloured dots with numbers** (`Home.tsx:177-199`): a coral dot with
   `streakFor(profile)` and the label `homeStreak` `"day streak"` (`i18n.ts:114`); a gold dot with
   `profile.xp` labelled `homeGoldStat` `"XP"` (`i18n.ts:222`); a coral square with
   `app.profiles.length` labelled `homeFamilyStat` `"family"` (`i18n.ts:223`). For a new user
   these read `0 day streak`, `0 XP` or `10 XP`, `1 family`. The label font is 9px
   (`Home.tsx:363`).
3. A teal unit banner `"Unit 1"` + `"The Arabic Alphabet"` (`Home.tsx:379-391`, unit title
   `signs.ts:179`)
4. A winding trail of node circles: 4 alphabet lessons then 4 word lessons
   (`signs.ts:207-241`), all locked except the first, which pulses coral with a `homeStartBadge`
   `"START"` chip (`i18n.ts:224`, `Home.tsx:299-303`) and a bobbing Fanan beside it
   (`Home.tsx:314-320`)
5. **Then eight more cards** (`Home.tsx:403-642`): `"Practise the alphabet"`, `"Everyday words"`,
   `"Spell your name"`, family flags (conditional), review due (conditional), next new letter,
   `"Daily goal"` with a `GoalCard`, and a milestone readout `"First sign mastered"` / `"0 / 1"`
   (`milestones.ts:60`, `Home.tsx:603-619`)
6. A four-tab bottom bar plus a profile button (`AppNav.tsx:26-40`, `116-134`)

**Asked to do**: unclear. There is a pulsing START node and eight competing cards below it.
This is documented independently in `docs/WHY-IT-FEELS-WRONG.md:9-40`.

**Silently assumed on this one screen**: XP, streak, "day streak", `Unit`, locked nodes, a treasure
chest node, "milestone", "review due", "flagged for your family", "daily goal", "mastered". Ten
concepts, zero definitions.

**Wrong thing a first-timer most likely does**: tap the tab bar to explore, find `Practise`
(`practiseChooser`), and discover it offers the same four things Home just offered
(`PractiseChooser.tsx:67-135`: Alphabet, Words, Fingerspell, Review). Then conclude the app is
repeating itself, which it is.

**Tapping the START node** (`Home.tsx:646-765`) opens a bottom sheet showing the lesson title
`"Alif to Kha"` (`signs.ts:209`), the meta line `pathNewSign` `"New sign · camera-graded"`
(`i18n.ts:228`), a primary `pathStartCta` `"Start →"` (`i18n.ts:225`) which opens `LessonPlayer`
(`Home.tsx:671-677`), and a secondary `practiceCamera` `"Practise with camera"` (`i18n.ts:90`,
`Home.tsx:749-761`). Two buttons, both leading to a camera, no stated difference.

**Inside the first lesson** the queue is built by `buildAlphabetQueue`
(`engine.ts:104-133`): watch, camera, watch, camera, … capped at 12 drills
(`engine.ts:16`, `129-131`), so a 7-letter lesson deliberately takes **two passes**. The learner
finishes the queue, and instead of "Lesson complete" gets `lsPartDoneTitle` `"Part 1 done"` with
`lsPartDoneBody` `"{n} signs still to practise. One more round finishes this lesson."`
(`i18n.ts:492-496`, `LessonPlayer.tsx:151-168`). Honest, and a morale hit on the first lesson a
person ever finishes.

---

## 2. The direct answers

### Q1. Does onboarding ever explain what the four tabs are for?

**No. Not once.** The four tabs are defined in `AppNav.tsx:26-40` as `navLearn` `"Learn"`,
`navPractise` `"Practise"`, `navDictionary` `"Signs"`, `navFamily` `"Family"` (`i18n.ts:13-15`,
`i18n.ts:10`), plus a fifth `navProfile` `"Profile"` button (`i18n.ts:16`) that hides Progress and
Settings behind it (`AppNav.tsx:95-111`).

Evidence that onboarding never mentions them: the complete set of onboarding strings is
`i18n.ts:19-40` and `i18n.ts:244-277`, plus the hardcoded literals in `Onboarding.tsx:341-424`.
Grep those ranges for "Learn", "Practise", "Signs", "Family", "Progress", "tab", "Profile": the only
hits are `obDeaf` `"I'm Deaf — setting up my family"` (`i18n.ts:25`) and the persona chips, none of
which refer to the Family tab. The tab bar first renders when `ScreenShell` mounts with
`chrome="tabs"` (`ScreenShell.tsx:82`), which never happens during onboarding, because `Onboarding`
renders before a profile exists and bypasses the shell entirely (`App.tsx:128-135`,
`Onboarding.tsx:270` comment: `"Onboarding renders before a profile exists, so it bypasses
App.tsx's <main>"`).

So on every track the tab bar appears for the first time, fully formed, with zero introduction, on
the screen immediately after the name step.

**Worse for the alphabet track**: the tab bar's first appearance is *simultaneous with* the browser
camera permission dialog (`CameraPractice.tsx:48` → `CameraTrainer.tsx:374-377` →
`useHandTracker.ts:131`).

### Q2. After onboarding ends, is the user told what to do next, or dropped on a screen?

**Dropped, on all three tracks.** `finish()` (`Onboarding.tsx:135-157`) calls `go(...)` and nothing
else. There is no handoff sentence, no "here is your home", no first-run overlay.

- Alphabet track: dropped into a running camera with a permission prompt (10-A above).
- Words track: dropped into a search-and-filter dictionary (10-B above).
- Continue track: dropped into `FirstSign`, which **is** guided, and is the only one of the three
  that tells the user what to do (`fsDemoTitle` `"Watch it once"` → `fsNowYou` `"Now you try"`,
  `i18n.ts:209`, `i18n.ts:44`).

`FirstSign`'s own exit is also a drop: `fsKeepGoing` `"Keep going"` routes to `{ name: "home" }`
(`FirstSign.tsx:208`), and Home opens with a pulsing node plus eight cards and no orientation.

### Q3. Is any feature ever introduced at the moment it first becomes relevant?

**No. There is no progressive-disclosure mechanism anywhere in the codebase.**

Evidence: a repository-wide grep across `src/**/*.ts` and `src/**/*.tsx` for
`hasSeen|firstTime|coachMark|tooltip|showIntro|introSeen|walkthrough|firstRun` returns zero
non-test matches. The persisted state shape (`AppState`, `app.ts:52-106`) contains no
"has seen X" flag of any kind; the only per-sign state is `masteryLevel`, `lastSeen`, `cameraHits`
(`types.ts:91-93`). The only one-time notice in the whole app is the corrupt-storage recovery
banner (`App.tsx:78-96`, keyed on `RECOVERY_NOTICE_KEY`, `app.ts:129`), which is an error message,
not an introduction.

Everything is present from launch. Concretely, the following are all reachable within one or two
taps of the first landing and none is ever introduced:

| Concept | Where it first appears | Ever explained? |
|---|---|---|
| XP | `FirstSign.tsx:150-157`, `Home.tsx:186-190` | No. `i18n.ts:161` defines `xp` as the string `"XP"`. |
| Streak | `FirstSign.tsx:159-164`, `Home.tsx:179-184` | No. |
| Mastery levels 1/2/3 | `app.ts:424-443`; surfaced as `pathDoneMeta` `"Practised · tap to review"` vs `prMastered` `"signs mastered"` | No. `i18n.ts:230-232` comment shows the team knew these two words collide. |
| SRS review | `homeReviewDue` `"Review due"` (`i18n.ts:117`), `practiseReview` (`i18n.ts:316`) | No. Never says items come back on a schedule. |
| Daily review cap of 30 | `reviewCapDone` (`i18n.ts:80`) | Only when you hit it. |
| Camera grading | `obCamBody` (`i18n.ts:259`), **skipped on the fast path** | Once, on a screen many users never see. |
| Teach mode | `camTeach` `"Teach Sawiyya this sign"` (`i18n.ts:83`), `camResetClass` `"Re-teach"` (`i18n.ts:94`) | `camTeachSub` (`i18n.ts:84`) explains the mechanic but not why a learner would want it. |
| Fingerspell | `fspHomeCard` `"Spell your name"` (`i18n.ts:410`) on Home from the first visit | `fspSubtitle` (`i18n.ts:395`) explains it only after you tap in. |
| Flag a sign | `homeFlagged` `"Flagged for your family"` (`i18n.ts:116`), `famFlagTitle` `"Flag signs we need"` (`i18n.ts:129`) | No. "Flag" is never defined. `famOnlyDeafFlags` (`i18n.ts:135`) assumes you already know. |
| Dialect | `"Other Gulf dialects … coming soon"` (`Onboarding.tsx:420-424`), `PractiseChooser.tsx:172-184` | No. Never says which dialect you are currently learning beyond "Qatari". |
| Milestone / treasure chest | `Home.tsx:399`, `Home.tsx:603-619` | `pathChestMeta` `"Clear Unit 1 to open the reward chest."` (`i18n.ts:234`) is the only line, and `Home.tsx:154-157` overrides the sheet meta with a bare `"0 / 1"`. |

### Q4. What is the "aha moment", and how far away is it?

**The aha moment is the gold hold-ring completing and the screen flashing
`camMatch` `"✓ Connection made!"`** (`i18n.ts:56`, rendered `CameraTrainer.tsx:1055-1102`). That is
the instant the user learns the app can actually see their hand. Everything before it is claims;
that moment is proof.

**Distance to it, by track:**

| Track | Taps to aha | Confusion in between |
|---|---|---|
| Alphabet (fast path) | 6: `Get started`, `Nice to meet you`, language chip, Alphabet card, name Continue, browser `Allow`. Then hold the shape for ~1.2s (`holdGate.ts` `HOLD_MS`, referenced `CameraTrainer.tsx:24`, `336`). | Highest. The permission prompt arrives with no preceding sentence. On arrival: 31 letter chips, a 4-tab bar, a "Camera confidence" percentage in the largest type on screen, a "Re-teach" link, and a self-mark button, all unexplained. |
| Continue-through | 11: 9 onboarding taps, `Now you try`, browser `Allow`. | Lowest. `fsDemoTitle` → `fsNowYou` is a real two-beat tutorial, and step 6 primed the camera. But `"Let's learn the first thing you'll say"` then teaches the letter Alif. |
| Everyday signs | Never reaches it. All 19 A1 word signs are `cameraGradable: false` (`signs.ts:94-159`). `CameraTrainer` renders `signRefOnlyNote` `"Reference only, no camera grading"` (`i18n.ts:504`) instead of a meter (`CameraTrainer.tsx:671-680`, gate at `CameraTrainer.tsx:443`). The only completion available is `camSelfMark` `"I signed it right"`. | Total. The user picked the friendlier-sounding card and got the one path where the app's core proof never fires. |

**The core learnability failure in one sentence**: the app's proof-of-value is a camera confirming
your hand, and the fastest route to it removes every sentence that would have told you a camera was
coming, while the route that keeps those sentences is the one you get by ignoring the two big
buttons on screen.

---

## 3. Where a first-timer is lost, ranked

1. **`Onboarding.tsx:338-429`, the learn step.** A routing decision disguised as a topic
   preference. Tapping the most attractive card silently deletes the camera explainer, the privacy
   statement, the goal question and the persona question, and replaces the guided first sign with a
   cold camera.
2. **The camera permission prompt on the fast path** (`CameraPractice.tsx:48` →
   `useHandTracker.ts:131`). No sentence precedes it. Denial routes to `camErrDeniedTitle`
   `"Camera access is blocked"` with the retry button deliberately removed
   (`CameraTrainer.tsx:882-892`), which is technically correct and practically a dead end.
3. **The "Camera confidence" meter** (`CameraTrainer.tsx:619-651`). Biggest element on screen, and
   the user cannot act on it. The line that tells them what to physically do,
   `"Follow the reference and copy the handshape."`, is the smallest text on the screen
   (`CameraTrainer.tsx:528-532`, `593`).
4. **Home's eight cards under the pulsing node** (`Home.tsx:403-642`). Independently documented in
   `docs/WHY-IT-FEELS-WRONG.md:18-21`.
5. **The words card landing in the dictionary** (`Onboarding.tsx:153` → `AllSigns.tsx:237`) when a
   screen matching the card's own description exists at `Words.tsx` and is never routed to from
   onboarding.
6. **`"We'll start you on the signs that matter most."`** (`i18n.ts:20`). A promise with no
   implementation. `role` never reaches the curriculum (`signs.ts:207-241`, `Home.tsx:100-102`).
7. **XP as the unit of a goal expressed in minutes** (`i18n.ts:35-37` vs `app.ts:25-29` vs
   `Home.tsx:169-172`).

## 4. What I could not verify

- Whether a real device's permission prompt timing matches the code path exactly: not tested in a
  browser this session, traced statically only.
- Whether the landing page at `theshumba.github.io/sawiyya` says anything before the app loads:
  no landing-page source found in this repo (`public/` contains assets only). The app reads
  `?lang=ar` from a landing handoff (`i18n.ts:525-534`), so a landing page exists somewhere
  outside this repo. Not found in code.
- Time-to-first-sign is instrumented (`markFirstSignTime`, `app.ts:545-550`, called at
  `FirstSign.tsx:89`), but **only from `FirstSign`**. The two fast-path tracks never call it, so the
  G1 metric silently measures only the minority path. Grep confirms one call site.
