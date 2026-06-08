# Lineup Prediction

Predicted starting eleven and formation for each Premier League team for a target gameweek.
This model is independent of the FPL Points model — it uses FPL availability signals and
playing-time history, not the Poisson scoring pipeline.

---

## Output (per team)

| Field | Type | Meaning |
|-------|------|---------|
| `formation.label` | `string` | `"DEF–MID–FWD"` e.g. `"4-3-3"` |
| `players` | `PredictedPlayer[11]` | Predicted starting eleven |
| `nextFixture` | `TeamFixtureSummary \| null` | Opponent and home/away for the target GW |

Each `PredictedPlayer`:

| Field | Type | Meaning |
|-------|------|---------|
| `elementId` | `number` | FPL element id |
| `xMins` | `number` | Expected minutes (start probability heuristic) |
| `xPts` | `number` | From FPL `ep_next` (not the Poisson model) |
| `benchRisk` | `boolean` | Elevated rotation or doubtful status |
| `tacticalRole` | `string \| null` | Role from tactical registry |
| `lane` | `'L' \| 'C' \| 'R'` | Pitch lane for rendering |

---

## Formation inference

### Source data

Formation is inferred from per-fixture starter data: rows in `element-summary` history
where `starts === 1`. This is the only authoritative source — gameweek-aggregate stats
are not used.

### Per-fixture formation

For a completed fixture, identify the eleven starters by FPL position (`element_type`):

```
DEF count = starters with element_type = 2
MID count = starters with element_type = 3
FWD count = starters with element_type = 4
// GK is always 1, excluded from the label
```

A valid formation requires exactly `DEF + MID + FWD = 10` starters.

### Rolling mode

Take the **mode** of valid formations from the most recent **5 fixtures** of the current
season. Ties break toward the most recent fixture.

### Fallback chain

1. Mode of last 5 current-season fixtures (above).
2. Previous season's last finished fixture.
3. Default: `4-3-3`.

### Squad-fit adjustment

If the inferred formation requires more players in an FPL position than the squad can
supply (after availability exclusions), select the closest valid alternative formation
that the squad can fill.

Example: inferred `4-3-3` but only one available FWD → fall back to `4-5-1`.
The response `formation.label` reflects the formation actually used for selection.
Exactly eleven players are returned regardless.

---

## Player selection

### Candidate pool

- Squad players with **≥ 1 minute played in the current season**, except **GW1**
  (whole squad eligible at season start, before any minutes exist).
- Players excluded by availability (injured past cutoff, suspended, 0% chance to play)
  are not candidates.

### startScore

Primary selection signal: a proxy for how likely the player is to start.

- **Preferred source:** recent `starts` count and minutes from cached `element-summary`
  history (last 5 fixtures).
- **Cold-tier fallback:** if `element-summary` is not cached, estimate from bootstrap
  `minutes` (season total) so players are not stuck at zero.

### Selection per line

For each of GK / DEF / MID / FWD, select the required number of players from the
candidate pool for that position:

1. **If role quotas are defined for this row count** (see Tactical Roles section below),
   run `pickLineWithRoleQuotas`:
   - For each quota slot, take the highest **role-merit** candidate who fills that role
     at primary or secondary level (group fallback does not satisfy quotas).
   - Fill remaining slots by `startScore`.
2. **Otherwise** (no quotas defined for this row count): select top N by `startScore`.

**Role merit** = `startScore × multiplier`:

| Match type | Multiplier |
|-----------|-----------|
| Primary role match | 1.0 |
| Secondary role match | 0.85 |
| Line-group fallback | 0.35 |

---

## Tactical roles and pitch ordering

### Role registry

Roles come from `proxy/data/player-tactical-roles.json`, built by **offline Transfermarkt
squad ingest** (`npm run lineups:ingest-tm -w proxy`). Manual overrides are in
`proxy/scripts/player-tactical-role-overrides.json`.

The proxy **never** calls Transfermarkt or any external position provider at runtime.

### Roles, lines, and default lanes

| Role | Line | Default lane |
|------|------|-------------|
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

### Role quotas (hard rules when row count matches)

**Four defenders (DEF-4):**
- Min 2× `cb`, min 1× `lb`, min 1× `rb`
- Slots: lb (L), cb (C), cb (C), rb (R)

**Four midfielders (MID-4):**
- Min 2× any of `dm` / `cm` / `am`, min 1× `lm`, min 1× `rm`
- Slots: lm (L), pivot (C), pivot (C), rm (R)

**Three forwards (FWD-3):**
- Min 1× `st`, min 1× `lw`, min 1× `rw`
- Slots: lw (L), st (C), rw (R)

Row counts without defined quotas (`DEF-3`, `DEF-5`, `MID-3`, `MID-5`, `FWD-1`, `FWD-2`)
use best-effort slot templates and score-only fill.

### Slot assignment (pitch ordering)

Players are assigned to pitch slots left-to-right by merit after selection is complete.

1. Process players highest `startScore` first.
2. Each player claims the open slot with the lowest fit penalty:
   - Primary role → secondary role → line-group fallback
   - Prefer profile lane (L/R) when the player has a wing role
   - Central-only mids (`dm`, `cm`, `am`) cannot take `lm`/`rm` slots
   - Strikers (`st`) cannot take `lw`/`rw` slots unless no legal slot remains
3. If a player has no registry entry, default lane is `C`.

---

## Secondary positions

Each registry entry may carry optional `secondary` roles:

```json
{ "role": "cb", "lane": "C", "secondary": ["lb"] }
```

Fill priority for a slot requiring role `X`:
1. Primary role = `X`
2. `X` in `secondary`
3. Any role in the same line group (emergency — e.g. all natural LBs unavailable)

---

## Relationship to FPL Points Prediction

The lineup model does **not** use `modelXPts` from `fpl-points-prediction.md`.
The `xPts` field on each predicted player comes from FPL `ep_next` only.

The lineup model provides tactical roles to the scoring pipeline: `player-tactical-roles.json`
is also read by `xa-prediction.md` to look up the tactical role prior for `blendedXaPer90`.

---

## Offline ingest

```bash
npm run lineups:ingest-tm -w proxy
```

Scrapes each PL club squad page (~4 s delay between clubs), maps Transfermarkt position
labels to `TacticalRole` + lane, writes `player-tactical-roles.json` and `player-lanes.json`.

Reports: `proxy/data/transfermarkt/match-report.json`, `unmapped.json`.

Refresh is needed at season start and after major transfers.
