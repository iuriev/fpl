# Architecture Overview

> Living document. Describes how the system is built **right now**. Update it whenever
> structure changes. The *why* behind each decision lives in `docs/decisions/` (ADRs).

## What we are building

A Fantasy Premier League (FPL) companion web app for mobile and desktop browsers.
No authentication: a user enters their public FPL **team ID** and views their squad,
each player's points for a gameweek, and navigates between gameweeks.

## High-level shape

```
[ Browser SPA ]  --HTTP-->  [ Our proxy/BFF ]  --HTTP-->  [ Public FPL API ]
  React + Vite               thin Node service            fantasy.premierleague.com/api
  mobile-first               cache + trim JSON            (no CORS, no auth)
```

**Why a proxy is mandatory:** the public FPL API sends no CORS headers, so a browser
cannot call it directly. The proxy also lets us cache responses (FPL data changes at most
once per gameweek for most endpoints) and reshape payloads to exactly what the UI needs.
See `docs/decisions/0001-tech-stack.md`.

## Data sources (public FPL API)

| Endpoint | Purpose |
| --- | --- |
| `bootstrap-static/` | Players, teams, gameweek (event) list, current gameweek |
| `entry/{team_id}/` | Manager/team summary by public ID |
| `entry/{team_id}/event/{gw}/picks/` | Squad picks for a gameweek (15 players, captain, bench) |
| `event/{gw}/live/` | Per-player points for a gameweek |
| `entry/{team_id}/history/` | Per-gameweek history for a team |

## Planned repository layout (proposed — finalized at scaffolding)

```
web/        # React + Vite SPA (frontend)
proxy/      # thin Node service that fronts the FPL API
openspec/   # OpenSpec specs (capabilities) and change proposals
docs/       # architecture overview + decision records (ADRs)
```

## Documentation model

- **OpenSpec specs** (`openspec/specs/`) describe *what* a capability does and how it behaves.
- **OpenSpec changes** (`openspec/changes/`) are proposals to add/modify/remove behavior
  (`/opsx:propose` -> `/opsx:apply` -> `/opsx:archive`).
- **ADRs** (`docs/decisions/`) capture *why* we made a cross-cutting architectural or product
  choice. When a decision changes, the old ADR is marked `Superseded by ADR-XXXX` (never deleted)
  so the history of *why it changed* is preserved.

## Production

Live at **https://fpl-squad-viewer.fly.dev/** — single Hono service on Fly.io (London, `shared-cpu-1x`, 256 MB RAM, 1 machine, always-on).

The proxy serves both the built SPA (`web/dist/`) and all `/api/*` routes from one process, preserving the in-memory cache across requests.

Deploy: `fly deploy` from repo root.

## Required secrets (Fly.io)

Set these with `fly secrets set KEY=value` before deploying:

| Secret | Description |
| --- | --- |
| `DATABASE_URL` | Supabase Postgres connection string (pooler URL, port 6543) |
| `BETTER_AUTH_SECRET` | Random 32-byte hex string — used to sign sessions and tokens |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret from Google Cloud Console |
| `PUBLIC_APP_URL` | Full origin of the deployed app, e.g. `https://fpl-squad-viewer.fly.dev` |
| `RESEND_API_KEY` | Resend API key for transactional email (email verification) |
| `FROM_EMAIL` | Sender address for verification emails, e.g. `noreply@fpl-squad-viewer.fly.dev` |

`DATABASE_URL` and `BETTER_AUTH_SECRET` are required at boot — the proxy exits immediately if
either is missing. The Google OAuth secrets and `RESEND_API_KEY` are optional for local
development (social sign-in and email verification will be unavailable if unset).

## Status

Early scaffolding. Stack and MVP scope decided (ADR 0001, 0002). Design tooling pipeline and
the concrete repo scaffolding are the next decisions.