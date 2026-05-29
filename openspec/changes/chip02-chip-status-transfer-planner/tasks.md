## 1. Proxy: FPL client

- [x] 1.1 Add `chips[]` array to `FPLBootstrapStatic` in `proxy/src/fpl-client.ts`
- [x] 1.2 Add `FPLHistoryChip`, `FPLHistory` types and `getEntryHistory(teamId)` function
      calling `GET /entry/{teamId}/history/` in `proxy/src/fpl-client.ts`

## 2. Proxy: types

- [x] 2.1 Add `ChipStatus = 'available' | 'used' | 'active'` to `proxy/src/types.ts`
- [x] 2.2 Add `ChipStatuses` interface to `proxy/src/types.ts`
- [x] 2.3 Add `chipStatuses: ChipStatuses` field to `SquadResponse` in `proxy/src/types.ts`

## 3. Proxy: squad service

- [x] 3.1 Add `getHistoryWithCache(teamId)` helper in `proxy/src/squad-service.ts`
      (cache key `history:{teamId}`, TTL `SQUAD_CURRENT`)
- [x] 3.2 Add pure `computeChipStatuses(activeChip, playedChips, bootstrapChips, currentGw)`
      function implementing wildcard-window logic and per-chip status derivation
- [x] 3.3 Extend `getSquad` to call `getHistoryWithCache` in parallel with existing fetches
      (`Promise.all`), then attach `chipStatuses` to the returned `SquadResponse`
- [x] 3.4 Add unit tests for `computeChipStatuses` in `proxy/src/squad-service.test.ts`:
      active chip → `active`; played chip → `used`; wildcard in first-half window doesn't
      exhaust second-half; unplayed chips → `available`

## 4. Web: types

- [x] 4.1 Add `ChipStatus`, `ChipStatuses` types to `web/src/types/index.ts`
- [x] 4.2 Add `chipStatuses: ChipStatuses` to `SquadResponse` in `web/src/types/index.ts`

## 5. Web: TransferScreen state

- [x] 5.1 Add `PlanChip = TransferChip | 'bboost' | '3xc'` type (local to TransferScreen)
- [x] 5.2 Add `planChip` / `setPlanChip` state (`useState<PlanChip>('none')`)
- [x] 5.3 Add `useEffect` to sync `planChip` from `squadData.chipStatuses` on first load
- [x] 5.4 Add `activeTransferChip(statuses)` helper; call it when initialising a fresh draft
      (no saved draft in localStorage) to pre-populate `draft.chip`
- [x] 5.5 Rewrite `handleChipToggle` to accept `PlanChip`, update both `planChip` state and
      `draft.chip` (only for wildcard / freehit; bboost / 3xc set `draft.chip = 'none'`)
- [x] 5.6 Pass `planChip` and `chipStatuses` to `TransferHeader` (replace `chip` prop)
- [x] 5.7 Update `TransferScreen.test.tsx`: add test for wildcard pre-select; add test for
      freehit disabled button when `chipStatuses.freehit === 'used'`

## 6. Web: TransferHeader

- [x] 6.1 Update `TransferHeaderProps`: replace `chip: TransferChip` with `planChip: PlanChip`
      and add `chipStatuses: ChipStatuses`; widen `onChipToggle` to `(chip: PlanChip) => void`
- [x] 6.2 Render four chip buttons (Wildcard, Free Hit, Bench Boost, Triple Captain)
      with `chipBtn_active` and `chipBtn_used` modifier classes driven by `planChip` and
      `chipStatuses`; set `disabled` and `aria-label={copy.chipUsedAriaLabel}` for `'used'`
- [x] 6.3 Hide free-transfers stepper when `planChip === 'wildcard'` or `planChip === 'freehit'`;
      keep visible for `'bboost'`, `'3xc'`, and `'none'`
- [x] 6.4 Show BB / TC label in stats-bar cost slot when `planChip === 'bboost'` or
      `planChip === '3xc'`

## 7. Web: copy strings

- [x] 7.1 Add `transfersBenchBoost`, `transfersTripleCaptain`, `transfersBenchBoostActive`,
      `transfersTripleCaptainActive`, `chipUsedAriaLabel` to `web/src/lib/copy.ts`

## 8. Verification

- [ ] 8.1 Verify with a team that has played Wildcard: button shows as `active` / pre-selected
- [ ] 8.2 Verify with a team that has played Free Hit: Free Hit button is disabled
- [ ] 8.3 Verify Bench Boost and Triple Captain buttons appear and are enabled when available
- [ ] 8.4 Verify transfer cost and free-transfers stepper remain correct for all four chip states
- [ ] 8.5 Verify a saved draft is not overwritten by the auto-pre-select logic on reload
