# ADR 0022: Deployment — Docker Compose + VPS (Fly.io removed)

- Status: Accepted
- Date: 2026-06-12
- Deciders: ivan.iuriev

## Context

The project was deployed on Fly.io (see ADR 0001). Fly.io offers a free trial but
charges after a few days, making it unsuitable as the long-term hosting platform.

The goal is a deployment setup that:
- Runs locally with one command
- Works on any standard Linux VPS without provider lock-in
- Keeps local and production environments as similar as possible

## Decision

Remove Fly.io (`fly.toml` deleted). Use Docker Compose as the foundation for both
local development and production deployments.

Local: `docker compose up` starts the app and a Postgres container.

Production: Docker Compose on a Linux VPS, deployed via GitHub Actions (SSH into
server, pull latest image, restart containers). Hosting provider is TBD — the setup
is intentionally provider-agnostic.

## Consequences

- One-command local setup: `cp .env.example .env && docker compose up`
- No vendor lock-in on the hosting side
- Secrets managed via `.env` on the server (not a secrets manager)
- Remote deployment (GitHub Actions workflow, VPS provisioning) is deferred until a
  hosting provider is chosen
- ~5–10 seconds of downtime during restarts (acceptable for this project)

## Alternatives considered

**Coolify** — self-hosted PaaS with a web UI. Easier to manage long-term but requires
~1 GB RAM on the server and additional setup complexity. Deferred as a future upgrade.

**Dokku** — self-hosted Heroku. Familiar workflow (`git push`) but more moving parts
for Postgres and secrets. Deferred.

**Stay on Fly.io** — ruled out due to cost after the free trial.
