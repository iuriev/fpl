# Proposal: Chip-Aware Transfer Planner (CHIP-02)

## Problem

The Transfer Planner currently has two gaps:

1. **No connection to actual chip availability.** The Wildcard and Free Hit toggle buttons are
   purely manual — they have no knowledge of which chips the manager has already played this
   season, so a manager can "activate" a chip that was used in GW3 and the planner won't object.

2. **Missing BB / Triple Captain visibility.** Bench Boost and Triple Captain have no presence
   in the planner even though they're chips the manager may want to track alongside their
   transfer plan. Their transfer effect is zero, but their availability status matters.

3. **No auto-pre-selection.** If a manager already has an active chip in the current gameweek
   (e.g. they activated Wildcard before the deadline), the planner opens with `chip: 'none'`
   and silently computes the wrong transfer cost.

## Proposed Change

- Extend `GET /api/squad/:teamId/:gw` to include `chipStatuses` — a per-chip status map
  computed server-side from the manager's history and the bootstrap chip-availability windows.
- Auto-pre-select the active chip in the Transfer Planner draft when squad data loads.
- Show all four chip buttons (Wildcard, Free Hit, Bench Boost, Triple Captain) in
  `TransferHeader` with correct enabled / disabled / active styling.
- BB and TC buttons are visible and reflect availability but do not affect transfer cost.

## FPL Chip Rules

| API value  | Display name    | Quota     | Transfer effect              |
|------------|-----------------|-----------|------------------------------|
| `wildcard` | Wildcard        | 2/season  | Unlimited transfers, no cost |
| `freehit`  | Free Hit        | 1/season  | Unlimited transfers, no cost; original squad reverts next GW |
| `bboost`   | Bench Boost     | 1/season  | None — bench points count    |
| `3xc`      | Triple Captain  | 1/season  | None — captain earns 3×      |

Wildcard is split into two windows per season. The bootstrap-static `chips[]` array defines
the `start_event` and `stop_event` for each window. A manager has one Wildcard available per
window; using the Wildcard in the first window does not consume the second.

Only one chip can be active in any given gameweek.

## Goals

- `SquadResponse` includes `chipStatuses: ChipStatuses` with per-chip `'available' | 'used' | 'active'`.
- Proxy derives status from: `active_chip` (current GW picks) + `history.chips[]` (played chips) + bootstrap chip windows (Wildcard half-boundary).
- `TransferScreen` pre-selects `draft.chip` from `chipStatuses` on first load (no saved draft).
- `TransferHeader` renders four chip buttons; `used` chips are disabled.
- BB / TC buttons are present but selecting them does not change `draft.chip` (no transfer effect).

## Non-Goals

- Chip strategy recommendations (backlog CHIP-04).
- "Play chip" CTA wired to the FPL site.
- Chip history timeline view.
