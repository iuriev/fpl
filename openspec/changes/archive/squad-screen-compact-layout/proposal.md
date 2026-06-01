# Proposal: Compact Player Cards and Scrollable Layout for SquadScreen

## Problem
On small screens (height < 800px), the squad pitch layout in `SquadScreen` can become too compressed, making player cards overlap or cut off. We recently implemented a compact jersey size and scrollable pitch area for `TransferScreen`, and we want to bring the same improvements to `SquadScreen`.

## Proposed Change
1. Ensure the new global jersey sizes (`--fpl-size-jersey-l` and `--fpl-size-jersey-m` at `max-height: 800px`) are properly used (they already are via CSS variables).
2. Update `SquadScreen.module.css` to allow vertical scrolling when the screen height is small.
3. Add a minimum height to the pitch area to prevent excessive compression.
4. Make the header and navigation controls sticky so they remain accessible while scrolling.

## Goals
- Consistent UX across Transfers and Squad screens on small devices.
- Prevent player card compression on short screens.
- Maintain access to key navigation (Gameweek switcher, View toggle) during scrolling.
