---
name: finalize-task
description: >-
  Close out a completed feature end-to-end for the FPL repo: run lint/tests/build,
  update backlog and docs, mark OpenSpec tasks done, archive the change, sync specs,
  then propose a commit (never commit without explicit user approval). Use when the
  user says finalize/finish/complete the task, финализируй задачу, завершить задачу,
  or archive and wrap up the current change.
---

# Finalize Task

Run this skill when the user wants to **close out** work — not start implementation.

**Hard rules (from `CLAUDE.md`):**
- **Never** `git commit`, `git push`, or amend unless the user explicitly asks after your proposal.
- **English only** in repo files you edit.
- Backlog and OpenSpec are the only permanent task records — no ad-hoc plan files.

## Inputs to resolve first

1. **OpenSpec change** — folder under `openspec/changes/<name>/` (exclude `archive/` unless user points there).
   - Infer from conversation, or list: `ls openspec/changes/`
   - If multiple active changes exist, ask which one to finalize.
2. **Backlog IDs** — from `proposal.md`, `tasks.md`, or user message (e.g. `ANA-03`, `PRED-06`).
3. **Touched workspaces** — from `git diff --stat` (typically `web`, `proxy`, `docs`, `openspec`).

Copy this checklist and update as you go:

```
Finalize: <change-name> | IDs: <ANA-XX, …>
- [ ] 1. Verify (lint, test, build/TS)
- [ ] 2. tasks.md all [x]
- [ ] 3. Backlog updated
- [ ] 4. Docs synced
- [ ] 5. OpenSpec archived + main specs
- [ ] 6. Commit proposed (not run unless asked)
```

## Step 1 — Verify quality

From repo root, prefer **scoped** commands when only one workspace changed:

```bash
npm run lint -w proxy -w web    # adjust workspaces to match diff
npm run test -w proxy -w web
npm run build -w proxy -w web   # catches TypeScript errors
```

If root-wide is safer (cross-cutting change):

```bash
npm run lint && npm run test && npm run build
```

**On failure:** fix issues introduced by this change, re-run until green. Do not archive or mark done while verification fails.

**Pre-existing failures:** if failures are clearly unrelated, say so with evidence (file path + failure existed before this branch). Ask the user whether to fix anyway or proceed.

Optional: `npm run format` only if formatting drift would fail CI — do not reformat unrelated files.

## Step 2 — Complete OpenSpec tasks

In `openspec/changes/<name>/tasks.md`, set every task to `- [x]`.

Add a short note under section 7 if needed (e.g. known unrelated test debt).

## Step 3 — Update `docs/backlog.md`

For each backlog ID being closed:

1. **P2/P1 table row** — strike through ID and title, add ✅ Done with route or archive path:
   ```markdown
   | ~~ANA-03~~ | ~~Title~~ | M | ✅ Done — <one-line what shipped> (OpenSpec `archive/YYYY-MM-DD-<name>`). |
   ```
2. **Feature details** (`#### ANA-03: …`) — add `[SHIPPED]` and 1–2 lines on what shipped.
3. **`## What's already shipped ✅`** — add a bullet summarizing the capability for non-developers.

Do not remove historical detail sections; mark shipped, do not delete ideas.

## Step 4 — Sync documentation

Update only what the change touched:

| Change type | Update |
|-------------|--------|
| New/changed API routes | `docs/fpl-api.md` |
| Drizzle schema / migration | `docs/db-schema.md` (tables + Mermaid ER) |
| New UI conventions | `docs/frontend.md` only if a new pattern was introduced |
| New ADR-worthy decision | `docs/decisions/` + README index (user approval if major) |

Skip files with no delta.

## Step 5 — Archive OpenSpec change

Prefer the dedicated skill for nuance: read `.claude/skills/openspec-archive-change/SKILL.md`.

**If `openspec` CLI is unavailable**, use this manual path (used successfully in this repo):

1. **Sync delta specs** — for each `openspec/changes/<name>/specs/<capability>/spec.md`:
   ```bash
   mkdir -p openspec/specs/<capability>
   cp openspec/changes/<name>/specs/<capability>/spec.md openspec/specs/<capability>/spec.md
   ```
2. **Archive folder** — date prefix today `YYYY-MM-DD`:
   ```bash
   mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
   ```
3. Fail if `archive/YYYY-MM-DD-<name>` already exists (pick next day or ask user).

Confirm `tasks.md` inside the archived folder still shows all `[x]`.

## Step 6 — Propose commit (do not commit)

```bash
git status
git diff --stat
git log -n 5 --oneline
```

Draft **one** commit message (imperative, why-focused, 1–2 sentences). Example shape:

```
feat: add price changes screen with predictions and premium squad lens

Deliver ANA-03 and PRED-06 on /price-changes. Archive OpenSpec change and sync backlog.
```

**Stage only files belonging to this task** — exclude unrelated untracked work (other OpenSpec drafts, WIP folders).

Present to the user:

- Verification summary (commands + pass/fail)
- Backlog IDs marked done
- Archive path
- Docs touched
- Proposed commit message
- `git diff --stat` summary

End with: **«Готов закоммитить по этому сообщению — напиши "коммит" / "commit".»**

Do **not** run `git commit` until they explicitly ask.

## Final response template

```markdown
## Finalize complete

**Change:** `<name>` → `openspec/changes/archive/YYYY-MM-DD-<name>/`
**Backlog:** ANA-XX, PRED-XX marked shipped
**Verify:** lint ✓ | test ✓ | build ✓
**Docs:** fpl-api.md, db-schema.md, …

### Proposed commit
\`\`\`
<message>
\`\`\`

**Files:** N files changed (see `git diff --stat`)

Say **commit** when you want me to create the commit.
```

## When not to use

- User only wants an explanation or code review → do not archive.
- Implementation still in progress → use `openspec-apply-change` instead.
- User asked only to commit → use git commit rules, not full finalize.
