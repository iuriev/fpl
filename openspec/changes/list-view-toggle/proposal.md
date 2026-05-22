## Why

The pitch view gives a spatial sense of the squad but makes it hard to compare individual player
performance at a glance. A scrollable list with per-player stat columns (minutes, goals, assists,
clean sheets, bonus, etc.) is the natural companion view for managers who want to analyse
performance rather than just see the layout. A simple toggle lets the user switch between the two
without losing context.

## What Changes

- Add a Pitch / List toggle control to the Squad screen.
- In List view, display all 15 players grouped by position (GK → DEF → MID → FWD, then bench)
  with a stat table showing: Pts, MP, GS, A, CS, GC, OG, PS, PM, YC, RC, S (saves), Bonus.
- Extend the proxy `/api/squad/:teamId/:gw` response to include per-player individual stats
  sourced from the `/event/{gw}/live/` endpoint (already fetched for points; expand the payload).
- Persist the active view (Pitch / List) in the URL so a shared link opens in the same view.

## Capabilities

### New Capabilities
- `list-view`: Display the squad as a positional stat table alongside the existing pitch view,
  toggled by a Pitch / List control.

### Modified Capabilities
- `squad-view`: Extended with the toggle control and a new list layout mode.

## Impact

- **Backend:** extends the `/api/squad` response shape — additive, no breaking change.
- **Frontend:** new list-view component and toggle; Squad screen gains a view-mode URL param.
- **No new FPL API calls** — individual stats already come from `/event/{gw}/live/`, just not
  all fields are currently forwarded.
