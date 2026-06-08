# Design: Top Players + Leaderboard Merge

## Context

The app currently has two separate screens for player rankings:
- `/top-players` — GW ranked list, Season ranked list, By Team, and TOTW pitch view (4 tabs)
- `/leaderboard` — DEFCON (worst BPS) and BPS (best BPS) side-by-side, GW and Season sub-tabs

Both screens answer the same user question: "who stood out this gameweek?" Splitting them across two routes creates unnecessary navigation friction. TOTW is the same data as the GW ranked list, just in a different visual format — the same pitch/list toggle pattern already used on the Squad screen applies here.

This change merges the two screens into a single, restructured Top Players screen and removes the Leaderboard screen entirely.

## Goals / Non-Goals

**Goals:**
- Restructure Top Players into 5 tabs: **Points**, **DEFCON**, **BPS**, **By Team**, **Season**
- Merge TOTW into the Points tab as a List ↔ Pitch view toggle (same pattern as Squad screen)
- Migrate DEFCON and BPS into dedicated full-width tabs with the rich player row (jersey + position badge + club + price + BPS badge)
- Season tab gets a sub-toggle: **Points · DEFCON · BPS** (season-long data for all three views)
- Delete `LeaderboardScreen`, the `/leaderboard` route, and the nav link from `TeamInfoPanel`

**Non-Goals:**
- No redirect from `/leaderboard` to `/top-players`
- No new proxy endpoints (all data already exists via `/api/leaderboard/*` and `/api/top-players/*`)
- No changes to the By Team tab behaviour

## Tab Structure

| Tab | Content | GW nav |
|---|---|---|
| **Points** | GW ranked list (existing) + List ↔ Pitch toggle (byvший TOTW) | ← GW N → |
| **DEFCON** | Full-width list, worst BPS first, rich player row | ← GW N → |
| **BPS** | Full-width list, best BPS first, rich player row | ← GW N → |
| **By Team** | Players from a selected club (existing, unchanged) | — |
| **Season** | Sub-toggle: Points · DEFCON · BPS — season totals | — |

`Tab` type expands from `'gw' | 'season' | 'team' | 'totw'` to `'points' | 'defcon' | 'bps' | 'team' | 'season'`.

## UX Specification

### Points tab

Replaces the current `gw` tab. The `totw` tab is eliminated; its content becomes the Pitch view within Points.

- Subheader row 1: GW navigator (← GW N →), same as today
- Subheader row 2: view toggle pills — **≡ List** | **⊞ Pitch**
- **List view**: ranked player rows, infinite scroll (existing behaviour)
- **Pitch view**: TOTW formation on pitch (existing `Pitch` + `PlayerCard` layout)
- GW nav applies to both views simultaneously
- URL param: `tab=points`, `view=list|pitch` (or keep `view` in local state — no URL persistence needed)
- Default view: List

### DEFCON tab

- GW navigator (← GW N →), same arrow style as Points
- Full-width ranked list, sorted worst BPS first (ascending by BPS value)
- Player row: rank · jersey · name + position badge + club · price · BPS badge (neutral colours — `--fpl-text-soft` background, no red)
- BPS badge label: `BPS`, value: signed integer e.g. `-8`
- Data source: `useLeaderboardGw(gw).data.defcon`
- Infinite scroll with progressive reveal (PAGE_SIZE = 20)

### BPS tab

- GW navigator (← GW N →)
- Full-width ranked list, sorted best BPS first (descending)
- Player row: same rich row as DEFCON, BPS badge in green (`--fpl-success` family)
- BPS badge label: `BPS`, value: integer e.g. `58`
- Data source: `useLeaderboardGw(gw).data.bps`
- Infinite scroll

### By Team tab

Unchanged from current implementation.

### Season tab

- No GW navigator
- Sub-toggle pill row: **Points** · **DEFCON** · **BPS** (pill style matching Squad screen toggles)
- **Points** sub-view: season ranked list by total points (existing `useTopPlayersSeason`)
- **DEFCON** sub-view: season DEFCON list (`useLeaderboardSeason().data.defcon`), same rich row
- **BPS** sub-view: season BPS list (`useLeaderboardSeason().data.bps`), same rich row
- Default sub-view: Points

### Player row (DEFCON and BPS)

Rich row matching the Predicted Points screen style:

```
[rank] [jersey] [name]        [price]  [badge]
                [pos][club]            BPS
```

- Jersey: kit image (same `teamCode`-based source as `PlayerCard`)
- Position badge: coloured pill (GK/DEF/MID/FWD), same tokens as existing badges
- Price: `£X.Xm` from player data
- Badge: rounded rect, two lines — value (large, bold) + label `BPS` (small caps)
  - DEFCON: neutral bg (`--fpl-surface-2`), `--fpl-text-soft` value colour
  - BPS: green bg (`--fpl-success-bg`), `--fpl-success` value colour

Data shape comes from `LeaderboardPlayer` (already typed in `@/types`).

## Deletions

| Item | Action |
|---|---|
| `LeaderboardScreen.tsx` + `.module.css` + `.test.tsx` | Delete |
| Route `path="/leaderboard"` in `App.tsx` | Delete |
| Nav link `{ to: '/leaderboard', ... }` in `TeamInfoPanel.tsx` | Delete |
| `copy.leaderboard*` keys in `copy.ts` | Delete |
| `'totw'` tab variant | Absorbed into Points tab `view` toggle |

## URL / State

| State | Storage |
|---|---|
| Active tab | `?tab=points\|defcon\|bps\|team\|season` |
| Selected GW (Points, DEFCON, BPS) | `?gw=N` |
| Team filter (By Team) | `?teamFilter=CODE` |
| Season sub-view (Points/DEFCON/BPS) | `?seasonView=points\|defcon\|bps` |
| List/Pitch view (Points tab) | Local state (not persisted in URL) |

## Data / API

### LeaderboardPlayer type extension

`LeaderboardPlayer` (in `web/src/types/index.ts`) currently lacks `nowCost`. The rich player row requires it. Add the field:

```ts
export interface LeaderboardPlayer {
  id: number;
  webName: string;
  position: PlayerPosition;
  teamCode: number;
  teamShortName: string;
  nowCost: number;   // ← new: now_cost from bootstrap-static elements[]
  value: number;
  avg?: number;
}
```

The proxy leaderboard service (`proxy/src/leaderboard-service.ts`) already reads `bootstrap-static` elements and has access to `now_cost` — add it to the mapped output in both `buildGwLeaderboard` and `buildSeasonLeaderboard`.

### Hooks — no new endpoints required. Existing hooks cover everything:

| Hook | Used by |

|---|---|
| `useTopPlayersGw(gw)` | Points tab — List view |
| `useTeamOfTheWeek(gw)` | Points tab — Pitch view |
| `useLeaderboardGw(gw)` | DEFCON tab, BPS tab |
| `useTeamPlayers(teamCode)` | By Team tab |
| `useTopPlayersSeason()` | Season tab — Points sub-view |
| `useLeaderboardSeason()` | Season tab — DEFCON and BPS sub-views |

## Out of Scope

- Connecting DEFCON/BPS rows to `PlayerProfileSheet` (backlog)
- Position filtering within DEFCON/BPS tabs (backlog)
- Help tour update for the merged screen (separate task if tour references old tabs)
