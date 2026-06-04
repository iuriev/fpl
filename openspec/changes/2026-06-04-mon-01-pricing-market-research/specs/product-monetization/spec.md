# Spec: Product monetisation & market research

Capability: product-monetization (research artifact — informs MON-01 implementation).

## Market research findings

Research date: **June 2026**. Currency: **GBP** unless noted. Audience: UK, Europe, North America.

### Competitor pricing summary

| Product | Model | Entry premium | Mid / Pro | Season (~9 mo) equiv. |
| --- | --- | --- | --- | --- |
| fpl.team | 2-tier freemium | £2.08/mo annual (Wonderkid) | £4.16/mo annual (Veteran) | £25 / £50 |
| Fantasy Football Scout | Free + Chief Scout | £5/mo annual (£60/yr) | — | £60 |
| Fantasy Football Fix | Trial + tiers | £3.15/mo annual (~£38) | £3.95/mo Plus (~£47); £295 lifetime | £38–47 |
| FPL Review | Patreon | €3.50/mo (~£3–4) | — | ~£36–42 |
| Fantasy Football Hub | 3-tier | £4.98/mo annual (~£60) | £7.98 Pro (~£96) | £60–96 |
| FPL Focal (fpl.page) | Cosmetic premium | £2.99/mo or £29.99/yr | — | £30 |
| Plan FPL | Free | £0 | — | £0 |
| LiveFPL | Free (ads) | £0 | — | £0 |
| LazyFPL | Content | £5/mo or £50/yr | — | £50 |
| ChatFPL.ai | AI usage | £7.99/mo (100 msgs) | £14.99 (500 msgs) | £96–180 |
| FPL Form | Donation | £0 (tools free) | — | £0 |

Sources: public pricing pages (fpl.team, fantasyfootballscout.co.uk, fantasyfootballfix.com,
patreon.com/fplreview, fantasyfootballhub.co.uk, fpl.page); aggregator footyapps.com guide.

### Recommended pricing (this product)

| Model | Premium | Pro (future) |
| --- | --- | --- |
| Season one-time | **£25** | **£45** |
| Annual auto-renew | **£29/year** | **£48/year** |
| Monthly | **£3.99/mo** | **£5.99/mo** |

Rationale: Premium aligns with fpl.team Wonderkid + FPL Focal; Pro reserved until live rank +
solver + proprietary model ship.

### Feature parity vs differentiation

#### Shipped today (competitive baseline)

- Squad viewer (pitch + list), GW navigation, summary strip, chips display
- Transfer planner with validation, cloud draft (authenticated)
- My Stats, leagues, league participants browser, top players
- Gameweek review, fixtures calendar (FDR, DGW/BGW, recovery)
- Predicted points (ep_next, freemium top-3), price changes (actual + tonight)
- DEFCON/BPS leaderboard, manager + player watchlists (freemium limits)
- Auth (email + Google), premium upsell dialog

#### Backlog — parity with paid incumbents

| Backlog ID | Feature | Primary competitor |
| --- | --- | --- |
| LIVE-01/02 | Live rank, live mini-leagues | fpl.team, LiveFPL, FF Fix |
| PRED-08 | Predicted lineups (20 teams) | fpl.team, FF Fix, Drafthound |
| PLAN-02 | Transfer solver | fpl.team, FPL Review |
| CHIP-03–06 | Chip advisors | fpl.team, FPL Review |
| PRED-05/07 | CS%, xG/xA screens | FFS Opta, fplukraine-style markets |
| PRED-09 | Statistical xPts model | FPL Review, FPL Form |
| AI-01 | AI analyst chat | fpl.team, ChatFPL, FF Hub |
| ANA-08/09 | Captain / transfer analyzers | Retrospective tools (FPL Review season review) |

#### Differentiated (not commodity)

- Combined **price changes** (season/GW actual + tonight predictions + premium squad filter)
- **Gameweek review** with transfer what-if in mobile-first UX
- **Dual watchlists** (managers + players) with synced backend
- **PRED-09 + PRED-10**: confidence-scored model + natural-language prediction rationale
- **Recovery calendar** in fixtures (rotation planning narrative)
- **Help tour** on transfer screen (onboarding quality; supports conversion, not a paid feature)

### ICP scenarios

#### Scenario: Competitive mini-league manager pays for Premium

- **GIVEN** a manager with overall rank ambition and 3+ active mini-leagues
- **WHEN** they use predicted points and price-change tools weekly before the deadline
- **THEN** a £25 season pass is justified vs subscribing to two separate tools (focal + spreadsheet)

#### Scenario: Casual manager stays on free

- **GIVEN** a manager with one work league and fewer than 5 transfers per season
- **WHEN** they open the app for live points during matches
- **THEN** free squad view + LiveFPL satisfy them and conversion to Premium is unlikely

#### Scenario: Data-heavy manager needs Pro

- **GIVEN** a manager already paying for FPL Review MILP
- **WHEN** this product lacks transfer solver and elite ownership data
- **THEN** they only switch if Pro tier offers comparable optimiser OR lower bundled price

### Community payment sentiment (synthesis)

- **Pay for:** optimisers, elite reveals, live rank + rivals, defensible xP, time savings
- **Avoid paying for:** duplicate official stats, another ep_next table, content-only subscriptions
- **Churn drivers:** auto-renew without reminder (noted for Scout), site downtime, overlapping tools

## Requirements for MON-01 implementation (downstream)

When implementing payment flow, the system SHALL:

- Expose `free`, `premium`, and `pro` tiers on the user record
- Enforce gates documented in `design.md` freemium table
- Display GBP prices with Stripe multi-currency checkout
- Offer season pass as one-time product with explicit end date
- Provide 7-day trial on annual Premium only
