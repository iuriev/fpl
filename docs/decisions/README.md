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