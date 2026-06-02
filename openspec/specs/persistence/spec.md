# Spec: Persistence (ADDED)

## Overview

Until this change, the FPL Squad Viewer had **no database**. The proxy was stateless and
`proxy/src/cache.ts` held only in-memory TTL data. ADR 0013 deferred the decision.

AUTH-01 introduces a real datastore for user-owned data: **Supabase Postgres**, accessed
from the proxy via `drizzle-orm` + `postgres` driver. This is the foundation MGR-02
(backend watchlist), AI-01 (chat history), and future saved-plan features will build on
— but only `users`, `accounts`, `sessions`, and `verification_tokens` are in scope here,
plus a single application column `users.fpl_team_id`. See ADR `0015-database-postgres.md`
(supersedes ADR 0013 for the user-data slice).

---

## Requirements

- **Datastore**: Supabase Postgres (free tier covers expected load). Connection string +
  pooler URL are provisioned out-of-band and supplied to the proxy via `DATABASE_URL`.
- **Driver**: `postgres` client created as a singleton in `proxy/src/db/client.ts` with
  `postgres({ max: 4 })`. The drizzle instance is the only typed access point used by
  the rest of the proxy.
- **Schema location**: owned in-repo under `proxy/src/db/schema.ts`. We do **not** adopt
  Supabase Auth — only the database is used from Supabase.
- **Migrations**: generated with `drizzle-kit generate`, checked into
  `proxy/src/db/migrations/`. They are applied at boot from `proxy/src/index.ts` via
  `drizzle-orm/postgres-js/migrator` under an advisory lock, **before** the HTTP server
  starts.
- **Fail-fast**: if `DATABASE_URL` is missing or invalid at boot, the proxy logs a clear
  error and exits without starting the HTTP server.
- **Footprint**: Fly machine stays at `shared-cpu-1x / 256 MB`, `min_machines_running=1`,
  `max_machines_running=1` (already in `fly.toml`).
- **Schema in scope**: `users`, `accounts`, `sessions`, `verification_tokens` (per the
  better-auth schema), plus `users.fpl_team_id INTEGER NULL`, `users.password_hash`,
  `users.display_name`. **No** application tables for watchlist / saved plans /
  settings — those are explicitly deferred.
- **Persistence guarantees**: users / accounts / sessions and `fpl_team_id` survive
  every `fly deploy` and every machine restart.
- **Anonymous data routes are unaffected**: `/api/entry/*`, `/api/squad/*`,
  `/api/gameweeks`, `/api/leagues/*`, `/api/entry/:teamId/transfers`, etc. continue to
  serve from the public FPL API + in-memory cache and **do not** touch Postgres.

---

## Scenarios

### Fresh deployment with empty database

- **Given** a Supabase Postgres instance with no app tables
- **When** the proxy boots
- **Then** migrations run idempotently under an advisory lock and create
  `users`, `accounts`, `sessions`, `verification_tokens` before the HTTP server starts.

### Redeploy with existing data

- **Given** an existing database with previously created users
- **When** `fly deploy` rolls the machine
- **Then** all `users` rows (and their `fpl_team_id`) remain intact and accessible after
  the new image boots.

### Missing `DATABASE_URL`

- **Given** `DATABASE_URL` is not set
- **When** the proxy boots
- **Then** it logs a clear error and exits **before** opening the HTTP listener.

### Anonymous traffic is independent of the database

- **Given** Postgres is reachable
- **When** an anonymous client calls `/api/entry/:teamId`
- **Then** the request is served without any read or write against Postgres.

---

## Out of scope

- `watchlist_entries` table (MGR-02).
- `saved_plans`, `ai_chat_messages`, `user_preferences` (later proposals).
- Admin tooling, account deletion, GDPR export.
- Self-hosted Postgres; we explicitly choose Supabase managed Postgres.
