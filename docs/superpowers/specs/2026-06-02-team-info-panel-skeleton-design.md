# TeamInfoPanel Skeleton — Design Spec

Date: 2026-06-02

## Problem

When the Drawer opens on SquadScreen before `entry` data has loaded, the panel is completely empty (dark void). The user sees no indication that content is coming.

## Solution

Add a `TeamInfoPanelSkeleton` shimmer skeleton that mirrors the real panel layout and renders in place of the panel while `entry` is null.

## Visual Structure

The skeleton mirrors the real `TeamInfoPanel` section by section:

- **Avatar** — one circular block (`4rem × 4rem`)
- **Identity** — two horizontal bars: wider for team name, narrower for manager
- **Stats grid** — four 2×2 blocks matching the stat card layout
- **Nav links** — seven pill-shaped bars matching the nav link height

All blocks use the `fplShimmer` keyframe animation already defined in `theme/colors_and_type.css`.

## Components

### `TeamInfoPanelSkeleton` (new, in `TeamInfoPanel.tsx`)

A standalone functional component with no props. Renders semantic HTML with `aria-busy="true"` and `aria-label` for screen readers. Uses the same `.panel` wrapper class as the real panel so padding and layout are identical.

### `TeamInfoPanel.module.css` additions

New skeleton-specific classes: `.skeletonAvatar`, `.skeletonBar`, `.skeletonBarShort`, `.skeletonStat`, `.skeletonNavBar`. Each gets a `background` gradient and `fplShimmer` animation. `@media (prefers-reduced-motion: reduce)` disables the animation.

## Integration Point

`SquadScreen.tsx` line 166, inside the `Drawer`:

**Before:**
```tsx
{entry && <TeamInfoPanel entry={entry} teamId={teamId} showFollow={isGuestMode} />}
```

**After:**
```tsx
{entry
  ? <TeamInfoPanel entry={entry} teamId={teamId} showFollow={isGuestMode} />
  : !entryIsError && <TeamInfoPanelSkeleton />}
```

When `entryIsError` is true the drawer is irrelevant (the screen shows an error state), so no skeleton is shown.

## Accessibility

- `aria-busy="true"` on the skeleton root
- `aria-label` using the existing `copy.loadingPlaceholder` string

## Out of Scope

- Skeleton for the Drawer header (team name + ID strip) — it already renders a space character as placeholder
- Skeleton on any screen other than SquadScreen
