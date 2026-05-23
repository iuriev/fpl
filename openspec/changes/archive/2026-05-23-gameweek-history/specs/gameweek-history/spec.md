## ADDED Requirements

### Requirement: Display per-gameweek history for the season
The system SHALL show a table of all played gameweeks for the current season, most recent first,
with performance stats per gameweek.

#### Scenario: History with multiple gameweeks
- **WHEN** the Gameweek History screen loads for a team that has played gameweeks
- **THEN** the table shows one row per played gameweek with columns: GW, OR, rank direction
  (↑/↓/—), OP, GWR, GWP, PB, TM, TC, £m

#### Scenario: Rank direction indicators
- **WHEN** a gameweek's overall rank improved compared to the previous gameweek
- **THEN** the direction indicator shows ↑ in green
- **WHEN** a gameweek's overall rank worsened
- **THEN** the direction indicator shows ↓ in red
- **WHEN** overall rank is unchanged or there is no previous row
- **THEN** the direction indicator shows — in neutral colour

#### Scenario: No history yet
- **WHEN** the team has no played gameweeks
- **THEN** the screen shows a clear empty state message

### Requirement: Loading and error states
The system SHALL handle loading and error states gracefully.

#### Scenario: History loading
- **WHEN** the history data is being fetched
- **THEN** a skeleton of rows is shown in place of the table

#### Scenario: Fetch error
- **WHEN** the history request fails
- **THEN** an inline error message is shown with a retry button
