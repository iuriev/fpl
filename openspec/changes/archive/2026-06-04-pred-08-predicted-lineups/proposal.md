# Proposal: Predicted Lineups (PRED-08)

## Problem

Before each gameweek deadline, managers want to see which players are likely to start for every
Premier League club — and in the correct formation on a pitch view — to avoid captaining bench
risks and misreading rotation. The official FPL API does not expose a per-team predicted XI,
tactical formation string, or player flank (left / centre / right).

## Solution

A dedicated **Predicted Lineups** screen showing all 20 PL teams. For each team the proxy
computes:

1. **Formation** — DEF–MID–FWD counts (e.g. `4-3-3`) from real match data, with a documented
   fallback chain ending in `4-3-3`.
2. **Predicted XI** — 11 players selected in-house from FPL signals (`starts` history,
   `chance_of_playing_next_round`, `status`, `minutes`, `ep_next`).
3. **Presentation** — table (`Name | xMins | xPts`) plus pitch view (four rows: GK / DEF / MID /
   FWD) with **left-to-right flank ordering** within DEF and MID rows (right winger on the right
   edge, etc.).
4. **Premium only** — same tier gate as other prediction features; free users see upsell, not
   lineup data.

**Data policy (permanent):** the product SHALL NOT integrate paid third-party lineup or
tactical data providers (Sportmonks, API-Football predicted lineups, etc.). Sources are the
public FPL API (via proxy), an in-repo player flank registry, and for formation fallback only
frozen historical data already in our DB or importable season snapshots (e.g. vaastav) — all
logic computed in-house.

## User value

- Correct formation and flank placement on the pitch (primary UX requirements).
- Rotation and injury signal before deadline without leaving the app.
- Premium-only surface consistent with the rest of the predictions product.

## Scope

### In

- Proxy: `GET /api/predicted-lineups` — all 20 teams for the **next** gameweek context.
- Formation inference service (per-fixture `starts`, mode over recent matches, fallbacks).
- Player flank registry + slot assignment for horizontal pitch order.
- Predicted XI selection heuristic + `xMins` estimate.
- Proxy route gated with `requirePremiumFplUser`.
- Web: `PredictedLineupsScreen` — premium-only content; free → `PremiumLockedOverlay` +
  `requestUpsell('predictions')`.
- Web: team picker (20 clubs), formation label, table + pitch tabs.
- Route `/predicted-lineups` + `TeamInfoPanel` nav link.
- Copy keys, unit tests (proxy + web).
- `docs/fpl-api.md` note on what FPL does / does not provide for lineups.

### Out of scope

- **Any** paid third-party lineup or tactical feed — permanently excluded (not deferred).
- Separate tactical sub-rows (e.g. DM row above AM row) — FPL has four positions only;
  `4-2-3-1` displays as `4-5-1` with five players in one MID row, ordered L→R by flank.
- Confirmed post-match lineups as a standalone product.
- PRED-09 statistical model (xG/CS probabilities) — optional enrichment later.
- Free-tier preview of any team lineup (premium sees everything or nothing).
- Search across all 700+ players on one list.

## Backlog ID

**PRED-08** — Predicted lineups for all 20 PL teams

## Effort

**M–L** — new proxy aggregation + formation pipeline + full screen UI. No paid vendor; complexity
is in correct per-fixture formation logic and caching, not licensing.
