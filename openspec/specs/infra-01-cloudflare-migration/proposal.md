# Proposal: Migrate to Cloudflare (INFRA-01)

## Problem

The app currently runs on Fly.io (London, `shared-cpu-1x`, 256 MB, 1 machine). Fly.io's
free tier has become less reliable and the user wants to move to a more sustainable
zero-cost hosting solution. The current deployment model — a single Hono process serving
both the SPA and all `/api/*` routes — must be preserved or cleanly split during migration.

## Solution

Migrate hosting to **Cloudflare**:

- **SPA** → **Cloudflare Pages** (static hosting, global CDN, free tier, no cold starts).
- **Proxy** → **Cloudflare Workers** (Hono natively supports CF Workers runtime, free tier
  100k req/day, sub-millisecond cold starts, global edge network).
- **Database** → **Supabase** stays unchanged. Workers connect to Supabase Postgres via
  TCP using the Node.js compatibility layer (`nodejs_compat` flag) or via
  **Cloudflare Hyperdrive** for pooled, edge-proxied connections.

This change is purely infrastructure — no API contracts, data models, or UI change.

## User value

- No service interruption: same URL (or new `*.pages.dev` / `*.workers.dev` domain).
- Faster response times globally due to Cloudflare's edge network.
- Free tier is more generous and stable than Fly.io's current offering.

## Scope

### In

- Remove `fly.toml`, `Dockerfile`, and all Fly.io configuration.
- Add `wrangler.toml` for the Cloudflare Workers proxy deployment.
- Add Cloudflare Pages configuration for the SPA (`web/`).
- Adapt `proxy/` entry point to export a default Hono `fetch` handler compatible with the
  Workers runtime (already how Hono works — minimal change).
- Verify `better-auth` + `drizzle-orm` + `postgres` work under `nodejs_compat`; if not,
  switch to **Hyperdrive** + `postgres` driver or the `drizzle-orm/pg-proxy` fetch adapter.
- Update secrets management: `fly secrets` → Cloudflare Workers environment variables /
  secrets via `wrangler secret put`.
- Update `docs/architecture.md` to reflect the new hosting topology.
- New ADR `0018-cloudflare-hosting.md` documenting the decision and trade-offs.
- Update CI/CD (GitHub Actions) deploy step from `fly deploy` to `wrangler deploy` and
  Cloudflare Pages publish.

### Out of scope

- Any change to API contracts, data models, or frontend behaviour.
- Adopting Cloudflare D1 or KV — Supabase Postgres remains the database.
- Custom domain setup (can follow as a trivial one-liner after migration).
- Edge caching via Cloudflare Cache API (separate improvement).

## Non-functional requirements

- **Zero downtime migration:** new deployment confirmed healthy before old Fly.io app is
  stopped.
- **Secrets parity:** all five secrets (`DATABASE_URL`, `BETTER_AUTH_SECRET`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PUBLIC_APP_URL`) available in Workers.
- **Node.js compatibility:** Workers runtime must support the `postgres` TCP driver or a
  suitable replacement must be chosen (Hyperdrive / fetch-based adapter).
- **Browser support:** unchanged (`docs/frontend.md`).

## Dependencies

- AUTH-01 (in progress) introduced `better-auth` + `drizzle-orm` + `postgres`. This
  change must confirm or resolve compatibility with the CF Workers runtime.
- No dependency on open backlog items.

## Migration path (INFRA-01 → custom domain)

Once Workers + Pages are live on `*.workers.dev` / `*.pages.dev`, binding a custom domain
is a Cloudflare dashboard one-click. No code change required.
