# Design: Transfermarkt tactical positions ingest

## Principle

```
Transfermarkt (offline, slow)
    → match FPL element code
    → map position string → TacticalRole + lane
    → player-tactical-roles.json
    → existing lineup-selection + assignPlayersToSlots (unchanged)
    → GET /api/predicted-lineups (unchanged contract)
```

## Free data source

| Option | Hosting | Verdict |
| --- | --- | --- |
| `transfermarkt-api.fly.dev` | Third party | **Not used** — returns 502; demo only |
| **felipeall/transfermarkt-api locally** | None (Docker on laptop during ingest) | **Primary** — free, full squad endpoints |
| Direct HTML scrape of transfermarkt.com | None | Fallback if Docker unavailable |

**Clarification for “no hosting”:** running `docker run -p 8000:8000 transfermarkt-api` for 30–60
minutes while a Node script completes, then stopping the container, is **not** operating a hosted
service. It is the same class of work as `npm run migrate` or `npm run lineups:seed-positions`.

## Transfermarkt API (local)

After `docker run -p 8000:8000 transfermarkt-api` (or `python app/main.py`):

- `GET /clubs/{club_id}/players?season_id=2024` — squad with `position` per player (confirm path
  in Swagger at `http://localhost:8000/docs`).
- Club IDs: static map `proxy/data/transfermarkt/pl-club-ids.json` (e.g. Arsenal `11`).

Rate limiting when using upstream fly.dev: N/A for local (`RATE_LIMITING_ENABLE=false` by default).

Ingest script sleeps **3–5 s** between club requests; **1–2 s** between player profile calls if
needed.

## FPL ↔ Transfermarkt matching

1. Load FPL `bootstrap-static` — active players (`minutes > 0 || total_points > 0`).
2. For each PL team, fetch TM squad.
3. Match key (in order):
   - Normalized `web_name` + `second_name` vs TM `name`
   - Same shirt `number` when unique on squad
   - Fuzzy token match (reuse ideas from `research/pred-09/PLAYER_JOIN.md`)
4. Write `match_method` + `confidence` to `match-report.json`.
5. Unmatched → `unmapped.json` + row in `player-tactical-match-overrides.csv`.

Stable join key in app: **FPL `code`** (not `id`).

## TM position → TacticalRole

| TM position (normalized) | role | lane |
| --- | --- | --- |
| Goalkeeper | gk | C |
| Centre-Back | cb | C |
| Left-Back | lb | L |
| Right-Back | rb | R |
| Defensive Midfield | dm | C |
| Central Midfield | cm | C |
| Attacking Midfield | am | C |
| Left Midfield | lm | L |
| Right Midfield | rm | R |
| Left Winger | lw | L |
| Right Winger | rw | R |
| Centre-Forward, Second Striker | st | C |

TM “also plays as” → `secondary[]` (same mapper).

Unknown TM strings → log + default by FPL `element_type` (`DEF→cb`, `MID→cm`, `FWD→st`) only as
last resort, flagged in report.

## Scripts (proxy workspace)

| Command | Purpose |
| --- | --- |
| `lineups:ingest-tm` | Full pipeline: TM squads → JSON registry |
| `lineups:ingest-tm --club ARS` | Single club debug |
| `lineups:report-tm` | Print match stats / unmapped |

Env: `TRANSFERMARKT_API_BASE=http://localhost:8000` (default).

## Retire heuristics

- Stop writing roles from `wideScore` / `assignFlankLanes` in `seed-player-tactical-roles.mjs`.
- Merge `player-lane-overrides.json` into tactical overrides or drop after TM ingest.
- `LINEUPS_SEED_ON_START` runs TM ingest only if explicitly enabled (discouraged in dev).

## Validation

Golden file `proxy/src/data/player-tactical-roles.golden-ars.json` — assert Gabriel/Saliba `cb`,
Saka `rm` or `rw` + `R` after ingest.

## Docs

- Update `docs/predicted-lineups-positions.md` — source = Transfermarkt ingest.
- New ADR 0016 supersedes ingest section of ADR 0015.
- Backlog: PRED-10 entry.
