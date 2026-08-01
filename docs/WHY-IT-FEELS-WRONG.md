# Why Sawiyya doesn't feel like Duolingo

Written 2026-08-01, after Melusi said the app "doesn't feel intuitive and as clean" as Duolingo or
Headspace but couldn't name why. This is the answer, with the evidence from the code, and the cut
that fixes it.

## The answer

Sawiyya has too many front doors, and most of them lead to the same room.

Duolingo's home screen answers one question, "what do I do now", with exactly one answer: the glowing
node. Headspace's home does the same with one card. Sawiyya's home shows the glowing node **and then
eight more cards underneath it**, each offering a different way to start. Opening the app becomes a
decision instead of an action. That is the feeling. It isn't the look and it isn't bugs.

## The evidence, in `src/screens/Home.tsx`

**1. Home is a path plus a second menu.** The winding node trail ends at line 400. Block D then runs
to line 642 and adds: Practise the alphabet, Everyday words, Spell your name, Family requests, Review
due, Next new letter, Daily goal, Milestone. Eight cards. Duolingo's home is the path and nothing
else.

**2. The camera has six entrances on one screen, under five different names.** Home routes to
`{ name: "camera" }` from the Practise card (408), the new-letter card (548), the "All caught up"
card (570), the Daily goal card (595), the milestone fallback (166), and the lesson sheet's secondary
button (753). A seventh sits behind the Practise tab. Nobody can build a mental map of a place with
seven doors labelled differently.

**3. The Practise tab is a duplicate of Home's second menu.** `PractiseChooser.tsx` offers exactly
four tiles: Alphabet, Words, Fingerspell, Review. Home offers exactly those same four as cards. Two
menus, same four items, different shapes, different words.

**4. Four of the app's nouns mean the same thing to a learner.** Practise, Signs, Everyday words,
Spell your name. All four are "look at a sign and try to copy it". "Signs" is the dictionary and
"Words" is a practice mode, which is a straight collision.

**5. Progress is reported three times, three ways.** Three stat chips in the teal bar (streak, gold,
family), plus a Daily goal card, plus a Milestone card, plus the trail itself. The chips are fine,
Duolingo has them too. The two extra cards restate what the chips and the trail already say.

## The cut

Not a redesign. The look he approved stays exactly as it is. This deletes doors.

**Home becomes only the path.** Delete Block D (`Home.tsx` 403–642) except the family flags.

Everything deleted stays reachable:

| Deleted from Home | Still lives at |
|---|---|
| Practise the alphabet | Practise tab → Alphabet tile |
| Everyday words | Practise tab → Words tile |
| Spell your name | Practise tab → Fingerspell tile |
| Review due | Practise tab → Review tile (already shows the due count) |
| Next new letter / All caught up | the current node on the trail |
| Milestone readout | the treasure chest node on the trail, which is already tappable |

**Two things need moving, not deleting:**

- *Daily goal.* The chips show lifetime XP, not today's goal progress, so a plain delete loses it.
  Turn the gold chip into today's progress (`xpToday / goalXp`), or ring the avatar with it.
- *Family flags.* This is the differentiator, so it should not vanish. Promote it **above** the path,
  and only when someone else has raised a request. When there is nothing flagged, Home is purely the
  trail. The Family tab already carries the count badge (`AppNav.tsx` 143).

**One rename to consider:** "Signs" (dictionary) versus "Words" (practice mode) collide. Renaming the
dictionary tab to "Look up" separates them. Owner's call.

## Why this is the right size of fix

The coherence audit on 2026-08-01 fixed 130 defects *inside and between* the screens. That was real
and it shipped. But it fixed how the screens behave, not how many of them are shouting at once. This
is the layer above: not "is each screen correct" but "does the app ask the learner to choose too
often". Duolingo's discipline is subtraction, and Sawiyya has never had a subtraction pass.

Estimated change: roughly 240 lines deleted from `Home.tsx`, one chip rewired, the flag card moved up.
No new components, no new screens, no design work.
