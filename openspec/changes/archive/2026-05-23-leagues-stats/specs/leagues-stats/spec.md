## ADDED Requirements

### Requirement: Display the manager's league rankings
The system SHALL show the manager's current rank in every league they are enrolled in,
grouped by league type (Classic and Head-to-Head).

#### Scenario: Manager with classic leagues
- **WHEN** the My Stats screen loads for a team enrolled in classic leagues
- **THEN** the "General Leagues" section lists each league with its name, current rank, and
  a direction indicator (↑/↓/—) showing rank movement vs the previous gameweek

#### Scenario: Manager with H2H leagues
- **WHEN** the team is enrolled in head-to-head leagues
- **THEN** a "Head-to-Head Leagues" section appears with the same row format

#### Scenario: No H2H leagues
- **WHEN** the team has no head-to-head leagues
- **THEN** the "Head-to-Head Leagues" section is not shown

#### Scenario: Rank direction indicators
- **WHEN** the manager's rank in a league improved vs the previous gameweek
- **THEN** the direction shows ↑ in green
- **WHEN** the rank worsened
- **THEN** the direction shows ↓ in red
- **WHEN** the rank is unchanged or the manager joined the league this gameweek
- **THEN** the direction shows — in neutral colour

### Requirement: Loading and error states

#### Scenario: Data loading
- **WHEN** the leagues data is being fetched
- **THEN** skeleton rows are shown

#### Scenario: Fetch error
- **WHEN** the request fails
- **THEN** an inline error message with a retry button is shown
