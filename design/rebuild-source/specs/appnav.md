# Build Spec — App Navigation (mobile tab bar + desktop rail)

Reskin target for `src/components/AppNav.tsx` (rendered by `src/components/ScreenShell.tsx`, `chrome="tabs"`).
Design source: `Sawiyya Home Path.dc.html` (bottom-nav block, lines 116–130 + `nav` builder lines 231–237) and the tab-bar screenshot `screenshots/path2.png` (also visible in `01-path.png`/`02-path.png` steps). The `.dc.html` shows a phone mockup only — **no desktop rail exists in the design**; the existing rail is preserved and restyled with the same tokens.

> **Two structural divergences design vs. code — resolve as noted, do NOT silently drop wiring:**
> 1. **5 flat tabs vs. 4 tabs + profile button.** The design bottom bar is a flat 5-icon row: `Home · Practise · Signs · Family · Progress` — no profile/avatar button, no Settings entry, no requests badge. The existing component ships **4 tabs + a profile button** whose menu holds Progress + Settings and carries the family-requests `Badge`. **KEEP the existing 4-tabs-plus-profile-button architecture** (it owns load-bearing wiring: `progress`/`settings` navigation, the requests badge, the profile menu). Apply the design's colour/type/spacing/icon-flat treatment to it. Do not add a 5th `progress` tab or delete the profile button.
> 2. **Flat centre tab vs. coral hero "camera moat".** The design draws the Practise/camera tab **flat** (same size, teal-when-active) — there is no elevated coral circle. The existing code renders Practise as a raised coral hero (`-mt-5 h-14 w-14 rounded-full shadow-coral bg-coral`). **Flatten it to match the design** (see LAYOUT block 2). The `hero` flag + coral styling should be removed from the rendered output; the tab still routes to `camera`. (If the product owner wants to retain the moat, that is a separate decision — default is flat per the design.)

---

## 1 · PRESERVE — functional contract (must stay wired after reskin)

Every identifier below is currently in `AppNav.tsx` and MUST remain wired. Quotes are the exact call sites.

**Store hooks / selectors**
- `const app = useApp();` — root app store; feeds `activeProfile` + `pinnedFlagSigns`.
- `const screen = useUi((s) => s.screen);` — current screen, drives active-tab state.
- `const go = useUi((s) => s.go);` — navigation dispatch. All tab/menu taps call this.
- `const profile = activeProfile(app);` — active family profile (may be `null`).
- `const requests = profile ? pinnedFlagSigns(app, profile.id).filter((f) => f.raisedByProfileId !== profile.id).length : 0;` — count for the profile-button `Badge`. Keep this exact expression.

**Navigation calls (do not rename the Screen `name`s)**
- Tab taps: `onClick={() => go({ name: tab.name } as Screen)}` where `tab.name` ∈ `"home" | "camera" | "allSigns" | "family"`.
- Tab active-state mapping (keep the `active` arrays so Practise stays lit on the chooser + camera):
  - home → `active: ["home"]`
  - camera → `active: ["practiseChooser", "camera"]` (hero flag being removed does NOT change routing)
  - allSigns → `active: ["allSigns"]`
  - family → `active: ["family"]`
- Profile-menu items: `go({ name: it.name })` where `it.name` ∈ `"progress" | "settings"`.
- `isActive = (tab) => tab.active.includes(screen.name)` — keep.

**Local state / interaction**
- `const [menuOpen, setMenuOpen] = useState(false);` — profile menu open/close. Keep the toggle `onClick={() => setMenuOpen((v) => !v)}`, the scrim `onClick={() => setMenuOpen(false)}`, and each item's `setMenuOpen(false)`.
- `aria-haspopup="menu"`, `aria-expanded={menuOpen}`, `role="menu"`, `role="menuitem"`, `aria-current={active ? "page" : undefined}` — preserve all ARIA.

**i18n `t()` calls (every one must survive)**
- `t("navLearn", l)` (Home tab label), `t("navPractise", l)`, `t("navDictionary", l)`, `t("navFamily", l)`, `t("navProfile", lang)` (profile button label + `aria-label` + both `<nav aria-label>`s), `t("navProgress", lang)` (menu item), `t("setTitle", lang)` (Settings menu item), `t("close", lang)` (scrim `aria-label`).

**Props / sub-components**
- Component signature: `export function AppNav({ lang }: { lang: Lang })` — unchanged.
- `<Avatar emoji={profile.emoji} />` and `<Avatar emoji={profile.emoji} size="sm" />` — keep.
- `<Badge count={requests} />` — keep, only when `requests > 0`.
- `<Icon name=… fill={active} className=… />` — keep the Material-Symbols `Icon` component and the `fill` prop for active tabs. Icon `name`s: `home`, `videocam`, `menu_book`, `favorite`, `account_circle`, `monitoring`, `settings`, `sign_language` (rail brand mark).
- `profile.displayName` in the menu header (`<bdi>` wrapper — keep for RTL name isolation).
- `ScreenShell.tsx` contract: `chrome="tabs"` mounts `<AppNav lang={lang} />` and pads content `pb-28 lg:pb-12` + `lg:ps-60`. Keep the fixed bottom bar `lg:hidden` and fixed rail `hidden lg:flex w-60` so those paddings stay correct. Keep `safe-bottom` on the mobile nav.

---

## 2 · LAYOUT — target design as ordered blocks

Lift every value literally. Latin type = **Rubik**; Arabic type = **Readex Pro**. Active accent = **teal `#0F6E6A`**.

### Block 0 — Mobile bottom bar (container)
- Element: `<nav>` fixed, `inset-x-0 bottom-0`, `z-30`, `lg:hidden`, `safe-bottom`.
- Background: `#FBF7EF` (paper/0). Design uses solid `#FBF7EF`; keep the existing `/95 backdrop-blur` translucency for scroll-under polish (visually equivalent).
- Top border: `1px solid #EDE3D2` (line).
- Padding: `9px 8px 16px` (the `16px` bottom clears the home indicator; combine with `safe-bottom`).
- Inner row: `display:flex`, tabs distributed `justify-around` / each tab `flex:1`. Existing keeps `max-w-md mx-auto` centring — retain.
- Row layout: **4 tab buttons + 1 profile button**, evenly spaced.

### Block 1 — Tab button (Home / Signs / Family — the non-centre tabs)
Per-tab button (design lines 119–128):
- Reset button: `border:none; background:none; cursor:pointer;` `display:flex; flex-direction:column; align-items:center; gap:5px;` `padding:4px 0;` Keep `min-h-[48px] min-w-[48px]` hit target.
- **Icon box:** `width:26px; height:24px; display:flex; align-items:flex-end; justify-content:center;` Render the Material `Icon` at ~`24px` (`text-2xl`).
  - Active icon colour: `#0F6E6A`, `fill` on.
  - Inactive icon colour: `#B8C4C1` (design `col` inactive), `fill` off. (Existing used `text-ink/55` — change to `#B8C4C1`.)
- **Label** (below icon, `gap:5px`):
  - Active: `font: 700 10px/1 Rubik` (AR: Readex Pro), colour `#0F6E6A`.
  - Inactive: `font: 500 10px/1 Readex Pro` (LTR: still 500 10px Rubik), colour `#8F9C99`.
- Copy: Home = `t("navLearn")`, Signs = `t("navDictionary")`, Family = `t("navFamily")`.

### Block 2 — Practise / camera tab (FLATTENED centre tab)
- **Remove the coral hero** (`-mt-5 h-14 w-14 rounded-full shadow-coral bg-coral text-white`). Render identical to Block 1: flat icon box + label.
- Icon: Material `videocam`, active `#0F6E6A` / inactive `#B8C4C1`. (Design draws a rounded-rect camera body `22×20`, radius `6px`, with a `9×9` white centre dot — the Material `videocam` glyph is the accepted equivalent; **never mirror** it, see §6.)
- Label: `t("navPractise")`, same active/inactive type + colour as Block 1.
- Active when `screen.name` ∈ `practiseChooser | camera`.

### Block 3 — Profile button (rightmost / end slot; NOT in the pure design, preserved)
- Container: `relative flex flex-col items-center justify-center`, same `min-h-[48px] min-w-[48px]`, `gap:5px`.
- Avatar when a profile exists: `<Avatar emoji={profile.emoji} size="sm" />`; else Material `account_circle` at `text-2xl` colour `#0F6E6A`.
- Requests badge: absolute, end/top, `<Badge count={requests} />` (coral `#E8654C`), only when `requests > 0`. In AR, count renders Eastern-Arabic numerals (`٠١٢٣٤٥٦٧٨٩`) per HANDOFF §2.
- Label: `t("navProfile")`, `700/500 10px` — restyle to match tab labels: active/hover colour `#0F6E6A`, resting `#8F9C99` (was `text-ink/60`).
- Focus ring: `focus-visible:ring-2 focus-visible:ring-teal` (teal `#0F6E6A`).

### Block 4 — Profile menu (popover, opens on profile-button tap)
Restyle the existing menu to design tokens (design's `Home Path` popover, lines 132–147, is the visual reference — a paper sheet with rounded top).
- Scrim: `fixed inset-0 z-40`, `rgba(22,48,46,.20)` (`bg-ink/20`) + `backdrop-blur-[2px]`. `aria-label={t("close")}`. (Design uses `rgba(22,48,46,.5)` for full-screen sheets; keep `.20` for this small anchored menu.)
- Panel: anchored `bottom-full end-0` on mobile (opens upward), `lg:top-0 lg:start-full` on desktop (opens to the side). `w-52`. Background `#FBF7EF`, border `1px solid #EDE3D2`, radius `24px` (`rounded-3xl`), shadow `shadow-lift` (soft elevation; design sheet uses `0 -10px 40px rgba(0,0,0,.2)`), `overflow-hidden`, `z-50`.
- Header row (when `profile`): `flex items-center gap-3`, border-bottom `1px solid #EDE3D2`, padding `12px 16px`. `<Avatar emoji>` + name (`font: 800 15px Rubik` truncated, `#16302E`) + sub-label `t("navProfile")` (`font: 500 12px`, colour `#5C726F` text/sub). Keep `<bdi>` around `displayName`.
- Menu items (Progress, Settings): `flex w-full items-center gap-3`, padding `12px 16px`, `text-start`, `font: 600 15px Rubik` (`font-display font-semibold`), colour `#16302E`. Leading Material icon (`monitoring`, `settings`) at `text-xl` colour teal `#0F6E6A`. Hover/focus bg: `teal/5` (`rgba(15,110,106,.05)`).
  - Progress → `go({ name: "progress" })`, label `t("navProgress")`.
  - Settings → `go({ name: "settings" })`, label `t("setTitle")`.

### Block 5 — Desktop left rail (preserved; not in design — token-restyled)
- `<nav>` fixed `inset-y-0 start-0 z-30 hidden lg:flex flex-col w-60`, `px-4 py-8`, `border-e 1px solid #EDE3D2`, background `#FBF7EF` (keep `/95 backdrop-blur`).
- Brand block (top, `mb-6 px-3`, `flex items-center gap-3`): Material `sign_language` `fill` `text-2xl` teal `#0F6E6A`; wordmark `sawiyya` + gold dot — `font: 800 20px Rubik` (`text-xl font-bold tracking-tight`) colour teal `#0F6E6A`, `dir="ltr"`, the `.` in gold/mid `#E6B24C` (existing `text-gold`).
- Rail tab (vertical variant): `w-full flex items-center gap-3 rounded-2xl px-4 py-3`, `font: 700 Rubik`.
  - Active: bg `teal/10` (`rgba(15,110,106,.10)`), text + icon teal `#0F6E6A`.
  - Inactive: text `#8F9C99`/`text-ink/60`, hover bg `teal/5`; icon inactive `#B8C4C1`.
  - Same 4 tabs, same labels/routing as mobile.
- Profile button pinned bottom (`mt-auto`) — same as Block 3 (menu opens to the side: `lg:start-full lg:top-0 lg:ms-3`).

**Fanan pose:** none in this screen. Fanan (the fennec fox) appears only on the Home learning-path node (current node, cheering) and inside popovers on the path — **not in the nav bar or rail**. Do not add Fanan to nav.

---

## 3 · COPY — every visible string

Reuse the existing i18n keys (all already wired). The design's English/Arabic wording differs slightly from the shipped values — see "Design delta" column. **Default: keep the shipped i18n values** (they are the functional contract). The deltas are optional copy decisions for the owner, not required by the reskin.

| Key (existing) | English (shipped) | Arabic (shipped) | Design label EN | Design label AR |
|---|---|---|---|---|
| `navLearn` | Learn | تعلّم | Home | الرئيسية |
| `navPractise` | Practise | تدرّب | Practise | تمرين |
| `navDictionary` | Signs | القاموس | Signs | الإشارات |
| `navFamily` | Family | العائلة | Family | العائلة |
| `navProfile` | Profile | حسابي | (profile btn — not in design) | — |
| `navProgress` | Progress | التقدم | Progress | التقدّم |
| `setTitle` | Settings | الإعدادات | (in profile menu) | — |
| `close` | Close | إغلاق | (scrim a11y) | — |
| `back` | Back | رجوع | (ScreenShell takeover) | — |

Stat-chip / greeting copy in the phone mockups (`Marhaba, Layla`, `day streak`, `gold`, `family`, `First Words`) belongs to the **Home** screen, not the nav — out of scope here.

---

## 4 · NEW-I18N — keys not already in `src/i18n.ts`

**None.** Every label the nav needs (`navLearn`, `navPractise`, `navDictionary`, `navFamily`, `navProfile`, `navProgress`, `setTitle`, `close`, `back`) already exists in `src/i18n.ts`. No append required.

*(Only if the owner opts into the design's exact wording — Home tab reading "Home"/"الرئيسية" instead of "Learn"/"تعلّم", and AR "تمرين"/"الإشارات"/"التقدّم" — would you edit those existing values in place. That is a copy change, not a new key, and is NOT part of the reskin.)*

---

## 5 · MOTION / STATES

**Transitions**
- Tab active↔inactive: colour + icon-fill swap, `transition` on colour, `ease standard` `.4,0,.2,1` / `220ms`.
- Profile menu open/close: sheet rises from the anchored edge — `animation: rise .28s ease both` (design popover) → on mobile translateY from bottom; desktop side menu can fade/slide from the start edge. Use **spring-out** `.34,1.56,.64,1` `260ms` for the pop-in if a spring feel is wanted; scrim fades `180ms`.
- Focus-visible: `ring-2 ring-teal` on every button (keyboard only).

**States**
- **Active tab:** teal `#0F6E6A` icon (filled) + teal bold `700 10px` label.
- **Inactive tab:** `#B8C4C1` icon (unfilled) + `#8F9C99` `500 10px` label.
- **Hover (desktop rail / menu items):** bg `teal/5`.
- **Profile — no active profile (`profile == null`):** show `account_circle` icon instead of `Avatar`; menu header row is hidden; menu still shows Progress + Settings.
- **Requests badge:** only when `requests > 0`; coral `#E8654C`, Eastern-Arabic numerals in AR.
- **Menu closed:** default; scrim absent.
- No loading/empty/error states exist for the nav itself (it is always mounted with `chrome="tabs"`).
- **Reduce-motion:** freeze the rise/spring; apply the state change instantly (HANDOFF Motion).

---

## 6 · RTL — mirror vs. never-mirror

Design the **Arabic (RTL) panel first**; anchor to the start edge with `dir="rtl"` + logical properties (the component already uses `inset-inline`, `start/end`, `ms/me/ps/pe` — keep them).

**Mirrors (flips in RTL):**
- Tab reading order — first tab (Home) sits at the **inline-start = right** edge in AR (screenshots `path2.png` confirm `الرئيسية` on the right, `التقدّم`/Progress on the left).
- Profile button + menu anchor: `end-0` / `start-full` swap sides automatically.
- Rail lives on `inset-inline-start` (left in LTR, **right in AR**) with `border-e`.
- Menu header/item layout (icon leads on the start edge).
- Numerals: badge count uses Eastern-Arabic `٠١٢٣٤٥٦٧٨٩` in AR.

**Never mirrors (physical / brand — keep as-is both directions):**
- The **camera / videocam** glyph on the Practise tab (play/camera/record glyphs are physical — HANDOFF §2).
- The **checkmark** (used on path nodes; if any check appears, no flip).
- **Fanan** the fox and the **`sawiyya.` wordmark / `sign_language` brand mark** on the rail (`dir="ltr"` stays on the wordmark).
- Sign-language **handshapes** (not present in nav, but the rule holds).

---

### Summary
6 layout blocks (mobile bar container, standard tab, flattened Practise tab, profile button, profile menu, desktop rail). **0 new i18n keys** — all labels reuse existing keys in `src/i18n.ts`.
