# Design: Bottom navigation bar (NAV-01)

## Architecture

### AppLayout wrapper

A new `AppLayout` component wraps authenticated routes. It renders the `BottomNav` once,
eliminating the current per-screen repetition. Routes outside `AppLayout` (e.g. login, team
ID entry) get no nav automatically.

```
App.tsx
└── Routes
    ├── /login              → LoginScreen (no AppLayout)
    ├── /enter-team-id      → TeamIdScreen (no AppLayout)
    └── AppLayout           → renders BottomNav + <Outlet>
        ├── /               → SquadScreen
        ├── /transfers      → TransferScreen
        ├── /predictions    → PredictionsScreen
        ├── /review         → ReviewScreen
        ├── /stats          → StatsScreen
        ├── /watchlist      → WatchlistScreen (Managers WL)
        ├── /players        → PlayersScreen (Players WL)
        ├── /top-players    → TopPlayersScreen
        ├── /price-changes  → PriceChangesScreen
        ├── /chips          → ChipsScreen
        └── /fixtures       → FixturesScreen
```

`AppLayout` renders:
```tsx
<div className={styles.layout}>
  <Outlet />
  <BottomNav />
</div>
```

The layout div uses `padding-bottom: var(--nav-height)` (via CSS variable) so page content
is never occluded by the floating nav. The nav is `position: fixed` and sits above content
via `z-index`.

### Scroll-compact behaviour

`AppLayout` attaches a single `scroll` listener to `window`. On scroll-down past a threshold
(60px), it sets a `data-compact` attribute on `document.body`. The `BottomNav` reads this via
CSS `:global([data-compact]) .nav { … }` — no React re-render required for the transition.

Compact state: label `opacity: 0`, nav height reduces from `64px` to `48px`. Both transition
with `transition: height 0.2s ease, opacity 0.15s ease`. Scroll-up restores normal state.

---

## Components

### BottomNav

File: `web/src/components/ui/BottomNav/BottomNav.tsx`

Renders a fixed pill floating above page content. Five items:

| Slot | Label | Route | Icon colour |
|------|-------|-------|-------------|
| Left | Home | `/` | `--fpl-accent` (purple) |
| 2 | Transfers | `/transfers` | green `#4ade80` / red `#f87171` |
| 3 | Predict | `/predictions` | purple `#8b55ff` + yellow dart |
| 4 | Review | `/review` | blue `#0ea5e9` + green check |
| Right | More | opens sheet | neutral `#5a5e78` |

Active item: icon uses full colour, label stays visible even in compact mode.
Inactive items: icon at 60% opacity, label fades out in compact mode.

**Visual:**
- `background: rgba(20,22,34,0.88)` + `backdrop-filter: blur(16px)`
- `border: 1px solid rgba(255,255,255,0.08)`
- `border-radius: 24px`
- `box-shadow: 0 8px 32px rgba(0,0,0,0.4)`
- Positioned: `bottom: 16px; left: 16px; right: 16px` (floats above content)

"More" button calls `openSheet()` — does not navigate. It does not get an active state.

### BottomSheet

File: `web/src/components/ui/BottomSheet/BottomSheet.tsx`

Slides up from the bottom on "More" tap. Lists 7 secondary destinations in a 4-column grid.

**Items (in order):**

| Abbr | Name | Route | Icon accent |
|------|------|-------|-------------|
| STAT | Stats | `/stats` | purple `#6c63ff` |
| MWCH | Managers WL | `/watchlist` | violet `#a78bfa` + gold star |
| PLWL | Players WL | `/players` | purple `#8b55ff` + green check |
| TOP | Top Players | `/top-players` | gold `#facc15` podium |
| PRCE | Prices | `/price-changes` | green `#4ade80` coin stack |
| CHIP | Chips | `/chips` | orange `#f97316` chip |
| FIX | Fixtures | `/fixtures` | blue `#0ea5e9` calendar |

**Close triggers:** tap on backdrop, tap on any item (after navigation), swipe-down gesture.

**Implementation:** uses the **Popover API** (`popover="auto"`) for the backdrop and
`@starting-style` for the slide-up entry animation — no JS animation library.

```css
@starting-style {
  [popover]:popover-open .sheet-panel {
    transform: translateY(100%);
  }
}
[popover]:popover-open .sheet-panel {
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
```

Swipe-to-close uses a `touchstart` / `touchmove` / `touchend` listener on the panel.
If the user drags down more than 80px, `hidePopover()` is called.

### Updated TeamInfoPanel

File: `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`

Remove the `NAV_LINKS` array and the navigation list section entirely. The panel retains:
- Manager profile (avatar, name, team name)
- Season stats (total points, overall rank, GW points)
- Settings link
- Donations / support link

The sidebar trigger (hamburger in `ScreenHeader`) is unchanged.

---

## Icon system

All icons are **inline SVG** — no external icon library. Each icon is a standalone
`.tsx` component in `web/src/components/ui/icons/`.

Approved icon specs:

**Nav bar icons (24×24 viewBox):**

```
Home        — house outline, stroke #a59fff (active) / #5a5e78 (inactive)
Transfers   — two horizontal arrows ←/→, green #4ade80 (up) / red #f87171 (down)
Predict     — bullseye (3 rings) + dart arrow, rings: #8b55ff, centre: #f87171, dart: #facc15
Review      — document outline #0ea5e9 + checkmark #4ade80
More        — three dots, fill #5a5e78
```

**Sheet icons (28×28 viewBox, same SVG reused at 30×30 rendered size):**

```
Stats       — 3 bars chart, fill gradient #6c63ff
Managers WL — person silhouette + star overlay, person #a78bfa, star #facc15
Players WL  — jersey gradient #8b55ff→#6c63ff + green circle checkmark #4ade80
Top Players — coloured podium (purple/blue) + gold star above + "1" text #facc15
Prices      — stacked coin ellipses #4ade80, "$" text, up arrow
Chips       — processor chip square, stroke/fill #f97316
Fixtures    — calendar grid, stroke #0ea5e9, filled square on current day
```

Icon component pattern:

```tsx
// web/src/components/ui/icons/IconTransfers.tsx
export function IconTransfers({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* paths */}
    </svg>
  );
}
```

---

## CSS tokens

Add to the design token file:

```css
--nav-height: 4rem;          /* normal state: 64px */
--nav-height-compact: 3rem;  /* compact state: 48px */
--nav-z: 100;
--sheet-z: 200;
```

---

## Behaviour details

### Active route detection

`BottomNav` uses `useLocation()` from React Router. A nav item is active when
`location.pathname === item.path` (exact match for `/`, `startsWith` for others).

### Sheet navigation

Each sheet item calls `navigate(route)` then `hidePopover()`. Navigation happens first so
the sheet closes while the new screen mounts — avoids a flash of the sheet over the new route.

### No nav routes

Routes rendered outside `AppLayout` in `App.tsx` automatically show no nav. The current
opt-out list:
- `/login`
- `/enter-team-id` (or whatever the team ID entry route is)

If a future route needs to opt out while remaining inside `AppLayout`, it can set
`data-no-nav` on its root element and the layout can respond via CSS — but this case is not
needed now.

---

## Files changed

| File | Change |
|------|--------|
| `web/src/App.tsx` | Wrap authenticated routes in `<AppLayout>` |
| `web/src/components/ui/AppLayout/AppLayout.tsx` | New — layout shell + scroll compact logic |
| `web/src/components/ui/AppLayout/AppLayout.module.css` | New |
| `web/src/components/ui/BottomNav/BottomNav.tsx` | New — nav pill |
| `web/src/components/ui/BottomNav/BottomNav.module.css` | New |
| `web/src/components/ui/BottomSheet/BottomSheet.tsx` | New — sheet with Popover API |
| `web/src/components/ui/BottomSheet/BottomSheet.module.css` | New |
| `web/src/components/ui/icons/` | New — one file per icon (12 total) |
| `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx` | Remove NAV_LINKS section |
| `web/src/styles/tokens.css` (or equivalent) | Add `--nav-height`, `--nav-z`, `--sheet-z` |
