# Tasks: UX-05 Transfer Screen Help Overlay

## Setup
- [ ] Research `popover` API for step-by-step tour implementation.
- [ ] Add necessary copy strings to `web/src/lib/copy.ts`.

## Components
- [ ] Create `HelpTour` component in `web/src/components/ui/HelpTour/`.
    - [ ] Implement `popover` logic.
    - [ ] Implement backdrop that allows highlighting specific elements (e.g., using `clip-path` or multiple elements).
    - [ ] Implement navigation logic (Next/Back/Skip).
- [ ] Update `TransferHeader` to include the "?" help button.
- [ ] Add `data-tour` attributes or IDs to the target elements in `TransferScreen`, `TransferHeader`, `TransferPitch`, `TransferActionBar`, etc.

## Logic
- [ ] Add `localStorage` check for `fpl_tour_seen_transfer_v1`.
- [ ] Implement automatic tour start on first visit.
- [ ] Implement manual tour start from the help button.

## Styling
- [ ] Style the help dialog according to the FPL theme (colors, typography).
- [ ] Ensure smooth transitions between steps using `@starting-style`.
- [ ] Handle positioning of the dialog relative to highlighted elements.

## Testing
- [ ] Add unit tests for `HelpTour` component.
- [ ] Add integration tests in `TransferScreen.test.tsx` to verify tour triggers and navigation.

## Completion
- [ ] Verify all scenarios in `spec.md` pass.
- [ ] Format and lint.
