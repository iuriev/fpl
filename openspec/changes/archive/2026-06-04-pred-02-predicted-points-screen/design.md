# Design: Predicted Points Screen (PRED-02)

## Route & navigation

Route: `/predicted-points`  
Nav: `TeamInfoPanel` link (after Leaderboard).

## Screen layout

```
┌────────────────────────────────────────────────────┐
│  ‹ Squad        Predicted Points        GW {N}      │
├────────────────────────────────────────────────────┤
│  [ GK ]  [ DEF ]  [ MID ]  [ FWD ]   ← position    │
├────────────────────────────────────────────────────┤
│  #1  [jersey]  Salah        LIV  £13.0  8.5 pts    │
│  #2  [jersey]  Haaland      MCI  £14.5  8.2 pts    │
│  #3  [jersey]  Saka         ARS  £10.0  7.1 pts    │
│ ─────────── 🔒 Unlock all predictions ─────────── │  ← free only
│  #4  ░░░░░░░░░  ░░░  ░░░░   ░░░░ pts  (blurred)   │
│  ...                                               │
│                                                    │
│  [premium: more rows load on scroll]               │
└────────────────────────────────────────────────────┘
```

**Row anatomy:**

```
[Jersey 32px]  {webName} · {teamShortName}  £{price}m   {xPts} pts
               {position badge}
```

- Jersey: `<Jersey teamCode={} size="sm" />`
- Price: `nowCost / 10` formatted as `£X.Xm`
- `xPts`: `expectedPoints` float, 1 decimal place, right-aligned, bold, `--fpl-accent-primary` colour
- Row is a `<button>` — tap opens `PlayerProfileSheet`

## Freemium model

### Free tier

- Fetch player pool. Take top 10 for selected position tab (sorted by `expectedPoints` desc).
- Render rows 1–3 normally.
- Rows 4–10: rendered with `filter: blur(4px)` + `pointer-events: none`.
- Overlay div after row 3: lock icon + copy + CTA button → `PremiumSheet`.
- On screen mount: `requestUpsell('predictions')` (MON-02 cooldown prevents spam).

```
rows 1–3: visible
──── PremiumLockedOverlay (absolute, covers rows 4-10) ────
rows 4–10: blurred behind overlay
```

Overlay uses `PremiumLockedOverlay` component (already exists in codebase from Price Changes).

### Premium tier

- Fetch player pool. Filter + sort all players by position.
- Render first 20.
- Place an `IntersectionObserver` sentinel element after last rendered row.
- When sentinel enters viewport: render next 20 (no network request — data already in cache).
- Repeat until all players in the tab are rendered.

## Data flow

```
usePlayerPool()  ─────────────────────────────────────────────────►  cached player-pool
     │
     ▼
filter by position tab (GK=1 / DEF=2 / MID=3 / FWD=4)
     │
     ▼
sort by expectedPoints desc (parseFloat)
     │
     ├─ free ──►  slice(0, 10)  →  render 3 + blur 4-10
     └─ premium ► paginate 20/batch  →  IntersectionObserver
```

`usePlayerPool` is already in the app; no new API hook needed.

## Components

| Component | Notes |
|-----------|-------|
| `PredictedPointsScreen` | Screen container; tab state; premium branch |
| `PredictedPointsRow` | Single player row: jersey, name, team, price, xPts |
| `PredictedPointsTab` | Position tab content: sorted list + free/premium render logic |
| `PremiumLockedOverlay` | Reuse from Price Changes — blur + lock + CTA |

Reuse: `ScreenHeader`, `Jersey`, `PositionBadge`, `PlayerProfileSheet`, `PremiumSheet`,
`useSubscriptionTier`, `usePremiumStatus`, `useRequestPremiumUpsell`.

## Position tabs

Four tabs: `GK` | `DEF` | `MID` | `FWD`.  
Map `element_type` → position same as rest of app (`POSITION_MAP`).  
Default active tab: `MID` (most players, most decisions).

## Empty & loading states

| State | Behaviour |
|-------|-----------|
| Loading | Skeleton rows (same pattern as TopPlayersScreen) |
| No players for position | "No prediction data available for this position." |
| `ep_next` = `"0"` or `"0.0"` | Include in list (GW blank weeks); format as `0.0 pts` |

## GW label

Show current GW number in screen header subtitle: `GW {currentGw}`.
Read from `useGameweeks()` → find `is_next` event; fall back to `is_current`.

## Copy keys (add to `copy.ts`)

`predictedPointsNavLink`, `predictedPointsTitle`, `predictedPointsGwLabel`,
`predictedPointsXptsLabel`, `predictedPointsPremiumTitle`, `predictedPointsPremiumDescription`,
`predictedPointsEmptyPosition`.

## Testing

- Free: only rows 1–3 visible; rows 4–10 have blur class; overlay renders with premium copy.
- Free: `requestUpsell` called on mount.
- Premium: all players rendered eventually (progressive batch); no overlay.
- Tab switch: list re-sorts for new position; scroll position resets to top.
- Row tap: `PlayerProfileSheet` opens with correct player id.
- Loading state: skeleton visible before data resolves.
- Empty: fallback copy when player pool has no players for position.

## Docs

Update `docs/fpl-api.md` `elements[]` — add note that `ep_next` is used as next-GW
expected points. Update backlog PRED-02 row as done when shipped.
