# Proposal: Transfer Planner Core

## Problem
Users need a way to plan their transfers for upcoming gameweeks, taking into account budget constraints, team limits, and position requirements.

## Proposed Solution
Implement a dedicated Transfer Planner screen that allows users to:
1. Select players from their current squad to replace.
2. Pick replacements from a full player pool, filtered by:
    - Position (matching the out-player).
    - Budget (remaining bank + selling price).
    - Team limits (max 3 players per club).
3. Rearrange the bench (substitutions).
4. See the impact on the bank and the cost of transfers in points.
5. Save and load the transfer plan locally.

## Scope
- Transfer Screen UI.
- Player Picker Bottom Sheet.
- LocalStorage persistence for drafts.
- Transfer cost and budget logic.
