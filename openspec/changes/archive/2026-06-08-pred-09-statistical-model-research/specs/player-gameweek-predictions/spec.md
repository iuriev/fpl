## ADDED Requirements

### Requirement: Per-player gameweek prediction contract

The system SHALL define a `PlayerGameweekPrediction` record for each FPL player and target
gameweek `event`, containing `xPts`, `xGoals`, `xAssists`, `csProb`, `defconPts`, and
`confidence`, produced by the PRED-09 statistical pipeline (offline spike first, production API
in a follow-up change).

#### Scenario: Single-fixture gameweek

- **WHEN** the player has exactly one scheduled fixture in the gameweek
- **THEN** `xGoals`, `xAssists`, and `defconPts` equal that fixture's expected contributions
  scaled by expected minutes
- **AND** `csProb` is the team clean sheet probability for that fixture for DEF and GK only

#### Scenario: Double gameweek

- **WHEN** the player has two fixtures in the same gameweek
- **THEN** `xGoals`, `xAssists`, and `defconPts` are the sum of both fixtures' expectations
- **AND** `csProb` for DEF/GK equals `1 − (1 − p₁)(1 − p₂)` where `pᵢ` is per-fixture CS probability

#### Scenario: Blank gameweek

- **WHEN** the player has no fixtures in the gameweek
- **THEN** `xPts`, `xGoals`, `xAssists`, and `defconPts` are `0`
- **AND** `csProb` is `null` for outfield players and `0` or `null` per design for GK/DEF with no match

#### Scenario: Outfield clean sheet field

- **WHEN** the player's position is MID or FWD
- **THEN** `csProb` is `null`

### Requirement: Hybrid headline xPts

The system SHALL compute headline `xPts` as a hybrid of the internal model expected points and
FPL official `ep_next`, with blend weight increasing toward `ep_next` when `confidence` is `low`.

#### Scenario: High confidence blend

- **WHEN** `confidence` is `high`
- **THEN** `xPts` weights the model estimate at least 70% after calibration (exact weights
  documented in the spike report)

#### Scenario: Low confidence blend

- **WHEN** `confidence` is `low`
- **THEN** `xPts` weights `ep_next` at least 50% so sparse-data players stay anchored to FPL

### Requirement: Expanded prediction display

When the product surfaces PRED-09 predictions, the UI SHALL show `xPts` as the primary sort key
and SHALL show `xGoals`, `xAssists`, `csProb` (or an em dash when `null`), and `defconPts` as
separate visible fields, plus a `confidence` indicator.

#### Scenario: Defender row breakdown

- **WHEN** a DEF player prediction is shown on a list or profile
- **THEN** the user sees `xPts` and separate values for `xGoals`, `xAssists`, `csProb`, and
  `defconPts`
- **AND** a disclaimer states that figures are approximate estimates

#### Scenario: Low confidence still shows breakdown

- **WHEN** `confidence` is `low`
- **THEN** all breakdown fields remain visible
- **AND** the confidence indicator is shown without hiding other fields

### Requirement: Card probabilities excluded

The system SHALL NOT expose yellow or red card probabilities in the PRED-09 contract or UI
driven by this model.

#### Scenario: No card fields in API contract

- **WHEN** a consumer reads `PlayerGameweekPrediction`
- **THEN** there are no `yellowProb` or `redProb` properties

### Requirement: Free-data-only modelling

The PRED-09 pipeline SHALL use only free data sources: vaastav historical FPL CSVs,
football-data.co.uk match CSVs, and the public FPL API.

#### Scenario: No paid provider dependency

- **WHEN** the offline spike or production batch runs
- **THEN** it does not call paid football stats APIs or scrape Understat/FBref

### Requirement: Validation before production serving

The system SHALL NOT ship a production prediction API until hold-out validation documents all
three criteria: calibration, FPL utility vs `ep_next`, and market sanity vs football-data odds
where available.

#### Scenario: Hold-out gate

- **WHEN** GW 30–38 (or agreed hold-out window) of the latest complete season is evaluated
- **THEN** a spike README records Brier/reliability, MAE and rank correlation for `xPts`, and
  odds comparison summary
- **AND** stakeholders sign off before the proxy API change starts
