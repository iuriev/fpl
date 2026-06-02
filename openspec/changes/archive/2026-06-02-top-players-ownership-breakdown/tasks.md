# Tasks: Top Players — Ownership % and GW Stat Breakdown

## Proxy

### P1 — Extend FPLLive with explain[]

- [x] `proxy/src/fpl-client.ts` `FPLLive`: add `explain` array to each element:
      `explain: Array<{ fixture: number; stats: Array<{ identifier: string; points: number; value: number }> }>`

### P2 — Extend TopPlayer type with new fields

- [x] `proxy/src/types.ts`: add `StatEntry` interface `{ identifier: string; value: number; points: number }`
- [x] `proxy/src/types.ts` `TopPlayer`: add `selectedByPercent: string` and `statBreakdown?: StatEntry[]`

### P3 — Map ownership + breakdown in top-players-service (GW)

- [x] `top-players-service.getTopPlayersGameweek`: add `selectedByPercent: element.selected_by_percent` to the mapped player
- [x] `top-players-service.getTopPlayersGameweek`: implement `buildStatBreakdown(explain)` — aggregate stat values/points
      across all fixtures; exclude `minutes`, `goals_conceded`, `bps`; filter out zero-value stats
- [x] `top-players-service.test.ts`: add tests for `selectedByPercent` mapping and `statBreakdown` aggregation
      (single fixture, double gameweek aggregation, excluded stats, zero-value filtering)

### P4 — Map ownership in top-players-service (season)

- [x] `top-players-service.getTopPlayersSeason`: add `selectedByPercent: element.selected_by_percent`
- [x] `top-players-service.test.ts`: add test for `selectedByPercent` in season response

### P5 — Map ownership in team-service

- [x] `team-service.getTeamPlayers`: add `selectedByPercent: e.selected_by_percent` to the mapped player
- [x] `team-service.test.ts`: add test for `selectedByPercent` in team players response

---

## Web — types and API layer

### W1 — Sync types to web

- [x] `web/src/types/index.ts`: add `StatEntry` interface
- [x] `web/src/types/index.ts` `TopPlayersPlayer`: add `selectedByPercent: string` and `statBreakdown?: StatEntry[]`

---

## Web — PlayerRankRow

### W2 — Stat chips and ownership line

- [x] `PlayerRankRow.tsx`: add `HIDDEN_STATS` set (`minutes`, `goals_conceded`, `bps`)
- [x] `PlayerRankRow.tsx`: add `formatStatLabel(identifier, value): string` — plain English labels
      per the design table; pluralises count-based stats (goal/goals, assist/assists, etc.)
- [x] `PlayerRankRow.tsx`: add `chipColorClass(identifier): string` — maps identifier to CSS module
      class key (chipGoal / chipAssist / chipDefensive / chipBonus / chipPositive / chipNegative)
- [x] `PlayerRankRow.tsx`: render `.statChips` section when `player.statBreakdown` is non-empty,
      filtering hidden stats
- [x] `PlayerRankRow.tsx`: render `.ownership` line when `player.selectedByPercent` is present
- [x] `PlayerRankRow.module.css`: add `.statChips`, `.chip`, `.chipGoal`, `.chipAssist`,
      `.chipDefensive`, `.chipBonus`, `.chipPositive`, `.chipNegative`, `.ownership` styles
      using `--fpl-*` tokens; chip font `0.625rem`, ownership font `0.5625rem`
- [x] `PlayerRankRow.test.tsx`: add tests for stat chip rendering, label formatting,
      ownership line, hidden stat exclusion, zero-value filtering
