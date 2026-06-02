# ADR 0017: Session transport — HttpOnly cookie (no separate JWT access token)

- Status: Accepted
- Date: 2026-06-02
- Deciders: ivan.iuriev

## Context

AUTH-01 proposal described a two-token model: a short-lived JWT access token stored in
memory + an HttpOnly refresh cookie. This pattern is common in SPAs to avoid storing
sensitive tokens in localStorage while still supporting token refresh without page reloads.

Better-auth supports a JWT plugin for this, but the plugin is one of the newer parts of
the library. The proposal itself noted this as a risk: "fall back to better-auth's default
cookie-only sessions if the JWT plugin proves unstable (we'd revisit ADR 0017)."

## Decision

Use **cookie-only sessions** — better-auth's default session model.

- One `HttpOnly; Secure; SameSite=Lax` session cookie, 30-day expiry.
- Cookie cache enabled (5-min max-age) to reduce DB lookups on repeated requests.
- No separate JWT access token. The SPA relies on the session cookie for all requests.

This works because:
1. **Production**: the proxy serves the SPA — all `/api/*` calls are same-origin. The
   browser sends the session cookie automatically; no explicit token management needed.
2. **Development**: Vite's dev server proxies `/api/*` to `localhost:3001`
   (`changeOrigin: true`). Cookies set by the proxy are received by the Vite server and
   forwarded transparently — the browser sees a same-origin exchange.

The frontend `AuthProvider` checks authentication state by calling `GET /api/me` on mount.
A 200 response means the session cookie is valid; a 401 means the user is signed out.

## Consequences

**Positive:**
- Simpler frontend: no token storage, no refresh interceptor, no race conditions.
- Robust: sessions are DB-backed and revocable; no risk of stale JWTs in circulation.
- Cookie security: `HttpOnly` prevents XSS token theft; `SameSite=Lax` prevents CSRF.

**Negative / trade-offs:**
- No offline JWT validation — each request hits Postgres once to verify the session
  (mitigated by the 5-min cookie cache).
- Does not support mobile/native clients without cookie support (deferred; not in scope).

## Revisiting this decision

If a native mobile client or stateless edge-function use case arises, revisit by adding
better-auth's `bearer()` plugin. The `requireUser` middleware (`auth.api.getSession`) works
with both cookies and Bearer tokens simultaneously, so adding bearer support is additive.
