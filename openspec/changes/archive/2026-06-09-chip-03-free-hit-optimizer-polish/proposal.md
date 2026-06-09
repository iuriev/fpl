# Proposal: CHIP-03 Free Hit optimizer polish

## Problem

The initial CHIP-03 MVP shipped a greedy Free Hit optimiser and AI button, but managers
reported several quality gaps:

- Leftover bank after suggestion (budget not fully invested)
- Bench treated as cheapest fillers only, not strategic subs for auto-replacement
- Starting XI vs bench ordering did not always maximise starter xPts
- UI showed FPL `ep_next` while the optimiser used model `xPts`, causing apparent mismatches
- Bench slot order did not follow FPL auto-sub priority (left → right)
- No visible sum of predicted starter points on the pitch

## Solution

Polish the optimiser, API response, player pool, and Transfer Screen so the AI Free Hit
suggestion is internally consistent, spends budget aggressively, orders bench correctly,
and surfaces model xPts everywhere the user reviews the suggestion.

## Scope

### In

- Bench strategy: premium GK + two premium outfield subs + cheap third enabler
- `investRemainingBudget` / `spendRemainingBudgetOnSquad` to minimise unspent bank
- `finalizeSquadLayout` re-runs best formation on full 15
- API returns per-player `xPts` and `orderedSquad` (15 IDs: 11 starters + 4 bench)
- Player pool `expectedPoints` prefers model xPts over FPL `ep_next`
- Transfer draft applies API slot order via `buildFreeHitOrderSubs`
- Pitch overlay: **Predicted total** (sum of starter model xPts) top-right

### Out

- AI Wildcard
- Confirming Free Hit to FPL's API
- ILP / exact optimisation

## Success criteria

- Tapping AI Free Hit leaves ≤ £0.1m bank in normal cases
- No starter has lower xPts than a same-position bench player
- Bench order: sub1 best, sub2 next, sub3 cheap enabler
- Card xPts match optimiser model values
- Predicted total visible on pitch during Free Hit draft

## References

- Backlog: CHIP-03 (polish on shipped MVP)
- Prior archive: `openspec/changes/archive/2026-06-08-chip-03-ai-free-hit-assistant`
