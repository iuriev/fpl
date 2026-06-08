# Proposal: CHIP-03 AI Free Hit assistant

## Problem

The Free Hit chip lets a manager temporarily replace their entire squad for one gameweek.
Choosing the optimal 15 players within budget is a constrained optimisation problem that
most managers solve manually by scanning player stats. We can automate this.

## Solution

Add an **AI Free Hit** button to the Transfer Screen action bar. When tapped, the backend
calculates the optimal 15-player squad for the next gameweek — maximising predicted points
(xPts) within the manager's total budget (sell prices + bank) — and auto-populates the
transfer draft with the suggested swaps. The manager can review and adjust manually before
confirming.

A placeholder **AI Wildcard** button appears in the same row, locked, for future use.

Both AI buttons are always visible but gated behind the premium subscription.

## Scope

### In

- New proxy endpoint `GET /api/squads/:teamId/free-hit-suggest?gw=N`
- Greedy squad optimiser in `proxy/src/free-hit-optimizer.ts`
- `selling_price` + `purchase_price` added to FPL picks type (required for budget accuracy)
- "AI Free Hit" button in `TransferActionBar` — active when: premium + `freehit.status === 'available'`
- "AI Wildcard" button — placeholder, always disabled/locked
- On tap: chip set to `freehit`, draft swaps replaced with optimiser output
- Season dev hack: treat GW37 as current → target GW38

### Out

- AI Wildcard implementation
- Bench optimisation (bench filled with cheapest valid players)
- ILP / exact optimisation (greedy is sufficient for MVP)
- Saving or confirming the Free Hit to FPL's API (out of app scope)

## Non-goals

- Replace manual transfer planning — the result is a starting point, not a final answer
- Optimise across multiple gameweeks (that is Wildcard territory)

## Success criteria

- Tapping "AI Free Hit" fills the pitch with the highest-xPts valid 15 within budget
- Chip switches to `freehit` automatically
- User can further tweak individual swaps on the same screen
- Button is visible but locked for non-premium users

## References

- Backlog: CHIP-03
- Existing screens: `web/src/screens/TransferScreen/`
- Prediction data: `proxy/src/prediction-service.ts`, `predPlayerGw` table
- Premium gate: `useRequestPremiumUpsell`, `PremiumUpsellContext`
