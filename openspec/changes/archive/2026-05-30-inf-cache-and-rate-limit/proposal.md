## Why

To improve system stability and avoid being throttled or banned by the official FPL API, we need to:
1. Increase the TTL for frequently updated data (current gameweek squad and history) to reduce the number of requests to the upstream API.
2. Implement a rate limiter on the proxy side to ensure we stay within reasonable request limits and handle bursts of traffic gracefully through a queue.

## What Changes

- Update `SQUAD_CURRENT` and `HISTORY_CURRENT` TTL from 60s to 300s in `proxy/src/cache.ts`.
- Introduce a request queue in `proxy/src/fpl-client.ts` to limit the rate of outgoing requests to `https://fantasy.premierleague.com/api/`.
- Default rate limit: 10 requests per second.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `proxy`: Now includes a rate limiter for outgoing FPL API requests and longer cache TTL for current gameweek data.

## Impact

- **Backend:** 
  - Reduced upstream load due to longer TTL (5 mins instead of 1 min).
  - Outgoing requests are now throttled to 10 req/s.
- **Frontend:** No direct changes, but may experience slight delay in seeing real-time score updates due to longer cache.
