# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Fantasy Premier League (FPL) companion web app, mobile-first. No authentication: a user
enters their public FPL team ID and views their squad, each player's points, player
availability statuses, and a per-gameweek summary, navigating between gameweeks.

The project is built spec-first; application code comes last. Read these before working:

- `openspec/` — OpenSpec specs and change proposals (the *what*). Workflow: propose -> apply -> archive.
- `docs/architecture.md` — system overview.
- `docs/decisions/` — Architecture Decision Records (the *why*); see the README index.
- `docs/frontend.md` — frontend conventions (styling, structure, testing).
- `docs/design-workflow.md` — how Claude Design exports flow into the codebase.

## Rules

- **English only.** All repository content — code, identifiers, file names, UI text, comments,
  docs, and commit messages — MUST be in English. (Chat with the user may be in another language.)
- **Record decisions automatically.** When a rule, convention, or architectural decision is
  added or changed, document it without being asked: add or supersede an ADR in
  `docs/decisions/`, and update the affected docs and this file. Never delete a superseded ADR —
  mark it `Superseded by ADR-XXXX` and link it.
- **No hardcoded design values.** Components reference design tokens via CSS variables
  (`--fpl-*`) or base components — never literal colors, sizes, or spacing. See `docs/frontend.md`.

## Commands

```bash
npm run build   # compiles the placeholder stub; will change once the SPA + proxy are scaffolded
```

## Architecture

Planned (not yet scaffolded): an npm-workspaces monorepo with `web/` (React + Vite SPA) and
`proxy/` (Hono) fronting the public FPL API, plus a shared types module. See
`docs/architecture.md` and ADRs 0001 / 0003 / 0006. The current `src/index.ts` is a placeholder
to be removed at scaffolding.
