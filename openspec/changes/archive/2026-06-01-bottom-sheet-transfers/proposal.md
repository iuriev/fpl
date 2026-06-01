# Proposal: Bottom Sheet for Planned Transfers

Improve the visibility of the pitch on small devices by moving the planned transfers list to a bottom sheet and streamlining the footer actions.

## Problem
On small devices (e.g., iPhone SE), the "Planned Transfers" section takes up too much vertical space, pushing the defense and goalkeeper lines off the screen.

## Proposed Changes
1. **Footer Layout**: Change the footer (`TransferActionBar`) to include three equal-sized buttons:
   - **Transfers**: Opens the bottom sheet with planned moves.
   - **Reset**: Clears the current draft.
   - **Save Plan**: Persists the draft to local storage.
2. **Planned Transfers List**: Move the `SwapsStrip` component into a native-like `BottomSheet` component.
3. **Screen Layout**: Remove the inline `SwapsStrip` from the `TransferScreen` main view to reclaim vertical space for the pitch.

## User Experience
- The pitch is fully visible even on small screens.
- Users can view and manage their planned transfers via a dedicated bottom sheet triggered by the "Transfers" button.
- Consistent and balanced footer UI.
