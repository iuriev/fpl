# Spec: UX-05 Transfer Screen Help Overlay

## Scenario 1: First-time visit
**Given** a user who has never seen the Transfer screen help tour
**When** the user navigates to the Transfer screen
**Then** the help tour should start automatically from step 1
**And** a "?" button should be visible in the header

## Scenario 2: Manual trigger
**Given** a user who has previously seen or skipped the help tour
**When** the user clicks the "?" button in the Transfer header
**Then** the help tour should start from step 1

## Scenario 3: Navigation through the tour
**Given** the help tour is active at step 1
**When** the user clicks "Next"
**Then** the tour should advance to step 2 and highlight the relevant UI element
**When** the user clicks "Back" (on steps > 1)
**Then** the tour should return to the previous step

## Scenario 4: Dismissing the tour
**Given** the help tour is active at any step
**When** the user clicks the "✕ Skip" button or clicks the backdrop
**Then** the tour should close
**And** the "tour seen" state should be saved in `localStorage`

## Scenario 5: Tour steps coverage
The tour must highlight and explain:
1. Chip badges
2. Stats strip (Bank/Free/Cost)
3. Captain/Vice badges
4. Ownership pill
5. FDR chip
6. Swap arrows
7. Bench players
8. Planned transfers section
9. Reset/Save buttons

## Scenario 6: Responsive behavior
**Given** a mobile viewport
**When** the tour is active
**Then** the help dialog should be positioned appropriately to not obscure the highlighted element if possible, or use a fixed position if necessary.
