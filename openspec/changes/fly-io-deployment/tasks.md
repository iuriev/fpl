## 1. Proxy: static file serving

- [x] 1.1 Add `serveStatic` import from `@hono/node-server/serve-static` in `proxy/src/index.ts`
- [x] 1.2 Add `app.use('*', serveStatic({ root: './web/dist' }))` after all `/api/*` routes
- [x] 1.3 Add `app.get('*', serveStatic({ path: './web/dist/index.html' }))` as SPA fallback

## 2. Proxy: production runtime

- [x] 2.1 Move `tsx` from `devDependencies` to `dependencies` in `proxy/package.json`
- [x] 2.2 Add `"start": "tsx src/index.ts"` script to `proxy/package.json`

## 3. Docker

- [x] 3.1 Create `Dockerfile` at repo root (two-stage: builder compiles SPA, runtime image
      installs proxy prod deps only and copies `web/dist/`)
- [x] 3.2 Create `.dockerignore` at repo root (exclude `node_modules`, `web/dist`,
      `proxy/dist`, `.git`, `design`)
- [x] 3.3 Verify `docker build -t fpl .` succeeds locally
- [x] 3.4 Verify `docker run -p 3001:3001 fpl` serves the SPA on `http://localhost:3001`
      and `/api/gameweeks` returns data

## 4. Fly.io config

- [x] 4.1 Create `fly.toml` at repo root (app name `fpl-squad-viewer`, region `lhr`,
      port `3001`, `auto_stop_machines = 'off'`, `min_machines_running = 1`,
      `shared-cpu-1x` / `256mb`)

## 5. Deploy

- [ ] 5.1 Install Fly CLI: `brew install flyctl` (or `curl -L https://fly.io/install.sh | sh`)
- [ ] 5.2 Authenticate: `fly auth login`
- [ ] 5.3 Register the app: `fly launch --no-deploy` (confirm it picks up `fly.toml`)
- [ ] 5.4 Deploy: `fly deploy`
- [ ] 5.5 Verify the live URL (`https://fpl-squad-viewer.fly.dev`) loads the SPA and
      the app works end-to-end

## 6. Post-deploy

- [ ] 6.1 Record the live URL in `docs/architecture.md` under a new "Production" section
- [ ] 6.2 Add `INF-01` and `INF-02` (TTL raise + rate limiter) as P0 in `docs/backlog.md`
      now that the app is publicly accessible
