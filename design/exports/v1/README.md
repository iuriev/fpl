# FPL Squad Viewer — Design System

The design language for a mobile-first FPL squad viewer. Greenfield MVP, no
auth, identified by public team ID. The visual direction is pulled from the
official FPL app: **deep purple surface, neon-green accent, real club kit
imagery, and a green pitch with white markings.**

## Index

| File | Purpose |
|---|---|
| `tokens.js` | Single source of truth for every token. Loaded as a vanilla `<script>`; populates `window.FPL_TOKENS` and legacy aliases (`window.FPL`, `window.F_DISP`, `window.F_MONO`). |
| `colors_and_type.css` | The same tokens as CSS custom properties (`--fpl-*`) plus a small set of semantic role classes (`.fpl-h1`, `.fpl-overline`, etc). |
| `pitch.jsx` | UI kit components — `Jersey`, `Pitch`, `PitchPlayer`, `BenchStrip`, `AvailBadge`, plus skeletons. Real shirt images live in `assets/shirts/`. |
| `screens-v2.jsx` | Full screen compositions — `EntryScreenV2`, `SquadScreenV2`. Built on top of pitch.jsx + tokens. |
| `assets/shirts/` | Real club kit PNG/WebPs, named by FPL team code (`shirt_3.webp` = Arsenal, `shirt_43.webp` = Man City, etc). |
| `preview/` | One ~700-wide HTML card per token/component for the Design System tab. |
| `FPL Squad Viewer v2.html` | Full design sheet — every screen × state on a single design canvas. |

## Sources

- `uploads/design-4159c274.md` — the latest UX/tech design doc (Entry +
  Squad screens, gameweek summary strip, availability flags, proxy data
  contract).
- `uploads/shirt_*.webp` — real club kit images from the user, copied into
  `assets/shirts/`.

## Visual foundations

**Palette.** Deep purple stack (`#170027` → `#220035` → `#2D0844` → hairline
`#3D1A55`) for surface; bright accent green `#00FF87` for anything
interactive or value-emphatic; white text on dark, muted lavender for
secondary copy. Pitch uses two greens (`#1FA64B` / `#17933E`) with 70 %
white line markings. Status colors are sharp: warn yellow `#FFC000` and
error/unavailable pink-red `#FF4D6D`.

**Typography.** **Space Grotesk** for the display + UI (400, 500, 600, 700,
800). Geometric, tight; pairs cleanly with the punchy palette. **JetBrains
Mono** for IDs, club codes, URLs, raw values — tabular-nums where numeric.
Display sizes are tracked tight (`-0.035em` on hero); micro caps are tracked
wide (`0.10em–0.12em`).

**Spacing.** Mostly 4 / 8 / 12 / 16 / 20 / 24 — see `spacing-scale` card.

**Radii.** `12px` is the workhorse (inputs, buttons, cards). `5–8px` for
small pills, `999px` for circle buttons and the captain dots, `999px` for
the "Jump to GW" pill.

**Elevation.** Soft (`0 2px 6px / .35`) for floating chips on the pitch;
firmer (`0 2px 6px / .45`) for player pills against the bright grass; a
small dot-shadow (`0 1px 3px / .40`) for the captain & availability badges;
the jerseys themselves get a `drop-shadow` filter so the silhouette lifts
off the field.

**Imagery.** Real shirt images (transparent WebPs) carry club identity —
not crests, not stripes-as-SVG. Pitch is drawn live (SVG) and stays in
brand greens.

**Animation.** Skeleton shimmer (1.6 s ease-in-out), `120–240 ms` micro
transitions on state changes. No big page-level animations.

## Content fundamentals

- **Tone:** plain, helpful, second-person ("Your squad. Every gameweek.").
  No marketing fluff, no exclamation marks, no emoji.
- **Casing:** sentence case for everything. ALL-CAPS only for tight
  overlines and stat labels (with wide tracking).
- **Numbers:** mono + tabular-nums. Always. Missing values render as an
  em-dash `—`, never `null` / `N/A`.
- **Errors:** human, specific, no jargon ("We couldn't find a team with
  that ID. Please check and try again.")
- **Microcopy that earns its place:** ID hint shows the literal FPL URL
  shape with `{ID}` and `{GW}` highlighted in accent.

## Iconography

- Lightweight SVG glyphs, drawn inline at point of use (arrows, error dots,
  retry, captain "C/V" letters). No icon font, no library.
- Single-line strokes (1.6–2.2 px) at small sizes. Rounded caps and joins.
- No emoji.
- Captain / availability flags are typographic discs, not pictograms.

## Components in use

See `preview/` for a card per component. Headline pieces:

- **Primary button** — h56, radius 12, accent fill + dark ink. Disabled →
  bg-soft / muted-soft.
- **Pill button** — radius ∞, h44, accent fill — used in the empty-state
  "Jump to current GW".
- **Text link** — `Change`, `Try again` — accent, no underline, 14/700.
- **Arrow button** — 36 circle, accent-tinted bg + accent border when
  enabled; transparent + hairline border when disabled.
- **Input** — h56, radius 12, mono value. Error → red border + 3 px soft
  red glow + tinted value.
- **Captain / Vice badge** — 18 circle, accent or white.
- **Availability badge** — 18 circle, semantic color, `! / + / ! / ×` glyph
  for doubtful / injured / suspended / unavailable.
- **Player pill** — jersey + 2-row name/pts pill (dark + accent). The
  workhorse on the pitch.
- **Summary strip cell** — overline label + tabular value; centre cell
  ("TOTAL") promoted to 22 px accent.
