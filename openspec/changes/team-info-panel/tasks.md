## 1. Proxy: extend entry response

- [ ] 1.1 Add to `/api/entry/:teamId` response: `overall_points`, `overall_rank`,
      `event_points`, `total_players`, `player_region_iso_code_short`
- [ ] 1.2 Update proxy unit tests for the extended entry shape

## 2. Frontend: TeamInfoPanel component

- [ ] 2.1 Build the `TeamInfoPanel` component: avatar placeholder, team name, manager name,
      flag emoji, overall points, overall rank, total players, GW points
- [ ] 2.2 Add a "Gameweek History" link/button (navigates to `/history?teamId=X`)
- [ ] 2.3 Add RTL unit tests for `TeamInfoPanel`

## 3. Frontend: Squad screen layout update

- [ ] 3.1 Update Squad screen to two-column CSS Grid layout on desktop (panel left, squad right)
- [ ] 3.2 Implement collapsible mobile header: collapsed row (team + OR) with expand chevron;
      expanded shows full panel content inline
- [ ] 3.3 Collapse state is session-local (not in URL)

## 4. Verification

- [ ] 4.1 Verify all panel fields render correctly (team ID 72828)
- [ ] 4.2 Verify flag emoji renders for a manager with a known country code
- [ ] 4.3 Verify desktop two-column layout and mobile collapse/expand
