## ADDED Requirements

### Requirement: Indicate player availability
The system SHALL show an availability indicator on a player when FPL flags them as not fully available (doubtful, injured, suspended, or unavailable), and SHALL show no indicator when the player is fully available.

#### Scenario: Doubtful player
- **WHEN** a player has a reduced chance of playing (FPL status is doubtful)
- **THEN** the system shows a warning availability indicator on that player

#### Scenario: Unavailable player
- **WHEN** a player is injured, suspended, or otherwise unavailable
- **THEN** the system shows an availability indicator distinct from the doubtful warning

#### Scenario: Fully available player
- **WHEN** a player is fully available
- **THEN** the system shows no availability indicator

### Requirement: Reveal status details on demand
The system SHALL let the user view the availability details for a flagged player, including the FPL news text and the chance of playing when provided.

#### Scenario: Open details for a flagged player
- **WHEN** the user selects a flagged player
- **THEN** the system shows the player's status news and, if available, the chance of playing percentage

#### Scenario: Available player has no details
- **WHEN** the user selects a fully available player
- **THEN** the system shows no status details, as there is nothing to report
