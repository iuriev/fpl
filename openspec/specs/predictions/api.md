# Predictions API

All prediction-related API contracts and endpoints.
This file supersedes `player-gameweek-predictions/spec.md` and `player-predictions-api/spec.md`.

---

## TypeScript contracts

### PlayerGameweekPrediction

```ts
interface PlayerGameweekPrediction {
  fplCode: number;             // stable player code (cross-season key)
  seasonElementId: number;     // element id in the current season
  event: number;               // target gameweek
  xPts: number;                // hybrid expected points (model + EP blend)
  modelXPts: number;           // pure model expected points (before EP blend)
  xGoals: number;              // expected goals
  xAssists: number;            // expected assists
  csProb: number | null;       // clean sheet probability (GK/DEF only; null for MID/FWD)
  defconPts: number;           // expected defensive contribution bonus points
  confidence: 'low' | 'medium' | 'high';
  epNextAnchor: number;        // FPL ep_next used as EP blend anchor
}
```

### TeamMarketDto

```ts
interface TeamMarketDto {
  teamId: number;
  teamCode: number;
  teamName: string;
  teamShortName: string;
  fixtures: TeamFixtureSummary[];
  csProb: number;     // team CS probability for next fixture (csProbTeam, not player-adjusted)
  xG: number;         // team λ_for for next fixture
  xGA: number;        // team λ_against for next fixture
}

interface TeamFixtureSummary {
  opponentTeamId: number;
  opponentShortName: string;
  isHome: boolean;
}
```

### PredictionsResponse

```ts
interface PredictionsResponse {
  event: number;
  modelRunId: string | null;
  ready: boolean;
  players: PlayerGameweekPrediction[];
}
```

### MarketResponse

```ts
interface MarketResponse {
  event: number;
  modelRunId: string | null;
  ready: boolean;
  teams: TeamMarketDto[];
}
```

---

## Endpoints

### GET /api/predictions

Returns all `PlayerGameweekPrediction` records for the requested gameweek from the most
recent completed `pred_model_run` of kind `score`.

**Query params:**

| Param | Required | Description |
|-------|----------|-------------|
| `event` | yes | Target gameweek number |

**Responses:**

| Condition | Status | Body |
|-----------|--------|------|
| Score run exists for event | 200 | `PredictionsResponse` with `ready: true` and `players` populated |
| No run exists yet | 200 | `PredictionsResponse` with `ready: false` and `players: []` |
| `event` param missing or invalid | 400 | Error body |

---

### GET /api/predictions/preview

Top predictions per position by `xPts`, and top by `xAssists`. Intended for summary screens.

**Query params:** same as `/api/predictions`.

**Response shape:**

```ts
interface PredictionsPreviewResponse {
  event: number;
  modelRunId: string | null;
  ready: boolean;
  byXPts: Record<'FWD' | 'MID' | 'DEF' | 'GK', PlayerGameweekPrediction[]>;
  byXAssists: Record<'FWD' | 'MID' | 'DEF', PlayerGameweekPrediction[]>;
}
```

---

### GET /api/market

Returns team-level stats (xG, xGA, csProb) for all 20 PL teams for the requested
gameweek, derived from the same `pred_model_run` as `/api/predictions`.

**Query params:** same as `/api/predictions`.

**Response:** `MarketResponse`.

---

### GET /api/market/preview

Top teams by CS probability and by xG. Intended for summary screens.

**Response shape:**

```ts
interface MarketPreviewResponse {
  event: number;
  modelRunId: string | null;
  ready: boolean;
  topCs: TeamMarketDto[];   // sorted by csProb desc
  topXg: TeamMarketDto[];   // sorted by xG desc
}
```

---

### GET /api/predicted-lineups

Returns predicted starting elevens for all 20 PL teams for the requested or next gameweek.
Premium-only — returns `403` with `premium_required` for free-tier users.

**Query params:**

| Param | Required | Description |
|-------|----------|-------------|
| `gw` | no | Target gameweek. Defaults to `is_next` gameweek from bootstrap-static |

**Response shape:**

```ts
interface PredictedLineupsResponse {
  event: number;
  teams: PredictedTeamLineup[];
}

interface PredictedTeamLineup {
  teamId: number;
  teamCode: number;
  teamName: string;
  teamShortName: string;
  formation: { label: string };   // e.g. "4-3-3"
  players: PredictedPlayer[];     // exactly 11
  nextFixture: TeamFixtureSummary | null;
}

interface PredictedPlayer {
  elementId: number;
  xMins: number;
  xPts: number;          // from ep_next, NOT from Poisson model
  benchRisk: boolean;
  tacticalRole: string | null;
  lane: 'L' | 'C' | 'R';
}
```

---

## Storage

| Table | Purpose |
|-------|---------|
| `pred_model_run` | One row per scoring run: kind, season, target event, params, metrics |
| `pred_player_gw` | One row per player per event: all `PlayerGameweekPrediction` fields |
| `pred_team_strength` | One row per team per run: attack, defence, homeAdv, mu |
| `pred_epl_match` | Historical match facts ingested from football-data.co.uk |
| `pred_player_gw_fact` | Historical player GW facts ingested from vaastav |
| `pred_team_alias` | Mapping from FPL `team_id` to Poisson model team slug |

Double gameweek aggregation: `pred_player_gw` stores **one row per player per event**
with `xGoals`, `xAssists`, `defconPts`, `modelXPts`, `xPts` summed across fixtures, and
`csProb` combined using `1 − (1 − p₁)(1 − p₂)`.

---

## Requirements

### No run yet

- **WHEN** no score run exists for the requested gameweek
- **THEN** `GET /api/predictions` returns `ready: false`, `players: []`, HTTP 200 — not 500

### Card fields absent

- **WHEN** a consumer reads `PlayerGameweekPrediction`
- **THEN** there are no `yellowProb` or `redProb` properties

### Free-data only

- **WHEN** the scoring pipeline runs
- **THEN** it does not call paid football stats APIs or scrape Understat / FBref

### Validation before production serving

The system SHALL NOT ship a production prediction API until hold-out validation documents:
1. Calibration (Brier score / reliability diagram)
2. FPL utility vs `ep_next` (MAE and rank correlation for `xPts`)
3. Market sanity vs football-data odds where available
