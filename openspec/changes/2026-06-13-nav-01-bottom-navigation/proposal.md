# Proposal: Bottom navigation bar (NAV-01)

## Problem

The app uses a sidebar drawer for all navigation. On mobile, a sidebar requires two taps
(hamburger → item) and hides all destinations behind a single entry point. Discoverability
is poor, especially for first-time users who haven't memorised the route list.

## Solution

Replace the primary navigation with a **floating bottom nav pill** that stays visible above
page content, paired with a **bottom sheet** for secondary destinations. The sidebar drawer
remains but becomes a profile / settings panel — no longer a navigation vehicle.

Key behaviour:
- Bottom nav: Home · Transfers · Predict · Review · More (5 items)
- "More" opens a bottom sheet listing all secondary features with icon + abbreviation + name
- Nav compacts on scroll (labels hidden, height reduces) — restores on scroll up
- AppLayout wrapper renders the nav; individual routes can opt out

## Scope

### In

- New `AppLayout` component wrapping authenticated routes in `App.tsx`
- New `BottomNav` component (pill, floating, compact-on-scroll)
- New `BottomSheet` component (slide-up, swipe-to-close, backdrop)
- Updated `TeamInfoPanel`: remove nav links, keep profile stats / settings / donations
- Inline SVG icon set (approved in brainstorm session 2026-06-13)
- Route-level opt-out: routes outside `AppLayout` show no nav

### Out

- Sidebar trigger (hamburger in `ScreenHeader`) — stays exactly as-is
- Sidebar visual design — unchanged; only content changes (nav links removed)
- Any new feature screens — nav wires up to existing routes only
- Animations beyond slide-up sheet and compact transition

## Success criteria

- All 5 nav destinations reachable in one tap from any authenticated screen
- Bottom sheet opens with all 7 secondary items, closes on item tap or swipe down
- Nav compacts on scroll down, restores on scroll up — no layout shift on content
- Sidebar opens from hamburger as before; nav links section is gone

## References

- Brainstorm session: `.superpowers/brainstorm/10302-1781334142/` (icon review)
- Final icon set: `icons-final2.html` in brainstorm session dir
- ADR 0014: native CSS primitives first (Popover API, `@starting-style`)
- `web/src/App.tsx` — routing entry point
- `web/src/components/ui/TeamNavDrawer/` — sidebar (trigger unchanged)
- `web/src/components/ui/TeamInfoPanel/` — sidebar content (nav links to remove)
