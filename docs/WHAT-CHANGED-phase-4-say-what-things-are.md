# What changed · Phase 4 "Say what things are"

Branch `feat/phase-4-say-what-things-are`. **Not pushed, not deployed.** Phases 1, 2 and 3 are live;
this one is not, and merging it to `main` is what deploys it.

The goal from the plan: **every screen states its own purpose.** This is the last of the four phases.

---

## What a learner sees

**Home finally says what the road is.** The only heading on Home was "Marhaba, Noora". The road down
the middle of the screen was named for screen readers and for nobody else. It now carries a visible
heading, "Learn", which is the same word as the tab that opens it, and one line under it: "Your road,
one lesson at a time".

**Progress is one screen instead of four tabs.** You tapped a menu item called "Progress" and arrived
somewhere headed "Your oasis", and the word Progress appeared nowhere on it, because the header
renamed itself every time you changed tab. Three of the four tabs were dead ends with a back arrow.
So: no tabs. One page, headed "Progress", that reads top to bottom — getting started, your stats,
your streak and your month, the oasis picture, the alphabet ring, your achievements, what is coming
up. One action on it, "Start review session", where it always was.

**The Family league tab is gone.** It ranked the same household the Family tab lists, from inside a
screen hidden behind your own face, and its empty state offered a button to the Family tab. The hint
it carried, about adding the person you are learning to sign with, moved to Family, where adding
people actually happens.

**The pictures explain themselves now.** The oasis was a drawing with no key and two invented units
underneath it: "signs planted" and "palms grown", which contradicted "Signs mastered" one tab away.
Those two tiles are gone, the number lives once in the stats grid, and the picture now says what it
draws: a palm for every letter you have started, a sprout for every sign you have mastered. The
alphabet ring says "Tap a letter to open it" instead of "Connect the signs to light the sky", and
every tap now opens the same place. The month grid says a square is a day.

**Progress has a door that is not your own face.** It was reachable from one place: a menu behind
your avatar, which nothing in the app mentioned. The three numbers at the top of Home are the summary
of that screen, so tapping them opens it. The menu still works.

**The dictionary has one name.** It answered to four in English: "Signs" on the tab, "Sign
Dictionary" when you arrived, "Signs dictionary" in Settings, and "Browse the signs" on the camera's
error screen. It is "Dictionary" in all four places now, and the Arabic (القاموس) was already saying
that.

**The dictionary tells a phone what to do.** Its only instruction, "Tap a sign to see how it's made",
lived in a panel that only exists on a desktop screen. On a phone it never rendered at all. It is now
under the title at every width.

**Everyday words is a filter, not a screen.** The Words screen listed sign cards, opened the same
sheet, showed the same demo and wrote the same self-mark as the dictionary one tab away. It is gone.
"Everyday words" is now a chip inside the dictionary, and everything that used to open the Words
screen opens the dictionary with that chip applied. Old links to it still work. The one-handed and
two-handed split survives as a tag on each word, because that is real information about doing the
sign.

**The tone pass.** Duolingo's published rules, chosen because they are public and specific. Buttons
lost their trailing arrows and stars: "Start →" is "Start", "Collect ⭐" is "Collect". Exclamation
marks are now only for things you actually did, so "Watch me first!" and "Hi, I'm Fanan!" are calm
and "That's it!" still shouts. Headlines lost their full stops. Counts are digits: "4 tabs", "6
things", "10 seconds".

---

## Two things worth knowing

**The tone rules are now a test, not a memory.** `src/i18n.tone.test.ts` fails the build if a button
gets punctuation, if a new exclamation mark appears outside an agreed list of successes, or if a
headline ends in a full stop. It caught one on its first run, a celebration headline, which is fixed.

**43 unused copy keys are still in the file.** Two of them were mine and are deleted. The other 41
are older — celebration screens that were never built, cards Phase 1 removed from Home, the free
camera tile. They are invisible to a learner and I have not touched them, because deleting them is a
different job from this one. Worth doing, worth doing deliberately.

---

## What was NOT touched

- The curriculum, the trail, the lock, the camera and the grading. No content change of any kind.
- The 19 everyday word signs. Merging them into the dictionary did not make them practisable: they
  are still watch-only, and that is still the oldest open question in the project.
- The mascot. Fanan is still rejected, still there, still with no replacement chosen.
- The dictionary padlock, still arguably theatre.

---

## How it was checked

- `npx tsc -b` clean · `npx vitest run` **224 passed** across 24 files, up from 214 across 22 (10 new:
  the tone gate, and the router proving a bookmarked `#/words` still lands on the words)
- `npm run build` green
- `node scripts/smoke.mjs` — **40 of 40 steps**, 8 of them new: Home's visible heading, the stat-chip
  door to Progress, Progress as one readout with no tab bar and no "Your oasis", the keys under the
  pictures, the dictionary's single name, its phone instruction, the word room as a filter, the
  bookmarked address, and the trail's button with no arrow on it.
- **Every new gate was run against the live build** (`7196fcd`) in a detached worktree. All nine fail
  there, and every Phase 1, 2 and 3 step still passes, which is what makes a green run here mean
  something.
- One harness fault fixed while doing it: the onboarding recap step asserted before it advanced, so a
  single wrong word stranded the whole run and 36 later steps failed for a reason that had nothing to
  do with what they test. It drives first and judges second now. Playwright's 30-second default was
  also cut to 8, because a broken build took twelve minutes to finish telling you so.
- `npm run shots` — 51 screenshots at phone width, English and Arabic, no console errors on any
  screen. `~/Desktop/sawiyya-phase-4-shots/`.
