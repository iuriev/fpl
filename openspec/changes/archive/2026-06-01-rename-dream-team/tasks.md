# Tasks: Rename Dream Team to Team of the Week

## Phase 1: Proxy Changes
- [ ] Rename `proxy/src/dream-team-service.ts` to `proxy/src/team-of-the-week-service.ts`
- [ ] Rename `proxy/src/dream-team-service.test.ts` to `proxy/src/team-of-the-week-service.test.ts`
- [ ] Update `proxy/src/index.ts` to use new service and endpoint `/api/team-of-the-week/:gw`
- [ ] Update types in `proxy/src/types.ts` (DreamTeamResponse -> TeamOfTheWeekResponse, etc.)

## Phase 2: Web Changes
- [ ] Update `web/src/lib/copy.ts` labels
- [ ] Rename `web/src/screens/DreamTeamScreen` directory to `web/src/screens/TeamOfTheWeekScreen`
- [ ] Rename `DreamTeamScreen.tsx`, `DreamTeamScreen.module.css`, `DreamTeamScreen.test.tsx`
- [ ] Update component name and all imports in the screen files
- [ ] Update `web/src/App.tsx` (or routing file) with new route and component
- [ ] Update types in `web/src/types/index.ts`
- [ ] Update any navigation components pointing to the screen

## Phase 3: Global Cleanup
- [ ] Update `docs/backlog.md`
- [ ] Search and replace any remaining "Dream Team" text or code references
- [ ] Run lint and tests
