# ADR 0007: Frontend implementation choices

- Status: Accepted
- Date: 2026-05-21
- Deciders: ivan.iuriev, Claude

## Context

Refinements after ADR 0006, settled before implementation. The backend (proxy) is intentionally
deferred, so the frontend must be buildable and testable on its own. The data contracts are
already defined (specs + design.md D1) and the FPL endpoints are documented in `docs/fpl-api.md`.

## Decision

1. **Fonts are self-hosted** (Space Grotesk, JetBrains Mono as woff2). No third-party font CDN —
   better performance, works offline, no external dependency.
2. **Kit assets: a single placeholder shirt for all players in the MVP.** Real per-club kit
   images are loaded from a CDN after the backend is in place. Kits are not a priority now.
3. **UI copy is centralized** in one module (English), structured to be i18n-ready. Components
   never inline raw strings. Additional languages may come later.
4. **The proxy is mocked with MSW + JSON fixtures** for both local dev and tests, so the frontend
   progresses independently of the backend. (Refined by ADR 0009: app-level MSW + Playwright E2E
   are deferred; the frontend is built and verified via Storybook + fixtures for now.)
5. **Accessibility is deferred from the MVP.** A dedicated accessibility pass is planned post-MVP.

## Consequences

- The frontend can be built and tested now, before any backend work.
- The design's per-club `Jersey` is simplified to a placeholder for the MVP; swapping in real
  kits later is localized to that component.
- The copy module adds a thin layer but keeps tone consistent and unlocks i18n.
- Deferred items are tracked in `docs/backlog.md` (real kits, accessibility pass, i18n).

## Alternatives considered

- **Google Fonts CDN** — rejected in favor of self-hosting (offline, perf, no third party).
- **Real kits now** — rejected; not a priority and depends on sourcing 20 club images.
- **Inline strings** — rejected; centralized copy is more consistent and i18n-ready.
