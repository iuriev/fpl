# Design: List View Toggle

## Context

The Squad screen currently renders only in Pitch view. This change adds a List view and a
Pitch / List toggle. The toggle is a frontend-only concern except for one proxy change: the
`/api/squad` response must be extended to include per-player individual stat fields (currently
only `total_points` is forwarded from the live endpoint).

Scope: toggle control, list view layout, proxy payload extension. Visual design (colors,
typography, exact column widths) is deferred to a Claude Design pass.

## Goals / Non-Goals

**Goals:**
- Toggle persisted in the URL (`?view=pitch|list`); defaults to `pitch`.
- List view groups players by position in order: GK, DEF, MID, FWD, then bench.
- Stat columns: Pts, MP, GS, A, CS, GC, OG, PS, PM, YC, RC, S, Bonus.
- Proxy `/api/squad` extended with individual stats — additive, no breaking change.

**Non-Goals:**
- Sorting or filtering rows in list view (backlog).
- Comparing two gameweeks side by side (backlog).
- Live stat updates mid-match (backlog).

## UX Specification

### Toggle control
A segmented control with two options — **Pitch** and **List** — rendered in the Squad screen
header, adjacent to the gameweek navigator. Selecting a tab updates the URL param `view` and
switches the content area instantly (no loading state; data is already fetched).

### Pitch view (unchanged)
Existing football-pitch layout. No changes in this mode.

### List view
A table with a sticky header row. Players are grouped under labelled section headers
(Goalkeeper, Defenders, Midfielders, Forwards, Bench). Each row contains:

| Field | Source |
|---|---|
| Kit icon | existing `shirt_{teamCode}` CDN image |
| Short name | `web_name` |
| Position badge | `element_type` → GK/DEF/MID/FWD |
| Club short name | `team.short_name` |
| C / V badge | `is_captain` / `is_vice_captain` |
| Pts | `stats.total_points` |
| MP | `stats.minutes` |
| GS | `stats.goals_scored` |
| A | `stats.assists` |
| CS | `stats.clean_sheets` |
| GC | `stats.goals_conceded` |
| OG | `stats.own_goals` |
| PS | `stats.penalties_saved` |
| PM | `stats.penalties_missed` |
| YC | `stats.yellow_cards` |
| RC | `stats.red_cards` |
| S | `stats.saves` |
| Bonus | `stats.bonus` |

On mobile the table scrolls horizontally; player identity columns (kit, name, position, club)
are sticky on the left.

### Availability indicator
Flagged players display the same availability indicator as in Pitch view, as a small badge
on the kit icon.

## Decisions

**D1 — URL persistence for view mode.** The active view (`pitch` / `list`) is stored as a URL
query param `view`. This keeps the view shareable and consistent with how gameweek is stored.
Default: `pitch` (omitting the param also means pitch).

**D2 — Sticky identity columns on mobile.** The first two columns (kit + name) are CSS
`position: sticky` so they remain visible while the stat columns scroll horizontally.

**D3 — Proxy payload extension.** The individual stats are already fetched from
`/event/{gw}/live/` for point calculation. The proxy now includes the full `stats` object per
player in the `/api/squad` response. Field names match the FPL live endpoint exactly to avoid
a translation layer.

## Risks / Trade-offs

- The extended proxy payload is larger. Acceptable — it replaces the currently discarded stat
  fields that were fetched anyway.
- Horizontal scroll on mobile requires clear affordance (shadow or peek of the next column).
  UX detail deferred to the design pass.
