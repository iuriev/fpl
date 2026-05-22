## ADDED Requirements

### Requirement: Show top players by gameweek points
The system SHALL display the top 20 players ranked by points in a selected gameweek, on the
"This GW" tab.

#### Scenario: Top players for a finished gameweek
- **WHEN** the This GW tab is active and the selected gameweek is finished
- **THEN** 20 players are listed in descending order of gameweek points, each showing rank,
  name, position, club, and points

#### Scenario: Gameweek navigation
- **WHEN** the user uses the prev / next controls on the This GW tab
- **THEN** the list updates for the selected gameweek and the `gw` URL param is updated

#### Scenario: Navigation bounded to finished gameweeks
- **WHEN** the user is viewing the most recently finished gameweek
- **THEN** the next control is disabled (future or in-progress GWs have no reliable data)

### Requirement: Show top players by season total
The system SHALL display the top 20 players ranked by total season points on the "Season" tab.

#### Scenario: Season top 20
- **WHEN** the Season tab is active
- **THEN** 20 players are listed in descending order of total season points, each showing rank,
  name, position, club, and total points

### Requirement: Loading and error states

#### Scenario: Data loading
- **WHEN** the data for the active tab is being fetched
- **THEN** skeleton rows are shown

#### Scenario: Fetch error
- **WHEN** the request fails
- **THEN** an inline error message with a retry button is shown
