## 1. Proxy: top-players endpoints

- [x] 1.1 Implement `GET /api/top-players/gameweek/:gw`: merge `/event/{gw}/live/` stats with
      `bootstrap-static` metadata; sort by `stats.total_points` desc; return top 20
- [x] 1.2 Implement `GET /api/top-players/season`: sort `bootstrap-static` `elements[]` by
      `total_points` desc; return top 20 with name, position, club, total_points
- [x] 1.3 Both endpoints: shape each player as
      `{ id, webName, position, teamCode, teamShortName, points }`
- [x] 1.4 Cache TTLs: GW endpoint inherits live-data TTL (60 s current GW, 24 h finished);
      season endpoint inherits bootstrap TTL (1 h)
- [x] 1.5 Add proxy unit tests for both endpoints

## 2. Frontend: TopPlayers screen

- [ ] 2.1 Add route `/top-players?gw=N`
- [ ] 2.2 Build the `TopPlayersScreen` with tab control (This GW | Season)
- [ ] 2.3 Build the `PlayerRankRow` component: rank, kit icon, name, position badge, club,
      points
- [ ] 2.4 This GW tab: gameweek selector (prev / next) bounded to finished GWs, defaults to
      current GW; `gw` in URL param
- [ ] 2.5 Season tab: static list, no gameweek selector
- [ ] 2.6 Add loading skeleton, error state with retry for each tab
- [ ] 2.7 Add RTL unit tests for `TopPlayersScreen` and `PlayerRankRow`

## 3. Frontend: Navigation

- [ ] 3.1 Add a Top Players entry point in the main navigation

## 4. Verification

- [ ] 4.1 Verify GW tab shows correct top 20 for a finished gameweek
- [ ] 4.2 Verify Season tab shows correct top 20 season totals
- [ ] 4.3 Verify gameweek selector is bounded (cannot go past current GW or before GW1)
- [ ] 4.4 Verify the selected GW persists in the URL
