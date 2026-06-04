# Data inventory (tasks 1.1–1.2)

## Decision: primary vs secondary sources

| Role | Source | Use |
| --- | --- | --- |
| **Primary (player × GW)** | [vaastav/Fantasy-Premier-League](https://github.com/vaastav/Fantasy-Premier-League) | Train/evaluate xPts components, per-GW xG/xA, minutes |
| **Secondary (team × match)** | [football-data.co.uk](https://www.football-data.co.uk/data.php) E0 CSV | Dixon–Coles λ, CS%, market odds sanity |
| **Live features** | FPL API via proxy | `ep_next`, status, fixtures, element-summary for current GW |
| **Not used** | Kaggle EPL 2000–2025 | Optional mirror of football-data; no FPL `element` ids |
| **Not used** | Paid APIs, Understat, FBref scrape | Out of scope |

### Kaggle vs vaastav vs football-data

The [Kaggle EPL dataset](https://www.kaggle.com/datasets/marcohuiii/english-premier-league-epl-match-data-2000-2025)
is match-level, name-based teams, long history. It does **not** map to FPL `playerId` and largely
overlaps football-data.co.uk. **Use football-data.co.uk directly** (same odds/goals columns,
no Kaggle account). **Use vaastav** for all player-GW labels and FPL points.

---

## vaastav / Fantasy-Premier-League

### Seasons to ingest (training)

| Season folder | merged_gw defcon columns | Notes |
| --- | --- | --- |
| 2019-20 … 2023-24 | No | Goals, assists, xG per GW, ICT, `element` |
| 2024-25 | No (confirm on download) | Transitional |
| 2025-26 | **Yes** | `defensive_contribution`, `clearances_blocks_interceptions`, `recoveries`, `tackles` |

Minimum for spike: **2022-23, 2023-24, 2024-25** (train) + **hold-out last ~9 GW of 2024-25**.
Add **2025-26** for defcon-labelled rows as season progresses.

### Key file: `data/{season}/gws/merged_gw.csv`

Columns (2025/26 — superset):

```
name, position, team, xP, assists, bonus, bps, clean_sheets, creativity, element,
expected_assists, expected_goal_involvements, expected_goals, expected_goals_conceded,
fixture, goals_conceded, goals_scored, ict_index, influence, kickoff_time, minutes,
opponent_team, …, yellow_cards,
clearances_blocks_interceptions, defensive_contribution, recoveries, tackles, GW
```

| Column | Spike use |
| --- | --- |
| `element` | Join to FPL player id |
| `GW` / `round` in API | Gameweek index |
| `fixture` | DGW detection (count per element+GW) |
| `expected_goals`, `expected_assists` | Player per-GW xG/xA features |
| `xP` | Compare to `ep_next` / model |
| `total_points` | Hold-out label |
| `minutes`, `starts` | Minutes model |
| `defensive_contribution` | Defcon label (2025/26+) |
| `opponent_team` | FPL team id — map to football-data via team name |

### Other vaastav files

| File | Use |
| --- | --- |
| `data/master_team_list.csv` | Map team names ↔ codes across seasons |
| `data/{season}/players_raw.csv` | Position, id, name for joins |
| `data/cleaned_merged_seasons.csv` | Optional multi-season player table |

Raw URL pattern:

`https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data/{season}/gws/merged_gw.csv`

---

## football-data.co.uk (Premier League E0)

### URL pattern

`https://www.football-data.co.uk/mmz4281/{yy}{yy+1}/E0.csv`

Example: 2024/25 → `2425/E0.csv`

### Columns (subset for spike)

| Column | Use |
| --- | --- |
| `Date`, `HomeTeam`, `AwayTeam` | Match identity |
| `FTHG`, `FTAG`, `FTR` | Goals — Poisson/Dixon–Coles |
| `HS`, `AS`, `HST`, `AST` | Shots — optional attack proxy |
| `Referee` | v2 signal (priority 5) |
| `B365H`, `B365D`, `B365A` | 1X2 implied probs — criterion C |
| `B365>2.5`, `B365<2.5` | Goal line — team scoring context |
| Closing odds variants (`*CH`, `*CA`, …) | Prefer closing where documented in Notes |

Team name mapping: normalize `Man United` ↔ `Man Utd` etc. against `master_team_list.csv` /
FPL `teams.short_name`.

---

## Live FPL API (production path)

See [FPL_API_AUDIT.md](./FPL_API_AUDIT.md).

| Endpoint | Spike / prod |
| --- | --- |
| `bootstrap-static` | `ep_next`, status, team ids |
| `element-summary/{id}` | Per-fixture history, defcon, per-GW xG |
| `fixtures/?event=` | GW fixture list, DGW |
| `event/{gw}/live` | Post-GW defcon in explain (validation only) |

---

## Hold-out protocol

- **Window:** GW 30–38 of 2024/25 (adjust if season length differs).
- **No tuning** on hold-out hyperparameters.
- **Metrics:** documented in OpenSpec design (calibration, MAE/rank vs `ep_next`, odds sanity).
