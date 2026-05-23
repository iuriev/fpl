## ADDED Requirements

### Requirement: Display the squad for a gameweek
The system SHALL display the manager's 15 selected players for the selected gameweek, separated into the starting XI and the bench.

#### Scenario: Squad with picks for the gameweek
- **WHEN** the selected gameweek has squad data for the team
- **THEN** the system shows 11 starting players and 4 bench players in their selection order

#### Scenario: No squad data for the gameweek
- **WHEN** the team has no picks for the selected gameweek (e.g. before the team was created)
- **THEN** the system shows a clear empty state explaining that no squad is available for that gameweek

### Requirement: Mark captain and vice-captain
The system SHALL visually distinguish the captain and the vice-captain within the squad.

#### Scenario: Captain and vice-captain shown
- **WHEN** the squad is displayed
- **THEN** the captain is marked with a "C" indicator and the vice-captain with a "V" indicator

### Requirement: Show each player's gameweek points
The system SHALL show the points each player scored in the selected gameweek. The per-player figure is the player's own gameweek score; captain point multiplication affects team totals, which are out of scope for this change.

#### Scenario: Finished gameweek
- **WHEN** the selected gameweek is finished
- **THEN** each player shows the points they scored in that gameweek

#### Scenario: Gameweek with no points yet for a player
- **WHEN** the selected gameweek has not produced points for a player
- **THEN** that player shows zero points rather than an error or a blank

### Requirement: Show player identity
The system SHALL show enough identity for each player to be recognizable.

#### Scenario: Player entry content
- **WHEN** a player is shown in the squad
- **THEN** the entry displays the player's short name, playing position (GK/DEF/MID/FWD), and club