# Tasks: Migrate to Cloudflare (INFRA-01)

## Step 1 — Verify Workers runtime compatibility

Outcome: confirmed that `better-auth` + `drizzle-orm` + `postgres` run under
`nodejs_compat` in a local Wrangler dev session against the Postgres DB.

- [ ] Install `wrangler` as a dev dependency in `proxy/`.
- [ ] Add minimal `wrangler.toml` with `nodejs_compat` flag.
- [ ] Run `wrangler dev` and hit `/api/bootstrap` — verify FPL proxy routes respond.
- [ ] Hit `/api/auth/sign-in` — verify `better-auth` initialises without errors.
- [ ] If `postgres` TCP fails under `nodejs_compat`, evaluate Hyperdrive; document decision
      in `design.md` and update tasks accordingly.

---

## Step 2 — Adapt proxy entry point for Workers

Outcome: `proxy/src/index.ts` exports a Workers-compatible default handler.

- [ ] Replace Node.js `serve(app, { port })` with `export default app` (Hono CF Workers
      pattern — `app` is a valid `ExportedHandler` when using Hono's CF adapter).
- [ ] Remove `serveStatic` middleware and any `web/dist` path references from the proxy.
- [ ] Add narrow CORS middleware (`Access-Control-Allow-Origin`) for the interim period
      while Pages and Workers are on different subdomains.
- [ ] Confirm local `wrangler dev` still passes all proxy unit tests (`npm -w proxy test`).

---

## Step 3 — Configure Cloudflare Workers deployment

Outcome: proxy deploys to Cloudflare Workers via `wrangler deploy`.

- [ ] Finalize `wrangler.toml` at repo root or `proxy/` (entry point, compat date,
      `nodejs_compat` flag, `[vars]` for non-secret env).
- [ ] Set all five secrets via `wrangler secret put`:
      `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
      `PUBLIC_APP_URL`.
- [ ] Run `wrangler deploy` — confirm Worker is live and `/api/bootstrap` returns data.
- [ ] Smoke-test auth: sign up, sign in, `GET /api/me` — confirm tokens work end-to-end.

---

## Step 4 — Configure Cloudflare Pages for the SPA

Outcome: `web/dist/` is deployed to Cloudflare Pages and the SPA loads correctly.

- [ ] Create a Cloudflare Pages project pointing at `web/dist/` (via Wrangler CLI or
      dashboard).
- [ ] Set build command: `npm -w web run build`; output directory: `web/dist`.
- [ ] Set `VITE_API_BASE_URL` (or equivalent) to the Workers URL for the interim period.
- [ ] Verify SPA loads, routes work (handle 404 → `index.html` via `_redirects` or Pages
      config), and `/api/*` calls reach the Worker.

---

## Step 5 — Remove Fly.io configuration

Outcome: Fly.io is fully removed from the repo.

- [ ] Delete `fly.toml`.
- [ ] Delete `Dockerfile` (if it existed only for Fly.io; keep if used elsewhere).
- [ ] Remove any `fly` CLI calls from scripts or CI.
- [ ] Confirm the app is healthy on Cloudflare before removing Fly.io app from dashboard.

---

## Step 6 — Update CI/CD pipeline

Outcome: GitHub Actions deploys to Cloudflare on every push to `main`.

- [ ] Update `.github/workflows/deploy.yml` (or equivalent):
      - Replace `fly deploy` with `wrangler deploy --env production`.
      - Add Cloudflare Pages publish step.
- [ ] Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to GitHub Actions secrets.
- [ ] Trigger a deploy via CI — confirm both Workers and Pages deploy successfully.

---

## Step 7 — Documentation and ADR

Outcome: architecture docs and decision records reflect the new hosting topology.

- [ ] Add `docs/decisions/0018-cloudflare-hosting.md`:
      - Decision: Cloudflare Workers + Pages.
      - Trade-offs: `nodejs_compat` vs Hyperdrive; split vs monolith hosting.
      - Supersedes: Fly.io references in `0001-tech-stack.md` (note there, don't delete).
- [ ] Update `docs/architecture.md`:
      - Replace Fly.io topology diagram with CF Pages + Workers diagram.
      - Update secrets table (replace `fly secrets set` with `wrangler secret put`).
      - Update deploy command.
- [ ] Confirm no other docs reference Fly.io without a note that it is superseded.
