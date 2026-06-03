# Tasks: Backend Transfer Draft (PLAN-00)

## Step 1 — DB schema + migration

Outcome: `transfer_draft` table exists; proxy boots with migration applied.

- [x] Add `transferDraft` table to `proxy/src/db/schema.ts` (see `design.md`).
- [x] Run `npm run db:generate -w proxy`; commit SQL migration.
- [x] Update `docs/db-schema.md`: `transfer_draft` column table + ER diagram edge
      `user ||--o| transfer_draft`.

---

## Step 2 — Proxy endpoints

Outcome: draft CRUD works; team change clears draft; tests pass.

- [x] Add `GET`, `PUT`, `DELETE` `/api/me/transfer-draft` in `proxy/src/me-routes.ts`.
      - Map row ↔ `TransferDraft` JSON.
      - `PUT`: validate body; reject if `teamId !== user.fplTeamId` or no `fplTeamId`.
- [x] In `PUT /api/me/team`: `DELETE FROM transfer_draft WHERE user_id = ?` before
      updating `fpl_team_id`.
- [x] `proxy/src/me-routes.test.ts`:
      - GET: 404 empty, 200 with draft.
      - PUT: 200 upsert, 400 wrong teamId, 400 no linked team, 401.
      - DELETE: 204 idempotent.
      - PUT `/team`: assert draft removed after team change.

---

## Step 3 — Frontend repository + screen

Outcome: Transfer screen uses API; localStorage migrated once.

- [x] Add `web/src/lib/transfer-draft-repository.ts` with `ApiTransferDraftRepository`.
- [x] Add `migrateLocalDraftOnce(teamId, nextGw, repo)` (design.md import rules).
- [x] Refactor `TransferScreen` to use repository for load / debounced save / Save Plan /
      Reset; on stale GW call `clear()` then fresh draft + toast.
- [x] Remove direct `localStorage` usage from `TransferScreen` (except migration helper).
- [x] Keep `calcBank`, `calcTransferCost`, etc. in `transfer-draft.ts`.
- [x] `web/src/lib/transfer-draft-repository.test.ts` — mock `fetch` for GET/PUT/DELETE.
- [x] Update `TransferScreen.test.tsx` — mock repository or `fetch`.
- [x] Update help tour copy in `web/src/lib/copy.ts` (no "this browser").
- [x] `TransferPositionLogic.test.tsx` — mock `fetch` for draft load.

---

## Step 4 — Spec + verify

- [x] Spec synced to `openspec/specs/transfer-planner/spec.md`.
- [x] `npm run test -w proxy` and `npm run test -w web` pass.
- [x] Touched files lint-clean.
- [x] Archived to `openspec/changes/archive/2026-06-03-transfer-draft-backend/`.
