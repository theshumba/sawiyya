# Duolingo and Headspace: first-session mechanics teardown

Research date: 1 August 2026. Every claim below carries a source and a date. Anything I could not verify is
stated as unverified, not smoothed over.

## How to read the confidence labels

- **PRIMARY** · from the company itself (official blog, official help centre, official App Store listing,
  official brand guidelines site, or an interview the company participated in).
- **SECONDARY** · from a reputable third party, but not confirmed by the company.
- **CONTESTED** · sources disagree, or the claim is widely repeated but I could not find it in an official source.
- **STALE RISK** · source is older than 2023 and these apps change often. The mechanic may no longer exist.

Two technical notes on method. Both `design.duolingo.com` and `duolingo.com/help` are JavaScript-only pages
that return an empty shell to a normal fetch. I rendered them through `r.jina.ai` to read the real text, so the
quotes below are the actual published text, not a summary. Headspace's help centre (`help.headspace.com`) sits
behind a Zendesk sign-in and could not be read at all. The current-state screenshots I describe were pulled from
the live App Store and Google Play listings and from Duolingo's own design blog, so they are dated artefacts,
not recollections.

---

# PART 1 · DUOLINGO

## 1.1 What is on the home screen, and what is deliberately not

**PRIMARY, 4 February 2026.** Duolingo's design blog post *"Elevating craft: How we refreshed our core tabs"*
(<https://blog.duolingo.com/core-tabs-redesign/>) ships a full-resolution image of the refreshed app. I read the
image directly. The home screen, top to bottom, contains exactly this:

1. **A status strip of four items, no labels, no buttons:** the course flag with a number next to it (the
   Duolingo Score), a flame with a number (streak), a gem with a number (gems), and a fourth coloured icon.
   The flag-plus-number pairing is confirmed by Duolingo's own alt text elsewhere: *"the user's French score of
   5 is displayed next to an icon of the French flag"* (<https://blog.duolingo.com/product-highlights/>,
   10 December 2025).
2. **One green unit banner** reading `SECTION 2, UNIT 6` on the small line and `Introduce yourself` on the large
   line, with a single guidebook icon at its right edge.
3. **The path.** Completed nodes are solid green with a white tick. The current node is green with a white star
   and carries a small white speech bubble above it reading **START**. Everything below the current node is
   greyed out: a locked chest, a greyed character, a greyed star node, a greyed book (story) node.
4. **The tab bar.**

What is on that screen that a user can actually act on: **one thing.** The START bubble. Nothing else on the
canvas is a live, coloured, tappable next step. That is the entire mechanic.

**What is deliberately not on the home screen:**

- **No search field.** Duolingo's home screen has no way to look content up.
- **No content catalogue or lesson list.** There is no browsable index of what the course contains.
- **No separate Stories entry point.** PRIMARY, 6 May 2022: *"Our popular short stories are now built into the
  path, rather than appearing in a separate tab"* (<https://blog.duolingo.com/new-duolingo-home-screen-design/>).
- **No per-lesson Tips.** Same source: *"Tips are now in a 'guidebook' for each unit"*, reachable from the one
  icon in the unit banner.
- **No free-choice skill tree.** The same post replaced the old tree, in which learners picked any skill, with
  a linear path. Duolingo's stated reason: *"We often hear from learners that they're not sure whether they're
  using Duolingo the 'correct' or 'best' way"*, so the redesign *"gives you a clear path to follow, so you can
  be confident that each step you take in Duolingo is truly the best step for reaching your language goals."*
  (The original uses an em dash where I have written a comma.)
- **No settings.** Settings live behind the profile tab.

That last quote is the load-bearing one for your purposes. The linear path was not built for beauty. It was
built because giving people a menu made them anxious that they were choosing wrong.

## 1.2 The first session

### Before signup

**PRIMARY-ish, First Round Review interview with Gina Gotthilf, then VP of Growth at Duolingo. Published
17 July 2017, page updated 23 November 2024.**
<https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/>

Verbatim:

> "We found that by allowing users to experience Duolingo *without* signing up, do a lesson, see the set of
> skills that you can run through, we could increase those sign-up metrics significantly. Simply moving the
> sign-up screen back a few steps led to about a 20% increase in DAUs."

(The original uses em dashes where I have written commas. The figures and wording are otherwise verbatim.)

The wall structure, same source:

> "There was a big red button at the bottom of the screen that said 'Discard my progress', basically meaning
> 'Don't sign up.'"

Swapping that red button for a quiet **"Later"** created what Duolingo calls soft walls:

> "We have three of those soft walls now. Finally, there's a hard wall, after several lessons, that basically
> says if you want to move forward, you have to sign up. Here's what's key: without those soft walls priming a
> sign-up as they're ignored, those hard walls perform significantly worse."

Optimising the walls added a further **8.2% increase in DAUs**.

**STALE RISK on the exact count.** The "three soft walls, then one hard wall" arrangement is a 2017 statement.
The principle (play first, ask later, ask softly, then ask firmly) is still visibly true in 2026, but do not
quote "three" as current.

### The onboarding questions before the first lesson

This is where sources genuinely disagree, and I am not going to paper over it.

| Source | Date | Claim |
|---|---|---|
| UserGuiding (SECONDARY) | updated 28 Feb 2024 | A **7-step** mobile signup flow, a 6-step web flow, then a separate 4-step account signup afterwards |
| Reteno onboarding gallery (SECONDARY) | captured 21 Jul 2025 | Labelled "Short flow (30- steps)", 17 captured app screens |
| Tasu.ai (SECONDARY) | June 2026 | **38 screens** total, grouped as personalisation, emotional-attachment beats, first lesson, soft paywall, re-timed permission asks |
| App Fuel (SECONDARY, STALE RISK) | 14 Oct 2020 | Customisation, then placement test, then rewards intro, then signup, then ads and subscription messaging |

The topics asked are consistent across all four: **which language, how you heard about Duolingo, why you are
learning, your current level (or a placement test), and a daily time or XP goal.** The *number* of screens has
clearly grown a great deal between 2020 and 2026, and no source is authoritative on the current count. Treat
"between roughly 7 and 38, and rising" as the honest answer.

**Daily goal options: CONTESTED.** Multiple secondary sources give the labels Casual, Regular, Serious, Intense
mapped to 5, 10, 15 and 20 minutes a day, and another set gives Basic 1 XP, Casual 10 XP, Regular 20 XP,
Serious 30 XP, Intense 50 XP. One source claims Duolingo has recently removed the ability to change the goal.
I could not verify any of these against an official Duolingo page. Use the *shape* of the mechanic (a
four-or-five-option commitment picker with named tiers, not a number field), not the specific numbers.

### What the first lesson looks like

**PRIMARY, current Google Play listing for `com.duolingo`, app version 7.133.0, released 27 July 2026.** I read
the listing's own screenshots. A lesson screen contains, top to bottom:

- An `X` to quit, one horizontal progress bar, and a pink battery pill with a number (Energy).
- One instruction line in bold, for example `Translate this sentence`.
- One character with one speech bubble containing the prompt.
- The answer construction area (a word bank of tappable tiles).
- **One full-width primary button at the bottom.**

That is the whole screen. One instruction, one task, one button. No navigation, no tab bar, no settings, no
progress dashboard. The exit is a small grey `X`, deliberately the least prominent thing on the screen.

**PRIMARY, 3 July 2025:** the pink battery is Energy, which replaces Hearts.
<https://blog.duolingo.com/duolingo-energy/> Verbatim: *"With our old system, Hearts, each mistake cost 1 heart
for free learners. This was not the most effective way to support learning. It could be especially frustrating
for beginners, who were still figuring things out and 2X more likely to run out of hearts mid-lesson."*
Mechanics given officially: you start with full energy, each lesson uses some, you earn energy back by getting
several answers right in a row, reviewing your mistakes at the end of a lesson costs no energy, and it fully
recharges in about a day. Note that as of that post Energy was in limited rollout and Hearts still existed for
many users, so both systems are live.

## 1.3 What is hidden at first, and what actually unlocks it

| Feature | Hidden at first? | Unlock trigger | Confidence |
|---|---|---|---|
| The path itself | No | Visible from lesson 1 | PRIMARY (Feb 2026 screenshot) |
| Streak | No | Starts when you meet the daily goal on day 1 | PRIMARY, <https://blog.duolingo.com/how-duolingo-streak-builds-habit/>, 31 Jan 2022 |
| Gems | No | Earned from the first lesson | PRIMARY (visible in top bar, Feb 2026) |
| Hearts / Energy | No | Present from lesson 1, mobile only, free users only | PRIMARY, 3 Jul 2025 |
| Stories | Yes, positionally | They sit as greyed book nodes further along the path and light up when you reach them | PRIMARY, 6 May 2022 |
| Reward chests | Yes, positionally | Greyed chest nodes on the path, opened by reaching them | PRIMARY (Feb 2026 screenshot) |
| Leaderboards / Leagues | Yes | **CONTESTED.** The Duolingo Wiki and many secondary blogs state "complete at least 10 lessons". Duoplanet (28 Aug 2023) says "To join a weekly leaderboard, all you need to do is complete a lesson." Duolingo's own help page on leaderboards mentions **no lesson threshold at all**, only that a private profile or being under 13 blocks access. | CONTESTED |
| League structure | n/a | 10 leagues, lowest to highest: Bronze, Silver, Gold, Sapphire, Ruby, Emerald, Amethyst, Pearl, Obsidian, Diamond. Weekly, resets Sunday by device timezone. | PRIMARY, <https://www.duolingo.com/help/leaderboards-and-league> |
| Leaderboard size | n/a | 30 learners per board | SECONDARY (Duoplanet, 28 Aug 2023) |
| Quests | Yes | Own tab, chest icon, holding daily quests, monthly challenges and Friends Quests | PRIMARY, 6 May 2022 |
| Friends Quest | Yes | Requires at least one friend added | SECONDARY |
| Streak Society | Yes | Originally 365-day streak; Duoplanet (26 May 2023) reports tiers around 50 to 60 days, 150 to 200 days, and 365 days | SECONDARY, STALE RISK |
| Practice Hub | Yes | Was a Super-subscriber tab (dumbbell icon). PRIMARY, 16 Dec 2025: *"Super subscribers can use their Practice Hub (the dumbbell at the bottom of the screen)"*. SECONDARY, 18 Feb 2026: Duolingo removed the paywall on the Practice tab for iOS, freeing Mistakes, Words, Speak and Listen, with Android pending. | Mixed |
| Video Call with Lily | Yes | Duolingo Max subscription only | PRIMARY, 16 Dec 2025 |
| Side Quests | Yes | Three star icons appear beneath each character along the path | PRIMARY, 16 Dec 2025 |
| Match Madness | Yes | Appears intermittently on the Leaderboards screen | PRIMARY, 16 Dec 2025 |
| Legendary levels | Yes | Only offered on nodes you have already completed | PRIMARY, 16 Dec 2025 |

The pattern that matters: **almost nothing is unlocked by a hidden rule. It is unlocked by physically reaching it
on the path.** Stories, chests, side quests and legendary levels are all visible as greyed shapes ahead of you.
You are shown the locked thing, in position, before you can use it. Only the social layer (leagues, friends
quests, streak society) and the paid layer (Video Call, and formerly Practice Hub) use invisible thresholds.

## 1.4 The single continue path

Concrete mechanics, all from primary artefacts:

- **On the home screen** there is one green node with a START bubble and everything after it is grey. Reaching
  the next node is not a choice, it is the only lit affordance. (PRIMARY, Feb 2026 image.)
- **Tapping a node opens a one-button bubble.** Duolingo's own alt text, 16 December 2025: *"a node in the path
  has been clicked on and there is a bubble that says 'Start +35XP'"*. Tapping an **already-completed** node
  opens a bubble with exactly **two** options: *"review to earn 5XP or do a Legendary lesson to earn 40XP"*.
  So: one option forward, two options backward, never a menu.
  (<https://blog.duolingo.com/ways-to-practice-in-duolingo/>)
- **Inside a lesson** there is one instruction, one prompt, one input area and one full-width button.
- **Quitting is de-emphasised.** The exit is a small grey `X` in the corner, against a large coloured primary
  button. This is the same design instinct that produced the documented "Discard my progress" to "Later" change
  in 2017: the destructive option is made visually quiet, not removed.

**Honest gap.** Duolingo has **not** published a design principle that says "one dominant action per screen".
I looked through their entire public brand guidelines site and their design blog and found no such statement.
What they have published is the *reason*, which is the "correct or best way" quote in 1.1, plus the Feb 2026
line: *"Simplicity is good but not at the expense of clarity. Good design means knowing what to remove and what
to keep."* Everything else in this section is observed from dated screenshots, and I am labelling it as
observation rather than doctrine.

## 1.5 How the tab bar has changed

Dated evidence only. I have deliberately not filled the gaps with recollection.

| Date | Tab bar state | Source |
|---|---|---|
| Before Nov 2022 | Included a separate **Stories** tab; Tips lived per-skill inside the tree | PRIMARY, blog, 6 May 2022 |
| 22 March 2022 | Duolingo shut down its **discussion forums** entirely, keeping only Sentence Discussions | SECONDARY, widely reported |
| 1 Nov 2022 | Path launches for all learners. Stories tab **removed** and folded into the path. Tips **removed** and folded into a per-unit guidebook. **Quests** tab added (chest icon). **Practice Hub** tab added (barbell icon), Super only. | PRIMARY, blog, 6 May 2022 |
| 16 Dec 2025 | Practice Hub still described as "the dumbbell at the bottom of the screen" for Super subscribers | PRIMARY, blog |
| 18 Feb 2026 | Practice tab paywall removed on iOS | SECONDARY |
| 4 Feb 2026 | **Six tabs**, read directly from Duolingo's own image: house (Learn), chest (Quests), trophy (Leaderboards), video camera (Video Call), person (Profile), heart-in-speech-bubble (Feed) | PRIMARY, blog image |

Note the direction of travel. Between 2022 and 2026 Duolingo **removed two tabs from the top level** (Stories,
Tips) by pushing that content *into* the single path, and then **added four social and paid tabs** around it
(Quests, Leaderboards, Video Call, Feed). The learning surface got simpler. The retention surface got bigger.
Do not read Duolingo as an app that keeps getting simpler overall. It keeps the *learning* screen ruthlessly
simple and lets complexity accumulate in the tabs beside it.

**Unverified:** the tab bar composition for 2018 to 2021. Search results gave conflicting sets (one claiming
Learn / Lives / Clubs / Shop / Profile). App Store screenshot archives for those years are paywalled. I am not
going to assert a lineup I could not read.

## 1.6 Their published design system and UX writing

**There is no public Duolingo product design system.** `design.duolingo.com` is a **brand** guidelines site.
I extracted its route table from the compiled JavaScript bundle; the complete set of pages is:

```
/identity/logos, /identity/color, /identity/typography, /identity/imagery, /identity/brand-family
/writing/brand-narrative, /writing/voice, /writing/tone, /writing/style, /writing/duo, /writing/glossary
/illustration/shape-language, /illustration/characters, /illustration/duo
/marketing/assets, /marketing/elements
/resources
```

No component library, no interaction patterns, no spacing scale, no accessibility guidance. Anyone claiming to
have found "the Duolingo design system" has found a third-party reconstruction, not an official artefact.

**The UX writing guidelines are real and they are good.** From `design.duolingo.com/writing/style`, verbatim:

- **Buttons:** *"Never use punctuation in a button."* Their example of correct button copy is `NO THANKS`,
  the incorrect version is `NO, THANKS`.
- **Headlines:** *"Don't punctuate headlines, except with an exclamation point."* Correct: `Freeze your streak`
  and `Keep the flame lit!`. Incorrect: the same lines with full stops.
- **Subheads:** *"Don't punctuate subheads, unless with an exclamation point. If it's a multi-sentence subhead,
  punctuate each sentence."* Correct: `You're on day 1 of 7` and `You're on day 1 of 7. Keep going!`.
- **Numerals:** *"Write all numbers numerically, even numbers under 10. But if a number starts a sentence,
  spell it out."* And: *"If the number is over 999, include a comma. But don't include a comma for XP or other
  currency totals in the product."* So `4 day streak` and `2567 XP`, not `four day streak` or `2,567 XP`.
- **Compound adjectives:** *"Don't hyphenate 'x day streak'."* Correct: `Keep your 10 day streak going!`.
- **Em dashes:** *"Avoid em dashes. It's more Duolingo style to have two sentences than one long sentence
  broken up with a dash."*
- **Semicolons:** *"Instead of a semicolon, use an em dash. Even better: Break long, two-part sentences into
  two simple sentences."*

From `design.duolingo.com/writing/tone`, verbatim, and this is the most directly copyable thing on the entire
site:

> When learners succeed, we **celebrate** them. Bust out the exclamation points!
> Like this: `Correct!` `Awesome work!`
> Not this: `You are correct` `You have successfully passed this level`
>
> When learners stumble, we **support** them. This is the time for friendly, helpful language, but don't
> overdo it. We want them to keep going!
> Like this: `Not quite correct. Try again!` `Oh no! You're out of health. Want to ask a friend for a refill?`
> Not this: `Incorrect.` `We're very sorry, but you don't have any health left. Hopefully, a friend will
> share some health with you, do you want to ask them?`

**STALE RISK on the brand narrative page only.** `/writing/brand-narrative` names Trevor Noah as the current
host of The Daily Show, which dates that particular page to roughly 2016 to 2022. The style and tone pages
above carry a fresher server timestamp (9 April 2026 on the tone page) and read as current.

---

# PART 2 · HEADSPACE

## 2.1 What the home screen shows and how many actions it offers

**PRIMARY, current App Store listing, version 8.25.2, released 30 July 2026.** I read the listing screenshots
directly. The Today tab contains:

- A greeting line: `Good Morning, Katie`, with three small unlabelled icons at the right (heart for favourites,
  clock for recents, bell for notifications).
- A section heading: `Start your day`.
- **A vertical dotted timeline of cards.** The topmost card has a filled dot beside it; later cards have hollow
  dots. Each card carries three things and only three things: a title, a content-type label, and a duration.
  In the listing screenshot: `The Wake Up` / Video / 3-7 min, then `Breathe with the Clouds` / Mindful Activity
  / 1 min, then `Monthly Stress Reflection` / Progress Tracking / 5 min, then a fourth card cut off below.
- A tab bar with **three tabs**: `Today`, `Explore`, and the member's own first name.

Three tabs. That is the whole navigation. Compare Duolingo's six.

**PRIMARY, Apple Developer, 5 June 2023.** *"Behind the Design: Headspace"*
(<https://developer.apple.com/news/?id=fkfnhq8u>), Jeff Birkeland, Headspace SVP and GM for member products:

> "In previous versions of Headspace, the core navigation included tabs for meditation, focus, movement, and
> sleep. But Birkeland says user research convinced the team to strip away that complexity and focus instead on
> the app's Today tab, which facilitates one-tap access to activities of varying lengths for morning,
> afternoon, and night. Importantly, it does so without bringing up specific categories."

And on where the complexity went:

> "The Explore tab, meanwhile, is the gateway to that vast bank of content, including those former
> category-based parts of the core navigation. 'There's still simplicity at the surface,' says Birkeland.
> 'But there's an incredible depth of content underneath.'"

The framing quote, worth keeping:

> "Demystification is a word we use a lot. Mindfulness and mental health can seem complex, perhaps mystical,
> maybe even inaccessible. So how do we make it approachable and friendly? And how do we get people to the
> right content faster?"

**The before state, for contrast. SECONDARY, Android Authority, 4 September 2021, STALE RISK by design since
it documents the old app:** five sections, *"a user profile, the Today tab for tracking your daily practice,
and four main topical tabs: Meditate, Sleep, Move, and Focus."* So the redesign took **five tabs down to
three**, and pushed the four topical tabs behind a search field and four coloured buttons inside Explore
(confirmed in the current App Store screenshots: a `Search Headspace` field, then buttons for `Meditate`,
`Sleep`, `Move`, `Music`).

**How many actions does the Today screen offer?** Not one. It offers a small ordered stack of typically three
to five cards, one of which is visually first in a timeline. It is a *shortest ranked list*, not a single
button. That distinction matters for what you copy.

**SECONDARY, ScreensDesign (undated capture):** a fair criticism worth recording. *"The home screen, while
personalized, is quite long and requires significant scrolling to see all sections."* The same source counts
**10 onboarding steps** and classifies the paywall as a free-trial soft paywall shown during onboarding.

## 2.2 How the onboarding questions shape what appears afterwards

This is the best-documented thing in the whole report, and the finding is not the one people expect.

**PRIMARY-adjacent, Irrational Labs case study, published around April to May 2026** (chart images are dated
2026-04), run jointly by Headspace, Irrational Labs and Purchasely.
<https://irrationallabs.com/case-studies/headspace-doubled-course-starts/>

Five onboarding variants were tested on new free-trial users:

1. **Control.** The existing onboarding. Course discovery happened only later, inside the app.
2. **Default to Basics.** Recommend the Basics course immediately, ask no questions.
3. **Perceived Fit.** Ask a short quiz, then recommend the Basics course to everyone regardless of answers.
4. **Personalised Fit.** Ask the quiz, then match the person to a course based on their answers.
5. **Precommitment.** Quiz, plus a course recommendation, plus a concrete plan for when, where and how often
   they would meditate.

Results, verbatim figures:

- Course starts rose from **31.25%** in control to **62.97%** in the Perceived Fit condition.
- Perceived Fit beat Default to Basics by **7.6 percentage points**, and the *only* difference between those
  two conditions was whether questions were asked. Everyone got the same course either way.
- Precommitment raised app opens by **7.5%** and unique app-open days by **4%**.
- **No statistically significant increase in active meditation days in any condition.**

Their explanation, verbatim:

> "Asking users to answer a number of questions about their experience with meditation and plans for using
> Headspace, creates a *perception* that the recommended course will be tailored to them even if everyone will
> be assigned to the basics course anyway."

The question topics used, quoted from the same case study: experience with meditation, plans for using
Headspace, *"what do you want help with"*, *"how will you use Headspace?"*, which days they would meditate, and
which trigger they wanted to associate with the app (their examples: *"In the morning, to start my day"* and
*"Throughout the day instead of scrolling social media"*).

**Older question wording. SECONDARY, Appcues GoodUX, screenshots dated 23 November 2018, STALE RISK.** The
sequence then was: *"What's your experience with meditation?"*, *"What brings you to Headspace?"*,
*"When do you meditate?"*, then a recap screen summarising the selections with a call to action to begin.
The recap screen is the interesting survivor: it plays the answers back before starting.

**Three failure modes Headspace and Irrational Labs documented honestly, all directly relevant to you:**

1. *"At the time of our experiment, when users re-opened the app, they would land on the today page which would
   contain not just their course but a range of other meditation options. People may not have been able to
   identify which option was their course and so abandon before they start a meditation."* They had designed a
   one-click return modal to fix this and **it was cut during implementation**.
2. *"New users in the control condition complete a breathing course as the first exercise they complete in
   Headspace."* Users who instead got a longer guided course found it violated their expectation of what
   meditation is. Their own summary: *"When you expect short breathing exercises, a longer guided session might
   feel like too much."*
3. Their matching logic over-weighted sleep. Stress and anxiety were the most commonly selected needs, but the
   logic tree recommended a sleep course whenever sleep appeared anywhere in the answers.

**The blunt lesson, verbatim:** *"Behavioral design at onboarding can drive early action and engagement, but
real habit formation requires behavioral design across the full experience, not just at the front door."*

## 2.3 How they introduce features beyond the first meditation

**PRIMARY, current App Store screenshots, 30 July 2026.** The Basics course detail screen shows:

- One hero image, the title `Basics`, and a metadata line reading `Course · 3-10 min`.
- One sentence of description: *"Live happier and healthier by learning the fundamentals of meditation and
  mindfulness."*
- A `Choose your teacher` selector with named human faces (Andy, Eve).
- **One primary blue button: `Begin Course`.**

So the first structured commitment is a course, not a session, and it carries a duration range up front and
exactly one button. The only choice offered on that screen is a cosmetic one (which voice), which is the
cheapest possible way to give someone agency without asking them to evaluate content.

Beyond that first course, everything else is introduced through the **Explore** tab rather than being surfaced
on Today: a search field, four category buttons (Meditate, Sleep, Move, Music), then themed collections with
plain-English names. Apple's write-up records this deliberately:

> "Headspace smartly organizes its library of resources through language. Collections and exercises are labeled
> with understandable purposes, like Unlocking Creativity, Mindful Eating, and The Shine Collection."

The current App Store screenshots confirm the same naming style is still in use: `Parents and kids`,
`Mindful eating`, `Mindful Money`, `Navigating injustice`, `Mindfulness at work`, `Weathering the storm`,
`Reframe stress and relax`. Every one of those is a situation, not a technique. Nothing is called
"Vipassana" or "Body Scan Level 2".

The Sleep section, read from the current screenshots, uses the same pattern: each card is a title plus one
plain sentence of what it is for. `Sleepcasts` / *"Ever-changing storytelling in range of soothing voices."*
`Wind Downs` / *"Meditation and breathing to prepare the mind for sleep."* `Sleep Music` / *"Drift off to sleep
with these calming tracks."* `Kids and Parents` / *"Your toolkit for better bedtimes."*

## 2.4 How they use a single "today" card

Precisely stated, so you copy the right thing:

- The Today tab does **not** show one card. It shows a **short ordered timeline** of three to five cards under
  a time-of-day heading such as `Start your day`.
- The ordering is by **time of day, not by category.** Apple's phrasing: *"activities of varying lengths for
  morning, afternoon, and night. Importantly, it does so without bringing up specific categories."*
- The **first card in the timeline is visually privileged**: it sits at the filled dot, the later ones sit at
  hollow dots. That is the "today card". It is a default, not a lock.
- Every card carries **duration**. `3-7 min`, `1 min`, `5 min`. This is doing enormous work: it converts an
  open-ended, slightly intimidating activity into something whose cost you can see before you commit.
- The greeting is personal and time-aware: `Good Morning, Katie`.

And the documented flaw, again from Irrational Labs: because Today shows a range of options rather than one, a
returning user could not tell which one was *their* course. Headspace's own researchers identified the fix as a
one-click return modal, and it was cut. That is the strongest argument in this entire document for a returning
user landing on **one** resume affordance rather than a personalised feed.

---

# PART 3 · WHAT A SMALL SIGN-LANGUAGE APP CAN COPY

Ground rules for this section: no backend, no accounts, no social graph, no content team. Everything below runs
on a single-page app plus `localStorage`. I have marked each item with the effort it actually costs.

### 3.1 Copy directly, cheap, high value

**A. The linear path with one lit node.** *(Low effort, highest value.)*
Render every lesson in the course as a node in one vertical column. Completed nodes are solid and ticked. The
current node is the only coloured one and it is the only thing with a label. Everything after it is grey.
Tapping the current node opens a one-button bubble reading `START`. This needs no backend: an index into an
array in `localStorage`. It removes the entire "am I doing this right" anxiety that Duolingo explicitly named
as its reason for the redesign.

**B. Show locked content in position, greyed out.** *(Low effort.)*
Do not hide your later features behind rules. Put the fingerspelling drill, the story, the reward moment on the
path as grey shapes the learner scrolls past. The unlock trigger is arriving there. This gives you the entire
psychological benefit of progressive disclosure without a single conditional-unlock rule to write, debug or
explain.

**C. Play before signup, and there is no signup.** *(Zero effort, it is a decision.)*
Duolingo's 20% DAU lift came from letting people do a lesson first. You have no accounts at all, so you get the
full benefit for free. Do not add a name-entry screen, an email capture, or a "create your profile" step at the
front. Land the user directly in the first exercise. If you ever want a name for greeting purposes, ask for it
*after* the first completed lesson, in a dismissible card with a quiet `Later`.

**D. One instruction, one prompt, one input, one button.** *(Low effort.)*
Copy the Duolingo lesson chrome exactly: an `X` in the top-left as small grey text, one progress bar, and if
you have a resource meter, one pill at the top-right. Then one bold instruction line, the sign or video, the
answer area, and a single full-width primary button. Nothing else on the screen. Never a tab bar during a
lesson.

**E. Make the exit quiet, never absent.** *(Zero effort.)*
Duolingo's documented experiment: a prominent red "Discard my progress" cost them users; a quiet "Later"
recovered them. Every dismissal, skip and quit in your app should be small grey text, and the forward action
should be the large coloured button. Do not remove the exit. Shrink it.

**F. Duration on every card.** *(Low effort.)*
Headspace puts `3-7 min` or `1 min` on every single item. Your lessons should carry an honest time estimate or
a card count. This is the single cheapest way to reduce the perceived cost of starting.

**G. The tone rules, verbatim.** *(Zero effort, it is a find-and-replace on your copy.)*
Take Duolingo's published rules straight: no punctuation in buttons, no full stops in headlines, exclamation
points only on success, numerals written as digits even under 10. And their success-versus-stumble split:
`Correct!` not `You are correct`; `Not quite correct. Try again!` not `Incorrect.` Their published avoidance of
em dashes happens to match your own house style exactly.

**H. Name your content by situation, not by technique.** *(Zero effort at authoring time, impossible to retrofit.)*
Headspace ships `Mindful eating` and `Weathering the storm`, not `Vipassana Module 2`. Your units should be
`Introduce yourself`, `Ordering food`, `Meeting your neighbour`, not `Handshape set 3` or `Non-manual markers`.
Duolingo's own unit banner in the February 2026 screenshot reads exactly this way: `SECTION 2, UNIT 6` on the
small line, `Introduce yourself` on the large line. Two lines: machine label small, human label large.

**I. Streak on the first completed session, with an over-designed celebration.** *(Medium effort, animation cost.)*
Duolingo's measured result: adding a better streak-extension animation increased the chance a brand new learner
was still there seven days later by **1.7%**. The streak number itself is one integer plus one date string in
`localStorage`. The value is not in the counter, it is in the two seconds of animation after lesson one.

**J. A recap screen after the questions.** *(Low effort.)*
Headspace's 2018 flow ended its questions with a recap of the answers before starting. This is the visible
half of the "perceived fit" effect: people need to *see* that you listened.

### 3.2 Copy the shape, not the implementation

**K. Ask three questions, then recommend one thing, and it can be the same thing for everyone.**
*(Low effort. This is the most valuable single finding in the report.)*
Headspace's Perceived Fit condition asked a quiz and then gave **everyone the identical Basics course**, and it
beat giving people that same course with no questions by 7.6 percentage points, and doubled course starts
against control. Their Personalised Fit condition, which actually did the matching work, did **not** beat it.

For you this means: ask three short questions (why are you learning QSL, how much do you already know, when
will you practise), show a recap, then start everyone on lesson one. You get the personalisation lift with a
hardcoded route and no recommendation engine. If you later build genuine branching, do it because it is
pedagogically better, not because you expect a conversion gain, because Headspace's data says there was not one.

**L. Ask for a precommitment, then use it as your only notification.**
*(Low effort if you use a local notification or none at all.)*
Their precommitment condition lifted app opens 7.5% and unique open days 4%. Copy the *question*, not the
infrastructure: "Which days will you practise?" and "When?" with options phrased as triggers, in the style of
their examples *"In the morning, to start my day"* and *"Throughout the day instead of scrolling social
media"*. Even with no push notifications at all, writing that answer back on the home screen ("You said
mornings. Ready?") is a real behavioural intervention and costs nothing.

**M. Three tabs maximum, and none of them during a lesson.**
Headspace ships three: Today, Explore, and the member's name. Duolingo's learning surface is one tab and the
other five are retention and social features you do not have. Your ceiling is **two or three**: the path,
optionally a practice or review surface, and a settings or progress screen. Every tab you add is a decision you
are handing back to the user.

**N. Time-aware greeting, at zero cost.**
`Good Morning, [name]` from `new Date().getHours()` and one string in `localStorage`. Headspace's entire
"personalised" surface leans on this and a time-of-day section heading. It costs one function.

### 3.3 Copy the fixes to their documented mistakes

**O. On return, show one resume affordance, not a feed.**
This is the mistake Headspace themselves diagnosed and did not ship the fix for. When someone reopens your app,
the very first thing on screen should be the single node they were on, with a `CONTINUE` label, before any
suggestions, streak celebration, or anything else. Their designers wanted a one-click return modal. It was cut.
Build it.

**P. Do not let your first session be longer or harder than the mental model.**
Headspace's finding: control users did a short breathing exercise first and that matched what they expected
meditation to be; treatment users got a longer guided session and it violated expectation. Your first session
should be the shortest, most obviously sign-language-shaped thing you have: recognise one sign, produce one
sign. Not a lesson on handshape theory, not a five-minute video.

**Q. Do not assume a good onboarding produces a habit.**
Their own headline conclusion is that they doubled course starts, raised app opens, and moved active
meditation days **not at all**. Whatever you build at the front door, expect it to move starts and not
retention, and instrument the two separately.

### 3.4 Explicitly do not copy

- **Leagues, leaderboards, friend quests, feed.** These need a social graph and a server. They are also the
  four newest tabs Duolingo added, which tells you they are a scale play, not a comprehension play.
- **Hearts or Energy.** Duolingo's own words: hearts made beginners *"2X more likely to run out of hearts
  mid-lesson"* and that this *"was not the most effective way to support learning"*. They only replaced it with
  a softer meter because they need a monetisation surface. You do not. Ship no failure currency.
- **A 30-plus screen onboarding.** Duolingo's screen count grew from roughly 7 to reportedly 38 because each
  screen increases sunk cost before a paywall. You have no paywall. Every screen you add is pure loss.
- **Gems, shops and streak freezes.** Economy mechanics need a balance model and a reason to exist. Without
  monetisation they are decoration you have to maintain.
- **A long scrolling personalised home feed.** Headspace's is criticised for exactly this, in a source that is
  otherwise flattering, and their own research team traced a retention failure to it.

---

# PART 4 · SOURCE LIST WITH DATES

| # | Source | Date | Type | Staleness |
|---|---|---|---|---|
| 1 | <https://blog.duolingo.com/new-duolingo-home-screen-design/> | 6 May 2022 (launch 1 Nov 2022) | PRIMARY | Pre-2023. Path still exists, so core claims hold, but tab details superseded |
| 2 | <https://blog.duolingo.com/core-tabs-redesign/> | 4 Feb 2026 | PRIMARY | Current |
| 3 | <https://blog.duolingo.com/ways-to-practice-in-duolingo/> | 16 Dec 2025 | PRIMARY | Current |
| 4 | <https://blog.duolingo.com/product-highlights/> | 10 Dec 2025 | PRIMARY | Current |
| 5 | <https://blog.duolingo.com/duolingo-energy/> | 3 Jul 2025 | PRIMARY | Current, feature still in rollout |
| 6 | <https://blog.duolingo.com/how-duolingo-streak-builds-habit/> | 31 Jan 2022 | PRIMARY | Pre-2023, mechanic unchanged |
| 7 | <https://www.duolingo.com/help/leaderboards-and-league> | Undated | PRIMARY | Current, but silent on the lesson threshold |
| 8 | <https://design.duolingo.com/writing/style> and `/writing/tone` | Tone page server timestamp 9 Apr 2026 | PRIMARY | Current |
| 9 | <https://design.duolingo.com/writing/brand-narrative> | Undated | PRIMARY | STALE, internal evidence dates it 2016 to 2022 |
| 10 | <https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/> | 17 Jul 2017, updated 23 Nov 2024 | PRIMARY interview | STALE on specifics, sound on principle |
| 11 | Google Play listing, `com.duolingo`, v7.133.0 | 27 Jul 2026 | PRIMARY artefact | Current |
| 12 | <https://developer.apple.com/news/?id=fkfnhq8u> | 5 Jun 2023 | PRIMARY interview | Just inside the freshness window |
| 13 | App Store listing, Headspace, v8.25.2 | 30 Jul 2026 | PRIMARY artefact | Current |
| 14 | <https://irrationallabs.com/case-studies/headspace-doubled-course-starts/> | ~Apr to May 2026 | PRIMARY-adjacent, run with Headspace | Current |
| 15 | <https://kristenberman.substack.com/p/lessons-on-habit-formation-from-an> | 1 May 2026 | Same authors | Current |
| 16 | <https://www.purchasely.com/blog/headspace-behavioral-science-onboarding-experiment> | 7 May 2026 | SECONDARY, partner | Current |
| 17 | <https://growth.design/case-studies/duolingo-user-retention> | Undated | SECONDARY | Unknown, treat cautiously |
| 18 | <https://duoplanet.com/duolingo-leagues-the-essential-guide-everything-you-need-to-know/> | 28 Aug 2023 | SECONDARY | Borderline |
| 19 | <https://duoplanet.com/duolingo-streak-society/> | 26 May 2023 | SECONDARY | Borderline |
| 20 | <https://userguiding.com/blog/duolingo-onboarding-ux> | updated 28 Feb 2024 | SECONDARY | Ageing |
| 21 | <https://tasu.ai/library/duolingo> | Jun 2026 | SECONDARY | Current but unsourced |
| 22 | <https://gallery.reteno.com/flows/app-screens-duolingo> | captured 21 Jul 2025 | SECONDARY artefact | Current, screens gated |
| 23 | <https://screensdesign.com/showcase/headspace-meditation-sleep> | Undated | SECONDARY | Unknown |
| 24 | <https://www.androidauthority.com/headspace-app-2746501/> | 4 Sep 2021 | SECONDARY | STALE, cited only for the pre-redesign state |
| 25 | <https://goodux.appcues.com/blog/headspaces-mindful-onboarding-sequence> | screenshots 23 Nov 2018 | SECONDARY | STALE, cited only for question wording |
| 26 | <https://thelearningstandard.org/news/duolingo-unlocks-premium-practice-tools-for-free-accounts> | 18 Feb 2026 | SECONDARY | Current, single-source |
| 27 | <https://theappfuel.com/casestudies/three-learnings-from-duolingos-onboarding> | 14 Oct 2020 | SECONDARY | STALE |

---

# PART 5 · WHAT I COULD NOT VERIFY

State these as open, not as fact.

1. **The league unlock threshold.** "Complete 10 lessons" is repeated by the Duolingo Wiki and many blogs.
   Duoplanet says one lesson. Duolingo's own help page gives no threshold at all. Unresolved.
2. **The current Duolingo daily-goal options.** No official page found. The tier names and their XP or minute
   values come only from secondary blogs and they disagree with each other.
3. **The current Duolingo onboarding screen count.** Estimates range from 7 to 38 across sources dated 2020 to
   2026. No official statement exists.
4. **The Duolingo tab bar between 2018 and 2021.** Conflicting third-party accounts, and the App Store
   screenshot archives that would settle it are paywalled.
5. **Headspace's own help centre documentation of the Today tab.** `help.headspace.com` requires a sign-in and
   returns HTTP 403 to anonymous fetches. Everything about Today here comes from Apple's interview and from
   Headspace's own current App Store screenshots instead.
6. **Whether Headspace still runs the winning Perceived Fit onboarding in production.** The experiment is
   documented; the rollout decision is not.
7. **Growth.Design's Duolingo case study date.** The page carries no publication or update date, so its
   figures (including a "+14% Day-7 retention" streak-wager claim) are unaged and I have not relied on them.
8. **Any Duolingo statement of a "one primary action per screen" principle.** I searched their full brand
   guidelines site and their design blog. It does not exist as published doctrine. The behaviour is
   observable in dated screenshots; the principle is my inference, and is labelled as such throughout.
