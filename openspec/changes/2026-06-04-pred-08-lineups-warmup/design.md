# Design: Lineups warmup and FPL request queue

## FPL request queue

All HTTP calls to `fantasy.premierleague.com` go through `scheduleFplFetch(path, priority)`:

| Priority | Min gap | Use |
| --- | --- | --- |
| `interactive` | 100 ms (~10/s) | User-driven API (squad, entry, on-demand summary) |
| `background` | `LINEUPS_WARMUP_INTERVAL_MS` (default 5000) | Warmup job |

Interactive items are inserted **before** background items in the FIFO queue.

## Element summary storage

```text
fpl_element_summary_cache (season, element_id) PK
  data jsonb, fetched_at timestamp
```

TTL: 6 h (same as `cache.ttl.ELEMENT_SUMMARY`). Read path: memory → Postgres → FPL.

## Player tiers (warmup order)

**Hot** (per PL team): up to 18 outfield/GK with highest `minutes` in bootstrap (`minutes > 0`).

**Cold**: remaining `activeSquadElements` (`minutes > 0 || total_points > 0`) not in hot.

Hot tier first yields usable formations for all 20 teams; cold fills bench-risk / fringe players.

## Warmup phases

```text
start (delay LINEUPS_WARMUP_START_DELAY_MS, default 10s)
  → fixtures (background)
  → hot summaries (background, skip if DB fresh)
  → getPredictedLineups() (memory cache, 0 FPL if summaries in DB)
  → cold summaries (background)
  → getPredictedLineups() again
  → done
```

`LINEUPS_WARMUP_ENABLED=false` disables the job (dev escape hatch).

## Steady state

After full warm: `GET /api/predicted-lineups` reads summaries from DB/memory → **0 FPL** until
TTL expiry. Maintenance: optional future cron re-warm stale rows only (v1: warm on startup + TTL
miss on read still works).

## Health

`GET /health` adds `lineupsWarmup: { phase, ready, hot, cold, lastError }`.

`ready === true` when hot tier complete for current season.

## Env

```bash
LINEUPS_WARMUP_ENABLED=true
LINEUPS_WARMUP_INTERVAL_MS=5000
LINEUPS_WARMUP_START_DELAY_MS=10000
LINEUPS_WARMUP_HOT_PER_TEAM=18
```
