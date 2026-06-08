# Tasks: PRED-10 Transfermarkt tactical positions

## 1. Planning artifacts

- [x] 1.1 OpenSpec change `2026-06-04-pred-10-transfermarkt-tactical-positions`
- [x] 1.2 ADR 0016 — offline Transfermarkt ingest; supersede ADR 0015 ingest section
- [x] 1.3 Update `docs/predicted-lineups-positions.md` and backlog PRED-10

## 2. Transfermarkt club map

- [x] 2.1 Add `proxy/data/transfermarkt/pl-club-ids.json` (FPL `team` id → TM `club_id`)
- [x] 2.2 Document how to refresh club IDs (search endpoint once per season)

## 3. Ingest tooling

- [x] 3.1 README `proxy/scripts/transfermarkt/README.md` — Docker one-shot, no hosting
- [x] 3.2 `transfermarkt-position-map.ts` — TM string → TacticalRole + lane
- [x] 3.3 `match-fpl-to-transfermarkt.ts` — name normalization + scoring
- [x] 3.4 `ingest-transfermarkt-positions.ts` — slow CLI with delays, writes JSON + reports
- [x] 3.5 Manual overrides via `player-tactical-role-overrides.json`
- [x] 3.6 `npm run lineups:ingest-tm -w proxy`

## 4. Replace heuristic registry

- [x] 4.1 Run full ingest; commit updated `player-tactical-roles.json`
- [x] 4.2 Heuristic seed superseded by ingest (`lineups:seed-positions` → ingest-tm)
- [x] 4.3 Default `LINEUPS_SEED_ON_START` off in `.env.example`
- [x] 4.4 `player-lanes.json` written from ingest tactical lanes

## 5. Spec & tests

- [x] 5.1 Spec delta: flank registry sourced from Transfermarkt offline ingest
- [x] 5.2 Unit tests: position mapper, name matcher, HTML parser
- [x] 5.3 Golden tests: Arsenal (Gabriel, Saliba, Saka)
- [x] 5.4 `npm run test -w proxy` green

## 6. Optional follow-up

- [ ] 6.1 Expose `tacticalRole` on predicted lineup API for UI debug
- [ ] 6.2 Pitch UI uses `lane` for layout (separate change)
