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
The system SHALL save the transfer plan across sessions for authenticated users.

#### Scenario: Saving a plan
- **WHEN** the user clicks "Save Plan"
- **THEN** the current draft is persisted via `PUT /api/me/transfer-draft` for that user

#### Scenario: Autosave while editing
- **WHEN** the user changes swaps, subs, or chip in the transfer planner
- **THEN** the draft is debounced and saved via `PUT /api/me/transfer-draft`

#### Scenario: Loading a plan on return
- **WHEN** the user opens the transfer screen and a draft exists for the current next GW
- **THEN** the system loads it from `GET /api/me/transfer-draft` and restores swaps and subs

#### Scenario: Stale gameweek
- **WHEN** a stored draft's `targetGw` is less than the current next gameweek
- **THEN** the system deletes the draft via `DELETE /api/me/transfer-draft`, shows the
  stale-GW toast, and starts a fresh draft for the new GW

#### Scenario: One draft per user
- **WHEN** the user saves a transfer draft
- **THEN** at most one draft row exists per user account (upsert on `user_id`)

#### Scenario: User changes FPL team
- **WHEN** the user updates their linked FPL team via `PUT /api/me/team`
- **THEN** any existing transfer draft for that user is deleted before the team id is saved

#### Scenario: Import from localStorage (one-time)
- **WHEN** the user has no server draft but `fpl-transfer-draft-{teamId}` exists in
  localStorage for the current next GW
- **THEN** the client uploads it via `PUT`, removes the localStorage key, and uses the
  imported draft; if both server and local exist, the newer `savedAt` wins
