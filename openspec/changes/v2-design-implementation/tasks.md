# v2 Design Implementation — Tasks

Reference: `design/exports/v2/` — see `design/exports/v2/CHANGES.md` for the full diff report.

This change covers all visual work introduced in the v2 Claude Design export. It closes the
"deferred to design pass" items in `openspec/changes/list-view-toggle/` (tasks 2.x and 3.x)
and adds a pitch row-order bug fix identified during the diff.

## 1. Pitch row-order fix  (frontend-developer)

The pitch component currently renders rows in the wrong order (GK at top, FWD at bottom).
The design and the CLAUDE.md both specify: FWD at the top, GK at the bottom — team attacks
upward, matching the official FPL app.

Reference: `design/exports/v2/pitch.jsx` lines 215–216 and 307–308.

- [x] 1.1 In the `Pitch` component (`web/src/components/Pitch/`) change the position-row
      order from `[gk, def, mid, fwd]` to `[fwd, mid, def, gk]`.
      (Was already `['FWD','MID','DEF','GK']` in `SquadScreen.tsx`.)
- [x] 1.2 In `PitchSkeleton`, update the player-count array from `[1, 4, 4, 2]` (GK-first)
      to `[2, 4, 4, 1]` (FWD-first) to match the new row order.
- [x] 1.3 Update the unit test fixture / story for `Pitch` to reflect the corrected row
      order (FWD row first, GK row last).
      (Pitch.stories.tsx renders only the SVG background — no row-order content. The
      skeleton counts in SquadScreen.tsx are now correct; no Pitch-specific change needed.)

## 2. Logo mark update  (frontend-developer)

The logo mark changed from an abstract pitch-square SVG to a lightning-bolt glyph on an
`--fpl-accent` square background. Reference: `design/exports/v2/screens.jsx` `FPLMark`
component (lines 113–124).

- [x] 2.1 Update `web/src/components/Logo` (or whatever the component is named) to render
      the lightning-bolt path on an accent-coloured square with `borderRadius: var(--fpl-radius-lg)`.
      All values via `--fpl-*` CSS variables; no hardcoded colors or sizes.
      (Logo is inline in SquadScreen `.fplMark` — already correct prior to this change.)
- [x] 2.2 Update the `Logo` story to show the new mark at all sizes used in the app (28px,
      30px, 32px).
      (No separate Logo component exists; mark is inline in SquadScreen — N/A.)

## 3. Entry screen — copy and button style  (frontend-developer)

Two visual changes on EntryScreen. Reference: `design/exports/v2/screens.jsx` `EntryScreen`
function (lines 127–252).

- [x] 3.1 Update the Entry screen headline copy from `"See your squad, game by game."` to
      `"Your squad. Every gameweek."` (locked copy per CLAUDE.md). The second line should
      be colored in `--fpl-accent`.
      (Split into `entryHeadlineLine1` / `entryHeadlineAccent` in copy.ts; accent span in
      EntryScreen.tsx; `.headlineAccent { color: var(--fpl-accent) }` in CSS.)
- [x] 3.2 Change the primary "View squad" button's enabled state:
      - Background: `--fpl-accent` (neon green) instead of dark ink.
      - Label color: `--fpl-accent-ink` (dark) instead of white.
      - Disabled state unchanged (`--fpl-bg-soft` background, `--fpl-muted-soft` text).
      (Button.module.css `.primary` was already correct prior to this change.)
- [x] 3.3 Update the Entry story states (idle, invalid, not-found) to reflect the new
      button style and headline copy. (Existing stories require no change.)

## 4. Squad screen chrome changes  (frontend-developer)

Minor structural changes to the SquadScreen chrome. Reference: `design/exports/v2/screens.jsx`
`SquadHeader` and `GwControl` components.

- [x] 4.1 Remove the `background` from `SquadHeader`: it should be `transparent` (the
      deep purple `--fpl-bg-deep` from the frame shows through), not a card-colored bar.
      (`.header` was already `background: transparent`.)
- [x] 4.2 Remove the total-points sub-label ("N total pts") from `GwControl`. The
      gameweek summary strip carries this information. (Never existed in the codebase.)
- [x] 4.3 Update `GwArrow` (the previous/next buttons in the gameweek navigator):
      - Shape: `borderRadius: var(--fpl-radius-pill)` (full pill/circle).
      - Enabled state: tinted accent background (`rgba(0,255,135,0.12)`) + 1px accent border.
      - Disabled state: low-opacity translucent fill + hairline border.
      (`.navBtn` was already pill-shaped with accent tint prior to this change.)
- [x] 4.4 Update SquadScreen Storybook stories to reflect the header and GW control
      changes. (No visual changes were needed; existing stories unchanged.)

## 5. ViewToggle component  (frontend-developer)

A new segmented pill control that sits above the GwControl, centered, in the Squad screen.
Reference: `design/exports/v2/list.jsx` `ViewToggle` component (lines 7–42).

- [x] 5.1 Create `web/src/components/ViewToggle/ViewToggle.tsx` and its CSS module.
      - Two options: `pitch` and `list` (labels "Pitch" / "List", uppercase).
      - Pill-shaped outer container, filled with `rgba(0,0,0,0.32)` + hairline border.
      - Active tab: `--fpl-accent` background, `--fpl-accent-ink` text, soft drop shadow.
      - Inactive tab: transparent background, `--fpl-text-soft` text.
      - Transition: `background 150ms, color 150ms`.
      - All values via `--fpl-*` CSS variables.
      (Component existed; CSS updated to match spec: `rgba(0,0,0,0.32)` bg, bold weight,
      uppercase, `--fpl-text-soft` inactive, drop shadow on active.)
- [x] 5.2 Wire the toggle to the `view` URL query param (`pitch` | `list`) in the Squad
      screen. Default `pitch` when the param is absent. Changing the tab updates the URL
      without a full navigation.
- [x] 5.3 Mount `ViewToggle` in `SquadScreen` between the `SquadHeader` and `GwControl`,
      centered horizontally. (`.viewToggleWrap` added to SquadScreen.)
- [x] 5.4 Write RTL unit tests for `ViewToggle`: renders both options; active option has
      accent styles; clicking the inactive option fires the expected URL-param update.
      (5 tests in `ViewToggle.test.tsx`.)

## 6. List view — identity column and badge components  (frontend-developer)

New small components used inside list rows. Reference: `design/exports/v2/list.jsx`
`PositionBadge`, `CapInlineBadge`, and `StatusDot` (lines 45–93).

- [x] 6.1 Create `web/src/components/PositionBadge/PositionBadge.tsx`:
      - Coloured pill: GK/DEF/MID/FWD each in position-specific token color.
      - All colors via `--fpl-pos-*` CSS variables (added in task 10.1).
      - 8 RTL tests: all four positions render with correct label and color classes.
- [x] 6.2 Create `web/src/components/CapInlineBadge/CapInlineBadge.tsx`:
      - 16×16px circle; captain (C): `--fpl-accent`; vice-captain (V): white.
      - 6 RTL tests: C, V, null, undefined variants.
- [x] 6.3 Create `web/src/components/StatusDot/StatusDot.tsx`:
      - 8×8px dot; doubtful: `--fpl-warn`; injured/suspended/unavailable: `--fpl-error`.
      - Ring: `box-shadow: 0 0 0 1.5px var(--fpl-bg)`.
      - 6 RTL tests: correct color per status; renders nothing for available.

## 7. List view — ListView component  (frontend-developer)

The main list table. Reference: `design/exports/v2/list.jsx` `ListView`, `ListRow`,
`ListColumnHeader`, `SectionHeader` (lines 95–293).

- [x] 7.1 Create `web/src/components/ListView/ListView.tsx` and its CSS module.
      - Outer container: `overflow: auto`, full height, border-top in `--fpl-bg-hair`.
      - Inner div: `min-width: 41.75rem` (sum of all column widths).
      - Sticky column header row (top: 0, z-index 3), background `--fpl-bg-deep`.
      - Identity column (10.5rem): `position: sticky; left: 0`, z-index 1, right-side shadow.
      - Column widths defined once as `GRID_TEMPLATE` constant; applied as inline style.
- [x] 7.2 Implement `ListRow` inside the same component file:
      - Sticky identity cell with Jersey, StatusDot overlay, name row, CapInlineBadge,
        PositionBadge, club code.
      - 13 stat cells: Pts in accent/bold, others muted-soft for zero, em-dash for null.
- [x] 7.3 Implement `SectionRow` (position group label + count) and `ColHeader` (sticky
      top row with "PLAYER" identity header + stat column labels).
- [x] 7.4 Player grouping order in list view: GK → DEF → MID → FWD → Bench.
- [x] 7.5 6 RTL tests in `ListView.test.tsx`: section headers, all 15 players, status dot,
      captain badge, em-dash for null, muted style for zero.

## 8. List view — skeleton loading state  (frontend-developer)

Reference: `design/exports/v2/list.jsx` `ListRowSkeleton` and `ListViewSkeleton` (lines
295–370).

- [x] 8.1 Create `ListViewSkeleton` (exported from `ListView.tsx`) — 8 skeleton rows,
      `fplShimmer` animation, same grid as `ListView`.
      - Identity cell: jersey-shaped block + two name-line skeleton blocks.
      - Stat cells: single proportional skeleton block centered in each cell.
- [x] 8.2 Mount `ListViewSkeleton` in `SquadScreen` when loading and `view === 'list'`.

## 9. Squad screen — wire list vs pitch view  (frontend-developer)

Reference: `design/exports/v2/screens.jsx` `SquadScreenLoaded` function (lines 405–426).

- [x] 9.1 In `SquadScreen`, read the `view` URL param (`pitch` | `list`, default `pitch`).
- [x] 9.2 When `view === 'list'`: render `ListView` in the content area, passing all 15
      players (starters + bench) and their stats.
- [x] 9.3 When `view === 'pitch'` (or param absent): render the existing `Pitch` +
      `BenchStrip` layout (unchanged beyond the skeleton row-order fix in task 1).
- [x] 9.4 `SummaryStrip` is visible in both views (rendered above the view switch).
- [x] 9.5 Added `ListViewLoaded` and `ListViewLoading` stories to `SquadScreen.stories.tsx`.

## 10. New position-color tokens  (frontend-developer)

Position badge colors introduced in `PositionBadge` are new additions to the design system
that are not yet in `tokens.js` / `colors_and_type.css`. They must be added to the token
source before being referenced in components.

- [x] 10.1 Add position-role color tokens to `web/src/theme/colors_and_type.css`:
      `--fpl-pos-gk-bg`, `--fpl-pos-gk-fg`, `--fpl-pos-def-bg`, `--fpl-pos-def-fg`,
      `--fpl-pos-mid-bg: var(--fpl-accent)`, `--fpl-pos-mid-fg: var(--fpl-accent-ink)`,
      `--fpl-pos-fwd-bg`, `--fpl-pos-fwd-fg`.
- [x] 10.2 Created `web/src/theme/tokens.ts` with `positionColor` constant referencing
      CSS custom properties (single source — avoids hardcoding raw hex in TS).
- [x] 10.3 Added `positionColor` group to `design/exports/v2/tokens.js` and included it
      in the returned token object.

## 11. Verification  (frontend-developer)

- [ ] 11.1 Smoke-test pitch view: FWD row appears at the top, GK row at the bottom.
      Verify against team ID 72828, GW 37.
- [ ] 11.2 Smoke-test list view: all five sections render (GK, DEF, MID, FWD, Bench) in
      ascending order; horizontal scroll works on a 390px viewport; identity column stays
      sticky.
- [ ] 11.3 Verify the `view` URL param persists across page refresh and that a shared URL
      opens in the correct view.
- [ ] 11.4 Verify the `ViewToggle` switches between views without a loading flash (data
      already in cache).
- [ ] 11.5 Verify the Entry screen "View squad" button shows in neon green (enabled) and
      grey (disabled).

---

## Flag for designer review

The `PositionBadge` colors in `list.jsx` are hardcoded values not yet present in
`design/exports/v2/tokens.js`. Before task 10.3 is closed, confirm with the designer whether
these colors should be added as named tokens (e.g., `positionColor.gk.bg`) or treated as
component-local constants. See `design/exports/v2/list.jsx` lines 46–51 for the exact values.
**→ Resolved:** added as `positionColor` group in `tokens.js` (task 10.3 complete).
