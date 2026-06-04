# Design: Predicted Lineups (PRED-08)

## Route & navigation

| Item | Value |
| --- | --- |
| Route | `/predicted-lineups` |
| Nav | `TeamInfoPanel` link (Predictions group, after Predicted Points) |
| Header | `Predicted Lineups` + subtitle `GW {nextGw}` |

## Screen layout

```
┌─────────────────────────────────────────────────────────────┐
│  ‹ Squad     Predicted Lineups              GW {nextGw}      │
├─────────────────────────────────────────────────────────────┤
│  [ ARS ] [ AVL ] [ BUR ] …  ← horizontal team scroller      │
│  Formation: 4-3-3  ·  vs BOU (H)  Sat 15:00                  │
├─────────────────────────────────────────────────────────────┤
│  [ Table ]  [ Pitch ]   ← view toggle (like Squad screen)   │
├─────────────────────────────────────────────────────────────┤
│  Table: Name | xMins | xPts   (bench-risk row highlight)    │
│  — or —                                                     │
│  Pitch: 4 rows; DEF/MID/FWD cards ordered L → R on each row │
└─────────────────────────────────────────────────────────────┘
```

## Premium access

| Layer | Behaviour |
| --- | --- |
| Proxy | `GET /api/predicted-lineups` behind `requireUser` + `requirePremiumFplUser` (403 `premium_required` for free) |
| Web | `usePremiumStatus()` — premium: fetch + render; free: no API call for lineup body, full-area `PremiumLockedOverlay` + `PremiumSheet`, `requestUpsell('predictions')` on mount |

No free preview of a single team or blurred XI — consistent with premium-only predictions.

- **Team scroller:** all 20 `bootstrap-static` teams; default = user's FPL team if known, else
  first alphabetically by `short_name`.
- **Formation label:** always visible when a team is selected (`4-3-3` string from proxy).
- **Fixture chip:** next fixture for selected team in `nextGw` from `/api/fixtures/upcoming`
  (opponent, H/A, kickoff) — reuse existing fixture shape.
- **Bench risk:** table rows where `benchRisk === true` get a token background / badge (reuse
  availability styling patterns).

## Formation inference (proxy)

### Output shape

```ts
type FormationCounts = { def: number; mid: number; fwd: number };
type FormationLabel = `${number}-${number}-${number}`; // e.g. "4-3-3"

interface InferredFormation {
  counts: FormationCounts;
  label: FormationLabel;
  source: 'recent_fixtures' | 'previous_season' | 'default';
}
```

GK is always 1 and omitted from the label (PL convention: `4-3-3` means 1 GK + 4 DEF + 3 MID + 3 FWD).

### Per-fixture starter set

For a finished `fixtureId` and PL `teamId`:

1. Consider all `elements` where `element.team === teamId`.
2. Load each player's `element-summary` `history[]` entry where `fixture === fixtureId`.
3. Starters = entries with `starts === 1` (fallback: `minutes >= 60` if `starts` missing).
4. Count `element_type` 2/3/4 → `def`, `mid`, `fwd`.
5. Valid only if counts satisfy PL ranges: `def 3–5`, `mid 2–5`, `fwd 1–3`, total outfield = 10.

DGW: never aggregate at gameweek level — always one fixture at a time.

### Rolling formation for a team

1. List finished fixtures for the team in the **current season**, newest first (from `fixtures/`
   + `finished`).
2. Compute formation per fixture; take **mode** of the last **5** valid formations (tie-break:
   most recent).
3. If fewer than 1 valid fixture in current season → **fallback chain** (below).

### Fallback chain

| Step | Condition | Action |
| --- | --- | --- |
| 1 | ≥1 valid fixture this season | Mode of last 5 (or fewer) |
| 2 | No current-season fixtures | Last valid fixture of **previous season** |
| 3 | Still none | Default `4-3-3` (`def:4, mid:3, fwd:3`, `source: 'default'`) |

**Previous season data sources (in order):**

1. `fpl_gw_live_cache` + `fixtures` for the last `finished && data_checked` GW of prior season
   (preferred — no new dependency if DB was populated).
2. One-time import from [vaastav/FPL-data](https://github.com/vaastav/FPL-data) merged by
   `team_code` + player name/code mapping (only if DB has no prior season; document in proxy
   README / ADR if we ship an import script).

Log `source` in API response for debugging; do not show raw source to users in v1 (optional
dev tooltip later).

## Predicted XI selection (proxy)

Given `InferredFormation` and all squad players for `teamId`:

### Start probability (0–1)

Per player, compute `startScore`:

```
minutesScore = avg(minutes last 5 fixture-rows) / 90
startsScore  = count(starts===1 last 5 fixture-rows) / min(5, rows)
chanceScore  = (chance_of_playing_next_round ?? 100) / 100
statusMult   = 0 if status in (i,s,u) else 0.5 if d else 1

startScore = (0.4 * startsScore + 0.3 * minutesScore + 0.3 * chanceScore) * statusMult
```

### Pick 11

1. GK: highest `startScore` among `element_type === 1`.
2. DEF/MID/FWD: top N by `startScore` in each line per formation counts.
3. If tie, break by `ep_next` desc, then `minutes` season total.

### Derived fields

| Field | Rule |
| --- | --- |
| `xPts` | `parseFloat(ep_next)` or `0` |
| `xMins` | `round(startScore * 90)` clamped 0–90 |
| `benchRisk` | `startScore < 0.6` OR `status === 'd'` OR `chance_of_playing_next_round < 75` |

Return exactly 11 players; if squad cannot fill a line (e.g. injuries), fill with next-best
same `element_type` and set `benchRisk` on thin positions.

## Flank placement (proxy + pitch)

FPL does not publish L/C/R flank. The product uses an **in-repo registry** plus slot templates
so the pitch matches football geometry (right midfielder on the right touchline).

### Player lane registry

File: `proxy/src/data/player-lanes.json` (season-agnostic keys on stable FPL `code`).

```ts
type PlayerLane = 'L' | 'C' | 'R';

// code (number) → lane
{ "118748": "R", "..." : "L" }
```

- Maintained in git; updated when squads change (new signing → add row, loan out → remove).
- Optional maintenance script: list bootstrap `elements` missing from registry for manual fill.
- **No runtime call** to paid tactical APIs.

### Slot templates (per formation line)

For each `(line, count)` the proxy defines an ordered list of slot lanes. Examples:

| Line | Count | Slot lanes (left → right) |
| --- | --- | --- |
| DEF | 3 | L, C, R |
| DEF | 4 | L, C, C, R |
| DEF | 5 | L, C, C, C, R |
| MID | 2 | C, C |
| MID | 3 | L, C, R |
| MID | 4 | L, C, C, R |
| MID | 5 | L, C, C, C, R |
| FWD | 1 | C |
| FWD | 2 | L, R |
| FWD | 3 | L, C, R |

GK: single centred card (no lane).

### Assigning players to slots

After picking the top N players per line by `startScore`:

1. Look up each player's `lane` from registry; default **`C`** if unknown.
2. For each line, match players to slot lanes with a greedy assignment: prefer exact lane match,
   then adjacent (`L`↔`C`, `R`↔`C`), minimize mismatch count.
3. Emit `players[]` sorted for pitch render: GK first, then each line in slot order (left → right).

Response field per outfield player:

```ts
lane: 'L' | 'C' | 'R';
pitchOrder: number; // 0 = leftmost in row
```

### Pitch UI

- Each row: `display: flex; justify-content: space-between` (or equal gaps with `flex: 1` on
  cards) so card **index 0 is the left flank** and the last index is the right flank.
- Do not sort alphabetically within a row.
- Table view order: GK, then DEF/MID/FWD rows using the same `pitchOrder` (optional secondary sort
  by `xPts` within the same slot only if tied on lane).

### Tests

- 4-3-3 with registry lanes: RB player has `lane: R` → rightmost DEF card.
- Unknown lane: player lands in `C` slot before wing slots fill.
- Registry does not call external services (unit test loads JSON from disk).

## API

### `GET /api/predicted-lineups`

Query: optional `gw` (defaults to `is_next` from bootstrap).

Response:

```ts
interface PredictedLineupsResponse {
  gameweek: number;
  teams: PredictedTeamLineup[];
}

interface PredictedTeamLineup {
  teamId: number;
  teamCode: number;
  shortName: string;
  formation: InferredFormation;
  nextFixture: { opponentShortName: string; isHome: boolean; kickoffTime: string } | null;
  players: PredictedLineupPlayer[]; // length 11, pitch order within each line
}

interface PredictedLineupPlayer {
  id: number;
  webName: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  lane: 'L' | 'C' | 'R';
  pitchOrder: number;
  xMins: number;
  xPts: number;
  benchRisk: boolean;
  chanceOfPlaying: number | null;
  status: string;
}
```

Auth: `requireUser`, `requirePremiumFplUser` — same pattern as `/api/price-predictions/squad`.

### Caching

| Layer | TTL | Notes |
| --- | --- | --- |
| Full response | 10 min | Same order of magnitude as `player-pool` |
| `element-summary` per player | 6 h | Heavy; batch with concurrency limit (e.g. 8) |
| Formation per team | Invalidate when new GW `finished` | Warm on first request after deadline |

**Cold-start mitigation:** prefetch `element-summary` for active squad players only (players
with `minutes > 0` this season) — cap requests ~220 per team worst case; parallelize with
existing FPL rate-limit policy.

## Web components

| Component | Notes |
| --- | --- |
| `PredictedLineupsScreen` | Team scroller, header, view toggle, data hook |
| `PredictedLineupTable` | Sortable list: name, xMins, xPts, bench-risk style |
| `PredictedLineupPitch` | Reuse `Pitch` + `PlayerCard`; rows ordered by `pitchOrder` / `lane`, not alpha |
| `TeamFormationLabel` | Displays `formation.label` + fixture chip |

Reuse: `ScreenHeader`, `Pitch`, `PlayerCard`, `PremiumLockedOverlay`, `PremiumSheet`,
`usePremiumStatus`, `useRequestPremiumUpsell`, `PlayerProfileSheet` on row tap.

## Copy keys (`copy.ts`)

`predictedLineupsNavLink`, `predictedLineupsTitle`, `predictedLineupsGwLabel`,
`predictedLineupsFormationLabel`, `predictedLineupsTableView`, `predictedLineupsPitchView`,
`predictedLineupsColumnName`, `predictedLineupsColumnXMins`, `predictedLineupsColumnXPts`,
`predictedLineupsBenchRisk`, `predictedLineupsEmptyTeam`, `predictedLineupsLoadError`,
`predictedLineupsUnlockLabel`, `predictedLineupsPremiumTitle`, `predictedLineupsPremiumDescription`.

## Testing

**Proxy**

- Formation from single fixture with known starters (mock element-summary).
- DGW: two fixtures in same GW → mode uses per-fixture counts, not 15 starters.
- Fallback to `4-3-3` when no history.
- Previous-season fallback when current season empty (mock DB cache).
- XI picker respects formation slot counts.
- Lane assignment: RB on R slot in 4-def back line.
- Registry lookup by `code`.

**Web**

- Renders 20 teams; switching team updates formation + 11 players.
- Formation label matches API.
- Table bench-risk styling; pitch shows correct row counts (e.g. 4 DEF cards in DEF row).
- Pitch: player with `lane: R` renders rightmost in that row (test with mocked order).
- Free user: overlay, no lineup fetch; premium: full content.
- Loading / error states.

## Risks

| Risk | Mitigation |
| --- | --- |
| Many `element-summary` calls | Cache aggressively; only active squad players |
| Wrong formation after tactical shift | Mode over 5 games; show label not “confirmed” |
| New season GW1 | Previous-season fallback + `4-3-3` default |
| `4-2-3-1` shown as `4-5-1` | One MID row; L/C/R ordering still applies |
| Missing registry entry | Default `C`; script flags new players for manual lane |
| Wrong flank for new signing | Update `player-lanes.json`; no external API |

## Docs

- Update `docs/fpl-api.md`: no formation endpoint; document inference inputs.
- Update `docs/backlog.md` PRED-08 detail to reference this change when implementing.
