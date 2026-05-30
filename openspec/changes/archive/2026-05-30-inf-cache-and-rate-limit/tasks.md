## 1. Proxy: Increase Cache TTL (INF-01)

- [x] 1.1 Update `SQUAD_CURRENT` to 300 in `proxy/src/cache.ts`
- [x] 1.2 Update `HISTORY_CURRENT` to 300 in `proxy/src/cache.ts`
- [x] 1.3 Update `proxy/src/cache.test.ts` to reflect the new TTL values
- [x] 1.4 Run tests to verify TTL changes: `npm run test -w proxy`

## 2. Proxy: Implement Rate Limiter (INF-02)

- [x] 2.1 Implement a `RateLimiter` class or utility in `proxy/src/rate-limiter.ts` (or inside `fpl-client.ts`)
- [x] 2.2 Wrap `fetchFPL` in `proxy/src/fpl-client.ts` with the rate limiter
- [x] 2.3 Set rate limit to 10 requests per second
- [x] 2.4 Add unit tests for the rate limiter in `proxy/src/fpl-client.test.ts` or a new test file

## 3. Verification

- [x] 3.1 Verify `npm run lint` passes for `proxy`
- [x] 3.2 Verify `npm run test` passes for `proxy`
- [x] 3.3 Verify rate limiting works (manual or automated test simulating multiple rapid requests)
