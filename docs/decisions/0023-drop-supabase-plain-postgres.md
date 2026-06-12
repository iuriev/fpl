# ADR 0023: Switch from Supabase to self-hosted plain Postgres

- Status: Accepted
- Date: 2026-06-13
- Deciders: ivan.iuriev
- Supersedes: ADR 0015

## Context

ADR 0015 chose Supabase as the managed Postgres host. In production the app has since
migrated to a self-hosted plain Postgres instance (e.g. Fly.io Postgres or bare Docker).
Supabase-specific features were never used — only the Postgres wire protocol. The managed
service added unnecessary coupling, egress costs, and operational overhead.

## Decision

Use **plain Postgres** as the database host. No Supabase-specific services, extensions
(`pg_cron`, RLS policies, Realtime), or connection pooler URLs (port 6543). The
`DATABASE_URL` points to a standard `postgresql://` connection string.

Everything else from ADR 0015 remains unchanged: `postgres-js` client, Drizzle ORM,
connection pool capped at 4, boot-time migrations.

## Consequences

**Positive:**
- No vendor lock-in; `DATABASE_URL` works with any standard Postgres host.
- No egress billing surprises — traffic stays within the same deployment.
- Simpler ops: one less external service to manage.

**Negative / risks:**
- HA and backups are now the operator's responsibility (vs. Supabase-managed).
- `pg_cron` (if ever needed) must be enabled manually on the host.
