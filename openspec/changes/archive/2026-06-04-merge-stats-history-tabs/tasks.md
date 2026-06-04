## 1. OpenSpec & copy

- [x] 1.1 Proposal, design, spec delta for tabbed My Stats screen
- [x] 1.2 Add `statsTabLeagues` and `statsTabHistory` in `copy.ts`

## 2. Frontend panels & shell

- [x] 2.1 Extract `LeaguesStatsPanel` from leagues screen (no `ScreenHeader`)
- [x] 2.2 Extract `GameweekHistoryPanel`; update squad `returnTo` to `/stats?tab=history`
- [x] 2.3 Add `MyStatsScreen` with tabs and conditional queries
- [x] 2.4 Remove `/history` route; wire `/stats` to `MyStatsScreen`
- [x] 2.5 Remove My GW history link from `TeamInfoPanel`

## 3. Tests & verify

- [x] 3.1 `MyStatsScreen.test.tsx` — default tab, switch to history, URL `?tab=history`
- [x] 3.2 Update `TeamInfoPanel.test.tsx` and `App.test.tsx`
- [x] 3.3 Update `SquadScreen.test.tsx` returnTo expectation
- [x] 3.4 `npm run test -w web` (MyStatsScreen, TeamInfoPanel, App.test)
