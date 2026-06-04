## ADDED Requirements

### Requirement: Persist prediction facts in PostgreSQL

The system SHALL store EPL match facts and player gameweek facts in normalized `pred_*`
tables, not in `fpl_*_cache` JSON blobs.

#### Scenario: Match facts upserted

- **WHEN** the ingest job loads football-data E0 CSV rows for a season
- **THEN** each match is upserted into `pred_epl_match` keyed by season, match date, and home slug

#### Scenario: Player GW facts upserted

- **WHEN** the ingest job loads vaastav merged gameweek rows
- **THEN** each player-fixture row is upserted into `pred_player_gw_fact` with goals, assists, xP, and expected goals/assists columns

### Requirement: Serve gameweek predictions from latest score run

The system SHALL expose `GET /api/predictions?event={gw}` returning `PlayerGameweekPrediction`
records from the most recent completed `pred_model_run` of kind `score` for that event.

#### Scenario: Predictions available

- **WHEN** a score run exists for gameweek 34
- **AND** the client requests `/api/predictions?event=34`
- **THEN** the response includes `xPts`, `xGoals`, `xAssists`, `csProb`, `defconPts`, and `confidence` per player

#### Scenario: No run yet

- **WHEN** no score run exists for the requested gameweek
- **THEN** the API returns an empty player list and a clear not-ready status (not 500)

### Requirement: Double gameweek aggregation in stored predictions

The system SHALL store one `pred_player_gw` row per player per event with metrics summed across all fixtures in that gameweek.

#### Scenario: Double gameweek player

- **WHEN** a player has two fixtures in gameweek 34
- **THEN** `pred_player_gw` for that player and event contains summed `xGoals`, `xAssists`, and `defconPts`
- **AND** `csProb` reflects the combined clean sheet probability per design
