# ADR 0006: Frontend architecture and conventions

- Status: Accepted
- Date: 2026-05-21
- Deciders: ivan.iuriev, Claude

## Context

We are building the SPA from the Claude Design system (deep-purple/neon-green, pitch layout),
which ships design tokens as both CSS variables (`--fpl-*`) and a JS object. Before
implementation we fix how styles are written, how the design system maps to code, state and
routing, types, tooling, and responsiveness.

## Decision

1. **Styling: pure CSS via CSS Modules.** No CSS-in-JS, no utility framework. All visual values
   are design tokens exposed as **CSS variables** (`--fpl-*`). Components reference `var(--fpl-*)`
   — **no hardcoded colors, sizes, spacing, radii, or shadows**. A typed `theme/tokens.ts` mirrors
   the tokens for the rare JS need (e.g. SVG drawing) and stays in sync with the CSS variables.
2. **Design system becomes a base component kit.** The tokens and Claude Design components are
   ported into reusable base components under `components/` (Button, Input, Jersey, Pitch,
   PitchPlayer, PlayerPill, CaptainBadge, AvailBadge, SummaryStrip, skeletons, …). Screens
   **compose** these base components and never re-style primitives or hold raw values.
3. **State and persistence.** No localStorage and no global state library. The **team ID and
   gameweek live in the URL as query parameters** — the URL is the source of truth and makes any
   view shareable. Server data is handled by **TanStack Query (React Query)**.
4. **Routing: React Router**, with state encoded in URL query parameters.
5. **Types: one shared module** for the proxy <-> web contract; no duplication. Plain **modular
   architecture by layer** (`api`, `components`, `screens`, `theme`, `lib`, `types`) — explicitly
   **not** feature-sliced design, for simplicity.
6. **Tooling and tests.** ESLint + Prettier are enforced. **Vitest + React Testing Library** for
   unit tests, at minimum covering: design-system components, helpers, React Query queries, and
   custom hooks.
7. **Responsiveness: mobile-first** (reference design 390x844). On desktop the app is a centered
   phone-width container for the MVP. A **dedicated desktop design is planned** for a future
   iteration (see `docs/backlog.md`).

## Consequences

- The team-entry "remember the team ID" behavior is realized via the URL query parameter (a
  reloaded or shared URL reopens the same team); the `team-entry` spec is updated to match. There
  is no separate persistence layer.
- No raw design values in code keeps the design system the single source of truth, so design
  iterations propagate by updating tokens (see `docs/design-workflow.md`).

## Alternatives considered

- **Tailwind / CSS-in-JS** for styling — rejected: the design ships CSS-variable tokens and
  inline-style components; CSS Modules + variables port them with the least friction and no
  runtime, while honoring "no hardcoded values".
- **localStorage / global store** for the team ID — rejected: query-param state is simpler and
  gives shareable, back/forward-friendly URLs for free.
- **Feature-sliced design** — rejected by the user as unnecessary complexity for this app.
