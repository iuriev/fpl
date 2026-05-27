# Testing Strategy

One layer, owned by the developer agents. Rationale: ADR 0006 (tooling), ADR 0012 (screenshot
QA gate dropped).

## Test layers

### 1. Unit tests — owned by the developer agents
- **Vitest + React Testing Library.** Fast, focused on logic and components.
- Run with `npm run test`.
- Minimum coverage: design-system components, helpers, React Query queries, and custom hooks.
- The proxy's composition logic is unit-tested too.

### 2. UI Component tests (Storybook)
- **Vitest + Storybook Test.** Runs stories in a real browser (Chromium).
- Run with `npm run test:ui`.
- Used for validating component behavior in a real browser environment when needed.
- Not part of the default "fast" test run to reduce dev friction.

## Deferred (backlog)
- **Real-app E2E (MSW + Playwright)** — drive the running app for integration and flows (URL/router
  -> React Query -> render, gameweek navigation, error retry). Added when the real data layer is
  wired. See `docs/backlog.md`.
