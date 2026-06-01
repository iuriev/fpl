# Tasks: Chip Blocked Hint Position

- [ ] Modify `web/src/screens/TransferScreen/TransferHeader.tsx`
    - [ ] Import `CHIP_LABELS` from `@/components/ui/ChipBadge/ChipBadge` (or similar).
    - [ ] Add `blockedMsg` state and `useEffect` for auto-hide.
    - [ ] Update `handleChipClick` to use local state.
    - [ ] Render the hint element.
- [ ] Modify `web/src/screens/TransferScreen/TransferHeader.module.css`
    - [ ] Add styles for the hint element.
    - [ ] Ensure `.chipsRow` has `position: relative`.
- [ ] Modify `web/src/screens/TransferScreen/TransferScreen.tsx`
    - [ ] Remove `handleChipBlocked` and related logic if it's no longer needed for chips.
    - [ ] Clean up `TransferHeader` props.
- [ ] Verify the changes.
