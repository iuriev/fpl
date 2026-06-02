# ANA-01: Gameweek Review Screen — Design

**Date:** 2026-06-01
**Status:** Approved (brainstorming session)

---

## Goal

Give the user a personal post-gameweek debrief after every completed GW: how many points they scored, how their rank moved, which players delivered, what the bench cost them, whether their transfers paid off, and a verdict on their decision-making.

---

## Scope

- Read-only screen. No interaction beyond tapping a player to see their stats.
- Always shows the **most recently completed gameweek** — no GW picker.
- Entry point: a dedicated **"Review" tab** in the bottom navigation bar, visible at all times once at least one GW is finished.
- If no GW is finished yet (pre-season), the tab is hidden or shows an empty state.

---

## Layout

Vertical scroll, Report Card style. Five sections stacked in a narrative order: overview → detail → regret → decision quality → verdict.

```
┌──────────────────────────────┐
│  ← Back   Обзор недели  GW36 │  ← header
├──────────────────────────────┤
│  68 pts          ↑ 142k rank │
│  [+14 vs avg] [avg 54] [...] │  ← ① Hero Summary
├──────────────────────────────┤
│  👥 Игроки — sorted by pts   │
│  (C) Haaland   FWD   32 ●    │
│  Salah         MID   14 ●    │
│  …                           │  ← ② Player List
│  — скамейка —                │
│  Odegaard      MID    8 ●    │
├──────────────────────────────┤
│  🪑 Скамейка                 │
│  😬 Потеряно 14 pts на бенче │
│  [Odegaard 8][Mitoma 5][...] │  ← ③ Bench
├──────────────────────────────┤
│  🔄 Трансферы                │
│  Son 6  →  Mbappé 8    +2    │
│  Trippier 11 → R.James 6  −5 │
│  −4 pts за хит               │  ← ④ Transfer ROI
├──────────────────────────────┤
│  🤔 Что если без трансферов? │
│  Твой счёт         68        │
│  Без трансферов    75        │
│  😬 Трансферы стоили −7 pts  │  ← ⑤ What-If Verdict
└──────────────────────────────┘
```

---

## Sections

### ① Hero Summary

Displayed data:
- Large GW points number
- Overall rank change: arrow + magnitude (e.g. ↑ 142,431 places), new overall rank
- Chip pills: `vs avg +14`, `avg 54`, `highest 112`, `GW rank 381k`
- If a chip was played this GW: chip badge (Wildcard / BB / TC / FH)

Visual: dark purple-to-navy gradient background, green `↑` for rank gain, red `↓` for loss.

### ② Player List

All 15 squad members (11 starters + 4 bench), sorted by GW points descending within each group. Bench is visually separated with a divider.

Each row:
- Club abbreviation circle (jersey placeholder)
- Player name
- Position badge (GKP / DEF / MID / FWD)
- Captain badge `C` (yellow) for captain
- Key stat label (e.g. "гол + бонус", "0 мин")
- GW points (right-aligned, large)

Color coding by row:
- Green left border + subtle green tint: ≥ 8 pts
- Neutral: 3–7 pts
- Red left border + subtle red tint: ≤ 2 pts

Bench rows are 60% opacity to distinguish from starters.

Tap to expand: shows full stats breakdown (minutes, goals, assists, clean sheet, bonus, cards).

### ③ Bench Wasted

Summary callout with total points left on bench (from `entry_history.points_on_bench`).

Shows all 4 bench players as chips with their individual GW points. If auto-substitution occurred, shows "Auto-sub: X came on for Y".

Visual: amber/orange accent (wasted opportunity colour). Callout is neutral if bench points ≤ 3, amber if 4–9, red-amber if ≥ 10.

### ④ Transfer ROI

Only rendered if `entry_history.event_transfers > 0`.

For each transfer (derived by diffing current GW picks vs previous GW picks):
- OUT card (red tint): transferred-out player name + their GW points
- Arrow
- IN card (green tint): transferred-in player name + their GW points
- Delta badge: `+N` (green) or `−N` (red)

Below the transfers: if transfer cost was paid, shows `−N pts за хит`.

If no transfers were made: shows "Перенос трансфера — состав не менялся".

### ⑤ What-If Verdict

Two-row comparison card:
- Row 1 "Твой счёт": actual GW points (green)
- Row 2 "Без трансферов": hypothetical score (grey)
- Verdict strip: icon + short text ("✅ Трансферы принесли +7 pts" or "😬 Трансферы стоили −7 pts")

If no transfers were made this GW, this section is hidden.

---

## Data Sources

All data comes from **existing proxy endpoints** — no new backend work required.

| Data needed | Source |
|-------------|--------|
| GW points, rank, overall rank, points_on_bench, transfer_cost | `useHistory(teamId)` → `HistoryGameweek` for the review GW |
| GW average & highest scores | `useGameweeks()` → `events[reviewGw]` (available via bootstrap-static, needs proxy exposure — see below) |
| All 15 squad players + GW points | `useSquad(teamId, reviewGw)` |
| Previous GW squad (to diff transfers) | `useSquad(teamId, reviewGw - 1)` |
| Transferred-out players' GW points | `usePlayerPool()` → `PoolPlayer.eventPoints` |

**One proxy gap:** `average_entry_score` and `highest_score` per GW are available in `bootstrap-static/events[]` but not currently exposed by the proxy. The `/api/gameweeks` endpoint returns only `{ id, name, finished }`. Options:
- A) Extend `/api/gameweeks` to include `averageScore` and `highestScore` per event (preferred — small change)
- B) Hardcode these from `useHistory` which already has a GW rank (but not avg/highest)

Preferred: option A. Add `averageScore?: number` and `highestScore?: number` to the `Gameweek` type and proxy response.

---

## What-If Calculation

```
reviewGwPicks     = useSquad(teamId, reviewGw).starters + bench
previousGwPicks   = useSquad(teamId, reviewGw - 1).starters + bench

transferredIn     = reviewGwPicks filtered to players NOT in previousGwPicks
transferredOut    = previousGwPicks filtered to players NOT in reviewGwPicks

transferredOutPts = sum of each out-player's eventPoints (from usePlayerPool)
transferredInPts  = sum of each in-player's GW points (from reviewGwPicks)

whatIfScore = actualGwPoints
            - transferredInPts
            + transferredOutPts
            + transferCost         // restore the deducted hit cost
```

Edge cases:
- GW 1: `reviewGw - 1 = 0` → no previous squad → skip transfer sections entirely
- Free Hit chip: players return to pre-FH squad next GW; what-if comparison is still valid for the FH GW itself
- Wildcard: transferredOut may be many players; show all, cap display at 5 with "+N more"

---

## Routing

New route: `/review?teamId={id}`

Navigation tab "Review" added to the bottom nav. Hidden if `gameweeks.filter(gw => gw.finished).length === 0`.

The screen reads `reviewGw` as `gameweeks.filter(gw => gw.finished).at(-1)?.id`.

---

## Component Structure

```
GameweekReviewScreen
├── ReviewHero           (summary strip)
├── ReviewPlayerList     (player rows, expandable stats)
├── ReviewBench          (bench wasted callout + chips)
├── ReviewTransfers      (per-transfer ROI cards)
└── ReviewWhatIf         (verdict comparison card)
```

All components are local to `screens/GameweekReviewScreen/`. No shared UI components needed beyond existing `Button`, `PositionBadge`, `ChipBadge`.

---

## Out of Scope

- GW picker (navigate to any past GW) — future iteration
- Captain analysis section (captain's pts visible in player list with C badge)
- Share / export functionality
- Mini-league context on this screen (separate LIVE-02 feature)
