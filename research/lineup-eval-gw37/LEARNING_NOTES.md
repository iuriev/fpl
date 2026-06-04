# Lineup model — GW10–14 holdout

## Version ladder

| Version | XI precision | Correct | Formation vs FPL | Lane mismatch (correct XI) |
| --- | --- | --- | --- | --- |
| v2 | 72.2% | 794 | 44/100 | — |
| v3 | 74.1% | 815 | 37/100 | 172 |
| **v4 (current)** | **74.1%** | **815** | 37/100 | **127 (−45)** |

## v4 changes

1. **`formationFromPickedCounts`** — UI label always matches the 11 picked (source `derived`). Pick logic still uses v3 formation search.
2. **`buildLastMatchLaneMap`** — lane assignment prefers where each player played in the **last finished match before target GW**.

## Impact

- **Pitch lanes:** 26% fewer wrong L/C/R among correctly picked starters (172 → 127).
- **XI:** unchanged vs v3 on this holdout (same players, better slots).
- **Formation label vs real match:** still ~37% — derived label reflects our XI, not the manager’s actual shape.

## Code map

| File | Role |
| --- | --- |
| `predicted-lineup-start-score.ts` | v2/v3 scoring + `effectivePredictedStartScore` |
| `predicted-lineup-formation-pick.ts` | Shape selection before XI pick |
| `last-match-lanes.ts` | Previous-match lane memory |
| `player-lane-registry.ts` | `AssignLaneOptions.lastMatchLaneById` |
| `predicted-lineup-service.ts` | Orchestration |

## Next

- Formation eval: compare **derived** XI counts to FPL actual counts (should align better with display).
- MID rotation cluster / joint XI+shape search if we need +2pp XI precision.
