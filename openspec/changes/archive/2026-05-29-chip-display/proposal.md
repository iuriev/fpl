# Proposal: Display Active Chip (CHIP-01)

## Problem

When a user has played a chip (Wildcard, Triple Captain, Free Hit, or Bench Boost) for a
gameweek, the FPL API returns `active_chip` on the picks payload, but the app currently
ignores it. Users have no visible indication that a chip is active for the gameweek they're
viewing — they could miss it entirely, especially when reviewing a past gameweek.

## Proposed Change

Surface the active chip as a labelled banner in the SquadScreen, placed above the
SummaryStrip whenever `active_chip` is non-null. The banner shows a recognisable icon
and the chip name so users can immediately see "this week I played my Wildcard."

## FPL Chip Reference

The FPL API uses these `active_chip` string values:

| API value  | Display name    | FPL rules                               |
|------------|-----------------|------------------------------------------|
| `wildcard` | Wildcard        | Unlimited free transfers; squad kept next GW |
| `3xc`      | Triple Captain  | Captain earns 3× points instead of 2×   |
| `freehit`  | Free Hit        | Unlimited transfers; original squad reverts |
| `bboost`   | Bench Boost     | Bench players' points count this GW      |

Each chip is once-per-season (Wildcard is twice: GWs 1–19 and GWs 20–38).

## Goals

- Proxy forwards `active_chip` as `activeChip: ActiveChip` on `SquadResponse`.
- Frontend shows a `ChipBadge` banner with the chip icon and name above SummaryStrip.
- Each chip has a distinct colour matching the app's design token palette.
- `null` chip means no banner is rendered.

## Non-Goals

- CHIP-02 (chip-aware transfer planner logic) — separate change.
- "Play a chip" CTA or chip history — out of scope.
