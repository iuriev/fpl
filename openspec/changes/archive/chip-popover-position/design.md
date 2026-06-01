# Design: Chip Blocked Hint Position

## UI Changes

### TransferHeader.tsx
- Add local state `blockedMsg: string | null`.
- Add a timer to auto-hide the message after 3 seconds.
- Update `handleChipClick` to set `blockedMsg` when a chip is blocked.
- Render the hint element inside `.chipsRow` or as a `popover`.
- Since we want it "immediately under the chip", we will place it inside `chipsRow` with absolute positioning.

### TransferHeader.module.css
- Add styles for `.hint`:
    - `position: absolute`
    - `top: 100%` (right below the chips row)
    - `left: 50%`, `transform: translateX(-50%)`
    - Background, border, padding, border-radius (matching the design in screenshot).
    - `z-index: 1000` (above other header elements).
    - Animation using `@starting-style` for smooth appearance.

## Logic Flow
1. User taps a used chip.
2. `handleChipClick` calculates the message.
3. `blockedMsg` state is updated.
4. A 3s timeout is started to clear `blockedMsg`.
5. The `.hint` element becomes visible.

## Integration
- `TransferScreen` will no longer receive `onChipBlocked` or will handle it silently if needed.
- `onChipBlocked` prop can be removed from `TransferHeader` if it's only used for the toast.
- The global `toast` in `TransferScreen` remains for other messages (like stale draft).
