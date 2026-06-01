# Design: Auto-close Transfers Modal when empty

## Implementation Details

### TransferScreen.tsx
- Add a `useEffect` that monitors `isTransfersOpen` and `draft.swaps.length`.
- If `isTransfersOpen` is true and `draft.swaps.length === 0`, call `setIsTransfersOpen(false)`.

```tsx
  useEffect(() => {
    if (isTransfersOpen && draft && draft.swaps.length === 0) {
      setIsTransfersOpen(false);
    }
  }, [isTransfersOpen, draft?.swaps.length]);
```

## Verification Plan
- Unit test in `TransferScreen.test.tsx`:
  1. Set up a draft with one swap.
  2. Open the "Pending Transfers" modal.
  3. Verify modal is open.
  4. Click the "Undo" (remove) button for the only swap.
  5. Verify that the modal is automatically closed.
