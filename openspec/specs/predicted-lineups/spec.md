## ADDED Requirements

### Requirement: Predicted lineups API

The system SHALL expose `GET /api/predicted-lineups` returning predicted starting elevens and
formation counts for all 20 Premier League teams for the requested or next gameweek, computed
from public FPL data only. The system SHALL NOT call paid third-party lineup or tactical
providers at any time.

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

### Requirement: Formation from real matches

The system SHALL derive formation counts from per-fixture starter data (`starts === 1` in
`element-summary` history), not from gameweek-aggregated live stats alone.

#### Scenario: Single match formation

- **WHEN** a team has a finished fixture with eleven starters identifiable from history
- **THEN** formation counts equal the number of starting DEF, MID, and FWD in that fixture

#### Scenario: Double gameweek

- **WHEN** a team plays two fixtures in the same gameweek
- **THEN** formation inference treats each fixture separately
- **AND** does not combine starters from both matches into one formation

#### Scenario: Rolling mode

- **WHEN** the team has multiple finished fixtures in the current season
- **THEN** the formation used for prediction is the mode of valid formations from the most
  recent up to five fixtures
- **AND** ties break toward the most recent fixture

### Requirement: Formation fallback chain

The system SHALL apply fallbacks when current-season match data is insufficient.

#### Scenario: Previous season last match

- **WHEN** no valid formation exists from the current season
- **AND** frozen data or import for the previous season's last finished fixture is available
- **THEN** formation is taken from that last match

#### Scenario: Default formation

- **WHEN** neither current-season nor previous-season fixture data yields a valid formation
- **THEN** the formation defaults to `4-3-3` (4 DEF, 3 MID, 3 FWD)

#### Scenario: Squad-fit formation adjustment

- **WHEN** the inferred formation requires more players in an FPL position line than the squad
  can supply after availability exclusions (e.g. `4-3-3` but fewer than three `element_type`
  forwards)
- **THEN** the system selects the closest valid alternative formation that the squad can fill
  (e.g. `4-5-1` when only one forward is available)
- **AND** the response `formation.label` reflects the formation actually used for selection
- **AND** exactly eleven players are still returned

### Requirement: In-house predicted eleven

The system SHALL select eleven players per team using FPL availability and playing-time signals
combined with the inferred formation slot counts.

#### Scenario: Position slots

- **WHEN** a predicted lineup is built for a team
- **THEN** exactly one GK is selected
- **AND** outfield counts match the inferred DEF, MID, and FWD counts

#### Scenario: Player fields

- **WHEN** each predicted player is returned
- **THEN** the entry includes `xPts` from `ep_next`, `xMins` from the start-probability
  heuristic, and `benchRisk` when rotation or doubtful status is elevated

### Requirement: Flank-aware pitch ordering

The system SHALL place DEF and MID (and FWD where applicable) players left-to-right on the pitch
according to football flank, using an in-repo player lane registry keyed by FPL element `code`.

#### Scenario: Registry lane on pitch

- **WHEN** a predicted player has registry lane `R` and plays in the midfield row of a 4-3-3
- **THEN** that player is rendered to the right of centre mids in that row

#### Scenario: Slot assignment

- **WHEN** a formation row has multiple players
- **THEN** each player is assigned to a slot lane template for that row (e.g. four defenders:
  L, C, C, R)
- **AND** assignment prefers registry lane matches over default centre placement

#### Scenario: Unknown lane

- **WHEN** a player has no registry entry
- **THEN** the default lane is centre (`C`) for assignment purposes

### Requirement: Predicted Lineups screen

The system SHALL provide a Predicted Lineups screen at `/predicted-lineups` where the user can
browse all Premier League teams and view each team's predicted eleven. Lineup content is
premium-only.

#### Scenario: Free user sees upsell only

- **WHEN** a free-tier user opens `/predicted-lineups`
- **THEN** predicted lineup data is not shown
- **AND** a premium unlock overlay and upsell path are shown
- **AND** `requestUpsell('predictions')` is triggered on mount

#### Scenario: Premium user sees lineups

- **WHEN** a premium-tier user opens `/predicted-lineups`
- **THEN** the client fetches predicted lineups and renders team content

#### Scenario: Team selection

- **WHEN** a premium user opens `/predicted-lineups`
- **THEN** a team selector lists all 20 clubs
- **AND** selecting a club updates the displayed formation label and eleven players

#### Scenario: Formation label visible

- **WHEN** a team is selected and data has loaded
- **THEN** the formation string (e.g. `4-3-3`) is shown prominently above the lineup content

#### Scenario: Table and pitch views

- **WHEN** the user toggles Table view
- **THEN** players are listed with name, xMins, and xPts
- **AND** bench-risk players are visually distinguished
- **WHEN** the user toggles Pitch view
- **THEN** players appear on four rows (GK, DEF, MID, FWD) with card counts matching formation
- **AND** within each outfield row, cards are ordered left-to-right by assigned flank slots

#### Scenario: Next fixture context

- **WHEN** the team has a scheduled fixture in the target gameweek
- **THEN** opponent, home/away, and kickoff time are shown in the team header area

#### Scenario: Player profile

- **WHEN** the user taps a predicted player row or card
- **THEN** the player profile sheet opens for that element id

### Requirement: Navigation entry

The system SHALL link to Predicted Lineups from the team info panel.

#### Scenario: Drawer link

- **WHEN** the team info panel is shown in full navigation mode
- **THEN** a Predicted Lineups link navigates to `/predicted-lineups`

### Requirement: Loading and error states

#### Scenario: Data loading

- **WHEN** predicted lineups are being fetched
- **THEN** skeleton placeholders are shown for the active team content

#### Scenario: Fetch failure

- **WHEN** the predicted lineups request fails
- **THEN** an inline error with retry is shown
