# Vendored fonts (L8)

Self-hosted so the three render-blocking Google Fonts requests are gone and the
app works fully offline from install. Loaded via `src/fonts.css` (imported by
`src/main.tsx`).

## `readex-pro-*.woff2` — UI/body text (dual Latin+Arabic)
- Source: `https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&display=swap`
- Fetched 2026-07-03 with a desktop-Chrome UA (to get woff2). Google serves ONE
  variable-weight file per script subset for this family, so 5 requested
  weights collapse to 4 files (arabic / vietnamese / latin-ext / latin) — same
  bytes as before, just vendored instead of fetched from fonts.gstatic.com.

## `rubik-*.woff2` — display + numerals
- Source: `https://fonts.googleapis.com/css2?family=Rubik:wght@500;600;700;800&display=swap`
- Same fetch method; 6 files (per-script variable-weight, incl. cyrillic-ext
  which the font ships as its own subset).

## `material-symbols-outlined.woff2` — icon glyphs
- Source: the full variable Material Symbols Outlined font
  (`fonts.gstatic.com/s/materialsymbolsoutlined/v355/...woff2`, 2.33MB, axes
  FILL/opsz/wght).
- Processing (one-time, via `pip install fonttools brotli`; this is a
  build-time asset tool, not a runtime dependency):
  1. `fonttools varLib.instancer ... opsz=24 wght=400` — the app only ever
     toggles the FILL axis (`.material-fill` in styles.css); opsz/wght never
     vary, so pinning them collapses most of the variable-font glyph/gvar data.
     2.33MB → 458KB.
  2. `pyftsubset --text="<the ~48 icon names this app renders>" --layout-features='*'`
     — icon names render via GSUB ligature substitution (typing "search"
     resolves to the glyph), so subsetting by the literal name TEXT (not by
     Unicode codepoint) is what keeps the right ligature rules + glyphs. 458KB
     → 343KB.
- If a new icon name is added to the app, regenerate from the full font with
  the icon list extended (grep `<Icon name="` across `src/**/*.tsx` for the
  current list) — a name outside the subset renders as literal text, not tofu.
