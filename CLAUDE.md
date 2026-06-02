# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Cursor agents: see also `AGENTS.md` for repo-specific commands, skills, and workflows.

## Project

A Fantasy Premier League (FPL) companion web app, mobile-first. No authentication: a user
enters their public FPL team ID and views their squad, each player's points, player
availability statuses, and a per-gameweek summary, navigating between gameweeks.

The project is built spec-first; application code comes last. Read these before working:

- `openspec/` — OpenSpec specs and change proposals (the *what*). Workflow: propose -> apply -> archive.
- `docs/backlog.md` — single source of truth for all ideas, features, and prioritised work. See the backlog workflow below.
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
- **Always use the latest library version.** Before using any new library or package, fetch its
  current documentation via the `context7` MCP tool (`resolve-library-id` then `query-docs`) to
  learn the latest stable API. Always implement against the latest stable version unless a
  specific version is explicitly stated in the prompt.
- **Modern Web Guidance first.** Before implementing any HTML/CSS or client-side JS feature, run
  the `modern-web-guidance` skill to retrieve the current best-practice guide. After retrieving
  guidance, cross-check every suggested API or feature against the project's browser support policy
  defined in `docs/frontend.md` (last 3 Chrome versions, last 2 Safari versions). Do not use APIs
  that fall outside that matrix without explicit approval.
- **Native CSS primitives first (ADR 0014).** When building overlays, disclosures, or
  state-driven styling, prefer the **Popover API**, **`:has()`**, and **`@starting-style`** before
  JS libraries or React state whose only job is presentation. See `docs/frontend.md` and ADR 0014
  for patterns and exceptions.
- **Never commit without explicit permission.** Do not run `git commit`, `git push`, `git amend`,
  or any other git operation that modifies history or publishes changes unless the user explicitly
  asks. After finishing work, show what changed and wait for approval.
- **Consult proactively.** When something is ambiguous or a meaningful decision has trade-offs,
  ask — do not act silently. Favor short check-ins over autonomous choices.
- **Domain names for components.** Name components after what they represent to the user, not
  design-system jargon. Use `PlayerCard`, not `PlayerToken`; "Token", "Atom", "Molecule" belong
  to the design vocabulary only.
- **No barrel re-exports.** Do not create `index.ts` files inside component folders. Do not
  create a global `components/index.ts` or `ui/index.ts` barrel. Import directly:
  `import { Foo } from '@/components/ui/Foo/Foo'`.
- **Spec-first workflow.** Work in this order: business requirements → task breakdown → design →
  code. Do not write application code until requirements and design are approved.
- **Maintain Help Tour.** Always update the help tour (`HelpTour.tsx`, `copy.ts`, `TransferScreen.test.tsx`) when changing the Transfer Screen layout or functionality to ensure steps remain accurate and targets exist.
- **Backlog workflow.** When the user dictates ideas, mentions features to remember, or asks to
  note something, add it to `docs/backlog.md` immediately. The backlog is the single capture
  point for everything not yet in an OpenSpec change. To promote an idea to active work: run
  `/opsx:propose` to turn it into an OpenSpec change proposal, then implement from there.
- **DB schema documentation.** Whenever `proxy/src/db/schema.ts` is created or modified,
  update `docs/db-schema.md` in the same change: keep the per-table Markdown column table and
  the Mermaid ER diagram in sync with the Drizzle schema. This is the non-developer-friendly
  view of the database and must never lag behind the code.
- **Single source of truth.** `docs/backlog.md` and `openspec/` are the only places where
  tasks, ideas, specs, and plans may live. Do not create plan files, design specs, or task
  lists anywhere else in the project (e.g. no `docs/superpowers/`, no ad-hoc markdown plans).
  Superpowers skills may generate intermediate working documents during a session, but the
  permanent record always goes into backlog or OpenSpec.

## Agent efficiency

Large command output bloats the context window. Keep terminal output small:

- **`git log`:** always `-n 10 --oneline`
- **`git diff`:** prefer `--stat` first; full diff only for specific paths
- **`npm install`:** use `--silent` or `--loglevel=error` unless debugging install failures
- **Search:** use workspace Glob/Grep tools with limits — never unbounded `find`
- **Tests and lint:** run scoped workspace commands (`-w web`, `-w proxy`); on failure,
  inspect only the failing output

During work, skip narrating obvious tool steps ("I'll now read the file…"). Prefer scoped
tool calls over broad exploration. Final responses to the user stay complete: summary, code
citations where relevant, and test evidence before claiming done.

## Session close

When a task is finished and the user corrected the same issues more than once, offer:
"What from this session should we bake into `CLAUDE.md`, `AGENTS.md`, or a skill so we don't
repeat manual fixes?" Propose concrete edits; do not apply without user approval.

When improving a skill from a completed session, review corrections and repeated manual fixes,
then propose edits to the relevant `SKILL.md` (or this file). Accept only what the user approves.

## Architecture

Planned (not yet scaffolded): an npm-workspaces monorepo with `web/` (React + Vite SPA) and
`proxy/` (Hono) fronting the public FPL API, plus a shared types module. See
`docs/architecture.md` and ADRs 0001 / 0003 / 0006. The current `src/index.ts` is a placeholder
to be removed at scaffolding.
