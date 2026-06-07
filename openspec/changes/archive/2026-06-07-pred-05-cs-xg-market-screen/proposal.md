# Proposal: PRED-05 Clean sheet probability & xG/xA market screen

## Problem

FPL managers need a fast way to spot which defenders to target for clean sheets and which
attackers face weak defences. Currently all prediction data is surfaced per-player only
(`/api/predictions`). There is no consolidated per-team view of fixture strength for a given
gameweek.

## Solution

A new **Market screen** (`/market`) with two sortable panels:

- **CS% panel** — all 20 PL teams ranked by clean-sheet probability for the next GW. Shows
  team badge, opponent + H/A badge, and CS% bar.
- **xG panel** — all 20 PL teams ranked by expected goals (λ_for from the Poisson model).
  Shows team badge, opponent + H/A badge, and xG value.

Data comes from `pred_fixture_team` (already populated by the PRED-09 batch scorer). A new
proxy endpoint `GET /api/market?event=N` aggregates it and joins FPL team metadata. For DGW
teams the values are summed across fixtures.

The screen is **premium-only** (blurred/locked for free users, same pattern as Predicted
Points). A gameweek picker allows looking ahead or back.

## Scope

### In

- Proxy: `GET /api/market?event=N` — per-team CS% and xG for the given GW
- Web: `MarketScreen` at `/market` with CS% and xG panels, sortable columns
- Nav: add Market tab to the bottom nav bar
- Paywall: free users see blurred rows + upsell dialog (reuse `PremiumUpsellProvider`)

### Out

- Trend sparklines (deferred — needs historical runs per team)
- xAssists per team (derived from player layer, not fixture layer — deferred to PRED-07)
- Push notifications when market data updates

## Depends on

- PRED-09 prediction API (✅ done — `archive/2026-06-07-pred-09-prediction-api`)

## Effort

**M** — new endpoint is a simple DB read; UI is two sorted lists with paywall.
