## Requirements: Player Info Popup

### Requirement: Display Player Details
The system SHALL display a popup with player details when a player is selected.

#### Scenario: Opening the popup
- **WHEN** the user clicks on a player card that has available extended info
- **THEN** the system shows a popup containing the player's name, club, price, and ownership %

### Requirement: Display Upcoming Fixtures
The system SHALL show the next 5 fixtures for the player's team.

#### Scenario: Fixture list with FDR
- **WHEN** the player info popup is open
- **THEN** it displays a list of the next 5 gameweeks with the opponent name, home/away status, and a color-coded FDR chip

### Requirement: Dismissal
The system SHALL allow the user to easily close the popup.

#### Scenario: Closing the popup
- **WHEN** the user clicks the "Close" button, clicks outside the popup, or presses the Escape key
- **THEN** the system dismisses the popup and returns to the squad view
