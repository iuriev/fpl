# Tasks: Standardise FDR Difficulty Colours (DES-04)

## Task 1: Add FDR tokens to theme

**File:** `web/src/theme/colors_and_type.css`

- [x] Append the following block inside `:root`, after the existing colour groups:

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

---

## Task 2: Update FdrChip to use tokens

**File:** `web/src/components/ui/FdrChip/FdrChip.module.css`

- [x] Replace the five `.chip_dN` rules with token references:

  ```css
  .chip_d1 { background: var(--fpl-fdr-1-bg); color: var(--fpl-fdr-1-ink); }
  .chip_d2 { background: var(--fpl-fdr-2-bg); color: var(--fpl-fdr-2-ink); }
  .chip_d3 { background: var(--fpl-fdr-3-bg); color: var(--fpl-fdr-3-ink); }
  .chip_d4 { background: var(--fpl-fdr-4-bg); color: var(--fpl-fdr-4-ink); }
  .chip_d5 { background: var(--fpl-fdr-5-bg); color: var(--fpl-fdr-5-ink); }
  ```

- [x] Verify TypeScript passes: `cd web && npx tsc --noEmit`
- [x] Run tests: `cd web && npx vitest run src/components/ui/FdrChip --reporter=verbose`
