# Predicted Lineups Screen

Product and infrastructure requirements for the `/predicted-lineups` frontend screen and
the backend services that power it. Model algorithm is in `lineup-prediction.md`;
API contract is in `api.md`.

---

## Requirement: Predicted Lineups screen

The system SHALL provide a Predicted Lineups screen at `/predicted-lineups` where the user
can browse all Premier League teams and view each team's predicted eleven.
Lineup content is premium-only.

#### Scenario: Free user sees upsell only

- **WHEN** a free-tier user opens `/predicted-lineups`
- **THEN** predicted lineup data is not shown
- **AND** a premium unlock overlay and upsell path are shown
- **AND** `requestUpsell('predictions')` is triggered on mount

#### Scenario: Premium user sees lineups

- **WHEN** a premium-tier user opens `/predicted-lineups`
- **THEN** the client fetches predicted lineups and renders team content

#### Scenario: Team selection

- **WHEN** a premium user opens `/predicted-lineups`
- **THEN** a team selector lists all 20 clubs
- **AND** selecting a club updates the displayed formation label and eleven players

#### Scenario: Formation label visible

- **WHEN** a team is selected and data has loaded
- **THEN** the formation string (e.g. `4-3-3`) is shown prominently above the lineup content

#### Scenario: Table and pitch views

- **WHEN** the user toggles Table view
- **THEN** players are listed with name, xMins, and xPts
- **AND** bench-risk players are visually distinguished
- **WHEN** the user toggles Pitch view
- **THEN** players appear on four rows (GK, DEF, MID, FWD) with card counts matching formation
- **AND** within each outfield row, cards are ordered left-to-right by assigned flank slots

#### Scenario: Next fixture context

- **WHEN** the team has a scheduled fixture in the target gameweek
- **THEN** opponent, home/away, and kickoff time are shown in the team header area

#### Scenario: Player profile

- **WHEN** the user taps a predicted player row or card
- **THEN** the player profile sheet opens for that element id

---

## Requirement: Navigation entry

The system SHALL link to Predicted Lineups from the team info panel.

#### Scenario: Drawer link

- **WHEN** the team info panel is shown in full navigation mode
- **THEN** a Predicted Lineups link navigates to `/predicted-lineups`

---

## Requirement: Loading and error states

#### Scenario: Data loading

- **WHEN** predicted lineups are being fetched
- **THEN** skeleton placeholders are shown for the active team content

#### Scenario: Fetch failure

- **WHEN** the predicted lineups request fails
- **THEN** an inline error with retry is shown

---

## Requirement: Element summary persistent cache

The system SHALL store FPL `element-summary` responses in PostgreSQL keyed by season and
element id, and SHALL prefer that cache over live FPL when the row is younger than six hours.

#### Scenario: Cache hit on read

- **WHEN** predicted lineups or another feature requests element summary for a cached player
- **THEN** the proxy does not call the FPL API for that player

#### Scenario: Cache miss

- **WHEN** no fresh row exists for the player in the current season
- **THEN** the proxy fetches from FPL through the shared request queue and upserts the row

---

## Requirement: Background lineups warmup

The system SHALL run a background warmup job after the proxy starts (unless disabled by env)
that prefetches fixtures and element summaries in priority order (hot players before cold),
with at least five seconds between background FPL requests by default.

#### Scenario: Hot tier before cold

- **WHEN** warmup runs after startup
- **THEN** high-minutes squad players per Premier League team are fetched before remaining
  active squad players

#### Scenario: Lineups ready flag

- **WHEN** hot-tier summaries for the current season are complete
- **THEN** health status reports `lineupsWarmup.ready` as true

#### Scenario: Disabled in development

- **WHEN** `LINEUPS_WARMUP_ENABLED` is `false`
- **THEN** no background warmup FPL requests are scheduled

---

## Requirement: Interactive FPL priority

The system SHALL process user-driven FPL fetches ahead of background warmup fetches in the
shared request queue.

#### Scenario: User request during warmup

- **WHEN** a user API call needs FPL data while warmup is running
- **THEN** the user request is not blocked behind the full cold-tier queue
