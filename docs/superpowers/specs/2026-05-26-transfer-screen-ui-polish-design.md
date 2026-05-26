# Transfer Screen UI Polish — Design Spec

**Date:** 2026-05-26  
**Scope:** 4 UI changes across PlayerCard, TransferScreen/PlayerPickerSheet, and SquadScreen

---

## 1. Team Abbreviation + FDR Chip Under PlayerCard

### Problem
The pitch view in TransferScreen (and SquadScreen for the upcoming GW) shows no fixture context. The player pool picker (`PlayerPickerRow`) already shows team abbreviation and FDR chips — the pitch view should show the same information so users can evaluate their squad's upcoming difficulty at a glance.

### Solution

**PlayerCard** gains one optional prop:
```ts
nextFixture?: FixtureInfo
```
`SquadPlayer.club` already contains the 3-letter team abbreviation (e.g. `"ARS"`) — it is mapped from `t.short_name` in `squad-service.ts`, so no proxy changes are needed.

Below the name pill, when `nextFixture` is provided, render:
```
┌──────────────────────┐
│  Gabriel             │
├──────────┬───────────┤
│  ARS     │  LIV H   │  ← team abbrev + FdrChip
└──────────┴───────────┘
```
If `nextFixture` is absent the card renders exactly as today — no visual regression on screens that don't pass fixture data.

**TransferPitch** gains one optional prop:
```ts
poolLookup?: Map<number, PoolPlayer>
```
`TransferScreen` builds this map from `allPoolPlayers` (already in scope) and passes it down. `TransferPitch` derives `nextFixture` per player from the lookup and forwards it to `PlayerCard`.

**SquadScreen** — only when `selectedGw === currentGw + 1` (the upcoming GW):
- Call `usePlayerPool()` (already available as a hook)
- Build `poolLookup` from the result
- Pass `nextFixture` to each `PlayerCard` on the pitch

When `selectedGw` is any other value (current or past) the pool query is skipped and cards render without fixture data.

---

## 2. Captain / Vice-Captain Badge — Move to Right Side (Global)

### Problem
The `C`/`V` badge is positioned `left: 0.5rem` on the jersey wrap. FPL convention and user preference: it should be on the right side.

### Solution
CSS-only change in `PlayerCard.module.css`:

| Class | Before | After |
|---|---|---|
| `.capBadge` | `left: 0.5rem` | `right: 0.5rem` |
| `.availBadge` | `right: 0.5rem` | `left: 0.5rem` |

Both remain at `top: -0.1875rem`. When a player is both captain and has an availability issue, the two badges sit on opposite sides with no overlap — captain on the right, injury/doubt on the left.

This change is global — it affects SquadScreen, TransferScreen, and any future screen that renders `PlayerCard`.

---

## 3. Outfield Position Picker — Allow Any Outfield Position

### Problem
`TransferScreen.tsx` filters candidates by `outPlayer.position` for all positions. FPL rules allow flexible formations, so when transferring a DEF, MID, or FWD the user should be able to pick any outfield player — not just same-position replacements. GK replacements remain GK-only.

### Solution

**TransferScreen.tsx** — change `candidates` derivation:
```ts
const candidates = outPlayer
  ? outPlayer.position === 'GK'
    ? allPoolPlayers.filter((p) => p.position === 'GK')
    : allPoolPlayers.filter((p) => p.position !== 'GK')
  : [];
```

**PlayerPickerSheet** gains one new prop:
```ts
isOutfield: boolean
```
Position filter tabs are rendered only when `isOutfield === true`. For GK picks the tab row is suppressed (see §4 for filter bar details).

---

## 4. Filter Bar Redesign — Position Tabs + Sort Button

### Problem
The current controls area shows all sort options as horizontal pills, consuming vertical space and burying the useful sort affordance. There is no position filter for outfield picks.

### Solution

**New controls layout** (replaces existing `sortPills` row):

```
┌────────────────────────────────────────────┐
│  🔍 Search players…                        │
├───────────────────────────────┬────────────┤
│  [ ALL ] [ DEF ] [ MID ] [ FWD ]  Sort ↕  │
└───────────────────────────────┴────────────┘
```

- **For outfield picks (`isOutfield === true`):** position tabs (ALL / DEF / MID / FWD) on the left, Sort button on the right. Tapping a tab filters the candidate list to that position; default is ALL.
- **For GK picks (`isOutfield === false`):** no position tabs — just the Sort button on the right, right-aligned.
- Clicking Sort ↕ opens `SortPickerSheet`.

**SortPickerSheet** — new component, rendered as a sibling to `<BottomSheet>` in `PlayerPickerSheet`'s JSX return. Because it is NOT inside the main `BottomSheet`'s stacking context, its `position: fixed; z-index: 350` (backdrop `349`) layers above the picker sheet's `300`/`299`. It lists the 5 sort options as large tappable rows; selecting one updates `sortKey` and closes the sheet.

**`PlayerPickerSheet` internal state** gains:
- `positionFilter: 'ALL' | 'DEF' | 'MID' | 'FWD'` — default `'ALL'`
- `showSort: boolean` — controls SortPickerSheet visibility

Filtering applies after position filter and before existing name/query filter.

---

## Affected Files

| File | Change |
|---|---|
| `web/src/components/ui/PlayerCard/PlayerCard.tsx` | Add `nextFixture?` prop; render team abbrev + FdrChip row |
| `web/src/components/ui/PlayerCard/PlayerCard.module.css` | Swap `capBadge` left↔right, `availBadge` right↔left |
| `web/src/components/ui/PlayerCard/PlayerCard.stories.tsx` | Update stories with new prop |
| `web/src/screens/TransferScreen/TransferPitch.tsx` | Add `poolLookup?` prop; derive + forward `nextFixture` |
| `web/src/screens/TransferScreen/TransferScreen.tsx` | Build `poolLookup`; widen outfield candidates; pass `isOutfield` to sheet |
| `web/src/screens/TransferScreen/PlayerPickerSheet.tsx` | Add `isOutfield` prop; position tabs; Sort button; SortPickerSheet integration |
| `web/src/screens/TransferScreen/PlayerPickerSheet.module.css` | Update controls styles |
| `web/src/screens/TransferScreen/SortPickerSheet.tsx` | New component |
| `web/src/screens/TransferScreen/SortPickerSheet.module.css` | New file |
| `web/src/screens/SquadScreen/SquadScreen.tsx` | Conditionally call `usePlayerPool()`; pass `nextFixture` to PlayerCard |

---

## Out of Scope

- Squad screen fixture display for GWs other than `currentGw + 1`
- Showing multiple next fixtures on the pitch (only the immediate next fixture is shown)
- Any proxy / backend changes
