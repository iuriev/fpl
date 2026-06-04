# Architecture Decision Records (ADRs)

This folder records **why** we made cross-cutting architectural and product decisions.
Each ADR is one file: `NNNN-short-title.md`, numbered in order.

## Process

1. When a meaningful decision comes up, add a new ADR using the template below.
2. Status starts as `Proposed`, becomes `Accepted` once we agree.
3. **Never delete an ADR.** If a decision changes, write a new ADR and mark the old one
   `Superseded by ADR-XXXX`, with a link. This keeps the history of why things changed.

ADRs answer *why*. OpenSpec specs (`openspec/specs/`) answer *what* a feature does and how
it behaves. Avoid duplicating: link between them instead.

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-tech-stack.md) | Tech stack: Vite SPA + thin Node proxy | Accepted (tentative start) |
| [0002](0002-mvp-scope.md) | MVP scope: squad viewer | Superseded by 0005 |
| [0003](0003-proxy-framework.md) | Proxy framework: Hono | Accepted |
| [0004](0004-design-pipeline.md) | Design pipeline: Claude Design -> Claude Code | Accepted |
| [0005](0005-mvp-scope-expansion.md) | Expand MVP scope: player statuses + gameweek summary | Accepted |
| [0006](0006-frontend-architecture.md) | Frontend architecture and conventions | Accepted |
| [0007](0007-frontend-impl-choices.md) | Frontend implementation choices (fonts, kits, copy, mocking, a11y) | Accepted |
| [0008](0008-screen-validation.md) | Screen validation (QA gate) | Superseded by 0009 |
| [0009](0009-screen-validation-storybook.md) | Screen validation via Storybook | Superseded by 0012 |
| [0010](0010-proxy-implementation.md) | Proxy implementation: service layer composition | Accepted |
| [0011](0011-browser-support-policy.md) | Browser support policy: rolling last-N versions | Accepted |
| [0012](0012-drop-screenshot-qa-gate.md) | Drop screenshot QA gate | Accepted |
| [0013](0013-db-persistence-consideration.md) | Persistent storage to reduce FPL API request volume | Superseded by 0015 |
| [0014](0014-native-css-primitives.md) | Prefer native CSS: Popover API, :has(), @starting-style | Accepted |
| [0015](0015-player-tactical-positions.md) | Tactical roles (CB/FB/DM/…) for predicted lineups | Accepted (ingest superseded by 0016) |
| [0016](0016-transfermarkt-tactical-positions.md) | Transfermarkt offline ingest for tactical registry | Accepted |
| [0015](0015-database-postgres.md) | Adopt Postgres (Supabase) as the user-data store | Accepted |
| [0016](0016-auth-better-auth.md) | Use better-auth for authentication | Accepted |
| [0017](0017-session-transport-cookie.md) | Session transport — HttpOnly cookie | Accepted |
| [0018](0018-fpl-persistent-db-cache.md) | FPL persistent DB cache to minimise FPL API calls | Accepted |

## Template

```markdown
# ADR NNNN: <title>

- Status: Proposed | Accepted | Superseded by ADR-XXXX | Deprecated
- Date: YYYY-MM-DD
- Deciders: <who>

## Context
The forces at play: constraints, requirements, what problem we are solving.

## Decision
What we chose to do.

## Consequences
Positive and negative outcomes, follow-up work, things to watch.

## Alternatives considered
Other options and why we did not pick them.
```