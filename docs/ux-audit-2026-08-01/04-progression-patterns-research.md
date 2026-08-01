# Teaching a whole app over time: named patterns, verified repos, design-system references

Research date: 2026-08-01. Every URL below was fetched or returned by search during this session.
Star counts come from `api.github.com` on 2026-08-01 and will drift.

Verification key used throughout:

- **[V]** I fetched the page and read the content quoted.
- **[P]** The URL is live but its body is JavaScript-rendered and would not return text to the
  fetcher. Quotes come from search-engine excerpts of that exact page, not from my own reading.
- **[U]** Referenced but not read. Treat as a lead, not a citation.

---

## Part A · The named patterns

### A1. Progressive disclosure

**Source [V]:** Jakob Nielsen, "Progressive Disclosure", NN/g, 3 December 2006 ·
https://www.nngroup.com/articles/progressive-disclosure/

The canonical definition: "Initially, show users **only a few** of the most important options. Offer
a **larger set** of specialized options upon request."

Rules the article gives:

- Disclose frequently needed features upfront so users rarely have to dig.
- Do not put confusing features in the initial interface at all.
- Label the door clearly so users can predict what is behind it.
- Avoid more than two levels of disclosure. Three or more hurts usability.

**Source [V]:** Raluca Budiu, "Progressive Disclosure" (video), NN/g, 15 July 2022 ·
https://www.nngroup.com/videos/progressive-disclosure/ — frames it as deferring secondary options to
a subsidiary screen so attention lands on the primary ones.

**Source [V]:** Jakob Nielsen, "Progressive Disclosure", UX Tigers (his current blog, dated 9 July;
year not shown in the fetched body) · https://www.uxtigers.com/post/progressive-disclosure
Two operational rules worth stealing verbatim: "**Stop at 2 levels.** Each additional level
multiplies clicks and halves discoverability", and a target split where "**80%** of tasks land on
level 1, 20% on level 2".

**Transferable idea:** the split is a *task-frequency* decision, not a taste decision. Count how
often each screen is genuinely needed, put the 80% on level 1, and stop at two levels.

### A2. Staged disclosure (the wizard)

**Source [V]:** same NN/g 2006 article. Nielsen explicitly separates the two: **progressive**
disclosure is hierarchical and usually optional (users go get the advanced thing); **staged**
disclosure is linear and sequential (users walk through steps of one task).

**Transferable idea:** do not use a wizard to teach an app. A wizard teaches one task. Teaching a
whole app is the hierarchical case.

### A3. Multi-layer interface design

**Source [V, bibliographic]:** Ben Shneiderman, "Promoting universal usability with multi-layer
interface design", Proceedings of the 2003 Conference on Universal Usability ·
https://dl.acm.org/doi/abs/10.1145/957205.957206 · PDF at
https://www.cs.umd.edu/users/ben/ACM-CUU2003.pdf (the PDF fetch returned raw binary, so the content
summary below is **[U]**, drawn from the search abstract, not my own reading of the paper).

The claim: ship the *same* application at several deliberately designed complexity layers. Layer 1
is a genuinely usable, genuinely limited product. Users may stay at layer 1 forever, or step up when
they want more. The paper works two examples, a word processor with 8 layers and an interactive map
with 3.

**Transferable idea:** this is the strongest frame for the whole question. You are not designing one
app plus a tutorial. You are designing layer 1, layer 2, layer 3 as three complete products, and a
rule for when someone moves up.

### A4. Training wheels interface

**Source [V, bibliographic]:** John M. Carroll and Caroline Carrithers, "Training wheels in a user
interface", Communications of the ACM (1984) · https://dl.acm.org/citation.cfm?id=358218 · and
"Blocking Learner Error States in a Training-Wheels System", Human Factors, 1984 ·
https://journals.sagepub.com/doi/10.1177/001872088402600402

**Source [V] for the finding:** Nielsen's UX Tigers piece above summarises it: beginners on the
training-wheels build learned the basic task faster and scored better on a comprehension test, while
the control group "burned almost 1/4 of its time recovering from exactly the error states the
training interface had walled off."

The mechanism matters: advanced menu items were **not hidden**. They were present and *blocked*,
producing a polite "not available" message instead of a rabbit hole.

**Transferable idea:** visible-but-locked beats invisible. The locked item teaches that the app has
more in it, without letting a beginner fall into it.

### A5. Progressive reduction

**Source [V]:** Allan Grinshtein, LayerVault blog ·
https://layervault.tumblr.com/post/42361566927/progressive-reduction — "Usability is a moving
target. A user's understanding of your application improves over time and your application's
interface should adapt to your user." Their Signposting button starts as a large icon **with** a
label; once the user shows competence the label goes; once proficient the button is de-emphasised
altogether. Proficiency also **decays**, and the UI reverts.

**Source [V]:** Jeffrey Zeldman, "Progressive Reduction: Modify Your UI Over Time", A List Apart,
1 August 2013 · https://alistapart.com/blog/post/progressive-reductionmodify-your-ui-over-time/ —
carries the same quote and hosts the sceptical counter-argument in its comments (an interface that
keeps quietly reducing can end up harming the very users it claims to serve).

**Transferable idea:** the *affordance* can shrink even when the feature does not move. Label →
icon+label → icon is a three-state ladder you can drive off a per-feature usage counter, and it is
far cheaper than restructuring navigation.

### A6. Contextual / just-in-time onboarding, and the case against front-loaded tours

**Source [V]:** Alita Kendrick, "Mobile-App Onboarding: An Analysis of Components and Techniques",
NN/g, 21 June 2020 · https://www.nngroup.com/articles/mobile-app-onboarding/

Components named: **feature promotion**, **customization**, **instructions**. Instruction techniques
named: deck-of-cards tutorials, instructional overlays and coach marks, interactive walkthroughs,
contextual help.

Recommendations quoted: "avoid creating app onboarding whenever possible and instead spend your
resources making the UI more usable"; "Instructional onboarding should not be used to supplement poor
design"; "instructional onboarding should be brief, optional, and should only highlight the minimum
that users need to know"; "test the app with no onboarding before investing money into adding extra
screens".

**Source [V]:** Alita Kendrick, "Mobile Tutorials: Wasted Effort or Efficiency Boost?", NN/g,
8 March 2020 · https://www.nngroup.com/articles/mobile-tutorials/ — 70 users, 4 iPhone apps. Task
success 91% with tutorials vs 94% without. No speed advantage. Users who saw the tutorial rated the
tasks as **harder**. Conclusion quoted: "Tutorials take time and effort to design and develop, and
those would be better spent on making the UI easy to use and thus alleviating the need for a tutorial
in the first place."

**Transferable idea:** an up-front tour is measurably not the answer, and can make an app *feel*
more complicated than it is. The budget belongs in contextual, one-thing-at-a-time teaching.

### A7. Coach marks / instructional overlays

**Source [V]:** Aurora Harley, "Instructional Overlays and Coach Marks for Mobile Apps", NN/g,
16 February 2014 · https://www.nngroup.com/articles/mobile-instructional-overlay/

Coach marks are "a transparent overlay of UI hints". Guidance: focus on a **single interaction**, not
a labelled tour of the whole screen; keep text scannable and short; present hints one at a time at
contextually relevant moments; avoid chains of sequential tips. The warning that matters most:
"bombarding users with frequent hint screens causes them to dismiss hints more quickly", regardless
of how good each individual tip is. Users' appetite for new information is "a shot glass, not beer
tankard".

**Transferable idea:** hint budget is a shared, depletable resource across the whole app. Spend it
per session, not per feature.

### A8. Spotlight, and "change-boarding"

**Source [P]:** Atlassian Design System · https://atlassian.design/patterns/spotlight/ and
https://atlassian.design/components/onboarding/ (both live; bodies did not render for the fetcher).
Guidance from search excerpts of those pages: a spotlight focuses attention on one piece of UI and
can guide multi-step tasks; "Only a single spotlight should be used on the screen at one time";
messages restricted to three lines showing a single change, focused on the user benefit; always allow
skip or dismiss; when using a stepper with multiple cards, communicate multiple *benefits*, not the
literal steps of a task. Atlassian names the second use case **change-boarding**: introducing new
features to existing users.

**Verified structurally [V]:** `https://atlassian.design/components/onboarding/examples` states the
Onboarding component is **deprecated** in favour of `@atlaskit/spotlight`.

**Transferable idea:** treat "first-run onboarding" and "change-boarding" as the same machine with
different triggers. A returning user meeting a new feature needs exactly the same one-thing-at-a-time
treatment as a new user.

### A9. Feature discovery prompts

**Source [V]:** Material Design 1, "Feature discovery" ·
https://m1.material.io/growth-communications/feature-discovery.html — "Provide value and improve
engagement by introducing users to new features and functionality at relevant moments."

Frequency rules quoted: "Limit the number of feature discovery messages you present in your UI. For
example, don't display more than one per session." If a user **dismisses** a prompt, wait "a more
substantial period of time" before anything similar; if they **accept** it, a similar prompt sooner
is fine. Do not show prompts on app launch; show them when they help the action already underway, or
during natural pauses.

**Transferable idea:** a dismissal is data. Feed accept/dismiss back into the scheduler so the app
gets quieter for people who do not want hints and stays helpful for people who do.

### A10. Empty state as teacher

**Source [V]:** Shopify Polaris, "Empty state" ·
https://polaris-react.shopify.com/components/layout-and-structure/empty-state — "Empty states are
used when a list, table, or chart has no items or data to show. This is an opportunity to provide
explanation or guidance to help merchants progress." Rules: orient by explaining the benefit of the
feature; focus on a few key features; be encouraging and "never make merchants feel unsuccessful or
guilty"; explain the steps needed to activate the feature; **one** primary call to action.

**Source [V]:** IBM Carbon, "Empty states" · https://v10.carbondesignsystem.com/patterns/empty-states-pattern/
(current URL https://carbondesignsystem.com/patterns/empty-states-pattern/ is live but did not render
for the fetcher). Carbon groups empty states into **no data / first use**, **user action** (no search
results, process complete), and **error management** (permissions, config, unsupported). It then names
three escalations beyond the basic empty state: **in-line documentation**, **onboarding** ("Starting
from an empty state, users have an opportunity to launch a contextual onboarding flow to gain deeper
understanding"), and **starter content** (pre-populated sample data). Its calibration rule: "a primary
resource on a page could benefit from a more educational approach, while basic empty states may
suffice for secondary resources." Titles should be positive statements: "Start by adding data assets",
not "You don't have any data assets".

**Transferable idea:** the empty state is the only teaching surface that costs the user nothing,
because they were going to look at that screen anyway. Every screen that can be empty should have a
written first-use empty state, and the *primary* screen's empty state earns a heavier treatment than
the secondary ones.

### A11. Starter content / sample data

**Source [V]:** Carbon, as above. Pre-built content "can provide the opportunity for users to dive in
and learn about primary features and functions with sample data".

**Transferable idea:** seeding one realistic item beats explaining what an item is.

### A12. Prerequisite graph unlocking (concepts, not screens)

**Source [V]:** Exercism track `config.json` docs ·
https://github.com/exercism/docs/blob/main/building/tracks/config-json.md

Field definitions quoted: `concepts` is "an array of concept slugs that are taught by this concept
exercise"; `prerequisites` is "an array of concept slugs that must be unlocked before a student can
start this exercise"; `status` is one of `wip`, `beta`, `active`, `deprecated`, and `wip` items are
excluded from unlocking logic entirely.

Example entry from the docs:

```json
{
  "slug": "cars-assemble",
  "name": "Cars, Assemble!",
  "uuid": "93fbc7cf-3a7e-4450-ad22-e30129c36bb9",
  "concepts": ["if-statements", "numbers"],
  "prerequisites": ["basics"]
}
```

**Source [V]:** SkillTree "Learning Path" · https://skilltreeplatform.dev/dashboard/user-guide/learning-path.html
Same idea in a gamification platform: create "Skill A -> Skill B" and "Skill A will serve as a
prerequisite to Skill B and no points will be awarded toward Skill B until Skill A is fully
accomplished." Both ends of an edge can be a skill *or* a badge. The tool "will discover circular
learning paths at the time of from and to selection and prevent administrators from adding an
erroneous learning path route."

**Transferable idea:** the gate is on **concepts taught**, not on lessons finished. Content declares
what it teaches and what it assumes; availability is derived. Adding, reordering or deleting content
never requires touching unlock code. Cycle detection is a real requirement, not a nicety.

### A13. Level gating a whole subsystem

**Source [P]:** Habitica Wiki, "Class System" · https://habitica.fandom.com/wiki/Class_System (the
site returned HTTP 402 to the fetcher; the wording below is from the search excerpt of that page).
The class system unlocks at level 10; before then every player is a Warrior with class features
switched off, and the stated reason is "to avoid new users having too many features to have to learn
their way around."

**Transferable idea:** a whole subsystem, not just a button, can be the unit of gating. And the
public rationale is worth copying: the gate exists to protect attention, not to create scarcity.

### A14. One path, one next step

**Source [V]:** "The new Duolingo home screen", Duolingo blog ·
https://blog.duolingo.com/new-duolingo-home-screen-design/ — the stated problem: "We often hear from
learners that they're not sure whether they're using Duolingo the 'correct' or 'best' way." The
stated fix: a design that "gives you a clear path to follow — so you can be confident that each step
you take in Duolingo is truly the best step for reaching your language goals." Practically: the
branching tree became one linear path, lessons were grouped into smaller units, and things that used
to live in separate tabs (stories, practice) were pulled **into** the path.

Worth noting honestly: this change drew significant public backlash and Duolingo kept it anyway
(https://duoplanet.com/duolingo-new-learning-path-review/ [U]).

**Transferable idea:** deleting choice from the home screen is a legitimate, shippable answer to
"too many features". Absorbing side-tabs into the main path is the specific move.

### A15. Activation moments: setup → aha → habit

**Source [U]:** Reforge guides, URLs returned by search but not fetched (likely gated):
https://www.reforge.com/guides/define-your-setup-moment ·
https://www.reforge.com/guides/define-your-aha-moment ·
https://www.reforge.com/guides/define-your-habit-moment
The three-moment sequence (setup, aha, habit) is Reforge's framing. Treat as a lead until read.

**Source [V]:** Richard Price, "Growth hacking: leading indicators of engaged users", 30 October 2012 ·
https://richardprice.io/post/34652740246/growth-hacking-leading-indicators-of-engaged — the original
public list of activation "magic numbers": Facebook, "the user reaching 7 friends within 10 days of
signing up"; Dropbox, "when they put at least one file in one Dropbox folder on one device"; Zynga,
day-1 return; Twitter and LinkedIn, connection counts within a window. The operational point: "The
growth team would then focus on optimizing for that metric."

**Source [V], the counterweight:** Mixpanel, "Magic numbers are an illusion" ·
https://mixpanel.com/blog/magic-numbers-are-an-illusion/ — "If you're looking for just one thing to
indicate whether a user will be retained, you'll be hard pressed to find it." Facebook's number could
as easily have been ten friends in twelve days. The recommendation is to identify roughly when users
first experience value and turn it into a memorable story that aligns the team, rather than hunting a
precise threshold.

**Transferable idea:** pick one crude, honest first-value event, and make the entire first session
exist to produce it. Do not agonise over the exact number.

### A16. Endowed progress and the goal gradient (why checklists work)

**Source [V, bibliographic]:** Joseph C. Nunes and Xavier Drèze, "The Endowed Progress Effect: How
Artificial Advancement Increases Effort", Journal of Consumer Research 32(4), 2006, 504–512 ·
https://www.researchgate.net/publication/23547282_The_Endowed_Progress_Effect_How_Artificial_Advancement_Increases_Effort
The car-wash card study: an 8-stamp card starting at zero versus a 10-stamp card starting with 2
stamps already given. Identical work required. Completion rose from 19% to 34%. (Figures from the
search summary of the paper; I did not read the full text — **[U]** on the exact percentages.)

**Source [V, bibliographic]:** Ran Kivetz, Oleg Urminsky, Yuhuang Zheng, "The Goal-Gradient Hypothesis
Resurrected: Purchase Acceleration, Illusionary Goal Progress, and Customer Retention", Journal of
Marketing Research 43(1), 2006, 39–58 · https://journals.sagepub.com/doi/abs/10.1509/jmkr.43.1.39 ·
author PDF at https://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf
Coffee-card customers bought more frequently as they neared the free drink; effort dropped right
after a reward and re-accelerated toward the next one.

**Transferable idea:** a getting-started checklist should open with one item already ticked (the
signup itself counts), and rewards should be spaced so a new goal appears immediately after one is
banked.

### A17. Throttling how much new material appears per day

**Source [V]:** Anki manual, deck options · https://docs.ankiweb.net/deck-options.html — "This option
controls how many new cards can be introduced each day you open the program", plus the reasoning:
"Studying new cards will temporarily increase the number of reviews you need to do a day, as
newly-learned material needs to be repeated a number of times before the delay between repetitions
can increase appreciably." The manual notes 20 new cards a day typically settles at roughly 200
reviews a day, and advises lowering the new-card intake when reviews become overwhelming. A separate
"Maximum reviews/day" cap smooths spikes.

**Transferable idea:** introduce at most N *new things* per session, where "new thing" includes new
features, not just new content. It is a single number in a store, and it is the cheapest possible
throttle on the whole teaching system.

### A18. Spaced repetition as continuous re-teaching

**Source [V]:** FSRS · https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler
(697 stars) and the TypeScript port `ts-fsrs` · https://github.com/open-spaced-repetition/ts-fsrs
(732 stars, MIT).

**Transferable idea:** teaching is not a one-time event with a "seen" boolean. A thing taught has a
decaying memory state, and the app can legitimately re-surface it. That applies to features as well
as vocabulary.

### A19. The journey as a statechart

**Source [V]:** Stately docs · https://stately.ai/docs/state-machines-and-statecharts — "State
machines help us model how a process goes from state to state when an event occurs"; statecharts add
hierarchy (compound states), concurrency (parallel states) and actor communication.

**Transferable idea:** a learner is in several **parallel** states at once, and that is exactly what
statecharts are for. "Curriculum position" and "feature-familiarity" and "session state" are
concurrent regions, not one enum. Modelling them as one enum is the mistake that produces
untestable onboarding bugs.

### A20. Feature gating as infrastructure

**Source [V]:** GrowthBook · https://github.com/growthbook/growthbook (8,080) · Flagsmith ·
https://github.com/Flagsmith/flagsmith (6,481) · GO Feature Flag ·
https://github.com/thomaspoignant/go-feature-flag (2,072).

These are all server-backed and wrong for a no-backend PWA, but the architectural idea is right and
free: every visibility decision goes through one `isEnabled(featureKey, userContext)` function
instead of being scattered as `{user.level > 3 && ...}` across components.

**Transferable idea:** one gate function, one place, evaluated against a user-state object.

---

## Part B · Verified repositories

Star counts read from `api.github.com` on 2026-08-01.

### B1. Best structural fits for a React + Zustand + Vite PWA, no backend

| Repo | Stars | Licence | What it demonstrates |
|---|---|---|---|
| https://github.com/Somafet/onboardjs | 74 | MIT | Headless onboarding engine (`@onboardjs/core`) plus React bindings (`@onboardjs/react`). Steps are declarative data with `id`, `component`, `nextStep`; `useOnboarding()` exposes `state.currentStep`, `isCompleted`, `canGoNext`, `canGoPrevious`, `next()`, `previous()`, `updateContext()`. Ships a `localStoragePersistence` option and pluggable persistence handlers. **No backend required.** |
| https://github.com/statelyai/xstate | 29,949 | MIT | Statecharts: hierarchy, parallel regions, guards, actors. |
| https://github.com/pmndrs/zustand | 58,510 | MIT | The store. Its `persist` middleware is the whole storage layer for a no-backend progression model. |
| https://github.com/open-spaced-repetition/ts-fsrs | 732 | MIT | Scheduling algorithm in TypeScript, ESM/CJS/UMD, runs entirely client-side. |

**The one idea:** OnboardJS proves the separation you want, a headless engine holding the progression
state and a dumb renderer. You can copy the shape (steps as data, one hook, pluggable persistence)
into a Zustand store in an afternoon without taking the dependency.

### B2. Readable progression logic in learning apps

| Repo | Stars | What it demonstrates |
|---|---|---|
| https://github.com/sanidhyy/duolingo-clone | 611 | Courses → units → lessons → challenges, plus `userProgress` (`activeCourseId`, `hearts`, `points`) and `challengeProgress.completed`. In `db/queries.ts`, `getUnits` marks a lesson complete when `lesson.challenges.every(...)` has completed progress, and `getCourseProgress` finds the **first uncompleted lesson** across the flattened unit list to decide where the user resumes. |
| https://github.com/exercism/website | 543 | The concept-graph unlocking model (see A12). The readable part is the docs and track `config.json`, not the Rails app. |
| https://github.com/exercism/docs | (docs repo) | `building/tracks/config-json.md` is the spec for `concepts` / `prerequisites` / `status`. |
| https://github.com/NationalSecurityAgency/skills-service | 619 | SkillTree: micro-learning gamification with subjects, skills, levels, badges, self-reporting, and a prerequisite **Learning Path** with cycle detection. Groovy/Vue, so read the docs rather than the code. |
| https://github.com/HabitRPG/habitica | 14,026 | Whole-subsystem level gating (classes at level 10). |
| https://github.com/ankitects/anki | 29,435 | Daily new-card throttling and scheduler state per item. |
| https://github.com/oppia/oppia | 6,748 | Topics / stories / skills with mastery. Python + Angular. **[U]** — I verified the repo, not its progression code. |
| https://github.com/learningequality/kolibri | 1,089 | Offline-first learning platform with mastery models. **[U]** as above. |
| https://github.com/freeCodeCamp/freeCodeCamp | 453,285 | Superblock → block → challenge curriculum with completion state. Huge; useful only as a shape reference. |
| https://github.com/st3v3nmw/obsidian-spaced-repetition | 2,494 | TypeScript, client-only spaced repetition over notes. |
| https://github.com/nuclear-unicorn/kittensgame | 93 | Incremental game whose entire design is progressive feature unlocking: the UI grows tab by tab as prerequisites are met. Low stars, but the purest example of "the app reveals itself over hours of play". |
| https://github.com/ActiDoo/gamification-engine | 471 | Rule-based achievements/goals engine (Python). Useful as a vocabulary for achievement rules. |

**The one idea from this block:** Duolingo-clone's `getCourseProgress` is the cheapest possible
"what next" resolver, scan the ordered content, return the first incomplete item. You almost never
need more than that plus a prerequisite check.

### B3. Product-tour and checklist platforms

| Repo | Stars | Notes |
|---|---|---|
| https://github.com/usertour/usertour | 2,131 | Open-source onboarding platform: tours, **checklists**, surveys, with flow targeting rules. TypeScript, but NestJS + database, so it is a reference for the *flow model*, not a dependency for a no-backend PWA. |
| https://github.com/FrigadeHQ/javascript | 74 | Frigade Engage: React product tours, getting-started checklists, banners. |
| https://github.com/nilbuild/driver.js | 26,502 | (Formerly `kamranahmedse/driver.js`; that URL now redirects.) Dependency-free highlight/focus driver with multi-step tours. |
| https://github.com/usablica/intro.js | 23,478 | Long-standing tour library. Licence is non-standard, check before use. |
| https://github.com/shipshapecode/shepherd | 13,772 | Tour library, framework-agnostic. |
| https://github.com/gilbarbara/react-joyride | 7,825 | MIT. React tours with a controlled `stepIndex`, which is the one thing that lets you drive a tour from your own state machine rather than its internal one. |
| https://github.com/elrumordelaluz/reactour | 4,088 | MIT. |
| https://github.com/uixmat/onborda | 1,396 | Next.js + Framer Motion tour. No licence declared, which matters. |

**The one idea:** of this whole group, only `react-joyride`'s controlled `stepIndex` and Usertour's
checklist model add anything to a progression system. The rest are presentation. Do not let a tour
library own the question of *what the user has learned*.

### B4. Feature gating

https://github.com/growthbook/growthbook (8,080) · https://github.com/Flagsmith/flagsmith (6,481) ·
https://github.com/thomaspoignant/go-feature-flag (2,072). All server-backed. Take the interface
shape, not the dependency.

### B5. Searched and found nothing worth keeping

- "awesome-onboarding" / "awesome user onboarding" — no maintained list of substance exists. The
  top results were single-digit-star personal repos.
- "skill tree progression" as a GitHub query — dominated by game mods and personal projects, all
  under 5 stars.
- "gamification engine" in JS — nothing maintained above 500 stars except the Python `gengine`.
- XState + onboarding as a query — one 0-star Spanish demo
  (https://github.com/abibflores/state-machine-onboarding). The XState docs are the resource, not
  any example repo.
- In-app changelog / announcement widgets — nothing credible open source found.

---

## Part C · Design-system references

| System | Page | Verified | What it encodes |
|---|---|---|---|
| Apple HIG | https://developer.apple.com/design/human-interface-guidelines/onboarding | **[P]** page live, body did not render | Onboarding should be "fast, fun, and optional"; ideally people understand the app by using it; teach through interactivity rather than instruction screens; **consider a collection of context-specific tips instead of a single onboarding flow**; onboarding occurs *after* launch, it is not part of the launch experience. |
| Material Design 1 | https://m1.material.io/growth-communications/feature-discovery.html | **[V]** | Feature discovery prompts, one per session maximum, never at launch, back off after dismissal. See A9. |
| Shopify Polaris | https://polaris-react.shopify.com/components/layout-and-structure/empty-state | **[V]** | Empty state as the teaching surface; one primary CTA; encouraging tone; explain activation steps. See A10. Note `polaris.shopify.com` now 301s to `polaris-react.shopify.com`. |
| IBM Carbon | https://v10.carbondesignsystem.com/patterns/empty-states-pattern/ (current: https://carbondesignsystem.com/patterns/empty-states-pattern/) | **[V]** on v10 | Three empty-state families; three escalations beyond basic (in-line docs, contextual onboarding, starter content); calibrate depth to whether the resource is primary or secondary. See A10/A11. |
| Atlassian | https://atlassian.design/patterns/spotlight/ · https://atlassian.design/components/onboarding/ | **[P]** for guidance, **[V]** that the older Onboarding component is deprecated in favour of `@atlaskit/spotlight` | One spotlight on screen at a time; three-line messages; always dismissible; "change-boarding" as a named sibling of onboarding. See A8. |
| NN/g | see Part A | **[V]** | Progressive disclosure (2006, 2022 video), mobile-app onboarding components (2020), the tutorial study (2020), coach marks (2014). |

---

## Part D · What this actually implies for a small React learning app

Ranked by how much each would change the structure of the code, not by how interesting it is.

1. **Model teaching as a prerequisite graph over concepts, not a step list over screens.** Content
   declares `teaches: []` and `requires: []`; a selector derives what is available. Exercism's
   `config.json` is the whole spec (A12).
2. **Design layer 1 as a finished product.** Shneiderman's multi-layer framing (A3) means the answer
   to "many features" is two or three complete apps sharing a codebase, with a rule for promotion,
   not one app with a tour bolted on.
3. **Lock visibly, do not hide.** Training wheels (A4) beat hiding, because the locked item advertises
   the depth without exposing the beginner to it.
4. **Put a hint budget in the store, not in components.** One-per-session (Material, A9), one
   spotlight at a time (Atlassian, A8), one interaction per coach mark (NN/g, A7), and a cap on new
   things per session (Anki, A17). All four are the same integer.
5. **Write the first-use empty state for every screen before writing any tour.** It is free attention
   and Polaris and Carbon both treat it as the primary teaching surface (A10).
6. **One `isVisible(featureKey, userState)` function.** Everything else calls it (A20).
7. **Concurrent regions, not one enum.** Curriculum position, feature familiarity and session state
   are parallel (A19). If they collapse into one `onboardingStep` number, the bugs start.
8. **Start the checklist at one-of-N ticked, and space the rewards.** Endowed progress and goal
   gradient (A16).
9. **Pick one crude first-value event and build the first session around it** (A15), while ignoring
   the temptation to find the precise magic number (Mixpanel's caution).
10. **Do not build a front-loaded tour.** NN/g measured it: no success gain, no speed gain, and users
    rated the app harder to use afterwards (A6).
