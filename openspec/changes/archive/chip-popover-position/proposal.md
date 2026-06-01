# Proposal: Position Chip Blocked Hint Under the Chip

## Problem
Currently, when a user taps a blocked (already used) chip in the `TransferHeader`, a toast message appears at the bottom of the screen. This is far from the user's focus point (the chip button). Users expect contextual feedback to appear near the element they interacted with.

## Proposed Change
1. Move the chip-specific hint logic from the global toast in `TransferScreen` to a contextual popover/tooltip within `TransferHeader`.
2. Implement the hint using the native Popover API (as per ADR 0014) or absolute positioning within the `TransferHeader` to ensure it appears directly under the chips row.
3. Ensure the hint is accessible and clear.

## Goals
- Show chip blocked messages directly under the chips row in `TransferHeader`.
- Improve UX by providing immediate contextual feedback.
- Reduce reliance on global toast for element-specific feedback.
