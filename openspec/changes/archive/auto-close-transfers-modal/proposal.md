# Proposal: Auto-close Transfers Modal when empty

## Problem
When a user views the list of planned transfers in the "Pending Transfers" modal and removes the last item, the modal remains open, showing an empty state (or just closing manually). This is an unnecessary extra click for the user.

## Proposed Change
Automatically close the "Pending Transfers" modal (`BottomSheet`) if the list of swaps becomes empty while it's open.

## Goals
- Improve UX by reducing extra clicks.
- Provide a more fluid transition after clearing all planned transfers from the list.
