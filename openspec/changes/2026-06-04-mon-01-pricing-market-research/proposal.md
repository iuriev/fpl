# Proposal: Product monetisation & market positioning research (MON-01)

## Problem

Premium subscription flow (MON-01) needs evidence-based pricing, tier boundaries, and
positioning before implementation. Without a recorded market baseline, we risk underpricing
against fpl.team / Fantasy Football Scout or overpricing against free tools (Plan FPL,
LiveFPL, FPL Form).

## Solution

Capture and maintain a **canonical market research pack** in OpenSpec:

- Competitor pricing and feature parity (10 services, UK/EU/US focus)
- Recommended price models: season pass, annual, monthly
- ICP: who pays vs who stays on free tier
- Differentiation map: parity features vs net-new capabilities
- Brand naming exploration (separate from working title “FPL Squad Viewer”)

Deliverables for stakeholders:

- `docs/investor/product-overview.pdf` — investor-style product brief with visuals
- `docs/investor/competitive-analysis.pdf` — feature matrix and roadmap overlap
- `docs/investor/brand-naming-options.pdf` — naming shortlist and collision notes

## Scope

### In

- OpenSpec spec `product-monetization` (findings + scenarios for MON-01 tiers)
- Design doc with tier/pricing recommendations and freemium gates
- Investor PDFs (generated from HTML; screenshots from design export v3)
- Naming document with scored candidates and avoid-list (competitor collisions)

### Out

- Payment provider integration (Stripe, App Store IAP) — separate MON-01 implementation change
- Legal/tax advice for UK/EU/US subscriptions
- Trademark registration or domain purchases

## Success criteria

- Product owner can answer: “What should Season / Annual / Monthly cost?” with cited comparables
- Investors receive a single PDF overview without reading the whole backlog
- A preferred commercial name is shortlisted (top 3) with clear rationale

## References

- Backlog: MON-01, MON-02, MON-03, MGR-03, PRED-02, PRED-08, PRED-09
- External benchmarks: fpl.team, Fantasy Football Scout, Fantasy Football Fix, FPL Review,
  Fantasy Football Hub, FPL Focal, Plan FPL, LiveFPL, LazyFPL, ChatFPL (June 2026)
