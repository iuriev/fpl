# Design: Disable Reset Button when no difference with server

## Implementation Details

### TransferScreen.tsx
-   Add `initialChip` using `useMemo` that derives the currently active chip from `squadData.chipStatuses`.
-   Update `hasChanges` prop passed to `TransferActionBar`:
    ```tsx
    hasChanges={
      (draft?.swaps.length ?? 0) > 0 || 
      (draft?.subs.length ?? 0) > 0 || 
      planChip !== initialChip
    }
    ```
-   Update `handleReset` to restore the initial state:
    ```tsx
    const handleReset = () => {
      setPlanChip(initialChip);
      updateDraft((d) => ({
        ...d,
        swaps: [],
        subs: [],
        chip: (initialChip === 'wildcard' || initialChip === 'freehit') ? initialChip : 'none',
      }));
    };
    ```

## Verification Plan
-   Unit tests in `TransferScreen.test.tsx` to cover:
    -   Reset button disabled on initial load with no changes.
    -   Reset button enabled after choosing a chip.
    -   Reset button enabled after making a substitution.
    -   Reset button disabled after clicking it.
