# ADR 0004: Design pipeline — Claude Design to Claude Code

- Status: Accepted
- Date: 2026-05-21
- Deciders: ivan.iuriev, Claude

## Context

We need a repeatable path from an approved text UX spec to a visual design and then to
implemented UI. The user wants to approve text descriptions of screens first, then see a
visual mockup before any UI code is written. The user has access to **Claude Design**
(Anthropic, research preview), which turns prompts/specs and a codebase into an interactive
prototype and a derived design system, and can hand off to Claude Code for implementation.
There is also a Claude Code -> Figma bridge that turns production code into an editable Figma
file. Note: the terminal Claude Code agent cannot operate the Claude Design or Figma GUIs
itself — the user drives those.

## Decision

The design pipeline is:

1. Write the text UX spec (lives in each change's `design.md`) and get user approval.
2. The user feeds the approved UX spec (and repo context) to **Claude Design**, which produces
   an interactive prototype and a design system (colors, typography, components).
3. User approves the visuals.
4. Hand off to Claude Code, which implements the UI in React + Vite from the design system.
5. (Optional, downstream) Generate an editable Figma file from the built code via the
   Claude Code -> Figma bridge for further hand polishing.

Fallback if Claude Design is unavailable: Claude Code authors an HTML/CSS prototype directly,
which can be imported into Figma via a plugin.

The concrete, repeatable steps for importing each design iteration (export -> versioned folder
-> new OpenSpec change -> reconcile tokens/components -> commit) are documented in
`docs/design-workflow.md`.

## Consequences

- (+) Design and code stay connected — Claude Design emits code-like artifacts and hands them
  to Claude Code, reducing translation loss.
- (+) Satisfies "see a mockup before building" with an interactive prototype rather than a
  static image.
- (−) Claude Design is a research preview; its behavior/availability may change.
- (−) The Figma artifact is generated downstream from code, not hand-drawn upfront — acceptable
  given the user's goal is a high-fidelity reference, not a from-scratch Figma workflow.

## Alternatives considered

- **Hand-author the design in Figma upfront.** Rejected: slower, disconnected from code, and the
  terminal agent cannot author native Figma files.
- **HTML/CSS prototype by Claude Code only.** Kept as the fallback when Claude Design is not
  available.
