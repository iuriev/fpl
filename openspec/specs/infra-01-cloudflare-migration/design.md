# Design: Migrate to Cloudflare (INFRA-01)

## Current implementation

- Single Hono service on Fly.io: `fly.toml` + `Dockerfile` at repo root.
- `proxy/src/index.ts` mounts `/api/*` routes + `serveStatic('./web/dist')` — one process
  serves both the SPA and the API.
- Secrets managed via `fly secrets set`.
- Deploy command: `fly deploy` from repo root.
- `proxy` uses `postgres` (TCP driver) + `drizzle-orm` + `better-auth` — all Node.js
  packages that rely on Node.js TCP/net APIs.

## Target architecture

```
[ Browser ]
   |
   |-- GET /*, assets --> [ Cloudflare Pages ]  (web/dist, global CDN)
   |
   |-- /api/* ----------> [ Cloudflare Workers ]  (proxy/src, Hono fetch handler)
                               |
                               +--> [ Supabase Postgres ]  (unchanged, TCP via Hyperdrive
                                                            or nodejs_compat)
                               |
                               +--> [ Public FPL API ]  (fantasy.premierleague.com)
```

Pages and Workers are separate Cloudflare projects but can share the same custom domain
via a Pages Function proxy rule (or via a Worker route). For initial deployment the
`*.pages.dev` and `*.workers.dev` default subdomains are sufficient.

## Key decisions

1. **SPA → Cloudflare Pages.** `web/` builds to `web/dist/`; Pages deploys from that
   directory. No server-side rendering needed. Free tier: unlimited bandwidth.

2. **Proxy → Cloudflare Workers.** Hono's `hono/cloudflare-workers` export exposes a
   `fetch(request, env, ctx)` default handler — this is the only export change needed.
   The `wrangler.toml` points Workers at the proxy build output.

3. **Database connectivity — Hyperdrive (preferred).** The `postgres` TCP driver does not
   work in the default Workers runtime. Two options:
   - **`nodejs_compat` flag** (simpler): enables Node.js TCP shims in Workers. Postgres
     driver works unchanged. Slightly higher bundle size.
   - **Cloudflare Hyperdrive** (better for prod): Cloudflare-managed connection pooler that
     exposes a local TCP endpoint inside the Worker. Fastest latency, zero bundle overhead,
     but requires creating a Hyperdrive resource and replacing `DATABASE_URL` with the
     Hyperdrive binding.
   
   Decision: start with `nodejs_compat` (zero extra infra, easy to validate); migrate to
   Hyperdrive as a follow-up if connection latency is noticeable.

4. **`better-auth` on Workers.** `better-auth` v1+ officially supports edge runtimes
   (Cloudflare Workers, Bun, Deno). No changes to auth code; the `nodejs_compat` flag
   covers the remaining Node.js polyfills it needs.

5. **Static serving removed from proxy.** `serveStatic` is no longer needed — Pages
   handles the SPA. Remove the `serveStatic` middleware and `web/dist/` copy step from the
   proxy build. CORS headers may be needed for `/api/*` if Pages and Workers run on
   different subdomains during transition.

6. **Secrets → Cloudflare Workers secrets.** All five secrets are added via
   `wrangler secret put <KEY>`. They are exposed as `env.<KEY>` in the Worker.
   `PUBLIC_APP_URL` becomes the Pages URL (or custom domain once set).

7. **Deploy pipeline.** Replace `fly deploy` step in CI with:
   - `wrangler deploy` for Workers.
   - `wrangler pages deploy web/dist` (or Cloudflare Pages GitHub integration) for SPA.

8. **ADR:** `0018-cloudflare-hosting.md` — records the switch from Fly.io, the Hyperdrive
   vs `nodejs_compat` trade-off, and why D1 was not adopted.

## File changes

| File | Action |
|------|--------|
| `fly.toml` | Delete |
| `Dockerfile` | Delete |
| `wrangler.toml` | Add — Workers config (entry point, compat flags, bindings) |
| `proxy/src/index.ts` | Swap `serve()` for `export default app` (Hono CF Workers pattern) |
| `proxy/package.json` | Add `wrangler` dev dependency; update `deploy` script |
| `web/` (Pages) | No code change; add `wrangler.toml` or Pages project via dashboard |
| `.github/workflows/deploy.yml` | Replace `fly deploy` with `wrangler deploy` |
| `docs/architecture.md` | Update topology, secrets table, deploy command |
| `docs/decisions/0018-cloudflare-hosting.md` | New ADR |

## CORS consideration

While Pages (`fpl.pages.dev`) and Workers (`fpl.workers.dev`) are on different origins,
the Worker must emit `Access-Control-Allow-Origin: https://fpl.pages.dev` (or the custom
domain). Once a custom domain is set with a Workers route matching `/api/*`, both share the
same origin and CORS is no longer needed. Plan: add a narrow CORS middleware for the
interim period.

## Wrangler config sketch

```toml
# wrangler.toml
name = "fpl-proxy"
main = "proxy/src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
PUBLIC_APP_URL = "https://fpl.pages.dev"

# Secrets (set via `wrangler secret put`):
# DATABASE_URL, BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
```
