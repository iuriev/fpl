# Design: Display Active Chip (CHIP-01)

## Overview

Four-layer change: FPL client type → proxy squad-service → shared types → new `ChipBadge`
component + `SquadScreen` wire-up. No new proxy endpoint needed — `active_chip` is already
returned by `/entry/{teamId}/event/{gw}/picks/`.

---

## 1. Proxy changes

### 1.1 FPLPicks type (`proxy/src/fpl-client.ts`)

Add `active_chip` to the `FPLPicks` interface:

```ts
export interface FPLPicks {
  active_chip: string | null;
  entry_history: { … };
  picks: Array<{ … }>;
}
```

### 1.2 Shared ActiveChip type (`proxy/src/types.ts`)

```ts
export type ActiveChip = 'wildcard' | '3xc' | 'freehit' | 'bboost' | null;

export interface SquadResponse {
  gameweek: number;
  activeChip: ActiveChip;
  summary: SquadSummary;
  starters: SquadPlayer[];
  bench: SquadPlayer[];
}
```

### 1.3 Squad service (`proxy/src/squad-service.ts`)

In `getSquad`, extract `active_chip` from picks and normalise it:

```ts
function toActiveChip(raw: string | null): ActiveChip {
  if (raw === 'wildcard' || raw === '3xc' || raw === 'freehit' || raw === 'bboost') return raw;
  return null;
}

return {
  gameweek,
  activeChip: toActiveChip(picks.active_chip),
  summary: { … },
  starters,
  bench,
};
```

---

## 2. Web types (`web/src/types/index.ts`)

Mirror the proxy type:

```ts
export type ActiveChip = 'wildcard' | '3xc' | 'freehit' | 'bboost' | null;

export interface SquadResponse {
  gameweek: number;
  activeChip: ActiveChip;
  summary: SquadSummary;
  starters: SquadPlayer[];
  bench: SquadPlayer[];
}
```

---

## 3. Design tokens (`web/src/theme/colors_and_type.css`)

Four chip-specific colour pairs added to `:root`:

```css
/* ── active chip palette ────────────────────────────────────────── */
--fpl-chip-wc-bg:  rgba(255, 192, 0, 0.14);
--fpl-chip-wc-ink: #ffc000;
--fpl-chip-tc-bg:  rgba(255, 77, 109, 0.14);
--fpl-chip-tc-ink: #ff4d6d;
--fpl-chip-fh-bg:  rgba(34, 211, 238, 0.14);
--fpl-chip-fh-ink: #22d3ee;
--fpl-chip-bb-bg:  rgba(0, 255, 135, 0.14);
--fpl-chip-bb-ink: #00ff87;
```

Rationale:
- **Wildcard** — gold, echoing the FPL "wildcard" golden accent.
- **Triple Captain** — red/pink, matches `--fpl-error` (captain risk/reward).
- **Free Hit** — cyan, matches `--fpl-sub-target` (temporary / sub-related colour).
- **Bench Boost** — green, matches `--fpl-accent` (positive gain from bench).

---

## 4. ChipBadge component

### Location
`web/src/components/ui/ChipBadge/`

### Props
```ts
export interface ChipBadgeProps {
  chip: ActiveChip;
}
```

Returns `null` when `chip` is `null`.

### Visual anatomy

```
┌──────────────────────────────────────────┐
│  [SVG icon]  CHIP NAME  ·  ACTIVE        │
└──────────────────────────────────────────┘
```

- Full-width banner, `border-radius: var(--fpl-radius-xl)`.
- Left `border-left: 3px solid <chip-ink>` accent stripe.
- Background: `<chip-bg>` (semi-transparent chip colour).
- Icon: 1rem × 1rem inline SVG in `<chip-ink>` colour.
- Label: chip display name + "· ACTIVE" suffix in uppercase.

### Icons (inline SVGs, `currentColor`)

Each icon is an inline SVG (24×24 viewBox) modelling the official FPL chip badge shape:

| Chip | Shape | Symbol |
|------|-------|--------|
| Wildcard | Octagonal badge | 5-pointed star |
| Triple Captain | Octagonal badge | Circling arrows around a bold "C" |
| Free Hit | Circular badge | Lightning bolt |
| Bench Boost | Circular badge | Up arrow over two horizontal bars |

All icons live as named exports inside `ChipBadge.tsx` (no separate files needed at this size).

---

## 5. SquadScreen wire-up

In `SquadScreen.tsx`, replace:

```tsx
{squad && (
  <div className={styles.summaryWrap}>
    <SummaryStrip summary={squad.summary} />
  </div>
)}
```

with:

```tsx
{squad && (
  <div className={styles.summaryWrap}>
    {squad.activeChip && <ChipBadge chip={squad.activeChip} />}
    <SummaryStrip summary={squad.summary} />
  </div>
)}
```

---

## 6. Copy strings (`web/src/lib/copy.ts`)

```ts
chipActiveSuffix: 'ACTIVE',
chipWildcard:     'Wildcard',
chipTripleCaptain:'Triple Captain',
chipFreeHit:      'Free Hit',
chipBenchBoost:   'Bench Boost',
```

---

## 7. Test coverage

| File | Tests |
|------|-------|
| `ChipBadge.test.tsx` | Renders correct label and CSS class per chip; returns null for null chip |
| `squad-service.test.ts` | `activeChip` propagated correctly; unknown strings coerced to null |

---

## Component impact summary

| File | Change |
|------|--------|
| `proxy/src/fpl-client.ts` | Add `active_chip` to `FPLPicks` |
| `proxy/src/types.ts` | Add `ActiveChip` type; add `activeChip` to `SquadResponse` |
| `proxy/src/squad-service.ts` | Extract and normalise `active_chip` |
| `proxy/src/squad-service.test.ts` | Add `activeChip` assertion |
| `web/src/types/index.ts` | Add `ActiveChip`; add `activeChip` to `SquadResponse` |
| `web/src/theme/colors_and_type.css` | Add 8 chip colour tokens |
| `web/src/lib/copy.ts` | Add chip copy strings |
| `web/src/components/ui/ChipBadge/ChipBadge.tsx` | NEW |
| `web/src/components/ui/ChipBadge/ChipBadge.module.css` | NEW |
| `web/src/components/ui/ChipBadge/ChipBadge.test.tsx` | NEW |
| `web/src/screens/SquadScreen/SquadScreen.tsx` | Add `ChipBadge` above `SummaryStrip` |
