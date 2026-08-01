# Record the word signs — 19 short clips, one afternoon

The letters have real photos; the words are the last content with no visual.
The player is already built: the moment a clip lands in `public/signs/` and its
line is added in `signs.ts`, that word shows real footage everywhere (Words hub,
lessons, dictionary, recognise drills) instead of the written instructions.

## How to shoot

- Phone camera, landscape or square, waist-up or chest-up so face + hand are
  both in frame (several signs touch the chin/forehead/chest).
- Plain background, good light, 2–4 seconds per sign, one clean repetition
  (two repetitions for the small repeated motions like Milk / More).
- Sign toward the camera as if greeting the viewer.
- These ship labelled **"Reference recording"** (the app only says "Deaf signer
  recording" for footage marked as such — when the Phase-2 signer records,
  flip `signer: "deaf"` and the label upgrades itself).

## The 19 signs

| # | id | Sign | Arabic | Do this |
|---|----|------|--------|---------|
| 1 | iloveyou | I love you | أحبك | Thumb, index and little finger up, middle and ring folded, palm out, hold steady |
| 2 | hello | Hello | مرحبا | Open hand by your temple, small wave outward |
| 3 | yes | Yes | نعم | Fist nods gently, like a head saying yes |
| 4 | no | No | لا | Index and middle finger tap against the thumb |
| 5 | stop | Stop | قف | Flat open hand, palm forward, hold firm |
| 6 | more | More | زيادة | Fingertips of both hands pinched, tapping together |
| 7 | finished | All done | خلاص | Both open hands flip outward |
| 8 | hungry | Hungry | جوعان | Cupped hand moves down the chest from the throat |
| 9 | milk | Milk | حليب | Squeeze a fist like milking, repeat softly |
| 10 | sleep | Bedtime | نوم | Open hand draws down over your face, eyes closing |
| 11 | mum | Mum | ماما | Open hand, thumb to chin |
| 12 | dad | Dad | بابا | Open hand, thumb to forehead |
| 13 | thankyou | Thank you | شكرًا | Flat hand from chin moving forward |
| 14 | help | Help | ساعدني | Fist on open palm, both rise together |
| 15 | careful | Careful | انتبه | Two fingers from your eyes outward |
| 16 | name | Name | اسم | Two fingers of each hand tap crossed |
| 17 | me | Me | أنا | Index finger points to the middle of your chest |
| 18 | man | Man | رجل | Open hand, thumb taps forehead then moves down to chest |
| 19 | woman | Woman | امرأة | Open hand, thumb taps chin then moves down to chest |

Provenance note: these descriptions are ASL-adapted and disclosed as such
in-app. Recording them does not change that status — it just makes them
watchable. Verification as QSL stays a Phase-2 Deaf-signer task.

## Drop them in

1. Export each clip as WebM (or MP4) around 720p, a few hundred KB each, into
   `public/signs/<id>.webm` (poster frames optional: `<id>.jpg`).
2. In `src/content/signs.ts`, add to each recorded sign:
   `media: { type: "video", src: "signs/<id>.webm", signer: "reference" }`
3. `npm test && npm run build` — recognise drills automatically upgrade for
   any word that now has footage (hasVisual). Push; CI deploys.

Hand the clips over in any form (AirDrop to the Mac, a Desktop folder) and
steps 2–3 can be done for you in one pass.
