# Proposal: Fly.io Deployment (INF-03)

## Problem

The app runs locally but is not accessible on the internet. There is no production
deployment, no public URL, and no infrastructure to host the SPA or the proxy.

The proxy **must** be a long-running process — its in-memory cache is the only defence
against the public FPL API banning our IP. A serverless deployment (Vercel Functions,
Cloudflare Workers) would reset the cache on every cold start and greatly increase the
number of upstream calls.

## Proposed Change

Deploy the entire app as a **single Hono service on Fly.io** (free tier):

- The Hono proxy serves the built SPA (`web/dist/`) as static files in addition to
  handling all `/api/*` routes.
- A `Dockerfile` at the repo root builds both workspaces and produces a single image.
- A `fly.toml` declares the service: one shared-cpu-1x VM, port 3001, auto-stop disabled.
- The SPA `API_BASE` stays at `/api` (relative) — no URL changes needed.
- The public domain is `<app-name>.fly.dev` (free, TLS included).

## Why Fly.io

| Requirement | Fly.io free tier |
|---|---|
| Always-on (no sleep) | ✓ machines don't sleep by default |
| In-memory cache survives | ✓ single long-running process |
| Free | ✓ 3 shared VMs free, 1 needed |
| TLS + domain | ✓ `*.fly.dev` with Let's Encrypt |
| Single deploy unit | ✓ one image, one service |

## Goals

- Public URL reachable via browser, TLS included.
- In-memory cache works correctly in production (same process, no resets).
- Single `fly deploy` command deploys both frontend and backend.
- Build reproducible via `Dockerfile` checked into the repo.

## Non-Goals

- Custom domain (backlog, future).
- CI/CD pipeline (backlog, future).
- Horizontal scaling or multi-region (not needed at this traffic level).
- Persistent storage or database (not part of this app).
- INF-01 / INF-02 (TTL raise and rate limiter) — tracked separately; must be done before
  any significant public traffic but are independent of deployment infrastructure.
