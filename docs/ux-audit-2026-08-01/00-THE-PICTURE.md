# Sawiyya: the whole picture

2026-08-01. Six agents, three auditing the code, three researching how other apps solve this. Melusi's
brief: "no one would understand how to use this app, and that's the problem."

He is right, and this document says exactly why, then what to do about it.

Supporting reports in this folder:
`01-first-run-trace.md` · `02-screen-purpose-map.md` · `03-progression-model.md` ·
`04-progression-patterns-research.md` · `05-duolingo-headspace-teardown.md` · `06-journey-engineering.md`

---

## The one sentence

**Sawiyya is a collection of features with no journey.** Every feature works. Nothing tells you when
to use it, why, or what comes next, so the app arrives all at once, on day one, permanently.

The 130-defect coherence pass fixed how the screens *behave*. This is the layer above: whether the
app ever *teaches itself*. It does not.

---

## Four findings, in order of how much they hurt

### 1. The app has no idea whether it is your first day or your thirtieth

There is exactly one set-once flag in the entire codebase, `onboarded` (`src/store/app.ts:53`,
written at `:401`). It is read in exactly one place, `src/App.tsx:128`, to decide onboarding versus
app. It is never consulted again.

A repo-wide grep for `hasSeen|firstTime|coachMark|tooltip|walkthrough|firstRun` returns zero
non-test matches. No session count. No days-since-install. No "already seen this". No unlocks. No
levels. The whole router, `src/App.tsx:137-193`, is fifteen `screen.name === "…"` branches and not
one of them consults progress, XP, streak or any counter.

Day 1 and day 30 are the same app. The only thing in the product that waits is the streak
celebration overlay (`Progress.tsx:111-113`), which needs a second day.

That is the root cause. Everything else below is a symptom.

### 2. Onboarding punishes the person who pays attention

There are three different first runs, and which one you get depends on a card you tap at step 4
(`Onboarding.tsx:150-156`).

Tap the big "Arabic Alphabet" button and you jump straight to the name step (`:356-358`), skipping the
persona, camera, goal and reminder screens. **Tapping nothing and pressing Continue is the only route
to `FirstSign`**, the single screen that actually teaches the watch-then-copy loop. The guided
experience is the reward for ignoring the two most prominent buttons on the screen.

The consequence is sharp. `obCamTitle` "Sign it to the camera" and `obCamBody` "Watch the handshape
demo, then sign it back" (`i18n.ts:258-259`) are the only plain-language description of the app's core
mechanic anywhere in the product. The fast-path user never sees them, and then meets the browser's
camera permission prompt with no sentence preceding it (`CameraPractice.tsx:48` →
`useHandTracker.ts:131`).

Onboarding also never names the four tabs. Not one string in `i18n.ts:19-40` or `:244-277` mentions
Learn, Practise, Signs or Family. The tab bar simply appears, fully formed, after the name step.

And `obRoleBody` "We'll start you on the signs that matter most" (`i18n.ts:20`) is not implemented:
`role` never touches the curriculum, everyone begins at `alpha-u1-l1`.

### 3. Every door is open, and there are far too many doors

**The camera has 17 entrances under 9 different names.** Two are not even actions: `Settings.tsx:316`
turns the status label "Not granted yet" into the button, and `InfoPages.tsx:197` uses "Let's Practice
Together" on the AI explainer page. Six of Home's eight cards land there, including the Daily goal
card (`Home.tsx:595`), which is a real button with no arrow, no chevron and no verb.

**The padlock is a lie.** Lesson locking is one `disabled` attribute (`Home.tsx:740`) and is bypassed
four ways: the Practise camera reaches all 28 letters, four Words self-marks complete the fifth trail
node on day one, the Dictionary's locked cells are a background colour with a live onClick, and
`#/lesson/<any-id>` plays any lesson because neither `LessonPlayer` nor `buildDrillQueue` checks a
prerequisite. The string "Finish the sign before this to unlock" (`i18n.ts:233`) promises something
the app does not do.

### 4. Screens do not say what they are

- **Home has no title.** Its `<h1>` is a greeting. The trail, which is the product, is introduced only
  by an invisible `aria-label` (`Home.tsx:375`). Nothing written says what a circle, a padlock or a
  chest means until you tap one.
- **Progress is called "Your oasis"** (`Progress.tsx:173`). The word "Progress" appears nowhere on the
  screen. It has one door, hidden in a popover behind your own avatar (`AppNav.tsx:95-111`). Its main
  visual is a desert whose palm trees are load-bearing data with no key, counted in invented units
  ("signs planted", "palms grown") that contradict "Signs mastered" one tab over. Three of its four
  tabs have no action at all.
- **AllSigns has four names**: "Signs", "Sign Dictionary", "Signs dictionary", "Browse the signs". Its
  only interaction instruction sits inside a `md:block` aside that never renders on a phone
  (`AllSigns.tsx:407-412`).
- **Words is a smaller copy of Signs, reached through a tab called Practise.** They run the identical
  sheet and write the identical drill result (`Words.tsx:49`, `AllSigns.tsx:159`).
- Two literal duplicates: `Settings.tsx:271` and `:441` render the same label, destination and colour
  chip twice on one screen.

### And one strategic dead end

The aha moment, the gold hold-ring completing and "Connection made!", is six taps away on the alphabet
path and **unreachable on the "Everyday signs" path**, because all 19 word signs are
`cameraGradable: false` (noted in the code itself at `Home.tsx:162-163`). One of the two tracks offered
at onboarding cannot reach the moment that makes the app click.

---

## What the research says to do

Six agents' worth of sourced research converges on something cheaper than expected.

**The staging system is not a library purchase.** All five candidate tour libraries (react-joyride
3.2.0, shepherd.js 15.2.2, driver.js 1.8.0, intro.js 8.5.0, @reactour/tour 3.8.0) were grepped in
their published dist for `localStorage`, `sessionStorage` and `indexedDB`. Zero hits in all five. They
render a step array within one session and store nothing. "Has this person seen X" is your own code
regardless. That makes this roughly 120 lines in the Zustand store that already exists, with no new
dependency. XState was rejected on 12.7 kB gzip against Zustand's 1.3 kB, plus its own docs warning
that restored snapshots break when the machine changes.

**Derive the stage, never store it.** A stored `onboardingStep` integer is where the untestable bugs
come from, and a learner is in several parallel states at once anyway (curriculum position, feature
familiarity, session state). Store the facts, compute the stage. Adding a stage then needs no
migration and nobody strands in a stage you deleted.

**One canonical next action is one line**, not a rules engine: `STEPS.find(s => !completed.has(s.id))`.
Array order is the priority. Copy Inngest's backfill rule so completing a later milestone marks the
earlier ones done, otherwise one skipped step wedges the pointer forever.

**Lock visibly, do not hide.** Carroll and Carrithers' 1984 training-wheels study left advanced
commands present but politely blocked. Beginners learned faster, scored better on comprehension, and
the control group burnt nearly a quarter of its time recovering from the errors the blocked build
prevented. Duolingo does the same thing today: locked stories, chests and quests sit on the path as
grey shapes you scroll past, and the unlock trigger is simply arriving there. That is progressive
disclosure with almost no conditional logic.

**Do not build a front-loaded tour.** NN/g tested 70 users across 4 iPhone apps: 91% task success with
tutorials versus 94% without, no speed gain, and the tutorial group rated the tasks as *harder*. The
teaching budget belongs in empty states, which both Polaris and Carbon treat as the primary teaching
surface, and which cost the user nothing because they were already looking at that screen.

**Hint budget is one number in the store**, not a decision per component. Material says one discovery
prompt per session and never at launch. Atlassian says one spotlight at a time. NN/g warns that
frequent hints train people to dismiss on sight regardless of quality.

**Ask three questions, then give everyone the same thing.** The strongest and cheapest finding in the
whole audit. Headspace, with Irrational Labs and Purchasely (April 2026), found that asking a short
quiz and then recommending the *identical* Basics course to everyone lifted course starts from 31.25%
to 62.97%, and beat handing over the same course with no questions by 7.6 points. The condition that
actually did personalised matching did not win. Asking is the mechanism, not matching.

**Precommitment works and needs no infrastructure.** Headspace's "which days, what trigger" question
lifted app opens 7.5%. Ask it, then write the answer back onto the home screen.

**Installation is the storage strategy.** Per WebKit's own post, iOS Safari deletes localStorage after
seven days of non-use, and home-screen installed web apps are exempt. For a no-backend PWA holding
every bit of a learner's progress in localStorage, "add to home screen" is not a nice-to-have. It
should be an early milestone, worded as "keep your progress", not as "install the app".

**Duolingo's published tone rules are free and specific:** no punctuation in buttons, no full stops in
headlines, exclamation marks only on success, digits even under ten. "Correct!" not "You are correct".
Their own guide also says avoid em dashes.

**Quiet exits, loud forward.** Duolingo replaced a red "Discard my progress" with a small grey "Later"
and it moved the numbers. Every skip should be small grey text; every forward action should be the
full-width coloured button.

**Do not copy:** leagues, feeds and friend quests (all need a server), hearts or energy (Duolingo's own
data showed hearts made beginners twice as likely to fail mid-lesson; it survives as a monetisation
surface), gems and shops, or a 30-plus screen onboarding, whose length exists to build sunk cost
before a paywall Sawiyya does not have.

---

## The plan

Four phases. Each is shippable alone and each makes the app better on its own.

### Phase 1 · One road
Cut the duplicate doors. Home becomes the path and nothing else, with the family flag card promoted
above it and shown only when someone else raised a request. Today's goal moves into the top bar.
Camera entrances go from 17 to 3: the current node, the Practise tab, and a sign's own detail. Locked
lessons stay visible and grey, and the lock becomes real, enforced in `LessonPlayer` and
`buildDrillQueue`, not just a `disabled` attribute. Roughly 240 lines deleted from `Home.tsx`.

### Phase 2 · One first run
Delete the branching onboarding entirely. Everyone gets the same short sequence: why you're learning,
what you already know, which days you'll practise, a recap screen, then everyone starts at lesson one.
The camera explainer moves into the flow that everyone sees, and a plain sentence precedes the browser
permission prompt. Either drop the "Everyday signs" track or give word signs a non-camera way to
complete, because it currently cannot reach the aha moment.

### Phase 3 · Stages
About 120 lines in the store: `milestones`, `seen`, `dismissed`, `firstOpenAt`, plus two ordered
arrays and two selectors. Stage derived, never stored. One canonical next action. One hint per
session, never at launch, delivered in empty states rather than a tour. Milestones include installing
to the home screen, worded as keeping your progress.

### Phase 4 · Say what things are
Home gets a title. Progress stops being "Your oasis" and gets a door that is not hidden behind an
avatar. The Signs/Words collision is resolved. Every screen states its purpose in its own first line.
Apply the tone rules throughout.

### Still owed by the owner
- **The mascot.** Fanan the fennec fox is rejected. No replacement chosen. He is drawn geometrically
  in `src/components/Fanan.tsx`, so replacing him means new artwork plus a new component, and every
  pose in use has to survive it.
- **The content question**, still open from the coherence audit: shrink the promise to an honest
  Arabic fingerspelling trainer, or chase a Deaf QSL signer relationship for real word footage.
  Phase 2's word-track decision depends on this one.
