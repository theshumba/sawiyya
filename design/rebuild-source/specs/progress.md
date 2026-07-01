# Progress — Build Spec (reskin)

Source design: `design/rebuild-source/Sawiyya Progress.dc.html` (Turn 9, "Progress & stats")
Screenshots: `screenshots/01-prog.png` (oasis), `02-prog.png` (stats+heatmap), `03-prog.png` (achievements), `04-prog.png` (family league)
Existing impl: `src/screens/Progress.tsx`

## Design intent vs. existing impl (read first)

The **design turns Progress into a 4-tab surface**: `Your oasis` · `Stats` · `Achievements` · `Family league`. The **existing `Progress.tsx` is a single-scroll live-data view** (stats strip → weekly streak → oasis hero → CTA → Constellation → Coming Up → celebration overlay).

The reskin must:
1. **Keep every live-data wiring and navigation call listed in §PRESERVE** — they are the functional contract.
2. **Adopt the design's visual language** (oasis scene, card treatment, hard shadows, colours, type) for the surfaces that already have data (oasis/stats/streak/constellation/coming-up).
3. Add the tab shell + the **new Stats-heatmap, Achievements, and Family-league** surfaces. These three are **NOT wired to a data source in the current app** — build them from the design's literal mock values as static/placeholder surfaces (or gate behind a "coming soon" if the build agent prefers), and flag any that need a future data hook. Do **not** delete the live oasis / constellation / coming-up / celebration behaviour to do this.

If the build agent must ship minimal: the **oasis tab is the live default**; stats/achievements/league can render the design literals as static placeholders.

---

## 1 · PRESERVE — functional contract (must stay wired)

Quote = exact identifier in `Progress.tsx`. All must survive the reskin.

**Store / hooks**
- `const app = useApp();` — root store.
- `const { go } = useUi();` — navigation dispatcher (every route below goes through `go`).
- `const profile = activeProfile(app);` + guard `if (!profile) return <NoProfileFallback />;` — keep the no-profile fallback.
- `const lang = profile.language;` / `const rtl = lang === "ar";`
- `const prog = app.progress[profile.id] ?? {};`

**Derived live data (keep all computations)**
- `mastered` = `Object.values(prog).filter((p) => p.masteryLevel >= 3).length` → feeds the "signs mastered/planted" numbers + oasis floating stat + celebration copy.
- `seen` = `masteryLevel >= 1` count.
- `a1Done` = `A1_SIGNS.filter((s) => (prog[s.id]?.masteryLevel ?? 0) >= 2).length`.
- `alphaTaught` = `ALPHABET.filter((s) => isTrained(s.id)).length` → Constellation "found" count.
- `due = dueSignIds(app, profile.id);` and `reviewCount = due.length;`
- `upcoming` = `Object.entries(app.srs[profile.id] ?? {}).filter(...).sort(...).slice(0, 6)` → Coming-Up later rows.
- `totalTracked` / `growth = Math.round(((a1Done + alphaTaught) / Math.max(1, totalTracked)) * 100)` → oasis "World growth"/"Next milestone" fill.
- `oasisLevel = Math.max(1, Math.floor(mastered / 4) + 1)` → "Level N Oasis" badge.
- `activeSet` (`new Set(profile.activeDays ?? [])`), `todayDow`, `week` memo, `dayKey(back)` → weekly streak dots + heatmap wiring.
- `goalXp = GOAL_XP[profile.dailyGoal];` → passed to celebration.

**Celebration (keep intact)**
- `celebrating` / `setCelebrating`, `lastStreak = useRef(profile.streak)`, the `useEffect(... profile.streak > lastStreak.current && profile.streak > 1 ...)`, `<StreakCelebration ... />`, `<Confetti />`, `celebrate()`. Fires once on a fresh streak milestone.

**Navigation / handlers (all route through `go`)**
- `startReview()` → `go({ name: "camera", targetSignId: firstDueGradable })` where `firstDueGradable = due.map(signById).find((s) => s?.cameraGradable)?.id`.
- CTA fallback → `go({ name: "camera" })`.
- Constellation `onTap={(id) => go({ name: "camera", targetSignId: id })}`.
- ForecastRow / empty-state buttons → `go({ name: "camera", targetSignId: sign.id })` and `go({ name: "camera" })`.
- ScreenShell close → `onClose={() => go({ name: "home" })}`.

**Component / prop contract**
- `<ScreenShell lang={lang} chrome="takeover" title={headerTitle} onClose={...}>` — keep the takeover shell.
- `<Constellation lang alphaTaught onTap />`, `<ForecastRow sign lang tone badge onClick />`, `<StreakCelebration profile lang mastered goalXp week onContinue />` — signatures preserved.
- Icons via `<Icon name=... fill className=... />`; `<Title/> <Subtitle/> <Eyebrow/>`.

**Content / helpers**
- `A1_SIGNS`, `ALPHABET`, `signById` from `../content/signs`; `isTrained` from `../recognizer/knn`; `num`, `pick`, `t` from `../i18n`.
- `DAY_LABELS_EN = ["M","T","W","T","F","S","S"]`, `DAY_LABELS_AR = ["إث","ث","أر","خ","ج","س","ح"]`.

**Assets**
- `/brand/stitch-32.png` — oasis hero image (existing). Design substitutes an illustrated oasis scene + `Fanan pose="cheer"`; either keep the PNG or rebuild the scene per §2, but the hero must remain non-interactive (`aria-hidden`, NOT a button).
- `/brand/stitch-46.png` — celebration mascot (keep).

**i18n calls already in file (do NOT rename):** `t("xp")`, `t("prMastered")`, `t("prUpcoming")`, `t("prNothingDue")`, `t("homeReviewDue")`, `t("practiceCamera")`, `t("obContinue")`, `t("close")`. Existing `pick(lang, EN, AR)` literals (e.g. "The World You're Building", "Coming Up", "The Constellation", "Weekly streak", "World growth", "Level N Oasis", "Start Review Session", "Keep building") may remain as literals or be migrated to the new keys in §4 — either is acceptable; do not break them.

---

## 2 · LAYOUT — target design, ordered blocks

Global: screen bg `#F6EFE3`; canvas behind `#F1E7D6`; cards `#FBF7EF`; hairline border `1px solid #EDE3D2`; card elevation `box-shadow: 0 2px 0 #EDE3D2`. Fonts: **Rubik** (headings/UI/numbers), **Readex Pro** (body + all Arabic). Section titles `font: 800 25px/1.1 Rubik; color:#16302E`. Body sub `font: 400 13px/1.35 Readex; color:#5C726F`.

### Block A — ScreenShell header (PRESERVED)
Takeover shell with `title` + close. Keep existing behaviour. Title copy per active tab (see COPY).

### Block B — Tab bar (NEW)
- Container: `bg #FBF7EF; border 1px #EDE3D2; border-radius 18px; padding 12px; box-shadow 0 2px 0 #EDE3D2; display flex; gap 8px; flex-wrap wrap; margin-top 22px`.
- Tab button: `font 700 12px/1 Rubik; padding 10px 14px; border-radius 12px; border none; cursor pointer`.
  - **Active:** `background #0F6E6A; color #FBF7EF; box-shadow 0 3px 0 #0A4F4C`.
  - **Inactive:** `background #F6EFE3; color #5C726F; box-shadow inset 0 0 0 1px #EDE3D2`.
- Order: `Your oasis` → `Stats` → `Achievements` → `Family league`. Default active = **oasis**.

### Block C — OASIS tab (LIVE data; screenshot 01)
Scroll area `padding 6px 22px 20px`.
1. Title `font 800 25px Rubik #16302E` — copy `prOasisTitle`.
2. Body `font 400 13px Readex #5C726F; margin-top 3px` — copy `prOasisBody`.
3. **Oasis scene** — `position relative; height 236px; border-radius 22px; overflow hidden; margin-top 16px; background linear-gradient(180deg,#FBF7EF 0%,#FBF3E6 55%,#F0E4CC 100%)`. Non-interactive.
   - Sun: `top 20px; right 24px (inset-inline-end); 44×44; border-radius 50%; background #F0C879; box-shadow 0 0 0 10px rgba(240,200,121,.25)`.
   - Sand mound: `bottom 0; height 96px; background #EBD9B6; border-radius 50% 50% 0 0 / 40px 40px 0 0`.
   - Water pool: `bottom 26px; centered; 150×52; border-radius 50%; background #0F6E6A; box-shadow inset 0 4px 0 rgba(255,255,255,.15)`.
   - Palm ×2: trunk `#C89A3D` (9×64 / 8×50, radius 5px); fronds `#0F6E6A` with darker `#0A4F4C` centre leaf; `animation: sway 4s / 4.6s ease-in-out infinite` (`@keyframes sway {0%,100%{rotate:-3deg}50%{rotate:3deg}}`, transform-origin bottom center).
   - Sprout: stem `#0F6E6A` (5×16), leaf `#1F8A5B` (14×8 radius 50%).
   - **Fanan** `pose="cheer" scale 0.5` (~62×62px), `bottom 8px; right 14px; animation: float 3s ease-in-out infinite` (`@keyframes float {0%,100%{translateY(0)}50%{translateY(-6px)}}`).
   - (Fallback: keep `/brand/stitch-32.png` object-cover if the illustrated scene is out of scope.)
4. **Two stat tiles** — `display flex; gap 10px; margin-top 14px`. Each: `flex 1; bg #FBF7EF; border 1px #EDE3D2; border-radius 16px; padding 13px; text-align center`. Value `font 800 24px/1 Rubik`, label `font 600 11px/1.2 Readex #5C726F; margin-top 4px`.
   - Tile 1 (teal): value colour `#0F6E6A`, number = live `mastered` (design "18"); label `prPlanted`.
   - Tile 2 (gold): value colour `#E6B24C`, number = live "palms grown" (map to `alphaTaught` or `oasisLevel`; design "2"); label `prPalmsGrown`.
5. **Next-milestone card** — `bg #FBF7EF; border 1px #EDE3D2; border-radius 16px; padding 14px; margin-top 12px`.
   - Row: label `prNextMilestone` `font 600 12px Readex #16302E`; value `font 600 12px #5C726F` = `{done} / {target}` (live: design "18 / 25").
   - Track: `height 9px; border-radius 99px; background #EDE3D2; overflow hidden`. Fill: `height 100%; width {growth}% (design 72%); background linear-gradient(90deg,#F0C879,#E6B24C); border-radius 99px`. **Fill mirrors in RTL.**

> Keep the live **Constellation** and **Coming Up / ForecastRow / empty state** sections from the existing impl, restyled to the card system above (they have no design equivalent on the oasis tab but carry required data). Constellation stays `dir="ltr"` grid; empty state uses `t("prNothingDue")` + `t("practiceCamera")`.

### Block D — STATS tab (screenshot 02)
1. Title `prStatsTitle` (800 25px).
2. **Stat grid 2×2** — `display grid; grid-template-columns 1fr 1fr; gap 10px; margin-top 14px`. Each cell: `bg #FBF7EF; border 1px #EDE3D2; border-radius 16px; padding 14px`. Value `font 800 26px/1 Rubik {color}`; label `font 600 11px/1.2 Readex #5C726F; margin-top 5px`.
   - `18` `#0F6E6A` — `prStatMastered`
   - `92%` `#0F6E6A` — `prAvgAccuracy`
   - `340` `#C89A3D` — `prMinutesSigned`
   - `9` `#E8654C` — `prBestStreak`
   (Wire to live values where available: mastered → cell 1; best streak → `profile.streak`/best. Accuracy + minutes have no source → static placeholder, flag for future hook.)
3. Heatmap label `font 700 11px/1 ui-monospace,Menlo; letter-spacing .1em; text-transform uppercase; color #0F6E6A; margin-top 22px` — `prThisMonth`.
4. **Heatmap card** — `bg #FBF7EF; border 1px #EDE3D2; border-radius 16px; padding 16px; margin-top 11px`.
   - Grid: `display grid; grid-template-columns repeat(7,1fr); gap 6px`. 35 cells, each `aspect-ratio 1; border-radius 4px`. Shade scale (4 levels): `['#EDE3D2','#9DC6C2','#3E9A93','#0F6E6A']`. Wire intensity from `activeSet`/`profile.activeDays`; fall back to design levels array `[0,1,0,2,3,1,0, 1,2,3,3,1,0,0, 0,1,2,3,2,3,1, 2,3,1,0,1,2,3, 1,0,2,3,3,2,1]`.
   - Legend: `display flex; align-items center; justify-content flex-end; gap 5px; margin-top 12px`. `prLess` `font 500 10px Readex #94A5A2` → four `11×11 border-radius 3px` swatches (`#EDE3D2`,`#9DC6C2`,`#3E9A93`,`#0F6E6A`) → `prMore`. **Legend order mirrors in RTL** (less/more swap sides — see screenshot 02 AR panel).

### Block E — ACHIEVEMENTS tab (screenshot 03)
1. Title `prAchievements` (800 25px).
2. Body `prAchieveSummary` — `font 400 13px Readex #5C726F; margin-top 3px` (design "4 of 7 unlocked." / "٤ من ٧ مفتوحة.").
3. **Badge grid** — `display grid; grid-template-columns 1fr 1fr; gap 11px; margin-top 16px`.
   - Card: `display flex; flex-direction column; align-items center; padding 16px 10px; border-radius 16px; background #FBF7EF`.
     - **Earned:** `border 2px solid #E6B24C; opacity 1`. Icon circle `52×52; border-radius 50%; background #F6EFE3; font-size 25px`. Name `font 700 13px Rubik #16302E; margin-top 9px`.
     - **Locked:** `border 2px dashed #C7BBA4; opacity 0.72`. Icon circle `background #EDE3D2; filter grayscale(0.7)`. Name colour `#94A5A2`.
   - Status line: `font 500 10px/1.2 Readex #94A5A2; margin-top 3px; text-align center`.
   - Items (glyph, name-key, status-key, earned):
     1. `🌱` `prAchFirstSign` · `prUnlocked` · earned
     2. `🔥` `prAch7Day` · `prUnlocked` · earned
     3. `🤟` `prAch5Words` · `prUnlocked` · earned
     4. `أ` `prAchAlphabetStarted` · `prUnlocked` · earned
     5. `👪` `prAchFamilyFlag` · status "2 / 5 signs"/"٢ / ٥ إشارات" · locked
     6. `🏆` `prAchWholeAlphabet` · status "12 / 28"/"١٢ / ٢٨" · locked
   (Static/placeholder unless a badge store exists — flag for future data hook.)

### Block F — FAMILY LEAGUE tab (screenshot 04)
1. Title `prLeagueTitle` (800 25px).
2. Body `prLeagueBody` (`font 400 13px Readex #5C726F; margin-top 3px`).
3. **Warm note** — `display flex; align-items center; gap 9px; background #E6F0EE; border 1px #C9E0DC; border-radius 14px; padding 11px 13px; margin-top 14px`. Leading `20×20; border-radius 6px; background #0F6E6A` square. Text `prLeagueWarm` `font 600 12px/1.3 Readex #0F6E6A`.
4. **Ranked rows** — `display flex; flex-direction column; gap 10px; margin-top 14px`.
   - Row: `display flex; align-items center; gap 11px; border-radius 15px; padding 11px 13px`.
     - "You" row (Layla): `background #FBF3EF; border 1px #F5C9BE`.
     - Others: `background #FBF7EF; border 1px #EDE3D2`.
   - Rank `font 800 15px/1 Rubik #94A5A2; width 18px; flex none` (AR uses `١٢٣٤`).
   - Avatar `38×38; border-radius 50%; flex none; font 800 15px Rubik`; bg = member colour; text `#16302E` if bg is gold `#E6B24C` else `#FBF7EF`.
   - Middle: name `font 700 14px/1.1 Rubik #16302E`; bar track `height 6px; border-radius 99px; background #EDE3D2; margin-top 5px` with fill `linear-gradient(90deg,#F0C879,#E6B24C); border-radius 99px; width = xp/240·100%` (**fill mirrors RTL**).
   - XP `font 800 14px/1 Rubik #0F6E6A; flex none`.
   - Members (name, initial, xp, avatar-bg): `Mama/M/240/#0F6E6A`, `Layla/L/180/#E6B24C` (you), `Sara/S/120/#0A4F4C`, `Baba/B/90/#E8654C`.
5. **Competition toggle card** — `display flex; align-items center; justify-content space-between; background #FBF7EF; border 1px #EDE3D2; border-radius 14px; padding 13px 14px; margin-top 16px`.
   - Left: label `prCompetition` `font 700 13px Rubik #16302E`; hint `prCompetitionHint` `font 400 11px Readex #94A5A2; margin-top 2px`.
   - Toggle (OFF): `46×27; border-radius 99px; background #D6CDBB; position relative`. Knob `21×21; border-radius 50%; background #FBF7EF; box-shadow 0 1px 3px rgba(0,0,0,.25); top 3px; inset-inline-start 3px`. Off by default; opt-in. (Flag: needs a real household-competition setting to wire.)

### Block G — StreakCelebration overlay (PRESERVED)
Full-screen `bg #16302E`, gold wordmark, `/brand/stitch-46.png`, confetti, day dots, motivational note, `t("obContinue")` CTA. Keep as-is.

---

## 3 · COPY — every visible string

| Key | English | Arabic (verbatim from RTL panel) |
|---|---|---|
| `prTabOasis` | Your oasis | واحتك |
| `prTabStats` | Stats | إحصاءات |
| `prTabAchieve` | Achievements | الإنجازات |
| `prTabLeague` | Family league | دوري العائلة |
| `prOasisTitle` | The world you're building | العالم الذي تبنينه |
| `prOasisBody` | Every sign you learn plants something new. | كل إشارة تتعلّمينها تزرع شيئًا جديدًا. |
| `prPlanted` | signs planted | إشارة مزروعة |
| `prPalmsGrown` | palms grown | نخلتان |
| `prNextMilestone` | Next milestone | المحطة التالية |
| (milestone value) | 18 / 25 (live) | ١٨ / ٢٥ (live, Eastern digits via `num`) |
| `prStatsTitle` | Your stats | إحصاءاتك |
| `prStatMastered` | Signs mastered | إشارة مُتقَنة |
| `prAvgAccuracy` | Avg accuracy | متوسط الدقّة |
| `prMinutesSigned` | Minutes signed | دقيقة إشارة |
| `prBestStreak` | Best streak | أطول تتابع |
| `prThisMonth` | This month | هذا الشهر |
| `prLess` | less | أقل |
| `prMore` | more | أكثر |
| `prAchievements` | Achievements | الإنجازات |
| `prAchieveSummary` | {n} of {total} unlocked. (design: 4 of 7 unlocked.) | ٤ من ٧ مفتوحة. |
| `prUnlocked` | Unlocked | مفتوح |
| `prAchFirstSign` | First sign | أول إشارة |
| `prAch7Day` | 7-day streak | تتابع ٧ أيام |
| `prAch5Words` | 5 words | ٥ كلمات |
| `prAchAlphabetStarted` | Alphabet started | بدء الأبجدية |
| `prAchFamilyFlag` | Family flag | علم عائلي |
| `prAchWholeAlphabet` | Whole alphabet | الأبجدية كاملة |
| `prLeagueTitle` | Family league | دوري العائلة |
| `prLeagueBody` | This week, together. | هذا الأسبوع، معًا. |
| `prLeagueWarm` | We climb together — no losers here, only progress. | نصعد معًا — لا خاسرين هنا، فقط تقدّم. |
| `prCompetition` | Friendly competition | منافسة ودّية |
| `prCompetitionHint` | Off by default · opt-in anytime | مطفأة افتراضيًا · فعّلها متى شئت |

**Reused existing keys on this screen:** `xp`, `prMastered`, `prUpcoming`, `prNothingDue`, `homeReviewDue`, `practiceCamera`, `obContinue`, `close`. Live-data numbers all go through `num(value, lang)` (Eastern-Arabic digits in AR); `%` renders as `٪` trailing in AR.

**Notes / caveats:**
- `prPalmsGrown` AR "نخلتان" is grammatically *dual* ("two palms"). If the live count ≠ 2, use a count-agnostic AR ("نخلة مزروعة") — flag to Melusi; verbatim design value retained above.
- Achievement status strings "2 / 5 signs" / "12 / 28" are inline literals (contain live-style counts) — render with `num` + `pick`, no dedicated key needed beyond the name keys.

---

## 4 · NEW-I18N — append to `src/i18n.ts`

Only keys not already present. Ready to paste inside the strings object (near the `// progress` group):

```ts
  // progress — reskin (Turn 9 design)
  prTabOasis: { en: "Your oasis", ar: "واحتك" },
  prTabStats: { en: "Stats", ar: "إحصاءات" },
  prTabAchieve: { en: "Achievements", ar: "الإنجازات" },
  prTabLeague: { en: "Family league", ar: "دوري العائلة" },
  prOasisTitle: { en: "The world you're building", ar: "العالم الذي تبنينه" },
  prOasisBody: { en: "Every sign you learn plants something new.", ar: "كل إشارة تتعلّمينها تزرع شيئًا جديدًا." },
  prPlanted: { en: "signs planted", ar: "إشارة مزروعة" },
  prPalmsGrown: { en: "palms grown", ar: "نخلتان" },
  prNextMilestone: { en: "Next milestone", ar: "المحطة التالية" },
  prStatsTitle: { en: "Your stats", ar: "إحصاءاتك" },
  prStatMastered: { en: "Signs mastered", ar: "إشارة مُتقَنة" },
  prAvgAccuracy: { en: "Avg accuracy", ar: "متوسط الدقّة" },
  prMinutesSigned: { en: "Minutes signed", ar: "دقيقة إشارة" },
  prBestStreak: { en: "Best streak", ar: "أطول تتابع" },
  prThisMonth: { en: "This month", ar: "هذا الشهر" },
  prLess: { en: "less", ar: "أقل" },
  prMore: { en: "more", ar: "أكثر" },
  prAchievements: { en: "Achievements", ar: "الإنجازات" },
  prAchieveSummary: { en: "{n} of {total} unlocked.", ar: "{n} من {total} مفتوحة." },
  prUnlocked: { en: "Unlocked", ar: "مفتوح" },
  prAchFirstSign: { en: "First sign", ar: "أول إشارة" },
  prAch7Day: { en: "7-day streak", ar: "تتابع ٧ أيام" },
  prAch5Words: { en: "5 words", ar: "٥ كلمات" },
  prAchAlphabetStarted: { en: "Alphabet started", ar: "بدء الأبجدية" },
  prAchFamilyFlag: { en: "Family flag", ar: "علم عائلي" },
  prAchWholeAlphabet: { en: "Whole alphabet", ar: "الأبجدية كاملة" },
  prLeagueTitle: { en: "Family league", ar: "دوري العائلة" },
  prLeagueBody: { en: "This week, together.", ar: "هذا الأسبوع، معًا." },
  prLeagueWarm: { en: "We climb together — no losers here, only progress.", ar: "نصعد معًا — لا خاسرين هنا، فقط تقدّم." },
  prCompetition: { en: "Friendly competition", ar: "منافسة ودّية" },
  prCompetitionHint: { en: "Off by default · opt-in anytime", ar: "مطفأة افتراضيًا · فعّلها متى شئت" },
```

> `prAchieveSummary` uses `{n}`/`{total}` placeholders — interpolate with `num` after `t()` (match existing app interpolation pattern), or hardcode "4 of 7" if no badge store exists yet.

---

## 5 · MOTION / STATES

**Animations (from design `<style>`):**
- `@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }` — Fanan in oasis, 3s ease-in-out infinite.
- `@keyframes sway { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }` — palms, 4s / 4.6s ease-in-out infinite, transform-origin bottom center.
- `@keyframes rise { 0%{translateY(12px);opacity:0} 100%{translateY(0);opacity:1} }` — screen/element entrance.
- Existing impl extras to keep: growth-bar sheen `motion-safe:animate-pulse`; celebration `motion-safe:animate-rise`; `Confetti` (linear fall + spin, 1.4s).

**Transitions:** tab switch uses Ease-standard `cubic-bezier(.4,0,.2,1) 220ms`. Button press = Spring-out `cubic-bezier(.34,1.56,.64,1) 260ms`; on press translateY(4px) and drop the hard shadow (signature button). Constellation node lit-state `transition-all duration-500`.

**Interactive states:**
- Tab buttons: active vs inactive per §2 Block B.
- Achievement cards: earned (solid gold border, full opacity) vs locked (dashed `#C7BBA4`, opacity 0.72, greyscale icon).
- League "you" row highlighted (coral-tinted `#FBF3EF` / border `#F5C9BE`).
- Competition toggle: OFF default (knob at start edge, track `#D6CDBB`); ON = knob slides to end edge, track → `#0F6E6A` (infer; design shows OFF only).

**Empty state:** Coming-Up empty (`due.length === 0 && upcoming.length === 0`) → keep existing card: `task_alt` icon in `bg-teal/10`, `t("prNothingDue")`, sub line, `t("practiceCamera")` button → `go({name:"camera"})`.

**Loading / error:** none shown in design. No-profile → `<NoProfileFallback />` (preserved). Stats/achievements/league with no data source → render design placeholders (or a neutral "coming soon" if the build agent prefers not to ship fake numbers) — do not error.

**Celebration:** full-screen `StreakCelebration` fires once on fresh streak milestone (preserved). Confetti bursts on mount; mascot `animate-rise`.

---

## 6 · RTL (HANDOFF §2)

Arabic panel is authoritative; design the AR screen first.

**MIRRORS (swap start/end):**
- Reading flow, text alignment, tab order, section title/body alignment.
- Sun position (`right 24px` → use `inset-inline-end`), Fanan `bottom/right` → logical end edge.
- All progress fills (next-milestone bar, league XP bars) fill from the start (right in RTL).
- Heatmap legend order: `less …swatches… more` reverses (see screenshot 02 AR — "أقل" and swatches sit at start edge, "أكثر" trails).
- League row layout: rank at start, XP at end (logical) — mirrors.
- Toggle knob position via `inset-inline-start`.
- Card internal `justify-content: space-between` rows naturally mirror.

**NEVER MIRRORS:**
- Status-bar clock `9:41` and battery glyph.
- **Fanan** (mascot) — never flips; same character, `pose="cheer"`.
- The **checkmark** (weekly streak / celebration day dots) and any handshape/sign glyphs (🤟, `أ` handshape) — physical, never mirror.
- Camera / play / record glyphs (CTA `videocam` in existing impl already gated `rotate-180` for arrow-style icons — but the camera glyph itself must NOT mirror; only directional arrows/chevrons flip, e.g. `arrow_forward` in celebration).
- Logos / wordmark ("Sawiyya" / "سويّة").
- Numerals: AR uses Eastern-Arabic `٠١٢٣٤٥٦٧٨٩` via `num(v,lang)`; `%` → `٪` trailing. Never mix scripts on one screen.

---

## Summary
7 layout blocks (ScreenShell header, tab bar, oasis tab, stats+heatmap tab, achievements tab, family-league tab, streak-celebration overlay). 31 new i18n keys.
