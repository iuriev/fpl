# Investor & market materials

Generated documents for fundraising and MON-01 pricing decisions.

## PDFs

| File | Purpose |
| --- | --- |
| `pdf/product-overview.pdf` | Investor brief — product, market, model, roadmap |
| `pdf/competitive-analysis.pdf` | Competitor matrix, parity vs differentiation |
| `pdf/brand-naming-options.pdf` | Commercial naming shortlist |

## Rebuild

```bash
# 1. Capture app screenshots (starts dev server, signs in test user, team 72828)
node scripts/investor/capture-screenshots.mjs

# Optional: reuse running dev — INVESTOR_SKIP_DEV=1 npm run dev
# Custom auth: INVESTOR_SCREENSHOT_EMAIL / INVESTOR_SCREENSHOT_PASSWORD

# 2. Build PDFs (requires playwright — devDependency at repo root)
node scripts/investor/build-pdfs.mjs
```

Edit HTML sources in this folder, then rerun step 2.

## OpenSpec

Market research spec: `openspec/changes/2026-06-04-mon-01-pricing-market-research/`.

## Agent skills

| Skill | Output |
| --- | --- |
| `.claude/skills/investor-product-overview/` | `product-overview.html` + PDF |
| `.claude/skills/investor-competitive-analysis/` | `competitive-analysis.html` + PDF |

Invoke explicitly when refreshing investor materials (also mirrored under `.cursor/skills/`).
