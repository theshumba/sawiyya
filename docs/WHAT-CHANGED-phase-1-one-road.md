# What you will see change · Phase 1, "one road"

Branch `fix/phase-1-one-road`. **Not deployed.** Nothing is on the live site, and merging this to
`main` is what deploys it, so nothing goes live until you say so.

This is Phase 1 of the four-phase plan in `docs/ux-audit-2026-08-01/07-THE-PLAN.md`. Phases 2, 3 and
4 are not started and not approved. Everything below is something a person using the app can notice.
If you veto an item, it is a small edit to put back.

## The point of this phase

The app used to ask "what do I do now?" and give nine different answers, six of which were the same
camera screen under six different names. Now the path down the middle of the Learn screen is the
answer, and it is the only one.

## The home screen

- **The eight cards under the path are gone.** Practise the alphabet, Everyday words, Spell your
  name, Daily goal, Learn a new letter, All caught up, and the rest. The path is the screen now.
- **Today's goal moved into the green bar at the top**, and it counts what you did today against
  your daily target: `4 / 50`. The gold chip used to show your lifetime points, a number nothing on
  that screen could ever move, so it never changed and told you nothing.
- **A family request now sits ABOVE the path**, not buried below it. It only appears when someone in
  your household has actually asked for a sign. This is the thing the app does that nothing else
  does, and it was the least visible thing on the screen.
- **That card counts properly.** It said "1 family requests". It now says "1 family request".

## The padlocks are real now

They were a paint job. A grey circle with a padlock drawn on it, and the button underneath still
worked.

- **A locked lesson cannot be opened**, from the path or by typing its address. If you land on one,
  it says it is locked, says why, and offers to take you to the lesson you are actually up to.
- **Locked lessons stay visible and greyed out** rather than hidden. You can see where the road goes.
  This is what Duolingo does with locked stories, and it holds up in the research.
- **Lessons can no longer complete out of order.** Practising four word signs used to tick off a
  lesson four steps further down the road, on your first day, without you doing it.
- **The dictionary's letter grid agrees with the path.** Letters you have not reached are padlocked
  and do not open, and the grid explains its three states. The three edge forms that belong to no
  lesson (ة، لا، ال) stay open.

## Fewer doors to the camera

There were seventeen ways into the camera screen. There are now three: the lesson you are on, the
Alphabet tile on the Practise tab, and a sign's own detail page. Everything that used to jump
straight to the camera now goes through the sign first, which also fixes the camera screen saying
"Practise the alphabet" while showing you a word sign.

- **Settings, "Not granted yet" is no longer a button.** It is a status. Tapping it did nothing.
- **The "How the AI works" page's big button now opens the Practise tab**, not the grader.

## Settings tidy-up

- **The duplicate "Manage profiles" row is gone.** There were two, identical.
- **The duplicate "Privacy policy" row is gone.** Same thing. The plan only named the first one, but
  leaving one twin standing would have been arbitrary.

## Two things I want to flag

**The dictionary padlock may be theatre.** A padlocked letter in the dictionary is still reachable
one tab away, because free camera practice on any of the 28 letters is deliberately still open on the
Practise tab. So the padlock is a signal about the curriculum, not a gate. Either that is fine and it
stays as a signpost, or the dictionary lock should come out. Your call, and nothing else depends on
it.

**The 19 everyday word signs still cannot be practised**, only watched. There is no footage of a real
signer for them, so the camera has nothing to grade against. That is not a Phase 1 issue but it
blocks Phase 2, and the choice is either to shrink the promise to an honest Arabic fingerspelling
trainer, or to find a Deaf QSL signer and record the words properly.

## What was checked

- 158 automated tests pass, 19 files.
- The headless phone-sized walkthrough passes all 21 steps end to end, with no errors in the console.
  It was rebuilt because it had rotted: it was driving the app by wording that three redesigns ago
  stopped existing, so every step was failing on `main` and nobody could tell, because a broken
  check looks exactly like one nobody runs.
- That walkthrough was then run against the app as it was *before* this phase, to prove it actually
  detects the difference. Every Phase 1 check failed there, as it should.
- 49 screenshots at phone width, English and Arabic, no console errors on any screen.

## What is still yours to do

- **Deciding whether this merges.** Merging to `main` deploys it. I have not pushed anything.
- **The dictionary padlock question** above.
- **The word-signs content question** above.
- **The mascot.** Fanan the fennec fox is rejected and there is no replacement direction yet. He is
  still in the app, cheering beside the current lesson, because nothing has been chosen to replace
  him.
