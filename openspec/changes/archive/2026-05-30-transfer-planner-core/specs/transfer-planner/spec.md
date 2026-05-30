## Requirements: Transfer Planner

### Requirement: Planning Player Replacements (Swaps)
The system SHALL allow users to replace a player in their current squad with a new player from the pool.

#### Scenario: Opening the player picker
- **WHEN** the user taps a player on the pitch in Transfer mode
- **THEN** the system opens a picker showing candidate players for that position

#### Scenario: Selecting a replacement
- **WHEN** the user selects a candidate in the picker
- **THEN** the system replaces the out-player with the selected in-player on the pitch and adds the swap to the pending list

### Requirement: Validation Rules
The system SHALL enforce FPL squad rules during planning.

#### Scenario: Budget constraint
- **WHEN** a candidate costs more than (current bank + selling price of out-player)
- **THEN** that candidate is marked as "over budget" and cannot be selected

#### Scenario: Team limit (3 players)
- **WHEN** the user already has 3 players from a certain team in the planned squad
- **THEN** other players from that team are blocked in the picker

### Requirement: Pending Swaps and Cost
The system SHALL show a summary of planned changes and their cost.

#### Scenario: Transfer cost calculation
- **WHEN** the number of swaps exceeds the available free transfers
- **THEN** each extra transfer costs 4 points, which is displayed in the header

### Requirement: Persistence
The system SHALL save the transfer plan across sessions.

#### Scenario: Saving a plan
- **WHEN** the user clicks "Save Plan"
- **THEN** the current draft is saved to LocalStorage for that team ID and target gameweek
