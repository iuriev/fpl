## 1. Proxy: leagues endpoint

- [ ] 1.1 Implement `GET /api/entry/:teamId/leagues` extracting `leagues.classic[]` and
      `leagues.h2h[]` from the FPL `/entry/{teamId}/` response
- [ ] 1.2 Shape: `{ teamId, classic: [{ id, name, rank, lastRank }], h2h: [...] }`
- [ ] 1.3 Cache TTL: inherit from the entry endpoint (1 h)
- [ ] 1.4 Add proxy unit tests for the leagues endpoint

## 2. Frontend: LeaguesStats screen

- [ ] 2.1 Add route `/stats?teamId=X`
- [ ] 2.2 Build the `LeaguesStatsScreen` with "My Stats" heading and two sections
      ("General Leagues", "Head-to-Head Leagues")
- [ ] 2.3 Implement league row: name, rank (with thousand separator), direction indicator
- [ ] 2.4 Omit H2H section if the manager has no H2H leagues
- [ ] 2.5 Add loading skeleton, empty state, and error state with retry
- [ ] 2.6 Add RTL unit tests for direction derivation logic

## 3. Frontend: Navigation

- [ ] 3.1 Add a My Stats entry point in the main navigation (to be placed once navigation
      structure for v1.1 is decided — placeholder link acceptable)
- [ ] 3.2 Add back navigation from the stats screen to the squad screen

## 4. Verification

- [ ] 4.1 Verify all league rows render correctly (team ID 72828)
- [ ] 4.2 Verify direction indicators for improved and worsened ranks
- [ ] 4.3 Verify H2H section is hidden for a team with no H2H leagues
