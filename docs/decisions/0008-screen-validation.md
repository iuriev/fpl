# ADR 0008: Screen validation (QA gate)

- Status: Superseded by [ADR 0009](0009-screen-validation-storybook.md)
- Date: 2026-05-21
- Deciders: ivan.iuriev, Claude

> Superseded by ADR 0009: the QA gate now captures screenshots from Storybook stories (with
> fixtures) instead of driving the running app with MSW + Playwright; real-app E2E is deferred.
> The gate concept, scope, hard-gate stance, and committed artifacts below still hold.

## Context

We want a QA step that validates screens after they are implemented, against both the spec
scenarios (behavior) and the Claude Design export (visual fidelity). The frontend is mockable
(MSW + fixtures), and the agent is multimodal, so it can drive a browser, capture screenshots,
and review them.

## Decision

- A `qa-tester` agent validates screens after dev implementation. It is a **hard gate**: a change
  is not done until validation is green. Final sign-off remains with the user.
- **Method:** run the app with **MSW + JSON fixtures** (deterministic states), drive it with
  **Playwright** (headless Chromium) across mobile (390x844) and desktop viewports, exercising
  every screen and state, and capture screenshots.
- **Visual fidelity is checked by agent judgment against the design export** (no pixel/snapshot
  baselines to maintain). Behavior is checked against the spec scenarios; Playwright may also hold
  deterministic behavior assertions (E2E).
- **Output:** a report plus screenshots **committed to the repo** under `qa/<change-name>/`
  (`report.md` + `screenshots/`).
- **Scope:** behavior (every spec scenario), states (loading / empty / error / navigation bounds),
  visual fidelity to the design, and responsiveness (mobile + desktop). **Accessibility is out**
  (deferred, ADR 0007).
- **Division of labor:** developer agents own Vitest + React Testing Library unit tests; the
  qa-tester owns E2E + visual screen validation. The qa-tester reports and writes test specs; it
  does not modify application code — failures go back to the developer agents.

## Consequences

- Requires Playwright (headless Chromium) and good MSW fixtures covering each state.
- Screenshots add repo weight; accepted (commit everything, per decision).
- Agent-judgment visual checks are flexible but subjective — acceptable for an evolving design.
  Deterministic visual-regression snapshots can be added later if needed (backlog).

## Alternatives considered

- **Snapshot / pixel visual regression** — rejected for now: brittle and needs baseline upkeep
  while the design is still moving.
- **Advisory (non-blocking) gate** — rejected: the user wants a hard gate.
