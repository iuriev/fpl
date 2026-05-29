# Design: Standardise FDR Difficulty Colours (DES-04)

## Current state

`FdrChip.module.css` has five hardcoded hex pairs (`.chip_d1`–`.chip_d5`). No CSS variables
exist for FDR colours anywhere in the theme. The current d3 is yellow (`#e8c347`) which reads
as "warning" rather than neutral; d2 is `#00ff87` (the accent green) which clashes with the
accent and doesn't signal "easy fixture" clearly.

## Approach

Two-file change:

1. **Add tokens to `colors_and_type.css`** — ten new custom properties in `:root`.
2. **Update `FdrChip.module.css`** — replace hex literals with the new tokens.

No component logic changes. No new files.

---

## Token Definitions

Add to `:root` in `web/src/theme/colors_and_type.css`:

```css
/* ── FDR difficulty palette (fplukraine.com) ────────────────────── */
--fpl-fdr-1-bg:  #375523;
--fpl-fdr-1-ink: #b8e88a;
--fpl-fdr-2-bg:  #6ec25a;
--fpl-fdr-2-ink: #0e2408;
--fpl-fdr-3-bg:  #c8c8c8;
--fpl-fdr-3-ink: #1a1a1a;
--fpl-fdr-4-bg:  #e84040;
--fpl-fdr-4-ink: #ffffff;
--fpl-fdr-5-bg:  #730c18;
--fpl-fdr-5-ink: #ffb8b8;
```

Rationale per level:
- **d1** (`#375523` / `#b8e88a`): unchanged from current — dark forest green, already correct.
- **d2** (`#6ec25a` / `#0e2408`): softer medium green instead of the neon accent `#00ff87`.
  Makes d2 clearly "easier than d3" without hijacking the app's accent colour.
- **d3** (`#c8c8c8` / `#1a1a1a`): neutral grey replaces yellow. Grey means "average/unknown",
  not "caution".
- **d4** (`#e84040` / `#ffffff`): pure red replaces orange-red `#e8604c`. Clearer "hard".
- **d5** (`#730c18` / `#ffb8b8`): unchanged — dark maroon already correct.

---

## Updated FdrChip.module.css

Replace the five `.chip_dN` rules:

```css
.chip_d1 { background: var(--fpl-fdr-1-bg); color: var(--fpl-fdr-1-ink); }
.chip_d2 { background: var(--fpl-fdr-2-bg); color: var(--fpl-fdr-2-ink); }
.chip_d3 { background: var(--fpl-fdr-3-bg); color: var(--fpl-fdr-3-ink); }
.chip_d4 { background: var(--fpl-fdr-4-bg); color: var(--fpl-fdr-4-ink); }
.chip_d5 { background: var(--fpl-fdr-5-bg); color: var(--fpl-fdr-5-ink); }
```

---

## Component Impact

| File | Change |
|---|---|
| `web/src/theme/colors_and_type.css` | Add 10 `--fpl-fdr-*` tokens |
| `web/src/components/ui/FdrChip/FdrChip.module.css` | Replace hex literals with tokens |

No TypeScript changes. No test changes (FdrChip tests assert class names, not computed colours).
