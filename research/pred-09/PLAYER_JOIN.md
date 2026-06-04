# Player & team join strategy (task 1.5)

## Team: football-data ↔ FPL

1. Load FPL `teams` from bootstrap (`id`, `short_name`, `name`).
2. Load vaastav `master_team_list.csv` (season-specific name variants).
3. Build manual override table for common mismatches:

| football-data | FPL short_name |
| --- | --- |
| Man United | MUN |
| Man City | MCI |
| Nott'm Forest | NFO |
| Wolves | WOL |
| Spurs | TOT |
| West Ham | WHU |

4. Match key: `(season, date, home, away)` → FPL `fixtures` by team ids + kickoff date (±1 day tolerance).

## Player: vaastav `element` → current FPL `id`

FPL reuses `element` ids across seasons when the player persists. Strategy:

### Tier A — stable id (preferred)

- Join `merged_gw.element` directly to `bootstrap.elements.id` for current season.
- For historical seasons, join to that season's `players_raw.csv` `id` field (same as element).

### Tier B — fuzzy name match

When id not found (new season export vs old, or transfers):

```
normalize(name) = lower, strip accents, remove Jr./Sr.
match on (normalize(name), position, team_id) with threshold
```

Use `web_name` + `team` + `element_type` from `players_raw.csv`.

### Tier C — manual overrides CSV

`research/pred-09/data/player_id_overrides.csv`:

```csv
season,vaastav_name,team,element_type,fpl_element_id
```

Maintain only exceptions (~5% of rows).

## Double gameweek aggregation

```
GROUP BY (element, GW)
  SUM(total_points, expected_goals, expected_assists, minutes, …)
  defconPts_label = SUM(defensive_contribution >= threshold ? 2 : 0)  -- or model on per-fixture rows first
```

For **prediction** output, mirror the same sum across upcoming fixtures in the GW.

## Validation checks

- [ ] >95% of merged_gw rows in 2024/25 join to a player record
- [ ] Every football-data E0 match maps to exactly one FPL fixture per season
- [ ] Log unmapped teams/players to `research/pred-09/data/unmapped.log` during ingest
