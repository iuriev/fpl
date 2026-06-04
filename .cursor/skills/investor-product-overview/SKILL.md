---
name: investor-product-overview
description: >-
  Builds or refreshes the investor product-overview brief (HTML + PDF) for the FPL
  companion app: market thesis, pricing tiers, shipped features, roadmap, and real app
  screenshots from dev. Use when the user asks for product overview, investor deck,
  business plan PDF, pitch document, or product brief for fundraising.
---

# Investor product overview

Produce **`docs/investor/product-overview.html`** and **`docs/investor/pdf/product-overview.pdf`** — an investor-facing brief that reads like a user journey, not a design spec.

**Do not** use design-export / brandbook screenshots. **Do** use live app screenshots from the dev server.

## Before writing

Read (in order):

1. `docs/backlog.md` — shipped ✅ section + P2/P3 roadmap
2. `docs/architecture.md` — stack and deployment
3. `openspec/changes/2026-06-04-mon-01-pricing-market-research/design.md` — pricing tiers (or latest MON-01 research)
4. `docs/investor/product-overview.html` — current draft (if exists)

Ask the user if missing:

- **Commercial brand name** (working title is often “FPL Squad Viewer”)
- **Audience** (default: UK / Europe / North America investors)
- **Omit** any features they do not want marketed (default: no region-specific payment experiments unless asked)

## Document goals

An investor should understand:

1. **Problem** — managers use 4–6 tools before each deadline
2. **Solution** — one mobile-first companion (plan → review → track rivals)
3. **Market** — TAM / SAM / SOM with conservative Year-1 revenue math
4. **Business model** — Free / Premium / Pro with GBP season + annual + monthly
5. **Product today** — screenshot gallery + capability table (shipped only)
6. **Roadmap** — monetised initiatives with realistic ETAs from backlog
7. **Moat & GTM** — BFF cache, spec-first delivery, community SEO (brief)
8. **Stage** — pre-revenue unless user says otherwise

**Tone:** English, confident, no hype without shipped proof. No betting/gambling framing.

## HTML structure

Edit `docs/investor/product-overview.html`. Reuse `docs/investor/investor.css`.

Required sections:

| Section | Content |
| --- | --- |
| Cover | Kicker, product name, one-line lead, meta (stack URL, brand note) |
| Executive summary | Problem / solution cards |
| Market | TAM, SAM, SOM (state assumptions) |
| Business model | Pricing table from MON-01 design |
| **The product experience** | Hero screenshot + `shot-grid` of 6–10 screens |
| Capabilities shipped | Table with `tag-shipped` only |
| Product roadmap | Monetised backlog IDs |
| Technology moat | 4 bullets max |
| Go-to-market | 4 bullets max |
| Use of funds | Illustrative % table (only if investor context) |
| Footer | Confidential + links to competitive-analysis PDF |

Screenshot filenames (after capture script):

`01-squad` … `10-player-watchlist` — see [reference.md](reference.md).

Each screenshot needs an investor caption: **what the user gets** and **why it matters** (not UI element lists).

## Screenshots workflow

1. Ensure proxy + web dev: `npm run dev` (or `INVESTOR_SKIP_DEV=1` if already running)
2. Capture: `node scripts/investor/capture-screenshots.mjs`
3. Build PDF: `node scripts/investor/build-pdfs.mjs`

Default team ID **72828** (`AGENTS.md`). Override with `FPL_TEAM_ID`.

If capture fails, fix auth/script — do not fall back to `design/exports/` images.

## Sync with OpenSpec (optional)

If pricing or positioning changed materially, update or propose:

`openspec/changes/<date>-mon-01-pricing-market-research/` — do not create duplicate research folders.

## Deliverables checklist

```
Product overview
- [ ] HTML updated in docs/investor/product-overview.html
- [ ] Screenshots refreshed (app, not design book)
- [ ] product-overview.pdf rebuilt
- [ ] User told paths: docs/investor/pdf/product-overview.pdf
```

Never `git commit` unless the user explicitly asks.

## Additional resources

- Screenshot routes and captions: [reference.md](reference.md)
- Rebuild commands: `docs/investor/README.md`
