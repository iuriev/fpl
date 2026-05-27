# Tasks: Fix Transfer Position Logic

- [ ] Update `candidates` filtering in `TransferScreen.tsx` to match `outPlayer.position` exactly.
- [ ] Remove `isOutfield` prop from `PlayerPickerSheet` if no longer needed.
- [ ] Remove `PositionFilter` type and related constants (`POS_LABELS`, `POS_FILTERS`) from `PlayerPickerSheet.tsx`.
- [ ] Remove `positionFilter` state and the position tabs UI from `PlayerPickerSheet.tsx`.
- [ ] Update `PlayerPickerSheet` tests to remove position filter tests and add/update tests for exact position filtering.
- [ ] Update `TransferScreen` tests to verify `candidates` filtering.
