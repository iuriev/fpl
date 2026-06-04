# ADR 0016: Transfermarkt offline ingest for tactical positions

## Status

Accepted

## Context

Heuristic seeding from FPL creativity/threat mislabels players (e.g. centre-backs as fullbacks,
Saka as left midfielder). Predicted lineup pitch order depends on `player-tactical-roles.json`.

ADR 0015 and PRED-08 excluded paid tactical APIs at **runtime** but allowed in-repo registries.

## Decision

1. Build `player-tactical-roles.json` via **offline** Transfermarkt squad scrape (`npm run
   lineups:ingest-tm -w proxy`), with polite delays between clubs.
2. Match FPL `code` to TM players by name + shirt number; manual overrides in
   `player-tactical-role-overrides.json` for exceptions.
3. Map TM position strings to tactical roles (`cb`, `lm`, `rw`, …) per
   `docs/predicted-lineups-positions.md`.
4. Runtime `GET /api/predicted-lineups` continues to read JSON only — no Transfermarkt calls.
5. Retire FPL-stat heuristic seed as the default source.

## Consequences

- Refresh ingest after major transfer windows or promoted clubs (update `pl-club-ids.json` if needed).
- Scraping may break if Transfermarkt HTML changes; parser tests use fixtures.
- `data/transfermarkt/unmapped.json` guides manual cleanup.

## Supersedes

ADR 0015 ingest section (heuristic `seed-player-tactical-roles.mjs` as primary source).
