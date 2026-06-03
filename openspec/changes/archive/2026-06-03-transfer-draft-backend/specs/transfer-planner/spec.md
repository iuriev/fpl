## MODIFIED Requirements

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
