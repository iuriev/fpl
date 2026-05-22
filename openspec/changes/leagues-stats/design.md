# Design: Leagues & Stats

## Context

The FPL `/entry/{teamId}/` response already contains a `leagues` object with `classic[]` and
`h2h[]` arrays. This change exposes it as a My Stats screen so managers can see their position
across all enrolled leagues without navigating to the official FPL site.

Scope: new proxy endpoint, new screen/route. Visual design deferred to a Claude Design pass.

## Goals / Non-Goals

**Goals:**
- My Stats screen listing all leagues the manager is enrolled in.
- Two sections: General (Classic) Leagues and Head-to-Head Leagues.
- Each row: league name, current entry rank, direction indicator (↑/↓/—).
- New proxy endpoint `GET /api/entry/:teamId/leagues`.
- Route: `/stats?teamId=X`.

**Non-Goals:**
- Full league standings / leaderboard within a league (separate feature).
- H2H match results (backlog).
- Creating or leaving leagues (FPL is read-only).

## UX Specification

### Screen layout
Full-page screen with back navigation to the Squad screen. Heading: "My Stats". Two sections:
"General Leagues" and "Head-to-Head Leagues" (omit H2H section if the manager has no H2H
leagues).

### League row content

| Field | Source |
|---|---|
| League name | `name` |
| Current rank | `entry_rank` |
| Direction | derived from `entry_rank` vs `entry_last_rank` |

Direction indicator: ↑ if `entry_rank` < `entry_last_rank` (improved), ↓ if higher (worsened),
— if unchanged or `entry_last_rank` is null (newly joined). Colour: green for ↑, red for ↓.

Leagues are listed in the order returned by the FPL API (no re-sorting in this version).

### Empty / loading / error states
- **Loading:** skeleton rows.
- **Error:** inline error with retry.
- **No leagues** (unlikely — every manager is in the Overall league): empty state message.

## Decisions

**D1 — Proxy endpoint shape.** `GET /api/entry/:teamId/leagues` returns:
```
{ teamId, classic: [ { id, name, rank, lastRank } ],
  h2h: [ { id, name, rank, lastRank } ] }
```
`rank` = `entry_rank`, `lastRank` = `entry_last_rank`. Direction derived on the frontend.

**D2 — No new FPL API call.** The leagues data is already present in the `/entry/{teamId}/`
response. The proxy extracts it into a dedicated endpoint rather than bundling it with the
entry summary, keeping each endpoint focused.

**D3 — Direction derived on frontend.** Same reasoning as Gameweek History D2 — presentation
logic stays in the frontend.

## Risks / Trade-offs

- `entry_last_rank` can be null for leagues joined in the current gameweek; direction shows —.
- The Overall league has 13+ million entries; rank numbers need thousand-separator formatting.
