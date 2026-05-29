# Proposal: PlayerCard Info Popup and Stats Badges

## Problem

`PlayerCard` currently shows minimal information: name, points, and availability status.
Users cannot quickly assess a player's upcoming fixtures or season contributions without
navigating away from the squad or transfer pitch. This creates friction in the core decision
loop — "should I transfer this player?"

## Proposed Changes

### UX-04: Info button → upcoming fixtures popup

Add a small `ⓘ` icon button to `PlayerCard`. Tapping it opens a compact popup showing:
- Upcoming 5 fixtures with FDR colour chips (GW#, opponent, H/A)
- Player ownership %
- Current price

The popup overlays the pitch without navigating away. It appears on both `SquadScreen` and
`TransferScreen` cards.

### VIS-01: Goals / assists badge counters

Show small counter badges directly on `PlayerCard` for goals scored and assists this season.
Badges only appear when the count is > 0. Data is already present in `SquadPlayer.stats`.

## Goals

- Let users scan upcoming fixture difficulty at a glance without opening a separate screen.
- Surface key contribution stats (goals, assists) directly on the pitch view.
- No new proxy endpoints required — fixture and pool data already fetched.

## Non-Goals

- Purchase price / sell price per player (requires exposing `selling_price` from FPL picks —
  deferred to a follow-up change).
- Points breakdown per fixture (deferred).
- Editing or acting on data from the popup (read-only).
