# Proposal: Transfer Screen Polish - Disabled States and Responsive Sizing

Improve the UX and accessibility of the transfer screen by adding appropriate disabled states to footer buttons and optimizing player card sizes for small screens.

## Problem
1. **Button States**: The footer buttons ("Transfers", "Reset", "Save Plan") are sometimes enabled when they don't have any action to perform (e.g., when no transfers are planned or they were already saved).
2. **Small Screen Visibility**: On devices with height < 800px, the pitch (specifically the defense and goalkeeper lines) might not fit completely, even after moving the transfers list to a bottom sheet.

## Proposed Changes
1. **Footer Logic**:
   - **Transfers**: Disabled if no swaps are planned (`draft.swaps.length === 0`).
   - **Reset**: Disabled if no swaps AND no subs are planned.
   - **Save Plan**: Disabled if no changes have been made since the last save OR if no moves are planned.
   - Introduce an `isDirty` state in `TransferScreen` to track unsaved manual changes.

2. **Responsive Sizing**:
   - Add a media query for `max-height: 800px` in `colors_and_type.css`.
   - Reduce jersey size variables:
     - `--fpl-size-jersey-l`: 3.375rem → 2.75rem
     - `--fpl-size-jersey-m`: 3rem → 2.5rem
   - Adjust `PlayerCard` internal spacing if needed to ensure it remains compact.

## User Experience
- Clear visual feedback on which actions are available.
- Better fit for the football pitch on smaller mobile devices (e.g., iPhone 13 mini, older models).
