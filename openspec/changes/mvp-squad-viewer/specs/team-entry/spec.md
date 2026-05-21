## ADDED Requirements

### Requirement: Enter a public team ID
The system SHALL allow a user to identify the squad to view by entering a public FPL team ID, with no authentication.

#### Scenario: Valid team ID submitted
- **WHEN** a user enters a positive integer team ID and submits it
- **THEN** the system proceeds to the squad view for that team

#### Scenario: Empty input
- **WHEN** the team ID field is empty
- **THEN** the system prevents submission and indicates that a team ID is required

#### Scenario: Non-numeric input
- **WHEN** a user enters a value that is not a positive integer
- **THEN** the system rejects it with a validation message and makes no network request

### Requirement: Validate the team ID against FPL
The system SHALL verify that the entered team ID corresponds to a real FPL team before showing a squad, and report failures clearly.

#### Scenario: Unknown team ID
- **WHEN** the entered team ID does not correspond to any FPL team
- **THEN** the system shows a "team not found" message and stays on the entry screen

#### Scenario: Data source unavailable
- **WHEN** FPL data cannot be reached (proxy or upstream error)
- **THEN** the system shows an error message and offers the user a way to retry

### Requirement: Remember the team ID for the session
The system SHALL remember the most recently used team ID so the user does not have to re-enter it after a reload or when returning to the app.

#### Scenario: Reopen after entering an ID
- **WHEN** a user reloads or reopens the app after a successful entry
- **THEN** the system reuses the remembered team ID and goes directly to the squad view

#### Scenario: Switch to a different team
- **WHEN** a user chooses to change the team ID
- **THEN** the system lets them enter a different ID and replaces the remembered one