# User journey stages: the engineering shape, and the smallest honest version for this stack

Research date: 2026-08-01. Target stack: React 18 + Vite + Tailwind + Zustand, PWA, no backend, all state in localStorage, RTL Arabic UI.

Every version number, bundle size, commit date and licence in this document was fetched or measured during this session. Bundle sizes are my own measurements, not vendor claims: each library was installed at the exact version listed, bundled with `esbuild --bundle --minify --format=esm --target=es2020` with `react` and `react-dom` marked external, then gzipped at level 9. Numbers from bundlephobia or a README were not used. Where I could not verify something, it says so explicitly.

---

## 0. The one finding that decides most of this

**None of the five candidate tour libraries has any persistence at all.** I grepped the published dist of react-joyride 3.2.0, shepherd.js 15.2.2, driver.js 1.8.0, intro.js 8.5.0 and @reactour/tour 3.8.0 for `localStorage`, `sessionStorage` and `indexedDB`. Zero hits in all five.

Every one of them is a stateless renderer of a step array inside a single session. "Which steps has this user already seen", "is this user ready for this feature yet", "should this run at all today" is code you write regardless of which library you pick. The library only draws the popover and positions it.

That reframes the whole question. The staging system is not a library decision. It is roughly 120 lines of your own code in the store you already have. The library decision is a separate, smaller, later question about whether you want a spotlight overlay at all.

---

## 1. Modelling a user's lifecycle as explicit stages in code

### 1.1 What real products actually do

I read production source from four shipping products. None of them uses a state machine library. All four use the same two primitives: an ordered `const` array of step definitions, and a persisted record of what is done.

**Ghost** (`apps/admin/src/onboarding/`) is the cleanest reference in the whole survey.

`constants.ts` is pure data, four entries, each with `id`, `title`, `description`, `icon`, optional `route`:

```ts
export const ONBOARDING_STEPS = [
    { id: "customize-design", route: "/settings/design/edit?ref=setup", ... },
    { id: "first-post",       route: "/editor/post", ... },
    { id: "build-audience",   route: "/members", ... },
    { id: "share-publication", route: undefined, ... },
] as const satisfies readonly OnboardingStepDefinitionShape[];
```

`hooks/use-onboarding.ts` then derives everything:

```ts
const completedStepSet = useMemo(() => new Set(completedSteps), [completedSteps]);
const nextStep = ONBOARDING_STEPS.find(step => !completedStepSet.has(step.id))?.id;
const allStepsCompleted = ONBOARDING_STEPS.every(step => completedStepSet.has(step.id));
```

Three things to take from Ghost:

1. The canonical next action is one line. Order in the array *is* the priority. There is no rules engine and no scoring.
2. There are two independent axes, not one. `completedSteps: string[]` tracks progress. `checklistState: "pending" | "started" | "dismissed" | "completed"` tracks the lifecycle of the checklist surface itself. Conflating those is a common mistake: a user who dismissed the checklist is not the same as a user who completed it, and you need to be able to tell them apart forever.
3. Ghost gates the entire new system behind a hardcoded date, not a version number:

```ts
const ONBOARDING_STARTED_AT_CUTOFF = new Date("2026-04-30T00:00:00.000Z");
```

Users whose `startedAt` predates the cutoff get the checklist auto-dismissed. That is the answer to "how do I ship a new journey system without ambushing every existing user", and it is four lines.

**Inngest** (`ui/apps/dashboard/src/components/Onboarding/useOnboardingStep.ts`) is the closest match to Sawiyya's constraints because it is localStorage-only with an explicit "we will store this in the backend in the future" comment. It contributes two ideas Ghost does not:

- **Backfill on out-of-order completion.** If a user completes step 4 without having done 2 and 3, it marks 2 and 3 complete automatically and tracks them with `completionSource: 'automatic'`. Without this, a user who jumps ahead is permanently stuck being told to do something they have moved past.
- **Cross-tab sync by hand.** It listens for the `storage` event *and* dispatches a custom same-window event, because `storage` does not fire in the tab that wrote it.

**daily.dev** (`packages/shared/src/hooks/useChecklist.ts`) adds a display detail worth stealing: it keeps `steps` in declaration order for computing `activeStep`, but exposes a *separately sorted* `sortedStepsByCompletion` array that floats completed items to the top. Progress order and render order are different concerns.

**Dub** (`apps/web/lib/onboarding/types.ts`) shows the other shape: a single stored cursor string advanced imperatively.

```ts
export const ONBOARDING_STEPS = [
  "workspace", "products", "domain", "domain/custom", "domain/subdomain",
  "domain/register", "program", "program/reward", "plan", "success", "completed",
] as const;
```

with `continueTo(step)` writing the cursor and pushing a route. This is the right shape for a linear wizard you cannot leave. It is the wrong shape for Sawiyya, because a cursor cannot express "this user has done photos and fingerspelling but never opened the camera drill". A set of completed milestones can.

**Helicone** (`web/services/hooks/useOrgOnboarding.ts`) is the only one of the five using Zustand + `persist` directly. Two practical details from it: it uses `skipHydration: true` and calls `store.persist.rehydrate()` in an effect, and it names the storage key per tenant (`` `onboarding-draft-storage-${orgId}` ``) with a module-level `Map` cache of stores.

### 1.2 XState for this

XState v5 is healthy: `xstate@5.32.5` published 2026-07-14, repo pushed 2026-07-31, 29,949 stars. `@xstate/react@6.1.0` published 2026-02-26. It is not a maintenance risk.

It is a fit risk and a size risk.

**Size.** I bundled `import { setup, createActor } from 'xstate'`: **12,654 bytes gzipped**. For comparison, `import { create } from 'zustand'` plus `import { persist } from 'zustand/middleware'` measures **1,322 bytes gzipped**. XState is roughly 10x the cost of the state library already in the app, to model something that is fundamentally an ordered list plus a set.

**Persistence.** This is the disqualifier, not the size. XState's own persistence documentation states three caveats, quoted from the page:

- "if the machine or actor logic changes, the restored state may be incompatible with the new logic"
- "actions that have already been executed will not be re-executed"
- state "must be JSON-serializable"

There is **no built-in versioning or migration mechanism**. For an app whose entire premise is "ship new features and reintroduce them to existing users", persisting a machine snapshot means every stage you add is a potential corrupt-restore for everyone already installed. Zustand's `persist` has `version` + `migrate` precisely for this. XState does not.

XState earns its keep when you have genuinely concurrent regions, guarded transitions with real branching, delayed transitions, and invoked actors. A learner progressing through "new, has practised, has practised across sessions" has none of those. It is a monotonic ordered enum.

The `examples/` directory in statelyai/xstate does contain `workflow-new-patient-onboarding`, so onboarding-as-machine is a real published pattern. It is a server-side workflow example, not a client progressive-disclosure example.

### 1.3 Feature flags for progressive rollout to a single user

Worth stating plainly: with no backend and one local user, "progressive rollout" has no meaning. There is no cohort to roll out to, no percentage bucketing that does anything, and no server to change the answer. What you actually want is a local capability map, which is an object literal.

For completeness, I verified the two client-side flag options that can run with no network:

- **GrowthBook** genuinely supports fully-local operation. Per their React docs, `clientKey` and `apiHost` are not mandatory; you can call `gb.init({ payload: { features: {...} } })` or `gb.initSync({ payload })` with no network at all. `@growthbook/growthbook-react@1.6.5` published 2026-02-18. I measured `GrowthBook + GrowthBookProvider + useFeatureIsOn` at **13,316 bytes gzipped**. That is 13 kB to evaluate a static object against a targeting engine with no targets.
- **OpenFeature** `@openfeature/web-sdk@1.10.0` published 2026-07-28 is alive and has in-memory provider support, but it is a vendor-abstraction spec. Abstracting over one hardcoded provider is pure overhead here.
- **Flagsmith** `flagsmith@10.0.0` published 2025-12-10 and **unleash-proxy-client** `3.8.2` published 2026-07-28 both require a server or proxy. Ruled out by the no-backend constraint.

Recommendation on this axis: a plain `Record<string, boolean>` derived from the journey state. Zero bytes.

---

## 2. Libraries that run staged experiences client-side

All data below verified 2026-08-01 against the npm registry and the GitHub API.

| Library | Latest | Published | Repo last commit | Licence | min+gzip (measured) | Built-in persistence | Multi-session sequencing | RTL | a11y |
|---|---|---|---|---|---|---|---|---|---|
| react-joyride | 3.2.0 | 2026-07-09 | 2026-07-09 | MIT | **27,318 B** | none | no | **none** | strongest: focus trap, `aria-modal`, `aria-live` |
| shepherd.js | 15.2.2 | 2026-03-11 | 2026-07-15 | **AGPL-3.0 + commercial** | **14,655 B** + 1,004 B CSS | none | no | positioning only | weak; 2 open a11y issues since 2024 |
| driver.js | 1.8.0 | 2026-07-17 | 2026-07-18 | MIT | **7,287 B** + 981 B CSS; hints +4,761 B | none | no | **none**, PR closed unmerged | Esc + arrow keys, aria-labelledby/describedby, no focus trap |
| intro.js | 8.5.0 | 2026-07-21 | 2026-07-21 | **AGPL-3.0 + commercial** | **18,350 B** + 1,717 B CSS | none | no | opt-in `introjs-rtl.min.css`, 187 B gz | `role`, `aria-label`, `aria-valuenow` progress |
| @reactour/tour | 3.8.0 | 2025-05-07 | 2026-05-19 | MIT | **9,516 B** | none | no | **`rtl` boolean prop** | minimal: `aria-label`, `aria-hidden` |
| @flows/react | 1.26.3 | 2026-07-22 | 2026-07-29 | MIT | not measured | server-side | yes, server-side | n/a | n/a |
| @frigade/react | 2.10.7 | 2026-07-30 | 2026-07-30 | **ELv2** | not measured | server-side | yes, server-side | n/a | n/a |
| nextstepjs | 2.3.0 | 2026-07-20 | 2026-07-20 | MIT | not measured | none | no | n/a | n/a |
| onborda | 1.2.5 | **2024-12-22** | 2026-06-08 | MIT | not measured | none | no | n/a | n/a |

### Per-library notes

**driver.js 1.8.0, MIT, 7.3 kB gzip.** The most interesting entry, and the one where training data is most likely wrong on three counts.

1. **The repo moved.** `github.com/kamranahmedse/driver.js` now 301-redirects; the canonical repo is `github.com/nilbuild/driver.js` (26,502 stars). The npm `repository.url` field already points at the new org.
2. **It was effectively dead and came back.** Commit histogram over the last 100 commits: 1 commit in 2025-01, then 51 in 2026-06 and 48 in 2026-07. It was dormant for roughly seventeen months and has been under very active new ownership for about six weeks.
3. **1.8.0 shipped "hints"**, which is the single most relevant feature in this entire survey for Sawiyya's actual problem. From the release notes: "Hints: pulsing beacons that open a popover on click; overlay optional, the page stays interactive. `driver.js/hints`, ~5KB gzip." My independent measurement of `hints.mjs` is 4,761 B gzipped, which matches their claim. A non-blocking beacon that says "this is new, tap to find out" is exactly the right shape for reintroducing a feature to an existing user, and it is the opposite of a blocking tour.

The catch is RTL. driver.js has **zero** RTL handling. I grepped the dist for `rtl`, `dir=` and `direction`: no hits. `driver.css` uses physical `top:0; right:0` for the popover and close button, `text-align:right` on the footer, and `margin-left:4px` between navigation buttons. In an Arabic RTL layout the close button and footer land on the wrong side. Community PR #569 "support rtl direction" was **closed unmerged on 2026-06-25**. The mitigating factor is that the CSS is small, flat, and fully overridable with CSS custom properties, so an RTL override is realistically 15 to 20 lines you own. There is also no focus trap, so a screen reader user can Tab straight out of the popover into the dimmed page behind it. That is yours to add too.

**react-joyride 3.2.0, MIT, 27.3 kB gzip.** Best accessibility in the survey by a distance, verified in source: `src/components/Step.tsx` calls `useFocusTrap(step.disableFocusTrap ? null : tooltipElement, '[data-action=primary]')`, `src/components/Tooltip/index.tsx` sets `'aria-modal': true`, `DefaultTooltip.tsx` sets `aria-live`. It also uses `@floating-ui/react-dom` `Placement`, so `-start` / `-end` placements are direction-aware for free.

Two problems. First, **zero RTL in the component layer**: I grepped for `"rtl"`, `dir:` and `dir=` across the dist and got 0 hits, and the default tooltip's inline styles use physical `left`/`right`/`marginLeft`/`marginRight`. Second, it is the heaviest option at 27.3 kB, nearly 4x driver.js, and it pulls ten runtime dependencies.

**Stale-training-data flag on this one.** v3.0.0 shipped 2026-03-23 and is described by its own release notes as "a complete rewrite". The breaking changes include: named export only (`import { Joyride } from 'react-joyride'`, the default export is gone and I confirmed this by watching esbuild fail on `import Joyride from 'react-joyride'`), `callback` replaced by `onEvent`, `getHelpers` replaced by a `useJoyride()` hook, `run` now defaults to `false`, `styles.options` moved to an `options` prop, `disableBeacon` renamed to `skipBeacon`, `disableCloseOnEsc` renamed to `dismissKeyAction`, `floaterProps` renamed to `floatingOptions`. Any snippet recalled from memory is almost certainly v2 and will not compile.

**shepherd.js 15.2.2 and intro.js 8.5.0: both are AGPL-3.0 plus paid commercial licence.** This is the hard stop for a closed-source commercial product and it eliminates two of the six on legal grounds before any technical comparison.

intro.js `LICENSE.md`: "We added commercial license to be able to provide better support, features and versions. If you are using Intro.js for a commercial project, you would need to get a commercial license at introjs.com."

shepherd.js `LICENSE`: "Shepherd.js is dual-licensed under AGPL-3.0 (for open source and non-commercial use) and a Commercial License (for commercial use)." Free AGPL use is restricted to open-source, personal, educational and evaluation use.

**Stale-training-data flag.** Shepherd was MIT for most of its life. I traced the licence field across every published version on npm: it was `MIT` from `2.0.0-beta.1` (2018-07-02) and flipped to `AGPL-3.0` at **`14.0.1`, published 2024-10-10**. The corresponding repo commit is "Update license to AGPL-3.0 (#2976)", 2024-09-18. Any recollection that "Shepherd is MIT" is out of date. Note also that `react-shepherd@7.0.4` lives in the same repo and inherits the same licence.

Separately, Shepherd's own RTL hits are all from the bundled `@floating-ui/dom` (`isRTL: function(t){return "rtl"===St(t).direction}`), which is positioning only. Shepherd's own CSS and markup have no RTL handling. It also has two accessibility issues open since 2024 ("Accessibility issue with focus", 2024-12-01).

**@reactour/tour 3.8.0, MIT, 9.5 kB gzip.** The only library in the survey with a first-class, typed RTL prop. `dist/index.d.ts` declares `rtl?: boolean` in three places, and the implementation sets `dir: rtl ? "rtl" : "ltr"` on the controls container. Be honest about the scope: that flips the previous/next button row and nothing else. The popover positioning and content direction remain yours.

Its accessibility is thin: `aria-label`, `aria-hidden`, two `role` attributes, no focus trap, no `aria-modal`.

Maintenance is a mixed signal worth flagging rather than smoothing over. The npm release `3.8.0` is from **2025-05-07**, roughly fifteen months old. But the repo is alive: last commit 2026-05-19, and **26 commits landed since the last publish**, including a large test-coverage push and a real bug fix (`fix(tour): scope disableActions to its declaring step`). So: actively maintained repo, stale npm release. If you adopt it you are adopting a version that is known to be behind the fixed code.

**@flows/react 1.26.3 and @frigade/react 2.10.7: both require a hosted backend.** Ruled out by the no-backend constraint, verified in their own type definitions rather than inferred.

Flows' `FlowsProviderProps` requires `organizationId: string` and `environment: string`, documented as "Find this in Settings > Environments", with `apiUrl` only overridable. Its whole model, `fetchWorkflows`, `WorkflowUserState`, `resetWorkflowProgress`, lives server-side. That is genuinely the only product in the survey that solves multi-session sequencing out of the box, and the reason is that it has a server to remember things in. Note also `RBND-studio/flows-sdk` has 38 stars, so it is a small-vendor dependency.

Frigade requires `apiKey: string` and defaults to `https://api.frigade.com/v1/public`. Its licence is **ELv2** (Elastic License v2), which is source-available, not OSI open source.

**nextstepjs 2.3.0 and onborda 1.2.5: ruled out on peer dependency weight.** Both require `motion` (formerly framer-motion) as a peer. I measured `import { motion, AnimatePresence } from 'motion/react'` at **42,616 bytes gzipped** against `motion@12.43.0`. Unless motion is already in the Sawiyya bundle, either library costs more in its peer dependency than every other option costs in total. onborda additionally has not published to npm since **2024-12-22**, about nineteen months, despite repo commits in 2026-06.

Also checked and confirmed abandoned: `walktour` (last publish 2022-12-03), `reactour` v1 (`1.19.4`, 2024-05-31, superseded by `@reactour/tour`), `vue-tour` (2021, wrong framework anyway).

### The RTL and accessibility conclusion

Ranked on the two axes that were stated as mattering most:

- **RTL:** @reactour/tour (real prop, narrow scope) > intro.js (opt-in stylesheet, but AGPL) > everything else (nothing).
- **Accessibility:** react-joyride (focus trap + `aria-modal` + `aria-live`) > intro.js (roles + progress semantics, AGPL) > driver.js (keyboard nav, no focus trap) > @reactour/tour ≈ shepherd.js (thin).

**No library is good at both.** The one with real RTL has the weakest accessibility; the one with real accessibility has no RTL at all. Whichever you pick, you will be writing custom tooltip components and custom RTL CSS. Once that is true, the library is only selling you positioning and an overlay.

Which is worth pricing directly: `@floating-ui/react-dom@2.1.9` measures **7,097 bytes gzipped** for `useFloating + offset + flip + shift + arrow`, and it handles RTL correctly for `-start`/`-end` placements natively. That is the same 7 kB as driver.js, for the only part of a tour library you cannot easily write yourself, with better RTL behaviour than any of the tour libraries.

---

## 3. One canonical next action

### 3.1 What the pattern actually is

Across all four production implementations I read, the same shape recurs, and it is not a rules engine:

**An ordered array of candidates, plus `.find()` with a predicate. First match wins. Array order is the priority.**

Ghost:
```ts
const nextStep = ONBOARDING_STEPS.find(step => !completedStepSet.has(step.id))?.id;
```

daily.dev:
```ts
const activeStep = useMemo(
  () => steps.find((item) => !item.action.completedAt)?.action.type,
  [steps],
);
```

Inngest uses a numeric cursor instead, `steps.find(s => s.stepNumber === lastCompletedStep.stepNumber + 1)`, which is the same idea with a different index.

### 3.2 How it stops being a rules engine

The failure mode is real and predictable: you start with `.find(notDone)`, then someone asks for "unless they are offline", then "unless they dismissed it today", then "unless it is their first session", and within a quarter you have a scoring function nobody can reason about and nobody can test.

Four constraints keep it from getting there, all of them visible in the code above:

1. **Priority is the array, not a number.** No `weight: 0.7` fields. To change priority you move a line. Diffs are readable and there is exactly one place to look.
2. **Each candidate owns one pure predicate over one state object.** `when(state) => boolean`, no I/O, no time-of-day branching inside the predicate, no reaching into React context. Every predicate is a unit test that is three lines long.
3. **Eligibility and ordering stay separate.** A candidate's `when` decides whether it is *allowed*; its position decides whether it *wins*. Merging those into a score is the exact move that produces the mess.
4. **Exactly one result.** `find`, never `filter`. The moment the function can return two things, the caller has to arbitrate, and the arbitration logic is where the rules engine grows back.

The escape hatch, when a genuine exception appears, is a "suppressed" set consulted once at the top of the function, not a new clause inside a predicate:

```ts
const nextAction = ACTIONS.find(a => !suppressed.has(a.id) && a.when(state));
```

That keeps the number of places a decision can be made at two, forever.

### 3.3 The thing to also copy from Inngest

Backfilling. `updateCompletedSteps` marks every lower-numbered incomplete step as done when a higher one completes, tagged `completionSource: 'automatic'`. Without it, a learner who discovers the camera drill before the word list is told forever to go and do the word list. With a `.find(first not done)` next-action, one skipped step blocks the pointer permanently. This is the single most likely bug in a naive implementation.

---

## 4. Checklists and activation lists

### 4.1 The evidence that they help

**Nunes, J. C., & Drèze, X. (2006). "The Endowed Progress Effect: How Artificial Advancement Increases Effort." *Journal of Consumer Research*, 32(4), 504–512. DOI: 10.1086/500480.** I verified title, authors, journal, volume, issue, pages and year against the Oxford Academic record; this is a primary source, not a blog restatement.

Field experiment at a car wash, 300 loyalty cards, two conditions. Group A needed ten stamps but the card arrived with two already stamped. Group B needed eight stamps and started empty. Identical real effort: eight washes either way. Reported redemption: **34% for Group A versus 19% for Group B.** The abstract's own framing: "By converting a task requiring eight steps into a task requiring 10 steps but with two steps already complete, the task is reframed as one that has been undertaken and incomplete rather than not yet begun."

The actionable rule that falls out of this is narrow and specific: **a checklist should never be shown at 0/n.** If you are going to show one, list something the user has already done and mark it complete. In Sawiyya that is nearly free, because installing the PWA, opening it, and viewing a first sign are all things that have already happened by the time any checklist could be rendered.

Also relevant, from Nielsen's progressive disclosure article: "Two-level designs work best; three-plus levels typically fail because users get lost navigating between levels." That is a direct cap on how many stages to build. Two, or at most three.

### 4.2 The evidence that they backfire

**Kendrick, A. (2020-03-08). "Mobile Tutorials: Wasted Effort or Efficiency Boost?" Nielsen Norman Group.** A between-subjects remote unmoderated quantitative usability test, 70 users (35 per group), 4 iPhone apps (Movesum, Brainsparker, LaunchCenter Pro, Sketch.Book). Group A viewed the tutorial, Group B skipped it.

| Measure | Saw tutorial | Skipped tutorial | Significance |
|---|---|---|---|
| Task success | 91% | 94% | p = 0.443, not significant |
| Perceived ease of use (SEQ, 1–7) | 4.92 | 5.49 | **p = 0.047, significant** |
| Task completion time (geometric mean) | 93.49 s | 85.17 s | p > 0.1, not significant |

Read that carefully, because it is stronger than "tutorials do not help". Tutorials produced **no** measurable benefit to success or speed, and made the app feel *significantly harder to use*. NN/g's own conclusion: "Tutorials take time and effort to design and develop, and those would be better spent on making the UI easy to use."

**Laubheimer, P. (2023-02-12). "Onboarding Tutorials vs. Contextual Help." Nielsen Norman Group.** Argues for replacing "push revelations" (things the app decides to show you) with "pull revelations" (help triggered by what the user is doing). Quoted: "Tutorials interrupt users, don't necessarily improve task performance, and are quickly forgotten." Three failure modes named: users want to start using the product immediately, out-of-context help is not recalled when needed, and dismissing pop-ups is itself a cost.

The underlying mechanism is **Carroll, J. M., & Rosson, M. B. (1987). "The paradox of the active user." In J. M. Carroll (Ed.), *Interfacing Thought: Cognitive Aspects of Human-Computer Interaction*, pp. 80–111. MIT Press.** (ACM DL: 10.5555/28446.28451.) Users will not read instructions first, even when reading them first would demonstrably be faster.

### 4.3 What I could not verify

Search snippets attributed "average onboarding checklist completion rate 19.2%, median 10.1%, from 188 companies" to a Userpilot benchmark article. **I fetched that page and those numbers are not on it.** The page contains no sample size, no date range, no methodology and no numeric benchmarks; it links to a separate gated report. **Do not use those figures.** I could not find a checklist completion benchmark from a source that is both non-vendor and methodologically stated. Every number in that space that I checked traces back to an onboarding-tools vendor with an obvious interest and no published methodology.

So the honest summary of the evidence: the *endowed progress* effect is real and well-sourced. The claim that *checklists* specifically drive activation is vendor marketing that I could not verify at source. The evidence that *front-loaded tutorials* hurt is real, experimental, and specific.

### 4.4 The synthesis

- A modal tour on first open is the pattern with the best evidence *against* it. Do not build it.
- A persistent, dismissible, already-partly-complete checklist sits in a defensible middle: it is pull rather than push, and it gets the endowed-progress benefit.
- Contextual, non-blocking hints attached to the feature itself, shown at the moment the feature becomes relevant, are what both NN/g articles actually recommend. This is what driver.js 1.8.0's new hints module does, and what a small custom component does equally well.

---

## 5. Storing "the user has now seen X" durably, and versioning it

### 5.1 The two mechanisms that get conflated

This is the most common design error in this area, so it is worth stating flatly:

- **Store schema version** is one integer for the whole persisted blob. It answers "the shape of what I saved has changed, how do I reshape it". Zustand's `version` + `migrate` is exactly this.
- **Per-feature revision** is one integer *per introduced thing*. It answers "this feature changed enough that a user who saw the old version should see it again".

They are different mechanisms with different lifetimes. Bumping the store `version` to reintroduce a feature is wrong: it triggers a migration for everyone and discards state if no `migrate` is supplied.

### 5.2 The store schema half, verified

From the Zustand `persist` reference (`docs/reference/middlewares/persist.md`, read from the repo):

- `name`: storage key.
- `storage`: defaults to `createJSONStorage(() => localStorage)`, evaluated lazily.
- `partialize`: filter fields before persisting.
- `version`: "A version number for the persisted state. **If the stored state version doesn't match, it won't be used.**"
- `migrate`: "A function to migrate persisted state if the version mismatch occurs."
- `merge`: custom merge on rehydration, defaults to a **shallow** merge.
- `skipHydration`: defer hydration, then call `rehydrate()` manually.

The documented migrate signature and example:
```ts
migrate: (persisted: any, version) => {
  if (version === 0) {
    persisted.position = { x: persisted.x, y: persisted.y }
    delete persisted.x
    delete persisted.y
  }
  return persisted
}
```

Two warnings from the docs that apply directly here:

1. `createJSONStorage` "does not perform any runtime validation. The value read from storage is cast directly to your state type without checking its shape, so corrupt, stale, or tampered data will not be caught at runtime."
2. The default `merge` is **shallow**. If journey state is a nested object, adding a new key to a nested slice will not appear for existing users, because the persisted nested object replaces the fresh one wholesale. Either keep journey state flat, or supply a `merge`.

I also verified by reading `node_modules/zustand/esm/middleware.mjs` that **`persist` contains zero `addEventListener` calls**. It does not sync across tabs or windows. It exposes `persist.rehydrate()`, `persist.hasHydrated()` and `persist.onFinishHydration()`. Cross-tab sync is about six lines you add yourself:

```ts
window.addEventListener('storage', (e) => {
  if (e.key === 'sawiyya-journey') useJourney.persist.rehydrate();
});
```

Inngest's implementation is the same idea plus a custom same-window event, because `storage` does not fire in the tab that performed the write.

### 5.3 The per-feature revision half, from real code

**Ente** (`web/apps/ensu/src/services/whats-new.ts`) uses a single monotonic integer against one storage key:

```ts
const storageKey = "ensu.whatsNew.seenVersion";
const seenVersion = readSeenVersion();
if (seenVersion >= whatsNewVersion) return undefined;
```

The important trick is in `readSeenVersion`: when the key is **absent**, it writes the current version and returns it, so a brand-new install is treated as having already seen everything. Without that, every new user gets the entire backlog of "new!" announcements on first open. Sawiyya needs this exact behaviour: a first-time learner must not be shown five feature-introduction badges at once.

It also wraps every `localStorage` access in `try/catch` with the comment "localStorage can be unavailable in constrained webviews", which matters for a PWA.

**Scalar** (`projects/scalar-app/src/features/whats-new/hooks/use-whats-new.ts`) stores a semver string rather than an integer and filters entries to those at or below the installed version, so a user on an older build is never told about a feature they do not have. Their source comment is the warning worth pinning to the wall:

> "Do NOT change this key without a migration - it would silently re-trigger the 'new updates' indicator for every existing user."

It also keeps the last-seen value in a module-scoped reactive ref so that marking-as-seen in one component immediately clears the indicator in another, rather than waiting for a reload. With Zustand that is free.

### 5.4 The durability problem nobody mentions, and it is serious here

**On iOS Safari, localStorage is deleted after seven days.**

From WebKit's own announcement, "Full Third-Party Cookie Blocking and More", John Wilander, 2020-03-24: ITP "deletes all of a website's script-writable storage after seven days of Safari use without user interaction on the site", and the affected storage is listed as "Indexed DB, LocalStorage, Media keys, SessionStorage, Service Worker registrations and cache."

For a no-backend PWA whose entire user model lives in localStorage, that means a learner who does not open Sawiyya for a week in a Safari tab loses every milestone, every stage, and every "seen" flag, and is silently demoted to a brand-new user.

The mitigation is in the same post, and it is the single strongest argument for pushing installation: "Web applications added to the home screen are not part of Safari and thus have their own counter of days of use." Wilander adds that if a home-screen web app's first-party storage is deleted, developers should "report it as a serious bug".

So: **home-screen installation is not a nice-to-have for this app, it is the storage durability strategy.** The install prompt should itself be an early journey milestone, and it should be phrased in terms the learner cares about ("keep your progress"), because it literally is.

Second, cheap mitigation: `navigator.storage.persist()`. I checked MDN's browser-compat data directly: supported in Chrome 55+, Firefox 57+, **Safari 15.2+**, with Safari iOS mirroring desktop. It is a two-line call with a promise result you can log.

**Explicitly unverified:** I could not find a source confirming whether `navigator.storage.persist()` exempts a site from the ITP seven-day rule specifically, as opposed to only protecting against eviction under storage pressure. These are described as separate mechanisms in the specs. Treat `persist()` as belt-and-braces, and treat home-screen installation as the actual answer.

### 5.5 The shape that follows

```ts
// One flat, persisted slice. Flat because zustand's default merge is shallow.
type JourneyState = {
  firstOpenAt: number;
  milestones: Record<string, number>;  // milestoneId -> completedAt
  seen: Record<string, number>;        // introKey -> highest rev seen
  dismissed: Record<string, number>;   // introKey -> dismissedAt
};
```

- `milestones` is what the learner has done. Append-only, never removed. Adding a milestone is additive and needs no migration.
- `seen` is the per-feature revision map. Ship a feature with `rev: 1`; change it meaningfully later and ship `rev: 2`, and only users whose `seen[key] < 2` see it again. Never bump the store `version` for this.
- `dismissed` is separate from `seen` for the Ghost reason: "saw it and moved on" and "actively told you to go away" are different facts and you will want to treat them differently.

And the crucial derived-not-stored rule: **do not persist the stage.** Store the milestones and compute the stage from them on every read. A stored stage is a second source of truth that drifts, needs migrating every time you add a stage, and can strand a user in a stage that no longer exists.

---

## 6. Recommendation

Ranked by effort. Everything in tiers 0 to 2 adds **zero dependencies**.

### Tier 0. The spine. About half a day. 0 bytes added.

Add one flat, persisted slice to the existing Zustand store (`milestones`, `seen`, `dismissed`, `firstOpenAt`), plus two `const` arrays and two `.find()` selectors.

```ts
// Stages are derived, never stored. Order is the ladder.
const STAGES = [
  { id: 'arrived',   reached: () => true },
  { id: 'practised', reached: (m) => !!m['first-sign-viewed'] },
  { id: 'returning', reached: (m) => !!m['second-session'] },
] as const;

const stage = [...STAGES].reverse().find(s => s.reached(milestones))!.id;

// One canonical next action. Array order is the priority. First match wins.
const nextAction = ACTIONS.find(a => a.when({ stage, milestones, seen }));
```

Then render exactly one next-action card on the home screen. Nothing else changes.

Why this first: it is the whole of the value. Once the app can answer "what stage is this learner in" and "what is the one thing to do next", every later decision has somewhere to hang. Nielsen's two-level finding caps this at three stages; do not add a fourth.

Do not skip Inngest's backfill rule. When a milestone completes, mark every earlier milestone in the ladder complete too. Without it one skipped step wedges the next-action pointer permanently, and it is the most likely bug in the whole design.

Trade-off: none worth naming. This replaces nothing and breaks nothing.

### Tier 1. Durability and reintroduction. About a day. 0 bytes added.

Four things, all small, all load-bearing:

1. **Per-feature `rev` registry.** An `INTROS` array of `{ key, rev, stage, when }`, and one selector `INTROS.find(i => stageOrder(i.stage) <= stageOrder(stage) && i.when(state) && (seen[i.key] ?? -1) < i.rev)`. This is the mechanism by which a feature shipped in September introduces itself to a learner who installed in August.
2. **Cold-start suppression, copied from Ente.** On a genuinely first run, write every current `rev` into `seen` except the ones belonging to the first stage. Otherwise the first-ever open shows five "new" badges at once and the whole system reads as noise on day one.
3. **Ghost's date cutoff.** Record `journeySystemVersion` and a `firstOpenAt`. Existing installs that predate the switch get the checklist surface auto-dismissed rather than ambushed.
4. **Storage durability.** Add `navigator.storage.persist()` at boot (Safari 15.2+, verified), add the six-line `storage`-event rehydrate for cross-tab, wrap every direct localStorage touch in `try/catch`, and make **installing to the home screen an early, explicitly-worded milestone**. Per WebKit's own post, a Safari tab loses all of this after seven days of non-use and a home-screen app does not. This is the difference between a journey system that works and one that silently resets committed learners.

Trade-off: cold-start suppression means a brand-new user never sees the historical introductions. That is the correct behaviour, but it does mean the `rev` registry only starts earning its keep from the next feature you ship.

### Tier 2. The checklist surface, but only in one specific form. Two to three days. 0 bytes added.

Only build this if all four conditions hold, because the evidence cuts both ways:

- It renders **already partly complete** (Nunes & Drèze: 34% vs 19%). Installing the PWA and viewing a first sign are already done by the time it could appear, so mark them.
- It is **dismissible and retrievable**, with `dismissed` tracked separately from `completed`.
- It is **pull, not push**: it lives on the home screen, it never blocks, it never appears as a modal on first open.
- It has **three or four items**, matching Ghost's four and Nielsen's two-level cap.

Render order should float completed items to the top (daily.dev's `sortedStepsByCompletion`) while the next-action pointer still uses declaration order.

Trade-off, stated plainly: this is the weakest-evidenced piece in the report. The endowed-progress research is solid, but the claim that checklists specifically drive activation traces entirely to onboarding-tool vendors, and I could not verify a single benchmark figure at source. Build it as a considered bet, not as a proven pattern, and instrument it so you can kill it.

### Tier 3. Only if you decide you genuinely need a spotlight overlay. One day plus 7.3 kB.

If, after tiers 0 to 2, there is still a specific feature that cannot be explained without dimming the page and pointing at something, use **driver.js 1.8.0**, and use its **hints** module rather than its tour mode. MIT, 7.3 kB gzip for the core plus 4.8 kB for hints, actively developed as of 2026-07-18.

Budget for three things it does not give you:

- **RTL.** There is none. Its CSS uses physical `right`, `text-align:right` and `margin-left`, and the community RTL PR was closed unmerged on 2026-06-25. Budget 15 to 20 lines of override CSS. The CSS is small, flat and custom-property-driven, so this is genuinely tractable.
- **A focus trap.** There is none. A screen reader user will Tab straight out of the popover into the dimmed page. You must add this.
- **Repo churn risk.** It moved from `kamranahmedse` to the `nilbuild` org and was dormant for about seventeen months before a burst of 99 commits in June and July 2026. Currently very healthy, but the ownership is six weeks old.

### What to reject, and why

- **XState.** 12.7 kB gzipped, ten times the cost of the Zustand already in the app, for something that is an ordered list plus a set. The disqualifier is not size: it is that XState persistence has no versioning or migration and its own docs warn that "if the machine or actor logic changes, the restored state may be incompatible with the new logic". For an app whose premise is shipping new stages over time, that is a recurring corrupt-restore risk that Zustand's `version` + `migrate` already solves.
- **GrowthBook or any flag SDK.** 13.3 kB gzipped to evaluate a static object. With no backend and one local user there is no cohort to roll out to. A `Record<string, boolean>` derived from journey state is the same feature at zero bytes.
- **shepherd.js and intro.js.** Both are AGPL-3.0 plus a paid commercial licence. Legal stop for a commercial closed-source product, independent of any technical merit. Note that Shepherd was MIT until version 14.0.1 (2024-10-10), so any memory of it being MIT is stale.
- **@flows/react and @frigade/react.** Both require a hosted backend (`organizationId` + `environment`; `apiKey` + `api.frigade.com`). Frigade is additionally ELv2, not open source. Flows is the only product surveyed that solves multi-session sequencing out of the box, and it does so by having a server.
- **nextstepjs and onborda.** Both peer-depend on `motion`, which I measured at 42.6 kB gzipped. More cost in the peer dependency than every other option in total. onborda has additionally not published to npm since 2024-12-22.
- **react-joyride.** Not a bad library, and the best accessibility of the group by a distance. But 27.3 kB, zero RTL, and it still would not persist anything. Reconsider only if a WCAG audit specifically demands a certified modal focus trap and the RTL work is being done by hand anyway.

### The one sentence version

The staging system is 120 lines of your own code in a store you already have: an ordered `const` array of milestones, a persisted set of what is done, a derived stage, a per-feature `rev` map for reintroduction, and `.find()` for the single next action. No library sells you any of that, because all five of them store nothing.

---

## 7. Stale-training-data flags

Five things where a pre-2026 recollection is now wrong:

1. **driver.js moved.** `kamranahmedse/driver.js` 301-redirects to `nilbuild/driver.js`. Also dormant from 2025-01 to 2026-06, now very active.
2. **Shepherd.js is not MIT.** It flipped to AGPL-3.0 at version 14.0.1, published 2024-10-10.
3. **react-joyride v3 is a rewrite.** Released 2026-03-23. The default export is gone (`import { Joyride }`), `callback` became `onEvent`, `getHelpers` became `useJoyride()`, `run` defaults to `false`, and roughly a dozen props were renamed. v2 snippets will not compile.
4. **driver.js has hints now.** Added in 1.8.0, 2026-07-17. Non-blocking pulsing beacons, a genuinely different pattern from its tour mode.
5. **@reactour/tour's npm release is fifteen months old** (3.8.0, 2025-05-07) despite an active repo with 26 unreleased commits. Both halves of that are true and neither alone is the whole picture.

## 8. Things I could not verify

- **Checklist completion benchmarks.** The widely-repeated "19.2% mean / 10.1% median across 188 companies" is not present on the Userpilot page it is attributed to; that page has no methodology and no numbers. I found no non-vendor source with a stated methodology. Do not cite these figures.
- **Whether `navigator.storage.persist()` exempts a site from ITP's seven-day script-writable storage deletion**, as distinct from protecting against storage-pressure eviction. The specs describe these as separate mechanisms. Home-screen installation is the documented exemption; `persist()` is unconfirmed for this purpose.
- **Bundle sizes for @flows/react, @frigade/react, nextstepjs and onborda.** Not measured, because all four are ruled out on other grounds (backend requirement, licence, or peer-dependency weight). The `motion` peer figure of 42.6 kB is measured; the libraries' own code is not.
- **@reactour/tour and shepherd.js accessibility beyond static analysis.** My a11y assessments come from grepping published source for ARIA attributes, focus-trap code and keyboard handlers, plus reading their issue trackers. No library was tested with an actual screen reader in this session.

## Sources

Primary research:
- [Nunes & Drèze (2006), *Journal of Consumer Research* 32(4), 504–512, DOI 10.1086/500480](https://academic.oup.com/jcr/article-abstract/32/4/504/1796024)
- [Kendrick, A. (2020). Mobile Tutorials: Wasted Effort or Efficiency Boost? NN/g](https://www.nngroup.com/articles/mobile-tutorials/)
- [Laubheimer, P. (2023). Onboarding Tutorials vs. Contextual Help. NN/g](https://www.nngroup.com/articles/onboarding-tutorials/)
- [Nielsen, J. (2006). Progressive Disclosure. NN/g](https://www.nngroup.com/articles/progressive-disclosure/)
- [Carroll & Rosson (1987). Paradox of the active user. ACM DL 10.5555/28446.28451](https://dl.acm.org/doi/10.5555/28446.28451)
- [Wilander, J. (2020). Full Third-Party Cookie Blocking and More. WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)

Production source read:
- [TryGhost/Ghost, apps/admin/src/onboarding/](https://github.com/TryGhost/Ghost/tree/main/apps/admin/src/onboarding)
- [inngest/inngest, ui/apps/dashboard/src/components/Onboarding/useOnboardingStep.ts](https://github.com/inngest/inngest/blob/main/ui/apps/dashboard/src/components/Onboarding/useOnboardingStep.ts)
- [dailydotdev/apps, packages/shared/src/hooks/useChecklist.ts](https://github.com/dailydotdev/apps/blob/main/packages/shared/src/hooks/useChecklist.ts)
- [dubinc/dub, apps/web/lib/onboarding/types.ts](https://github.com/dubinc/dub/blob/main/apps/web/lib/onboarding/types.ts)
- [Helicone/helicone, web/services/hooks/useOrgOnboarding.ts](https://github.com/Helicone/helicone/blob/main/web/services/hooks/useOrgOnboarding.ts)
- [ente-io/ente, web/apps/ensu/src/services/whats-new.ts](https://github.com/ente-io/ente/blob/main/web/apps/ensu/src/services/whats-new.ts)
- [scalar/scalar, projects/scalar-app/src/features/whats-new/hooks/use-whats-new.ts](https://github.com/scalar/scalar/blob/main/projects/scalar-app/src/features/whats-new/hooks/use-whats-new.ts)

Library and API references:
- [pmndrs/zustand persist reference](https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md)
- [XState persistence docs](https://stately.ai/docs/persistence)
- [nilbuild/driver.js](https://github.com/nilbuild/driver.js) · [1.8.0 release](https://github.com/nilbuild/driver.js/releases/tag/1.8.0) · [PR #569, closed unmerged](https://github.com/nilbuild/driver.js/pull/569)
- [gilbarbara/react-joyride v3.0.0 release notes](https://github.com/gilbarbara/react-joyride/releases/tag/v3.0.0)
- [shipshapecode/shepherd, licence change #2976](https://github.com/shipshapecode/shepherd/pull/2976)
- [elrumordelaluz/reactour](https://github.com/elrumordelaluz/reactour)
- [RBND-studio/flows-sdk](https://github.com/RBND-studio/flows-sdk) · [FrigadeHQ/javascript](https://github.com/FrigadeHQ/javascript)
- [GrowthBook React SDK docs](https://docs.growthbook.io/lib/react)
- [MDN StorageManager.persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) · [mdn/browser-compat-data api/StorageManager.json](https://github.com/mdn/browser-compat-data/blob/main/api/StorageManager.json)

Unverifiable claim, listed so it is not reused:
- [Userpilot onboarding checklist benchmarks](https://userpilot.com/blog/onboarding-checklist-completion-rate-benchmarks/): page contains no methodology and none of the numbers attributed to it.
