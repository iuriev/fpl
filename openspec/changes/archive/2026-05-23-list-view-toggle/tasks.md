## 1. Proxy: extend squad response

- [x] 1.1 Add individual stat fields to the per-player shape in `/api/squad/:teamId/:gw`:
      `minutes`, `goals_scored`, `assists`, `clean_sheets`, `goals_conceded`, `own_goals`,
      `penalties_saved`, `penalties_missed`, `yellow_cards`, `red_cards`, `saves`, `bonus`
- [x] 1.2 Update proxy unit tests to cover the extended player shape

## 2. Frontend: List view component

- [x] 2.1 Build the `SquadListView` component: positional section headers + stat table rows
- [x] 2.2 Implement horizontal scroll with sticky identity columns (kit + name) on mobile
- [x] 2.3 Show the availability badge on the kit icon for flagged players (reuse existing badge)
- [x] 2.4 Add RTL unit tests for `SquadListView`

## 3. Frontend: Toggle control

- [x] 3.1 Build the `ViewToggle` (Pitch / List) segmented control component
- [x] 3.2 Wire the toggle to the `view` URL query param (`pitch` | `list`); default to `pitch`
- [x] 3.3 Mount the toggle in the Squad screen header adjacent to the gameweek navigator

## 4. Verification

- [x] 4.1 Verify all stat columns render correctly for a finished gameweek (team ID 72828)
- [x] 4.2 Verify horizontal scroll and sticky columns on a narrow mobile viewport
- [x] 4.3 Verify the toggle persists across page refresh and in a shared URL
