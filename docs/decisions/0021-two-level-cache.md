# ADR 0021: Two-level cache — L1 memory in front of L2 Postgres

- Status: Accepted
- Date: 2026-06-12
- Deciders: ivan.iuriev
- Supersedes: ADR 0018 (partially — L2 Postgres design unchanged; this adds L1)

## Context

ADR 0018 introduced a Postgres-backed L2 cache to protect the FPL API from burst
requests on process restarts. It worked: FPL API traffic dropped to near zero.

However, ADR 0018 deliberately removed the in-memory FPL cache. Each `getOrFetch*` call
issues a full Postgres query returning a large JSONB blob (bootstrap ~2–3 MB,
gw-live ~1–2 MB). With 12 call sites and no in-memory layer, a single page load triggers
3–5 Postgres reads totalling 10+ MB — excessive DB load under real traffic.

## Decision

Add an in-memory L1 cache in front of every `getOrFetch*` function in `db-cache.ts`,
using the existing `cache.ts` module. The Postgres L2 layer is unchanged.

**Three-level read path:**

```
Request → L1 (process memory) → L2 (Postgres) → L3 (FPL API)
```

**TTL rules:**

| Data | Condition | L1 TTL |
|---|---|---|
| Bootstrap | pre-season or complete | 7 days |
| Bootstrap | active season | remaining L2 time (up to 12h) |
| GW Live | frozen (`data_checked=true`) | 7 days |
| GW Live | not frozen | remaining L2 time (up to 3h) |
| Squad picks | frozen | 7 days |
| Squad picks | not frozen | 5 minutes |
| History | complete season | 7 days |
| History | active season | 5 minutes |
| Transfers | complete season | 7 days |
| Transfers | active season | 5 minutes |

**"Remaining L2 time"** — L1 TTL equals `(fetchedAt + L2 TTL) - now` so both layers
expire at the same wall-clock moment. A process can never serve an L2-stale row from memory.

**5 minutes for per-team active data** — transfers happen on fpl.com; the proxy cannot
detect them. 5 minutes is the maximum staleness after a transfer. This is acceptable
since FPL itself takes a few minutes to reflect transfers.

**Bootstrap pre-season TTL raised from 12h to 7 days** — off-season data never changes
between deployments. The change applies to both L1 and L2 via `getBootstrapTtlSeconds`.

**Constants** (both in `db-cache.ts`):
- `FROZEN_CACHE_TTL_SECONDS = 604800` (7 days)
- `SHORT_CACHE_TTL_SECONDS = 300` (5 minutes)

## Consequences

**Positive:**
- Egress drops from ~20 GB/period to ~1–2 GB — within the free-tier 5 GB limit.
- Hot shared data (bootstrap, current GW live) served from memory after the first read.
- Frozen historical data never hits Postgres or FPL API again once loaded into L1.

**Negative / watch:**
- Memory usage increases: bootstrap (~3 MB) + live data for recent GWs + per-team entries.
  At 500 concurrent users: estimated 50–100 MB additional heap. Within the 256 MB Fly.io limit.
- Per-team L1 entries accumulate during high-traffic periods. No eviction beyond TTL expiry.
  Monitor heap if user count grows beyond 1,000.

## Rule for future code

Every new `getOrFetch*` function added to `db-cache.ts` MUST include an L1 in-memory
check before the Postgres query. Use `FROZEN_CACHE_TTL_SECONDS` for frozen/complete data,
`SHORT_CACHE_TTL_SECONDS` for active per-team data, and remaining L2 TTL for shared
(non-per-team) data. Skipping L1 causes excessive Postgres load.
