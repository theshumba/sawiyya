# 03 · Progression model — does Sawiyya know how mature the user is?

Audit date: 2026-08-01 · Branch audited: `main` · Scope: `src/store/`, `src/lesson/`, `src/screens/`, `src/content/`

---

## Verdict up front

**No. The app has no model of user maturity over time.**

It has exactly one set-once persisted boolean (`onboarded`), and that boolean's only job is to
choose between the Onboarding component and the whole app. After the first tap of "Continue" on the
name step, the app's surface area is permanently, maximally open and never changes again.

There is **no** session counter, **no** day counter, **no** days-since-install, **no** "first time
seeing X", **no** tooltip/coach-mark/dismissed-hint state, **no** activation checklist, **no**
feature unlock, **no** staged reveal, and **no** "locked until level N" anywhere in the codebase.

Everything that *looks* like progression — streak, XP, mastery, milestones, SRS, achievement badges,
trail-node locks — is either a **readout of numbers** or a **cosmetic state on a control that is
still fully operable**. The single genuine hard gate in the entire app is one `disabled` attribute
on one button (`src/screens/Home.tsx:740`), and the content behind it is reachable in two taps from
another tab.

---

## Part 1 — Every candidate state field, and what it actually changes

### 1.1 `onboarded: boolean` — the ONLY true set-once flag

| | |
|---|---|
| **Declared** | `src/store/app.ts:53` |
| **Initial** | `src/store/app.ts:330` (`onboarded: false`) |
| **Written by** | `completeOnboarding()` — `src/store/app.ts:401` (`set({ onboarded: true })`) |
| **Called from** | `src/screens/Onboarding.tsx:146`, inside `finish()` |
| **Persisted** | Yes — restored at `src/store/app.ts:271` (`onboarded: p.onboarded === true`) |
| **Read by** | `src/App.tsx:101`, gate at `src/App.tsx:128` |

```
// src/App.tsx:128
if (!onboarded || !profile) {
  return (<> {showRecovery && <RecoveryNotice … />} <Onboarding /> </>);
}
```

**What it changes in the UI:** exactly one thing — Onboarding vs. the routed app. It is never read
again anywhere else in the codebase (verified: only two `onboarded` references outside the store —
`App.tsx:101` and `App.tsx:128`). It is a boot switch, not a maturity model. There is also no way
to set it back to `false` except a full storage wipe.

### 1.2 `track: "alphabet" | "words" | null` — a one-shot destination, thrown away

| | |
|---|---|
| **Declared** | `src/screens/Onboarding.tsx:125` — `useState<Track>(null)` |
| **Written by** | `src/screens/Onboarding.tsx:357` (alphabet card), `:387` (words card) |
| **Persisted** | **No.** Component-local React state. Never enters the Zustand store, never touches localStorage. |
| **Read by** | `src/screens/Onboarding.tsx:150-156` only |

```
// src/screens/Onboarding.tsx:150
go(
  track === "alphabet"
    ? { name: "camera", targetSignId: "alpha-alif", autoStart: true }
    : track === "words"
      ? { name: "allSigns" }
      : { name: "firstSign" },
);
```

**What it changes:** which screen the user lands on for their first ~30 seconds. Nothing else. The
learner's chosen "track" is not stored, not honoured on Home, not honoured in the trail, and not
recoverable after the navigation completes. This is the closest thing the app has to personalisation
and it evaporates on the next route change.

### 1.3 `firstSign` screen — the only content that appears once, and only by accident

| | |
|---|---|
| **Route** | `{ name: "firstSign" }` — `src/store/ui.ts:24`, hash `#/first-sign` (`src/store/ui.ts:54, :99`) |
| **Rendered** | `src/App.tsx:161` |
| **Reached from** | `src/screens/Onboarding.tsx:155` only (the `track === null` branch) |

The 3-step Watch → Try → Celebrate arc (`src/screens/FirstSign.tsx:23`) is the app's one
"welcome moment". But it is **not gated** — it is simply never linked to again. Any user, on any
day, can type `#/first-sign` and replay it verbatim: `FirstSign` holds no "already seen" check, and
its "Day 1" badge (`src/screens/FirstSign.tsx:158-164`) is a **hard-coded string**, not derived from
`streak` or `activeDays`. A user on day 400 who hits that URL is told "Day 1".

### 1.4 `progress[profileId][signId].masteryLevel: 0 | 1 | 2 | 3`

| | |
|---|---|
| **Declared** | `src/types.ts` (`SignProgress`), store slice `src/store/app.ts:57` |
| **Written by** | `recordDrillResult` — `src/store/app.ts:433-443` |
| **Level-3 rule** | `src/store/app.ts:428-432` — FSRS state Review **AND** stability ≥ 2d **AND** ≥ 2 camera-confirmed hits |

**What it genuinely changes:**

1. **Home trail node status** — `src/screens/Home.tsx:117-125`. `complete` = every sign in the lesson
   at mastery ≥ 2 → `"done"`; else if it is the first incomplete lesson → `"current"`; else
   `"locked"`. See §4 for what "locked" actually does.
2. **Whether a `watch` drill is queued** — `src/lesson/engine.ts:58` and `:114`. A sign at mastery ≥ 2
   loses its teaching step inside a lesson. This is real behavioural adaptation, but it is
   *per-sign*, not per-user, and it only shortens a lesson.
3. **Alphabet checkpoint distractor pool** — `src/lesson/engine.ts:120-123`. Multiple-choice options
   are drawn only from letters at mastery ≥ 1, so a beginner is never asked to discriminate against
   a letter they have not met. Again per-sign.
4. **Milestone ladder position** — `src/lesson/milestones.ts:34-44` (counts at ≥ 3).
5. **Cosmetic only:** Dictionary letter-cell colour (`src/screens/AllSigns.tsx:355-364`), Words tile
   tick (`src/screens/Words.tsx:53-57, :216`), Practise-tab subtitle "n of 28"
   (`src/screens/PractiseChooser.tsx:53-55, :78-84`), camera chip star state
   (`src/screens/CameraPractice.tsx:57, :148`), Progress counters, Family mastery dots
   (`src/screens/Family.tsx:305-306`).

**Crucially:** mastery 2 is reachable by a single "mark yourself" tap. `recordDrillResult(id,
"hard", { selfMark: true })` → `src/store/app.ts:433-438` → `Math.max(prev, 2)`. That call is
exposed at `src/screens/Words.tsx:49` and `src/screens/AllSigns.tsx:159`, both of which are reachable
from the Practise and Dictionary tabs on second one.

### 1.5 `srs[profileId][signId]` (FSRS cards) — the only genuine time model, and it gates almost nothing

| | |
|---|---|
| **Declared** | `src/store/app.ts:59` |
| **Written by** | `recordDrillResult` (`src/store/app.ts:416-419`), `addToReview` (`src/store/app.ts:531-543`), flag seeding (`src/store/app.ts:617-623`) |
| **Scheduler** | `src/store/srs.ts:60-63` (`ts-fsrs`), due test `src/store/srs.ts:71-77` |
| **Selector** | `dueSignIds` — `src/store/app.ts:754-766` |

**What it changes in the UI:**

- **Home "Review due" card** appears only when `due.length > 0 && !reviewCapReached` —
  `src/screens/Home.tsx:506`. Past the cap it is replaced by an honest "done for today" card,
  `src/screens/Home.tsx:524`.
- **Practise tab review tile** — `src/screens/PractiseChooser.tsx:122`; banner at `:139`; capped note
  at `:162`.
- **Review session composition** — `src/lesson/engine.ts:139-164`.
- **Review drills injected into a normal lesson** — `src/lesson/engine.ts:84-88` (max 2).
- **Home "next new letter" starvation card** — `src/store/app.ts:743-746` (`nextNewLetterId`), shown
  at `src/screens/Home.tsx:537-560` only when nothing is flagged, nothing is due, and the daily goal
  is unmet.

This is the one place the app behaves differently on a later day than on the first: a day-1 user
with zero drills has no card in the store, so `dueSignIds` returns `[]` and the Review surfaces are
absent. **But this is a data-driven card, not a feature unlock.** The Practise tab still has its
Alphabet, Words and Fingerspell tiles; the Review tile is a fourth tile that appears when there is
review work. Nothing was withheld; there was simply nothing to review.

### 1.6 `REVIEW_DAILY_CAP = 30` / `reviewsToday`

| | |
|---|---|
| **Declared** | `src/store/app.ts:20-21` |
| **Written** | `src/store/app.ts:463` |
| **Read at time of use** | `reviewsTodayFor` — `src/store/app.ts:733-735` |

Gates the review-session size (`src/lesson/engine.ts:140-144`) and swaps the review CTA for a
"30 done today" note (`src/screens/Home.tsx:524`, `src/screens/PractiseChooser.tsx:162`,
`src/screens/LessonPlayer.tsx:74-93`). This is a **flood limiter**, not a maturity gate: it can only
ever fire for a user who has ≥ 30 due cards, and it removes work rather than revealing it.

### 1.7 `streak`, `bestStreak`, `celebratedStreak`, `activeDays`, `lastActiveDay`

| Field | Declared | Written | What it actually changes |
|---|---|---|---|
| `streak` | `src/types.ts:22` | `src/store/app.ts:449-454`; deaf-flag path `src/store/app.ts:636-638` | **Displayed only.** Home stat chip `src/screens/Home.tsx:184`, camera header pill `src/screens/CameraPractice.tsx:132`, Progress `src/screens/Progress.tsx:105`. Read-time derived so a lapse shows 0 (`src/store/app.ts:722-726`). Gates nothing. |
| `bestStreak` | `src/types.ts:27` | `src/store/app.ts:467` | Flips the 🔥 7-day achievement tile from dashed-grey to gold-bordered: `src/screens/Progress.tsx:649`, rendered `:683-694`. A tile that is always visible either way. |
| `celebratedStreak` | `src/types.ts:32` | `src/screens/Progress.tsx:151` | **The only "shown once" state in the app.** `src/screens/Progress.tsx:111-113`: `if (streak > celebratedStreak && streak > 1) setCelebrating(true)`. Fires a full-screen `StreakCelebration` overlay the first time Progress is opened after extending a streak past 1. Dismissing banks the value so it never repeats for the same streak. Impossible before day 2. |
| `activeDays` | `src/types.ts:34` | `src/store/app.ts:456-458`, `:639` (capped 90) | **Displayed only.** Progress week strip and 35-day heatmap: `src/screens/Progress.tsx:81, :97-102, :443`. Feeds `householdStreak` (`src/store/app.ts:802-816`) which is also display-only. |
| `lastActiveDay` | `src/types.ts:33` | `src/store/app.ts:468` | Internal bookkeeping for the lazy daily resets of `xpToday` / `reviewsToday` / `streak` (`src/store/app.ts:711-735`), plus `profilesActiveToday` (`:818-821`) which is a Family-screen count. |

`celebratedStreak` is the single field in the whole codebase that satisfies "set once and changes
what the UI shows later". Its effect is one congratulatory overlay. It does not unlock, reveal, or
change access to anything.

### 1.8 `xp` / `xpToday` / `dailyGoal`

| | |
|---|---|
| **Declared** | `src/types.ts:16-17, :35`; goal table `src/store/app.ts:25-29` |
| **Written** | `src/store/app.ts:460-462` (10 XP on a pass, 4 on a miss, 5 on a watch — never zero, never punitive) |
| **Read at time of use** | `xpTodayFor` — `src/store/app.ts:711-713` |

**What it changes:** the Home gold stat chip (`src/screens/Home.tsx:189`), the `GoalCard` fill and
label (`src/screens/Home.tsx:169-172, :590-596`), and which of two secondary Home cards renders —
the "next new letter" card requires `goalProgress < 1` (`src/screens/Home.tsx:539`), the "all caught
up" card requires `goalProgress >= 1` or no letters left (`src/screens/Home.tsx:566`). It also drives
the Family League ordering (`src/screens/Progress.tsx:730`). **XP unlocks nothing.** There is no
level, no tier, no XP threshold anywhere in the codebase.

### 1.9 Milestones (`src/lesson/milestones.ts`)

`nextMilestone(state, profileId, lang)` — `src/lesson/milestones.ts:32-84` — returns the first
unreached rung of a fixed 6- or 8-rung ladder (`:59-71`): 1 / 5 / 10 signs mastered, [5 / 10 signs the
whole family can do — only when a hearing member exists, `:50-57`], whole alphabet (28), whole word
unit (`A1_SIGNS.length`).

**What it changes:**
- The treasure-chest node's label and progress bar at the end of the Home trail
  (`src/screens/Home.tsx:127, :146-148, :399`).
- Where the chest's CTA routes: `family` → Family tab, `words` → Words screen, otherwise the next
  lesson or the camera (`src/screens/Home.tsx:161-167`).
- The Home milestone readout card (`src/screens/Home.tsx:603-619`) and, when the ladder is exhausted,
  an "Every milestone reached" card instead (`src/screens/Home.tsx:623-641`).

**It gates nothing.** Every destination the chest routes to is already a tab or a card the user can
reach directly. The milestone is a label on a shortcut.

### 1.10 Achievement badges (`src/screens/Progress.tsx:632-713`)

Six tiles, all six always rendered. `earned` (`:648-663`) only swaps a solid gold border for a dashed
grey one and greyscales the glyph (`:683-694`). Comment at `:678-679` confirms the intent: "No
container opacity on locked tiles". There is no reward, no unlock, no consequence.

### 1.11 Flags (`flags[]`)

`src/store/app.ts:60`; toggled at `:552-645`; archived at `:496-511`. Flags cause the Home flag
section to appear (`src/screens/Home.tsx:453`), an AppNav badge on the Family tab
(`src/components/AppNav.tsx:60-62, :143`), a dominant CTA in the Dictionary
(`src/screens/AllSigns.tsx:281-304`), and queue-jumping in `dueSignIds` (`src/store/app.ts:756-763`).

Flags are **user-authored content**, not maturity. A day-1 user can raise one in the first ten
seconds via the Dictionary flag button (`src/screens/AllSigns.tsx:800-819`) or the Flag Picker
(`#/flags`).

### 1.12 `metrics` — pure telemetry

`src/types.ts:127-136`, initialised `src/store/app.ts:108-117`, `appFirstOpenAt` stamped at
`src/store/app.ts:336`. **`appFirstOpenAt` is the app's only install timestamp, and no code computes
an elapsed duration from it except `markFirstSignTime` (`src/store/app.ts:545-550`), which measures
seconds-to-first-sign, not days-since-install.** A grep for elapsed-day arithmetic
(`86400`, `Date.now() -`, `getTime() -`) across `src/` returns four hits: the SRS due sort
(`src/store/app.ts:763`), the SRS "in n days" label (`src/screens/Progress.tsx:550`), the Progress
upcoming sort (`:136`), and `markFirstSignTime`. None of them models tenure.

Every metrics field is read in exactly two places, both of which are readouts:
`src/screens/Progress.tsx:587-595` (Stats tab) and `src/screens/DevMetrics.tsx:12-27` (a hidden
dev screen reached by tapping the Settings logo five times — `src/screens/Settings.tsx:159-165`).

### 1.13 Things that do NOT exist in the codebase

Each of the following was searched for by name, by common synonyms, and by behaviour:

- **Session count / launch count** — does not exist in the codebase.
- **Day count / days-since-install / tenure** — does not exist in the codebase.
- **"First time seeing X" / `hasSeen*` / `seenOnce`** — does not exist in the codebase.
- **Tooltips, coach-marks, spotlight tours, dismissible hints** — do not exist in the codebase. The
  word "hint" appears ~40 times but every occurrence is `Sign.hintEn` / `Sign.hintAr`, the static
  per-sign description of how a sign is performed (`src/types.ts:46-47`), or the Sign Coach's live
  corrective line (`src/recognizer/coach.ts:71`) which is computed per camera frame and stored
  nowhere.
- **Activation checklist / "getting started" / onboarding tasks** — does not exist in the codebase.
- **Feature flags, A/B buckets, remote config** — do not exist in the codebase.
- **Levels, tiers, ranks, XP thresholds** — do not exist in the codebase. (`Sign.tier` is a *content*
  label, `"alphabet"` or `"A1"`, not a user level.)
- **Any `disabled` attribute driven by progression, other than one** — the exhaustive list of
  `disabled` in the app is: `src/screens/LessonPlayer.tsx:573, :587, :632, :673, :753` (all
  "you already picked an answer" / "you haven't picked yet", within a single drill) and
  `src/screens/Home.tsx:740`. That last one is the subject of §4.
- **`aria-disabled`** — one occurrence, `src/screens/Onboarding.tsx:412`, the "Other Gulf dialects"
  card. It is a static note about unbuilt content, identical on every day, and there is no state
  that would ever enable it.

---

## Part 2 — The four questions, answered

### Q1. On day 1 versus day 30, is the app's surface area identical?

**Yes — identical, with three data-driven cards as the only difference, and no feature difference at
all.**

Proof by construction. `src/App.tsx:137-193` is the entire screen router. Every branch is a plain
`screen.name === "…"` test:

```
// src/App.tsx:149-189 (abridged — every line is structurally identical)
{screen.name === "home"            && <Home />}
{screen.name === "camera"          && <ErrorBoundary …><CameraPractice … /></ErrorBoundary>}
{screen.name === "firstSign"       && <ErrorBoundary …><FirstSign /></ErrorBoundary>}
{screen.name === "lesson"          && <ErrorBoundary …><LessonPlayer … /></ErrorBoundary>}
{screen.name === "family"          && <Family />}
{screen.name === "flagPicker"      && <FlagPicker />}
{screen.name === "progress"        && <Progress />}
{screen.name === "allSigns"        && <AllSigns … />}
{screen.name === "practiseChooser" && <PractiseChooser />}
{screen.name === "words"           && <Words />}
{screen.name === "fingerspell"     && <ErrorBoundary …><Fingerspell /></ErrorBoundary>}
{screen.name === "settings"        && <Settings />}
{screen.name === "aiTransparency"  && <AiTransparency />}
{screen.name === "privacy"         && <Privacy />}
{screen.name === "devMetrics"      && <DevMetrics />}
```

**Not one of these fifteen branches consults `progress`, `srs`, `xp`, `streak`, `activeDays`,
`metrics`, or any day/session counter.** The only condition upstream is `onboarded`
(`src/App.tsx:128`), which is `true` for both the day-1 and the day-30 user.

The router's input, `screen`, comes from `useUi` (`src/store/ui.ts:149-169`), whose `Screen` union
(`src/store/ui.ts:13-28`) is a closed set of 15 destinations and whose `hashToScreen`
(`src/store/ui.ts:66-111`) parses any of them from a URL with no state check whatsoever.

The complete list of what a day-30 user sees that a day-1 user does not:

1. The Home "Review due" card (`src/screens/Home.tsx:506`) / Practise review tile
   (`src/screens/PractiseChooser.tsx:122`) — appears as soon as the first SRS card falls due, which
   can be within minutes of the first drill, not days.
2. Non-zero numbers in the stat chips, heatmap, achievement borders and milestone bar.
3. The `StreakCelebration` overlay (`src/screens/Progress.tsx:263-272`), which requires `streak > 1`,
   i.e. day 2 at the earliest.

Everything else is byte-for-byte the same screen.

### Q2. Is every one of the four tabs and every practice mode available from the very first second after onboarding?

**Yes. All four tabs and all practice modes, unconditionally.**

Tabs are a module-level constant array, not a computed list:

```
// src/components/AppNav.tsx:26-40
const TABS: Tab[] = [
  { name: "home",            active: ["home"],                                            icon: "home",      label: (l) => t("navLearn", l) },
  { name: "practiseChooser", active: ["practiseChooser","camera","words","fingerspell"],  icon: "videocam",  label: (l) => t("navPractise", l) },
  { name: "allSigns",        active: ["allSigns"],                                         icon: "menu_book", label: (l) => t("navDictionary", l) },
  { name: "family",          active: ["family"],                                           icon: "favorite",  label: (l) => t("navFamily", l) },
];
```

Rendered with a bare `.map` and no filter, twice (mobile bar `src/components/AppNav.tsx:186`,
desktop rail `:202`). `tabButton` (`:136-176`) never receives a disabled prop and never sets one; its
`onClick` is an unconditional `go({ name: tab.name })` (`:149`). `AppNav` is mounted by every
`chrome="tabs"` screen via `ScreenShell` (`src/components/ScreenShell.tsx:11-12`, tabs branch at
`:75-80`). The profile menu holding Progress and Settings is likewise unconditional
(`src/components/AppNav.tsx:95-111`).

Practice modes, `src/screens/PractiseChooser.tsx`:

| Tile | Line | Condition |
|---|---|---|
| Alphabet camera (`camera`, target `alpha-alif`) | `:70-85` | none |
| Words room | `:88-97` | none |
| Fingerspell | `:108-118` | none |
| Review | `:122-134` | `due.length > 0 && !reviewCapReached` |

Only the Review tile is conditional, and its condition is "there is review work", not "you have
earned this". Additionally, `CameraPractice` renders a chip for **all 28 seeded letters** on first
open — `src/screens/CameraPractice.tsx:144-155` maps `SEEDED_ALPHABET` with no progress filter, and
`choose()` (`:108-111`) accepts any of them. A brand-new user can practise ي (the last letter) before
ا (the first). The Words screen lists **all 19** A1 signs on first open
(`src/screens/Words.tsx:21-22, :97-98`). The Dictionary lists **all 47** signs
(`src/content/signs.ts:160`, filtered only by the user's own chip/search choice at
`src/screens/AllSigns.tsx:163-182`).

### Q3. Does anything at all get introduced to the user later than launch?

**Effectively no.** The complete and exhaustive list of things that can appear later:

1. **The `StreakCelebration` overlay** — `src/screens/Progress.tsx:263-272`, gated on
   `streak > celebratedStreak && streak > 1` (`:111-113`). Earliest possible: day 2. This is the only
   item on this list that is genuinely time-gated.
2. **The "Review due" card / tile / banner** — `src/screens/Home.tsx:506`,
   `src/screens/PractiseChooser.tsx:122` and `:139`. Gated on `dueSignIds(...).length > 0`. Earliest
   possible: immediately after the first rated drill, or instantly via the Dictionary's "Add to Daily
   Review" button (`src/screens/AllSigns.tsx:789-793` → `addToReview`, `src/store/app.ts:531-543`,
   which seeds a due-**now** card). So "later than launch" here is measured in seconds, by user
   choice.
3. **The "30 done today" capped note** — `src/screens/Home.tsx:524`,
   `src/screens/PractiseChooser.tsx:162`, `src/screens/LessonPlayer.tsx:85-93`. Requires 30 reviews in
   one day. This *removes* a CTA, it does not introduce a feature.
4. **The Family flag section on Home** — `src/screens/Home.tsx:453`. Gated on the user (or a family
   member) having raised a flag. User-triggered, available second one.
5. **The Family "signs we can all do" honeycomb** — `src/screens/Family.tsx:419-423` swaps an empty-state
   card for the grid once `signsAllCanDo(app)` is non-empty (`src/store/app.ts:778-797`).
6. **The "Every milestone reached" card** — `src/screens/Home.tsx:623-641`, shown only when
   `nextMilestone` returns `null`, i.e. the entire curriculum is at mastery 3.
7. **Achievement tiles flipping from dashed-grey to gold** — `src/screens/Progress.tsx:648-663`. The
   tiles themselves are visible from second one.

Items 2–7 are all "a container that had nothing in it now has something in it". **Not one of them is
a capability, screen, mode, or control that was withheld and is later granted.** No tab appears
later. No practice mode appears later. No sign becomes reachable later. No setting appears later.

### Q4. Lesson locking on the Home trail — does it restrict anything?

**Verdict: no. It restricts one button on one screen, and the same content is two taps away on
another tab. Locking is decorative.**

**The mechanism.** `src/screens/Home.tsx:100-125`:

```
// src/screens/Home.tsx:100
const nextLesson = LESSONS.find((l) =>
  l.signIds.some((id) => (prog[id]?.masteryLevel ?? 0) < 2),
);
…
// src/screens/Home.tsx:117-125
const nodes = LESSONS.map((lesson) => {
  const complete = lesson.signIds.every((id) => (prog[id]?.masteryLevel ?? 0) >= 2);
  const status: "current" | "done" | "locked" = complete
    ? "done"
    : lesson.id === nextLesson?.id
      ? "current"
      : "locked";
  return { lesson, status };
});
```

On day 1, `prog` is `{}`, so `nextLesson` is `LESSONS[0]` and **7 of the 8 lesson nodes render as
locked** (`src/content/signs.ts:207-241` — four alphabet lessons of 7 letters each, four word
lessons).

**What "locked" actually does.** Three things, all inside `Home.tsx`:

1. A padlock glyph and sand-coloured circle — `src/screens/Home.tsx:228-229`, `:257-262`.
2. An aria-label and sheet subtitle reading "Finish the sign before this to unlock."
   (`src/screens/Home.tsx:280-287`, string at `src/i18n.ts:233`).
3. **The one real gate:** the bottom-sheet CTA is disabled —

```
// src/screens/Home.tsx:738-744
<button
  type="button"
  disabled={locked}
  onClick={locked ? undefined : onAction}
  …
>{btnLabel}</button>
```

Note the node button itself (`src/screens/Home.tsx:304-313`) is **not** disabled — a locked node
opens its sheet normally; only the sheet's action is dead.

**Why the gate is hollow — four independent bypasses, all present on `main`:**

**Bypass 1 · The Practise tab reaches every letter directly.**
`src/screens/PractiseChooser.tsx:72` routes to `{ name: "camera", targetSignId: "alpha-alif" }`, and
`CameraPractice` then renders a selectable chip for all 28 letters
(`src/screens/CameraPractice.tsx:144-155`). A day-1 user can practise ك through ي — the contents of
alpha-u1-l4, the *last* alphabet node — before touching lesson 1. A camera match calls
`recordDrillResult(signId, "good", { camera: true, matched: true })`
(`src/screens/CameraPractice.tsx:71-76`), which writes `masteryLevel: Math.max(prev, 2)`
(`src/store/app.ts:433-438`) — the **same** field `Home.tsx:118` reads. Seven such matches flip
alpha-u1-l4 from `"locked"` straight to `"done"` without the trail being touched once.

**Bypass 2 · The Words screen and Dictionary self-mark reach every word sign directly.**
`src/screens/Words.tsx:97-98` lists all 19 A1 words; the sheet's self-mark
(`src/screens/Words.tsx:46-52`) calls `recordDrillResult(id, "hard", { selfMark: true })` → mastery 2.
The Dictionary offers the same for non-gradable signs (`src/screens/AllSigns.tsx:155-160`, CTA at
`:770-780`). **Four self-mark taps in the Words room complete lesson `a1-u1-l1` — the fifth trail
node — on day 1, and it renders as "done" without ever having been "current".**

**Bypass 3 · The Dictionary shows and opens every locked sign.**
`src/screens/AllSigns.tsx:355-364` computes `"learned" | "current" | "locked"` for letter cells, but
`LetterCell` (`src/screens/AllSigns.tsx:491-519`) applies that state **only as a background colour**
(`:502-507`). The button carries no `disabled`, and its `onClick` is an unconditional `onSelect`
(`:511`) that opens the full detail panel — demo, hint, camera CTA, flag, share. The word "locked"
here has no functional meaning at all.

**Bypass 4 · The URL router will start any lesson, locked or not.**
`hashToScreen` (`src/store/ui.ts:86`) resolves `#/lesson/alpha-u1-l4` with no validation beyond "is
there an id". `LessonPlayer` (`src/screens/LessonPlayer.tsx:44-67`) then calls
`buildDrillQueue(lessonId, useApp.getState(), profileId)` (`:53-56`) — and neither `LessonPlayer`
nor `buildDrillQueue` (`src/lesson/engine.ts:41-97`) contains any lock, prerequisite, or ordering
check. The lesson plays in full.

**The knock-on:** the locked-node copy at `src/i18n.ts:233`, "Finish the sign before this to unlock",
is a **promise the app does not keep in either direction**. It cannot be enforced (bypasses 1–4), and
it is not even accurate as a description — a node's status is derived from *its own* signs' mastery,
not from the preceding node, so a user who works out of order sees "done" nodes sitting above a
"current" one.

**Net effect of the entire locking system: one disabled button.** Every sign behind every locked node
is reachable, watchable, practisable and masterable from the Practise tab, the Words room, the
Dictionary, or a hand-typed URL, on day 1, in under five taps.

---

## Part 3 — Summary table

| State | File:line (declared) | Written by | Persisted | Genuinely changes what is offered? |
|---|---|---|---|---|
| `onboarded` | `store/app.ts:53` | `store/app.ts:401` | yes | **Yes** — Onboarding vs. app. Once, forever. |
| `track` | `screens/Onboarding.tsx:125` | `Onboarding.tsx:357, :387` | **no** | One-shot landing route only |
| `masteryLevel` | `store/app.ts:57` | `store/app.ts:433-443` | yes | Partly — drops `watch` drills (`lesson/engine.ts:58`), narrows distractors (`engine.ts:120-123`), sets trail node status (which gates one button) |
| `srs` cards | `store/app.ts:59` | `store/app.ts:416-419, :531-543, :617-623` | yes | Partly — shows/hides Review CTAs; composes review queue |
| `reviewsToday` | `types.ts:21` | `store/app.ts:463` | yes | Caps review session at 30/day |
| `streak` | `types.ts:22` | `store/app.ts:449-454` | yes | **No** — display only |
| `bestStreak` | `types.ts:27` | `store/app.ts:467` | yes | **No** — one badge border |
| `celebratedStreak` | `types.ts:32` | `screens/Progress.tsx:151` | yes | **Yes, cosmetically** — the one "fires once" overlay |
| `activeDays` | `types.ts:34` | `store/app.ts:456-458, :639` | yes | **No** — heatmap + household streak readout |
| `lastActiveDay` | `types.ts:33` | `store/app.ts:468` | yes | **No** — internal daily-reset bookkeeping |
| `xp` / `xpToday` | `types.ts:16-17` | `store/app.ts:460-462` | yes | **No** — goal ring + which of two secondary Home cards |
| `flags` | `store/app.ts:60` | `store/app.ts:552-645` | yes | **No** (user content) — surfaces sections, jumps the queue |
| `metrics.*` | `types.ts:127-136` | `store/app.ts:478-491` | yes | **No** — Stats tab + hidden dev screen |
| `metrics.appFirstOpenAt` | `types.ts:127` | `store/app.ts:336` | yes | **No** — only ever used for seconds-to-first-sign |
| Milestone rung | derived, `lesson/milestones.ts:32` | n/a | derived | **No** — a label and a shortcut |
| Achievement `earned` | derived, `screens/Progress.tsx:648-663` | n/a | derived | **No** — border and greyscale |
| Trail node `locked` | derived, `screens/Home.tsx:117-125` | n/a | derived | **Marginally** — one `disabled` at `Home.tsx:740`, bypassable four ways |

---

## Part 4 — What this means

Sawiyya treats every learner as the same person on every day. It records a great deal about them —
FSRS scheduling, mastery levels, camera-hit counts, honest telemetry, a 90-day activity set — and
then spends almost all of it on **readouts**: chips, rings, heatmaps, badge borders, and progress
bars. The app measures maturity meticulously and acts on it almost nowhere.

The one place it does act — the Home trail's locked nodes — is undermined by the app's own (correct,
deliberate) commitment to instant access: the Practise hub, the Words room and the Dictionary were
each built to be reachable "instantly, no letter progress required"
(`src/screens/Words.tsx:1-3`, `src/screens/PractiseChooser.tsx:87`). Those two designs are in direct
conflict, and instant access wins, because it is implemented in four places and the lock is
implemented in one.

Practically: a first-time user is handed the complete surface area of the product — four tabs, three
practice modes, 47 signs, a dictionary, a family system, an SRS, an achievements board and a
progress dashboard — in the same second, with a padlock icon on seven trail nodes as the only
suggestion that anything is meant to come later. And nothing does.
