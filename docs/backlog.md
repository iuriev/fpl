# Backlog / Future ideas

Deferred features and ideas, kept here so they are not forgotten. Not committed work — these
get promoted into an OpenSpec change when we decide to build them.

## Next version (soon)

- **List View toggle** — a Pitch View / List View switch on the squad screen (MVP ships
  pitch-only). Deferred in ADR 0005.

## Later

- **Dedicated desktop design** — the MVP is mobile-first (centered phone-width on desktop);
  a tailored desktop layout is planned. Decided alongside ADR 0006.
- **Real club kits via CDN** — the MVP uses one placeholder shirt for all players; load real
  per-club kit images from a CDN after the backend is in place. Decided in ADR 0007.
- **Accessibility pass** — deferred from the MVP (ADR 0007): semantics, keyboard, reduced-motion,
  ARIA labels for jerseys and C/V/availability badges, contrast, aiming for WCAG AA.
- **Multi-language UI (i18n)** — copy is centralized and i18n-ready; add languages beyond English.
- **Real-app E2E (MSW + Playwright)** — drive the running app for integration and flows (URL/router
  -> React Query -> render, gameweek navigation, error retry). Deferred from the QA gate in ADR 0009;
  add when the real data layer is wired.
- **Team of the Week** — the symbolic best XI of a gameweek (the official app links to it).
  Deferred in ADR 0005.
- **Gameweek bonus breakdown** — bonus points detail per player.
- **Live in-match scoring** — recalculate points during matches (needs polling).
- **Mini-leagues / standings**.
- **Fixture analysis** — upcoming opponents, difficulty, heatmaps.
- **Predictions / odds** — clean sheet / xG style projections.
- **AI assistant** — team-aware Q&A (as on fplukraine.com).
