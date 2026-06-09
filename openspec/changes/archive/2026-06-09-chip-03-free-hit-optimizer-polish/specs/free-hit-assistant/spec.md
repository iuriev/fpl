## ADDED Requirements

### Requirement: Free Hit squad suggestion endpoint

The system SHALL expose `GET /api/squad/:teamId/free-hit-suggest?gw={n}` returning an optimal
15-player squad for the target gameweek within the manager's total budget (sell prices + bank).

#### Scenario: Successful suggestion

- **WHEN** a premium user requests free-hit-suggest for a gameweek with prediction data
- **THEN** the response includes `orderedSquad` (15 element ids), `players` with `xPts`,
  `totalXPts` (sum of starter xPts), `totalBudget`, `selectedCost`, and `remainingBudget`

#### Scenario: No predictions

- **WHEN** no prediction data exists for the target gameweek
- **THEN** the API returns 404 with a clear error message

### Requirement: Greedy optimiser constraints

The optimiser SHALL produce a valid FPL squad: 2 GK, 5 DEF, 5 MID, 3 FWD; max 3 per club;
total cost ≤ budget; 11 starters in a valid formation.

#### Scenario: XI dominates bench by position

- **WHEN** the optimiser completes
- **THEN** no bench player of a given position has higher model xPts than any starter of that position

#### Scenario: Budget investment

- **WHEN** affordable upgrades exist on bench or XI
- **THEN** remaining budget is invested before returning (target: ≤ £0.1m unspent)

### Requirement: Bench ordering for auto-sub

Bench slots 12–15 in `orderedSquad` SHALL be ordered for FPL auto-substitution:
best outfield sub first, second-best next, cheapest playable enabler last.

#### Scenario: Bench priority

- **WHEN** the suggestion includes four bench players
- **THEN** slot 12 is the starting GK's backup (premium when affordable)
- **AND** slots 13–14 are the highest-xPts outfield subs
- **AND** slot 15 is the cheapest playable enabler

### Requirement: Model xPts consistency in UI

The Transfer Screen SHALL display model xPts (not FPL `ep_next`) when reviewing an AI Free Hit
suggestion.

#### Scenario: Player pool alignment

- **WHEN** predictions are ready for the target gameweek
- **THEN** `/api/player-pool` `expectedPoints` reflects model xPts
- **AND** Free Hit player cards match the optimiser's `xPts`

#### Scenario: Predicted total on pitch

- **WHEN** the user has an active Free Hit draft from AI suggestion
- **THEN** the pitch shows **Predicted total** (sum of starter xPts) in the top-right corner

### Requirement: AI Free Hit button (premium)

The Transfer Screen action bar SHALL include an **AI Free Hit** button gated by premium and
chip availability.

#### Scenario: Premium with chip available

- **WHEN** the user is premium and `freehit.status === 'available'`
- **THEN** tapping AI Free Hit fetches the suggestion, sets chip to `freehit`, applies swaps
  and bench order, and shows the suggested squad on the pitch

#### Scenario: Non-premium

- **WHEN** the user is not premium
- **THEN** the button is visible but locked and triggers the premium upsell
