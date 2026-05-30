# Design: Chip-Aware Transfer Planner (CHIP-02)

## Overview

Five-layer change: FPL client (new history fetch + bootstrap chips shape) → squad service
(chip status computation) → shared types → frontend state (auto-pre-select) → TransferHeader
UI (four buttons, status-driven styling).

No new proxy endpoints. The history fetch is added as an internal call inside `getSquad`.

---

## 1. Proxy: FPL client (`proxy/src/fpl-client.ts`)

### 1.1 Extend `FPLBootstrapStatic` with `chips[]`

The bootstrap-static `chips[]` array defines availability windows per chip, including the
two Wildcard windows. Add to the existing interface:

```ts
export interface FPLBootstrapStatic {
  // … existing fields …
  chips: Array<{
    chip_type: string;
    name: string;       // 'wildcard' | '3xc' | 'freehit' | 'bboost'
    start_event: number;
    stop_event: number;
  }>;
}
```

### 1.2 Add `FPLHistory` type and `getEntryHistory` function

```ts
export interface FPLHistoryChip {
  name: string;   // e.g. 'wildcard'
  event: number;  // GW it was played
  time: string;   // ISO timestamp
}

export interface FPLHistory {
  chips: FPLHistoryChip[];
}

export async function getEntryHistory(teamId: number): Promise<FPLHistory> {
  const url = `${FPL_BASE_URL}/entry/${teamId}/history/`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`FPL history ${response.status}`);
  return response.json() as Promise<FPLHistory>;
}
```

---

## 2. Shared types (`proxy/src/types.ts` and `web/src/types/index.ts`)

### 2.1 New types (both files)

```ts
export type ChipStatus = 'available' | 'used' | 'active';

export interface ChipStatuses {
  wildcard: ChipStatus;
  freehit:  ChipStatus;
  bboost:   ChipStatus;
  '3xc':    ChipStatus;
}
```

### 2.2 Extend `SquadResponse`

```ts
export interface SquadResponse {
  gameweek:     number;
  activeChip:   ActiveChip;       // existing
  chipStatuses: ChipStatuses;     // NEW
  summary:      SquadSummary;
  starters:     SquadPlayer[];
  bench:        SquadPlayer[];
}
```

---

## 3. Proxy: squad service (`proxy/src/squad-service.ts`)

### 3.1 Cache helper for history

```ts
async function getHistoryWithCache(teamId: number): Promise<FPLHistory> {
  const cacheKey = `history:${teamId}`;
  const cached = cacheLayer.get<FPLHistory>(cacheKey);
  if (cached) return cached;
  const history = await fplClient.getEntryHistory(teamId);
  cacheLayer.set(cacheKey, history, cacheLayer.ttl.SQUAD_CURRENT); // 60 s
  return history;
}
```

### 3.2 `computeChipStatuses` pure function

```ts
function computeChipStatuses(
  activeChip: ActiveChip,
  playedChips: FPLHistoryChip[],
  bootstrapChips: FPLBootstrapStatic['chips'],
  currentGw: number,
): ChipStatuses {
  const played = (name: string) => playedChips.filter((c) => c.name === name);

  // Wildcard: two windows. A wildcard is 'used' for the current window if one was
  // already played within that window's [start_event, stop_event] range.
  const wcWindows = bootstrapChips.filter((c) => c.name === 'wildcard');
  const currentWindow = wcWindows.find(
    (w) => currentGw >= w.start_event && currentGw <= w.stop_event,
  );
  const wcUsedInCurrentWindow = currentWindow
    ? played('wildcard').some(
        (c) => c.event >= currentWindow.start_event && c.event <= currentWindow.stop_event,
      )
    : false;

  function status(name: string, usedOverride?: boolean): ChipStatus {
    if (activeChip === name) return 'active';
    if (usedOverride ?? played(name).length > 0) return 'used';
    return 'available';
  }

  return {
    wildcard: status('wildcard', wcUsedInCurrentWindow),
    freehit:  status('freehit'),
    bboost:   status('bboost'),
    '3xc':    status('3xc'),
  };
}
```

### 3.3 Wire into `getSquad`

Add `getHistoryWithCache` call alongside the existing bootstrap / picks / live calls, then
compute and attach `chipStatuses` to the returned `SquadResponse`:

```ts
const [bootstrap, picks, live, history] = await Promise.all([
  getBootstrapWithCache(),
  getPicksWithCache(teamId, gameweek, gameweekEvent.finished),
  getLiveWithCache(gameweek),
  getHistoryWithCache(teamId),
]);

// … existing mapping …

const activeChip = toActiveChip(picks.active_chip);
const chipStatuses = computeChipStatuses(
  activeChip,
  history.chips,
  bootstrap.chips,
  gameweek,
);

return { gameweek, activeChip, chipStatuses, summary, starters, bench };
```

---

## 4. Frontend: types and state (`web/src/types/index.ts`, `TransferScreen.tsx`)

### 4.1 `PlanChip` type

The draft's `chip` field (`TransferChip`) controls transfer-cost logic and stays `'none' | 'wildcard' | 'freehit'`. For UI selection of BB/TC we add a separate local state in `TransferScreen`:

```ts
// In web/src/types/index.ts — no change to TransferChip needed.
// TransferChip = 'none' | 'wildcard' | 'freehit'  (drives calcTransferCost)

// Local to TransferScreen:
type PlanChip = TransferChip | 'bboost' | '3xc';
```

### 4.2 Auto-pre-select on first load

In `makeDefaultDraft` / draft initialisation, derive the initial `chip` from `chipStatuses`:

```ts
function activeTransferChip(statuses: ChipStatuses): TransferChip {
  if (statuses.wildcard === 'active') return 'wildcard';
  if (statuses.freehit  === 'active') return 'freehit';
  return 'none';
}
```

Called only when there is no saved draft in localStorage — the existing `loadDraft` path is
unchanged.

### 4.3 `planChip` local state

```ts
const [planChip, setPlanChip] = useState<PlanChip>('none');

// Sync planChip from chipStatuses once squadData loads:
useEffect(() => {
  if (!squadData) return;
  const initial: PlanChip =
    squadData.chipStatuses.wildcard === 'active' ? 'wildcard' :
    squadData.chipStatuses.freehit  === 'active' ? 'freehit'  :
    squadData.chipStatuses.bboost   === 'active' ? 'bboost'   :
    squadData.chipStatuses['3xc']   === 'active' ? '3xc'      :
    'none';
  setPlanChip(initial);
}, [squadData]);
```

`handleChipToggle` updates both `planChip` and, when the chip has a transfer effect, `draft.chip`:

```ts
const handleChipToggle = (chip: PlanChip) => {
  setPlanChip((prev) => {
    const next = prev === chip ? 'none' : chip;
    if (next === 'wildcard' || next === 'freehit' || next === 'none') {
      updateDraft((d) => ({ ...d, chip: next as TransferChip }));
    } else {
      // bboost / 3xc — no transfer effect
      updateDraft((d) => ({ ...d, chip: 'none' }));
    }
    return next;
  });
};
```

---

## 5. Frontend: `TransferHeader`

### 5.1 Prop changes

```ts
export interface TransferHeaderProps {
  bank:          number;
  freeTransfers: number;
  cost:          number;
  planChip:      PlanChip;           // replaces chip: TransferChip
  chipStatuses:  ChipStatuses;       // NEW
  nextGw:        number | null;
  onBack:        () => void;
  onChipToggle:  (chip: PlanChip) => void;   // widened
  onFreeTransfersChange: (n: number) => void;
}
```

### 5.2 Four-button layout

```
[ Wildcard ]  [ Free Hit ]  [ Bench Boost ]  [ Triple Captain ]
```

Each button has three CSS modifier classes:
- `chipBtn_active` — `planChip === <this chip>`
- `chipBtn_used` — `chipStatuses[chip] === 'used'` (disabled, muted colour)
- Default — available, not selected

The stepper (free transfers counter) hides when `planChip === 'wildcard'` or
`planChip === 'freehit'` (as now). It remains visible for `'bboost'`, `'3xc'`, and `'none'`.

### 5.3 Stats bar label for BB / TC

When `planChip === 'bboost'` or `planChip === '3xc'`, the cost slot shows:

```
Bench Boost — transfers cost normally
Triple Captain — transfers cost normally
```

This communicates that the chip doesn't waive transfer costs.

### 5.4 Copy strings (`web/src/lib/copy.ts`)

```ts
transfersBenchBoost:              'Bench Boost',
transfersTripleCaptain:           'Triple Captain',
transfersBenchBoostActive:        'Bench Boost — transfers cost normally',
transfersTripleCaptainActive:     'Triple Captain — transfers cost normally',
chipUsedAriaLabel:                'Already played',
```

---

## 6. Test coverage

| File | New / updated tests |
|------|---------------------|
| `proxy/src/fpl-client.ts` | `getEntryHistory` fetches correct URL, handles non-OK response |
| `proxy/src/squad-service.test.ts` | `computeChipStatuses`: active chip → `active`; played chip → `used`; wildcard window boundary logic; unplayed chips → `available` |
| `web/src/screens/TransferScreen/TransferScreen.test.tsx` | `chipStatuses.wildcard === 'active'` pre-selects wildcard in draft; `chipStatuses.freehit === 'used'` disables freehit button |

---

## Component impact summary

| File | Change |
|------|--------|
| `proxy/src/fpl-client.ts` | Add `chips[]` to `FPLBootstrapStatic`; add `FPLHistory`, `FPLHistoryChip`, `getEntryHistory` |
| `proxy/src/squad-service.ts` | Add `getHistoryWithCache`; add `computeChipStatuses`; extend `getSquad` return |
| `proxy/src/types.ts` | Add `ChipStatus`, `ChipStatuses`; extend `SquadResponse` |
| `web/src/types/index.ts` | Mirror `ChipStatus`, `ChipStatuses`; extend `SquadResponse` |
| `web/src/screens/TransferScreen/TransferScreen.tsx` | Add `planChip` state; auto-pre-select logic; widen `handleChipToggle`; pass new props |
| `web/src/screens/TransferScreen/TransferHeader.tsx` | Four-button layout; `chipStatuses` prop; BB/TC label in stats bar |
| `web/src/lib/copy.ts` | Add BB/TC copy strings |
