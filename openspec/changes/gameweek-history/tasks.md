## 1. Proxy: history endpoint

- [ ] 1.1 Implement `GET /api/entry/:teamId/history` backed by FPL
      `GET /entry/{teamId}/history/` → `current[]`
- [ ] 1.2 Reverse the array (most recent GW first); divide `value` by 10 for £m
- [ ] 1.3 Set cache TTL: 60 s for the current GW, 24 h once the GW is finished
- [ ] 1.4 Add proxy unit tests for the history endpoint

## 2. Frontend: GameweekHistory screen

- [ ] 2.1 Add route `/history?teamId=X`
- [ ] 2.2 Build the `GameweekHistoryScreen` with heading, "This Season" label, and stat table
- [ ] 2.3 Implement rank direction indicator (↑/↓/—) derived from adjacent row comparison;
      green for ↑, red for ↓, neutral for —
- [ ] 2.4 Format large numbers with thousand separators (OR, GWR)
- [ ] 2.5 Add loading skeleton, empty state, and error state with retry
- [ ] 2.6 Add RTL unit tests for direction derivation and number formatting helpers

## 3. Frontend: Navigation entry point

- [ ] 3.1 Wire the "Gameweek History" link in `TeamInfoPanel` to `/history?teamId=X`
- [ ] 3.2 Add back navigation from the history screen to the squad screen

## 4. Verification

- [ ] 4.1 Verify all columns render correctly (team ID 72828, multiple GWs)
- [ ] 4.2 Verify rank direction arrows and colours are correct across several GWs
- [ ] 4.3 Verify empty state for a team with no history
