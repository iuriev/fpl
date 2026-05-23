# Design: Team Info Drawer

## Context

The current `TeamInfoPanel` on mobile renders inline as a collapsible row above the squad — tapping
a chevron expands it, pushing the pitch down. The user finds this pattern unsatisfying: the panel
should feel like a separate layer rather than part of the content flow.

This change replaces the mobile expand/collapse with a left-side drawer that slides over the main
content. Desktop behaviour (permanent left sidebar) is unchanged.

## Goals / Non-Goals

**Goals:**
- Mobile: `TeamInfoPanel` opens as a slide-in drawer from the left, overlaying the squad content.
- Drawer opened via a burger button added to the left of the existing header.
- Drawer closed by: tapping the backdrop, swipe right, ✕ button inside the drawer, or Escape key.
- Smooth swipe-to-dismiss: the drawer follows the finger during the drag; releasing past the
  threshold snaps it closed, releasing below snaps it back.
- New reusable `Drawer` component — no TeamInfoPanel-specific logic inside it.
- `TeamInfoPanel` simplified: mobile toggle button and `expanded` state removed.
- Desktop (≥ 56.25rem): no behaviour change — permanent sidebar in CSS Grid.

**Non-Goals:**
- Changing the content of `TeamInfoPanel`.
- Persisting open/closed state across sessions.
- Animated desktop sidebar.

## Component Architecture

```
SquadScreen (changed)
├── Drawer (new)           open/onClose props; holds drawerOpen state in SquadScreen
│   └── TeamInfoPanel      (simplified — no toggle, no expanded state)
└── squadCol
    └── header             (changed — burger button added)
```

### `Drawer` props

```ts
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  children: React.ReactNode;
}
```

The component is deliberately minimal. It knows nothing about `TeamInfoPanel` or any other
consumer. The optional `header` prop renders in the drawer's own top bar alongside the ✕ close
button — `SquadScreen` passes the FPL mark + team name/ID here. On desktop the top bar is hidden
via CSS.

### Responsive behaviour

| Breakpoint | Drawer behaviour |
|---|---|
| `< 56.25rem` (mobile) | `position: fixed`, slides from left, backdrop overlay |
| `≥ 56.25rem` (desktop) | `position: static`, always visible as left grid column; `open` prop ignored |

On desktop the Drawer renders its children without any overlay chrome — it becomes a transparent
wrapper that fits into the existing `grid-template-columns: 16rem 1fr` layout in
`SquadScreen.module.css`.

## UX Specification

### Header (mobile)

Left-to-right: `[burger]` `[FPL mark]` `[team name / ID]` `[Change team button]`

The burger button replaces nothing — it is added to the left of the existing FPL mark icon.
On desktop (`≥ 56.25rem`) the burger is hidden via `display: none`.

### Drawer dimensions (mobile)

Width: `calc(100% - 1.5rem)` — leaves a ~1.5 rem "peek" on the right so the backdrop is visible
and the user understands the underlying content is still there.

Height: `100dvh` (full viewport height, covers the header).

### Drawer header (inside the drawer, mobile only)

Mirrors the SquadScreen header chrome: FPL mark + team name/ID on the left, ✕ close button on the
right. This gives the user a natural close target and orientation.

### Animation

| State | Transform | Transition |
|---|---|---|
| Closed | `translateX(-100%)` | `transform 300ms ease-out` |
| Open | `translateX(0)` | `transform 300ms ease-out` |
| Dragging | `translateX(max(0, deltaX))` | none (transition disabled during drag) |

The backdrop fades in/out simultaneously with `opacity 300ms ease-out`.

### Swipe-to-dismiss

- `touchstart`: record `startX`.
- `touchmove`: if `deltaX > 0` (moving right), apply `translateX(deltaX)` with no transition.
  Backdrop opacity scales proportionally: `1 - deltaX / drawerWidth`.
- `touchend`:
  - `deltaX > 80px` OR `deltaX > 35% of drawerWidth` → close (complete animation).
  - Otherwise → snap back (reset transform with transition).

Swipe is only registered when the touch starts inside the drawer (not on the backdrop).

### Close triggers

1. Tap on backdrop.
2. Tap ✕ button inside the drawer header.
3. Swipe right past threshold (see above).
4. `Escape` key.

### Accessibility

- Drawer root: `role="dialog"`, `aria-modal="true"`, `aria-label` (copy key: `teamInfoDrawerLabel`).
- When the drawer opens, focus moves to the drawer panel container (`tabIndex={-1}`).
- `Escape` key listener added on `keydown` while drawer is open; removed on close.
- Backdrop: `aria-hidden="true"`.

## File Changes

| File | Change |
|---|---|
| `web/src/components/ui/Drawer/Drawer.tsx` | New component |
| `web/src/components/ui/Drawer/Drawer.module.css` | New styles |
| `web/src/components/ui/Drawer/Drawer.test.tsx` | New tests |
| `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx` | Remove `mobileToggle`, `expanded` state, chevron |
| `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.module.css` | Remove mobile toggle styles |
| `web/src/screens/SquadScreen/SquadScreen.tsx` | Add `drawerOpen` state, burger button, wrap TeamInfoPanel in Drawer |
| `web/src/screens/SquadScreen/SquadScreen.module.css` | Add burger styles; adjust desktop grid to target Drawer wrapper |
| `web/src/lib/copy.ts` | Add `teamInfoDrawerLabel`, remove `teamInfoExpandAriaLabel`, `teamInfoCollapseAriaLabel` |

## Testing

- `Drawer`: renders children; applies `open` class when open; calls `onClose` on backdrop click;
  calls `onClose` on Escape; does not call `onClose` when closed.
- `TeamInfoPanel`: renders stats and history link (snapshot / structural); no toggle button present.
- `SquadScreen` (integration): burger button present on mount; clicking burger opens drawer;
  clicking backdrop closes drawer.
