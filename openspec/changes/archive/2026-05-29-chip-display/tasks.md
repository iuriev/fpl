# Tasks: Display Active Chip (CHIP-01)

## Task 1: Add active_chip to FPLPicks

**File:** `proxy/src/fpl-client.ts`

- [x] Add `active_chip: string | null` field to `FPLPicks` interface.

---

## Task 2: Add ActiveChip type + update SquadResponse in proxy

**File:** `proxy/src/types.ts`

- [x] Add `export type ActiveChip = 'wildcard' | '3xc' | 'freehit' | 'bboost' | null;`
- [x] Add `activeChip: ActiveChip` to `SquadResponse`.

---

## Task 3: Extract activeChip in squad-service

**File:** `proxy/src/squad-service.ts`

- [x] Add `toActiveChip(raw: string | null): ActiveChip` helper that allowlists the four
  known values and coerces anything else to `null`.
- [x] Pass `activeChip: toActiveChip(picks.active_chip)` in the returned `SquadResponse`.

---

## Task 4: Update proxy tests

**File:** `proxy/src/squad-service.test.ts`

- [x] Add assertion that `activeChip` is propagated when `active_chip` is a known value.
- [x] Add assertion that an unknown `active_chip` string is coerced to `null`.

---

## Task 5: Mirror types in web

**File:** `web/src/types/index.ts`

- [x] Add `export type ActiveChip = 'wildcard' | '3xc' | 'freehit' | 'bboost' | null;`
- [x] Add `activeChip: ActiveChip` to `SquadResponse`.

---

## Task 6: Add chip colour tokens

**File:** `web/src/theme/colors_and_type.css`

- [x] Add inside `:root` after the FDR palette block:
  ```css
  /* ── active chip palette ────────────────────────────────────────── */
  --fpl-chip-wc-bg:  rgba(255, 192, 0, 0.14);
  --fpl-chip-wc-ink: #ffc000;
  --fpl-chip-tc-bg:  rgba(255, 77, 109, 0.14);
  --fpl-chip-tc-ink: #ff4d6d;
  --fpl-chip-fh-bg:  rgba(34, 211, 238, 0.14);
  --fpl-chip-fh-ink: #22d3ee;
  --fpl-chip-bb-bg:  rgba(0, 255, 135, 0.14);
  --fpl-chip-bb-ink: #00ff87;
  ```

---

## Task 7: Add chip copy strings

**File:** `web/src/lib/copy.ts`

- [x] Add to the `copy` object:
  ```ts
  chipActiveSuffix:   'ACTIVE',
  chipWildcard:       'Wildcard',
  chipTripleCaptain:  'Triple Captain',
  chipFreeHit:        'Free Hit',
  chipBenchBoost:     'Bench Boost',
  ```

---

## Task 8: Create ChipBadge component

**Files:** `web/src/components/ui/ChipBadge/ChipBadge.tsx` + `ChipBadge.module.css`

- [x] Create `ChipBadge.tsx` with:
  - Four inline SVG icon sub-components (WildcardIcon, TripleCaptainIcon, FreeHitIcon, BenchBoostIcon).
  - `CHIP_CONFIG` map keyed by `ActiveChip` value with `{ label, Icon, cssVar }`.
  - `ChipBadge` component: returns `null` for `chip === null`; otherwise renders banner.
- [x] Create `ChipBadge.module.css` with:
  - `.badge`: base banner layout (flex, padding, border-radius, border-left accent).
  - `.wildcard`, `.3xc`, `.freehit`, `.bboost` modifier classes using CSS token pairs.
  - `.icon`: icon wrapper sizing.
  - `.label`: uppercase caption typography.

---

## Task 9: Create ChipBadge tests

**File:** `web/src/components/ui/ChipBadge/ChipBadge.test.tsx`

- [x] Returns null for `chip={null}`.
- [x] Renders correct label for each chip value (`wildcard`, `3xc`, `freehit`, `bboost`).
- [x] Each chip renders a modifier CSS class matching the chip value.
- [x] Run: `cd web && npx vitest run src/components/ui/ChipBadge --reporter=verbose`

---

## Task 10: Wire ChipBadge into SquadScreen

**File:** `web/src/screens/SquadScreen/SquadScreen.tsx`

- [x] Import `ChipBadge`.
- [x] Inside the `summaryWrap` block, render `<ChipBadge chip={squad.activeChip} />` above
  `<SummaryStrip>`.
- [x] Verify TypeScript: `cd web && npx tsc --noEmit`
- [x] Run all tests: `cd web && npx vitest run --reporter=verbose`
