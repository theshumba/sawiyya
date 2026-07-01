# Build Spec — Boot / Splash / Loading (+ Update nudge)

Source design: `design/rebuild-source/Sawiyya Boot.dc.html`
Screenshots: `design/rebuild-source/screenshots/0{1..5}-boot3.png`
Target branch: `feat/design-rebuild`

> **Scope note.** The `.dc.html` bundles SIX tabbed states: `splash`, `loading`, `update`, `free`, `words`, `tap`. Only the first three are the **Boot** screen and are specified here. The other three are the "last practice pieces" and belong to other screens — do NOT build them here:
> - `free` (Free camera) → `src/screens/CameraPractice.tsx` (free-practice mode)
> - `words` (Words grid) → `src/screens/AllSigns.tsx`
> - `tap` (Tap-what-you-see drill) → `src/screens/LessonPlayer.tsx` / `src/screens/PractiseChooser.tsx`
> Their copy is captured in COPY (marked out-of-scope) only so it isn't lost.

---

## 0. Critical context — there is NO existing Boot screen

`src/App.tsx` mounts `<Onboarding/>` when `!onboarded || !profile`, otherwise the screen router — **immediately**, with no splash or loading gate. zustand `persist` (`store/app.ts`, name `"sawiyya.app.v1"`) rehydrates synchronously from `localStorage`, so today there is no async gap to cover.

This spec therefore introduces a **new** `src/screens/Boot.tsx` (splash + loading), plus an **optional** update-nudge surface. Wiring the splash into the real boot sequence is a small App change (see MOTION/STATES §Wiring). The reskin's job is the visual layer; the functional contract below is what it must NOT break.

---

## 1. PRESERVE — functional contract

There is no `Boot.tsx` to preserve today, so "preserve" means: the new boot layer must not break these existing identifiers, and it must reuse (not fork) these primitives.

### App gating (must remain intact after any splash is inserted) — `src/App.tsx`
- `const onboarded = useApp((s) => s.onboarded);` — root gate; scoped selector (comment: avoids full-tree re-render). Keep the scoped selector form.
- `const profile = useApp(activeProfile);` — `activeProfile` selector from `store/app.ts`.
- `const { screen } = useUi();` — router state from `store/ui.ts`.
- `const lang = profile?.language ?? "en";`
- `useEffect(() => { applyDir(lang); }, [lang]);` — sets `<html dir/lang>`. The splash must render correctly under whatever `dir` this has already applied (splash is centered, so it is dir-agnostic — see RTL).
- `if (!onboarded || !profile) return <Onboarding />;` — a splash, if added, wraps/precedes this; it must not change the branch outcome.

### Store hooks available for the update nudge / loading gate
- `useApp` (zustand) — `store/app.ts`. No update/version field exists; an update nudge would need a new mechanism (see MOTION/STATES). Do NOT invent store fields in the reskin unless explicitly told to.
- `useUi().go(screen)` — the ONLY navigation call in the app (`store/ui.ts`). If the update CTA must route, call `go({ name: "home" })` etc. via this. Splash/loading do not navigate by tap.

### i18n (every visible string routes through this — do not hardcode)
- `t(key, lang)` from `src/i18n.ts`, `lang: "en" | "ar"`.
- Reuse existing keys where present:
  - `appName` → `{ en: "sawiyya", ar: "سويّة" }` — brand wordmark. **Note:** design renders the Latin lockup capitalised as `Sawiyya`; treat the wordmark as a fixed brand logotype (Latin `Sawiyya` + Arabic `سويّة` stacked, shown on BOTH language panels), NOT a translated string. If you must source it from i18n, use `appName.ar` for the Arabic line; the Latin `Sawiyya` is a brand constant.
  - `tagline` already exists but its text ("Let's learn to talk to each other. سويّة.") differs from the splash tagline — do NOT reuse it; add `splashTagline` (see NEW-I18N).
- `pick(lang, en, ar)` and `num(n, lang)` available for inline bilingual/numeral needs.

### Reusable components (build once, reuse — do not re-draw)
- `Fanan` from `src/components/Fanan.tsx`. Props: `pose?: FananPose` (`"idle" | "think" | "cheer" | "sad" | "celebrate" | "wave"`), `scale?: number`, `className?`.
  - Splash uses `pose="wave"` `scale={1.25}`.
  - Update uses `pose="cheer"` `scale={1.05}` (design says scale 1.05; source calls the pose `cheer`).
  - Fanan intrinsic box is `120×118px`; the design's `hint-size` (150/128) is just canvas sizing — drive size via `scale`.
  - Fanan **never mirrors** (documented in its own header comment).
- Global keyframes: `float`, `sparkle-pop` already in `src/styles.css` (Fanan depends on them). The boot screen additionally needs `pop`, `rise`, `shimmer`, `ping` (see MOTION/STATES — add if absent).

---

## 2. LAYOUT — target design, ordered blocks

Shared device chrome wraps every state. Phone frame from the canvas (bezel `#16302E`, radius 47px, inner radius 40px) is the design-doc mock — in the real app the states fill the viewport. Lift the **inner** values.

### Shared — Status bar (all three states)
- Container: `flex:none; height:34px; display:flex; align-items:center; justify-content:space-between; padding:0 24px; position:relative`.
- Time `9:41`: `font:700 13px/1 Rubik; color: {statusColor}`.
- Notch: `position:absolute; top:9px; left:50%; translateX(-50%); width:74px; height:20px; background:#16302E; border-radius:99px; opacity:.5`.
- Battery: `width:16px; height:9px; border:1.5px solid {statusColor}; border-radius:3px`.
- `statusColor` = `#FBF7EF` on **splash** (dark bg), `#16302E` on loading/update (light bg).
- Time/status **never mirrors** (RTL).

---

### STATE A — SPLASH  (screen bg = `linear-gradient(165deg,#0F6E6A,#0A4F4C)`)
Vertically + horizontally centered column. `flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px`.

1. **Fanan** — wrapper `animation:float 2.6s ease-in-out infinite`; `<Fanan pose="wave" scale={1.25} />`. Fanan appears here.
2. **Latin wordmark** — text `Sawiyya`; `font:800 42px/1 Rubik; color:#FBF7EF; margin-top:20px; letter-spacing:-.02em; animation:pop .6s ease both`.
3. **Arabic wordmark** — text `سويّة`; `font:600 20px/1 'Readex Pro'; color:#F0C879; margin-top:6px`.
4. **Tagline** — `font:400 13px/1.4 'Readex Pro'; color:rgba(255,255,255,.72); margin-top:14px; max-width:230px; text-align:center`. Copy = `splashTagline`.
5. **Loader dots** — `display:flex; gap:6px; margin-top:26px`; three dots, each `width:8px; height:8px; border-radius:50%; background:#F0C879; animation:ping 1.2s ease-out infinite`. Stagger delays: dot1 `0`, dot2 `.2s`, dot3 `.4s`.

### STATE B — LOADING  (screen bg = `#F6EFE3`; a shimmering skeleton of the Home layout — never a dead spinner)
Skeleton shimmer base (`skBase`): `background:linear-gradient(90deg,#EDE3D2,#F6EFE3,#EDE3D2); background-size:200% 100%; animation:shimmer 1.4s ease-in-out infinite; border-radius:8px`.

1. **Header block (teal)** — `flex:none; background:#0F6E6A; padding:8px 20px 20px; border-radius:0 0 24px 24px`.
   - Row: `display:flex; align-items:center; justify-content:space-between`.
     - Left group (two lines): line1 `width:120px; height:16px; background:rgba(255,255,255,.25)` + `skBase`; line2 `width:80px; height:11px; margin-top:8px; background:rgba(255,255,255,.18)` + `skBase`. (Skeleton lines override skBase's gradient bg with the flat rgba fill shown — keep skBase's border-radius + shimmer animation.)
     - Right avatar: `width:44px; height:44px; border-radius:50%; background:rgba(255,255,255,.2)`.
   - Pills row: `display:flex; gap:8px; margin-top:14px`; three items each `flex:1; height:44px; border-radius:13px; background:rgba(255,255,255,.14)`.
2. **Body** — `flex:1; padding:18px 22px; display:flex; flex-direction:column; align-items:center; gap:22px`.
   - Big card line: `width:70%; height:52px; border-radius:16px` + `skBase`.
   - Circle 1 (`skCircle`): `width:64px; height:64px; border-radius:50%; background:linear-gradient(90deg,#EDE3D2,#F6EFE3,#EDE3D2); background-size:200% 100%; animation:shimmer 1.4s ease-in-out infinite`.
   - Circle 2: `skCircle` + `transform:translateX(40px)`.
   - Circle 3: `skCircle` + `transform:translateX(-30px)`.

   > RTL: the two circle offsets (`+40px / -30px`) are physical X translations for organic placement — they mirror under RTL only if converted to logical; simplest is to leave them (cosmetic). The header left/right groups DO mirror (see RTL).

### STATE C — UPDATE NUDGE  (screen bg = `#F6EFE3`; warm invitation, not a demand)
Content area: `flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:12px 26px 0; text-align:center`.

1. **Fanan + NEW badge** — wrapper `position:relative; animation:float 3s ease-in-out infinite`; `<Fanan pose="cheer" scale={1.05} />`. Fanan appears here.
   - Badge: `position:absolute; top:-6px; right:-6px; background:#E8654C; color:#FBF7EF; font:800 12px Rubik; padding:5px 9px; border-radius:99px; box-shadow:0 3px 0 #C54F3A`. Copy = `updateBadgeNew`. Badge stays top-**right** physically (it's a corner ornament); acceptable to mirror to top-inline-start if desired — design keeps right.
2. **Title** — `font:800 27px/1.1 Rubik; color:#16302E; margin-top:20px; animation:rise .4s ease both`. Copy = `updateTitle`.
3. **Body** — `font:400 15px/1.5 'Readex Pro'; color:#5C726F; max-width:250px; margin-top:8px`. Copy = `updateBody`.
4. **Tag pills row** — `display:flex; gap:8px; margin-top:16px`. Two pills, each: `background:#F6EFE3; border:1px solid #EDE3D2; border-radius:99px; padding:8px 13px; font:600 12px 'Readex Pro'; color:#16302E`. Copy = `updateTagSigns`, `updateTagUnit`.
   > NOTE the pill bg is `#F6EFE3` in source (same as screen). Screenshot 02 reads as a hair lighter/paper card — if it disappears on the paper bg, bump to `#FBF7EF` (paper/0). Design literal = `#F6EFE3`; ship literal unless it vanishes.
5. **Footer** (`flex:none; padding:12px 26px 20px; display:flex; flex-direction:column; gap:9px`):
   - **Primary button** (signature springy) — `width:100%; border:none; background:#0F6E6A; color:#FBF7EF; font:700 16px/1 Rubik; height:54px; border-radius:17px; box-shadow:0 5px 0 #0A4F4C`. Active/press: `transform:translateY(4px); box-shadow:0 1px 0 #0A4F4C`. Copy = `updateCta`.
   - **Text button** — `width:100%; border:none; background:none; color:#5C726F; font:600 14px/1 'Readex Pro'; padding:8px`. Copy = `updateLater`.

---

## 3. COPY — every visible string

Boot screen (in-scope):

| Key (reuse ∗ / new †) | English | Arabic (verbatim from RTL panel) |
|---|---|---|
| `appName` ∗ (Arabic line only) | — | سويّة |
| _brand constant_ (Latin wordmark, not i18n) | Sawiyya | Sawiyya |
| `splashTagline` † | Learn to sign. Connect with someone who can't hear you. | تعلّم الإشارة. تواصل مع من لا يسمعك. |
| `updateBadgeNew` † | NEW | جديد |
| `updateTitle` † | New signs have arrived | وصلت إشارات جديدة |
| `updateBody` † | Fanan brought fresh content for you and your family. | أحضر فَنَن محتوى جديدًا لك ولعائلتك. |
| `updateTagSigns` † | +12 signs | +١٢ إشارة |
| `updateTagUnit` † | New unit | وحدة جديدة |
| `updateCta` † | Update now | حدّث الآن |
| `updateLater` † | Later | لاحقًا |

Loading state has **no** text (skeleton only).

Out-of-scope states (captured so copy isn't lost — build in their own screens, NOT here):

| State | Field | English | Arabic |
|---|---|---|---|
| free | title | Free practice | تمرّن حرّ |
| free | note | Hand detected — sign anything you like | رُصدت يدك — أشِر ما تشاء |
| free | privacy | On-device · nothing leaves your phone | على الجهاز · لا شيء يغادر هاتفك |
| words | title | First words | الكلمات الأولى |
| words | body | 16 signs to start real conversations. | ١٦ إشارة لبدء محادثات حقيقية. |
| tap | title | Tap what you see | انقر ما ترى |
| tap | body | Which of these means "Milk"? | أيٌّ منها يعني «حليب»؟ |
| tap | right | That's the one! 🍼 | هذه هي! 🍼 |
| tap | wrong | Not quite — look again. | ليس تمامًا — انظر مجددًا. |

---

## 4. NEW-I18N — keys to append to `src/i18n.ts`

Only keys not already in the dict. Append inside the `dict` object (suggested new `// boot` section). AR numerals use Eastern-Arabic glyphs per HANDOFF §2.

```ts
  // boot
  splashTagline: {
    en: "Learn to sign. Connect with someone who can't hear you.",
    ar: "تعلّم الإشارة. تواصل مع من لا يسمعك.",
  },
  updateBadgeNew: { en: "NEW", ar: "جديد" },
  updateTitle: { en: "New signs have arrived", ar: "وصلت إشارات جديدة" },
  updateBody: {
    en: "Fanan brought fresh content for you and your family.",
    ar: "أحضر فَنَن محتوى جديدًا لك ولعائلتك.",
  },
  updateTagSigns: { en: "+12 signs", ar: "+١٢ إشارة" },
  updateTagUnit: { en: "New unit", ar: "وحدة جديدة" },
  updateCta: { en: "Update now", ar: "حدّث الآن" },
  updateLater: { en: "Later", ar: "لاحقًا" },
```

(`appName` and `tagline` already exist — do not re-add. Do NOT reuse `tagline` for the splash; it carries different copy.)

---

## 5. MOTION / STATES

### Keyframes (add to `src/styles.css` if not already present; `float` + `sparkle-pop` already exist)
```css
@keyframes float   {0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes rise    {0%{transform:translateY(14px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pop     {0%{transform:scale(.5);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@keyframes shimmer {0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes ping    {0%{transform:scale(.9);opacity:.85}70%{transform:scale(1.3);opacity:0}100%{opacity:0}}
```

### Animations by state
- **Splash:** Fanan `float 2.6s ease-in-out infinite`; wordmark `pop .6s ease both` (spring-in per HANDOFF spring-out `.34,1.56,.64,1`); three loader dots `ping 1.2s ease-out infinite` staggered `0 / .2s / .4s`.
- **Loading:** all skeleton bars/circles `shimmer 1.4s ease-in-out infinite` (background-position sweep). Never a spinner.
- **Update:** Fanan `float 3s ease-in-out infinite`; title `rise .4s ease both`; primary button press = `translateY(4px)` + shadow collapse to `0 1px 0 #0A4F4C` (HANDOFF signature springy button).

### States / behaviour
- **Splash → next:** splash is a timed/hydration hold, not interactive. Recommended: show while zustand `persist` rehydrates + fonts/model warm, then hand off. Since `persist` is synchronous today, gate on a minimum-display timer (e.g. exit after Fanan `pop` completes / fonts loaded) so it doesn't flash. On exit use HANDOFF "Ease-in (exit)" `.4,0,1,1` 180ms.
- **Loading:** shown when a heavier async load exists (e.g. Home data / recognizer warmup). It mirrors the real Home layout (teal header + avatar + pills + content). If no async work exists, this state may be unused — keep the component but only mount it behind a real pending flag.
- **Update nudge:** NO update mechanism exists in the app today (no service worker / version field in `store/app.ts`). Treat as a **UI-only surface** for now: render on demand; `updateCta` and `updateLater` should call the caller-provided handlers (e.g. dismiss / trigger `window.location.reload()` once a SW update flow exists). Do NOT add store fields or a service worker as part of the reskin unless told to.
- **Reduce-motion (HANDOFF Motion):** freeze `float`, `ping`, `pop`, `shimmer` → render final frame; keep instant state changes. Honor `prefers-reduced-motion`.

### Wiring (App integration — minimal, keep gating intact)
- Insert splash BEFORE the `if (!onboarded || !profile)` branch so it can cover first paint, then fall through to the existing branch unchanged. Do not alter the `onboarded`/`profile`/`screen` logic.

---

## 6. RTL

Design the Arabic panel first (HANDOFF §2). For this screen:

**Never mirrors:**
- Status-bar time `9:41`, notch, battery glyph.
- **Fanan** (physical geometry — renders identically in `dir="rtl"`).
- Latin `Sawiyya` wordmark (logotype).
- The Arabic wordmark `سويّة` is already RTL-native text — no flip.
- Splash loader dots / `ping` (symmetric).
- The camera/play/checkmark glyphs — N/A on the boot states (only appear in out-of-scope free/tap states).

**Mirrors (use logical properties / natural `dir` flow):**
- **Splash & Update:** content is center-aligned, so layout is largely dir-agnostic; only text alignment follows `dir` (already centered). Tagline/title/body stay centered in both.
- **Update tag-pill row:** `display:flex; gap` — order follows `dir` automatically (start-edge first). The NEW badge is a corner ornament pinned `top/right`; design keeps it physically top-right in both, acceptable, or convert to `inset-inline-end` to anchor to the trailing corner.
- **Loading header row:** the left text-group vs right avatar swap sides under RTL — implement with `justify-content:space-between` + natural flow (no hardcoded `left/right`), matching screenshot 01 (AR panel shows avatar on the left, lines on the right).

**Numerals:** AR uses Eastern-Arabic glyphs — `updateTagSigns.ar` = `+١٢ إشارة` (already localized in the i18n block). If any count is rendered dynamically, pass through `num(n, lang)`.

---

### Summary
Boot screen = **3 in-scope blocks** (Splash, Loading skeleton, Update nudge) sharing one status-bar chrome; **8 new i18n keys** (`splashTagline`, `updateBadgeNew`, `updateTitle`, `updateBody`, `updateTagSigns`, `updateTagUnit`, `updateCta`, `updateLater`).
