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
- `docs/fpl-api.md` — local reference for the public FPL API endpoints we use.
- `docs/testing.md` — testing strategy (unit tests).

## Rules

- **English only.** All repository content — code, identifiers, file names, UI text, comments,
  docs, and commit messages — MUST be in English. (Chat with the user may be in another language.)
- **Record decisions automatically.** When a rule, convention, or architectural decision is
  added or changed, document it without being asked: add or supersede an ADR in
  `docs/decisions/`, and update the affected docs and this file. Never delete a superseded ADR —
  mark it `Superseded by ADR-XXXX` and link it.
- **No hardcoded design values.** Components reference design tokens via CSS variables
  (`--fpl-*`) or base components — never literal colors, sizes, or spacing. See `docs/frontend.md`.
- **`rem` for all lengths.** Use `rem` for spacing, sizes, radii, positions, and breakpoints.
  Exception: border widths (`1px`, `2px`) and shadow offsets stay in `px` — they are visual
  strokes, not layout values. See `docs/frontend.md`.
- **No descriptive comments.** Write no comments unless the WHY is non-obvious: a hidden
  constraint, a workaround for a specific bug, or a deliberate exception to a convention. Never
  write comments that restate what the code already says through its name and structure — no file
  headers, no JSDoc that lists states or parameters the types already describe, no `// renders X`
  above a function named `renderX`.
- **Modern Web Guidance first.** Before implementing any HTML/CSS or client-side JS feature, run
  the `modern-web-guidance` skill to retrieve the current best-practice guide. After retrieving
  guidance, cross-check every suggested API or feature against the project's browser support policy
  defined in `docs/frontend.md` (last 3 Chrome versions, last 2 Safari versions). Do not use APIs
  that fall outside that matrix without explicit approval.

## Architecture

Planned (not yet scaffolded): an npm-workspaces monorepo with `web/` (React + Vite SPA) and
`proxy/` (Hono) fronting the public FPL API, plus a shared types module. See
`docs/architecture.md` and ADRs 0001 / 0003 / 0006. The current `src/index.ts` is a placeholder
to be removed at scaffolding.
