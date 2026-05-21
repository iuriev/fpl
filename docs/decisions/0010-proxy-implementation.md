# ADR 0010: Proxy implementation — service layer composition pattern

- Status: Accepted
- Date: 2026-05-21
- Deciders: ivan.iuriev, Claude

## Context

Phase 3 implements the FPL proxy endpoints (tasks 3.1–3.8): an HTTP client, caching layer, and
three endpoints (`/api/gameweeks`, `/api/entry/:teamId`, `/api/squad/:teamId/:gw`) that compose
UI-ready JSON from the public FPL API. The proxy must aggregate data from multiple FPL endpoints,
cache aggressively per ADR 0003's D2 default TTLs, and surface clear errors.

## Decision

Organize the proxy as a set of service modules that each handle one concern:

1. **fpl-client.ts**: Raw HTTP client for fantasy.premierleague.com/api.
   - Functions: `getBootstrapStatic()`, `getEntry(teamId)`, `getPicks(teamId, gw)`, `getLive(gw)`.
   - All FPL contract mapping lives here: response shapes are defined, error handling is explicit.

2. **cache.ts**: Simple in-memory cache with TTL.
   - Generic `get<T>(key)` and `set<T>(key, data, ttlSeconds)`.
   - TTL constants match D2: `BOOTSTRAP=3600`, `ENTRY=3600`, `SQUAD_FINISHED=86400`, `SQUAD_CURRENT=60`.
   - No external dependencies (no Redis, no external library — acceptable for MVP).

3. **Service modules** (gameweeks-service.ts, entry-service.ts, squad-service.ts):
   - Each implements one business logic concern.
   - Each service calls fpl-client + cache, never crosses to other services.
   - Squad service does the heaviest work: assembles starters/bench in XI order, maps player data,
     computes net points (subtract transfer cost), etc.

4. **index.ts**: Hono routes that delegate to services.
   - Thin handler layer: validate params, call service, translate errors to HTTP status codes.
   - Error boundaries: 400 (invalid input), 404 (not found / no picks), 500 (upstream error).

## Consequences

- (+) **Clear separation**: FPL API contract, caching, business logic, HTTP boundary are isolated.
- (+) **Testable**: each layer (client, cache, services) has unit tests; services can mock client+cache.
- (+) **Minimal code duplication**: shared fpl-client types exported to web app via shared types module.
- (+) **Easy to replace cache**: swap in-memory for Redis or HTTP-caching later without changing services.
- (-) **More files than Express/Next patterns**: but necessary for clarity in a proxy layer.

## Alternatives considered

- **Monolithic endpoint handlers**: rejected — FPL mapping, caching, and business logic would be entangled.
- **Thin pass-through proxy**: rejected per ADR 0001/D1 — client would duplicate FPL mapping; more round-trips.
- **Redux/state management in backend**: overkill for a stateless proxy; in-memory cache is sufficient.

## Notes

- The squad service is the most complex: it merges bootstrap, picks, and live data into a single response,
  splitting 15 players into starters (XI) and bench (4) in the correct order. This complexity justifies
  a dedicated module with thorough test coverage.
- Cache keys are simple strings (e.g., `picks:123:1` for team 123 gameweek 1) — no namespacing required
  because the proxy is read-only and values are immutable within their TTL.
- Off-season logic (D3) lives in gameweeks-service: if no gameweek is flagged current, fall back to the
  latest finished gameweek; this drives the frontend's navigation bounds and default.
