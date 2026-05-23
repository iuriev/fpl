## ADDED Requirements

### Requirement: Default to the current gameweek
When the squad view opens, the system SHALL default to the current gameweek.

#### Scenario: Season in progress
- **WHEN** the squad view opens and a current gameweek exists
- **THEN** the system shows the current gameweek by default

#### Scenario: No current gameweek (off-season)
- **WHEN** no gameweek is currently in progress
- **THEN** the system defaults to the most recent gameweek that has data

### Requirement: Navigate between gameweeks
The system SHALL let the user move to the previous and next gameweek from the current selection.

#### Scenario: Move to next gameweek
- **WHEN** the user selects "next" and a later gameweek with data exists
- **THEN** the system shows the next gameweek's squad and points

#### Scenario: Move to previous gameweek
- **WHEN** the user selects "previous" and an earlier gameweek exists
- **THEN** the system shows the previous gameweek's squad and points

### Requirement: Bound navigation to available gameweeks
The system SHALL restrict navigation to gameweeks that have squad data available — from the first gameweek through the current (latest available) gameweek — because a future gameweek's squad does not exist until its deadline passes.

#### Scenario: At the earliest gameweek
- **WHEN** the first available gameweek is shown
- **THEN** the "previous" action is disabled

#### Scenario: At the latest available gameweek
- **WHEN** the current (latest available) gameweek is shown
- **THEN** the "next" action is disabled

### Requirement: Indicate the selected gameweek
The system SHALL clearly show which gameweek is currently displayed.

#### Scenario: Gameweek label
- **WHEN** a gameweek's squad is displayed
- **THEN** the system shows the gameweek number or name (e.g. "Gameweek 37")