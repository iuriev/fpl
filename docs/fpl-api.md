# FPL Public API Reference

A local snapshot of the public Fantasy Premier League endpoints this project uses, so we don't
re-fetch during development. The API is **unofficial and undocumented** — shapes can change. It
requires no auth and sends **no CORS headers** (so it must be reached through our proxy).
Base URL: `https://fantasy.premierleague.com/api/`.

Captured 2026-05 (season 2025/26). Verify against live data if something looks off.

## Conventions

- **Gameweeks**: a Premier League season always has exactly 38 gameweeks (`id` 1–38). This is a
  league rule, not a FPL API contract — the constant `MAX_GAMEWEEK = 38` is the authoritative
  cap used everywhere in this codebase. Proxy rejects `gw > 38` with 400; the frontend clamps
  URL params to `[1, 38]`.
- Player position (`element_type`): `1` = GK, `2` = DEF, `3` = MID, `4` = FWD (see `element_types`).
- Player availability `status`: `a` available, `d` doubtful, `i` injured, `s` suspended,
  `u` unavailable, `n` not eligible. Detail in `news` and `chance_of_playing_this_round`.
- Team identity: `team` (per-season team id) and `team_code` (stable code used for kit images).

## Endpoints we use

### GET /bootstrap-static/
The catalogue. Top-level keys: `events`, `teams`, `elements`, `element_types`, `element_stats`,
`chips`, `phases`, `game_settings`, `total_players`.

- `events[]` (gameweeks): `id`, `name` ("Gameweek 37"), `deadline_time`, `is_current`,
  `is_next`, `is_previous`, `finished`, `data_checked`, `average_entry_score`, `highest_score`,
  `most_captained`, `top_element`.
- `teams[]`: `id`, `code`, `name`, `short_name` ("ARS"), strength ratings.
- `elements[]` (players): `id`, `code`, `web_name`, `first_name`, `second_name`, `team`,
  `team_code`, `element_type`, `now_cost`, `total_points`, `event_points`, `status`,
  `chance_of_playing_this_round`, `news`, `news_added`, `selected_by_percent`.
- `element_types[]`: `id`, `singular_name`, `singular_name_short` (GKP/DEF/MID/FWD), squad rules.

Used for: player metadata (name/position/club/status), the gameweek list and current gameweek,
and the gameweek average/highest scores for the summary.

### GET /entry/{teamId}/
Manager/team summary. Fields: `id`, `name` (team name), `player_first_name`,
`player_last_name`, `summary_overall_points`, `summary_overall_rank`, `summary_event_points`,
`summary_event_rank`, `current_event`, `started_event`. An unknown id returns 404.

Used for: validating the team ID and the header (team name).

### GET /entry/{teamId}/event/{gw}/picks/
The squad for a gameweek. Available only for gameweeks up to the current one (a future gameweek
has no picks yet → 404 / no data).

- `active_chip`, `automatic_subs[]`
- `entry_history`: `event`, `points`, `total_points`, `rank`, `overall_rank`,
  `event_transfers`, `event_transfers_cost`, `points_on_bench`, `value`, `bank`
- `picks[]`: `element` (player id), `position` (1..15; 1..11 starters, 12..15 bench),
  `multiplier` (0 = benched, 1, 2 = captain, 3 = triple captain), `is_captain`, `is_vice_captain`

Used for: the 15 players split into starters/bench (by `position`), captain/vice flags, and the
team's gameweek total/rank/transfers for the summary (net total = `points` − `event_transfers_cost`).

### GET /event/{gw}/live/
Per-player live stats for a gameweek. `elements[]`: `id`, `stats` { `minutes`, `goals_scored`,
`assists`, `clean_sheets`, `bonus`, `bps`, …, `total_points` }, `explain[]`.

Used for: each player's points in the selected gameweek (`stats.total_points`).

## Other endpoints (not in the MVP, for reference)

- `GET /entry/{teamId}/history/` — `current[]` per-gameweek history, `past[]`, `chips[]`.
- `GET /element-summary/{elementId}/` — a player's per-fixture history.
- `GET /fixtures/?event={gw}` — fixtures for a gameweek. Each object: `id`, `event`,
  `team_h`, `team_a`, `team_h_difficulty`, `team_a_difficulty` (integer 1–5),
  `kickoff_time`, `finished`. Used for FDR chips in the Transfer Planner.

## Proxy mapping (see `openspec/changes/mvp-squad-viewer/design.md`, decision D1)

- `/api/gameweeks` ← `bootstrap-static` `events`
- `/api/entry/:teamId` ← entry summary
- `/api/squad/:teamId/:gw` ← `bootstrap-static` (metadata, status, avg/high) + picks
  (`picks` + `entry_history`) + live (points)

### Transfer Planner endpoints (planned)

- `/api/fixtures/upcoming` ← `GET /fixtures/?event={gw}` × 3 (next 3 GWs), returns
  per-team fixture list with `{ gw, opponent, home, difficulty }`. Cache: 1 hour.
- `/api/player-pool` ← `bootstrap-static` `elements` + upcoming fixture data merged per
  `team` id. Returns all players with `next_fixtures[]`. Cache: 10 min.
