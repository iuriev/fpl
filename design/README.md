# design/

Staging area for visual design coming from **Claude Design**. This is not the final source —
Claude Code reconciles these exports into `web/`.

## Layout

```
design/
  exports/
    v1/   # one folder per Claude Design export — never overwrite a previous one
    v2/
```

Drop each Claude Design export, fully extracted, into a new `design/exports/<vN>/` folder.
Keeping every export lets us diff what changed between iterations.

## Importing a new design iteration

See **`docs/design-workflow.md`** for the full repeatable process (export → new OpenSpec change
→ reconcile tokens and components → record decisions → commit together).
