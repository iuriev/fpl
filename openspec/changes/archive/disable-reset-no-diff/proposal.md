# Proposal: Disable Reset Button when no difference with server

## Problem
The "Reset" button on the Transfers screen is currently enabled if there are any pending transfers (`swaps`) or bench substitutions (`subs`) in the local draft. However, it doesn't account for the selected chip. Additionally, the user wants the button to be disabled if the current state exactly matches the state on the server, even if a draft exists in local storage.

## Proposed Change
1.  Introduce a way to determine the "initial state" from the server (e.g., `initialChip`).
2.  Update the `hasChanges` logic to include a comparison between the current `planChip` and the `initialChip`.
3.  Ensure `handleReset` properly reverts all changes: transfers, substitutions, and the selected chip.
4.  The Reset button should be disabled if `swaps` are empty, `subs` are empty, AND `planChip` matches the `initialChip`.

## Goals
-   Provide clear visual feedback (disabled state) when no changes are pending relative to the server state.
-   Ensure all "planned" actions (including chip selection) can be reverted via the Reset button.
