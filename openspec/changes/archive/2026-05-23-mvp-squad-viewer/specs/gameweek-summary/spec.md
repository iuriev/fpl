## ADDED Requirements

### Requirement: Show the team's gameweek summary
The system SHALL show, for the selected gameweek, the team's total points for the gameweek, the gameweek average points, the gameweek highest points, the team's gameweek rank, and the number of transfers the team made.

#### Scenario: Gameweek with data
- **WHEN** the selected gameweek has summary data for the team
- **THEN** the system shows total points, average points, highest points, gameweek rank, and transfers made

#### Scenario: A value is unavailable
- **WHEN** a summary value is not yet available (e.g. rank not computed for an in-progress gameweek)
- **THEN** the system shows a placeholder for that value instead of an error

### Requirement: Summary follows the selected gameweek
The system SHALL keep the summary consistent with the gameweek currently shown.

#### Scenario: Navigate to another gameweek
- **WHEN** the user navigates to a different gameweek
- **THEN** the summary updates to that gameweek's values
