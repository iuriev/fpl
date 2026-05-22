## ADDED Requirements

### Requirement: Toggle between Pitch and List view
The system SHALL provide a Pitch / List toggle on the Squad screen that switches the content
area between the existing pitch layout and a new list layout.

#### Scenario: Default view is Pitch
- **WHEN** the Squad screen loads with no `view` URL param
- **THEN** the Pitch view is active and the toggle shows "Pitch" as selected

#### Scenario: Selecting List view
- **WHEN** the user activates the List toggle
- **THEN** the content area switches to the list layout and the URL param `view=list` is set

#### Scenario: View persists across refresh
- **WHEN** the user shares or reloads the URL with `view=list`
- **THEN** the List view is active on load without the user toggling again

### Requirement: Display players in a stat table in List view
The system SHALL display all 15 players grouped by position with individual stat columns in
List view.

#### Scenario: Finished gameweek in List view
- **WHEN** List view is active and the selected gameweek is finished
- **THEN** players are shown in positional groups (GK, DEF, MID, FWD, then bench) with stat
  columns: Pts, MP, GS, A, CS, GC, OG, PS, PM, YC, RC, S, Bonus

#### Scenario: Gameweek with no points yet
- **WHEN** List view is active and the selected gameweek has not yet produced stats
- **THEN** each stat column shows zero rather than an error or blank

#### Scenario: Mobile horizontal scroll
- **WHEN** List view is active on a narrow viewport and stat columns overflow
- **THEN** the table scrolls horizontally with player identity columns (kit + name) remaining
  sticky on the left

### Requirement: Show availability indicator in List view
The system SHALL show the same availability indicator as Pitch view on flagged players in
List view.

#### Scenario: Flagged player in List view
- **WHEN** a player has an availability flag (doubtful, injured, suspended, unavailable)
- **THEN** the flag indicator is visible on their row in the list (as a badge on the kit icon)
