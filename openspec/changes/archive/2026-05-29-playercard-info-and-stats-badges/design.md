# Design: PlayerCard Info Popup and Stats Badges

## Context

`PlayerCard` is rendered on three surfaces: `SquadScreen` pitch, `TransferScreen` pitch
(`TransferPitch`), and the bench row. It already accepts `nextFixture?: FixtureInfo` (one
fixture, added in the transfer screen polish). Pool data (`PoolPlayer`) is available via
`poolLookup` in both `TransferScreen` and `SquadScreen` (when on the next GW view).

## Goals / Non-Goals

**Goals:**
- `ⓘ` button on `PlayerCard` opens a popup with upcoming fixtures + ownership + price.
- Goals and assists badges rendered on `PlayerCard` from `SquadPlayer.stats`.

**Non-Goals:**
- Purchase/sell price (needs picks data — out of scope).
- Popup on bench cards (too small — starters only).
- Fixtures popup in list view.

---

## UX-04: Info Popup

### New prop on `PlayerCard`

```ts
playerInfo?: {
  ownership: string;       // selectedByPercent, e.g. "44.5"
  currentPrice: number;    // nowCost in FPL units (divide by 10 for £)
  nextFixtures: FixtureInfo[];  // up to 5
}
```

When `playerInfo` is provided, the `ⓘ` button is rendered. When absent, no button, no popup.
This keeps `PlayerCard` opt-in and avoids breaking existing usages.

### Popup layout

```
┌─────────────────────────────────────────────┐
│  Salah  ·  £13.0m  ·  57.3%  ·  MID / LIV  [✕]  ← blue header
├─────────────────────────────────────────────┤
│  Upcoming Fixtures                          │
│  GW37  ARS (H)  [FDR chip]                  │
│  GW38  MCI (A)  [FDR chip]                  │
│  GW1   BOU (H)  [FDR chip]                  │
│  …                                          │
└─────────────────────────────────────────────┘
```

- Header background: `--fpl-accent-blue` (or `#37003C` FPL purple if no blue token — use existing `--fpl-bg-deep`)
- Header text: name, price (`£{n}m`), ownership (`{n}%`), `{pos} / {club}`
- Close `✕` button top-right
- Fixture rows: `GW{n}  {opponent} ({H/A})  {FdrChip}`
- Popup is positioned as a fixed overlay (not relative to the card) — avoids clipping inside pitch layout
- Dismiss on: ✕ click, Escape key, click outside

### ⓘ button placement

Absolute, top-right of the card, z-index above the jersey. Small circle button
(1.5rem × 1.5rem), semi-transparent background, shows only when `playerInfo` is provided.
Does not interfere with the existing availability status badge (which sits top-left).

### Data wiring

**TransferScreen:** `poolLookup` already maps player IDs to `PoolPlayer` (has `selectedByPercent`,
`nowCost`, `nextFixtures`). Pass `playerInfo` when building the `PlayerCard` props in
`TransferPitch`.

**SquadScreen:** `poolLookup` is already built when `isNextGw` is true. Extend to always build
it (not only on next GW) so fixture info is available on the current GW view too. This requires
`usePlayerPool()` to always be called in `SquadScreen`.

---

## VIS-01: Goals / Assists Badges

### Badge design

Two small pill/circle badges rendered at the **bottom-left** of the card, overlaying the jersey:

```
[3 ⚽]  [2 A]
```

- Goals badge: `{n} ⚽` — green background, white text
- Assists badge: `{n} A` — blue/teal background, white text
- Only rendered when `goals_scored > 0` or `assists > 0` respectively
- Font size: `var(--fpl-fs-micro)`, bold
- Padding: `0.125rem 0.25rem`, border-radius: `var(--fpl-radius-sm)`

### Data source

Already on `SquadPlayer.stats`: `goals_scored` and `assists`. No new props needed —
`PlayerCard` already receives the full `player: SquadPlayer`.

### Size handling

On `size="medium"` (bench) badges may overlap. Show badges only when `size="large"`.

---

## Component Impact

| Component | Change |
|---|---|
| `PlayerCard.tsx` | Add `playerInfo` prop; render `ⓘ` button + popup; render goal/assist badges |
| `PlayerCard.module.css` | Add styles for `ⓘ` button, popup overlay, badge pills |
| `PlayerCard.test.tsx` | Tests for popup open/close; badge render/hide logic |
| `TransferPitch.tsx` | Pass `playerInfo` from `poolLookup` to `PlayerCard` |
| `SquadScreen.tsx` | Always call `usePlayerPool()`; pass `playerInfo` to starter `PlayerCard`s |

---

## Decisions

**D1 — Fixed popup overlay, not card-relative.** Card dimensions are small; a relative popup
would clip against pitch edges. A fixed overlay (centered or anchored to viewport centre on
mobile) is simpler and always fully visible.

**D2 — `playerInfo` prop, not individual fields.** Groups optional fixture/stat fields together
to keep the prop signature clean as more info is added later (e.g. purchase price).

**D3 — Badges only on `size="large"`.** Bench cards are too small. Avoids overlap issues
without complex responsive logic.

**D4 — Always load pool in SquadScreen.** Calling `usePlayerPool()` unconditionally (not only
on next GW) means fixture data is available on the current GW too. Pool data is cached for
10 min — negligible cost.
