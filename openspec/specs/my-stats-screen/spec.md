### Requirement: Tabbed My Stats screen

The system SHALL present league rankings and gameweek history on a single My Stats screen at
`/stats`, with two tabs below the page header.

#### Scenario: Default tab shows leagues

- **WHEN** the user opens `/stats` without a `tab` query parameter
- **THEN** the Leagues tab is selected and the manager's league rankings are shown

#### Scenario: History tab via URL

- **WHEN** the user opens `/stats?tab=history`
- **THEN** the My GW history tab is selected and the per-gameweek history table is shown

#### Scenario: Switching tabs

- **WHEN** the user selects the My GW history tab
- **THEN** the URL updates to include `tab=history` and the history table is shown
- **WHEN** the user selects the Leagues tab
- **THEN** the `tab` query parameter is removed and league rankings are shown

### Requirement: Drawer navigation

The system SHALL expose one drawer link for this screen.

#### Scenario: Single My Stats link

- **WHEN** the team info panel is shown in full navigation mode
- **THEN** a My Stats link navigates to `/stats`
- **AND** there is no separate My GW history link

### Requirement: Return navigation from history row

#### Scenario: Open squad from history

- **WHEN** the user taps a gameweek row on the history tab
- **THEN** the squad screen opens for that gameweek
- **AND** back navigation returns to `/stats?tab=history`

### Requirement: Display the manager's league rankings

The system SHALL show the manager's current rank in every league they are enrolled in on the
**Leagues** tab of the My Stats screen, grouped by league type (Classic and Head-to-Head).

#### Scenario: Manager with classic leagues

- **WHEN** the Leagues tab is active for a team enrolled in classic leagues
- **THEN** the "General Leagues" section lists each league with its name, current rank, and
  a direction indicator (↑/↓/—) showing rank movement vs the previous gameweek

#### Scenario: Manager with H2H leagues

- **WHEN** the team is enrolled in head-to-head leagues
- **THEN** a "Head-to-Head Leagues" section appears with the same row format

#### Scenario: No H2H leagues

- **WHEN** the team has no head-to-head leagues
- **THEN** the "Head-to-Head Leagues" section is not shown

#### Scenario: Rank direction indicators

- **WHEN** the manager's rank in a league improved vs the previous gameweek
- **THEN** the direction shows ↑ in green
- **WHEN** the rank worsened
- **THEN** the direction shows ↓ in red
- **WHEN** the rank is unchanged or the manager joined the league this gameweek
- **THEN** the direction shows — in neutral colour

### Requirement: Loading and error states (leagues)

#### Scenario: Data loading

- **WHEN** the leagues data is being fetched on the Leagues tab
- **THEN** skeleton rows are shown

#### Scenario: Fetch error

- **WHEN** the leagues request fails
- **THEN** an inline error message with a retry button is shown

### Requirement: Display per-gameweek history for the season

The system SHALL show a table of all played gameweeks for the current season on the **My GW
history** tab of the My Stats screen, most recent first, with performance stats per gameweek.

#### Scenario: History with multiple gameweeks

- **WHEN** the My GW history tab is active for a team that has played gameweeks
- **THEN** the table shows one row per played gameweek with columns: GW, OR, rank direction
  (↑/↓/—), OP, GWR, GWP, PB, TM, TC, £m

#### Scenario: Rank direction indicators

- **WHEN** a gameweek's overall rank improved compared to the previous gameweek
- **THEN** the direction indicator shows ↑ in green
- **WHEN** a gameweek's overall rank worsened
- **THEN** the direction indicator shows ↓ in red
- **WHEN** overall rank is unchanged or there is no previous row
- **THEN** the direction indicator shows — in neutral colour

#### Scenario: No history yet

- **WHEN** the team has no played gameweeks
- **THEN** the tab shows a clear empty state message

### Requirement: Loading and error states (history)

#### Scenario: History loading

- **WHEN** the history data is being fetched on the My GW history tab
- **THEN** a skeleton of rows is shown in place of the table

#### Scenario: Fetch error

- **WHEN** the history request fails
- **THEN** an inline error message is shown with a retry button
