# Proposal: Top Players — Ownership % and GW Stat Breakdown

## Problem

The Top Players screen shows each player's name, position, club, and points total — but gives no
context about *why* a player scored those points or *how popular* they are. A 18-point score from
a defender could come from a goal + clean sheet + bonus, or from an assist + saves run. Users
currently have to leave the app to find out.

## Solution

Enrich each player row with two pieces of contextual data:

1. **Ownership** — `X% ownership` shown as a muted line below the stats, on all three tabs
   (This GW, Season, By Team).
2. **GW stat breakdown** — colour-coded chips inline in the row (This GW tab only), listing
   every non-zero scoring event in plain English: `1 goal`, `Clean sheet`, `3 bonus`, etc.

## User value

- "Why did Dorgu score 18?" — answered instantly without leaving the screen.
- "Only 8% own Diop — should I transfer him in?" — ownership context visible at a glance.
- "Who are the differential high scorers?" — cheap insights from the existing data.

## Scope

### In

- **All three tabs**: add `selectedByPercent` to every player row.
- **This GW tab only**: add `statBreakdown` chips (goals, assists, clean sheet, bonus, saves,
  penalties saved/missed, own goals, yellow/red cards). Non-zero values only.
- Proxy: extend `FPLLive` type to include `explain[]`; map `selected_by_percent` from bootstrap
  for all endpoints; map stat breakdown from `explain[]` for the GW endpoint only.
- Frontend: extend `TopPlayersPlayer` type; update `PlayerRankRow`; no new API queries needed.

### Out of scope

- Season-level stat breakdown (no single-fixture source for season totals).
- Points breakdown for the "By Team" tab.
- Tappable rows / bottom sheet detail view (could be a follow-up).
- `minutes` and `goals_conceded` stats are intentionally omitted (low signal for this view).

## Dependencies

None. All data is already fetched by existing proxy endpoints; this change only widens
what gets returned.
