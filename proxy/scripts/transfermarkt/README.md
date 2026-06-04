# Transfermarkt tactical position ingest (PRED-10)

One-time or occasional **offline** refresh of `src/data/player-tactical-roles.json` from
Transfermarkt squad pages. No server to host; the script runs on your machine and writes JSON
into the repo.

## Run

From repo root:

```bash
npm run lineups:ingest-tm -w proxy
```

Single club (faster debug):

```bash
npm run lineups:ingest-tm -w proxy -- --club=ARS
```

Environment:

| Variable | Default | Purpose |
| --- | --- | --- |
| `TM_INGEST_DELAY_MS` | `4000` | Pause between club requests |
| `TM_SEASON_ID` | `2025` | Transfermarkt season id (2025 = current squad page) |

## Output

| File | Purpose |
| --- | --- |
| `src/data/player-tactical-roles.json` | Runtime registry |
| `src/data/player-lanes.json` | Lane mirror derived from tactical profiles |
| `data/transfermarkt/match-report.json` | FPL ↔ TM match audit |
| `data/transfermarkt/unmapped.json` | Players needing manual override |

Manual fixes: `scripts/player-tactical-role-overrides.json` (keyed by team short name + `web_name`).

## Optional local API

The public `transfermarkt-api.fly.dev` demo is unreliable. This ingest **scrapes**
transfermarkt.com HTML directly with delays. You do not need Docker.

If you prefer the felipeall API locally: start it once, set `TRANSFERMARKT_API_BASE`, and extend
the script (not required for the default path).

## Do not enable on every dev start

`LINEUPS_SEED_ON_START=true` runs the full ingest (~80s). Keep it off in `.env`; run ingest
manually after squad changes.
