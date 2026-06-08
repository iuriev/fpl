# Handoff prompt: FPL identity — remaining tasks

Copy everything below the line into a new chat. Optional: `@CLAUDE.md @AGENTS.md`. Transcript context: agent `e8127a2b-d099-41c7-836a-dda4581ae33e`.

---

**Context:** In the FPL Squad Viewer repo (`/Users/ivan.iuriev/dev/work/idp/fpl`), the FPL identity system is already implemented. Canonical keys: `element.code` (player) and `team.code` (team). Module `proxy/src/fpl-identity/` (`FplIdentityMapper`, audits, CLI). Prediction pipeline, watchlist, squad/top-players/lineups/profile API already emit/use `fplCode`. All tests green (~1240).

**Task for this chat:** Close remaining tech debt and documentation. Do not change accepted design (see Out of scope).

## 1. ADR + docs

- Add ADR in `docs/decisions/` for the identity model:
  - FPL API is source of truth
  - `element.code` / `team.code` — canonical keys
  - `element.id` / `team.id` — seasonal, for FPL API calls only
  - vaastav / football-data / Transfermarkt map **to** FPL
  - `FplIdentityMapper` — single resolve point
- Update index in `docs/decisions/README.md` (if present)
- Brief updates to:
  - `docs/fpl-api.md` — `code` vs `id`
  - `docs/architecture.md` — link to ADR and `fpl-identity` module

## 2. Prediction tech debt

**`proxy/src/prediction/player-code-map.ts`**
- Currently duplicates mapper; `attachFplCodes` silently drops unmapped rows
- Route through `FplIdentityMapper.attachFplCodes` (strict throw)
- Update/remove loose version; fix `player-code-map.test.ts`
- Check all call sites

**`proxy/src/prediction/team-names.ts`**
- `mergeTeamIdToSlug` / `buildFplTeamIdToSlug` — score no longer uses them (`identity.teamIdToSlugMap()` / `softTeamSlugLookup`)
- Decide: deprecate with “audit/legacy only” comment or remove from prediction path, keep for audit
- Update `team-names.test.ts` if needed
- After changes — run `prediction-spec-consistency` skill; sync `openspec/specs/predictions/shared.md` if contract changes

## 3. Web fixtures

- Add `fplCode` to:
  - `web/src/fixtures/index.ts` → `fixtureTeamPlayers`, dream team (`fixtureDreamTeam` / `mkDtPlayer`)
  - Other fixture objects typed as `SquadPlayer` / `TopPlayersPlayer` where type requires `fplCode` but fixture does not
- Pattern as in squad: `fplCode: 90000 + id` or explicit values
- Run `npm run test -w web`

## 4. PlayerProfileSheet — follow via fplCode

- Profile API already returns `player.fplCode` (`proxy/src/player-profile-service.ts`)
- Follow still wired externally via `onFollow(playerId)` + parent `useFollowPlayer`
- Switch to `fplCode` from profile data (or `fplCode` prop):
  - `PlayerProfileSheet.tsx` / `ProfileBody`
  - Call sites: `PredictionsScreen`, `PriceChangesScreen`, etc.
  - `useFollowPlayer(fplCode)` already exists
- Profile fetch URL **stays** on `playerId` (= element.id) — correct for `element-summary`
- Update tests: `PlayerProfileSheet.test.tsx` and related

## Out of scope — do NOT change (accepted design)

- **Transfer draft** — `outId` / `inId` = `element.id` (FPL picks API)
- **Profile fetch** — query by `playerId` (= element.id) for `element-summary`
- **Football-data ingest** — names via `FD_TO_SLUG`, slug validated against season registry (`resolveFdTeamSlug` in `fpl-identity/team-slug-lookup.ts`)

## Repo rules

- Read `CLAUDE.md`, `AGENTS.md`
- English only in code/docs
- Do not commit without explicit request
- Prediction changes → `.claude/skills/prediction-spec-consistency/SKILL.md`
- DB schema → `docs/db-schema.md` (not expected here)

## Key files

```
proxy/src/fpl-identity/
proxy/src/prediction/player-code-map.ts
proxy/src/prediction/team-names.ts
proxy/src/prediction/score.ts
web/src/fixtures/index.ts
web/src/components/ui/PlayerProfileSheet/
web/src/lib/use-follow-player.ts
docs/decisions/
docs/fpl-api.md
docs/architecture.md
openspec/specs/predictions/shared.md
```

## Verification

```bash
npm run test -w proxy
npm run test -w web
npm run lint
```

## Done when

- [ ] ADR + updated docs
- [ ] `player-code-map` delegates to mapper, strict behavior
- [ ] `team-names` legacy functions cleaned up / documented
- [ ] Web fixtures include `fplCode` where types require it
- [ ] PlayerProfileSheet follow uses `fplCode`
- [ ] All tests pass
- [ ] Show diff summary; no commit without approval
