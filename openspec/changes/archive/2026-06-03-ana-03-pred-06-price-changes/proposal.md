# Proposal: Price Changes & Predictions (ANA-03 + PRED-06)

## Problem

FPL managers check price rises and falls daily — often on third-party sites. Our app has no
dedicated view for global movers, no “likely tonight” guidance, and no way to see price
activity scoped to **their own squad**. PRED-06 was backlog-only; ANA-03 was underspecified.
Shipping both together avoids two nearly identical screens and establishes the first premium
gate beyond watchlist limits.

## Solution

One screen at `/price-changes` with two primary modes:

1. **Actual** (ANA-03) — players whose price already moved (this GW or since season start).
2. **Tonight** (PRED-06) — heuristic predictions of who is likely to rise or fall before the
   next price change window.

Both modes support:

- **All FPL** — full lists (free tier).
- **My squad** — filtered to the user’s 15 players (premium only; free users see blur + upsell).
- **Position filter** — All / GK / DEF / MID / FWD.
- **Risers / Fallers** (or Likely rise / Likely fall for predictions).
- Top **50** non-zero entries only (zeros excluded).

Tapping a row opens a **player profile sheet** (last finished GW stats when available, else
fixtures + price + ownership) with follow / unfollow.

## User value

- Daily habit: “who moved overnight?” without leaving the app.
- Planning: “will my player rise tonight?” before transferring.
- Premium: personal squad lens for price meta (monetisation before full MON-01 checkout).

## Scope

### In

- Proxy: extend bootstrap element fields; `price-changes-service`, `price-predictions-service`;
  `GET /api/price-changes`, `GET /api/price-predictions`; optional
  `GET /api/price-changes/squad` + predictions squad variant (auth + premium).
- `GET /api/players/:id/profile?gw=` — trimmed `element-summary` history for one GW + pool
  metadata (for profile sheet).
- Web: `PriceChangesScreen`, rows, filters, premium blur, `PlayerProfileSheet`, route, nav link,
  copy, tests.
- Premium seam: `subscriptionTier` on user (`free` | `premium`, default `free`) exposed on
  `GET /api/me`; client `useSubscriptionTier()` until MON-01 wires real billing.
- Docs: `docs/fpl-api.md` bootstrap price fields; backlog marks ANA-03 + PRED-06 done when shipped.

### Out of scope

- League-scoped filters (per user decision).
- Push notifications for price changes.
- Historical price-change timeline / charts.
- Third-party ML models or scraping external prediction sites.
- Real payment / Stripe (MON-01) — tier flag only.

## Backlog IDs

- **ANA-03** — Price change risers & fallers
- **PRED-06** — FPL Price Change Predictions table

## Effort note

Combined scope is **L** (was M + M). Single screen and shared proxy patterns; premium + profile
sheet + prediction heuristic add surface area.
