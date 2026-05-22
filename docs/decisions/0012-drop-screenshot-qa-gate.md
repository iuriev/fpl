# ADR 0012: Drop screenshot QA gate

- Status: Accepted
- Date: 2026-05-22
- Deciders: ivan.iuriev, Claude
- Supersedes: [ADR 0009](0009-screen-validation-storybook.md)

## Context

ADR 0009 established a hard QA gate where the `qa-tester` agent captures Storybook screenshots
across mobile and desktop viewports and validates visual fidelity against the design export. In
practice this adds friction to each development iteration without proportional benefit: the
screenshot workflow is fragile, slow, and the visual judgment is better done by the developer
directly in the browser.

## Decision

- Drop the `qa-tester` agent and the screenshot QA gate entirely.
- Remove committed screenshot artifacts (`qa/` folder).
- **Storybook stays** as a component catalog and development tool; stories are no longer required
  as a hard gate, though they remain useful for exploring component states.
- The only automated test layer is **Vitest + React Testing Library** (unit tests).
- Visual review is done by the developer in the browser during implementation.

## Consequences

- No screenshot artifacts or QA reports in the repo.
- No mandatory story-per-state requirement. Stories may still be written where they aid
  development.
- Integration-level testing (routing, data fetching, navigation) remains deferred to the
  MSW + Playwright E2E layer planned in the backlog (unchanged from ADR 0009).
