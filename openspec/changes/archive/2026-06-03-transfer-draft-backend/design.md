# Design: Backend Transfer Draft (PLAN-00)

## Decisions (confirmed)

| Topic | Decision |
|-------|----------|
| Cardinality | **One draft per user** (`user_id` PK). User has one FPL team. |
| User changes team | **Delete draft** in `PUT /api/me/team` (always; no carry-over). |
| Stale gameweek | **Delete draft** on client when `targetGw !== nextGw`, then fresh draft + stale toast. |
| localStorage | One-shot **import** then **remove** `fpl-transfer-draft-*` keys. |

## Database schema

New table in `proxy/src/db/schema.ts`:

```ts
export const transferDraft = pgTable('transfer_draft', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  teamId: integer('team_id').notNull(),
  targetGw: integer('target_gw').notNull(),
  savedAt: timestamp('saved_at').notNull(),
  freeTransfers: integer('free_transfers').notNull(),
  chip: text('chip').notNull(),
  swaps: jsonb('swaps').notNull(),
  subs: jsonb('subs').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

`swaps` / `subs` match `TransferSwap[]` and `SubSwap[]` from `web/src/types/index.ts`.
`chip` is `'none' | 'wildcard' | 'freehit'`.

## Proxy endpoints

All routes live in `me-routes.ts` with `requireUser`.

### Transfer draft

```
GET    /api/me/transfer-draft
→ 200  TransferDraft JSON
→ 404  (no draft)

PUT    /api/me/transfer-draft
Body:  TransferDraft (full object)
→ 200  TransferDraft (echo stored row)
→ 400  invalid body, or teamId !== user.fplTeamId, or user has no fplTeamId
→ 401  unauthenticated

DELETE /api/me/transfer-draft
→ 204  (idempotent if no row)
```

`PUT` upserts on `userId`. Validate:

- `teamId`, `targetGw`, `freeTransfers` are positive integers where applicable.
- `chip` is one of the allowed literals.
- `swaps` / `subs` are arrays (empty allowed).

Row mapping to API JSON uses the same field names as `TransferDraft` (`teamId`,
`targetGw`, `savedAt` as ISO string, etc.).

### Team change side effect

In existing `PUT /api/me/team`:

```ts
await db.delete(transferDraft).where(eq(transferDraft.userId, sessionUser.id));
// then update user.fplTeamId as today
```

Runs even when the new `teamId` equals the old one (harmless no-op delete).

## Frontend repository

`web/src/lib/transfer-draft-repository.ts`:

```ts
export interface TransferDraftRepository {
  load(): Promise<TransferDraft | null>;
  save(draft: TransferDraft): Promise<void>;
  clear(): Promise<void>;
}

export class ApiTransferDraftRepository implements TransferDraftRepository {
  // GET → null on 404
  // PUT → full body
  // DELETE → clear
}
```

`LocalStorageTransferDraftRepository` (optional) wraps today's `loadDraft` /
`saveDraft` / `clearDraft` for unit tests only — **not** used in `App.tsx` at runtime.

## TransferScreen integration

1. **Load** (on team / next GW change):
   - `repo.load()`.
   - If draft and `draft.targetGw === nextGw` → use it.
   - If draft and `draft.targetGw !== nextGw` → `repo.clear()`, stale toast, `makeDefaultDraft`.
   - If no draft → try **localStorage import** (see below), else fresh.

2. **Autosave** — keep 300ms debounce; call `repo.save(draft)` instead of `localStorage`.

3. **Save Plan** — `repo.save(draft)` + `setIsDirty(false)`.

4. **Reset** — update local state + `repo.save` with cleared swaps/subs (or `clear` + re-save
   default fields — prefer single `PUT` with reset content to keep `freeTransfers` in sync).

5. **Import helper** (`migrateLocalDraftOnce(teamId, nextGw)`):
   - Read `fpl-transfer-draft-${teamId}`.
   - If missing, return.
   - Parse; if `targetGw !== nextGw`, remove key only (no upload).
   - If server draft exists, compare `savedAt`; newer wins → `PUT` if local wins.
   - Else `PUT` local draft.
   - `localStorage.removeItem(key)`.

## Copy / Help tour

- `transfersStaleToast` — unchanged.
- `tourStep9Text` / any "this browser" wording → account-backed persistence.
- `transfer-planner` spec scenario updated (see spec delta).

## Migration strategy

- SQL via `drizzle-kit generate`; applied at proxy boot (`runMigrations()`).
- **Data:** no server backfill; browser localStorage import on first authenticated visit
  to Transfer screen after release.

## Error handling

- Network failure on save: log / silent retry is acceptable for debounced autosave v1;
  Save Plan may surface error later if needed.
- 401: existing auth redirect behaviour.
- 400 on PUT (team mismatch): should not happen if `TransferScreen` only uses `myTeamId`;
  treat as dev bug.

## PLAN-01 note

Future multi-plan feature needs a new table (e.g. `saved_plan` with `user_id` + `name`).
Do not extend `transfer_draft` for multiple rows per user in this change.
