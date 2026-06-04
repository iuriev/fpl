# Proposal: Transfermarkt tactical positions (PRED-10)

## Problem

Predicted lineups use `player-tactical-roles.json` seeded from FPL creativity/threat/defcon
heuristics. That mislabels real positions (e.g. Gabriel as `lb`, Saka as `lm` on the left),
so pitch order and slot assignment do not match football reality.

## Solution

**One-time (or rare) offline ingest** of granular positions from Transfermarkt for all
Premier League squads, then replace heuristic seed output with that registry.

- **No production hosting** — the user does not run a 24/7 scraper service.
- **No runtime external calls** — `GET /api/predicted-lineups` keeps reading in-repo JSON (or DB
  export) only.
- Ingest may run slowly (rate limits, retries) on a developer machine; duration is not critical.

## Data policy change

Supersedes the PRED-08 rule that tactical/flank data must come only from FPL stats. **Paid**
third-party lineup feeds remain excluded. **Transfermarkt** is used only for an offline position
registry (build/refresh), same category as today’s seed scripts.

## User value

- Predicted lineups pitch view shows players on the correct flank (Saka right, Gabriel/Saliba
  central in defence).
- Premium predicted lineups feature becomes trustworthy for positional UX.

## Scope

### In

- Transfermarkt club IDs for 20 PL teams (season 2025/26).
- Ingest CLI: match FPL `code` → TM player, map TM position → `TacticalRole` + `lane`.
- Artifacts: `player-tactical-roles.json`, `data/transfermarkt/unmapped.json`,
  `data/transfermarkt/match-report.json`, manual override CSV for exceptions.
- Remove heuristic flank logic from `seed-player-tactical-roles.mjs` (or retire script).
- Disable `LINEUPS_SEED_ON_START` heuristic refresh by default.
- Docs + ADR supersede; spec delta for predicted-lineups flank source.
- Golden tests (Arsenal, at least 3 clubs).

### Out

- Live Transfermarkt calls on user requests.
- Self-hosted/scraper service in production infrastructure.
- Paid API-Football (unless ingest fails and we revisit).
- Formation inference changes (still FPL `element-summary`).

## Risks

- Public demo API (`transfermarkt-api.fly.dev`) is unreliable (502). Mitigation: run
  [felipeall/transfermarkt-api](https://github.com/felipeall/transfermarkt-api) via **local
  Docker only while the ingest script runs**, then stop the container.
- Name matching errors → manual override file + unmapped report.
