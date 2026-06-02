# ADR 0016: Use better-auth for authentication

- Status: Accepted
- Date: 2026-06-02
- Deciders: ivan.iuriev

## Context

AUTH-01 requires email/password signup and Google OAuth. The proxy is a Hono server with
a Drizzle/Postgres backend. We need a library that:

- Supports both email/password and Google OAuth natively
- Has a first-party Drizzle adapter
- Has a first-party Hono integration
- Handles password hashing, session management, and OAuth callbacks
- Does not require separate infrastructure (no separate auth server)

## Decision

Use **better-auth** (`better-auth` npm package).

- `betterAuth({ database: drizzleAdapter(db, { provider: 'pg', schema: {...} }) })`
- `emailAndPassword: { enabled: true }` — built-in argon2id password hashing
- `socialProviders: { google: {...} }` — OAuth 2.0 flow managed by better-auth
- `user.additionalFields` — extends the User type with `fplTeamId`
- Sessions use `HttpOnly; SameSite=Lax` cookies; 30-day expiry with 5-min cookie cache
- Auth routes mounted via `app.on(['GET', 'POST'], '/api/auth/*', auth.handler)`
- `requireUser` middleware uses `auth.api.getSession({ headers })` for route protection

## Consequences

**Positive:**
- Single library handles password hashing, sessions, Google OAuth, and token rotation.
- Drizzle adapter means the schema is owned in-repo; no separate auth DB.
- Hono integration is one line.

**Negative / risks:**
- better-auth is a younger library; some plugins (JWT, passkey) are newer and may have
  rough edges. We only use the stable core (email/password, Google OAuth, sessions).
- Session cookie approach requires same-origin requests in production (satisfied: proxy
  serves the SPA) and Vite's dev proxy for local development (already configured).

## Alternatives considered

- **Auth.js (NextAuth)**: primarily Next.js–oriented; Hono adapter exists but is less
  maintained; adapters for Drizzle are community packages.
- **Lucia**: archived in 2025; explicitly decommissioned.
- **Hand-rolled JWT**: high security risk surface; not warranted for this scope.
