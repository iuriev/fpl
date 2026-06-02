# Chip Blocked Toast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user taps a used chip button in the Transfer Planner, show a bottom toast explaining when that chip was played.

**Architecture:** Extend `ChipStatuses` to carry `usedInGw` alongside the existing `status` string. The proxy already has the data (`FPLHistoryChip.event`) — it just doesn't surface it. On the frontend, replace the `disabled` attribute on used chip buttons with a click handler that fires a toast via the unified toast state already present in `TransferScreen`.

**Tech Stack:** TypeScript (proxy + web), React, Vitest/Testing Library

---

## File Map

| File | Change |
|------|--------|
| `proxy/src/types.ts` | Add `ChipInfo`, rewrite `ChipStatuses` |
| `web/src/types/index.ts` | Same |
| `proxy/src/squad-service.ts` | Rewrite `computeChipStatuses` to return `ChipInfo` |
| `proxy/src/squad-service.test.ts` | Update all `ChipStatuses` assertions |
| `web/src/fixtures/index.ts` | Update `chipStatuses` literal objects |
| `web/src/lib/copy.ts` | Add `chipBlockedUsed` + `chipBlockedNoGw` |
| `web/src/screens/TransferScreen/TransferHeader.tsx` | Remove `disabled`, add `onChipBlocked` + `handleChipClick` |
| `web/src/screens/TransferScreen/TransferScreen.tsx` | Rename `staleToast`→`toast`, update chip-init effect, wire `handleChipBlocked` |
| `web/src/screens/TransferScreen/TransferScreen.test.tsx` | Update fixtures; replace disabled test with toast test |
| `web/src/screens/TransferScreen/TransferPositionLogic.test.tsx` | Update fixture |

---

### Task 1: Update shared types in proxy and web

**Files:**
- Modify: `proxy/src/types.ts`
- Modify: `web/src/types/index.ts`

- [ ] **Step 1: Update `proxy/src/types.ts`**

Replace the `ChipStatus` / `ChipStatuses` block (around lines 103–109):

```typescript
export type ChipStatus = 'available' | 'used' | 'active';

export interface ChipInfo {
  status: ChipStatus;
  usedInGw?: number;
}

export interface ChipStatuses {
  wildcard: ChipInfo;
  freehit: ChipInfo;
  bboost: ChipInfo;
  '3xc': ChipInfo;
}
```

- [ ] **Step 2: Apply the identical change to `web/src/types/index.ts`**

Same block — replace `ChipStatus` / `ChipStatuses` with the version above (lines 90–97 in that file).

- [ ] **Step 3: Verify TypeScript compilation in proxy**

```bash
cd proxy && npx tsc --noEmit
```
Expected: errors about `computeChipStatuses` and usages — these are fixed in Tasks 2–4.

- [ ] **Step 4: Commit**

```bash
git add proxy/src/types.ts web/src/types/index.ts
git commit -m "feat(types): extend ChipStatuses to carry usedInGw per chip"
```

---

### Task 2: Rewrite `computeChipStatuses` in proxy

**Files:**
- Modify: `proxy/src/squad-service.ts`

- [ ] **Step 1: Update the import line at the top of `squad-service.ts`**

Add `ChipInfo` to the import from `./types`:

```typescript
import {
  ActiveChip,
  ChipInfo,
  ChipStatus,
  ChipStatuses,
  // ... rest of imports unchanged
} from './types';
```

- [ ] **Step 2: Replace `computeChipStatuses` body**

```typescript
export function computeChipStatuses(
  activeChip: ActiveChip,
  playedChips: FPLHistoryChip[],
  bootstrapChips: FPLBootstrapStatic['chips'],
  currentGw: number,
): ChipStatuses {
  const played = (name: string) => playedChips.filter((c) => c.name === name);

  const wcWindows = bootstrapChips.filter((c) => c.name === 'wildcard');
  const currentWindow = wcWindows.find(
    (w) => currentGw >= w.start_event && currentGw <= w.stop_event,
  );
  const wcPlayInWindow = currentWindow
    ? played('wildcard').find(
        (c) => c.event >= currentWindow.start_event && c.event <= currentWindow.stop_event,
      )
    : undefined;

  function chipInfo(name: string, windowOverride?: { used: boolean; event?: number }): ChipInfo {
    if (activeChip === name) return { status: 'active' };
    if (windowOverride !== undefined) {
      return windowOverride.used
        ? { status: 'used', usedInGw: windowOverride.event }
        : { status: 'available' };
    }
    const plays = played(name);
    if (plays.length > 0) return { status: 'used', usedInGw: plays[plays.length - 1].event };
    return { status: 'available' };
  }

  return {
    wildcard: chipInfo('wildcard', { used: !!wcPlayInWindow, event: wcPlayInWindow?.event }),
    freehit:  chipInfo('freehit'),
    bboost:   chipInfo('bboost'),
    '3xc':    chipInfo('3xc'),
  };
}
```

- [ ] **Step 3: Verify proxy compiles**

```bash
cd proxy && npx tsc --noEmit
```
Expected: remaining errors only in test file (fixed in Task 3).

---

### Task 3: Update proxy tests

**Files:**
- Modify: `proxy/src/squad-service.test.ts`

- [ ] **Step 1: Update `includes chipStatuses in the response` test** (around line 327)

Replace the four `.toBe(...)` assertions:

```typescript
expect(result.chipStatuses.wildcard).toEqual({ status: 'active' });
expect(result.chipStatuses.freehit).toEqual({ status: 'available' });
expect(result.chipStatuses.bboost).toEqual({ status: 'available' });
expect(result.chipStatuses['3xc']).toEqual({ status: 'available' });
```

- [ ] **Step 2: Update `computeChipStatuses` unit tests** (around lines 365–403)

```typescript
it('returns active for the current active chip', () => {
  const result = squadService.computeChipStatuses('wildcard', [], wcWindows, 10);
  expect(result.wildcard).toEqual({ status: 'active' });
  expect(result.freehit).toEqual({ status: 'available' });
  expect(result.bboost).toEqual({ status: 'available' });
  expect(result['3xc']).toEqual({ status: 'available' });
});

it('returns used with usedInGw for a chip played this season (non-wildcard)', () => {
  const played = [{ name: 'freehit', event: 5, time: '2025-01-05T12:00:00Z' }];
  const result = squadService.computeChipStatuses(null, played, wcWindows, 10);
  expect(result.freehit).toEqual({ status: 'used', usedInGw: 5 });
  expect(result.bboost).toEqual({ status: 'available' });
});

it('marks wildcard used with usedInGw when played in the current window', () => {
  const played = [{ name: 'wildcard', event: 8, time: '2025-01-08T12:00:00Z' }];
  const result = squadService.computeChipStatuses(null, played, wcWindows, 10);
  expect(result.wildcard).toEqual({ status: 'used', usedInGw: 8 });
});

it('keeps wildcard available in second window when only first was used', () => {
  const played = [{ name: 'wildcard', event: 8, time: '2025-01-08T12:00:00Z' }];
  const result = squadService.computeChipStatuses(null, played, wcWindows, 25);
  expect(result.wildcard).toEqual({ status: 'available' });
});

it('returns available for all chips when nothing played and no active chip', () => {
  const result = squadService.computeChipStatuses(null, [], wcWindows, 15);
  expect(result).toEqual({
    wildcard: { status: 'available' },
    freehit:  { status: 'available' },
    bboost:   { status: 'available' },
    '3xc':    { status: 'available' },
  });
});

it('active takes precedence over used (chip replayed edge case)', () => {
  const played = [{ name: 'bboost', event: 3, time: '2025-01-03T12:00:00Z' }];
  const result = squadService.computeChipStatuses('bboost', played, wcWindows, 10);
  expect(result.bboost).toEqual({ status: 'active' });
});
```

- [ ] **Step 3: Run proxy tests**

```bash
cd proxy && npx vitest run
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add proxy/src/squad-service.ts proxy/src/squad-service.test.ts
git commit -m "feat(proxy): computeChipStatuses returns ChipInfo with usedInGw"
```

---

### Task 4: Update web fixtures and DEFAULT_CHIP_STATUSES

**Files:**
- Modify: `web/src/fixtures/index.ts`
- Modify: `web/src/screens/TransferScreen/TransferScreen.tsx` (DEFAULT_CHIP_STATUSES constant only)
- Modify: `web/src/screens/TransferScreen/TransferPositionLogic.test.tsx`

- [ ] **Step 1: Update both `chipStatuses` objects in `web/src/fixtures/index.ts`** (lines 57 and 288)

Replace every:
```typescript
chipStatuses: { wildcard: 'available', freehit: 'available', bboost: 'available', '3xc': 'available' },
```
with:
```typescript
chipStatuses: {
  wildcard: { status: 'available' },
  freehit:  { status: 'available' },
  bboost:   { status: 'available' },
  '3xc':    { status: 'available' },
},
```

- [ ] **Step 2: Update `DEFAULT_CHIP_STATUSES` in `TransferScreen.tsx`** (lines 50–55)

```typescript
const DEFAULT_CHIP_STATUSES: ChipStatuses = {
  wildcard: { status: 'available' },
  freehit:  { status: 'available' },
  bboost:   { status: 'available' },
  '3xc':    { status: 'available' },
};
```

- [ ] **Step 3: Update fixture in `TransferPositionLogic.test.tsx`** (line 28)

```typescript
chipStatuses: {
  wildcard: { status: 'available' },
  freehit:  { status: 'available' },
  bboost:   { status: 'available' },
  '3xc':    { status: 'available' },
},
```

- [ ] **Step 4: Update chip-init effect in `TransferScreen.tsx`** (lines 134–140)

```typescript
const s = squadData.chipStatuses;
const initial: PlanChip =
  s.wildcard.status === 'active' ? 'wildcard' :
  s.freehit.status  === 'active' ? 'freehit'  :
  s.bboost.status   === 'active' ? 'bboost'   :
  s['3xc'].status   === 'active' ? '3xc'      :
  'none';
```

- [ ] **Step 5: Verify web TypeScript**

```bash
cd web && npx tsc --noEmit
```
Expected: errors only in `TransferHeader.tsx` (fixed in Task 6).

- [ ] **Step 6: Commit**

```bash
git add web/src/fixtures/index.ts web/src/screens/TransferScreen/TransferScreen.tsx web/src/screens/TransferScreen/TransferPositionLogic.test.tsx
git commit -m "feat(web): update chipStatuses fixtures and chip-init effect for ChipInfo shape"
```

---

### Task 5: Add copy strings

**Files:**
- Modify: `web/src/lib/copy.ts`

- [ ] **Step 1: Add two new strings to the `copy` object**, after `chipUsedAriaLabel`:

```typescript
chipBlockedUsed:  '{name} already played in GW{gw}',
chipBlockedNoGw:  '{name} already played this season',
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/copy.ts
git commit -m "feat(copy): add chip blocked toast messages"
```

---

### Task 6: Rewrite `TransferHeader` chip buttons

**Files:**
- Modify: `web/src/screens/TransferScreen/TransferHeader.tsx`

- [ ] **Step 1: Add `onChipBlocked` to the props interface**

```typescript
export interface TransferHeaderProps {
  bank: number;
  freeTransfers: number;
  cost: number;
  planChip: PlanChip;
  chipStatuses: ChipStatuses;
  nextGw: number | null;
  onBack: () => void;
  onChipToggle: (chip: PlanChip) => void;
  onChipBlocked: (chip: PlanChip, usedInGw?: number) => void;
  onFreeTransfersChange: (n: number) => void;
}
```

- [ ] **Step 2: Destructure `onChipBlocked` in the component body**

```typescript
export const TransferHeader: React.FC<TransferHeaderProps> = ({
  bank,
  freeTransfers,
  cost,
  planChip,
  chipStatuses,
  nextGw,
  onBack,
  onChipToggle,
  onChipBlocked,
  onFreeTransfersChange,
}) => {
```

- [ ] **Step 3: Replace `chipIsUsed` + `chipBtnClass` with updated versions**

Remove the old `chipIsUsed` helper entirely. Update `chipBtnClass`:

```typescript
function chipBtnClass(name: PlanChip): string {
  const classes = [styles.chipBtn];
  if (planChip === name) classes.push(styles.chipBtn_active);
  const key = name as keyof ChipStatuses;
  if (name !== 'none' && chipStatuses[key].status === 'used') classes.push(styles.chipBtn_used);
  return classes.join(' ');
}
```

- [ ] **Step 4: Add `handleChipClick`**

```typescript
function handleChipClick(chip: PlanChip) {
  const key = chip as keyof ChipStatuses;
  if (chipStatuses[key].status === 'used') {
    onChipBlocked(chip, chipStatuses[key].usedInGw);
  } else {
    onChipToggle(chip);
  }
}
```

- [ ] **Step 5: Update the four chip buttons**

Remove `disabled` and `aria-label` overrides. Use `handleChipClick`:

```tsx
<button
  className={chipBtnClass('wildcard')}
  onClick={() => handleChipClick('wildcard')}
  aria-pressed={planChip === 'wildcard'}
>
  {copy.transfersWildcard}
</button>
<button
  className={chipBtnClass('freehit')}
  onClick={() => handleChipClick('freehit')}
  aria-pressed={planChip === 'freehit'}
>
  {copy.transfersFreeHit}
</button>
<button
  className={chipBtnClass('bboost')}
  onClick={() => handleChipClick('bboost')}
  aria-pressed={planChip === 'bboost'}
>
  {copy.transfersBenchBoost}
</button>
<button
  className={chipBtnClass('3xc')}
  onClick={() => handleChipClick('3xc')}
  aria-pressed={planChip === '3xc'}
>
  {copy.transfersTripleCaptain}
</button>
```

- [ ] **Step 6: Verify web TypeScript**

```bash
cd web && npx tsc --noEmit
```
Expected: only `TransferScreen.tsx` errors about missing `onChipBlocked` prop.

---

### Task 7: Wire toast in `TransferScreen`

**Files:**
- Modify: `web/src/screens/TransferScreen/TransferScreen.tsx`

- [ ] **Step 1: Add `CHIP_LABELS` to the import from `ChipBadge`**

```typescript
import { CHIP_LABELS } from '@/components/ui/ChipBadge/ChipBadge';
```

- [ ] **Step 2: Rename `staleToast` → `toast` throughout the file**

Replace all occurrences of `staleToast` / `setStaleToast` with `toast` / `setToast` (there are ~5 occurrences — the state declaration, the `useEffect`, the setter call, and the JSX render).

State declaration (was line 74):
```typescript
const [toast, setToast] = useState<string | null>(null);
```

useEffect (was lines 109–113):
```typescript
useEffect(() => {
  if (!toast) return;
  const t = setTimeout(() => setToast(null), 4000);
  return () => clearTimeout(t);
}, [toast]);
```

Setter call (was line 99):
```typescript
setToast(interpolate(copy.transfersStaleToast, { n: prev.targetGw }));
```

JSX render (was lines 413–416):
```tsx
{toast && (
  <div className={styles.toast} role="status">
    {toast}
  </div>
)}
```

- [ ] **Step 3: Add `handleChipBlocked`**

Place it after the `useEffect` for the toast:

```typescript
function handleChipBlocked(chip: PlanChip, usedInGw?: number) {
  const name = chip !== 'none' ? CHIP_LABELS[chip as keyof typeof CHIP_LABELS] : chip;
  const msg = usedInGw !== undefined
    ? interpolate(copy.chipBlockedUsed, { name, gw: usedInGw })
    : interpolate(copy.chipBlockedNoGw, { name });
  setToast(msg);
}
```

- [ ] **Step 4: Pass `onChipBlocked` to `TransferHeader`**

Find the `<TransferHeader` JSX block and add the prop:
```tsx
onChipBlocked={handleChipBlocked}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add web/src/screens/TransferScreen/TransferHeader.tsx web/src/screens/TransferScreen/TransferScreen.tsx
git commit -m "feat(TransferScreen): show toast with GW when used chip button is tapped"
```

---

### Task 8: Update web tests

**Files:**
- Modify: `web/src/screens/TransferScreen/TransferScreen.test.tsx`

- [ ] **Step 1: Update all inline `chipStatuses` fixture objects**

In `TransferScreen.test.tsx`, there are three inline `chipStatuses` literals (lines 49, 142, 153). Update each:

Line 49 (default):
```typescript
chipStatuses: {
  wildcard: { status: 'available' },
  freehit:  { status: 'available' },
  bboost:   { status: 'available' },
  '3xc':    { status: 'available' },
},
```

Line 142 (wildcard active test):
```typescript
chipStatuses: {
  wildcard: { status: 'active' },
  freehit:  { status: 'available' },
  bboost:   { status: 'available' },
  '3xc':    { status: 'available' },
},
```

Line 153 (freehit used test) — **replace the entire test**:

```typescript
it('shows toast when a used chip button is tapped', async () => {
  const user = userEvent.setup();
  mockState.squad = {
    ...SQUAD_DATA,
    chipStatuses: {
      wildcard: { status: 'available' },
      freehit:  { status: 'used', usedInGw: 7 },
      bboost:   { status: 'available' },
      '3xc':    { status: 'available' },
    },
  };
  mockState.pool = { players: POOL_PLAYERS };
  renderScreen();
  const fhBtn = screen.getByRole('button', { name: 'FH' });
  expect(fhBtn).not.toBeDisabled();
  await user.click(fhBtn);
  expect(await screen.findByRole('status')).toHaveTextContent('Free Hit already played in GW7');
});
```

- [ ] **Step 2: Run web tests**

```bash
cd web && npx vitest run
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add web/src/screens/TransferScreen/TransferScreen.test.tsx web/src/screens/TransferScreen/TransferPositionLogic.test.tsx
git commit -m "test(TransferScreen): update chip fixtures to ChipInfo; add chip blocked toast test"
```
