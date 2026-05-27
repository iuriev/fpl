# Squad Substitutions — Design Spec

**Date:** 2026-05-27  
**Status:** Approved

## Overview

Add the ability to swap players between the starting XI and the bench directly on the TransferScreen pitch. This is a positional reorder — no money changes hands, no player pool is involved. The result persists in the transfer draft so the squad order is preserved across sessions.

## User Flow

1. User sees a small ↕ icon on every PlayerCard on the TransferScreen pitch (starters and bench).
2. User taps ↕ on any player — that player gets an orange highlight; all valid swap targets (field↔bench) get a pulsing cyan border; all other cards are dimmed.
3. User taps a valid target — the two cards swap positions on the pitch instantly. The sub is saved to `draft.subs`.
4. To undo a sub, the user taps ↕ on the swapped player and selects the original target. If the reverse pair exists in `draft.subs` it is removed, restoring the original order.
5. Subs do not appear in the SwapsStrip. The pitch itself is the only feedback.

## Data Model

### New type `SubSwap`

```ts
export interface SubSwap {
  fieldId: number;  // player who was in the starting XI at time of swap
  benchId: number;  // player who was on the bench at time of swap
}
```

Names are asymmetric (`fieldId`/`benchId`) to record the original state, enabling correct undo and display-squad computation.

### `TransferDraft` extension

```ts
export interface TransferDraft {
  // ... existing fields ...
  subs: SubSwap[];   // NEW — defaults to []
}
```

`subs` is serialised alongside `swaps` in `localStorage`. Draft loading must handle missing `subs` field gracefully (treat as `[]`).

## Formation Validation

A swap between field player A (position `posA`) and bench player B (position `posB`) is valid only if the resulting starting XI satisfies FPL formation rules:

- **GK rule:** A GK may only swap with a GK.
- **Outfield rule:** After the swap, the outfield counts must satisfy `DEF ≥ 3 && MID ≥ 2 && FWD ≥ 1`.

Valid formations (DEF-MID-FWD, total 10 outfield): 3-5-2, 3-4-3, 4-5-1, 4-4-2, 4-3-3, 5-4-1, 5-3-2, 5-2-3 and any other combination satisfying the minimums.

Validation is applied per candidate: a bench player that would produce an invalid formation is rendered dimmed and non-interactive.

## New Hook: `useSubMode`

**File:** `web/src/screens/TransferScreen/useSubMode.ts`

```ts
export function useSubMode(
  displayStarters: SquadPlayer[],
  displayBench: SquadPlayer[],
  updateDraft: (updater: (d: TransferDraft) => TransferDraft) => void,
): {
  selectedSubId: number | null;
  validSubTargets: Set<number>;
  handleSubIconClick: (id: number) => void;
  handleSubTargetClick: (id: number) => void;
  cancelSub: () => void;
}
```

### `handleSubIconClick(id)`

- If `selectedSubId === id` → cancel (deselect).
- Otherwise set `selectedSubId = id` and recompute `validSubTargets`.

### `validSubTargets` computation

- Determine whether the selected player is a starter or bench player.
- Collect candidates from the opposite group.
- For each candidate, simulate the swap and run formation validation.
- Return the Set of valid candidate IDs.

### `handleSubTargetClick(id)`

- Find the selected player and the target player.
- Call `updateDraft` to update `draft.subs`:
  - **Undo detection:** if `draft.subs` already contains `{ fieldId: targetId, benchId: selectedId }` (i.e. the exact reverse of the new swap) → remove that record instead of appending.
  - Otherwise append `{ fieldId, benchId }` where `fieldId` is the starter and `benchId` is the bench player.
- Reset `selectedSubId` to `null`.

### `cancelSub()`

- Reset `selectedSubId` to `null`.

## Component Changes

### `PlayerCard`

Add one optional prop:

```ts
onSubClick?: () => void;
```

When present, a ↕ icon button is rendered in the bottom-right corner of the card (absolute positioning). `onClick` on the icon calls `onSubClick` and calls `e.stopPropagation()` to prevent the parent `<button>` from firing.

The icon is always visible (not just on hover) — this is a mobile-first app.

### `TransferPitch`

Add props for sub mode:

```ts
selectedSubId?: number | null;
validSubTargets?: Set<number>;
onSubIconClick?: (id: number) => void;
onSubTargetClick?: (id: number) => void;
```

Card rendering logic per player:

| Condition | CSS class |
|---|---|
| `player.id === selectedSubId` | `playerBtn_out` (existing orange) |
| `validSubTargets.has(player.id)` | `playerBtn_subTarget` (new, pulsing cyan) |
| `selectedSubId !== null` and neither above | `playerBtn_dimmed` (new, reduced opacity) |

When `selectedSubId` is set and the user taps a card (not the ↕ icon), and `validSubTargets.has(player.id)` → call `onSubTargetClick(player.id)`.

`playerBtn_subTarget` CSS: cyan border using `--fpl-sub-target` token (`#22d3ee`), `box-shadow` pulse animation, `1.5s ease-in-out infinite`. `playerBtn_dimmed` CSS: `opacity: 0.35`, `filter: grayscale(0.5)`.

Both `playerBtn_subTarget` and `playerBtn_dimmed` are new CSS classes to add to `TransferPitch.module.css`. The `--fpl-sub-target` CSS variable (`#22d3ee`) must be added to `web/src/theme/colors_and_type.css`.

### `SwapsStrip`

No changes.

## `displaySquad` with Subs Applied

The existing `displaySquad` memo in `TransferScreen` already applies `draft.swaps` (transfers). Subs must be applied on top:

```
originalSquad
  → apply draft.swaps (transfer replacements)
  → apply draft.subs  (positional swaps within the array)
```

For each `SubSwap { fieldId, benchId }`:
- Find the index of `fieldId` in the combined array and the index of `benchId`.
- Swap the two elements.

`displayStarters = displaySquad.slice(0, starterCount)` and `displayBench = displaySquad.slice(starterCount)` then naturally reflect the reorder.

## Mode Interaction

- When `selectedSubId` is active, `handlePlayerClick` (transfer flow) is a no-op.
- When `PlayerPickerSheet` opens (transfer selected), `cancelSub()` is called first.
- Tapping outside the pitch area (e.g. the header) calls `cancelSub()`.

## Tests

### `useSubMode` (unit, `useSubMode.test.ts`)

- Selecting a field player populates `validSubTargets` with valid bench candidates only.
- Selecting a bench player populates `validSubTargets` with valid field candidates only.
- A GK on the field only targets a GK on the bench (and vice versa).
- A swap that would leave DEF < 3 (or MID < 2, or FWD < 1) is excluded from `validSubTargets`.
- `handleSubTargetClick` appends a `SubSwap` to `draft.subs`.
- `handleSubTargetClick` with the reverse pair removes the existing record (undo).
- Re-selecting the same player calls `cancelSub` (deselects).

### `TransferPitch` (unit)

- With `selectedSubId` set, valid target cards receive `playerBtn_subTarget` class.
- Non-target, non-selected cards receive `playerBtn_dimmed` class.

### `TransferScreen` (integration)

- Active sub mode blocks `PlayerPickerSheet` from opening.
- After `handleSubTargetClick`, the two player cards appear in swapped positions.
