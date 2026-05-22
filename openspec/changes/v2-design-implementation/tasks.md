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

- [ ] 1.1 In the `Pitch` component (`web/src/components/Pitch/`) change the position-row
      order from `[gk, def, mid, fwd]` to `[fwd, mid, def, gk]`.
- [ ] 1.2 In `PitchSkeleton`, update the player-count array from `[1, 4, 4, 2]` (GK-first)
      to `[2, 4, 4, 1]` (FWD-first) to match the new row order.
- [ ] 1.3 Update the unit test fixture / story for `Pitch` to reflect the corrected row
      order (FWD row first, GK row last).

## 2. Logo mark update  (frontend-developer)

The logo mark changed from an abstract pitch-square SVG to a lightning-bolt glyph on an
`--fpl-accent` square background. Reference: `design/exports/v2/screens.jsx` `FPLMark`
component (lines 113–124).

- [ ] 2.1 Update `web/src/components/Logo` (or whatever the component is named) to render
      the lightning-bolt path on an accent-coloured square with `borderRadius: var(--fpl-radius-lg)`.
      All values via `--fpl-*` CSS variables; no hardcoded colors or sizes.
- [ ] 2.2 Update the `Logo` story to show the new mark at all sizes used in the app (28px,
      30px, 32px).

## 3. Entry screen — copy and button style  (frontend-developer)

Two visual changes on EntryScreen. Reference: `design/exports/v2/screens.jsx` `EntryScreen`
function (lines 127–252).

- [ ] 3.1 Update the Entry screen headline copy from `"See your squad, game by game."` to
      `"Your squad. Every gameweek."` (locked copy per CLAUDE.md). The second line should
      be colored in `--fpl-accent`.
- [ ] 3.2 Change the primary "View squad" button's enabled state:
      - Background: `--fpl-accent` (neon green) instead of dark ink.
      - Label color: `--fpl-accent-ink` (dark) instead of white.
      - Disabled state unchanged (`--fpl-bg-soft` background, `--fpl-muted-soft` text).
- [ ] 3.3 Update the Entry story states (idle, invalid, not-found) to reflect the new
      button style and headline copy.

## 4. Squad screen chrome changes  (frontend-developer)

Minor structural changes to the SquadScreen chrome. Reference: `design/exports/v2/screens.jsx`
`SquadHeader` and `GwControl` components.

- [ ] 4.1 Remove the `background` from `SquadHeader`: it should be `transparent` (the
      deep purple `--fpl-bg-deep` from the frame shows through), not a card-colored bar.
- [ ] 4.2 Remove the total-points sub-label ("N total pts") from `GwControl`. The
      gameweek summary strip carries this information.
- [ ] 4.3 Update `GwArrow` (the previous/next buttons in the gameweek navigator):
      - Shape: `borderRadius: var(--fpl-radius-pill)` (full pill/circle) instead of
        `var(--fpl-radius-lg)` (square).
      - Enabled state: tinted accent background (`rgba(0,255,135,0.12)`) + 1px accent
        border.
      - Disabled state: low-opacity translucent fill + hairline border.
- [ ] 4.4 Update SquadScreen Storybook stories to reflect the header and GW control
      changes.

## 5. ViewToggle component  (frontend-developer)

A new segmented pill control that sits above the GwControl, centered, in the Squad screen.
Reference: `design/exports/v2/list.jsx` `ViewToggle` component (lines 7–42).

- [ ] 5.1 Create `web/src/components/ViewToggle/ViewToggle.tsx` and its CSS module.
      - Two options: `pitch` and `list` (labels "Pitch" / "List", uppercase).
      - Pill-shaped outer container, filled with `rgba(0,0,0,0.32)` + hairline border.
      - Active tab: `--fpl-accent` background, `--fpl-accent-ink` text, soft drop shadow.
      - Inactive tab: transparent background, `--fpl-text-soft` text.
      - Transition: `background 150ms, color 150ms`.
      - All values via `--fpl-*` CSS variables.
- [ ] 5.2 Wire the toggle to the `view` URL query param (`pitch` | `list`) in the Squad
      screen. Default `pitch` when the param is absent. Changing the tab updates the URL
      without a full navigation.
- [ ] 5.3 Mount `ViewToggle` in `SquadScreen` between the `SquadHeader` and `GwControl`,
      centered horizontally.
- [ ] 5.4 Write RTL unit tests for `ViewToggle`: renders both options; active option has
      accent styles; clicking the inactive option fires the expected URL-param update.

## 6. List view — identity column and badge components  (frontend-developer)

New small components used inside list rows. Reference: `design/exports/v2/list.jsx`
`PositionBadge`, `CapInlineBadge`, and `StatusDot` (lines 45–93).

- [ ] 6.1 Create `web/src/components/PositionBadge/PositionBadge.tsx`:
      - Coloured pill: GK = yellow (`#FFE600` / `#241500`), DEF = blue (`#3DB1FF` /
        `#001F2E`), MID = `--fpl-accent` / `--fpl-accent-ink`, FWD = `#FF4D6D` / white.
      - These position colors are new token candidates — add them to `web/src/theme/` as
        `--fpl-pos-gk-bg`, `--fpl-pos-gk-fg`, etc. Do not hardcode in the component.
      - Write RTL tests: all four positions render with correct label and color classes.
- [ ] 6.2 Create `web/src/components/CapInlineBadge/CapInlineBadge.tsx`:
      - 16×16px circle; captain (C): `--fpl-accent` background, `--fpl-accent-ink` text;
        vice-captain (V): white background, `--fpl-accent-ink` text.
      - Write RTL tests for C and V variants; null input renders nothing.
- [ ] 6.3 Create `web/src/components/StatusDot/StatusDot.tsx`:
      - 8×8px dot overlaid on the kit icon in list rows.
      - Doubtful (`d`): `--fpl-warn`; injured (`i`), suspended (`s`), unavailable (`u`):
        `--fpl-error`.
      - Outlined with a 1.5px ring in `--fpl-bg` so it pops off the jersey.
      - Write RTL tests: correct color per status code; renders nothing for no-status.

## 7. List view — ListView component  (frontend-developer)

The main list table. Reference: `design/exports/v2/list.jsx` `ListView`, `ListRow`,
`ListColumnHeader`, `SectionHeader` (lines 95–293).

- [ ] 7.1 Create `web/src/components/ListView/ListView.tsx` and its CSS module.
      - Outer container: `overflow: auto`, full height of the available space, border-top
        in `--fpl-bg-hair`.
      - Inner div: `min-width` = sum of all column widths (so the container scrolls
        horizontally when the viewport is narrow).
      - Sticky column header row (top: 0, z-index 3), background `--fpl-bg-deep`.
      - Identity column (168px): `position: sticky; left: 0`, z-index 1, background
        `--fpl-bg`, right-side drop shadow to indicate scrollability.
      - Column widths match the design reference: identity 168px, then per-column widths
        from `LIST_COLS` in `list.jsx`. Express as CSS variables or constants in a single
        place — never duplicated between JS and CSS.
- [ ] 7.2 Implement `ListRow` inside the same component file:
      - Sticky identity cell: kit (`Jersey`, size 36), `StatusDot` overlay when `status`
        is set, player name (ellipsis overflow), `CapInlineBadge`, `PositionBadge`, club code.
      - 13 stat cells: values from `player.stats`; `total_points` (Pts) in accent green at
        `fontWeight: 800`; all others at `fontWeight: 500` in `--fpl-text-soft`; zero
        values in `--fpl-muted-soft`.
      - Missing/undefined values render as em-dash `—`.
- [ ] 7.3 Implement `SectionHeader` (position group label) and `ListColumnHeader` (sticky
      top row with "PLAYER" identity header + stat column labels).
- [ ] 7.4 Player grouping order in list view: GK → DEF → MID → FWD → Bench (ascending
      position order — opposite of the pitch view which uses attacking order).
- [ ] 7.5 Write RTL tests for `ListView`:
      - All 15 players render (11 starters + 4 bench) with correct section headers.
      - A player with `status: 'i'` shows a `StatusDot`.
      - A player with `cap: 'C'` shows a `CapInlineBadge`.
      - Zero stat values render in muted style; non-zero values render in standard style.
      - Missing stat values render as `—`.

## 8. List view — skeleton loading state  (frontend-developer)

Reference: `design/exports/v2/list.jsx` `ListRowSkeleton` and `ListViewSkeleton` (lines
295–370).

- [ ] 8.1 Create `ListViewSkeleton` (a set of `ListRowSkeleton` rows matching the full
      grid layout) to display while data is loading in list view.
      - Use the same dark shimmer animation already used in `PitchSkeleton` (the
        `fplShimmer` keyframe).
      - Identity cell: jersey-shaped and name-line skeleton blocks.
      - Stat cells: single short skeleton block centered in each cell.
- [ ] 8.2 Mount `ListViewSkeleton` in `SquadScreenLoading` when `view === 'list'`.

## 9. Squad screen — wire list vs pitch view  (frontend-developer)

Reference: `design/exports/v2/screens.jsx` `SquadScreenLoaded` function (lines 405–426).

- [ ] 9.1 In `SquadScreen` (`web/src/screens/SquadScreen`), read the `view` URL param
      (`pitch` | `list`, default `pitch`).
- [ ] 9.2 When `view === 'list'`: render `ListView` in the content area, passing all 15
      players (starters + bench) and their stats.
- [ ] 9.3 When `view === 'pitch'` (or param absent): render the existing `Pitch` +
      `BenchStrip` layout (no change to the pitch view itself beyond the row-order fix in
      task 1).
- [ ] 9.4 Ensure the `SummaryStrip` is visible in both views (it renders above the
      content area, outside the view switch).
- [ ] 9.5 Update Squad screen Storybook stories to cover `view="list"` for loaded,
      loading, and empty states.

## 10. New position-color tokens  (frontend-developer)

Position badge colors introduced in `PositionBadge` are new additions to the design system
that are not yet in `tokens.js` / `colors_and_type.css`. They must be added to the token
source before being referenced in components.

- [ ] 10.1 Add position-role color tokens to `web/src/theme/colors_and_type.css`:
      `--fpl-pos-gk-bg: #FFE600`, `--fpl-pos-gk-fg: #241500`,
      `--fpl-pos-def-bg: #3DB1FF`, `--fpl-pos-def-fg: #001F2E`,
      `--fpl-pos-mid-bg: var(--fpl-accent)`, `--fpl-pos-mid-fg: var(--fpl-accent-ink)`,
      `--fpl-pos-fwd-bg: #FF4D6D`, `--fpl-pos-fwd-fg: #FFFFFF`.
- [ ] 10.2 Mirror the same tokens in `web/src/theme/tokens.ts`.
- [ ] 10.3 Add corresponding entries to the `design/exports/v2/tokens.js` source in
      a `positionColor` group so the design system and production theme stay in sync.
      NOTE: flag this to the designer — these values are inlined in `list.jsx` but not yet
      in the canonical `tokens.js`. They need to be added there too.

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
