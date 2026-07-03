# Sawiyya — Real Sign Content Plan (replacing the placeholders)

*Drafted 2026-06-24, counts refreshed 2026-07-02 against `src/content/signs.ts` (audit L4).
This is the plan to close Sawiyya's single biggest product gap: no sign has a real
demonstration by a signer yet. Alphabet letters draw a **real averaged handshape skeleton**
(Zenodo ArSL geometry), A1 words show an honest sign **icon**, and only `iloveyou` has
real-looking art. To deliver the promise ("real signs"), demonstrations must come from
a **native Qatari Deaf signer**.*

The code already anticipates this — `signs.ts`, `SignGlyph.tsx`, and `SignDemo.tsx` all carry
`HONEST PLACEHOLDER [A] → Phase 2 swaps in Deaf-signer video [B]` comments. This plan is Phase 2.

---

## 1. What exists today (the gap)

| Content | Count | Current visual | Camera-gradable |
|---|---|---|---|
| Arabic alphabet | 31 (28 seeded + 3 edge forms) | Real averaged **handshape skeleton** from Zenodo ArSL for the 28 seeded letters; Arabic **letter glyph** for the 3 edge forms (ة، لا، ال) | ✅ the 28 seeded static handshapes; ❌ the 3 unseeded edge forms |
| A1 "Family & First Words" | 16 | Honest sign **icon** (no emoji-as-sign), except `iloveyou` (real art). Hints are **adapted from ASL and disclosed as unverified QSL** in-app (`a1AslProvenance`) | mixed — 4 static gradable (`iloveyou`, `yes`, `no`, `stop`) / 12 dynamic watch-only |

**Total: 47 signs** (31 alphabet + 16 A1).

**The hard rule (already enforced in `signs.ts`):** *camera-gradable = static handshapes ONLY.*
Dynamic signs (e.g. `hello`) can be watched and self-marked, but not auto-graded. Filming does
not change that — it just makes the *demonstration* real.

## 2. What "real content" means — two assets per sign

For each sign we need:
1. **Demo clip** — 2–4 s looping video (or 3–5 frame sequence) of the signer performing it, front-on, clean background. This is what `SignDemo` ("Watch") shows.
2. **Still reference** — one sharp frame (the "thing to copy" chip in `CameraTrainer` + `SignGlyph`).

Format recommendation: **short MP4/WebM loop** (H.264 + VP9), ~480×480, < 300 KB each, plus a
poster JPG. Web-only delivery (matches the onnxruntime-web decision — no native app needed).

## 3. Priority order (film in this sequence)

1. **The 16 A1 signs first** — they're the onboarding + first lessons (`iloveyou`, `hello`, family words). Highest visibility. This is also what clears the "adapted from ASL — unverified as QSL" disclosure: the signer **verifies or corrects each A1 sign as real QSL** while filming. *Start here.*
2. **The 31 alphabet signs** — the 28 seeded letters are static and camera-gradable, so real handshape stills also improve recognition teaching; the 3 edge forms (ة، لا، ال) get their **first-ever ground truth** here (they currently can't be graded at all). Batch-film in one session.
3. Everything after = new units, filmed as content expands.

→ **47 signs total for full coverage.** A single half-day shoot with one signer can capture all 47.

## 4. Sourcing the signer (the blocker)

- Engage **one native Qatari Deaf signer** (QSL is dialect-specific — generic ASL/ArSL won't do; this is why no dataset exists, per our feasibility research).
- Routes: Qatari Deaf community orgs, Mada Center network (we're already a Mada Innovation Award entry — leverage that relationship), or Qatar University sign-language dept.
- **Pay them properly** and credit them — it's their language and labour. Get a simple **likeness + content licence** so the footage can ship in the app.
- Budget: one paid signer + half-day filming (phone-on-tripod is fine at this quality bar) + light editing. Low hundreds, not thousands.

## 5. Technical wiring (small, isolated)

The data model already isolates this — **add fields, don't restructure**:

```ts
// types.ts — extend Sign
media?: {
  demo?: string;    // e.g. "signs/iloveyou/demo.webm"
  poster?: string;  // e.g. "signs/iloveyou/poster.jpg"
  still?: string;   // reference frame for SignGlyph / trainer chip
};
```

Then update the two render points to **prefer `media` when present, fall back to the current
placeholder** (so partial coverage ships safely — filmed signs go real, the rest stay placeholder):
- `SignGlyph.tsx` — use `sign.media.still` over the `iloveyou`-image / skeleton / letter-glyph / icon branch.
- `SignDemo.tsx` — render `<video loop muted>` from `sign.media.demo` instead of the static placeholder image.

Store assets in `public/signs/<id>/`. No engine/recognizer changes needed — recognition is
unchanged; only the *demonstration* layer becomes real.

## 6. Suggested phasing

- **Phase 2a (ship-first):** film + wire the **16 A1 signs** (and get each verified as QSL by the signer). Onboarding "I love you" already has art; this makes the whole first unit real. ~1 shoot + ~1 dev day.
- **Phase 2b:** the **31 alphabet** stills/clips (28 seeded + first ground truth for the 3 edge forms). ~same shoot, batch.
- **Phase 2c:** expand units with new filmed content as the course grows (Unit 2 list TBD — defined when Batch 6 lands the alphabet curriculum).

## 6b. Unit 2 candidate signs (defined with Batch 6, 2026-07-03 — owner-gated shoot)

The next word unit after "Family & First Words", to be filmed **in the same
half-day shoot** as Phase 2a/2b and verified as QSL by the signer (same rule:
nothing ships until the signer records + verifies it). ~14 everyday signs,
picked for daily family utility:

| # | Gloss (EN) | Gloss (AR) | Why |
|---|---|---|---|
| 1 | Water | ماء | most-requested daily need |
| 2 | Eat / food | أكل | mealtime staple |
| 3 | Drink | شرب | pairs with water/milk |
| 4 | Come | تعال | summoning across a room |
| 5 | Go | اذهب | directions & transitions |
| 6 | Where? | أين؟ | first question word |
| 7 | What? | ماذا؟ | second question word |
| 8 | Wait | انتظر | safety + patience |
| 9 | Look / watch | انظر | attention-getting |
| 10 | Home / house | بيت | places vocabulary opener |
| 11 | School | مدرسة | the child's day |
| 12 | Play | لعب | connection through play |
| 13 | Hurt / pain | ألم | health & safety critical |
| 14 | Bathroom | حمّام | daily-need essential |

Static-handshape candidates among these (if any survive QSL verification as
truly static) may also become camera-gradable; the rest ship watch-only, same
as the A1 dynamics. The list is a **proposal for the signer** — they correct,
replace or re-order it as the QSL expert.

## 7. Honesty guardrail

Until a sign is filmed, keep the **explicit placeholder** (don't dress an icon up as a real
sign — that's the exact mistake we fixed on the landing page, and why the A1 hints carry the
`a1AslProvenance` disclosure). A small "demo coming soon" treatment on un-filmed signs is more
trustworthy than a fake.
