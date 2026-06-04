# FPL API audit (task 1.3 / 1.4)

Date: 2026-06-04. Live checks against `https://fantasy.premierleague.com/api/`.

## Bootstrap `elements[]` (live)

Verified on element `430` (Haaland):

| Field | Example | Modelling use |
| --- | --- | --- |
| `ep_next` | `"7.3"` | **Next GW** expected points — hybrid anchor |
| `expected_goals` | `"25.50"` | **Season cumulative** — not per GW |
| `expected_assists` | `"2.67"` | **Season cumulative** |
| `expected_goal_involvements` | `"28.17"` | Season cumulative |
| `status` | `"a"` | Minutes / confidence |
| `chance_of_playing_this_round` | `100` | Injury proxy (this GW) |
| `chance_of_playing_next_round` | `100` | Present in API; **not typed in proxy** |
| `form` | `"5.0"` | Rolling form string |
| `minutes` | `2953` | Season total minutes |

**Implication:** Do not use bootstrap `expected_goals` as next-fixture xG. Use `element-summary.history[].expected_goals` (per fixture) or vaastav merged GW.

## Element-summary `history[]` (live)

Per-**fixture** rows (`fixture` id + `round`). Double GW example: element `13`, round `26` → **2 rows**.

Relevant columns (all present on latest history row):

- Scoring: `goals_scored`, `assists`, `clean_sheets`, `total_points`, `bonus`, `bps`
- Minutes: `minutes`, `starts`
- Per-fixture xG: `expected_goals`, `expected_assists`, `expected_goal_involvements`, `expected_goals_conceded` (strings)
- Defcon building blocks: `defensive_contribution`, `clearances_blocks_interceptions`, `recoveries`, `tackles`
- Context: `opponent_team`, `was_home`, `team_h_score`, `team_a_score`

**Implication:** Spike aggregation layer: `group by (element, round)` → sum minutes/points/xG; defcon threshold logic on summed CBIT or per-match then sum expected pts.

## Fixtures

- `GET /api/fixtures/?event={gw}` — schedule per GW
- Double GW: two fixtures same `event` for a team; pool `nextFixtures` lists both with same `gw` (proxy)

**Implication:** Compare sum of model fixture expectations vs single `ep_next` on DGW players (open spike 3.x).

## Proxy codebase gaps

| Gap | Severity |
| --- | --- |
| `expected_goals` / `expected_assists` not in `fpl-client.ts` | Medium — add types when API consumes model |
| `chance_of_playing_next_round` not typed | Low — PRED-08; optional for minutes |
| Profile `historyToStats` picks **one** row per `round` | **High** for profile; model must not copy this |
| No prediction endpoint / types | Expected until follow-up change |
| `docs/fpl-api.md` incomplete vs live API | Update after spike |

See explore agent report in git history; this file adds **live verification**.

## Defcon (task 1.4)

| Source | Defcon data |
| --- | --- |
| Live `element-summary.history` | `defensive_contribution` per fixture |
| Live `event/live` explain | `identifier: defensive_contribution` (leaderboard) |
| vaastav `merged_gw` 2023/24 | **No** defcon columns |
| vaastav `merged_gw` 2025/26 | **Yes** — `defensive_contribution`, CBIT components |

Training: prefer 2025/26 vaastav + live; earlier seasons use position/team rate priors for defcon only.
