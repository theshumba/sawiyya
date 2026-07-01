# Signs dictionary — reskin spec

Source design: `design/rebuild-source/Sawiyya Signs.dc.html`
Screenshots: `screenshots/01-signs3.png` (alphabet grid) · `02-signs3.png` (sign detail — "I love you", graded) · `03-signs3.png` (sign detail — "Hello", motion/demo) · `04-signs3.png` (search, live results + recent)
Existing implementation: `src/screens/AllSigns.tsx`

> **Scope note.** The `.dc.html` renders FOUR states side-by-side (`dict`, `alpha`, `detail`, `search`) selected by a demo tab bar at the top of the canvas. That tab bar (`Dictionary / Alphabet grid / Sign detail / Search`) and the "Turn 6" pill are a **design harness, not app chrome** — do NOT build them. All four states collapse into the ONE shipping screen `AllSigns.tsx`, which already handles: browse-list/grid (`dict`), search (`search` — same screen, controlled by `query` state), and the detail sheet/panel (`detail` — controlled by `selectedId`). The **alphabet grid (`alpha`) is a NEW visual treatment** — today `AllSigns` renders alphabet signs as ordinary grid cards filtered by the `alphabet` chip; the design shows a dedicated 4-col letter grid with a progress bar. See §5 for how to fold this in without adding a route. Every color/size/copy value below is lifted literally from the source `.dc.html` and the `DETAIL`/`STR` data blocks.

---

## 1 · PRESERVE — functional contract (must stay wired)

All identifiers below live in `src/screens/AllSigns.tsx` and MUST survive the reskin unchanged. The reskin repaints; it must not sever any of these.

### Store hooks / selectors
- `const app = useApp();` — `import { activeProfile, useApp } from "../store/app"`
- `const go = useUi((s) => s.go);` — navigation dispatcher, `import { useUi } from "../store/ui"`
- `const toggleFlag = useApp((s) => s.toggleFlag);` — family-list flag toggle
- `const addToReview = useApp((s) => s.addToReview);` — SRS "Add to Daily Review"
- `const profile = activeProfile(app);` → `if (!profile) return <NoProfileFallback />;` — keep the no-profile guard AS the early return.
- `const lang = profile?.language ?? "en";` and `const rtl = lang === "ar";` — drive `ScreenShell lang` + every `pick(...)`/`t(...)` + the `dir` on the "how to sign" block.
- `const progress = (profile && app.progress[profile.id]) || {};`
- `const cards = (profile && app.srs[profile.id]) || {};`
- `const flaggedIds = useMemo(() => new Set(app.flags.filter((f) => f.active).map((f) => f.signId)), [app.flags]);`
- `import { isDue } from "../store/srs";` — used inside `statusOf`.

### Local state (keep all three)
- `const [filter, setFilter] = useState<Filter>("all");` — chip filter
- `const [query, setQuery] = useState("");` — search box (this is what the design's `search` state represents; same screen)
- `const [selectedId, setSelectedId] = useState<string | null>(null);` — open detail sheet/panel
- Inside `DetailPanel`: `const [watched, setWatched] = useState(false);` — Watch → Watch Again toggle (pure preview, NO store write — comment at line 409 is load-bearing: browsing must not seed SRS).

### Derived logic (keep intact)
- `statusOf(sign)` — the full priority ladder (flagged → mastered → review-due → letter → unit → new). Powers `STATUS_META` badge on cards.
- `learnedCount` — appended to the "Learned" chip.
- `signs = useMemo(...)` — filter+search pipeline; keep the `unit2 → false` honest-empty rule (lines 99–103) and the `hay` search across `glossEn glossAr code`.
- `selected` — resolves `selectedId` to a `Sign`.
- `FILTERS` array — 5 chips: `all / learned / flagged / alphabet / unit1`. The `alphabet` chip uses `t("prAlphabet", lang)`. Keep this array and its ids.
- `categoryTags(sign, lang)` — the detail-panel semantic tags (Alphabet/Unit 1 + Phrase/Common).
- `flaggedCount = flaggedIds.size;` and `firstGradableFlag` — power the dominant "Practise your N flagged signs" button.
- `practiceSign = (sign) => go({ name: "camera", targetSignId: sign.id });`

### Navigation calls (all destinations MUST remain reachable)
- Dominant flagged button → `firstGradableFlag ? practiceSign(firstGradableFlag) : go({ name: "camera" })`
- Detail primary CTA (gradable only) → `onPractice` → `practiceSign(selected)` → `go({ name: "camera", targetSignId })`
- (No `setScreen`; navigation is `go({...})` from `useUi`. AppNav owns tab nav via `ScreenShell chrome="tabs"` — the in-screen home button is intentionally gone, do not re-add.)

### Event handlers (keep wired)
- Card `onSelect` → `setSelectedId(sign.id)`
- Chip `onClick` → `setFilter(f.id)`
- Search `onChange` → `setQuery(v)`
- Detail `onClose` → `setSelectedId(null)`; mobile backdrop button also calls it.
- Detail `onToggleFlag` → `profile && toggleFlag(selected.id, profile.id)`
- Detail `onAddReview` → `addToReview(selected.id)`
- Detail `onPractice` → `practiceSign(selected)`
- `handleWatch` → `setWatched(true)` (no store write)
- `handleShare` → `navigator.share` / clipboard fallback (mobile Share button)
- Empty-state buttons → `setQuery("")` (Clear search) and `{ setFilter("all"); setQuery(""); }` (Browse all)

### i18n / copy calls already present (keep the EXACT keys)
- `t("prAlphabet", "en")` / `t("prAlphabet", "ar")` — alphabet chip label
- `t("close", lang)` — close-button + backdrop aria-labels
- `t("practiceCamera", lang)` — the gradable-detail primary CTA label
- Every inline `pick(lang, en, ar)` for: dictionary title, sub-line, search placeholder + aria, chip aria-labels, dominant-button copy, empty-state copy, card status labels, detail title/tags/how-to/note/CTA fallback/flag/share/add-review/watch. (Full list in §3 — reuse the identical EN+AR strings.)

### Components to keep
`ScreenShell` (chrome="tabs"), `NoProfileFallback`, `SignGlyph` (the ONE source of truth for the visual — **never** a raw emoji; the design's emoji glyphs are placeholder only), `Card`, `Button`, `Icon`, `Title`, `Chip` (from `../components/Tile`). The mobile bottom-sheet (`animate-rise`, backdrop, grab handle) and desktop docked `aside` panel structure both stay.

> The reskin changes visuals only. The camera route, the profile guard, the flag/review store writes, the SRS-safe Watch preview, the honest empty state, and the `cameraGradable` gate (camera CTA hidden on motion signs) are the contract.

---

## 2 · LAYOUT — target design as ordered blocks

**Device chrome is mock — do NOT build.** Outer bezel `#16302E`, radius `47px`; inner screen radius `40px`, bg `#FBF7EF`; status bar (`9:41`, notch, battery) is fake. The app already supplies chrome via `ScreenShell`. App/canvas background behind everything: `#F1E7D6` (paper/2). Card surface: `#FBF7EF` (paper/0) or `#FFFFFF` for list rows. Hairline: `#EDE3D2`.

> **No Fanan on this screen.** The Signs dictionary carries no mascot pose in any of the four states — the "character" here is the SignGlyph handshape. (Fanan lives on Home/Practice/Celebration/Onboarding.) Do not add a fox.

### STATE A — Dictionary / browse (the default `AllSigns` view; `dict`)

**B1 · Header**
- Title: font `800 26px/1.1 Rubik`, color `#16302E`. EN "All signs" / AR "كل الإشارات". (Existing `.tsx` uses "Sign Dictionary/القاموس" via `Title` + a sub-line "Qatari Sign Language · خليجي". **Keep the existing richer copy** — see §3; the design's shorter "All signs" is the same slot. Either is acceptable; the build agent should keep the existing keys/strings to avoid new i18n, matching design's weight/size.)
- Sub-line (existing): font `~14px 600`, color `#16302E`/60 (`text-ink/60`). "Qatari Sign Language · خليجي".

**B2 · Search field** (in `dict` this is the resting state; see State D for the focused/active variant)
- Container: `display:flex; align-items:center; gap:9px; background:#F6EFE3; border:1px solid #EDE3D2; border-radius:14px; padding:12px 14px; margin-top:14px`.
- Leading icon: the design draws a `15×15px` circle `border:2.5px solid #94A5A2` (a magnifier stand-in) — the app uses the `search` Material icon in `text-teal/60`; keep the app's real icon.
- Placeholder text: font `400 14px 'Readex Pro'`, color `#94A5A2`. EN "Search signs…" / AR "ابحث عن إشارة…".
- *Reskin mapping:* the existing `SearchInput` uses `rounded-2xl border-2 border-line bg-paper py-3.5 ps-12 pe-4` with focus ring `border-teal`. Repaint to match: resting `bg #F6EFE3`, `border 1px #EDE3D2`, `radius 14px`; focus → `border 2px #0F6E6A` (see State D). Keep `ps-12` icon inset.

**B3 · Filter chip row**
- Row: `display:flex; gap:7px; margin-top:12px; overflow-x:auto; padding-bottom:2px` (existing uses `no-scrollbar` + `-mx-5 px-5`).
- Chip (inactive): font `600 12px/1 'Readex Pro'`, `padding:8px 13px`, `border-radius:99px`, bg `#F6EFE3`, color `#5C726F`, `border:1px solid #EDE3D2`.
- Chip (active, first/"All"): bg `#0F6E6A`, color `#FBF7EF`, `border:none`.
- Design shows cats `All · First words · Alphabet · Family · Feelings`. **Keep the app's real filter ids** (`All / Learned / Flagged / Alphabet / Unit 1`) — those are wired to `statusOf`/content; the design's category names are illustrative. The "Learned" chip appends `· {learnedCount}` (active → `text-white/70`, inactive → `text-teal/60`).

**B4 · Dominant flagged action** (only when `flaggedCount > 0`; NOT shown in the static design but preserved)
- Full-width `Button variant="primary" size="lg"`, `videocam` icon `text-2xl`, `margin-bottom:6 (mb-6)`. Copy: EN `Practise your {n} flagged sign(s)` / AR `تدرّب على {n} إشارة محدّدة`. Springy primary button — see §MOTION.

**B5 · Sign list / grid**
- The design's `dict` state renders a **vertical list** of rows; the app renders a **responsive grid** (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4`). Keep the app's grid on ≥sm; you MAY adopt the design's row treatment for the narrow/mobile single-column feel. Both are acceptable — match the design's row/card visual tokens below.
- **List row (design `dict`):** button, `display:flex; align-items:center; gap:12px; width:100%; background:#FFFFFF; border:1px solid #EDE3D2; border-radius:16px; padding:11px; text-align:start`. Rows stacked `gap:10px`.
  - Glyph tile: `48×48px; border-radius:13px; background:#F6EFE3; center; font-size:25px; flex:none` → render `SignGlyph`, not emoji.
  - Name: font `700 15px/1.1 Rubik`, color `#16302E`. Sub (opposite-script gloss): font `500 13px/1.2 'Readex Pro'`, color `#5C726F`, `margin-top:2px`.
  - Trailing badge: see **B6**.
- **Grid card (existing `SignCard`, keep):** `Card variant={selected?"selected":"elevated"}`, `p-5 md:p-6`, centered. Status icon absolute `end-3 top-3`. Glyph well: `aspect-square rounded-2xl bg-sand/60 p-3` holding `SignGlyph text-4xl md:text-5xl`. Label `font-display font-bold` (selected → `text-teal`) with `· code/glossAr` in `text-ink/50`. Status caption: `text-[11px] font-bold uppercase tracking-widest` in `meta.tone`.

**B6 · Type badge (design's `Graded` / `Motion` pill)** — small pill on each row/card:
- Font `700 9px/1 ui-monospace,Menlo`, `letter-spacing:.04em`, uppercase, `padding:6px 9px`, `border-radius:8px`.
- **Graded:** bg `#E6F0EE`, color `#0F6E6A`. **Motion:** bg `#FBEFE6`, color `#C89A3D`.
- Drive off `sign.cameraGradable`: gradable → "Graded"/"مُقيَّم", non-gradable → "Motion"/"حركة". (Existing app uses `STATUS_META` status caption instead; you MAY add this graded/motion pill as an honest signal — see §4 for the optional new keys, or reuse `pick()` inline.)

### STATE B — Alphabet grid (`alpha`; screenshot 01) — NEW treatment

Shown when the **Alphabet** filter chip is active (fold into existing `filter === "alphabet"`, see §5). Replaces the ordinary grid with:

**B1 · Header**
- Title: `800 26px/1.1 Rubik`, `#16302E`. EN "The alphabet" / AR "الأبجدية".
- Body: `400 13px/1.35 'Readex Pro'`, `#5C726F`, `margin-top:3px`. EN "All 28 Arabic letters." / AR "كل الحروف العربية الـ٢٨.".

**B2 · Progress bar**
- Track: `height:8px; border-radius:99px; background:#EDE3D2; overflow:hidden; margin-top:12px`.
- Fill: `height:100%; width:{pct}%; background:linear-gradient(90deg,#F0C879,#E6B24C); border-radius:99px`. (Design hard-codes `25%`; compute from learned-alphabet count.)
- Caption: `600 11px/1 'Readex Pro'`, `#5C726F`, `margin-top:7px`. EN "7 of 28 learned" / AR "٧ من ٢٨ مُتعلَّمة" (compute the numerals; AR uses Eastern-Arabic).

**B3 · Letter grid**
- `display:grid; grid-template-columns:repeat(4,1fr); gap:10px`. Scroll area `padding:14px 22px 20px`.
- Each cell: `aspect-ratio:1; center; border-radius:15px; font:700 26px Rubik`.
  - **Learned:** bg `#0F6E6A`, color `#FBF7EF`.
  - **Current** (next-to-learn): bg `#FBF3EF`, color `#E8654C`, `box-shadow:0 0 0 2px #E8654C` (coral ring).
  - **Locked/upcoming:** bg `#F6EFE3`, color `#16302E`, `box-shadow:inset 0 0 0 1px #EDE3D2`.
- Letters (in this exact visual order, LTR panel): `ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي` (28). **RTL panel:** identical letters, but each row fills start→end from the right (screenshot 01 shows row 1 as `ث ت ب ا` reading right-to-left) — this is the grid mirroring (§6). Letters themselves never mirror.
- Tapping a letter → open its detail (State C) / route to camera for that letter, same as any sign card (`onSelect`).

### STATE C — Sign detail (`detail`; screenshots 02 graded, 03 motion)

This maps to the existing `DetailPanel` (mobile bottom-sheet + desktop docked panel). The design's top example-tab row (`Alif / I love you / Hello`) is a **harness selector**, NOT app UI — do not build it; the real app opens ONE sign's detail from `selectedId`.

**B1 · Demo frame** (the big illustration well)
- Container: `position:relative; border-radius:22px; height:196px; overflow:hidden; center`. (Existing panel uses `aspect-square rounded-3xl border-4 border-white bg-sand` — keep the app's square, apply the striped bg tint below as the gradient overlay.)
- Background (honest graded/motion signal):
  - **Graded sign:** `repeating-linear-gradient(135deg,#0F6E6A,#0F6E6A 15px,#12817b 15px,#12817b 30px)` (teal barber-stripe).
  - **Motion sign:** `repeating-linear-gradient(135deg,#C89A3D,#C89A3D 15px,#d4a94a 15px,#d4a94a 30px)` (gold barber-stripe).
- "Signer demo" badge, top-start: `position:absolute; top:11px; left:11px; font:700 9px/1 ui-monospace,Menlo; letter-spacing:.1em; color:rgba(255,255,255,.85); background:rgba(0,0,0,.28); padding:5px 9px; border-radius:8px`. Copy: `● SIGNER DEMO` / `عرض المُشير ●`. (App's existing Watch chip is the interactive analogue — keep BOTH: this static badge marks the demo, the Watch chip replays.)
- Center medallion: `120×120px; border-radius:50%; background:#FBF7EF; center; font-size:62px; box-shadow:0 12px 30px rgba(0,0,0,.22)` → render `SignGlyph text-8xl` (not emoji).
- Play/replay button, bottom-end: `38×38px; border-radius:50%; background:#E6B24C; color:#16302E; center; box-shadow:0 4px 0 #C89A3D` glyph `▶`. **Never mirrors** (§6) — play triangle stays pointing forward in RTL. Wire to the app's `handleWatch` (Watch/Watch Again).

**B2 · Title row**
- `display:flex; align-items:center; justify-content:space-between; margin-top:14px`.
- Name: font `800 24px/1.05 Rubik`, `#16302E`. Sub (opposite gloss / "كلمة" word-label): font `500 13px 'Readex Pro'`, `#5C726F`, `margin-top:2px`. Existing app appends `· {code|glossAr}` to the title in `text-ink/50` — keep.
- Trailing badge = the B6 graded/motion pill (see values above). Design copy: "WORD · GRADED" / "كلمة · مُقيَّمة", "MOTION · DEMO" / "حركة · عرض", "LETTER · GRADED" / "حرف · مُقيَّم". Existing app uses `categoryTags` (Alphabet/Unit 1 + Phrase/Common) + a mobile status chip — **keep the app's tags**; optionally add the graded/motion word to be honest.

**B3 · "How to sign it" section**
- Label: font `700 11px/1 ui-monospace,Menlo`, `letter-spacing:.1em`, uppercase, color `#0F6E6A`, `margin-top:18px`. EN "How to sign it" / AR "كيف تشير إليها". (Existing app copy: "How to sign"/"كيف تُؤدّى" with an `info` icon — keep existing key/strings.)
- **Numbered steps list** (NEW — design shows 3 ordered steps; existing app shows a single free-text `hint`). `display:flex; flex-direction:column; gap:9px; margin-top:11px`. Each step:
  - Number chip: `24×24px; border-radius:50%; background:#0F6E6A; color:#FBF7EF; font:800 12px Rubik; center; flex:none`. LTR shows `1/2/3`; AR shows `١/٢/٣` (Eastern-Arabic).
  - Step text: `400 13.5px/1.4 'Readex Pro'`, `#16302E`, `padding-top:2px`.
  - *Reskin mapping:* the app's content layer today has a single `hint` string, not a steps array. Keep rendering the existing `hint` inside a styled block **unless** the content model gains a `steps[]`. If steps are unavailable, render the hint as one block styled like a single step or the existing `bg-sand/50 rounded-3xl` card — do NOT fabricate three steps. (Honest-by-design.)

**B4 · Note card**
- `background:#F6EFE3; border:1px solid #EDE3D2; border-radius:14px; padding:11px 13px; margin-top:16px; display:flex; gap:9px; align-items:center`.
- Leading swatch: `22×22px; border-radius:7px; background:#E8654C; flex:none` (coral).
- Note text: `500 12.5px/1.35 'Readex Pro'`, `#16302E`. Content per sign (e.g. "The first of all 28 letters — where every name begins."). Maps to a per-sign `note`/context string if present; otherwise reuse the existing `hint` or omit — do not fabricate.

**B5 · Sticky CTA (bottom)**
- Full-width button: `height:54px; border-radius:17px; font:700 16px/1 Rubik; box-shadow:0 5px 0 {shadow}; transition:all .08s`. Press → `translateY(4px); box-shadow:0 1px 0 {shadow}`.
  - **Graded sign:** bg `#E8654C` (coral), color `#FBF7EF`, shadow `#C54F3A`. Copy EN "Practise this sign →" / AR "تمرّن على هذه الإشارة ←" (arrow points along reading direction — mirrors). Wire → `onPractice`. (Existing app uses `t("practiceCamera", lang)` "Practise with camera" with a `videocam` icon — keep that key; the design's arrow-copy is the same slot.)
  - **Motion sign:** bg `#E6B24C` (gold), color `#16302E`, shadow `#C89A3D`. Copy EN "Watch & practise" / AR "شاهد وتمرّن". This is the honest no-grade path. Existing app renders an info line instead of a CTA for non-gradable signs ("Watch the reference — this sign moves…") — **keep the existing honest info treatment**; the design's gold "Watch & practise" button is an acceptable alternative styling of the same non-grading promise. Either way: NO fake grade, camera CTA stays gated by `sign.cameraGradable`.
- Existing app also renders (keep): desktop secondary "Add to Daily Review" (`event_repeat` icon), mobile Flag + Share row, and the panel header favorite/close buttons. Repaint these to the token set but keep wiring.

### STATE D — Search (`search`; screenshot 04)

Same screen as `dict` with `query` non-empty / input focused. The design draws it as a distinct state; in the app it's the live search results inside the same grid/list.

**B1 · Active search field**
- `display:flex; align-items:center; gap:9px; background:#F6EFE3; border:2px solid #0F6E6A; border-radius:14px; padding:12px 14px`. (Note the **2px teal focus border** vs the resting 1px grey.)
- Leading icon: `15×15px` circle `border:2.5px solid #0F6E6A` (app uses real `search` icon, tint to teal on focus).
- Query text: `500 15px 'Readex Pro'`, `#16302E`.
- Blinking caret: `width:2px; height:17px; background:#0F6E6A; animation:caret 1s step-end infinite`. (Native input caret already does this — no need to fake unless a custom field.)

**B2 · Results section**
- Label: `700 11px/1 ui-monospace,Menlo`, `letter-spacing:.1em`, uppercase, color `#5C726F`. EN "Results" / AR "النتائج".
- Result rows: `display:flex; align-items:center; gap:12px; background:#FFFFFF; border:1px solid #EDE3D2; border-radius:15px; padding:11px`, stacked `gap:10px`, `margin-top:11px`.
  - Glyph tile: `44×44px; border-radius:12px; background:#F6EFE3; center; font-size:22px` → `SignGlyph`.
  - Name `700 15px/1.1 Rubik` `#16302E`; sub `500 12px 'Readex Pro'` `#5C726F` `margin-top:2px`.
  - Trailing graded/motion badge (B6 values).
- These rows are just the filtered `signs` list — reuse the same card/row component as `dict`.

**B3 · Recent section** (NEW — optional)
- Label: same mono style, color `#5C726F`, `margin-top:22px`. EN "Recent" / AR "الأخيرة".
- Recent chips: `background:#F6EFE3; border:1px solid #EDE3D2; border-radius:99px; padding:8px 14px; font:600 13px/1 'Readex Pro'; color:#16302E`, `gap:8px flex-wrap`, `margin-top:11px`. Design examples: "Hello / Milk / Family" · "مرحبًا / حليب / العائلة".
- *Reskin mapping:* the app has **no recent-search store** today. This is optional polish — only build if a recent-queries slice is added; otherwise omit (do not fabricate a recents list). Not part of the preserve contract.

---

## 3 · COPY — every visible string

Reuse existing keys where present; propose new keys only where marked. AR lifted verbatim from the `.dc.html` RTL data (`STR.ar` / `DETAIL[*].ar`).

| Slot | Key (reuse / propose) | English | Arabic |
|---|---|---|---|
| Dict title (existing app) | inline `pick` | Sign Dictionary | القاموس |
| Dict sub-line (existing app) | inline `pick` | Qatari Sign Language · خليجي | لغة الإشارة القطرية · خليجي |
| Dict title (design alt) | `signsAllTitle` *(new, optional)* | All signs | كل الإشارات |
| Search placeholder | inline `pick` (existing) | Search signs… | ابحث عن إشارة… |
| Search aria | inline `pick` (existing) | Search signs | ابحث عن إشارة |
| Chip: All | inline `pick` (existing) | All | الكل |
| Chip: Learned | inline `pick` (existing) | Learned | المتعلمة |
| Chip: Flagged | inline `pick` (existing) | Flagged | المحددة |
| Chip: Alphabet | `t("prAlphabet")` (existing) | Alphabet | الحروف |
| Chip: Unit 1 | inline `pick` (existing) | Unit 1 | الوحدة ١ |
| Dominant flagged btn | inline `pick` (existing) | Practise your {n} flagged sign(s) | تدرّب على {n} إشارة محدّدة |
| Card status: Mastered | `STATUS_META` (existing) | Mastered | متقنة |
| Card status: Family list | `STATUS_META` (existing) | Family list | قائمة العائلة |
| Card status: Review soon | `STATUS_META` (existing) | Review soon | للمراجعة |
| Card status: Letter | `STATUS_META` (existing) | Letter | حرف |
| Card status: Unit 1 | `STATUS_META` (existing) | Unit 1 | الوحدة ١ |
| Card status: New | `STATUS_META` (existing) | New | جديدة |
| Type badge: Graded | `signBadgeGraded` *(new, optional)* | Graded | مُقيَّم |
| Type badge: Motion | `signBadgeMotion` *(new, optional)* | Motion | حركة |
| Alphabet title | `signsAlphaTitle` *(new)* | The alphabet | الأبجدية |
| Alphabet body | `signsAlphaBody` *(new)* | All 28 Arabic letters. | كل الحروف العربية الـ٢٨. |
| Alphabet progress | `signsAlphaProgress` *(new, {n} interp)* | {learned} of 28 learned | {learned} من ٢٨ مُتعلَّمة |
| Detail signer badge | `signSignerDemo` *(new)* | SIGNER DEMO | عرض المُشير |
| Detail "how to" label | inline `pick` (existing "How to sign") | How to sign | كيف تُؤدّى |
| Detail how-to (design copy) | `signHowTo` *(new, optional)* | How to sign it | كيف تشير إليها |
| Detail CTA (graded) | `t("practiceCamera")` (existing) | Practise with camera | تدرّب بالكاميرا |
| Detail CTA (graded, design alt) | `signPractiseThis` *(new, optional)* | Practise this sign → | تمرّن على هذه الإشارة ← |
| Detail CTA (motion) | `signWatchPractise` *(new, optional)* | Watch & practise | شاهد وتمرّن |
| Detail motion info (existing) | inline `pick` | Watch the reference — this sign moves, so the camera can't grade it yet. | شاهد المرجع — هذه إشارة متحركة، لا تستطيع الكاميرا تقييمها بعد. |
| Watch chip | inline `pick` (existing) | Watch | شاهد |
| Watch chip (replay) | inline `pick` (existing) | Watch Again | شاهد مجدداً |
| Detail: Add to Daily Review | inline `pick` (existing) | Add to Daily Review | أضِف للمراجعة اليومية |
| Detail: Flag | inline `pick` (existing) | Flag | حدّد |
| Detail: Flagged | inline `pick` (existing) | Flagged | محدّدة |
| Detail: Share | inline `pick` (existing) | Share | شارك |
| Detail tag: Alphabet | inline `pick` (existing) | Alphabet | الحروف |
| Detail tag: Unit 1 | inline `pick` (existing) | Unit 1 | الوحدة ١ |
| Detail tag: Phrase | inline `pick` (existing) | Phrase | عبارة |
| Detail tag: Common | inline `pick` (existing) | Common | شائعة |
| Close aria | `t("close")` (existing) | Close | إغلاق |
| Add to family list (aria) | inline `pick` (existing) | Add to family list | أضِف إلى قائمة العائلة |
| Remove from family list (aria) | inline `pick` (existing) | Remove from family list | أزِل من قائمة العائلة |
| Empty: no match | inline `pick` (existing) | No signs match. | لا توجد إشارات مطابقة. |
| Empty: unit 2 soon | inline `pick` (existing) | Unit 2 is coming soon. | الوحدة ٢ قريباً. |
| Empty: Clear search | inline `pick` (existing) | Clear search | مسح البحث |
| Empty: Browse all | inline `pick` (existing) | Browse all signs | تصفّح كل الإشارات |
| Panel placeholder (desktop, no selection) | inline `pick` (existing) | Pick a sign to see how it's made. | اختر إشارة لترى كيف تُؤدّى. |
| Search results label | `signResultsLabel` *(new, optional)* | Results | النتائج |
| Search recent label | `signRecentLabel` *(new, optional)* | Recent | الأخيرة |

**Detail step/note strings** (design `DETAIL` block — content-layer data, NOT i18n keys; belongs in `content/signs`, only if the content model gains `steps[]`/`note`):
- **Alif** — EN steps: "Make a firm fist." / "Rest your thumb flat along the side." / "Face your knuckles to the camera." · note "The first of all 28 letters — where every name begins." — AR: "اقبض يدك بإحكام." / "ضع إبهامك مسطّحًا على الجانب." / "وجّه مفاصلك نحو الكاميرا." · note "أول الحروف الـ٢٨ — حيث يبدأ كل اسم."
- **I love you (أحبّك)** — EN: "Extend your thumb, index and pinky." / "Fold the middle and ring fingers down." / "Hold steady toward the camera." · note "A favourite between parents and kids — say it without a sound." — AR: "ارفع الإبهام والسبابة والخنصر." / "اطوِ الوسطى والبنصر للأسفل." / "اثبت باتجاه الكاميرا." · note "المفضّلة بين الآباء والأبناء — قلها بلا صوت."
- **Hello (مرحبًا)** — EN: "Raise your open hand near your head." / "Wave it gently side to side." / "Auto-grading is coming soon — practise along." · note "A motion sign. Watch & practise for now — we never fake a grade." — AR: "ارفع يدك المفتوحة بجانب رأسك." / "لوّح بها برفق يمينًا ويسارًا." / "التقييم التلقائي قريبًا — تمرّن معنا." · note "إشارة حركية. شاهد وتمرّن الآن — لا نزيّف أي تقييم."

---

## 4 · NEW-I18N — keys not already in `src/i18n.ts`

Only the alphabet-grid + optional honesty/search labels are genuinely new. The build agent should add the alphabet block; the `*(optional)*` ones only if that treatment is adopted (otherwise the existing keys cover the screen). Append inside `dict`:

```ts
  // signs dictionary (design rebuild)
  signsAlphaTitle: { en: "The alphabet", ar: "الأبجدية" },
  signsAlphaBody: { en: "All 28 Arabic letters.", ar: "كل الحروف العربية الـ٢٨." },
  // {learned} interpolated by caller; AR "of 28" = "من ٢٨" (Eastern-Arabic numerals via num())
  signsAlphaProgress: { en: "of 28 learned", ar: "من ٢٨ مُتعلَّمة" },
  signSignerDemo: { en: "Signer demo", ar: "عرض المُشير" },

  // optional — only if the graded/motion pill + design detail copy are adopted
  signsAllTitle: { en: "All signs", ar: "كل الإشارات" },
  signBadgeGraded: { en: "Graded", ar: "مُقيَّم" },
  signBadgeMotion: { en: "Motion", ar: "حركة" },
  signHowTo: { en: "How to sign it", ar: "كيف تشير إليها" },
  signPractiseThis: { en: "Practise this sign →", ar: "تمرّن على هذه الإشارة ←" },
  signWatchPractise: { en: "Watch & practise", ar: "شاهد وتمرّن" },
  signResultsLabel: { en: "Results", ar: "النتائج" },
  signRecentLabel: { en: "Recent", ar: "الأخيرة" },
```

> Existing keys confirmed present (do NOT duplicate): `prAlphabet`, `practiceCamera`, `close`, `navDictionary`. All chip/status/detail/empty strings above are already inline `pick()` calls in `AllSigns.tsx` — leave them as-is.

---

## 5 · MOTION / STATES

**Motion (HANDOFF §Motion tokens):**
- **Springy buttons** (dominant flagged action, detail CTA): solid fill + hard bottom shadow `box-shadow:0 5px 0 <deep>` (no blur). Press → `translateY(4px)` and collapse to `0 1px 0 <deep>`, `transition:all .08s`. Detail CTA shadows: graded `#C54F3A`, motion `#C89A3D`. Spring-out release curve `cubic-bezier(.34,1.56,.64,1)` 260ms.
- **Active example tabs / chips** (harness only for tabs; real for chips): active state adds `box-shadow:0 3px 0 #0A4F4C` (pressed-in teal); inactive `inset 0 0 0 1px #EDE3D2`.
- **Mobile detail bottom-sheet:** `@keyframes rise {0%{translateY(12px);opacity:0} 100%{translateY(0);opacity:1}}` — existing `animate-rise`. Backdrop `bg-ink/40 backdrop-blur-sm`, grab handle `h-1.5 w-12 rounded-full bg-ink/10`. Dismiss = ease-in exit 180ms.
- **Search caret:** `@keyframes caret {0%,100%{opacity:1} 50%{opacity:0}}` `1s step-end infinite` (native caret already does this).
- **Card select:** `Card variant="selected"` (teal) vs `elevated`; `active:scale-95` on the flag/close buttons, `hover:scale-105 active:scale-95` on the Watch chip.
- **Reduce-motion:** freeze caret blink + any pulse; keep instant state swaps; sheet still appears (no slide) per HANDOFF.

**States:**
- **Loading:** none specific to this screen (content is frozen/local); `SignGlyph` may lazy-load an image — show its own placeholder.
- **Empty (search / filter):** `Card variant="flat"`, centered, `p-8 md:p-10`. Message "No signs match."/"لا توجد إشارات مطابقة." (or "Unit 2 is coming soon."/"الوحدة ٢ قريباً." for the `unit2` deep-link). Actions: "Clear search" (secondary, only if `query`) + "Browse all signs" (ghost). Keep this exact honest branch.
- **Empty detail (desktop panel, no selection):** dashed `Card variant="flat" border-dashed bg-paper/50`, `touch_app` icon `text-teal/40`, "Pick a sign to see how it's made."/"اختر إشارة لترى كيف تُؤدّى."
- **Interactive:** chip toggle (single-select), search live-filter, card→open detail, Watch→Watch Again (no store write), flag toggle (`aria-pressed`), add-to-review, share (native sheet + clipboard fallback).
- **Alphabet cell states:** learned (teal fill) / current (coral ring `0 0 0 2px #E8654C` + `#FBF3EF` bg) / locked (paper + inset hairline). Progress bar fill computed from learned-alphabet count.
- **Graded vs motion (honest, never-fake-a-grade):** `sign.cameraGradable` gates the camera CTA. Gradable → teal/coral "Practise" + teal barber-stripe frame + "Graded" pill. Motion → gold "Watch & practise" (or the existing info line) + gold barber-stripe frame + "Motion" pill. NEVER show a grade path on a motion sign. No hard-fail anywhere.
- **Error:** none screen-specific; share failure is swallowed (user-dismissed = no-op).

---

## 6 · RTL — mirrors vs never-mirrors (HANDOFF §2)

Arabic panel is `dir="rtl"`; design the AR layout first, anchor with logical properties (`ps-*/pe-*`, `ms-auto`, `start/end`, `text-start`).

**Mirrors (flip in RTL):**
- Reading flow & block order: title/search/chips stack unchanged vertically, but row internals reverse — list-row glyph tile sits at the **start** (right in AR), name/sub read right-aligned, badge at the **end** (left in AR). Screenshots 02–04 confirm the glyph on the right, badge on the left.
- Alphabet grid fill direction: rows fill start→end from the **right** in AR (screenshot 01 row 1 = `ث ت ب ا` right-to-left). The grid mirrors; the glyphs inside do not.
- Detail title row: name at start (right), badge at end (left).
- CTA arrow: EN "Practise this sign →" uses `→`; AR "تمرّن على هذه الإشارة ←" uses `←` — the arrow points along reading direction, so it mirrors.
- Progress bar fill origin, chevrons, tab/scroll order, sheet slide direction (RTL push/pop enters from the leading/left edge).
- Numerals: AR uses Eastern-Arabic `٠١٢٣٤٥٦٧٨٩` (step numbers `١٢٣`, "٧ من ٢٨", flagged counts) via `num(n,"ar")`; percent `٪` trails. Never mix scripts on one panel.

**Never mirrors (physical / glyph-locked):**
- **Sign-language handshapes** (`SignGlyph`, the letter glyphs, the medallion handshape) — they are physical; identical in both panels.
- **Arabic letter glyphs** in the alphabet grid — the letters themselves are not flipped (only their grid placement order mirrors).
- **Play / replay ▶ glyph** on the demo frame and the camera/videocam icon — stay forward-facing.
- **The checkmark** (`check_circle` mastered status) — never mirrors.
- **Fanan** — n/a here (no mascot on this screen) but the rule holds if ever added.
- **Signer-demo badge dot** `●`, logos, status-bar clock.

---

Summary: 6 layout blocks per state across 4 states (dict / alphabet / detail / search) — ~19 distinct blocks total; the shipping screen is one `AllSigns.tsx`. New i18n keys: 4 required (alphabet grid + signer-demo) + 9 optional (graded/motion pill + design-alt detail/search copy) = up to 13.
