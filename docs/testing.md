# Testing Strategy

One layer, owned by the developer agents. Rationale: ADR 0006 (tooling), ADR 0012 (screenshot
QA gate dropped).

## Unit tests — owned by the developer agents
- **Vitest + React Testing Library.** Fast, focused on logic and components.
- Minimum coverage: design-system components, helpers, React Query queries, and custom hooks.
- The proxy's composition logic is unit-tested too.

## Deferred (backlog)
- **Real-app E2E (MSW + Playwright)** — drive the running app for integration and flows (URL/router
  -> React Query -> render, gameweek navigation, error retry). Added when the real data layer is
  wired. See `docs/backlog.md`.
