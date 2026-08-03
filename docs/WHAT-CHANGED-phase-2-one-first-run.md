# What you will see change · Phase 2, "one first run"

Branch `feat/phase-2-one-first-run`, stacked on Phase 1. **Not deployed, and Phase 1 is still
unmerged too.** Merging to `main` is what deploys, so nothing goes live until you say so.

This is Phase 2 of the plan in `docs/ux-audit-2026-08-01/07-THE-PLAN.md`. Phases 3 and 4 are not
started. Everything below is something a person setting up the app can notice.

## The point of this phase

Setup used to fork. You picked a track, and one of the three ways through never reached the moment
where the app proves itself. Now there is one road: everybody answers the same questions, everybody
gets the same first lesson, and the answers are shown back so the asking was not for nothing.

## Setup, before and after

**Before:** welcome, meet Fanan, language, **what do you want to learn**, who for, how the camera
works, daily goal, reminder, your name. Then one of three destinations depending on the track.

**After:** welcome, meet Fanan, language, who for, **what you already know**, **which days you'll
practise**, reminder, **a recap**, your name, how the camera works. Then the same first sign for
everyone.

- **The "What do you want to learn?" screen is gone.** It offered Arabic Alphabet, Everyday signs,
  and a greyed-out "Other Gulf dialects". Picking Everyday signs dropped you on the sign list, and
  the 19 everyday signs cannot be practised, only watched, so that route could never reach the
  moment the app is built around. There is one road now.
- **Two new questions:** what you already know, and which days you'll practise. Neither changes your
  lessons. That is deliberate: the point is that the app asked and remembered, not that it sorts you.
- **The daily goal moved** onto the same screen as the days question. They are the same decision
  asked twice, so they are now one screen and the setup did not get longer.
- **A recap screen before your name** reads your three answers back.
- **The camera explanation moved to the end**, right before the app actually asks your phone for the
  camera. It used to sit six screens early, which meant the sentence explaining the camera had been
  forgotten by the time the permission box appeared.

## Things that were untrue and now are not

- **"We'll start you on the signs that matter most."** Under the persona question. Nothing ever
  implemented it, and this phase makes it untrue on purpose. It now says "This changes what we say,
  not what you learn", which is what actually happens.
- **The "SPECIAL PATH" badge on the Deaf option.** There is no separate path any more. What being
  Deaf in a household actually changes is real, though: you flag the signs and everyone's queue
  follows you. The badge now says "Directs learning", which is what the Family screen and the
  flagging screen already called it.
- **The reminder said "Every day"** on its calendar preview no matter which days you picked, while
  the file it downloaded said something else. The preview now shows the days you chose, and the
  calendar entry recurs on exactly those days.

## The four tabs finally have names

Learn, Practise, Signs and Family were never named or explained anywhere in the app. The recap
screen names all four and says what each is for, once, before you start.

## Home knows what you told it

If you said you would practise on Mondays and Thursdays, Home says "Today is one of your practice
days" on those days, and names your next one otherwise. If you skipped the question it says nothing
new, rather than inventing a schedule you never agreed to.

## What was checked

- 162 automated tests pass, 19 files. Four are new and cover the two new answers, including what
  happens to a profile saved before these questions existed.
- The headless phone-sized walkthrough passes all 25 steps, no console errors. Six steps are new.
- That walkthrough was run against the app as it was before this phase, to prove it detects the
  difference. Every Phase 2 check failed there, as it should.
- The downloaded calendar file was opened and read: picking Monday and Thursday produces a reminder
  that recurs on Monday and Thursday.
- 51 screenshots at phone width, English and Arabic, no console errors on any screen.

## Still open, and still yours

- **Whether Phase 1 and Phase 2 merge.** Merging deploys. Nothing is pushed.
- **The 19 everyday word signs.** This phase deleted the route that pretended they were a track, but
  it did not solve them: they can still be watched and never practised. Either the promise shrinks to
  an honest Arabic fingerspelling trainer, or someone records a Deaf QSL signer. This is now the
  oldest open question in the project.
- **The dictionary padlock** from Phase 1, unanswered.
- **The mascot.** Fanan is rejected with no replacement chosen. He is still in setup, on three
  screens, because nothing has been picked to replace him.
