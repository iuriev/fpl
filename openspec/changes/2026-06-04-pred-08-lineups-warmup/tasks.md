# Tasks: PRED-08 lineups warmup

## 1. OpenSpec & schema

- [x] 1.1 Migration `fpl_element_summary_cache` + Drizzle schema
- [x] 1.2 Update `docs/db-schema.md`

## 2. FPL infrastructure

- [x] 2.1 `fpl-request-queue.ts` (interactive vs background priorities)
- [x] 2.2 `fpl-element-summary-cache.ts` (memory + DB + queue)
- [x] 2.3 `lineups-player-sets.ts` (hot / cold / active squad)

## 3. Warmup job

- [x] 3.1 `lineups-warmup.ts` phased job + status
- [x] 3.2 Startup hook in `index.ts` + env vars
- [x] 3.3 Extend `/health` with warmup status
- [x] 3.4 `npm run lineups:warmup -w proxy` CLI for manual run

## 4. Integration

- [x] 4.1 `predicted-lineup-service` uses DB summaries + queue
- [x] 4.2 `fpl-client` routes all fetches through queue

## 5. Verification

- [x] 5.1 Unit tests (queue priority, player tiers, summary cache)
- [x] 5.2 `npm run test -w proxy` and `npm run lint -w proxy`
