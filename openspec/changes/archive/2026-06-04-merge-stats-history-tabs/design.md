# Design: My Stats tabbed screen

## Layout

```
ScreenHeader(title: "My Stats")
tablist [ Leagues | My GW history ]
panel (leagues list OR history table)
```

Tab styling matches `LeaderboardScreen` / `PriceChangesScreen` (`role="tablist"`, `aria-selected`).

## Routing

| URL | Active tab |
| --- | --- |
| `/stats` | Leagues (default) |
| `/stats?tab=history` | My GW history |
| `/stats?gw=N` | Leagues; `gw` forwarded to league standings navigation |

Invalid `tab` values fall back to Leagues.

## Data loading

- `useLeagues(teamId)` only when Leagues tab is active.
- `useHistory(teamId)` only when History tab is active.
- Pass `null` teamId to hooks when inactive (`enabled: false`).

## Navigation updates

| From | To |
| --- | --- |
| TeamInfoPanel | `/stats` only (remove `/history` link) |
| History row → Squad | `returnTo: '/stats?tab=history'`, `backLabel: copy.squadBackToHistory` |
| League standings back | Still `/stats` with optional `?gw=` |

## File structure

- `MyStatsScreen/` — shell + tabs + CSS
- `LeaguesStatsScreen/LeaguesStatsPanel.tsx` — leagues body (no header)
- `GameweekHistoryScreen/GameweekHistoryPanel.tsx` — history body (no header)
- Remove standalone `LeaguesStatsScreen.tsx`, `GameweekHistoryScreen.tsx`
- `App.tsx`: one route `/stats` → `MyStatsScreen`; delete `/history`

## Copy

- `statsTabLeagues`: `Leagues`
- `statsTabHistory`: `My GW history` (reuse `teamInfoGwHistory` text or alias)
