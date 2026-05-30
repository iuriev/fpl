# Proposal: UX-05 Transfer Screen Help Overlay (Guided Tour)

## Goal
The Transfer screen is the most complex part of the application, featuring many non-obvious UI elements like chip badges, cost strips, FDR indicators, and swap arrows. New users need a step-by-step walkthrough to understand how to plan their transfers effectively.

## Design
- A "?" button in the top-right of the Transfer header.
- A lightweight, step-by-step highlight overlay using the native **Popover API**.
- Each step highlights a specific UI element and provides a brief explanation.
- Navigation includes "Next", "Back" (if applicable), and "✕ Skip".
- Automatic trigger on first visit (stored in `localStorage`).
- Manual trigger via the "?" button.

## Tour Steps
1. **Chip badges (WC / FH / BB / TC)** — Explanation of Wildcard, Free Hit, Bench Boost, and Triple Captain.
2. **Bank / Free / Cost strip** — Budget remaining, free transfers, and points cost.
3. **Captain (C) / Vice-captain (V) badges** — How captaincy and vice-captaincy work.
4. **Ownership % pill** — Global ownership percentage.
5. **FDR chip** — Fixture Difficulty Rating (green for easy, maroon for hard).
6. **Transfer swap arrows (↑↓)** — Indicating planned transfers (in/out).
7. **Bench row** — Substituted players and their order.
8. **Planned Transfers section** — Summary of staged moves.
9. **Reset / Save Plan buttons** — Clearing or committing the draft.

## Technical Approach
- Use native `popover` attribute for the help dialog.
- Use `::backdrop` for the dimming effect.
- Use CSS `:has()` or React state to manage the active step and positioning.
- Use `@starting-style` for smooth transitions.
- Store `fpl_tour_seen_transfer_v1` in `localStorage`.

## Success Criteria
- Tour starts automatically for new users.
- Tour can be dismissed at any time.
- Users can navigate back and forth between steps.
- The "?" button remains accessible for re-triggering the tour.
