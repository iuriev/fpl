# ADR 0009: Screen validation via Storybook

- Status: Superseded by [ADR 0012](0012-drop-screenshot-qa-gate.md)
- Date: 2026-05-21
- Deciders: ivan.iuriev, Claude
- Supersedes: [ADR 0008](0008-screen-validation.md)

> Superseded by ADR 0012: the screenshot QA gate and `qa-tester` agent were dropped to simplify
> the development workflow. Storybook remains as a component catalog; stories are no longer a
> mandatory hard gate.

## Context

ADR 0008 set up a QA gate but pinned render data with app-level MSW and validated via Playwright
against the running app, leaving the data each screen renders from implicit. We want the data each
component and screen renders from to be **explicit, catalogued, and deterministic**.

## Decision

- **Adopt Storybook** as the place where render states are pinned. **Every base component and every
  screen state has a story** with fixed data.
- **Shared `fixtures/`** (JSON modules) are the single source of test data, passed to stories via
  args/decorators (e.g. a decorator that seeds the React Query cache). At minimum: a normal team,
  an empty gameweek, an error, and a player with an availability flag.
- The **`qa-tester` captures screenshots from the stories** (Storybook test-runner) across mobile
  (390x844) and desktop, then validates **visual fidelity by judging them against the design
  export** (`design/exports/<vN>/`) and **state coverage** against the spec scenarios. It remains a
  **hard gate**; the user signs off.
- **Committed output**: `qa/<change-name>/report.md` + `qa/<change-name>/screenshots/`.
- **Deferred**: real-app end-to-end testing with **MSW (network mocking) + Playwright** against the
  running app (URL -> router -> React Query -> render, navigation, retry). Tracked in
  `docs/backlog.md`. This **refines ADR 0007's mocking decision**: for now the frontend is built and
  verified through Storybook + fixtures, not app-level MSW.

## Consequences

- Render data is explicit (story args / fixtures) and catalogued; story <-> state <-> screenshot
  <-> design reference is 1:1. Storybook also documents the design-system kit (mirrors the Claude
  Design `preview/` cards).
- Integration concerns (routing, data fetching, navigation, retry) are not covered yet — they wait
  for the deferred real-app E2E, ideally added when the real data layer / backend is wired.
- Storybook is an added dependency and setup cost; accepted for the determinism and the catalog.

## Alternatives considered

- **MSW + Playwright on the running app** (ADR 0008's original method) — deferred, not dropped: the
  right tool for integration/flows, added later.
- **No Storybook (real-app screenshots only)** — rejected: render data stays implicit and there is
  no documented state catalog.
