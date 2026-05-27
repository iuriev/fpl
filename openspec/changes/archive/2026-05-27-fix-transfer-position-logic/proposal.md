# Proposal: Fix Transfer Position Logic

User identified a business bug where the transfer picker allows filtering by positions that are not valid for the player being replaced. In FPL, you cannot swap a player of one position for a player of another position (e.g., MID for DEF) because the squad structure (2/5/5/3) is fixed.

## Problem
- `TransferScreen` provides candidates for all outfield positions if an outfield player is selected.
- `PlayerPickerSheet` shows tabs for "ALL", "DEF", "MID", "FWD", which allows browsing invalid replacements.
- This is misleading to users and technically incorrect according to FPL rules.

## Proposed Changes
- Filter `candidates` in `TransferScreen` to only include players with the same position as the `outPlayer`.
- Remove position filter tabs and related logic from `PlayerPickerSheet`.
- Simplify `PlayerPickerSheet` state by removing `positionFilter`.

## Goals
- Align transfer logic with FPL rules.
- Simplify UI by removing redundant filters.
- Improve user experience by only showing valid replacement candidates.
