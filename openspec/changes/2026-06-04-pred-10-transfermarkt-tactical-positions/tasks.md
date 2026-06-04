# Tasks: PRED-10 Transfermarkt tactical positions

## 1. Planning artifacts

- [x] 1.1 OpenSpec change `2026-06-04-pred-10-transfermarkt-tactical-positions`
- [ ] 1.2 ADR 0016 — offline Transfermarkt ingest; supersede ADR 0015 ingest section
- [ ] 1.3 Update `docs/predicted-lineups-positions.md` and backlog PRED-10

## 2. Transfermarkt club map

- [ ] 2.1 Add `proxy/data/transfermarkt/pl-club-ids.json` (FPL `team` id → TM `club_id`)
- [ ] 2.2 Document how to refresh club IDs (search endpoint once per season)

## 3. Ingest tooling

- [ ] 3.1 README `proxy/scripts/transfermarkt/README.md` — Docker one-shot, no hosting
- [ ] 3.2 `transfermarkt-position-map.ts` — TM string → TacticalRole + lane
- [ ] 3.3 `match-fpl-to-transfermarkt.ts` — name normalization + scoring
- [ ] 3.4 `ingest-transfermarkt-positions.mjs` — slow CLI with delays, writes JSON + reports
- [ ] 3.5 `player-tactical-match-overrides.csv` — manual fixes template
- [ ] 3.6 `npm run lineups:ingest-tm -w proxy`

## 4. Replace heuristic registry

- [ ] 4.1 Run full ingest; commit updated `player-tactical-roles.json`
- [ ] 4.2 Remove or gut heuristic seed in `seed-player-tactical-roles.mjs`
- [ ] 4.3 Default `LINEUPS_SEED_ON_START` off in `.env.example`
- [ ] 4.4 Deprecate duplicate `player-lanes.json` seed if fully covered by tactical JSON

## 5. Spec & tests

- [ ] 5.1 Spec delta: flank registry sourced from Transfermarkt offline ingest
- [ ] 5.2 Unit tests: position mapper, name matcher
- [ ] 5.3 Golden tests: Arsenal (Gabriel, Saliba, Saka)
- [ ] 5.4 `npm run test -w proxy` green

## 6. Optional follow-up

- [ ] 6.1 Expose `tacticalRole` on predicted lineup API for UI debug
- [ ] 6.2 Pitch UI uses `lane` for layout (separate change)
