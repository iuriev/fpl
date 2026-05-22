# Frontend Conventions

How the web SPA is written. Rationale lives in ADR 0006; this is the practical reference.

## Styling
- **Pure CSS via CSS Modules** (`*.module.css`). No CSS-in-JS, no utility framework.
- **All visual values are design tokens exposed as CSS variables** (`--fpl-*`) from
  `theme/colors_and_type.css`. Reference `var(--fpl-*)` — never literal colors, font sizes,
  spacing, radii, or shadows.
- **Use `rem` for all length values** — spacing, sizes, radii, breakpoints, and positions. The
  only exceptions are border widths (`1px`, `2px`) and shadow offsets, which stay in `px`
  because they are visual strokes, not layout values, and should not scale with the user's
  font-size preference.
- A typed `theme/tokens.ts` mirrors the tokens for the rare cases JS needs a value (e.g. SVG
  drawing). Keep it in sync with the CSS variables.
- **Fonts are self-hosted** (Space Grotesk, JetBrains Mono as woff2) — no third-party CDN.

## Modern CSS baseline

CSS target: modern mobile Chrome and mobile Safari. Use container queries (`@container`),
`:has()` selectors, CSS Grid, and other modern CSS features freely. No polyfills or
fallbacks needed for the MVP.

**Browser support policy: last 3 Chrome versions, last 2 Safari versions.** All supported
versions cover:
- Container queries (`@container`)
- `:has()` pseudo-class selector
- CSS Grid

Leverage these features to write cleaner, more maintainable CSS without backwards-compatibility constraints.

## Design system -> base components
- The design system (from `design/exports/<vN>/`) is ported into a **base component kit** under
  `components/`: e.g. `Button`, `Input`, `Jersey`, `Pitch`, `PitchPlayer`, `PlayerPill`,
  `CaptainBadge`, `AvailBadge`, `SummaryStrip`, and skeletons.
- Screens **compose** base components. They do not re-style primitives or hold raw values.

## Structure (plain modular, not feature-sliced)
```
web/src/
  api/        # proxy client + React Query hooks
  components/ # base UI kit
  screens/    # EntryScreen, SquadScreen
  theme/      # tokens.ts + colors_and_type.css (global)
  lib/        # helpers
  types/      # contract types, shared with the proxy
```

## State, routing, data
- **React Router**; the team ID and gameweek live in **URL query parameters** — the URL is the
  source of truth and makes any view shareable. No localStorage, no global state library.
- Server data via **TanStack Query (React Query)** — caching, loading, error, retry.

## Types
- The proxy <-> web contract types live in a single **shared module**; do not duplicate.

## Tooling and tests
- **ESLint + Prettier** are enforced.
- **Vitest + React Testing Library**. Minimum coverage: design-system components, helpers,
  React Query queries, and custom hooks.

## Responsiveness
- **Mobile-first** (reference design 390x844). On desktop the app is a centered phone-width
  container for now. A **dedicated desktop design is planned** for a future iteration
  (`docs/backlog.md`).

## Copy and i18n
- All user-facing text lives in a centralized copy module (English). Components never inline raw
  strings. The structure is i18n-ready so languages can be added later (backlog). See ADR 0007.

## Assets
- The MVP renders a single placeholder shirt for all players. Real per-club kit images load from
  a CDN after the backend is in place (backlog). See ADR 0007.

## Storybook
- **Storybook** is available as a component catalog and development tool. Stories are optional but
  useful for exploring component states during development.
- **Shared `fixtures/`** (JSON) provide deterministic test data for stories and unit tests.
- Deferred (backlog): real-app E2E with MSW + Playwright (routing, data fetching, navigation). See ADR 0012.

## Accessibility
- Deferred from the MVP (ADR 0007). A dedicated accessibility pass is planned post-MVP.
