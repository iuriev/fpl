# Design Export v2 — Change Report

Diff base: `design/exports/v1/` → `design/exports/v2/`

## Summary

v2 delivers the visual implementation of the **list-view-toggle** change that was spec'd in
`openspec/changes/list-view-toggle/` (previously deferred to a design pass). It also fixes the
pitch row order and consolidates the two legacy `screens.jsx` / `screens-v2.jsx` files into a
single authoritative `screens.jsx`.

---

## 1. Tokens (`tokens.js`, `colors_and_type.css`)

**No changes.** Both files are byte-for-byte identical to v1 except for one comment line in
`tokens.js` (the reference was updated from `screens-v2.jsx` to `screens.jsx`). No new CSS
variables, no value changes, no new token categories.

---

## 2. Design components

### 2a. `pitch.jsx` — pitch row order corrected

Two logical changes:

| Before (v1) | After (v2) |
|---|---|
| Row order `[gk, def, mid, fwd]` (GK at top) | Row order `[fwd, mid, def, gk]` (FWD at top, GK at bottom) |
| Skeleton counts `[1, 4, 4, 2]` (GK, DEF, MID, FWD) | Skeleton counts `[2, 4, 4, 1]` (FWD, MID, DEF, GK) |

This is a **bug fix**: the team should attack upward, matching the official FPL app convention
(GK at the bottom, FWD at the top). The existing `openspec/changes/mvp-squad-viewer` task 6.1
specifies this order; v1 had it inverted.

**Affected React components to fix:** `Pitch` (row rendering), `PitchSkeleton` (bench skeleton
count array).

### 2b. `list.jsx` — new file

A complete new component module was added. It exports:

| Component | Description |
|---|---|
| `ViewToggle` | Segmented pill control (Pitch / List); active tab filled in `--fpl-accent` |
| `ListView` | Full list view: sticky column header + positional sections + `ListRow` |
| `ListRow` | Single player row: sticky identity column (kit + name + `PositionBadge` + club) + 13 stat cells |
| `ListColumnHeader` | Sticky top header for all columns |
| `SectionHeader` | Position group label (Goalkeeper / Defenders / …) |
| `ListRowSkeleton` | Loading state for a single row |
| `ListViewSkeleton` | Full loading state (repeated `ListRowSkeleton`) |
| `PositionBadge` | Coloured position pill (GK yellow, DEF blue, MID green, FWD red/pink) |
| `CapInlineBadge` | Inline C/V badge for the list row identity column |
| `StatusDot` | Tiny availability dot overlaid on the kit icon |

Key layout decisions visible in the component:

- Identity column width: `168px` (sticky left, with a right-side drop shadow).
- Stat columns: 13 columns (Pts, MP, GS, A, CS, GC, OG, PS, PM, YC, RC, S, Bonus) — widths
  range 36–44 px each; `total_points` (Pts) column is highlighted in accent green.
- Zero stat values render in `--fpl-muted-soft` so meaningful numbers stand out.
- The whole view scrolls both vertically and horizontally inside a fixed-height container.
- Section grouping: GK → DEF → MID → FWD → Bench (ascending position order, opposite of the
  pitch which uses descending/attacking order).

Stat field keys mirror the FPL `/event/{gw}/live/` payload exactly (per design-994f6b45.md §D3).

### 2c. `screens.jsx` — substantial rewrite; replaces both legacy files

v1 had two files:
- `screens.jsx` — old light-palette prototype (oklch colors, white background — was the initial
  exploration before the FPL dark palette was settled).
- `screens-v2.jsx` — the dark FPL palette screens, without list-view support.

v2 collapses these into a single `screens.jsx` that:
1. Uses the FPL dark palette and `FPL_TOKENS` throughout (no hardcoded light-theme colors).
2. Adds full `stats` objects to every demo player datum (using the `_s()` helper to mirror the
   proxy response shape).
3. Adds `TRANSFER_HIT`, `NET_POINTS`, and `SUMMARY` constants for the summary strip demo.
4. Mounts `ViewToggle` in every `SquadScreen` state (loaded, loading, empty).
5. In `SquadScreenLoaded`, renders `ListView` when `view === 'list'` and `Pitch + BenchStrip`
   when `view === 'pitch'`.
6. In `SquadScreenLoading`, renders `ListViewSkeleton` when `view === 'list'` and the existing
   pitch skeleton when `view === 'pitch'`.
7. Arrow buttons (`GwArrow`) are now pill-shaped (`borderRadius: 999`) rather than square
   (`borderRadius: 10`), and are styled with a tinted accent background + accent border when
   enabled, matching the existing `button-arrow` preview card.
8. Logo mark changed: `Logo` (abstract pitch-square SVG) → `FPLMark` (lightning bolt on accent
   square background). Entry screen brand label changes from "FPL Squad Viewer" to "Squad
   Viewer".
9. Entry screen headline copy changed: "See your squad, game by game." → "Your squad. Every
   gameweek." (locked copy per CLAUDE.md).
10. Primary button fill on Entry: dark ink → `FPL.accent` (neon green) when enabled.
11. `StatusBar` and `HomeIndicator` gain a `light` prop (default `true`) for the dark surface
    instead of a `dark` prop.
12. `SquadHeader` background changed: `T.card` (white) → `transparent` (sits on deep purple).
13. `GwControl` no longer shows the total-pts sub-label under the gameweek number.
14. `SquadScreenEmpty` "Jump to current GW" button changes: `borderRadius: 12` → `999`, fill
    changes from `T.ink` to `FPL.accent`, color `#fff` → `FPL.bgDeep`.

---

## 3. Screens and canvas

### `FPL Squad Viewer.html`

- Title changed from "FPL Squad Viewer — Design Sheet" to "FPL Squad Viewer — Pitch layout".
- Now loads `colors_and_type.css`, `tokens.js`, `pitch.jsx`, and `list.jsx` in addition to the
  existing screen scripts.
- Squad section renamed to "Squad screen — Pitch view".
- New section added: **"Squad screen — List view"** with three artboards:
  - A · Loaded (default scroll)
  - B · Loaded (scrolled right, `listScroll={260}`)
  - C · Loading

### `FPL Design System.html`

No changes.

---

## 4. Preview cards

- `pill-position.html` **removed** (was in v1, not in v2).
- All other cards are identical between versions (byte-level diff: only the `min-height` on
  `pill-player.html` changed from `130px` to `180px` to accommodate the extra states shown).

---

## 5. Assets

**Shirts:** identical set in both versions (`shirt_3.webp`, `shirt_3_gk.webp`, `shirt_8.webp`,
`shirt_11.webp`, `shirt_43.webp`).

**New files in v2 (design-only, not production assets):**
- `uploads/design-994f6b45.md` — the list-view-toggle design doc (the spec that this export
  implements visually).
- `FPL Squad Viewer v2.html`, `debug.png`, `v2-preview.png`, `v2-squad-only.png`, `v2-squad.png`
  — designer working artefacts; not referenced by production code.
- `ios-frame.jsx` — iOS chrome wrapper used in the design canvas only.

---

## 6. Code areas affected (in the `web/` SPA)

| Area | Impact |
|---|---|
| `web/src/theme/` | No token changes needed |
| `web/src/components/Pitch` / `PitchSkeleton` | **Row order bug fix**: FWD at top, GK at bottom |
| `web/src/components/ViewToggle` | **New** component (from `list.jsx` `ViewToggle`) |
| `web/src/components/ListView` | **New** component family (from `list.jsx` `ListView`, `ListRow`, etc.) |
| `web/src/components/PositionBadge` | **New** component (replaces `pill-position` preview concept) |
| `web/src/components/CapInlineBadge` | **New** small badge for list rows |
| `web/src/components/StatusDot` | **New** availability dot for list rows |
| `web/src/components/GwArrow` | Style change: square → pill, accent-tinted background |
| `web/src/components/Logo` / `FPLMark` | Logo mark redesigned (lightning bolt on accent bg) |
| `web/src/screens/EntryScreen` | Copy + button style changes |
| `web/src/screens/SquadScreen` | Mounts `ViewToggle`; conditionally renders list vs pitch view |
| `web/src/components/SquadHeader` | Background: white → transparent |
| `web/src/components/GwControl` | Remove total-pts sub-label |
| `openspec/changes/list-view-toggle/tasks.md` | Tasks 2.x and 3.x now have a complete reference implementation |
