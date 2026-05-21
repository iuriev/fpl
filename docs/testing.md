# Testing Strategy

Two layers, owned by different agents. Rationale: ADR 0009 (screen validation via Storybook) and
ADR 0006 (tooling).

## 1. Unit tests — owned by the developer agents
- **Vitest + React Testing Library.** Fast, focused on logic and components.
- Minimum coverage: design-system components, helpers, React Query queries, and custom hooks.
- The proxy's composition logic is unit-tested too.

## 2. Screen validation (QA gate) — owned by the `qa-tester` agent
A **hard gate** after implementation: a change is not done until validation is green; the user
gives the final sign-off.

The render data is pinned with **Storybook**:
- **Every base component and every screen state has a story** with fixed data.
- A shared **`fixtures/`** directory (JSON) is the single source of test data, passed to stories
  via args/decorators (e.g. a decorator that seeds the React Query cache). Minimum states: a normal
  team, an empty gameweek, an error, and a player with an availability flag.

The `qa-tester`:
1. Builds/serves Storybook and **captures screenshots from the stories** (Storybook test-runner)
   across **mobile (390x844)** and a **desktop** viewport.
2. Verifies **visual fidelity** by judging the screenshots against the design export in
   `design/exports/<vN>/` (agent judgment, no pixel baselines), and **state coverage** against the
   spec scenarios (each `#### Scenario:` should map to a story).

Scope: component and screen states, visual fidelity, responsiveness. **Accessibility is out of
scope** (deferred, ADR 0007).

## Deferred (backlog)
- **Real-app E2E (MSW + Playwright)** — drive the running app for integration and flows (URL/router
  -> React Query -> render, gameweek navigation, error retry). Added when the real data layer is
  wired. See ADR 0009 and `docs/backlog.md`.

## Artifacts (committed)
- `qa/<change-name>/report.md` — pass/fail per state/scenario, observations, and what to fix.
- `qa/<change-name>/screenshots/` — captured stories.

## Loop
implement (dev agents, with stories) -> validate (qa-tester from Storybook, hard gate) -> on
failure, hand specifics back to the dev agents -> re-validate. The qa-tester reports; it does not
modify application code.
