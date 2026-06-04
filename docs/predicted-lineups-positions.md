# Predicted lineups — tactical positions (agent reference)

Living spec for how the proxy assigns **primary** and **secondary** tactical roles when building
predicted elevens. Implementation will evolve; this document is the source of truth for intent.

## Tactical roles (v2)

| Role | Line | Pitch lane |
| --- | --- | --- |
| `gk` | GK | C |
| `lb` | DEF | L |
| `cb` | DEF | C |
| `rb` | DEF | R |
| `dm` | MID | C |
| `cm` | MID | C |
| `am` | MID | C |
| `lm` | MID | L |
| `rm` | MID | R |
| `lw` | FWD | L |
| `rw` | FWD | R |
| `st` | FWD | C |

FPL only exposes `element_type` (GK/DEF/MID/FWD). Roles come from `player-tactical-roles.json`
built by **offline Transfermarkt squad ingest** (`npm run lineups:ingest-tm -w proxy`) plus
manual overrides.

## Formation row quotas (hard rules when counts match)

### Four defenders (`DEF-4`)

- Minimum **2× `cb`**
- Minimum **1× `lb`**
- Minimum **1× `rb`**
- Pitch slots: `lb` (L), `cb` (C), `cb` (C), `rb` (R)

### Four midfielders (`MID-4`)

- Minimum **2×** among `dm` | `cm` | `am` (any mix)
- Minimum **1× `lm`**
- Minimum **1× `rm`**
- Pitch slots: `lm` (L), pivot (C), pivot (C), `rm` (R)

### Three forwards (`FWD-3`)

- Minimum **1× `st`**
- Minimum **1× `lw`**
- Minimum **1× `rw`**
- Pitch slots: `lw` (L), `st` (C), `rw` (R)

Other row counts (e.g. `DEF-3`, `MID-5`, `FWD-1`) use best-effort slot templates and
score-only fill until quotas are defined here.

## Secondary positions

Each player profile:

```json
{ "role": "cb", "lane": "C", "secondary": ["lb"] }
```

`secondary` is optional (default `[]`).

### Fill priority for a **slot role** (e.g. left back)

When assigning a player to a slot that requires `lb`:

1. **Primary** — `role === lb`
2. **Secondary** — `lb` listed in `secondary`
3. **Group fallback** — any DEF (`lb` | `cb` | `rb`) if steps 1–2 exhausted (injury crisis:
   all natural LBs unavailable)
4. Never use MID/FWD for a DEF slot

Same pattern per line group:

| Line group | Roles in group |
| --- | --- |
| DEF | `lb`, `cb`, `rb` |
| MID | `dm`, `cm`, `am`, `lm`, `rm` |
| FWD | `lw`, `rw`, `st` |

### Interaction with availability

Players excluded from the predicted XI (`lineup-availability.ts`: injured past cutoff,
suspended, 0% chance) are not candidates for **selection** or **slot fill**.

Among eligible players, quotas are satisfied using fill priority above.

## Selection algorithm (outline)

1. Infer formation → DEF/MID/FWD counts.
2. Filter candidates by FPL `element_type` and availability.
3. If quotas exist for that row count, `pickLineWithRoleQuotas`:
   - For each quota, take highest `startScore` players who can fill that role (primary →
     secondary → group).
   - Fill remaining slots up to row count by score.
4. `assignPlayersToSlots`: map picked players to lane/role slots using the same fill priority.

## Transfermarkt ingest

See `proxy/scripts/transfermarkt/README.md`. Summary:

- Scrape each PL club squad page (~4s delay between clubs).
- Map TM position label → `TacticalRole` + `lane`.
- Write `player-tactical-roles.json` and `player-lanes.json`.
- Reports: `proxy/data/transfermarkt/match-report.json`, `unmapped.json`.

```bash
npm run lineups:ingest-tm -w proxy
```

## Manual overrides

`proxy/scripts/player-tactical-role-overrides.json` — keyed by team short code and
`web_name`. Wins over Transfermarkt ingest.

## Deprecated

`seed-player-tactical-roles.mjs` (FPL-stat heuristics) — do not use; kept for reference only.

## Future work

- [ ] Quotas for `DEF-3`, `DEF-5`, `MID-3`, `MID-5`, `FWD-2`, `FWD-1`
- [ ] External position ingest (API-Football / CSV) replacing heuristics
- [ ] Expose `tacticalRole` + `filledAsRole` on API for UI
- [ ] Minutes-weighted “recent role” from `element-summary` when starter slot known

## Related code

| Module | Responsibility |
| --- | --- |
| `player-tactical-role.ts` | Registry, `playerFillsRole`, lane |
| `lineup-slot-requirements.ts` | Quotas + slot role templates |
| `lineup-selection.ts` | `pickLineWithRoleQuotas` |
| `player-lane-registry.ts` | Pitch assignment |
| `predicted-lineup-service.ts` | Orchestration |

ADR: [0015-player-tactical-positions.md](decisions/0015-player-tactical-positions.md)
