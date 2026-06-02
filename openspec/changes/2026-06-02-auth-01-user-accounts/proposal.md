# Proposal: User Accounts (AUTH-01)

## Problem

The FPL Squad Viewer has no concept of an account. Every user is anonymous and must
re-enter their FPL team ID on every device and every visit. There is also no
server-side persistence layer at all — the proxy is stateless, `proxy/src/cache.ts` is an
in-memory TTL map, and ADR 0013 deferred the database decision. This blocks every
personalised feature on the backlog (MGR-02 backend watchlist, AI-01 chat history, saved
transfer plans) because they all need a stable user identity and durable storage that
survives `fly deploy` and machine restarts.

## Solution

Introduce **AUTH-01** from `docs/backlog.md`: a user-account capability backed by a real
Postgres database.

- Email + password **and** Google OAuth sign-in via [`better-auth`](https://www.better-auth.com).
- **Supabase Postgres** as the primary datastore for user-owned data, accessed via
  `drizzle-orm` + `postgres` driver. Schema owned in-repo under `proxy/src/db/`.
- Session model: short-lived **JWT access token in memory** + `HttpOnly; Secure;
  SameSite=Lax` **refresh cookie** with rotation and reuse detection (better-auth JWT plugin).
- The single in-scope app field is `users.fpl_team_id` — so a logged-in user's FPL team
  ID survives every redeploy and follows them across devices.
- Login is **additive, not required**. Every existing `/api/*` data route stays
  anonymous-friendly; only `/api/me*` requires an access token.

This change establishes the persistence and auth foundation that MGR-02 and later
proposals will build on, without migrating any of those features here.

## User value

- "I want to sign in with Google so I don't manage another password" — supported.
- "I want my FPL team ID remembered across devices" — supported.
- "I want to keep browsing any public team ID without signing up" — unchanged.
- "I want personalised features visible only to me" — gating mechanism in place.

## Scope

### In

- New `auth` capability: signup, login, logout, current-user query, Google OAuth callback,
  refresh-token rotation with reuse detection.
- New `persistence` capability: Postgres (Supabase) adopted as the primary datastore for
  user-owned data; migrations applied at boot under an advisory lock.
- Drizzle schema: `users`, `accounts`, `sessions`, `verification_tokens` (per better-auth)
  plus `users.fpl_team_id INTEGER NULL`, `users.password_hash`, `users.display_name`.
- Server endpoints:
  - `GET /api/me` — authenticated profile + `fplTeamId`.
  - `PUT /api/me/team` — validates the team ID via the existing `entryService.getEntry`
    before writing.
  - `POST /api/me/logout` (thin wrapper if not exposed by better-auth directly).
  - `app.on(['GET','POST'], '/api/auth/*', auth.handler)` mounting better-auth.
- Frontend: `AuthProvider`, `useCurrentUser`, `auth-client`, `ProtectedRoute`,
  `SignInScreen`, `SignUpScreen`, `UserMenu`. Header gains Sign in / Sign up entry
  points and a user menu (logout).
- `EntryScreen`: pre-fill the team ID for logged-in users; offer "Save to account" when
  signed in without `fplTeamId`.
- ADRs: `0015-database-postgres.md`, `0016-auth-better-auth.md`,
  `0017-session-transport-jwt-refresh-cookie.md`. ADR 0013 marked
  `Superseded by ADR-0015` for the user-data slice.

### Out of scope (follow-ups)

- **MGR-02**: backend watchlist migration. `WatchlistRepository` stays on localStorage in
  this change; a separate proposal will swap in `ApiWatchlistRepository` once AUTH-01 ships.
- Saved transfer plans, AI chat history, profile/avatar/preferences.
- Password reset / email verification flows (v1 ships with password + Google only).
- Admin tooling, account deletion UI, GDPR export.
- **AUTH-02** (FPL OAuth) — unrelated capability.

## Non-functional requirements

- **Security:** argon2id password hashing via better-auth; no tokens in localStorage;
  refresh-token rotation with reuse detection; CSRF mitigated by SameSite=Lax cookie +
  same-origin deployment.
- **Persistence:** Postgres is the sole source of truth for users/accounts/sessions;
  survives `fly deploy` and machine restarts.
- **Footprint:** Fly machine stays at `shared-cpu-1x / 256 MB`; Supabase free tier covers
  expected load. Connection pool capped at `postgres({ max: 4 })`.
- **Backwards compatibility:** no breaking change to existing FPL data endpoints —
  anonymous viewers see identical behaviour.
- **Browser support:** unchanged from `docs/frontend.md` (last 3 Chrome / last 2 Safari).

## Dependencies

- No dependency on other backlog items. Spec-first per `CLAUDE.md`: no application code
  lands before this proposal is approved.

## Migration path (AUTH-01 → MGR-02)

The `WatchlistRepository` interface introduced in `2026-06-01-manager-watchlist` is the
migration seam. AUTH-01 lands the identity + persistence foundation. MGR-02 then injects
`ApiWatchlistRepository` and adds a `watchlist_entries` table without touching UI
components or revisiting auth.
