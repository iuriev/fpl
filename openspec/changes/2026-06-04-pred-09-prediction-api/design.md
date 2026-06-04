# Design: Prediction API and Postgres storage

## Storage model

| Layer | Table | Written by |
| --- | --- | --- |
| Facts | `pred_epl_match`, `pred_player_gw_fact`, `pred_team_alias` | Ingest (idempotent upsert) |
| Run metadata | `pred_model_run` | Batch start/end |
| Team fit | `pred_team_strength` | Train step |
| Team GW | `pred_fixture_team` | Score step (per fixture × team) |
| Player GW | `pred_player_gw` | Score step (consumer contract) |

**Not** stored in `fpl_*_cache` JSON. Bootstrap cache remains for live FPL snapshots only.

## Latest predictions query

```sql
SELECT p.* FROM pred_player_gw p
JOIN pred_model_run r ON r.id = p.model_run_id
WHERE p.event = $gw AND r.kind = 'score'
ORDER BY r.created_at DESC
LIMIT 1 PER player;  -- app: DISTINCT ON (player_id) in Drizzle
```

Expose `model_run_id` in response headers or meta for debugging.

## API shape

```ts
interface PlayerGameweekPredictionDto {
  playerId: number;
  event: number;
  xPts: number;
  xGoals: number;
  xAssists: number;
  csProb: number | null;
  defconPts: number;
  confidence: 'low' | 'medium' | 'high';
}
```

`GET /api/predictions?event=34` → `{ event, modelRunId, players: PlayerGameweekPredictionDto[] }`

## Batch pipeline

```
ingest-matches (football-data CSV or API cron)
ingest-player-facts (vaastav seasons + element-summary backfill)
train-team-model → pred_model_run(kind=train) + pred_team_strength
score-gameweek --event=N → pred_model_run(kind=score) + pred_fixture_team + pred_player_gw
```

Port algorithms from `research/pred-09/` (validated in SPIKE_RESULTS.md).

## Hybrid xPts

Use spike blend weights until grid-search replaces them. Store `ep_next_anchor` and
`model_x_pts` for audit.

## Migrations

`proxy/src/db/migrations/0005_pred_09_tables.sql` — apply with `npm run db:migrate -w proxy`.
