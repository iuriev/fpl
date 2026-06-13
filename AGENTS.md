# AGENTS.md

Cursor agent instructions for the FPL Squad Viewer repository. For coding rules and conventions,
**`CLAUDE.md` is the source of truth** — follow it in full. This file adds Cursor-specific
context: repo layout, commands, skills, and workflows.

## Project

A mobile-first Fantasy Premier League companion web app. No authentication: the user enters a
public FPL team ID and views their squad, player points, availability statuses, and per-gameweek
summary, navigating between gameweeks.

## Read before working

| Document | Purpose |
| --- | --- |
| `CLAUDE.md` | Rules, conventions, spec-first workflow |
| `openspec/` | Capabilities and change proposals (propose → apply → archive) |
| `docs/architecture.md` | System overview |
| `docs/decisions/` | ADRs (the *why*); see README index |
| `docs/frontend.md` | Styling, structure, testing |
| `docs/design-workflow.md` | Claude Design exports → codebase |
| `docs/fpl-api.md` | Public FPL API endpoints we use |
| `docs/testing.md` | Unit test strategy |

## Repository layout

npm workspaces monorepo:

```
web/        React + Vite + TypeScript SPA
proxy/      Hono BFF fronting the public FPL API (cache + trim JSON)
openspec/   OpenSpec specs and change proposals
docs/       Architecture overview + ADRs
design/     Claude Design exports (v1, v2, …)
.claude/    Claude Code agents, skills, opsx commands
.agents/    Project skills (modern-web-guidance)
```

Shared types live in `web/src/types/` and `proxy/src/types/` — keep contracts in sync.

## Commands

From the repo root:

```bash
npm run dev      # proxy + web concurrently
npm run build    # build all workspaces
npm run lint     # lint all workspaces
npm run test     # fast unit tests across all workspaces
npm run test:ui  # Storybook component tests (web only)
npm run format   # Prettier across the repo
```

Workspace-specific:

```bash
npm run dev -w web          # Vite dev server
npm run storybook -w web    # Storybook on :6006
npm run dev -w proxy        # Hono proxy with tsx watch
```

Verify changes before claiming done: run relevant `lint` and `test` for touched workspaces.

## OpenSpec workflow

1. **Propose** — new capability or change under `openspec/changes/<name>/` (proposal, specs,
   design, tasks). Skill: `.claude/skills/openspec-propose/SKILL.md`
2. **Apply** — implement against `tasks.md`; verify against spec scenarios. Skill:
   `.claude/skills/openspec-apply-change/SKILL.md`
3. **Archive** — move completed change to `openspec/changes/archive/`. Skill:
   `.claude/skills/openspec-archive-change/SKILL.md`
4. **Finalize** — verify, backlog, docs, archive, propose commit. Skill:
   `.claude/skills/finalize-task/SKILL.md` (also `.cursor/skills/finalize-task/`)

Do not write application code until requirements and design are approved.

## Skills (project)

| Skill | When to use |
| --- | --- |
| `.claude/skills/modern-web-guidance/` | **Mandatory first** for any HTML/CSS/client-side JS work |
| `.claude/skills/openspec-propose/` | Starting a new change proposal |
| `.claude/skills/openspec-apply-change/` | Implementing an approved change |
| `.claude/skills/openspec-archive-change/` | Finalizing a completed change |
| `.claude/skills/finalize-task/` | **End-of-task wrap-up**: lint/test/build, backlog, docs, archive, propose commit |
| `.claude/skills/lineup-model-eval/` | **Lineup backtest**: user GWs → `npm run lineup:eval` → metrics + `IMPROVEMENTS-gw*.md` proposals |
| `.claude/skills/investor-product-overview/` | Investor product brief — HTML + PDF with live app screenshots |
| `.claude/skills/investor-competitive-analysis/` | Competitor research — parity vs differentiation PDF |
| `.claude/skills/openspec-explore/` | Exploring ideas before committing to a change |

## Subagent roles (`.claude/agents/`)

Use when delegating focused work:

- `frontend-developer` — React SPA, design system, screens, tests
- `backend-developer` — Hono proxy, FPL client, caching, tests
- `business-analyst` — requirements, OpenSpec proposals, ADRs
- `design-integrator` — ingest Claude Design exports, diff, plan changes

## Key conventions (summary)

Full detail in `CLAUDE.md` and `docs/frontend.md`. Non-negotiable highlights:

- **English only** in repo content (chat with the user may be in another language)
- **Design tokens** via CSS variables (`--fpl-*`); no hardcoded colors/sizes/spacing
- **`rem` for all lengths** (except border widths and shadow offsets in `px`)
- **No barrel re-exports** — import directly, e.g.
  `import { Foo } from '@/components/ui/Foo/Foo'`
- **Domain component names** — `PlayerCard`, not `PlayerToken`
- **No descriptive comments** unless the WHY is non-obvious
- **Never commit** without explicit user permission
- **Record decisions** — new conventions → ADR in `docs/decisions/`
- **Native CSS primitives (ADR 0014)** — prefer Popover API, `:has()`, and `@starting-style`
  over JS overlay/state wiring when possible; see `docs/frontend.md`

## Operations (production admin)

### Health check

```bash
curl https://<HOST>/api/health
```

Response includes `predictionsWarmup.phase` (`idle | ingest | score | done | error`) and
`predictionsWarmup.lastError`. Check this first when AI suggestions are unavailable.

### Re-trigger prediction warmup

If `phase = error` or prediction data is missing for the current GW, retrigger without
restarting the server:

```bash
curl -X POST https://<HOST>/api/admin/predictions/warmup
```

After calling, poll `/api/health` until `predictionsWarmup.phase = done`.
The warmup is a no-op while already running — safe to call multiple times.

## Test team ID

Use team ID **72828** when verifying squad-related behavior against spec scenarios.
