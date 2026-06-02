# ADR 0015: Adopt Postgres (Supabase) as the user-data store

- Status: Accepted
- Date: 2026-06-02
- Deciders: ivan.iuriev
- Supersedes: ADR 0013 (for the user-data persistence slice)

## Context

ADR 0013 left the persistence decision open. AUTH-01 requires a durable store for user
accounts, sessions, and `fpl_team_id`. The in-memory TTL cache (`cache.ts`) is sufficient
for FPL API data but unsuitable for user-owned data that must survive restarts and deploys.

## Decision

**Supabase Postgres** as the primary datastore for user-owned data, accessed via:

- `postgres` (postgres-js) client — `postgres(url, { max: 4 })`
- `drizzle-orm` — typed schema, query builder, and migration runner
- `drizzle-kit` — migration file generation

Schema lives in-repo under `proxy/src/db/`. Migrations are generated with
`drizzle-kit generate` and applied at boot via `drizzle-orm/postgres-js/migrator` before
the HTTP server starts. A separate single-connection migration client is used so it is
cleanly closed after migrations complete.

Only Supabase's Postgres is used — not Supabase Auth, Storage, or Realtime.

## Consequences

**Positive:**
- User data (accounts, sessions, `fpl_team_id`) survives every `fly deploy` and restart.
- Type-safe queries via Drizzle; schema is version-controlled alongside app code.
- Supabase free tier covers expected load; connection pool capped at 4.

**Negative / risks:**
- Boot time increases slightly due to migration check (negligible in practice).
- `DATABASE_URL` is a required secret; the proxy fails fast if missing.
- Single-machine Fly deployment + boot-time migrations is safe as long as
  `max_machines_running=1` (already in `fly.toml`).

## Alternatives considered

- **SQLite on Fly volume**: simpler ops, but volume persistence on Fly is complex and
  SQLite is poorly suited to multi-process concurrency if we ever scale out.
- **Redis**: good for sessions, poor for relational user data.
- **Status quo (in-memory only)**: insufficient — data lost on every restart.
