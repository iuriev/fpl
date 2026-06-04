# Lineup model — GW10–14 holdout

## Version comparison

| Version | XI precision | Correct / 1100 | Formation label match |
| --- | --- | --- | --- |
| v2 (recency score only) | 72.2% | 794 | **44 / 100** |
| **v3 (current)** | **74.1%** | **815** | 37 / 100 |

**+21 correct starters** on GW10–14; formation labels trade ~7 matches for better XI (we only switch shape when score gain ≥ 0.4).

## v3 components

1. `effectivePredictedStartScore` — FWD ×0.5, MID ×0.82 without last-match start.
2. `pickFormationByLineupScore` — if historical shape fits squad and best alternative is <0.4 better, keep it; else top-3 by lineup score, pick closest to history.

## By gameweek (v3)

See `output/summary-gw10-14.json` — typically **74–78%** precision GW10–12, weaker GW13–14.

## Still weak

- **MID** errors (rotation)
- **NEW / AVL / WOL** clubs
- **Lane** on pitch when player correct (~20% lane mismatch)

## Next iteration

- Derive display formation from picked XI (label always consistent with players shown).
- Last-fixture lane memory for `assignPlayersToSlots`.
