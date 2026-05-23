## ADDED Requirements

### Requirement: Show team identity and aggregate stats in a persistent panel
The system SHALL display a team-info panel alongside the squad with team name, manager name,
country flag, and aggregate performance stats.

#### Scenario: Panel content on load
- **WHEN** the Squad screen loads for a valid team
- **THEN** the panel shows: team name, manager name, country flag, overall points, overall
  rank, total FPL players (season), and current-gameweek points

#### Scenario: Country flag absent
- **WHEN** the manager's region code is not available
- **THEN** the flag is omitted and the remaining panel content renders normally

### Requirement: Layout adapts to viewport
The system SHALL position the panel as a left sidebar on desktop and as a collapsible header
on mobile.

#### Scenario: Desktop layout
- **WHEN** the Squad screen is viewed on a desktop-width viewport
- **THEN** the panel occupies a fixed-width left column and the squad occupies the right column

#### Scenario: Mobile layout — collapsed
- **WHEN** the Squad screen is viewed on a mobile-width viewport
- **THEN** the panel is collapsed to a single summary row (team name + overall points + rank)
  with an expand control visible

#### Scenario: Mobile layout — expanded
- **WHEN** the user expands the mobile panel
- **THEN** the full panel content is shown inline above the pitch / list area

### Requirement: Provide a link to Gameweek History
The system SHALL include a control in the panel that navigates to the Gameweek History screen.

#### Scenario: Gameweek History navigation
- **WHEN** the user activates the "Gameweek History" control in the panel
- **THEN** the user is taken to the Gameweek History screen for the current team
