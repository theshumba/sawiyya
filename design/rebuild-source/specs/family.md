# Family — build spec (design reskin)

Screen: **Family** (profile switcher / hub / feed / flag-a-sign). Branch `feat/design-rebuild`.

Design source: `/Users/theshumba/Documents/GitHub/sawiyya/design/rebuild-source/Sawiyya Family.dc.html`
Existing code (preserve wiring): `src/screens/Family.tsx`, `src/screens/FlagPicker.tsx`
Screenshots: `01-fam2.png` (switcher, EN+AR), `02-fam2.png` (hub), `03-fam2.png` (flag detail), `04-fam2.png` (blank tails).

The design mock renders **4 tab states** of one Family surface: `switch` (Profile switcher), `hub` (Family hub), `flag` (A flag for you), `feed` (Family feed). Map them onto existing code as follows:

| Design state | Existing home |
|---|---|
| `switch` (dark "Who's signing?") | `Family.tsx` → `profileSwitcher` section (`app.switchProfile`) + `NoProfileFallback` styling |
| `hub` (household name, member row, Learning-together, Invite) | `Family.tsx` → `header` + `streakHearth` + `profileSwitcher` + `focusSection` |
| `flag` (single flagged-sign detail) | `FlagPicker.tsx` hero/detail visual language (single-flag emphasis) |
| `feed` (activity list) | **NET-NEW** — no existing component. Build only if adding the feature; keys provided but not required for the reskin. |

Notes on divergence: the design's `hub` **replaces** the existing honeycomb "board" and streak-hearth illustration with a compact member row + a "Learning together" flag list + a warm league note. Preserve the honeycomb `boardSection` logic (`signsAllCanDo`) if kept, but the primary reskin target is the design's warmer, list-driven hub. The design's `flag` detail is a single-sign takeover, NOT the multi-sign `FlagPicker` grid; apply its badge/glyph/CTA tokens to FlagPicker's hero + flagged-sign rows, keep FlagPicker's grid + toggle logic intact.

---

## 1 · PRESERVE (functional contract — must stay wired)

### `src/screens/Family.tsx`
- `const app = useApp();` — store root; all reads/writes flow through it.
- `const { go } = useUi();` — navigation. Every route call below must survive.
- `const profile = activeProfile(app);` and `if (!profile) return <NoProfileFallback />;` — no-profile guard.
- `const lang = profile.language;` — drives EN/AR + `dir`.
- Selectors (keep all): `activeFlags(app)`, `signsAllCanDo(app)` (→ `board`), `householdStreak(app)` (→ `sharedStreak`), `profilesActiveToday(app)` (→ `activeToday`), `app.profiles`, `app.activeProfileId`, `todayKey()`.
- `const deafMembers = app.profiles.filter((p) => p.role === "deaf");` and `const flagger = deafMembers[0];` — drives the "X flagged" hero + only-Deaf-flags note.
- Profile switch handler: `onClick={() => app.switchProfile(p.id)}` with `aria-pressed={isActive}` — the switcher's core action.
- Add-member flow: `useState` `adding`/`newName`/`newRole`; `addMember()` calling `app.createProfile({ displayName, role, dominantHand:"R", language: lang, dailyGoal:"regular" })`; `ROLES` + `ROLE_LABEL` maps; inputs bound to `newName`/`setNewName`, `newRole`/`setNewRole`.
- Flag → practice deep-links: `onClick={() => go({ name: "camera", targetSignId: cameraTargetFor(sign) })}` (needCards, honeycomb cells, board pills). Keep `cameraTargetFor(sign)` gating (`sign.cameraGradable ? sign.id : undefined`).
- Flag picker route: **two** call sites `onClick={() => go({ name: "flagPicker" })}` (the coral hero CTA + `milestonePill`). At least one must remain the household's primary flag action.
- `signById(...)`, `SignGlyph`, `signById(f.signId)` resolution for flag/board rendering.
- i18n calls to keep (do not rename): `t("famSharedStreak")`, `t("famSignedToday")`, `t("famHousehold")`, `t("famAdd")`, `t("famName")`, `t("save")`, `t("cancel")`, `t("homeFlagged")`, `t("famFlagged")`, `t("famFlagTitle")`, `t("famOnlyDeafFlags")`, `t("famBoard")`, `t("famBoardEmpty")`, `t("practiceCamera")`, `t("famTitle")`. Plus `num(...)`, `pick(lang, en, ar)`.
- `<ScreenShell lang={lang} chrome="tabs">` — chrome ownership; do not reintroduce an in-file rail/top-bar/FAB.

### `src/screens/FlagPicker.tsx`
- `useApp()`, `useUi().go`, `activeProfile`, `NoProfileFallback` guard, `lang = profile.language`.
- State: `query`/`setQuery`, `group`/`setGroup` (`GroupId`), `mostNeeded`/`setMostNeeded`. Keep `SIGN_GROUP`, `groupOf`, `groups` array, the `useMemo` filter/sort over `A1_SIGNS`.
- `activeFlags(app)` → `flags`; `flaggedIds` Set; `requestorIds`/`requestors`; `flaggedSigns` via `signById`; `firstFlaggedGradable`.
- Toggle: `onClick={() => app.toggleFlag(sign.id, profile.id)}` with `aria-pressed={flagged}` — the one selection affordance. `clearAll()` maps `toggleFlag` over flagged.
- Navigation: `onClose={() => go({ name: "family" })}`, "Practise these" `go({ name: "camera", targetSignId: firstFlaggedGradable })`, per-row `go({ name: "camera", targetSignId: s.cameraGradable ? s.id : undefined })`, "Done" `go({ name: "family" })`.
- `<ScreenShell lang={lang} chrome="takeover" title={t("famFlagTitle", lang)} onClose=…>` — takeover chrome + back-to-family.
- i18n to keep: `t("famFlagTitle")`, `t("famFlagged")`, `t("practiceCamera")`, `num(...)`, and all inline `pick(lang, …)` strings.

---

## 2 · LAYOUT (target design, ordered blocks — literal values)

**Global tokens** (lift exactly): app bg `#F6EFE3` (hub/flag/feed); switcher bg `linear-gradient(165deg,#0F6E6A,#0A4F4C)`; card `#FBF7EF`; line `#EDE3D2`; ink `#16302E`; sub `#5C726F`; mute `#94A5A2`; teal `#0F6E6A`; teal-deep `#0A4F4C`; gold `#E6B24C`; coral `#E8654C`; coral-deep `#C54F3A`; success `#1F8A5B`; flag-item bg `#FBF3EF`, flag-item border `#F5C9BE`. Latin = Rubik, Arabic = Readex Pro. Content padding inside shell: `6px 22px 20px` (scroll states), `12px 26px 0` (centered states). The 322×660 `#16302E` device frame in the mock is the ScreenShell/phone chrome — do NOT rebuild it; map content only.

### STATE A — Profile switcher (`switch`) — DARK
Background `linear-gradient(165deg,#0F6E6A,#0A4F4C)`, status text `#FBF7EF`. Centered column, `padding:12px 26px 0`, `text-align:center`.

- **B1 · Fanan hero** — `Fanan pose="wave" scale≈0.72` (~88×88px). Wrapper `animation:float 3s ease-in-out infinite` (`@keyframes float{0%,100%{translateY(0)}50%{translateY(-6px)}}`). Fanan NEVER mirrors.
- **B2 · Title + body** — title `font:800 27px/1.1 Rubik; color:#FBF7EF; margin-top:10px`; body `font:400 14px/1.4 'Readex Pro'; color:rgba(255,255,255,.78); margin-top:6px`. Copy: EN "Who's signing?" / "One app, the whole family."; AR "من سيتعلّم الآن؟" / "تطبيق واحد، والعائلة كلها.".
- **B3 · Profile grid** — `display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:26px; width:100%`. Card: bg `#FBF7EF`, `border-radius:18px`, `padding:16px 10px 14px`, flex-col center, `box-shadow:0 4px 0 #EDE3D2`; **selected** → `box-shadow:0 0 0 3px #1F8A5B, 0 4px 0 #EDE3D2`. Avatar `54×54`, `border-radius:50%`, `font:800 22px Rubik`, `background:p.color`, `color:p.ink` (per-person: Layla gold `#E6B24C`/ink `#16302E`; Mama teal `#0F6E6A`/paper; Baba coral `#E8654C`/paper; Sara `#0A4F4C`/paper). Selected check badge: absolute `bottom:-2px; inset-inline-end:-2px` (mock uses `right:-2px`), `22×22`, `border-radius:50%`, `background:#1F8A5B`, `border:2px solid #FBF7EF`, containing a CSS tick (`border-left/border-bottom:2.5px solid #FBF7EF; transform:rotate(-45deg)`) — checkmark NEVER mirrors. Name `font:700 14px Rubik; #16302E; margin-top:9px`. Role `font:500 11px 'Readex Pro'; #5C726F; margin-top:3px`. (Existing code renders `p.emoji`; design uses initial-on-color — keep whichever data path, but adopt the colored 54px circle + selected shadow.)
- **B4 · Add-learner button** — `margin-top:16px; background:rgba(255,255,255,.14); color:#FBF7EF; font:700 13px Rubik; padding:12px 18px; border-radius:13px; border:none`. Active: `transform:translateY(2px)`. Copy "+ Add a learner" / "+ أضف متعلّمًا".

### STATE B — Family hub (`hub`) — LIGHT
Background `#F6EFE3`, status `#16302E`. Scroll column `padding:6px 22px 20px`.

- **B5 · Header** — household name `font:800 25px/1.1 Rubik; #16302E; margin-top:4px` (data-driven, e.g. "The Al-Mansoori family" / "عائلة المنصوري"); subtitle `font:400 13px/1.35 'Readex Pro'; #5C726F; margin-top:3px` = `${learnerCount} learners · ${signCount} signs together` / `${count} متعلّمين · ${count} إشارة معًا` (numerals localized via `num`).
- **B6 · Member row** — horizontal scroll, `display:flex; gap:10px; margin-top:16px; padding-bottom:4px; overflow-x:auto`. Member card: `flex:none; width:74px; background:#FBF7EF; border:1px solid #EDE3D2; border-radius:16px; padding:11px 8px; text-align:center`. Avatar `44×44`, `border-radius:50%`, `margin:0 auto`, `font:800 18px Rubik`, `background:m.color; color:m.ink`. Name `font:700 12px Rubik; #16302E; margin-top:7px`. Streak: flex center `gap:3px; margin-top:5px` = coral dot (`9×9; border-radius:50%; background:#E8654C`) + `font:700 11px Rubik; #5C726F` number. (Wire to `app.profiles`, `app.switchProfile`, per-member streak; keep the +Add tile from existing switcher.)
- **B7 · "Learning together" label** — `font:700 11px ui-monospace,Menlo; letter-spacing:.1em; text-transform:uppercase; color:#0F6E6A; margin-top:22px`. Copy "Learning together" / "نتعلّم معًا". (Maps to the existing `focusSection`/flags eyebrow; distinct from the coral `homeFlagged` badge.)
- **B8 · Flags list** — `display:flex; flex-direction:column; gap:10px; margin-top:11px`. Flag card: flex row align-center `gap:11px; background:#FBF7EF; border:1px solid #EDE3D2; border-radius:15px; padding:12px`. Glyph box `46×46; border-radius:13px; background:#F6EFE3; font-size:24px` centered (sign emoji / alphabet code via `SignGlyph`). Text col: sign `font:700 15px/1.1 Rubik; #16302E`; by-line `font:400 12px/1.3 'Readex Pro'; #5C726F; margin-top:2px` (e.g. "Flagged by Baba — for you" / "رفعها بابا — لك"). Trailing requestor avatar `32×32; border-radius:50%; font:700 13px Rubik; background:f.color; color:#FBF7EF`. Data: `activeFlags(app)` → `signById`, `raisedByProfileId`.
- **B9 · Invite CTA** — full width `margin-top:18px; background:#0F6E6A; color:#FBF7EF; font:700 15px Rubik; height:50px; border-radius:15px; box-shadow:0 4px 0 #0A4F4C; border:none`. Active: `transform:translateY(3px); box-shadow:0 1px 0 #0A4F4C`. Copy "+ Invite family" / "+ ادعُ العائلة". (In this codebase the dominant household action is the coral **Flag signs we need** CTA → `go({name:"flagPicker"})`; keep that as the primary teal→coral action. If "Invite" is not yet a feature, repurpose this block for the existing coral flag CTA using its color `#E8654C`/shadow `#C54F3A` — see STATE C button spec — OR keep teal "Invite family" as secondary.)
- **B10 · League note** — centered `font:400 11px/1.4 'Readex Pro'; #94A5A2; margin-top:12px`. Copy "We celebrate everyone — no rankings, no losers. Turn on friendly league in settings." / "نحتفي بالجميع — لا ترتيب ولا خاسرين. فعّل الدوري الودّي من الإعدادات.".

### STATE C — A flag for you (`flag`) — LIGHT (single-sign detail)
Background `#F6EFE3`. Centered column `padding:12px 26px 0` then a pinned footer. Apply these tokens to `FlagPicker`'s hero + primary CTA.

- **B11 · Pulse badge** — flex row center `gap:8px; background:#FBF7EF; border:1px solid #EDE3D2; border-radius:99px; padding:7px 8px 7px 14px; animation:pulseRing 2s ease-out infinite` (`@keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(232,101,76,.4)}70%{box-shadow:0 0 0 14px rgba(232,101,76,0)}100%{box-shadow:0 0 0 0 rgba(232,101,76,0)}}`). Label `font:700 12px 'Readex Pro'; #16302E` ("Baba flagged this for you" / "بابا رفع لك هذه"). From-avatar `30×30; border-radius:50%; background:#E8654C; color:#FBF7EF; font:700 13px Rubik`.
- **B12 · Title** — `font:800 26px/1.15 Rubik; #16302E; margin-top:22px; max-width:260px; animation:rise .4s ease both` (`@keyframes rise{0%{translateY(14px);opacity:0}100%{translateY(0);opacity:1}}`). Copy: "“Learn ‘I love you’ with me.”" / "«تعلّم ‘أحبّك’ معي.»" (sign name dynamic).
- **B13 · Glyph tile** — `150×150; border-radius:36px; background:linear-gradient(160deg,#0F6E6A,#0A4F4C); margin-top:22px; box-shadow:0 14px 34px rgba(15,110,106,.3)`, centered glyph `font-size:74px` (🤟). Handshape/emoji NEVER mirrors.
- **B14 · Body** — `font:400 14px/1.5 'Readex Pro'; #5C726F; max-width:250px; margin-top:20px`. Copy "Baba wants to learn this sign together. Practise it, then surprise each other." / "يريد بابا تعلّم هذه الإشارة معًا. تمرّن عليها ثم فاجئا بعضكما." (name dynamic).
- **B15 · Footer actions** — `flex:none; padding:12px 26px 20px; display:flex; flex-direction:column; gap:9px`. Primary: full `background:#E8654C; color:#FBF7EF; font:700 16px Rubik; height:54px; border-radius:17px; box-shadow:0 5px 0 #C54F3A; border:none`; active `transform:translateY(4px); box-shadow:0 1px 0 #C54F3A`. Copy "Learn it together →" / "لنتعلّمها معًا ←" (arrow mirrors) → wire to `go({name:"camera", targetSignId: firstFlaggedGradable})`. Secondary: full `background:none; color:#5C726F; font:600 14px 'Readex Pro'; padding:8px; border:none`. Copy "Maybe later" / "ربما لاحقًا" → `go({name:"family"})`.

### STATE D — Family feed (`feed`) — LIGHT · NET-NEW (optional)
Background `#F6EFE3`. Scroll column `padding:6px 22px 20px`. No existing component — only build if adding the activity feed.

- **B16 · Header** — title `font:800 25px/1.1 Rubik; #16302E; margin-top:4px` "Family feed" / "أخبار العائلة"; body `font:400 13px/1.35 'Readex Pro'; #5C726F; margin-top:3px` "What everyone's been up to." / "ماذا فعل الجميع مؤخرًا.".
- **B17 · Feed list** — `display:flex; flex-direction:column; gap:11px; margin-top:16px`. Item card: flex row center `gap:11px; border-radius:15px; padding:12px; animation:rise .35s ease both`. Normal item: `background:#FBF7EF; border:1px solid #EDE3D2`. Flag item: `background:#FBF3EF; border:1px solid #F5C9BE`. Avatar `40×40; border-radius:50%; font:800 16px Rubik; background:e.color; color:e.ink`. Text `font:500 13px/1.35 'Readex Pro'; #16302E`; time `font:500 11px 'Readex Pro'; #94A5A2; margin-top:4px`. Trailing tag `font-size:17px` (emoji; a `flag`-type item renders 🚩).

---

## 3 · COPY (every visible string)

Reuse existing keys where the .tsx already wires one; new keys prefixed with proposals below.

| Key (existing/new) | English | Arabic |
|---|---|---|
| `famSwitchTitle` *(new)* | Who's signing? | من سيتعلّم الآن؟ |
| `famSwitchBody` *(new)* | One app, the whole family. | تطبيق واحد، والعائلة كلها. |
| `famAddLearner` *(new; `famAdd` exists but reads "Add a family member")* | Add a learner | أضف متعلّمًا |
| household name | *(data-driven, e.g.)* The Al-Mansoori family | عائلة المنصوري |
| `famLearners` *(new)* | learners | متعلّمين |
| `famSignsTogether` *(new)* | signs together | إشارة معًا |
| `famLearningTogether` *(new)* | Learning together | نتعلّم معًا |
| flag by-line | *(data-driven)* Flagged by Baba — for you | رفعها بابا — لك |
| flag by-line 2 | *(data-driven)* You flagged it — for Sara | رفعتها — لسارة |
| `famInvite` *(new)* | Invite family | ادعُ العائلة |
| `famLeagueNote` *(new)* | We celebrate everyone — no rankings, no losers. Turn on friendly league in settings. | نحتفي بالجميع — لا ترتيب ولا خاسرين. فعّل الدوري الودّي من الإعدادات. |
| `famFlagFrom` *(new; `${name}` + phrase)* | flagged this for you | رفع لك هذه |
| flag detail title | *(data-driven)* "Learn 'I love you' with me." | «تعلّم 'أحبّك' معي.» |
| `famFlagDetailBody` *(new; `{name}` interpolated)* | {name} wants to learn this sign together. Practise it, then surprise each other. | يريد {name} تعلّم هذه الإشارة معًا. تمرّن عليها ثم فاجئا بعضكما. |
| `famLearnTogetherCta` *(new)* | Learn it together → | لنتعلّمها معًا ← |
| `famMaybeLater` *(new)* | Maybe later | ربما لاحقًا |
| `famFeedTitle` *(new; optional)* | Family feed | أخبار العائلة |
| `famFeedBody` *(new; optional)* | What everyone's been up to. | ماذا فعل الجميع مؤخرًا. |
| feed: mastered | *(data)* Mama mastered "Thank you" | أتقنت ماما «شكرًا» |
| feed: wants-to-learn | *(data)* Baba wants to learn "I love you" with you | يريد بابا تعلّم «أحبّك» معك |
| feed: streak | *(data)* Sara reached a 5-day streak | بلغت سارة تتابع ٥ أيام |
| feed: you-flagged | *(data)* You flagged "Hello" for Sara | رفعتِ «مرحبًا» لسارة |
| feed: both-signed | *(data)* You & Mama both signed "Yes" | أشرت أنت وماما «نعم» |
| **Already in i18n — keep:** | | |
| `famTitle` | Family | العائلة |
| `famHousehold` | Your household | أسرتك |
| `famAdd` | Add a family member | أضف فردًا من العائلة |
| `famFlagTitle` | Flag signs we need | حدّد الإشارات التي نحتاجها |
| `famFlagged` | needs this | يحتاج هذه |
| `famBoard` | Signs we can all do | إشارات نتقنها جميعًا |
| `famBoardEmpty` | When every member masters a sign… | عندما يتقن كل أفراد الأسرة إشارة… |
| `famSharedStreak` | Household streak | مواظبة الأسرة |
| `famSignedToday` | signed today | تمرّنوا اليوم |
| `famOnlyDeafFlags` | flags the signs — the curriculum follows them. | يحدد الإشارات — والمنهج يتبعهم. |
| `homeFlagged` | Flagged for your family | مطلوبة من عائلتك |
| `practiceCamera` | Practise with camera | تدرّب بالكاميرا |
| `save` / `cancel` | Save / Cancel | حفظ / إلغاء |

---

## 4 · NEW-I18N (append to `src/i18n.ts` `dict`)

```ts
  // family — reskin (Sawiyya Family.dc.html)
  famSwitchTitle: { en: "Who's signing?", ar: "من سيتعلّم الآن؟" },
  famSwitchBody: { en: "One app, the whole family.", ar: "تطبيق واحد، والعائلة كلها." },
  famAddLearner: { en: "Add a learner", ar: "أضف متعلّمًا" },
  famLearners: { en: "learners", ar: "متعلّمين" },
  famSignsTogether: { en: "signs together", ar: "إشارة معًا" },
  famLearningTogether: { en: "Learning together", ar: "نتعلّم معًا" },
  famInvite: { en: "Invite family", ar: "ادعُ العائلة" },
  famLeagueNote: {
    en: "We celebrate everyone — no rankings, no losers. Turn on friendly league in settings.",
    ar: "نحتفي بالجميع — لا ترتيب ولا خاسرين. فعّل الدوري الودّي من الإعدادات.",
  },
  famFlagFrom: { en: "flagged this for you", ar: "رفع لك هذه" },
  famFlagDetailBody: {
    en: "{name} wants to learn this sign together. Practise it, then surprise each other.",
    ar: "يريد {name} تعلّم هذه الإشارة معًا. تمرّن عليها ثم فاجئا بعضكما.",
  },
  famLearnTogetherCta: { en: "Learn it together →", ar: "لنتعلّمها معًا ←" },
  famMaybeLater: { en: "Maybe later", ar: "ربما لاحقًا" },

  // family feed — OPTIONAL (net-new feature; only if the feed is built)
  famFeedTitle: { en: "Family feed", ar: "أخبار العائلة" },
  famFeedBody: { en: "What everyone's been up to.", ar: "ماذا فعل الجميع مؤخرًا." },
```

`famFlagFrom` is used as `` `${name} ${t("famFlagFrom", lang)}` `` (both EN "Baba flagged this for you" and AR "بابا رفع لك هذه" put the name first). `famFlagDetailBody` needs `{name}` interpolation. Feed item strings are fully dynamic templates — build them from event data, not static keys (5 sample shapes listed in COPY).

---

## 5 · MOTION / STATES

- **`float`** — `@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`; `3s ease-in-out infinite` on the switcher's Fanan (B1).
- **`rise`** — `@keyframes rise{0%{transform:translateY(14px);opacity:0}100%{transform:translateY(0);opacity:1}}`; flag-detail title `.4s ease both` (B12); each feed item `.35s ease both` (B17).
- **`pop`** — `@keyframes pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}` — available for member/board cells (existing honeycomb uses `animate-pop-in`).
- **`pulseRing`** — `@keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(232,101,76,.4)}70%{box-shadow:0 0 0 14px rgba(232,101,76,0)}100%{box-shadow:0 0 0 0 rgba(232,101,76,0)}}`; `2s ease-out infinite` on the flag-detail incoming badge (B11) — the "warm tap on the shoulder".
- **Button press** — springy hard-shadow affordance: primary CTAs drop their bottom shadow and `translateY` on active (teal B9: `translateY(3px)` shadow→`0 1px 0`; coral B15: `translateY(4px)` shadow→`0 1px 0`; add-learner B4: `translateY(2px)`). HANDOFF Motion: spring-out `cubic-bezier(.34,1.56,.64,1)` 260ms on release.
- **Selected profile** — chosen learner gains the green `box-shadow:0 0 0 3px #1F8A5B` ring + success check badge (B3). Existing `aria-pressed` + teal ring in code → adopt the design's green success ring for the switcher.
- **States:** *no profile* → `NoProfileFallback` (guard stays). *Empty flags* (hub) → hide B8 list, keep coral flag CTA; existing shows only-Deaf-flags note. *Empty board* → `famBoardEmpty` copy. *Adding member* → inline elevated card with name input + role chips (existing). *FlagPicker empty search* → "No signs match your search." card. No loading/error states in this surface (data is local store).
- **Reduce-motion:** freeze `float`, `pulseRing`, and the shadow-pulse; keep instant state changes (HANDOFF §Motion). Guard all with `motion-safe:`.

---

## 6 · RTL

- **Mirrors:** whole layout under `dir="rtl"`; member-row + flags-list reading order; the "Learn it together →" arrow (`←` in AR, or icon `rtl:rotate-180`); `milestonePill` chevron; profile-grid flow; selected-badge corner (use `inset-inline-end` not `right`); shell push/pop enters from the leading edge.
- **Never mirrors:** **Fanan** (B1 wave), the **checkmark** in the selected badge (B3), sign **glyphs/handshapes/emoji** (B8 glyph box, B13 74px glyph), avatar initials, coral pulse-ring badge geometry.
- **Numerals:** Arabic panel uses Eastern-Arabic glyphs via `num(...)` — member streaks (`٧ ١٢ ٣ ٥`), "٤ متعلّمين · ٦٣ إشارة معًا", flag counts, "٥ أيام". `٪` trails if any percent shown. Never mix scripts on one panel.
- **Secondary gloss lines** follow the content language (existing pattern: `dir={lang === "ar" ? "ltr" : "rtl"}` on the opposite-script line).

---

**Summary:** 17 layout blocks across 4 states (switcher / hub / flag detail / feed). 14 new required i18n keys (`famSwitchTitle`, `famSwitchBody`, `famAddLearner`, `famLearners`, `famSignsTogether`, `famLearningTogether`, `famInvite`, `famLeagueNote`, `famFlagFrom`, `famFlagDetailBody`, `famLearnTogetherCta`, `famMaybeLater`) + 2 optional feed keys (`famFeedTitle`, `famFeedBody`).
