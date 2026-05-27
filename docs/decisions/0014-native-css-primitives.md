# ADR 0014 — Prefer Native CSS Primitives (Popover, :has, @starting-style)

**Status:** Accepted  
**Date:** 2026-05-27

## Context

Modern browsers ship platform primitives that replace much of what headless UI libraries (e.g.
Radix, used by shadcn/ui) solve with JavaScript: overlay open/close, backdrop, light dismiss,
parent-aware styling, and enter transitions from `display: none`.

The project already targets recent mobile Chrome and Safari (ADR 0011) and documents `:has()` in
`docs/frontend.md`. We want a single, explicit default for agents and developers: reach for
platform CSS/HTML first before adding JS-driven overlay or state-to-style wiring.

## Decision

When building or refactoring UI in the web SPA, **prefer these platform features by default**:

1. **Popover API** — dialogs, dropdown menus, tooltips, sheets, and other overlays that open
   from a trigger. Use `popover`, `popovertarget` / `popoverTarget`, `::backdrop`, and top-layer
   behavior instead of portal + manual focus/click-outside/ESC handlers.
2. **`:has()`** — parent styling driven by descendant state (checked inputs, open popovers,
   `:focus-within`, etc.) instead of React state whose only job is toggling CSS classes on a
   wrapper.
3. **`@starting-style`** — enter transitions when an element becomes visible (including popover
   open). Pair with `transition-behavior: allow-discrete` when transitioning from `display: none`
   or other discrete properties.

This applies to **Cursor agents, Claude Code, and human contributors** — see `CLAUDE.md`,
`AGENTS.md`, and `docs/frontend.md`.

"When possible" means: use these unless a documented exception applies (below). Do not add a JS
overlay library or custom open/close plumbing when the platform primitive covers the use case.

## Rationale

- **Bundle and runtime:** fewer event listeners, less hydration-sensitive overlay logic.
- **Accessibility baseline:** popover, `dialog`, and native form controls ship keyboard and light-
  dismiss behavior; we still validate UX in implementation.
- **Consistency:** one pattern for overlays and state-driven styling across the codebase.
- **Policy fit:** Popover API and `@starting-style` are within the rolling browser window defined
  in ADR 0011 (verify on caniuse.com when adopting a new sub-feature).

## Exceptions (document the WHY in code or ADR if non-obvious)

- **Complex widgets** that need state machines the platform does not provide (combobox with
  async search, command palette, date picker with range keyboard nav).
- **Strict focus trapping** inside large multi-step forms where native popover focus behavior is
  insufficient — prefer popover first; escalate only with justification.
- **Programmatic-only open** from many unrelated triggers — a one-line `showPopover()` /
  `hidePopover()` call is fine; do not replace the whole overlay with a JS library.
- **API outside browser policy** — requires explicit approval and a new ADR (ADR 0011).

## Consequences

- New overlay or disclosure UI should be reviewed against this ADR before introducing Radix-like
  dependencies or bespoke modal hooks.
- `docs/frontend.md` lists concrete patterns and links here.
- Agents must run `modern-web-guidance` before HTML/CSS work and cross-check against ADR 0011.

## Alternatives considered

- **Mandate shadcn/Radix for all overlays** — rejected; unnecessary JS cost for simple primitives.
- **Document only in chat** — rejected; not durable for Cursor vs Claude parity.
- **Hard ban on JS for overlays** — rejected; "when possible" keeps pragmatic escape hatches.
