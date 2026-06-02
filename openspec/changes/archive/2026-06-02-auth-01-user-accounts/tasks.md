# Tasks: User Accounts (AUTH-01)

## Step 1 — OpenSpec change proposal for AUTH-01

- [x] Run the `openspec-propose` skill (`.claude/skills/openspec-propose/SKILL.md`) and
      follow the `propose → apply → archive` workflow.
- [x] Land `proposal.md`, `design.md`, `tasks.md` (this file), and capability spec
      deltas under `specs/`:
  - [x] ADDED `auth` — signup, signin, Google OAuth, refresh, logout, current user.
  - [x] ADDED `persistence` — Postgres as the user-data store.
  - [x] MODIFIED `entry` — logged-in team ID pre-fill.
- [x] Cross-reference: tick AUTH-01 in `docs/backlog.md` as "in progress" once the
      proposal is opened.
- [x] No application code in this step.

---

## Step 2 — Provision Supabase Postgres and wire the database layer

Outcome: the proxy boots against a real Postgres instance, runs Drizzle migrations
idempotently, and exposes a typed `db` client — with no auth surface yet.

- [x] Provision a Supabase project (free tier); capture the connection string + pooler
      URL.
- [x] `proxy/package.json`: add `drizzle-orm`, `postgres`; devDep `drizzle-kit`.
- [x] `proxy/src/db/client.ts`: singleton `postgres()` client (pooled, `max: 4`) +
      `drizzle()` instance keyed off `process.env.DATABASE_URL`.
- [x] `proxy/src/db/schema.ts`: full better-auth schema + `fpl_team_id` on `user`.
- [x] `drizzle.config.ts` at the proxy root; `db:generate`, `db:migrate`, `db:studio`
      scripts in `proxy/package.json`.
- [x] `proxy/src/index.ts`: run migrations on startup before the HTTP server starts;
      fail fast if `DATABASE_URL` or `BETTER_AUTH_SECRET` is missing.
- [x] ADR `docs/decisions/0015-database-postgres.md`; mark ADR 0013 as
      `Superseded by ADR-0015`.
- [x] `docs/db-schema.md` with ER diagram and per-table column tables.
- [x] Document required Fly secrets in `docs/architecture.md`.

---

## Step 3 — Integrate better-auth (email/password + Google OAuth)

Outcome: the proxy serves `/api/auth/*` end-to-end — signup, signin (password or
Google), refresh, and sign out, with sessions persisted in Postgres.

- [x] Add dep: `better-auth`.
- [x] `proxy/src/auth/auth.ts`: configure `betterAuth` with the Drizzle adapter,
      `emailAndPassword.enabled = true`, Google `socialProviders`,
      `user.additionalFields` for `fplTeamId`, 30-day sessions with cookie cache.
- [x] `proxy/src/auth/middleware.ts`: export `requireUser` validating the session cookie
      and setting `c.var.user`.
- [x] `proxy/src/index.ts`:
      `app.on(['GET','POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))`.
- [x] Fly secrets: `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
      `PUBLIC_APP_URL` — documented in `docs/architecture.md`.
- [x] `proxy/src/auth/auth.test.ts`: signup, signin (incl. wrong password), OAuth
      callback stub.
- [x] ADRs `0016-auth-better-auth.md`, `0017-session-transport-cookie.md`.

---

## Step 4 — Server endpoints for the authenticated user profile and saved team ID

Outcome: authenticated requests can read their profile and persist their FPL team ID;
unauthenticated requests to those endpoints return 401; all existing data routes remain
anonymous-friendly.

- [x] `GET /api/me` in `proxy/src/me-routes.ts`, guarded by `requireUser`, returning
      `{ id, email, name, fplTeamId }`.
- [x] `PUT /api/me/team`: validate `teamId` via the existing `entryService.getEntry`
      before writing to `users.fpl_team_id`; return 400 on invalid IDs.
- [x] `POST /api/me/logout` thin wrapper delegating to auth.handler.
- [x] `proxy/src/me-routes.test.ts`: 200 happy paths, 400 invalid team ID (mock
      `entryService`), 401 unauthenticated.
- [x] Regression: verified in tests that me routes do not intercept `/api/entry` paths.

---

## Step 5 — Frontend auth layer (provider, hook, sign-in / sign-up screens)

Outcome: the SPA can sign users up and in, transparently refreshes access tokens,
exposes a `useCurrentUser()` hook, and renders Sign in / Sign up screens consistent with
the existing design system.

- [x] Run the `modern-web-guidance` skill before any HTML/CSS work in this step
      (required by `CLAUDE.md`).
- [x] `web/src/auth/auth-client.ts`: fetch wrappers around `/api/auth/*`, `/api/me`.
- [x] `web/src/auth/AuthProvider.tsx`: bootstraps auth state from `GET /api/me` on mount.
- [x] `web/src/auth/AuthContext.ts`: React hook `useCurrentUser()` that returns
      `{ user, loading, refetch }`.
- [x] `web/src/auth/ProtectedRoute.tsx`: to be consumed later by MGR-02.
- [x] `web/src/screens/SignInScreen/SignInScreen.tsx` (+ `.module.css`, `.test.tsx`).
- [x] `web/src/screens/SignUpScreen/SignUpScreen.tsx` (mirroring SignInScreen).
- [x] `web/src/components/ui/UserMenu/UserMenu.tsx`: signed-in user + logout action.
- [x] `web/src/App.tsx`: wrap tree in `AuthProvider`; add routes for `/sign-in`,
      `/sign-up`.
- [x] Tests: `AuthProvider.test.tsx`, `SignInScreen.test.tsx`, `SignUpScreen.test.tsx`,
      `UserMenu.test.tsx`.

---

## Step 6 — Wire saved FPL team ID into entry flow + gate personalised UI

Outcome: logged-in users see their saved team ID pre-filled and can save the entered
team ID to their account; personalised features are gated behind authentication while
anonymous viewing is unchanged.

- [x] `web/src/screens/EntryScreen/EntryScreen.tsx`:
  - Pre-fill input with user's `fplTeamId` if available.
  - After successful validation and API check, silently save team to account if user is
    logged in and has no `fplTeamId` (fire-and-forget).
  - Show "Sign in" link when user is anonymous.
- [x] Update `EntryScreen.module.css` to add footer and link styles.
- [x] `web/src/lib/copy.ts`: add sign-in and sign-up copy strings.
- [x] `/watchlist` route now requires authentication via `ProtectedRoute`.
- [x] `/player-watchlist` route requires authentication via `ProtectedRoute`.
- [x] `web/src/api/client.ts`: added `getMe()` method.
- [x] Verify `npm run test`, `npm run lint`, `npm run typecheck` pass.
- [ ] Archive the OpenSpec change via the `openspec-archive-change` skill once
      scenarios are validated.
