## ADDED Requirements

### Requirement: Display the FPL Dream Team for a finished gameweek
The system SHALL show the 11 highest-scoring players (the FPL Dream Team) arranged on a
pitch for a selected finished gameweek.

#### Scenario: Dream Team for a finished gameweek
- **WHEN** the Dream Team screen loads for a finished gameweek
- **THEN** 11 players are shown on a pitch layout in their positional rows (GK, DEF, MID, FWD),
  each displaying name, position, club, and gameweek points

#### Scenario: Dream Team unavailable for in-progress gameweek
- **WHEN** the selected gameweek is the current in-progress gameweek
- **THEN** a message explains that the Dream Team is not yet available for this gameweek

### Requirement: Navigate between gameweeks
The system SHALL allow the user to browse Dream Teams across finished gameweeks.

#### Scenario: Previous gameweek navigation
- **WHEN** the user activates the previous control
- **THEN** the Dream Team for the preceding gameweek is shown and the `gw` URL param updates

#### Scenario: Navigation bounded to finished gameweeks
- **WHEN** the user is viewing the most recently finished gameweek
- **THEN** the next control is disabled

#### Scenario: Navigation bounded at GW1
- **WHEN** the user is viewing gameweek 1
- **THEN** the previous control is disabled

### Requirement: Loading and error states

#### Scenario: Data loading
- **WHEN** the Dream Team data is being fetched
- **THEN** a pitch skeleton is shown

#### Scenario: Fetch error
- **WHEN** the request fails
- **THEN** an inline error message with a retry button is shown
