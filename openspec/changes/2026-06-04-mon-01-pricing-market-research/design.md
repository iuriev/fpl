# Design: Monetisation strategy & positioning

## Product thesis

A **mobile-first FPL decision companion** for managers in the UK, Europe, and North America who
play competitive mini-leagues. The app unifies squad viewing, transfer planning, fixture
intelligence, predictions, and rival tracking in one fast UI — without replacing the official
FPL game or requiring paid data licences on day one.

**Positioning line:** “Plan the week, review the last one, and track the league — in one app.”

## Target markets

| Region | Primary acquisition | Notes |
| --- | --- | --- |
| United Kingdom | Core FPL audience; GBP pricing | Align with fpl.team / Scout price anchors |
| Europe | EUR display via Stripe; Patreon-style tolerance | FPL Review uses €/Patreon |
| North America | USD; growing FPL base | Price parity with UK (~$3–5/mo entry) |

No region-specific product fork in v1 — single English UI, global FPL API.

## Competitive price anchors (June 2026)

| Segment | Annual equivalent | Monthly (no commitment) |
| --- | --- | --- |
| Entry tool (fpl.team Wonderkid, FPL Focal) | £25–30/year | £2.49–2.99/mo |
| Mid tool (fpl.team Veteran, FF Fix Premium) | £38–50/year | £4.99–6.95/mo |
| Data-heavy (FFS Chief Scout) | £60/year | £10/mo |
| Optimiser (FPL Review Patreon) | ~£42/year (€3.50/mo) | Patreon monthly |
| Community/content (LazyFPL) | £50/year | £5/mo |

## Recommended tiers (MON-01 implementation)

### Free — “Assistant”

- Squad + GW navigation (public team ID or linked account)
- Transfer planner (local validation, save when signed in)
- Stats, leagues browser, fixtures calendar (core tabs)
- Price changes **All FPL** tab; predicted points **top 3 per position**
- Watchlist: 2 managers + 2 players
- Gameweek review (basic)

Goal: beat “open five tabs” without paywalling the planner.

### Premium — “Season Pass” (launch pricing)

| Billing | Price | Notes |
| --- | --- | --- |
| **Season (one-time)** | **£25** | Aug–May access; primary CTA for investors |
| **Annual** | **£29/year** | ~17% premium vs season for auto-renew cohort |
| **Monthly** | **£3.99/mo** | No discount vs annual — intentional |

Includes:

- Full predicted points lists (PRED-02)
- Price changes **My squad** + tonight likelihood
- Predicted lineups all 20 clubs (PRED-08 when shipped)
- Watchlist caps: 10 managers (MGR-03)
- Cloud transfer draft sync (PLAN-00) — market as cross-device
- Ad-free (if ads added to free tier later)

### Pro — “Edge” (after LIVE-01 + PLAN-02 or PRED-09)

| Billing | Price |
| --- | --- |
| Season | **£45** |
| Annual | **£48/year** |
| Monthly | **£5.99/mo** |

Adds: live rank, transfer solver / multi-GW optimiser, chip advisors, PRED-09 model outputs,
NL prediction explanations (PRED-10).

Do **not** launch Pro above £50/season until feature parity with fpl.team Veteran or FPL Review MILP.

## Freemium gates (align with shipped + backlog)

| Feature | Free | Premium | Pro |
| --- | --- | --- | --- |
| Predicted points | Top 3 + blur | Full list | + model xG/xA/CS |
| Predicted lineups | Locked | All teams | — |
| Price predictions | All players | My squad filter | — |
| Watchlist | 2+2 | 10 managers | — |
| Transfer solver | — | — | Yes |
| Live rank | — | — | Yes |
| Chip advisors | — | — | Yes |

## ICP

**Will pay:** top 50k-chasing managers, 2+ mini-leagues, weekly transfer tinkerers, rival trackers.

**Will not pay:** single casual league, “official app is enough”, managers already subscribed to
FPL Review + fpl.team stack (need bundle story or lower entry price).

**Willingness drivers (from community patterns):**

- Pay: solver, elite EO, live rank bundle, chip timing in DGW seasons, time saved
- Won’t pay: duplicate ep_next, content-only newsletters, ultra-high tiers without human touch

## Differentiation (investor narrative)

**Parity roadmap** (table stakes by end of 2026): multi-GW planning, predicted lineups, live
rank, transfer solver, chip strategy — matching fpl.team / FF Fix / FPL Review.

**Net-new angles:**

1. **Unified price intelligence** — actual risers/fallers + tonight heuristic + squad filter on one screen
2. **Gameweek review with transfer what-if** — post-deadline learning loop
3. **Dual watchlists** — managers and players in one mobile shell
4. **PRED-09** — calibrated GW model on free data only + visible `confidence` (trust UX)
5. **PRED-10** — plain-language “why this xPts” in player profile
6. **Mobile-first** — single app vs Scout articles + Fix extension + Review web

## Implementation notes for MON-01

- Stripe Checkout + Customer Portal; Apple/Google IAP later if native billing required
- `subscription_tier` on user row: `free` | `premium` | `pro`
- Season pass = `premium_until` = season end date (fixed GW38 + buffer)
- 7-day trial on annual only (match Scout/Fix norm)
- Pricing page in GBP; Stripe multi-currency settlement

## Investor materials

Generated under `docs/investor/` — see `README.md` for rebuild commands.
