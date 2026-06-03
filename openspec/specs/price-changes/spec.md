## ADDED Requirements

### Requirement: Show actual price risers and fallers

The system SHALL expose price movers from official FPL bootstrap data on the Price Changes
screen, **Actual** mode, for all managers globally.

#### Scenario: This gameweek risers

- **WHEN** Actual mode, This GW period, and Risers direction are selected
- **THEN** up to 50 players with `cost_change_event > 0` are listed, descending by change amount,
  each showing name, position, club, current price, change amount, and transfers in this GW

#### Scenario: Season fallers

- **WHEN** Actual mode, Season period, and Fallers direction are selected
- **THEN** up to 50 players with `cost_change_start < 0` are listed, most negative first,
  with the same row fields using season change amount

#### Scenario: Zero-change players excluded

- **WHEN** a player has zero change for the selected period
- **THEN** they do not appear in the list

#### Scenario: Position filter

- **WHEN** the user selects a position chip (GK, DEF, MID, or FWD)
- **THEN** only players of that position are shown within the current period and direction

#### Scenario: Empty actual list

- **WHEN** no players have non-zero change for the selected period and filters
- **THEN** an empty-state message is shown (not an error)

### Requirement: Show predicted tonight price movers

The system SHALL list up to 50 players projected to rise or fall before the next price change,
**Tonight** mode, using the server-side heuristic documented in the change design.

#### Scenario: Likely rise list

- **WHEN** Tonight mode and Likely rise are selected
- **THEN** players with likelihood `likely` or `very_likely` for a rise are listed with
  current price, transfer activity, and a likelihood badge

#### Scenario: Unlikely players excluded

- **WHEN** a player's rise or fall likelihood is `unlikely`
- **THEN** they are not listed

### Requirement: Scope All FPL vs My squad

The system SHALL support viewing lists for all FPL players or only the authenticated user's
current squad (15 players).

#### Scenario: All FPL free access

- **WHEN** a signed-in user selects All FPL
- **THEN** full lists are visible for both Actual and Tonight modes

#### Scenario: My squad requires premium

- **WHEN** a free-tier user selects My squad
- **THEN** list content is visually obscured and interaction prompts premium upgrade;
  squad-scoped API responses are not shown with real prediction data

#### Scenario: My squad premium access

- **WHEN** a premium user selects My squad
- **THEN** lists contain only players in the user's current gameweek squad, respecting
  period, direction, position, and mode filters

### Requirement: Player profile on row tap

The system SHALL open a player profile sheet when the user taps a row.

#### Scenario: Last finished gameweek stats

- **WHEN** element history exists for the latest finished gameweek
- **THEN** the sheet shows that gameweek's points and stat chips

#### Scenario: Partial data

- **WHEN** gameweek history is unavailable
- **THEN** the sheet still shows price, ownership, upcoming fixtures, and follow control

#### Scenario: Follow from profile

- **WHEN** the user toggles follow in the profile sheet
- **THEN** the player is added or removed from the player watchlist using existing limits and
  premium upsell behaviour
