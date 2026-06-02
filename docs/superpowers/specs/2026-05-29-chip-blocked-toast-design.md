# Design: Chip Blocked Toast

**Date:** 2026-05-29

## Problem

Used chip buttons in `TransferHeader` are `disabled`, so tapping them produces no feedback. The
user has no way to know *when* the chip was played or *why* it is unavailable.

## Goal

When a user taps a used chip button, show a bottom toast explaining why it cannot be selected —
e.g. "Wildcard already played in GW14".

---

## Types

Both `proxy/src/types.ts` and `web/src/types/index.ts`:

```typescript
export interface ChipInfo {
  status: ChipStatus;
  usedInGw?: number;   // set only when status === 'used'
}

export interface ChipStatuses {
  wildcard: ChipInfo;
  freehit: ChipInfo;
  bboost: ChipInfo;
  '3xc': ChipInfo;
}
```

All existing call sites that compare `chipStatuses.X === 'used'` update to `chipStatuses.X.status === 'used'`.

---

## Proxy — `computeChipStatuses` (squad-service.ts)

Returns `ChipInfo` objects. For `used` chips it includes `usedInGw` from the last matching
entry in `playedChips`.

Wildcard retains its window-scoped logic; `usedInGw` is the event of the matching play within
the current window (if any).

```typescript
function chipInfo(name: string, windowOverride?: { used: boolean; event?: number }): ChipInfo {
  if (activeChip === name) return { status: 'active' };
  if (windowOverride) {
    return windowOverride.used
      ? { status: 'used', usedInGw: windowOverride.event }
      : { status: 'available' };
  }
  const plays = played(name);
  if (plays.length > 0) return { status: 'used', usedInGw: plays[plays.length - 1].event };
  return { status: 'available' };
}

const wcPlayInWindow = currentWindow
  ? played('wildcard').find(c => c.event >= currentWindow.start_event && c.event <= currentWindow.stop_event)
  : undefined;

return {
  wildcard: chipInfo('wildcard', { used: !!wcPlayInWindow, event: wcPlayInWindow?.event }),
  freehit:  chipInfo('freehit'),
  bboost:   chipInfo('bboost'),
  '3xc':    chipInfo('3xc'),
};
```

---

## Frontend

### `copy.ts`

Two new strings:

```typescript
chipBlockedUsed:   '{name} already played in GW{gw}',
chipBlockedNoGw:   '{name} already played this season',
```

### `TransferHeader`

- New prop: `onChipBlocked: (chip: PlanChip, usedInGw?: number) => void`
- Remove `disabled` and `aria-label` override from used chip buttons
- Add `handleChipClick(chip)` — calls `onChipBlocked` if `status === 'used'`, else `onChipToggle`
- `chipIsUsed` helper removed; call sites use `chipStatuses[name].status === 'used'`

### `TransferScreen`

- Merge `staleToast: string | null` into a single `toast: string | null` state
- `handleChipBlocked(chip, usedInGw?)` builds the message using chip display name from
  `CHIP_LABELS` (already exported from `ChipBadge`) + the new copy strings
- Toast auto-clears after 4 s (same timeout as existing stale toast)

---

## Out of scope

- Explaining why a chip is unavailable for reasons other than "already used" (e.g. chip window
  not open yet — not applicable in current rules)
- Any visual diff between a "used this season" chip and one active in the current GW from a
  different manager perspective
