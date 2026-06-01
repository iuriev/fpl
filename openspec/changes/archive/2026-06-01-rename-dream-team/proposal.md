## Why

The "Dream Team" feature is being renamed to "Team of the Week" to better reflect its purpose and follow user preference. 
Following the project's "English only" policy (ADR-0025), the UI text will be "Team of the Week".

## What Changes

- Rename all UI labels from "Dream Team" to "Team of the Week" in `web/src/lib/copy.ts`.
- Rename `DreamTeamScreen` component and its directory to `TeamOfTheWeekScreen`.
- Rename `dream-team-service.ts` in the proxy to `team-of-the-week-service.ts`.
- Update the proxy endpoint from `/api/dream-team/:gw` to `/api/team-of-the-week/:gw`.
- Update all internal references (types, variables, tests) to use "Team of the Week" naming.

## Capabilities

### Modified Capabilities

- `dream-team`: renamed to `team-of-the-week`.

## Impact

- **Backend:** Endpoint path change; service filename change.
- **Frontend:** Screen name change; route path change; copy update.
- **Documentation:** Update references in `backlog.md` and other docs.
