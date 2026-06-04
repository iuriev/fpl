---
name: investor-competitive-analysis
description: >-
  Researches FPL companion competitors, maps feature parity vs differentiation, and
  produces docs/investor/competitive-analysis.html plus PDF. Use when the user asks
  for competitive analysis, competitor comparison, market landscape, positioning vs
  fpl.team/Scout/Fix, or differentiation document for investors.
---

# Investor competitive analysis

Produce **`docs/investor/competitive-analysis.html`** and **`docs/investor/pdf/competitive-analysis.pdf`**.

Pair with **investor-product-overview** when the user wants a full investor pack; this skill focuses on **landscape and positioning**, not full business plan narrative.

## Before writing

Read:

1. `docs/backlog.md` — full feature list (shipped + planned)
2. `openspec/changes/2026-06-04-mon-01-pricing-market-research/specs/product-monetization/spec.md` — prior research baseline
3. `docs/investor/competitive-analysis.html` — current draft

**Refresh pricing** via web search if the document is older than one FPL season or user says “update prices”. Cite public pricing pages; note “as of [month year]”.

Default geography: **UK, Europe, North America** — English-language FPL tools.

## Research workflow

1. **Build competitor set** (minimum 8–10):

   | Tier | Examples |
   | --- | --- |
   | All-in-one | fpl.team, Fantasy Football Fix, Fantasy Football Hub |
   | Data / optimiser | FPL Review, Fantasy Football Scout, FPL Form |
   | Free anchors | Plan FPL, LiveFPL, FPL Focal (fpl.page) |
   | Adjacent | LazyFPL (content), ChatFPL.ai (AI-only) |

2. **For each competitor** record:

   - Price (entry premium, annual equiv, monthly)
   - Core promise (one line)
   - Overlap with our shipped features
   - What they have that we only have on roadmap

3. **Classify our features**:

   | Tag | Meaning |
   | --- | --- |
   | Shipped today | In codebase / backlog ✅ |
   | Parity roadmap | Table stakes we must match (LIVE, solver, lineups, chips) |
   | Net-new | Genuinely rare combined UX — verify with search |

4. **Win / loss ICP** — who pays us vs who stays on free stack

See [reference.md](reference.md) for differentiation candidates and avoid claiming uniqueness without evidence.

## Document structure

Edit `docs/investor/competitive-analysis.html` + `investor.css`.

| Section | Content |
| --- | --- |
| Cover | Title + lead |
| Competitor set | Numbered table: name, price, promise |
| Feature matrix | Us vs 5–7 key competitors; tags shipped / roadmap / new |
| **Parity roadmap** | What we will match (bullet list) |
| **Net-new** | Table: capability, why it matters, competitor gap |
| **Will not prioritise** | Editorial, elite reveals, WhatsApp communities — why |
| Pricing position | Segment table + 4 app screenshots (not design book) |
| Win / loss | Two cards |
| Strategic takeaway | 1 short paragraph |

Use **real app screenshots** (`01-squad`, `02-transfers`, `04-price-changes`, `06-gameweek-review`) — run capture script if missing.

## OpenSpec sync

If research changes recommended pricing or tier boundaries:

- Update `openspec/changes/2026-06-04-mon-01-pricing-market-research/` (spec + design), or
- Propose new dated change via `openspec-propose` — **do not** duplicate ad-hoc markdown plans outside `openspec/` and `docs/backlog.md`.

## Scripts

```bash
npm run dev                                    # if needed
INVESTOR_SKIP_DEV=1 node scripts/investor/capture-screenshots.mjs
node scripts/investor/build-pdfs.mjs
```

## Deliverables checklist

```
Competitive analysis
- [ ] Web research done (prices + 1-line promises)
- [ ] HTML matrix updated
- [ ] Parity vs net-new sections accurate vs backlog
- [ ] App screenshots in doc (not design exports)
- [ ] competitive-analysis.pdf rebuilt
```

Never `git commit` unless the user explicitly asks.

## Additional resources

- Competitor anchors and differentiation list: [reference.md](reference.md)
- Canonical spec: `openspec/changes/2026-06-04-mon-01-pricing-market-research/specs/product-monetization/spec.md`
