# Proposal: Backend Transfer Draft (PLAN-00)

## Problem

The transfer planner persists drafts in `localStorage` under keys such as
`fpl-transfer-draft-{teamId}` (`web/src/lib/transfer-draft.ts`). That means:

- A plan saved on one device does not appear on another.
- Clearing browser data wipes the draft.
- The original spec (`transfer-planner`) still describes LocalStorage persistence.

AUTH-01 and MGR-02 established Postgres, `me-routes.ts`, and the repository pattern for
user-owned data. Transfer drafts should follow the same model before PLAN-01 (multi-plan,
paid tier) adds complexity.

## Solution

Introduce **PLAN-00**: one transfer draft per **user** (not per FPL player), stored in
Postgres and served by `/api/me/transfer-draft`.

- **Cardinality:** at most one row per `user.id` (`user_id` primary key).
- **Team change:** when the user updates `fpl_team_id` via `PUT /api/me/team`, the proxy
  deletes any existing draft for that user (expected — old plan does not apply).
- **Stale gameweek:** when `targetGw` is behind the current next GW, the client deletes
  the server draft, shows the existing stale toast, and starts fresh (same UX as today).
- **localStorage import:** on first load after deploy, if the server has no draft but
  `fpl-transfer-draft-{teamId}` exists, import via `PUT` (newer `savedAt` wins if both
  exist), then remove the localStorage key.

`ApiTransferDraftRepository` replaces direct `saveDraft` / `loadDraft` / `clearDraft`
calls from `TransferScreen`. Pure calculation helpers stay in `transfer-draft.ts`.

## User value

- "I planned transfers on my laptop — I want to continue on my phone." — supported.
- One draft per account matches the product rule (one FPL team per user).

## Scope

### In

- Table `transfer_draft` in `proxy/src/db/schema.ts` (see `design.md`).
- Drizzle migration; `docs/db-schema.md` updated.
- Routes in `me-routes.ts`:
  - `GET    /api/me/transfer-draft`
  - `PUT    /api/me/transfer-draft` (upsert full `TransferDraft` body)
  - `DELETE /api/me/transfer-draft`
- `DELETE` draft in `PUT /api/me/team` when `fpl_team_id` changes.
- `ApiTransferDraftRepository` in `web/src/lib/transfer-draft-repository.ts`.
- `TransferScreen` wired to repository (debounced autosave, Save Plan, Reset, load).
- One-shot localStorage migration + key removal.
- Help tour / copy: no longer "saved in this browser".
- Spec delta for transfer planner persistence (`specs/transfer-planner/spec.md`).
- Proxy and web tests.

### Out of scope

- **PLAN-01** — multiple named plans, multi-GW planning, monetisation.
- Demo mode persistence (remains ephemeral; no API calls).
- Server-side stale-GW detection on `GET` (client drives delete + fresh, as today).

## Non-functional requirements

- All three draft endpoints require `requireUser`; 401 without session.
- `PUT` rejects body when `teamId` does not match the user's `fpl_team_id` (400).
- No new Fly / Supabase tier changes.

## Dependencies

- AUTH-01 — complete ✅
- MGR-02 pattern (me-routes + repository) — complete ✅
