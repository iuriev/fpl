# ADR 0013: Persistent storage to reduce FPL API request volume

- Status: Superseded by ADR-0015
- Date: 2026-05-25
- Deciders: ivan.iuriev

## Context

The proxy currently fronts every data request with an in-memory TTL cache.
This works for a single-instance deployment but has limitations:

- Cache is lost on process restart, causing a burst of FPL API calls on cold start.
- Stable data (`bootstrap-static`, finished-gameweek results) is re-fetched every TTL expiry
  even though it will not change.
- The public FPL API has no published rate-limit guarantees; heavy polling risks throttling.

## Decision

Not yet made. The idea is worth exploring before the caching layer grows further.

Candidate approaches:

1. **Persist bootstrap-static and finished GW data in a lightweight DB** (e.g. SQLite or
   Redis). Live-GW data stays in-memory TTL (changes every ~60 s during matches).
2. **Scheduled background refresh** — a single timed job refreshes shared data instead of
   every request triggering its own upstream call.

## Consequences

Positive:
- Survives restarts without a cold-start API burst.
- Reduces total request count to the FPL API, especially during high traffic.

Negative / risks:
- Adds infrastructure complexity (DB dependency, migration concerns).
- Must handle stale-data scenarios if the DB refresh job falls behind.
- Adds scope to the proxy layer — evaluate after MVP is stable.

## Alternatives considered

- **In-memory TTL only (status quo):** simple, no extra dependencies, but fragile across
  restarts and scales poorly.
- **Edge/CDN caching:** shifts caching outside the proxy; viable but requires hosting changes
  outside current scope.
