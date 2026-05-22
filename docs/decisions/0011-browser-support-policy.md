# ADR 0011 — Browser Support Policy

**Status:** Accepted  
**Date:** 2026-05-22

## Context

The original `docs/frontend.md` pinned hard minimum version numbers (Chrome ≥ 105, Safari ≥ 16).
Those numbers were chosen to guarantee support for the CSS features the project relies on
(container queries, `:has()`, CSS Grid), but they provided no guidance on how the baseline should
evolve as new browser versions ship.

## Decision

Switch from pinned minimum versions to a **rolling policy**:

- **Last 3 Chrome versions**
- **Last 2 Safari versions**

This is expressed in `docs/frontend.md` as a policy statement rather than specific version numbers.

## Rationale

- Chrome ships every ~4 weeks; Safari ships 1–2 major versions per year. A rolling policy
  stays current automatically without requiring manual doc updates.
- The required CSS features (container queries, `:has()`, Grid) shipped in Chrome 105 / Safari 16,
  both of which are now many versions behind the rolling window — the constraint is satisfied
  without needing to state it explicitly.
- Targeting recent versions only is appropriate for an MVP with a small, known user base on modern devices.

## Consequences

- When evaluating a new CSS or JS API, verify support against the rolling window at caniuse.com
  rather than against fixed version numbers.
- If a future feature requires a version not covered by the rolling window, a new ADR is needed.
