# ADR 0001: Tech stack — Vite SPA + thin Node proxy

- Status: Accepted (tentative starting point — low cost to revisit)
- Date: 2026-05-21
- Deciders: ivan.iuriev, Claude

## Context

We are building a mobile-first FPL companion web app. Key forces:

- The frontend must read data from the public FPL API, but that API sends **no CORS
  headers**, so a browser cannot call it directly. A server-side component is therefore
  **mandatory**, not optional — at minimum a proxy.
- No user authentication is needed: data is fetched by public team ID.
- Solo developer; preference for a clear separation between frontend and backend at the
  start, over an all-in-one framework.
- The project follows spec-driven development; we want the freedom to swap the backend
  later without rewriting the frontend.

## Decision

- **Frontend:** React + Vite single-page app, mobile-first (PWA possible later).
- **Backend:** a separate, thin Node proxy that calls the FPL API, caches responses, and
  returns trimmed JSON shaped for the UI. Framework (Hono vs Express) decided at scaffolding.
- The frontend talks **only** to our proxy, never to the FPL API directly.

## Consequences

- (+) Clear separation of concerns; simple mental model; the proxy's FPL-fetching code is
  reusable regardless of how we host it.
- (+) Caching and payload shaping live in one place, shielding the UI from FPL API quirks.
- (−) Two things to run in dev and two things to deploy.
- Revisiting later is cheap: moving to Next.js would relocate proxy logic into API routes
  while the frontend's data contract stays stable. This is why the decision is "tentative".

## Alternatives considered

- **Next.js full-stack (one project, one deploy).** Strong option and likely lower total
  lock-in. Deferred because the user preferred an explicit frontend/backend split to start;
  kept as the most likely migration target.
- **Pure browser SPA, no backend.** Rejected — impossible given the FPL API's lack of CORS.