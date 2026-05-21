# Design Sync Workflow

How visual design moves from Claude Design into this codebase, and how to handle future
iterations as the design system expands and screens are added or changed. See ADR 0004 for
why we use this pipeline.

## Folder layout

```
design/
  exports/
    v1/   # one folder per Claude Design export — never overwrite a previous one
    v2/
```

Each Claude Design export is dropped, fully extracted, into a new `design/exports/<vN>/` folder.
Keeping every export gives a visual diff history between iterations.

## Steps for a new design iteration

1. **Iterate in Claude Design** — add or change screens, extend the design system.
2. **Export** the project archive from Claude Design.
3. **Drop** the extracted contents into a new `design/exports/<vN>/` folder. Do not overwrite a
   previous version.
4. **Open a new OpenSpec change** for the work (e.g. `add-list-view`). A new iteration is a new
   change — never edit an archived one. Write proposal → specs → design → tasks as usual; the
   `design.md` references the export folder.
5. **Reconcile into code (Claude Code):**
   - Update the **design tokens first** — the single source of truth in `web/` — from the
     export's `tokens.js` / `colors_and_type.css`. An expanded design system then propagates
     through components via tokens.
   - Add new components/screens and update changed ones. Keep a roughly 1:1 mapping between
     Claude Design components and React components so a changed screen touches one component.
6. **Record decisions** — any cross-cutting visual or architectural change gets an ADR in
   `docs/decisions/` (supersede the old one if it changes).
7. **Commit** the export and the code changes together, so design and implementation stay in
   lockstep.

## Principles that keep this cheap over time

- **Tokens are the contract.** Centralize colors, typography, and spacing in one theme file in
  `web/`, mapped from Claude Design's `tokens.js` / `colors_and_type.css`. Update them in one
  place; components inherit.
- **One change per iteration.** Each design version is its own OpenSpec change — preserves
  traceability of what changed and why.
- **Never overwrite an export.** Versioned folders give a diff history.
- **Map components 1:1** where practical, so re-imports stay localized.
