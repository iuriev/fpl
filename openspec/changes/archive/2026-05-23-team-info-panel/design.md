# Design: Team Info Panel

## Context

The Squad screen currently has no persistent display of team identity or aggregate stats. This
change introduces a panel that stays visible alongside the squad, giving the manager a constant
reference without navigating away.

Scope: layout update (Squad screen gains a panel slot), new panel component, proxy entry
endpoint extension. Visual design (avatar placeholder, flag rendering, exact spacing) is deferred
to a Claude Design pass.

## Goals / Non-Goals

**Goals:**
- Panel content: team avatar placeholder, team name, manager name, country flag emoji, overall
  points, overall rank, total FPL players (season), current-GW points.
- Link / button to Gameweek History screen.
- Desktop: left sidebar. Mobile: compact collapsible header above the pitch.
- Proxy `/api/entry/:teamId` extended with additional fields — additive, no breaking change.

**Non-Goals:**
- Real team badge / avatar image (backlog — FPL API does not expose a manager avatar).
- Editing team name or manager name (FPL is read-only).

## UX Specification

### Panel content

| Field | Source (proxy) |
|---|---|
| Team name | `name` (already in v1.0 response) |
| Manager name | `player_first_name` + `player_last_name` (already in v1.0) |
| Country flag | `player_region_iso_code_short` → emoji flag (new field) |
| Overall points | `summary_overall_points` (new field) |
| Overall rank | `summary_overall_rank` (new field) |
| Total players | `total_players` from bootstrap-static (new field) |
| GW points | `summary_event_points` (new field) |

All new fields are already present in the FPL `/entry/{teamId}/` response; the proxy currently
discards them.

### "Gameweek History" control
A button or tappable row at the bottom of the panel that navigates to
`/squad?teamId=X&gw=Y&screen=history` (or a dedicated route, resolved when routing is
defined in the `gameweek-history` change).

### Desktop layout
Two-column layout on the Squad screen: the panel occupies a fixed-width left column; the pitch
/ list area occupies the remaining space. Layout uses CSS Grid.

### Mobile layout
The panel collapses to a single summary row (team name + overall points + rank) in the header
with a chevron to expand the full panel inline. Collapsed by default to preserve vertical space
for the squad.

## Decisions

**D1 — Flag via ISO code.** `player_region_iso_code_short` is a two-letter ISO 3166-1 alpha-2
code. Converting it to a flag emoji in the frontend (regional indicator symbols: 🇺🇦) requires
no external library — pure string math.

**D2 — Proxy extension rather than new endpoint.** All new fields come from the same FPL
`/entry/{teamId}/` call already made by the proxy. Extending the existing response is simpler
and avoids an additional round-trip.

**D3 — Mobile collapse.** A collapsed default on mobile avoids pushing the squad too far down.
Collapse state is session-local (not in URL) since it is a layout preference, not a content
selection.

## Risks / Trade-offs

- Desktop two-column layout requires the Squad screen to be restructured. This is a contained
  CSS Grid change; it does not affect the pitch/list components themselves.
- If `player_region_iso_code_short` is absent for some managers (unlikely but possible), the
  flag is omitted gracefully — no error state.
