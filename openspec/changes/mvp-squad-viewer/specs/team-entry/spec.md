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

### Requirement: Carry the team ID in the URL
The system SHALL keep the selected team ID in the URL as a query parameter, so that reloading or sharing the link reopens the same team's squad without re-entry.

#### Scenario: Reload or open a shared link
- **WHEN** a user reloads, or opens a link, whose URL contains a team ID
- **THEN** the system shows that team's squad directly, without the entry step

#### Scenario: Switch to a different team
- **WHEN** a user chooses to change the team ID
- **THEN** the system updates the URL to the new team ID and shows that team's squad