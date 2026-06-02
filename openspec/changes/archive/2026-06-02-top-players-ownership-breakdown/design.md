# Design: Top Players — Ownership % and GW Stat Breakdown

## Visual design

Each `PlayerRankRow` gains two new lines below the existing name/position/club meta:

```
  1  [jersey]  Dorgu                               18
               DEF  MUN
               [1 goal] [1 assist] [Clean sheet] [3 bonus]
               23.1% ownership
```

- **Stat chips** appear only on the "This GW" tab (when `statBreakdown` is present).
- **Ownership line** appears on all three tabs.
- Row height grows naturally — no fixed heights on rows.
- Only non-zero stats are shown. `minutes`, `goals_conceded`, and `bps` are never shown.

### Chip colour scheme

| Category | Stats | Chip style |
|----------|-------|-----------|
| Goal | `goals_scored` | green tint |
| Assist | `assists` | blue tint |
| Defensive | `clean_sheets`, `saves` | teal tint |
| Bonus | `bonus` | yellow tint |
| Positive | `penalties_saved` | green tint |
| Negative | `own_goals`, `penalties_missed`, `yellow_cards`, `red_cards` | red tint |

### Chip labels

Pluralise count-based stats when value > 1:

| `identifier` | Value | Label |
|---|---|---|
| `goals_scored` | 1 | `1 goal` |
| `goals_scored` | 2 | `2 goals` |
| `assists` | 1 | `1 assist` |
| `assists` | 2 | `2 assists` |
| `clean_sheets` | 1 | `Clean sheet` |
| `bonus` | n | `n bonus` |
| `saves` | n | `n saves` |
| `penalties_saved` | 1 | `Penalty saved` |
| `own_goals` | 1 | `Own goal` |
| `own_goals` | n>1 | `n own goals` |
| `penalties_missed` | 1 | `Penalty missed` |
| `yellow_cards` | 1 | `Yellow card` |
| `red_cards` | 1 | `Red card` |

---

## Data model

### New `StatEntry` type (shared between proxy and web)

```typescript
interface StatEntry {
  identifier: string;
  value: number;
  points: number;
}
```

The breakdown is the *sum across all fixtures in the GW* (a player can play twice in a
double gameweek). Aggregate by `identifier`, summing `value` and `points` across fixtures.

### Proxy type changes

**`proxy/src/fpl-client.ts` — extend `FPLLive`:**

```typescript
export interface FPLLive {
  elements: Array<{
    id: number;
    stats: { /* existing fields */ };
    explain: Array<{
      fixture: number;
      stats: Array<{
        identifier: string;
        points: number;
        value: number;
      }>;
    }>;
  }>;
}
```

**`proxy/src/types.ts` — extend `TopPlayer`:**

```typescript
export interface StatEntry {
  identifier: string;
  value: number;
  points: number;
}

export interface TopPlayer {
  id: number;
  webName: string;
  position: PlayerPosition;
  teamCode: number;
  teamShortName: string;
  points: number;
  selectedByPercent: string;
  statBreakdown?: StatEntry[];  // GW endpoint only
}
```

### Web type changes

**`web/src/types/index.ts` — extend `TopPlayersPlayer`:**

```typescript
export interface StatEntry {
  identifier: string;
  value: number;
  points: number;
}

export interface TopPlayersPlayer {
  id: number;
  webName: string;
  position: PlayerPosition;
  teamCode: number;
  teamShortName: string;
  points: number;
  selectedByPercent: string;
  statBreakdown?: StatEntry[];
}
```

---

## Proxy service changes

### `top-players-service.getTopPlayersGameweek`

The service already fetches both `bootstrap` (for element metadata) and `liveData` (for points).

Changes:
1. Map `element.selected_by_percent → selectedByPercent` from bootstrap for each player.
2. Build `statBreakdown` by aggregating `live.explain[]` across all fixtures:

```typescript
function buildStatBreakdown(explain: FPLLive['elements'][0]['explain']): StatEntry[] {
  const map = new Map<string, StatEntry>();
  for (const fixture of explain) {
    for (const stat of fixture.stats) {
      if (stat.value === 0) continue;
      const existing = map.get(stat.identifier);
      if (existing) {
        existing.value += stat.value;
        existing.points += stat.points;
      } else {
        map.set(stat.identifier, { ...stat });
      }
    }
  }
  return Array.from(map.values());
}
```

Excluded identifiers (never included even if non-zero): `minutes`, `goals_conceded`, `bps`.

### `top-players-service.getTopPlayersSeason`

Add `selectedByPercent: element.selected_by_percent` to the mapped object. No `statBreakdown`
(season totals have no per-fixture source).

### Team players endpoint

The "By Team" tab uses `useTeamPlayers` which calls a separate proxy endpoint that also reads
from bootstrap `elements`. That service should also map `selected_by_percent → selectedByPercent`.

---

## Frontend component changes

### `PlayerRankRow`

Add two new optional sections below the existing `.meta` line:

```tsx
{player.statBreakdown && player.statBreakdown.length > 0 && (
  <div className={styles.statChips}>
    {player.statBreakdown
      .filter(s => !HIDDEN_STATS.has(s.identifier))
      .map(s => (
        <span key={s.identifier} className={`${styles.chip} ${styles[chipColor(s.identifier)]}`}>
          {formatStatLabel(s.identifier, s.value)}
        </span>
      ))}
  </div>
)}
{player.selectedByPercent && (
  <span className={styles.ownership}>{player.selectedByPercent}% ownership</span>
)}
```

`HIDDEN_STATS`: `new Set(['minutes', 'goals_conceded', 'bps'])`

`chipColor(identifier)`: returns a CSS module class name key:
- `goals_scored` → `chipGoal`
- `assists` → `chipAssist`
- `clean_sheets`, `saves` → `chipDefensive`
- `bonus` → `chipBonus`
- `penalties_saved` → `chipPositive`
- `own_goals`, `penalties_missed`, `yellow_cards`, `red_cards` → `chipNegative`

`formatStatLabel(identifier, value)`: pure function, returns English label string per the
table above. Lives in `PlayerRankRow.tsx` or a co-located `statLabels.ts` helper.

### CSS tokens

All chip colours use `--fpl-*` token-derived values or semi-transparent backgrounds. No
literal colour values. Chip font size: `0.625rem` (10px). Chip padding: `0.125rem 0.375rem`.
Ownership line font size: `0.5625rem` (9px), color: `var(--fpl-text-secondary)`.

---

## What does NOT change

- No new React Query hooks; existing `useTopPlayersGw`, `useTopPlayersSeason`, `useTeamPlayers`
  are unchanged at the call site.
- No new proxy routes.
- `TopPlayersScreen.tsx` needs no changes — it passes `player` to `PlayerRankRow` unchanged.
- `PlayerRankRow` props type is extended, but the component is backward-compatible
  (new fields are optional).
