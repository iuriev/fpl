## MODIFIED Requirements

### Requirement: Predicted lineups API

The system SHALL expose `GET /api/predicted-lineups` returning predicted starting elevens and
formation counts for all 20 Premier League teams for the requested or next gameweek. Formation
and XI selection SHALL use public FPL data. Player tactical roles and flanks for pitch ordering
SHALL come from an in-repo registry built by an **offline** ingest process (Transfermarkt squad
data). The system SHALL NOT call Transfermarkt or other external position providers during HTTP
requests. The system SHALL NOT call paid third-party lineup or tactical providers at any time.

#### Scenario: Premium required

- **WHEN** an authenticated free-tier user calls `GET /api/predicted-lineups`
- **THEN** the response status is 403 with `premium_required`
- **WHEN** an authenticated premium-tier user calls the same endpoint
- **THEN** the response status is 200 with lineup data

#### Scenario: Default next gameweek

- **WHEN** the client calls `GET /api/predicted-lineups` without a `gw` query parameter
- **THEN** the response targets the gameweek marked `is_next` in bootstrap-static
- **AND** the payload includes exactly 20 team entries

#### Scenario: Explicit gameweek

- **WHEN** the client calls `GET /api/predicted-lineups?gw=N` with a valid gameweek number
- **THEN** formations and player selection use fixture context for gameweek N

#### Scenario: Each team entry shape

- **WHEN** the response is returned successfully
- **THEN** each team includes `formation.label` (DEF–MID–FWD counts, e.g. `4-3-3`), eleven
  `players`, optional `nextFixture`, and FPL team identifiers

### Requirement: Flank-aware pitch ordering

The system SHALL place DEF and MID (and FWD where applicable) players left-to-right on the pitch
according to football flank, using an in-repo player tactical registry keyed by FPL element
`code`. Registry entries SHALL be produced by offline Transfermarkt squad ingest (with manual
override file for unmatched players), not by FPL creativity/threat heuristics.

#### Scenario: Registry lane on pitch

- **WHEN** a predicted player has registry lane `R` and plays in the midfield row of a 4-3-3
- **THEN** that player is rendered to the right of centre mids in that row

#### Scenario: Slot assignment

- **WHEN** a formation row has multiple players
- **THEN** each player is assigned to a slot lane template for that row (e.g. four defenders:
  L, C, C, R)
- **AND** assignment prefers registry role and lane matches over default centre placement

#### Scenario: Unknown lane

- **WHEN** a player has no registry entry
- **THEN** the default lane is centre (`C`) for assignment purposes

#### Scenario: Offline registry refresh

- **WHEN** maintainers refresh positions for a new season or after major transfers
- **THEN** they run the documented offline ingest CLI (Transfermarkt → JSON)
- **AND** commit the updated registry without changing runtime API behaviour
