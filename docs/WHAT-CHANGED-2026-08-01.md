# What you will see change

Branch `fix/coherence-audit-2026-08-01`, commit c27bbc8. Not deployed. Nothing is on the live site yet.

Everything below is a change a person using the app can notice. The rest of the 130 fixes are
invisible: contrast, screen-reader labels, leaks, dead code. If you veto an item here, it is one
edit to put back.

## The big one

**The phone's Back button no longer closes the app.** Every screen now has its own address, so Back
goes back a screen, Forward works, a refresh keeps you where you were, and you can send someone a
link to a specific screen. This was the single worst thing in the app and it affected every screen.

## Things that were removed

- **Settings, the "Signing hand" row is gone.** Right and Left cards. Nothing in the app ever read
  the answer. It could not be wired up either: the reference photos are licensed signer stills and
  flipping them would break the credit rules the app states in three places. The stored value is
  kept, so it can come back if it ever gets a real use.
- **Onboarding, the "Which hand do you sign with?" step is gone.** Same reason. Setup is 9 screens
  instead of 10.
- **Practise tab, the "Free camera" tile is gone.** There were two tiles doing the same thing and
  this one had no way to tell a real sign from a random hand.
- **Dictionary, the Watch and play buttons inside the sign picture are gone.** Both did nothing at
  all. The picture frame is now the same working one the Words screen uses, with a Replay that works.
- **The flag screen's "Most Needed" button only appears once something is flagged.** On a fresh
  install it did nothing.

## Things that were broken and now work

- **Dictionary, the big gold button.** For the 19 word signs it said "Watch and practise" and did
  nothing. It now says "I signed it right", records the practice, and confirms it.
- **Flagging a sign when you live alone.** It did nothing. It now puts the sign in your review queue.
- **The treasure chest at the end of the path.** It was permanently locked with a dead button. It now
  shows real progress and opens something.
- **Onboarding's "what do you want to learn?" question.** Both answers did the same thing. Choosing
  everyday signs now actually lands you on the signs.
- **Onboarding's Skip.** It threw away answers you had already given and replaced them with defaults.
  It now keeps them.
- **Six pictures on the info pages** were 404ing on the live site because of a wrong path.
- **The lesson end card** celebrated "lesson complete" when you had only done half of it. It now says
  part 1 and offers to keep going. It also stops printing 100% accuracy when nothing was scored.
- **The camera** claimed a confident match on hands it could not actually recognise. It now says so.
  It also gained honest messages for blocked camera, no camera and model-failed-to-load, notices when
  the camera dies mid-session, and no longer leaves the camera light on after a failed start.

## Wording changes

- The Home chip reads **"120 XP"**, not "120 gold". Nothing else in the app called it gold.
- A finished path node reads **"Practised, tap to review"**, not "Mastered". Mastered means something
  stricter everywhere else.
- The flag screen reads **"3 flagged"**, not "3 needs this".
- The dictionary's word filter reads **Unit 2**, not Unit 1. Home already called it Unit 2.
- The streak celebration no longer uses the learner's name.
- Arabic: the daily goal option is **خفيف** in both places now, and the minute chips use Arabic
  numerals instead of a Latin "3 min".

## Numbers that will drop

The three edge letters (ة، لا، ال) are reference only. The camera cannot grade them and never could.
They were being counted as if it could.

**If you had practised any of them, your counts will fall by up to 3** on the alphabet progress bar,
the palms grown tile, the Constellation found count, and the whole-alphabet badge. The Constellation
still draws all 31 cells but counts out of 28, so three cells stay permanently unlit. That is
deliberate, not a leftover.

## New things

- **Letters can be flagged.** All 28 gradable letters are now on the flag screen alongside the words,
  and searchable by their Arabic character.
- **You can remove a household member.** Small x on their tile, confirmation, then their progress and
  flags go. Only shows when there is more than one person.
- **The oasis picture on Progress reflects real progress.** Before, everyone saw two palms and one
  sprout regardless. A new learner now correctly sees an empty oasis.
- **The path shows two unit banners**, so the word lessons stop sitting under the alphabet heading.

## What did not change

The Qatari sign content hole. The 19 word signs are still adapted from American Sign Language, still
have no video, and still cannot be camera graded. No amount of code fixes that. It needs a Deaf
signer recording the clips in `docs/RECORD-WORD-SIGNS.md`.

## Gates

`tsc` clean. 119 of 119 tests pass. Production build green. A headless browser drive passes 11 of 11
with zero console errors: onboarding through to the home shell, a distinct address per screen,
browser Back, deep link, malformed address, and the Arabic right-to-left handoff on a fresh profile.

Not verified: how any of it looks on your actual phone. That needs your eyes.
