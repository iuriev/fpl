# Proposal: v2 Design Implementation

## Why

The v2 Claude Design export (`design/exports/v2/`) delivers the visual design for:
1. The list-view-toggle feature (previously spec'd but deferred to a design pass in
   `openspec/changes/list-view-toggle/`).
2. A pitch row-order bug fix (FWD at top, GK at bottom — the official FPL convention).
3. Entry screen copy and button style finalization.
4. Squad screen chrome refinements (logo, header, GW arrow buttons).

## What Changes

- **Pitch row order fixed**: FWD row at the top, GK at the bottom (team attacks upward).
- **ViewToggle**: new segmented pill control (Pitch / List) mounted in Squad screen.
- **ListView**: new component family — sticky identity column, horizontal-scrolling stat table,
  position sections, skeletons. Covers all 13 stat columns from the FPL live endpoint.
- **PositionBadge, CapInlineBadge, StatusDot**: new small components for list rows.
- **Position-color tokens**: four new token groups needed (GK, DEF, MID, FWD colors).
- **Logo mark**: updated from pitch-square SVG to lightning-bolt on accent background.
- **Entry screen**: headline copy finalized; "View squad" button fills accent green when enabled.
- **Squad screen chrome**: SquadHeader background transparent; GwControl loses the pts sub-label;
  GwArrow buttons are now pill-shaped with accent-tinted fill.

## Capabilities

### New Capabilities
- `list-view`: complete visual implementation of the list view and toggle.

### Modified Capabilities
- `squad-view`: pitch row order corrected; squad header and GW control restyled; ViewToggle
  added.
- `team-entry`: headline copy and primary button style updated.

## Impact

- **Frontend only**: no proxy changes (proxy tasks 1.x in `list-view-toggle` are already done).
- The `list-view-toggle` tasks 2.x and 3.x are superseded by this change.
- New position-color tokens must be added to `web/src/theme/` before the `PositionBadge`
  component is built.
