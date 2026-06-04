# Proposal: Predicted Points Screen (PRED-02)

## Problem

FPL managers need to know who is expected to score points next gameweek before making
transfers and captain decisions. There is no prediction-oriented screen in the app today.
The FPL API already provides `ep_next` — the official expected-points estimate per player
per next GW — but we expose it only as a sort column in the transfer planner, with no
dedicated discovery surface.

## Solution

A dedicated `/predicted-points` screen that ranks all FPL players by `ep_next` within
four position tabs (GK / DEF / MID / FWD).

**Free tier:** first 3 rows per position tab visible; rows 4–10 rendered but blurred with
a premium upsell overlay. Screen mount triggers `requestUpsell('predictions')` for
first-time free visitors (MON-02 cooldown applies).

**Premium tier:** all players in the selected position tab rendered progressively — first
20 on load, then 20 more per scroll batch via intersection observer.

Data source: the existing `/api/player-pool` endpoint (already returns `expectedPoints`
mapped from `ep_next`). No new proxy work needed for v1.

## User value

- Pre-deadline captain and transfer decisions in one focused screen.
- Monetisation hook: the list is visibly useful but gated — free users see enough to
  want more.
- Low effort: reuses cached player-pool data and existing premium infrastructure.

## Scope

### In

- Web: `PredictedPointsScreen` with GK/DEF/MID/FWD tabs, sorted by `expectedPoints`.
- Free tier: top 10 per tab — 3 visible rows, rows 4–10 blurred + `PremiumLockedOverlay` +
  `PremiumSheet` copy. `requestUpsell('predictions')` on mount.
- Premium tier: progressive render — 20 on load, +20 per scroll via `IntersectionObserver`.
- Route `/predicted-points` + `TeamInfoPanel` nav link.
- Row tap → `PlayerProfileSheet` (shared component from Price Changes).
- Tests: free blur, premium infinite list, tab switching, empty/loading states.

### Out of scope

- New proxy endpoint (player-pool reused as-is).
- Additional stats columns (xG, xA, cards) — deferred until PRED-09 statistical model is built.
- Search / name filter within the tab.
- Saving or comparing predictions across gameweeks.

## Backlog ID

**PRED-02** — Predicted points list screen (free: top 3, locked: rest)

## Effort

**M** (per backlog). All proxy work is already done; effort is entirely in the web screen,
progressive render, and premium UX.
