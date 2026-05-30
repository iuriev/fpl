# Design: Fly.io Deployment (INF-03)

## Overview

Single-service deployment: Hono serves both the `/api/*` proxy routes and the compiled
SPA static files from one Node.js process. A `Dockerfile` at the repo root builds both
workspaces and produces the image. A `fly.toml` declares the Fly.io app.

```
Docker image
└── /app
    ├── proxy/src/        ← TypeScript source (run directly via tsx)
    ├── web/dist/         ← compiled SPA assets
    └── node_modules/     ← production deps only
```

---

## 1. Hono static file serving (`proxy/src/index.ts`)

Add `serveStatic` from `@hono/node-server/serve-static` after all `/api/*` routes:

```ts
import { serveStatic } from '@hono/node-server/serve-static';

// After all /api/* routes — serves built SPA assets
app.use('*', serveStatic({ root: './web/dist' }));

// SPA fallback — any unmatched route returns index.html for client-side routing
app.get('*', serveStatic({ path: './web/dist/index.html' }));
```

The path `./web/dist` is relative to the process working directory (`/app` in Docker).
No changes needed to `API_BASE = '/api'` in the web client.

---

## 2. Proxy runtime in production

The proxy currently uses `tsx watch` for development. For the Docker image, `tsx`
(without watch) runs the TypeScript source directly — avoids a separate compile step and
module-resolution issues with `moduleResolution: "bundler"`.

Move `tsx` from `devDependencies` to `dependencies` in `proxy/package.json`.

Add a `start` script:

```json
"start": "tsx src/index.ts"
```

---

## 3. Dockerfile (repo root)

Multi-stage build. Stage 1 compiles the SPA; Stage 2 is the runtime image.

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY web/package*.json ./web/
COPY proxy/package*.json ./proxy/
RUN npm ci
COPY . .
RUN npm run build -w web

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY web/package*.json ./web/
COPY proxy/package*.json ./proxy/
RUN npm ci --omit=dev --workspace=proxy
COPY proxy/src ./proxy/src
COPY --from=builder /app/web/dist ./web/dist
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node_modules/.bin/tsx", "proxy/src/index.ts"]
```

**Why two-stage:** the builder installs all deps (including Vite, React, etc.) and
compiles the SPA. The runtime image only installs proxy production deps, keeping the
image small.

---

## 4. fly.toml (repo root)

```toml
app = 'fpl-squad-viewer'
primary_region = 'lhr'

[build]

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = 'off'
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  size = 'shared-cpu-1x'
  memory = '256mb'
```

Key settings:
- `auto_stop_machines = 'off'` — machine never sleeps; in-memory cache is preserved.
- `min_machines_running = 1` — always at least one machine up.
- `primary_region = 'lhr'` — London; closest to FPL API servers (UK).
- `shared-cpu-1x` + `256mb` — fits within the Fly.io free tier (3 VMs free).

---

## 5. .dockerignore (repo root)

Exclude large directories that don't belong in the build context:

```
node_modules
web/node_modules
proxy/node_modules
web/dist
proxy/dist
.git
design
```

---

## 6. Environment variables

No secrets required. The only runtime env var is `PORT` (set to `3001` in the
Dockerfile and matched in `fly.toml`'s `internal_port`). The proxy already reads
`process.env.PORT ?? 3001`.

---

## 7. Deployment workflow

```
# First time
fly launch --no-deploy        # creates fly.toml and registers the app
fly deploy                    # builds image and deploys

# Subsequent deploys
fly deploy                    # one command
```

---

## Component impact summary

| File | Change |
|---|---|
| `proxy/src/index.ts` | Add `serveStatic` for `web/dist/` and SPA fallback |
| `proxy/package.json` | Move `tsx` to `dependencies`; add `start` script |
| `Dockerfile` | New file at repo root |
| `fly.toml` | New file at repo root |
| `.dockerignore` | New file at repo root |
