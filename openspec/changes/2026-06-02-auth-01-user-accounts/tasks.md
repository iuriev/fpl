# Tasks: User Accounts (AUTH-01)

## Step 1 — OpenSpec change proposal for AUTH-01

- [ ] Run the `openspec-propose` skill (`.claude/skills/openspec-propose/SKILL.md`) and
      follow the `propose → apply → archive` workflow.
- [ ] Land `proposal.md`, `design.md`, `tasks.md` (this file), and capability spec
      deltas under `specs/`:
  - [ ] ADDED `auth` — signup, signin, Google OAuth, refresh, logout, current user.
  - [ ] ADDED `persistence` — Postgres as the user-data store.
  - [ ] MODIFIED `entry` — logged-in team ID pre-fill.
- [ ] Cross-reference: tick AUTH-01 in `docs/backlog.md` as "in progress" once the
      proposal is opened.
- [ ] No application code in this step.

---

## Step 2 — Provision Supabase Postgres and wire the database layer

Outcome: the proxy boots against a real Postgres instance, runs Drizzle migrations
idempotently, and exposes a typed `db` client — with no auth surface yet.

- [ ] Provision a Supabase project (free tier); capture the connection string + pooler
      URL.
- [ ] `proxy/package.json`: add `drizzle-orm`, `postgres`; devDep `drizzle-kit`.
- [ ] `proxy/src/db/client.ts`: singleton `postgres()` client (pooled, `max: 4`) +
      `drizzle()` instance keyed off `process.env.DATABASE_URL`.
- [ ] `proxy/src/db/schema.ts`: placeholder tables for now (real schema lands in Step 3).
- [ ] `drizzle.config.ts` at the proxy root; `db:migrate` script in `proxy/package.json`.
- [ ] `proxy/src/index.ts`: run migrations on startup (advisory lock) before the HTTP
      server starts; fail fast if `DATABASE_URL` is missing.
- [ ] Document required Fly secrets (`DATABASE_URL`) and add the env var to
      `Dockerfile` / `fly.toml` notes; update `docs/architecture.md`.
- [ ] ADR `docs/decisions/0015-database-postgres.md`; mark ADR 0013 as
      `Superseded by ADR-0015` for the user-data slice.
- [ ] Add `db:studio` script to `proxy/package.json` (`drizzle-kit studio`) so the
      schema can be browsed interactively via `npm run db:studio -w proxy`.
- [ ] Create `docs/db-schema.md` with the initial placeholder ER diagram and table
      descriptions (per the DB schema documentation rule in `CLAUDE.md`).

---

## Step 3 — Integrate better-auth (email/password + Google OAuth)

Outcome: the proxy serves `/api/auth/*` end-to-end — signup, signin (password or
Google), refresh, and sign out, with sessions persisted in Postgres.

- [ ] Add deps: `better-auth` + its Drizzle adapter.
- [ ] `proxy/src/db/schema.ts`: full schema — `users` (with `fpl_team_id integer null`,
      `password_hash`, `display_name`), `accounts`, `sessions`,
      `verification_tokens`; generate and check in the migration.
- [ ] Update `docs/db-schema.md`: fill in the full ER diagram and per-table column
      tables to match the final Drizzle schema (per `CLAUDE.md` DB schema rule).
- [ ] `proxy/src/auth/auth.ts`: configure `betterAuth` with the Drizzle adapter,
      `emailAndPassword.enabled = true`, Google `socialProviders`, the **JWT plugin**
      (short-lived access token), refresh-token rotation, and `accountLinking` by email.
- [ ] `proxy/src/auth/middleware.ts`: export `requireUser` validating the access JWT and
      setting `c.var.user`.
- [ ] `proxy/src/index.ts`:
      `app.on(['GET','POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))`.
- [ ] Fly secrets: `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
      `PUBLIC_APP_URL`.
- [ ] `proxy/src/auth/auth.test.ts`: signup, signin (incl. wrong password), refresh
      rotation + reuse detection, logout, OAuth callback with a mocked Google provider.
- [ ] ADRs `0016-auth-better-auth.md`, `0017-session-transport-jwt-refresh-cookie.md`.

---

## Step 4 — Server endpoints for the authenticated user profile and saved team ID

Outcome: authenticated requests can read their profile and persist their FPL team ID;
unauthenticated requests to those endpoints return 401; all existing data routes remain
anonymous-friendly.

- [ ] `GET /api/me` in `proxy/src/index.ts`, guarded by `requireUser`, returning
      `{ id, email, displayName, fplTeamId }`.
- [ ] `PUT /api/me/team`: validate `teamId` via the existing `entryService.getEntry`
      before writing to `users.fpl_team_id`; return 400 on invalid IDs.
- [ ] `POST /api/me/logout` thin wrapper if not already exposed by better-auth.
- [ ] `proxy/src/me-routes.test.ts`: 200 happy paths, 400 invalid team ID (mock
      `entryService`), 401 unauthenticated.
- [ ] Regression: re-verify in tests that none of `/api/entry/*`, `/api/squad/*`,
      `/api/gameweeks`, `/api/leagues/*` require auth.

---

## Step 5 — Frontend auth layer (provider, hook, sign-in / sign-up screens)

Outcome: the SPA can sign users up and in, transparently refreshes access tokens,
exposes a `useCurrentUser()` hook, and renders Sign in / Sign up screens consistent with
the existing design system.

- [ ] Run the `modern-web-guidance` skill before any HTML/CSS work in this step
      (required by `CLAUDE.md`).
- [ ] `web/src/auth/auth-client.ts`: fetch wrappers around `/api/auth/*`, `/api/me`,
      with a 401-driven refresh interceptor.
- [ ] `web/src/auth/AuthProvider.tsx`: owns the in-memory access token; bootstraps it
      from a `/api/auth/refresh` call on app start.
- [ ] `web/src/auth/useCurrentUser.ts`: React Query hook over `/api/me`; returns `null`
      on 401.
- [ ] `web/src/auth/ProtectedRoute.tsx`: to be consumed later by MGR-02 (no visible
      routes use it in this change).
- [ ] `web/src/screens/SignInScreen/SignInScreen.tsx` (+ `.module.css`, `.stories.tsx`,
      `.test.tsx`): email/password form + "Continue with Google" button; no barrel
      re-exports per `CLAUDE.md`.
- [ ] `web/src/screens/SignUpScreen/SignUpScreen.tsx` (mirroring SignInScreen).
- [ ] `web/src/components/ui/UserMenu/UserMenu.tsx`: signed-in user + logout action.
- [ ] `web/src/App.tsx`: wrap tree in `AuthProvider`; add routes for `/sign-in`,
      `/sign-up`.
- [ ] `web/src/api/client.ts`: attach `Authorization: Bearer <accessToken>` when present
      and retry once on 401.
- [ ] Tests: `useCurrentUser.test.tsx`, `AuthProvider.test.tsx`,
      `SignInScreen.test.tsx`, `SignUpScreen.test.tsx`; Storybook stories for the new
      screens and `UserMenu` (covered by `npm run test:ui`).

---

## Step 6 — Wire saved FPL team ID into entry flow + gate personalised UI

Outcome: logged-in users see their saved team ID pre-filled and can save the entered
team ID to their account; personalised features are gated behind authentication while
anonymous viewing is unchanged.

- [ ] `web/src/screens/EntryScreen/EntryScreen.tsx`:
  - If `useCurrentUser()` returns a user with `fplTeamId`, pre-fill the input.
  - If the user is signed in but has no `fplTeamId`, show a "Save to account"
    affordance that calls `PUT /api/me/team`.
- [ ] Update `EntryScreen.test.tsx` + stories to cover: anonymous, signed-in
      pre-filled, signed-in save.
- [ ] Header: Sign in / Sign up entry points when anonymous; `UserMenu` when
      authenticated.
- [ ] Mark Watchlist (and future Saved Plans) routes as requiring authentication via
      `ProtectedRoute`, while keeping the existing anonymous flow for every read-only
      viewer.
- [ ] Verify `npm run test`, `npm run test:ui`, `npm run lint` pass across both
      workspaces.
- [ ] Archive the OpenSpec change via the `openspec-archive-change` skill once
      scenarios are validated.
