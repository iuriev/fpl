## ADDED Requirements

### Requirement: Element summary persistent cache

The system SHALL store FPL `element-summary` responses in PostgreSQL keyed by season and
element id, and SHALL prefer that cache over live FPL when the row is younger than six hours.

#### Scenario: Cache hit on read

- **WHEN** predicted lineups or another feature requests element summary for a cached player
- **THEN** the proxy does not call the FPL API for that player

#### Scenario: Cache miss

- **WHEN** no fresh row exists for the player in the current season
- **THEN** the proxy fetches from FPL through the shared request queue and upserts the row

### Requirement: Background lineups warmup

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

### Requirement: Interactive FPL priority

The system SHALL process user-driven FPL fetches ahead of background warmup fetches in the
shared request queue.

#### Scenario: User request during warmup

- **WHEN** a user API call needs FPL data while warmup is running
- **THEN** the user request is not blocked behind the full cold-tier queue
