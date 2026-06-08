# ADR 0020: FPL identity model — canonical player and team codes

- Status: Accepted
- Date: 2026-06-08
- Deciders: ivan.iuriev

## Context

FPL exposes two identifiers for players and teams:

- **`element.id` / `team.id`** — seasonal keys that change when a new season starts.
- **`element.code` / `team.code`** — stable keys that persist across seasons for the same
  real-world player or club.

Our app spans multiple data sources (FPL API, vaastav historical CSVs, football-data.co.uk
match results, Transfermarkt tactical ingest). Each source names players and teams
differently and may use seasonal FPL ids or external ids. Without a single canonical key,
watchlists, prediction carry-in, and cross-season analytics cannot reliably refer to the
same entity.

Some flows must still use seasonal ids (FPL picks API, `element-summary` profile fetch).
Others need stable codes (player watchlist, prediction output, cross-season history merge).

## Decision

1. **FPL API is the source of truth** for player and team identity. `element.code` and
   `team.code` are the canonical keys everywhere in our domain model and persisted user data.

2. **Seasonal ids are FPL-API-only.** `element.id` and `team.id` are used solely for calls
   to FPL endpoints that require them (`picks`, `element-summary`, live stats keyed by
   element id). They are never stored as the primary key for user-facing features.

3. **External sources map to FPL.** vaastav, football-data, and Transfermarkt data are
   ingested by resolving names and seasonal ids **to** FPL codes via season registries built
   from vaastav snapshots and live bootstrap.

4. **`FplIdentityMapper` is the single resolve point** (`proxy/src/fpl-identity/`). All
   server code that needs element↔code, team↔slug, or name→slug resolution goes through the
   mapper. Strict helpers (e.g. `attachFplCodes`) throw `FplIdentityError` when a row cannot
   be mapped — silent drops are not permitted on the prediction path.

5. **Football-data team names** are translated via `FD_TO_SLUG` in `team-names.ts`, then
   validated against the season team registry (`resolveFdTeamSlug`).

## Consequences

**Positive**

- Watchlist, predictions, and cross-season model training share one stable player key.
- Identity audits (`npm run audit:fpl-identity`) can detect registry gaps before scoring.
- API responses expose `fplCode` alongside seasonal `id` where both are needed.

**Negative / trade-offs**

- Each season needs a built registry (vaastav + bootstrap) before historical ingest or scoring.
- Call sites must know whether they need `id` (FPL fetch) or `fplCode` (persistence/UI).

**Follow-up**

- ADR documents the model; `docs/fpl-api.md` and `docs/architecture.md` link here.
- Transfer draft continues to use `element.id` for picks (out of scope for this ADR).

## Alternatives considered

| Option | Why not |
| --- | --- |
| Use `element.id` as canonical | Resets every season; breaks watchlist and cross-season carry-in. |
| Per-source identity tables without FPL anchor | Duplicates mapping logic; FPL is the product's native id system. |
| Silent drop of unmapped prediction rows | Hides data-quality failures; replaced by strict `attachFplCodes`. |
