# Transfer Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/transfers` screen that lets users plan FPL transfers for the next gameweek: apply swaps to their current squad, enforce budget and club limits, show next-3-GW FDR chips per candidate, and persist the draft in localStorage.

**Architecture:** Two new proxy endpoints (`GET /api/fixtures/upcoming`, `GET /api/player-pool`) feed a new React screen. The screen manages a `TransferDraft` in localStorage, renders the current squad on a pitch (reusing `Pitch` + `PlayerCard`), and opens the existing `BottomSheet` component with a player picker. Completed swaps are shown in a `SwapsStrip`. No writes to FPL — planning only.

**Tech Stack:** Hono + Node proxy (Vitest), React + Vite + TanStack Query (Vitest + Testing Library), CSS Modules with `--fpl-*` tokens, `rem` for all lengths.

---

## File map

**Proxy — modified:**
- `proxy/src/fpl-client.ts` — add `FPLFixture`, `getFixtures()`, `bank`/`value` on entry_history, `is_next` on events, pool fields on elements
- `proxy/src/types.ts` — add `bank` to `SquadSummary`, `teamId`/`nowCost` to `SquadPlayer`, add `FixtureInfo`, `PoolPlayer`, `PlayerPoolResponse`
- `proxy/src/cache.ts` — add `FIXTURES` and `PLAYER_POOL` TTL constants
- `proxy/src/squad-service.ts` — map `bank`, `teamId`, `nowCost` into response
- `proxy/src/index.ts` — register two new routes

**Proxy — new:**
- `proxy/src/fixtures-service.ts` + `.test.ts`
- `proxy/src/player-pool-service.ts` + `.test.ts`

**Web — modified:**
- `web/src/types/index.ts` — mirror proxy additions, add transfer draft types
- `web/src/api/client.ts` — add `getPlayerPool()`
- `web/src/api/queries.ts` — add `usePlayerPool()`
- `web/src/lib/copy.ts` — add transfer screen strings
- `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx` — add `/transfers` nav link
- `web/src/screens/index.ts` — export `TransferScreen`
- `web/src/App.tsx` — add `/transfers` route

**Web — new:**
- `web/src/lib/transfer-draft.ts` + `.test.ts`
- `web/src/components/ui/FdrChip/FdrChip.tsx` + `.module.css` + `.test.tsx`
- `web/src/screens/TransferScreen/TransferScreen.tsx` + `.module.css` + `.test.tsx`
- `web/src/screens/TransferScreen/TransferHeader.tsx` + `.module.css`
- `web/src/screens/TransferScreen/TransferPitch.tsx` + `.module.css`
- `web/src/screens/TransferScreen/PlayerPickerSheet.tsx` + `.module.css` + `.test.tsx`
- `web/src/screens/TransferScreen/PlayerPickerRow.tsx` + `.module.css`
- `web/src/screens/TransferScreen/SwapsStrip.tsx` + `.module.css` + `.test.tsx`
- `web/src/screens/TransferScreen/TransferActionBar.tsx` + `.module.css`

---

### Task 1: Extend FPL client interfaces

**Files:**
- Modify: `proxy/src/fpl-client.ts`
- Test: `proxy/src/fpl-client.test.ts`

- [ ] **Step 1: Write the failing test for `getFixtures`**

Add to `proxy/src/fpl-client.test.ts` (inside or after existing describe block):

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getFixtures } from './fpl-client';

describe('getFixtures', () => {
  it('calls /fixtures/?event={gw} and returns fixture array', async () => {
    const mockData = [
      { id: 1, event: 3, team_h: 1, team_a: 14,
        team_h_difficulty: 3, team_a_difficulty: 2,
        kickoff_time: '2025-09-01T15:00:00Z', finished: false },
    ];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as unknown as Response);

    const result = await getFixtures(3);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://fantasy.premierleague.com/api/fixtures/?event=3'
    );
    expect(result).toEqual(mockData);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd proxy && npx vitest run src/fpl-client.test.ts
```
Expected: FAIL — `getFixtures` is not exported

- [ ] **Step 3: Update `proxy/src/fpl-client.ts`**

In `FPLBootstrapStatic.events` array element, add:
```typescript
is_next: boolean;
```

In `FPLBootstrapStatic.elements` array element, add:
```typescript
first_name: string;
second_name: string;
now_cost: number;
event_points: number;
form: string;
selected_by_percent: string;
```

In `FPLPicks.entry_history`, add:
```typescript
bank: number;
value: number;
```

After `FPLLive`, add new interface and function:

```typescript
export interface FPLFixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string | null;
  finished: boolean;
}

export async function getFixtures(gameweek: number): Promise<FPLFixture[]> {
  return fetchFPL(`/fixtures/?event=${gameweek}`);
}
```

- [ ] **Step 4: Run tests**

```bash
cd proxy && npx vitest run src/fpl-client.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add proxy/src/fpl-client.ts proxy/src/fpl-client.test.ts
git commit -m "feat(proxy): extend FPL client with fixtures endpoint, bank field, and player pool fields"
```

---

### Task 2: Expose bank, teamId, nowCost in squad endpoint

**Files:**
- Modify: `proxy/src/types.ts`
- Modify: `proxy/src/squad-service.ts`
- Test: `proxy/src/squad-service.test.ts`

- [ ] **Step 1: Write failing assertions in `proxy/src/squad-service.test.ts`**

In the existing test that checks squad composition, update the mock bootstrap element to include new fields, update mock entry_history, then add assertions:

```typescript
// In mockBootstrap.elements[0], add these fields:
now_cost: 85,
first_name: 'Bukayo',
second_name: 'Saka',
event_points: 15,
form: '6.7',
selected_by_percent: '44.5',
// team: 1 and team_code: 3 are already there

// In mockPicks.entry_history, add:
bank: 15,
value: 1010,

// After existing assertions on result, add:
expect(result.summary.bank).toBe(15);
expect(result.starters[0].teamId).toBe(1);
expect(result.starters[0].nowCost).toBe(85);
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd proxy && npx vitest run src/squad-service.test.ts
```
Expected: FAIL — `bank`, `teamId`, `nowCost` not in result

- [ ] **Step 3: Update `proxy/src/types.ts`**

In `SquadSummary`, add:
```typescript
bank?: number;
```

In `SquadPlayer`, add:
```typescript
teamId: number;
nowCost: number;
```

- [ ] **Step 4: Update `proxy/src/squad-service.ts`**

In the player object returned inside `picks.picks.map(...)`, add:
```typescript
teamId: playerData.team,
nowCost: playerData.now_cost,
```

In the `summary` object, add:
```typescript
bank: entryHistory.bank,
```

- [ ] **Step 5: Run tests**

```bash
cd proxy && npx vitest run src/squad-service.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add proxy/src/types.ts proxy/src/squad-service.ts proxy/src/squad-service.test.ts
git commit -m "feat(proxy): expose bank, teamId, nowCost in squad response"
```

---

### Task 3: Add player pool proxy types and cache TTLs

**Files:**
- Modify: `proxy/src/types.ts`
- Modify: `proxy/src/cache.ts`

No failing test for pure type/constant changes — verify via TypeScript compilation.

- [ ] **Step 1: Add types to `proxy/src/types.ts`**

Append after existing types:

```typescript
export interface FixtureInfo {
  gw: number;
  opponent: string;
  home: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface PoolPlayer {
  id: number;
  webName: string;
  firstName: string;
  lastName: string;
  team: number;
  teamCode: number;
  teamShortName: string;
  position: PlayerPosition;
  nowCost: number;
  totalPoints: number;
  eventPoints: number;
  status: PlayerStatus;
  chanceOfPlaying: number | null;
  news: string;
  selectedByPercent: string;
  form: string;
  nextFixtures: FixtureInfo[];
}

export interface PlayerPoolResponse {
  players: PoolPlayer[];
}
```

- [ ] **Step 2: Add TTL constants to `proxy/src/cache.ts`**

In the `ttl` object, add:
```typescript
FIXTURES: 3600,
PLAYER_POOL: 600,
```

- [ ] **Step 3: Verify no breakage**

```bash
cd proxy && npx vitest run
```
Expected: all existing tests pass

- [ ] **Step 4: Commit**

```bash
git add proxy/src/types.ts proxy/src/cache.ts
git commit -m "feat(proxy): add player pool types and cache TTL constants"
```

---

### Task 4: Proxy fixtures service

**Files:**
- Create: `proxy/src/fixtures-service.ts`
- Create: `proxy/src/fixtures-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// proxy/src/fixtures-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fixturesService from './fixtures-service';
import * as fplClient from './fpl-client';
import * as cache from './cache';

vi.mock('./fpl-client');
vi.mock('./cache');

const mockBootstrap = {
  total_players: 10000000,
  events: [
    { id: 1, name: 'GW1', finished: true,  is_current: false, is_next: false,
      deadline_time: '', average_entry_score: 50, highest_score: 100 },
    { id: 2, name: 'GW2', finished: false, is_current: true,  is_next: false,
      deadline_time: '', average_entry_score: 50, highest_score: 100 },
    { id: 3, name: 'GW3', finished: false, is_current: false, is_next: true,
      deadline_time: '', average_entry_score: 0,  highest_score: 0 },
    { id: 4, name: 'GW4', finished: false, is_current: false, is_next: false,
      deadline_time: '', average_entry_score: 0,  highest_score: 0 },
    { id: 5, name: 'GW5', finished: false, is_current: false, is_next: false,
      deadline_time: '', average_entry_score: 0,  highest_score: 0 },
  ],
  teams: [
    { id: 1,  name: 'Arsenal',  short_name: 'ARS', code: 3 },
    { id: 14, name: 'Man City', short_name: 'MCI', code: 43 },
  ],
  elements: [],
  element_types: [],
};

const mockFixtures = [
  { id: 1, event: 3, team_h: 1, team_a: 14,
    team_h_difficulty: 4, team_a_difficulty: 2,
    kickoff_time: '2025-09-01T15:00:00Z', finished: false },
];

describe('fixtures-service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getUpcomingFixtures', () => {
    it('fetches next 3 GWs and builds per-team fixture lookup', async () => {
      vi.mocked(cache.get).mockReturnValue(null);
      vi.mocked(cache.set).mockReturnValue(undefined);
      vi.mocked(fplClient.getBootstrapStatic).mockResolvedValue(mockBootstrap as any);
      vi.mocked(fplClient.getFixtures).mockResolvedValue(mockFixtures as any);

      const result = await fixturesService.getUpcomingFixtures();

      expect(fplClient.getFixtures).toHaveBeenCalledWith(3);
      expect(fplClient.getFixtures).toHaveBeenCalledWith(4);
      expect(fplClient.getFixtures).toHaveBeenCalledWith(5);

      expect(result[1]).toContainEqual(
        { gw: 3, opponent: 'MCI', home: true, difficulty: 4 }
      );
      expect(result[14]).toContainEqual(
        { gw: 3, opponent: 'ARS', home: false, difficulty: 2 }
      );
    });

    it('returns cached result without calling FPL', async () => {
      const cached = { 1: [{ gw: 3, opponent: 'MCI', home: true, difficulty: 4 }] };
      vi.mocked(cache.get).mockReturnValue(cached);

      const result = await fixturesService.getUpcomingFixtures();

      expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd proxy && npx vitest run src/fixtures-service.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create `proxy/src/fixtures-service.ts`**

```typescript
import * as cacheLayer from './cache';
import * as fplClient from './fpl-client';
import type { FPLBootstrapStatic } from './fpl-client';
import type { FixtureInfo } from './types';
import { MAX_GAMEWEEK } from './types';

async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  const cached = cacheLayer.get<FPLBootstrapStatic>('bootstrap-static');
  if (cached) return cached;
  const bootstrap = await fplClient.getBootstrapStatic();
  cacheLayer.set('bootstrap-static', bootstrap, cacheLayer.ttl.BOOTSTRAP);
  return bootstrap;
}

function resolveNextGw(bootstrap: FPLBootstrapStatic): number {
  const next = bootstrap.events.find((e) => e.is_next);
  if (next) return next.id;
  const current = bootstrap.events.find((e) => e.is_current);
  if (current) return Math.min(current.id + 1, MAX_GAMEWEEK);
  const finished = bootstrap.events.filter((e) => e.finished);
  return finished.length > 0
    ? Math.min(finished[finished.length - 1].id + 1, MAX_GAMEWEEK)
    : 1;
}

export async function getUpcomingFixtures(): Promise<Record<number, FixtureInfo[]>> {
  const cacheKey = 'fixtures:upcoming';
  const cached = cacheLayer.get<Record<number, FixtureInfo[]>>(cacheKey);
  if (cached) return cached;

  const bootstrap = await getBootstrapWithCache();
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const nextGw = resolveNextGw(bootstrap);
  const gwIds = [nextGw, nextGw + 1, nextGw + 2].filter((id) => id <= MAX_GAMEWEEK);

  const allFixtures = await Promise.all(gwIds.map((gw) => fplClient.getFixtures(gw)));

  const result: Record<number, FixtureInfo[]> = {};
  for (let i = 0; i < gwIds.length; i++) {
    const gw = gwIds[i];
    for (const fixture of allFixtures[i]) {
      if (!result[fixture.team_h]) result[fixture.team_h] = [];
      if (!result[fixture.team_a]) result[fixture.team_a] = [];
      result[fixture.team_h].push({
        gw,
        opponent: teamMap.get(fixture.team_a) ?? '???',
        home: true,
        difficulty: fixture.team_h_difficulty as 1 | 2 | 3 | 4 | 5,
      });
      result[fixture.team_a].push({
        gw,
        opponent: teamMap.get(fixture.team_h) ?? '???',
        home: false,
        difficulty: fixture.team_a_difficulty as 1 | 2 | 3 | 4 | 5,
      });
    }
  }

  cacheLayer.set(cacheKey, result, cacheLayer.ttl.FIXTURES);
  return result;
}
```

- [ ] **Step 4: Run tests**

```bash
cd proxy && npx vitest run src/fixtures-service.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add proxy/src/fixtures-service.ts proxy/src/fixtures-service.test.ts
git commit -m "feat(proxy): add fixtures service for upcoming 3 GWs per team"
```

---

### Task 5: Proxy player pool service

**Files:**
- Create: `proxy/src/player-pool-service.ts`
- Create: `proxy/src/player-pool-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// proxy/src/player-pool-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as playerPoolService from './player-pool-service';
import * as fplClient from './fpl-client';
import * as cache from './cache';
import * as fixturesService from './fixtures-service';

vi.mock('./fpl-client');
vi.mock('./cache');
vi.mock('./fixtures-service');

const mockBootstrap = {
  total_players: 10000000,
  events: [],
  teams: [{ id: 1, name: 'Arsenal', short_name: 'ARS', code: 3 }],
  elements: [
    {
      id: 100, web_name: 'Saka', first_name: 'Bukayo', second_name: 'Saka',
      team: 1, team_code: 3, element_type: 3, status: 'a',
      chance_of_playing_this_round: null, news: '',
      total_points: 120, now_cost: 95, event_points: 12,
      form: '7.2', selected_by_percent: '44.5',
    },
  ],
  element_types: [],
};

describe('player-pool-service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getPlayerPool', () => {
    it('composes pool players from bootstrap and fixture data', async () => {
      vi.mocked(cache.get).mockReturnValue(null);
      vi.mocked(cache.set).mockReturnValue(undefined);
      vi.mocked(fplClient.getBootstrapStatic).mockResolvedValue(mockBootstrap as any);
      vi.mocked(fixturesService.getUpcomingFixtures).mockResolvedValue({
        1: [{ gw: 3, opponent: 'MCI', home: true, difficulty: 4 }],
      });

      const result = await playerPoolService.getPlayerPool();

      expect(result.players).toHaveLength(1);
      expect(result.players[0]).toMatchObject({
        id: 100,
        webName: 'Saka',
        firstName: 'Bukayo',
        lastName: 'Saka',
        team: 1,
        teamCode: 3,
        teamShortName: 'ARS',
        position: 'MID',
        nowCost: 95,
        totalPoints: 120,
        eventPoints: 12,
        status: 'a',
        form: '7.2',
        selectedByPercent: '44.5',
        nextFixtures: [{ gw: 3, opponent: 'MCI', home: true, difficulty: 4 }],
      });
      expect(cache.set).toHaveBeenCalledWith('player-pool', expect.any(Object), 600);
    });

    it('returns cached result without hitting FPL', async () => {
      const cached = { players: [] };
      vi.mocked(cache.get).mockReturnValue(cached);

      const result = await playerPoolService.getPlayerPool();

      expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd proxy && npx vitest run src/player-pool-service.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create `proxy/src/player-pool-service.ts`**

```typescript
import * as cacheLayer from './cache';
import * as fplClient from './fpl-client';
import * as fixturesService from './fixtures-service';
import type { FPLBootstrapStatic } from './fpl-client';
import type { PlayerPoolResponse, PoolPlayer, PlayerPosition, PlayerStatus } from './types';

const POSITION_MAP: Record<number, PlayerPosition> = {
  1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD',
};

async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  const cached = cacheLayer.get<FPLBootstrapStatic>('bootstrap-static');
  if (cached) return cached;
  const bootstrap = await fplClient.getBootstrapStatic();
  cacheLayer.set('bootstrap-static', bootstrap, cacheLayer.ttl.BOOTSTRAP);
  return bootstrap;
}

export async function getPlayerPool(): Promise<PlayerPoolResponse> {
  const cacheKey = 'player-pool';
  const cached = cacheLayer.get<PlayerPoolResponse>(cacheKey);
  if (cached) return cached;

  const [bootstrap, fixtures] = await Promise.all([
    getBootstrapWithCache(),
    fixturesService.getUpcomingFixtures(),
  ]);

  const teamMap = new Map(
    bootstrap.teams.map((t) => [t.id, { shortName: t.short_name, code: t.code }])
  );

  const players: PoolPlayer[] = bootstrap.elements.map((el) => ({
    id: el.id,
    webName: el.web_name,
    firstName: el.first_name,
    lastName: el.second_name,
    team: el.team,
    teamCode: el.team_code,
    teamShortName: teamMap.get(el.team)?.shortName ?? '???',
    position: POSITION_MAP[el.element_type] ?? 'GK',
    nowCost: el.now_cost,
    totalPoints: el.total_points,
    eventPoints: el.event_points,
    status: el.status as PlayerStatus,
    chanceOfPlaying: el.chance_of_playing_this_round,
    news: el.news,
    selectedByPercent: el.selected_by_percent,
    form: el.form,
    nextFixtures: fixtures[el.team] ?? [],
  }));

  const result: PlayerPoolResponse = { players };
  cacheLayer.set(cacheKey, result, cacheLayer.ttl.PLAYER_POOL);
  return result;
}
```

- [ ] **Step 4: Run tests and full proxy suite**

```bash
cd proxy && npx vitest run
```
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add proxy/src/player-pool-service.ts proxy/src/player-pool-service.test.ts
git commit -m "feat(proxy): add player pool service"
```

---

### Task 6: Register new proxy routes

**Files:**
- Modify: `proxy/src/index.ts`
- Modify: `proxy/src/index.test.ts`

- [ ] **Step 1: Write failing route tests**

In `proxy/src/index.test.ts`, add mocks and route tests following the existing pattern in that file (replicating how the `/api/gameweeks` route is registered and tested inside the `beforeEach` Hono app):

```typescript
// Add at the top of the file with other imports/mocks:
import * as fixturesService from './fixtures-service';
import * as playerPoolService from './player-pool-service';
vi.mock('./fixtures-service');
vi.mock('./player-pool-service');

// Inside the beforeEach app setup, add after existing routes:
app.get('/api/fixtures/upcoming', async (c) => {
  try {
    const result = await fixturesService.getUpcomingFixtures();
    return c.json(result);
  } catch {
    return c.json({ error: 'Unable to fetch fixtures' }, { status: 500 });
  }
});

app.get('/api/player-pool', async (c) => {
  try {
    const result = await playerPoolService.getPlayerPool();
    return c.json(result);
  } catch {
    return c.json({ error: 'Unable to fetch player pool' }, { status: 500 });
  }
});

// Add test cases:
describe('GET /api/fixtures/upcoming', () => {
  it('returns 200 with fixture data', async () => {
    const mockData = { 1: [{ gw: 3, opponent: 'MCI', home: true, difficulty: 4 }] };
    vi.mocked(fixturesService.getUpcomingFixtures).mockResolvedValue(mockData as any);

    const res = await app.request('/api/fixtures/upcoming');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockData);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(fixturesService.getUpcomingFixtures).mockRejectedValue(new Error('fail'));

    const res = await app.request('/api/fixtures/upcoming');

    expect(res.status).toBe(500);
  });
});

describe('GET /api/player-pool', () => {
  it('returns 200 with player pool data', async () => {
    const mockData = { players: [] };
    vi.mocked(playerPoolService.getPlayerPool).mockResolvedValue(mockData);

    const res = await app.request('/api/player-pool');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockData);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(playerPoolService.getPlayerPool).mockRejectedValue(new Error('fail'));

    const res = await app.request('/api/player-pool');

    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd proxy && npx vitest run src/index.test.ts
```
Expected: FAIL — routes not registered in index.ts yet (test adds them inline in beforeEach — they fail because services are not imported/mocked in index.ts)

Actually: the index.test.ts mounts its own Hono app in beforeEach, so the route tests pass once added to beforeEach. What's missing is the equivalent in index.ts itself. After writing the tests with the routes in beforeEach, run:

```bash
cd proxy && npx vitest run src/index.test.ts
```
Expected: PASS for the new route tests (since they define their own app), but this confirms the logic works.

- [ ] **Step 3: Register routes in `proxy/src/index.ts`**

Add imports at the top (with other service imports):
```typescript
import * as fixturesService from './fixtures-service';
import * as playerPoolService from './player-pool-service';
```

Add route handlers after the existing routes (before `serve()`):

```typescript
// GET /api/fixtures/upcoming
app.get('/api/fixtures/upcoming', async (c) => {
  try {
    const result = await fixturesService.getUpcomingFixtures();
    return c.json(result);
  } catch (error) {
    console.error('Error fetching upcoming fixtures:', error);
    return c.json({ error: 'Unable to fetch fixtures' }, { status: 500 });
  }
});

// GET /api/player-pool
app.get('/api/player-pool', async (c) => {
  try {
    const result = await playerPoolService.getPlayerPool();
    return c.json(result);
  } catch (error) {
    console.error('Error fetching player pool:', error);
    return c.json({ error: 'Unable to fetch player pool' }, { status: 500 });
  }
});
```

- [ ] **Step 4: Run full proxy suite**

```bash
cd proxy && npx vitest run
```
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add proxy/src/index.ts proxy/src/index.test.ts proxy/src/fixtures-service.ts proxy/src/player-pool-service.ts
git commit -m "feat(proxy): register /api/fixtures/upcoming and /api/player-pool routes"
```

---

### Task 7: Frontend types

**Files:**
- Modify: `web/src/types/index.ts`

No new test — verify by running the web test suite (TypeScript errors will surface as test failures).

- [ ] **Step 1: Update `web/src/types/index.ts`**

In `SquadSummary`, add:
```typescript
bank?: number;
```

In `SquadPlayer`, add:
```typescript
teamId: number;
nowCost: number;
```

Append after existing types:

```typescript
export interface FixtureInfo {
  gw: number;
  opponent: string;
  home: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface PoolPlayer {
  id: number;
  webName: string;
  firstName: string;
  lastName: string;
  team: number;
  teamCode: number;
  teamShortName: string;
  position: PlayerPosition;
  nowCost: number;
  totalPoints: number;
  eventPoints: number;
  status: PlayerStatus;
  chanceOfPlaying: number | null;
  news: string;
  selectedByPercent: string;
  form: string;
  nextFixtures: FixtureInfo[];
}

export interface PlayerPoolResponse {
  players: PoolPlayer[];
}

export type TransferChip = 'none' | 'wildcard' | 'freehit';

export interface TransferSwap {
  outId: number;
  inId: number;
}

export interface TransferDraft {
  teamId: number;
  targetGw: number;
  savedAt: string;
  freeTransfers: number;
  chip: TransferChip;
  swaps: TransferSwap[];
}
```

- [ ] **Step 2: Fix any broken mock objects in web tests**

`SquadPlayer` now requires `teamId` and `nowCost`. Run the test suite to find which mock objects are incomplete:

```bash
cd web && npx vitest run
```

For any test file that creates `SquadPlayer` objects directly (e.g., in mock data arrays), add:
```typescript
teamId: 1,
nowCost: 85,
```

- [ ] **Step 3: Confirm all web tests pass**

```bash
cd web && npx vitest run
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add web/src/types/index.ts
git commit -m "feat(web): add player pool and transfer draft types; extend SquadPlayer with teamId and nowCost"
```

---

### Task 8: Frontend API client and queries

**Files:**
- Modify: `web/src/api/client.ts`
- Modify: `web/src/api/queries.ts`

- [ ] **Step 1: Add `getPlayerPool` to `web/src/api/client.ts`**

In the imports at the top, add `PlayerPoolResponse`:
```typescript
import { ..., PlayerPoolResponse } from '@/types';
```

In the `api` object, add:
```typescript
getPlayerPool: () => request<PlayerPoolResponse>('/player-pool'),
```

- [ ] **Step 2: Add `usePlayerPool` to `web/src/api/queries.ts`**

```typescript
export function usePlayerPool() {
  return useQuery({
    queryKey: ['player-pool'],
    queryFn: () => api.getPlayerPool(),
    staleTime: 1000 * 60 * 10, // 10 min — prices can change
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
}
```

- [ ] **Step 3: Run web tests**

```bash
cd web && npx vitest run
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add web/src/api/client.ts web/src/api/queries.ts
git commit -m "feat(web): add getPlayerPool API client method and usePlayerPool query hook"
```

---

### Task 9: Transfer draft lib

**Files:**
- Create: `web/src/lib/transfer-draft.ts`
- Create: `web/src/lib/transfer-draft.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// web/src/lib/transfer-draft.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveDraft,
  loadDraft,
  clearDraft,
  calcBank,
  calcTransferCost,
  wouldExceedClubLimit,
  poolPlayerToSquadPlayer,
} from './transfer-draft';
import type { TransferDraft, PoolPlayer, SquadPlayer } from '@/types';

const makeDraft = (overrides?: Partial<TransferDraft>): TransferDraft => ({
  teamId: 123,
  targetGw: 5,
  savedAt: '2026-05-25T10:00:00.000Z',
  freeTransfers: 1,
  chip: 'none',
  swaps: [],
  ...overrides,
});

const makePlayer = (id: number, teamId: number, nowCost: number): Pick<SquadPlayer, 'id' | 'teamId' | 'nowCost'> =>
  ({ id, teamId, nowCost } as any);

const makePoolPlayer = (id: number, team: number, nowCost: number): PoolPlayer => ({
  id, webName: `P${id}`, firstName: 'A', lastName: 'B',
  team, teamCode: team * 10, teamShortName: `T${team}`,
  position: 'MID', nowCost, totalPoints: 50, eventPoints: 5,
  status: 'a', chanceOfPlaying: null, news: '',
  selectedByPercent: '10.0', form: '5.0', nextFixtures: [],
});

describe('transfer-draft', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  describe('saveDraft / loadDraft', () => {
    it('persists and retrieves a draft', () => {
      const draft = makeDraft();
      saveDraft(draft);
      expect(loadDraft(123, 5)).toEqual(draft);
    });

    it('returns null when no draft exists', () => {
      expect(loadDraft(123, 5)).toBeNull();
    });

    it('returns null and clears when targetGw does not match', () => {
      saveDraft(makeDraft({ targetGw: 4 }));
      expect(loadDraft(123, 5)).toBeNull();
      expect(localStorage.getItem('fpl-transfer-draft-123')).toBeNull();
    });
  });

  describe('clearDraft', () => {
    it('removes the draft from localStorage', () => {
      saveDraft(makeDraft());
      clearDraft(123);
      expect(loadDraft(123, 5)).toBeNull();
    });
  });

  describe('calcBank', () => {
    it('returns initial bank when no swaps', () => {
      expect(calcBank(100, [], [])).toBe(100);
    });

    it('increases bank when selling more expensive player', () => {
      const squadPlayers = [makePlayer(1, 1, 120)];
      const poolPlayers = [makePoolPlayer(2, 2, 80)];
      const swaps = [{ outId: 1, inId: 2 }];
      expect(calcBank(50, swaps, [...squadPlayers as any, ...poolPlayers])).toBe(90);
    });
  });

  describe('calcTransferCost', () => {
    it('returns 0 when within free allowance', () => {
      expect(calcTransferCost(1, 1, 'none')).toBe(0);
    });

    it('charges 4pts per extra transfer', () => {
      expect(calcTransferCost(3, 1, 'none')).toBe(8);
    });

    it('returns 0 when chip is active', () => {
      expect(calcTransferCost(5, 1, 'wildcard')).toBe(0);
    });
  });

  describe('wouldExceedClubLimit', () => {
    it('returns false when club has fewer than 3 players', () => {
      const squad = [makePlayer(1, 5, 80), makePlayer(2, 5, 75)];
      const newPlayer = makePoolPlayer(99, 5, 70);
      expect(wouldExceedClubLimit(squad as any, newPlayer, 0)).toBe(false);
    });

    it('returns true when adding would make 4 from same club', () => {
      const squad = [makePlayer(1, 5, 80), makePlayer(2, 5, 75), makePlayer(3, 5, 70)];
      const newPlayer = makePoolPlayer(99, 5, 65);
      expect(wouldExceedClubLimit(squad as any, newPlayer, 0)).toBe(true);
    });

    it('does not count the outgoing player towards the club limit', () => {
      const squad = [makePlayer(1, 5, 80), makePlayer(2, 5, 75), makePlayer(3, 5, 70)];
      const newPlayer = makePoolPlayer(99, 5, 65);
      // Replacing player 3 (same club) — after removal, only 2 from club 5
      expect(wouldExceedClubLimit(squad as any, newPlayer, 3)).toBe(false);
    });
  });

  describe('poolPlayerToSquadPlayer', () => {
    it('converts a PoolPlayer to a minimal SquadPlayer', () => {
      const p = makePoolPlayer(10, 1, 90);
      const result = poolPlayerToSquadPlayer(p);
      expect(result.id).toBe(10);
      expect(result.teamCode).toBe(10);
      expect(result.teamId).toBe(1);
      expect(result.nowCost).toBe(90);
      expect(result.points).toBe(0);
      expect(result.isCaptain).toBe(false);
      expect(result.isViceCaptain).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd web && npx vitest run src/lib/transfer-draft.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create `web/src/lib/transfer-draft.ts`**

```typescript
import type { PoolPlayer, SquadPlayer, TransferChip, TransferDraft, TransferSwap } from '@/types';

const DRAFT_KEY = (teamId: number) => `fpl-transfer-draft-${teamId}`;

export function saveDraft(draft: TransferDraft): void {
  localStorage.setItem(DRAFT_KEY(draft.teamId), JSON.stringify(draft));
}

export function loadDraft(teamId: number, currentNextGw: number): TransferDraft | null {
  const raw = localStorage.getItem(DRAFT_KEY(teamId));
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as TransferDraft;
    if (draft.targetGw !== currentNextGw) {
      localStorage.removeItem(DRAFT_KEY(teamId));
      return null;
    }
    return draft;
  } catch {
    localStorage.removeItem(DRAFT_KEY(teamId));
    return null;
  }
}

export function clearDraft(teamId: number): void {
  localStorage.removeItem(DRAFT_KEY(teamId));
}

export function calcBank(
  initialBank: number,
  swaps: TransferSwap[],
  allPlayers: Array<{ id: number; nowCost: number }>,
): number {
  return swaps.reduce((bank, swap) => {
    const out = allPlayers.find((p) => p.id === swap.outId);
    const ins = allPlayers.find((p) => p.id === swap.inId);
    if (!out || !ins) return bank;
    return bank + out.nowCost - ins.nowCost;
  }, initialBank);
}

export function calcTransferCost(
  swapCount: number,
  freeTransfers: number,
  chip: TransferChip,
): number {
  if (chip !== 'none') return 0;
  return Math.max(0, swapCount - freeTransfers) * 4;
}

export function wouldExceedClubLimit(
  currentSquad: Array<{ id: number; teamId: number }>,
  newPlayer: { id: number; team: number },
  outPlayerId: number,
): boolean {
  const squadWithoutOut = currentSquad.filter((p) => p.id !== outPlayerId);
  return squadWithoutOut.filter((p) => p.teamId === newPlayer.team).length >= 3;
}

const ZERO_STATS: SquadPlayer['stats'] = {
  minutes: 0, goals_scored: 0, assists: 0, clean_sheets: 0,
  goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0,
  yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0, total_points: 0,
};

export function poolPlayerToSquadPlayer(p: PoolPlayer): SquadPlayer {
  return {
    id: p.id,
    name: p.webName,
    position: p.position,
    club: p.teamShortName,
    teamCode: p.teamCode,
    teamId: p.team,
    nowCost: p.nowCost,
    points: 0,
    isCaptain: false,
    isViceCaptain: false,
    status: p.status,
    chanceOfPlaying: p.chanceOfPlaying,
    news: p.news || undefined,
    stats: ZERO_STATS,
  };
}
```

- [ ] **Step 4: Run tests**

```bash
cd web && npx vitest run src/lib/transfer-draft.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/transfer-draft.ts web/src/lib/transfer-draft.test.ts
git commit -m "feat(web): add transfer draft lib with localStorage persistence and budget helpers"
```

---

### Task 10: FdrChip component

**Files:**
- Create: `web/src/components/ui/FdrChip/FdrChip.tsx`
- Create: `web/src/components/ui/FdrChip/FdrChip.module.css`
- Create: `web/src/components/ui/FdrChip/FdrChip.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// web/src/components/ui/FdrChip/FdrChip.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FdrChip } from './FdrChip';

describe('FdrChip', () => {
  it('shows opponent abbreviation', () => {
    render(<FdrChip opponent="ARS" home={true} difficulty={2} />);
    expect(screen.getByText(/ARS/)).toBeInTheDocument();
  });

  it('shows H for home fixture', () => {
    render(<FdrChip opponent="MCI" home={true} difficulty={3} />);
    expect(screen.getByText(/H/)).toBeInTheDocument();
  });

  it('shows A for away fixture', () => {
    render(<FdrChip opponent="MCI" home={false} difficulty={3} />);
    expect(screen.getByText(/A/)).toBeInTheDocument();
  });

  it('applies correct background color for difficulty 5', () => {
    render(<FdrChip opponent="LIV" home={false} difficulty={5} />);
    const chip = screen.getByText(/LIV/).closest('[data-difficulty]') as HTMLElement;
    expect(chip?.dataset.difficulty).toBe('5');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd web && npx vitest run src/components/ui/FdrChip/FdrChip.test.tsx
```
Expected: FAIL — module not found

- [ ] **Step 3: Create `web/src/components/ui/FdrChip/FdrChip.tsx`**

```tsx
import React from 'react';
import styles from './FdrChip.module.css';

export interface FdrChipProps {
  opponent: string;
  home: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export const FdrChip: React.FC<FdrChipProps> = ({ opponent, home, difficulty }) => (
  <span
    className={`${styles.chip} ${styles[`chip_d${difficulty}`]}`}
    data-difficulty={String(difficulty)}
    title={`${opponent} (${home ? 'H' : 'A'})`}
  >
    {opponent}&nbsp;{home ? 'H' : 'A'}
  </span>
);

FdrChip.displayName = 'FdrChip';
```

- [ ] **Step 4: Create `web/src/components/ui/FdrChip/FdrChip.module.css`**

```css
.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  line-height: 1.4;
}

.chip_d1 { background: #375523; color: #b8e88a; }
.chip_d2 { background: #00FF87; color: #002210; }
.chip_d3 { background: #E8C347; color: #2a1e00; }
.chip_d4 { background: #E8604C; color: #ffffff; }
.chip_d5 { background: #730C18; color: #ffb8b8; }
```

- [ ] **Step 5: Run tests**

```bash
cd web && npx vitest run src/components/ui/FdrChip/FdrChip.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add web/src/components/ui/FdrChip/
git commit -m "feat(web): add FdrChip component with FPL official difficulty color scale"
```

---

### Task 11: Copy strings

**Files:**
- Modify: `web/src/lib/copy.ts`

- [ ] **Step 1: Add transfer screen copy to `web/src/lib/copy.ts`**

In the `copy` object, append:

```typescript
// Transfer planner screen
transfersTitle: 'Transfers',
transfersNavLink: 'Transfer Planner',
transfersBank: 'Bank',
transfersFree: 'Free',
transfersCost: 'Cost',
transfersWildcard: 'WC',
transfersFreeHit: 'FH',
transfersWildcardActive: 'Wildcard active',
transfersFreeHitActive: 'Free Hit active — squad reverts after GW{n}',
transfersPendingTitle: 'Planned transfers',
transfersPendingEmpty: 'Tap a player to start planning',
transfersReset: 'Reset',
transfersSavePlan: 'Save Plan',
transfersUndoSwap: 'Undo',
transfersFreeEditable: 'Free transfers (tap to edit)',
transfersLoadError: "Couldn't load transfers data",
transfersRetry: 'Try again',
transfersNoSquad: 'No squad found — play at least one gameweek to use the transfer planner',
transfersBudgetDisclaimer: 'Selling prices are approximate. The actual price may differ if a player\'s value changed since you bought them.',
transfersPickerTitle: 'Replace {name}',
transfersPickerSubtitle: '{position} · selling for £{cost}m',
transfersPickerSearch: 'Search players…',
transfersSortPts: 'Pts',
transfersSortPrice: 'Price',
transfersSortForm: 'Form',
transfersSortGwPts: 'GW pts',
transfersSortSel: 'Sel%',
transfersAlreadyThree: '3 already',
transfersNFree: '{n} of {m} free used',
transfersSavedToast: 'Plan saved',
transfersStaleToast: 'Your saved plan was for GW{n} which has passed. Starting fresh.',
```

- [ ] **Step 2: Run web tests to confirm no breakage**

```bash
cd web && npx vitest run
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/copy.ts
git commit -m "feat(web): add transfer planner copy strings"
```

---

### Task 12: SwapsStrip

**Files:**
- Create: `web/src/screens/TransferScreen/SwapsStrip.tsx`
- Create: `web/src/screens/TransferScreen/SwapsStrip.module.css`
- Create: `web/src/screens/TransferScreen/SwapsStrip.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// web/src/screens/TransferScreen/SwapsStrip.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SwapsStrip } from './SwapsStrip';
import type { TransferSwap } from '@/types';

const makeSwap = (outId: number, inId: number): TransferSwap => ({ outId, inId });

const makeNameMap = (entries: [number, string][]): Map<number, string> =>
  new Map(entries);

describe('SwapsStrip', () => {
  it('shows empty state when no swaps', () => {
    render(
      <SwapsStrip
        swaps={[]}
        nameMap={makeNameMap([])}
        costMap={new Map()}
        freeTransfers={1}
        onUndo={vi.fn()}
      />
    );
    expect(screen.getByText('Tap a player to start planning')).toBeInTheDocument();
  });

  it('renders a swap row with player names and cost delta', () => {
    render(
      <SwapsStrip
        swaps={[makeSwap(1, 2)]}
        nameMap={makeNameMap([[1, 'Saka'], [2, 'Salah']])}
        costMap={new Map([[1, 95], [2, 135]])}
        freeTransfers={1}
        onUndo={vi.fn()}
      />
    );
    expect(screen.getByText('Saka')).toBeInTheDocument();
    expect(screen.getByText('Salah')).toBeInTheDocument();
    // +£4.0m delta (135 - 95 = 40 units = £4.0m)
    expect(screen.getByText(/\+£4\.0m/)).toBeInTheDocument();
  });

  it('calls onUndo with the swap outId when undo button clicked', async () => {
    const onUndo = vi.fn();
    const user = userEvent.setup();
    render(
      <SwapsStrip
        swaps={[makeSwap(1, 2)]}
        nameMap={makeNameMap([[1, 'Saka'], [2, 'Salah']])}
        costMap={new Map([[1, 95], [2, 135]])}
        freeTransfers={1}
        onUndo={onUndo}
      />
    );
    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(onUndo).toHaveBeenCalledWith(1);
  });

  it('shows N of M free used label', () => {
    render(
      <SwapsStrip
        swaps={[makeSwap(1, 2), makeSwap(3, 4)]}
        nameMap={makeNameMap([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']])}
        costMap={new Map([[1, 80], [2, 80], [3, 90], [4, 90]])}
        freeTransfers={1}
        onUndo={vi.fn()}
      />
    );
    expect(screen.getByText(/2 of 1 free used/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd web && npx vitest run src/screens/TransferScreen/SwapsStrip.test.tsx
```
Expected: FAIL — module not found

- [ ] **Step 3: Create `web/src/screens/TransferScreen/SwapsStrip.tsx`**

```tsx
import React from 'react';
import { copy, interpolate } from '@/lib/copy';
import type { TransferSwap } from '@/types';
import styles from './SwapsStrip.module.css';

export interface SwapsStripProps {
  swaps: TransferSwap[];
  nameMap: Map<number, string>;
  costMap: Map<number, number>;
  freeTransfers: number;
  onUndo: (outId: number) => void;
}

function formatDelta(outCost: number, inCost: number): string {
  const delta = inCost - outCost;
  const sign = delta >= 0 ? '+' : '-';
  return `${sign}£${(Math.abs(delta) / 10).toFixed(1)}m`;
}

export const SwapsStrip: React.FC<SwapsStripProps> = ({
  swaps,
  nameMap,
  costMap,
  freeTransfers,
  onUndo,
}) => {
  const overLimit = Math.max(0, swaps.length - freeTransfers);
  const labelVariant =
    swaps.length === 0 ? 'neutral' : overLimit === 0 ? 'green' : overLimit === 1 ? 'amber' : 'red';

  return (
    <div className={styles.strip}>
      <div className={`${styles.header} ${styles[`header_${labelVariant}`]}`}>
        <span className={styles.title}>{copy.transfersPendingTitle}</span>
        {swaps.length > 0 && (
          <span className={styles.count}>
            {interpolate(copy.transfersNFree, { n: swaps.length, m: freeTransfers })}
          </span>
        )}
      </div>

      {swaps.length === 0 ? (
        <p className={styles.empty}>{copy.transfersPendingEmpty}</p>
      ) : (
        <ul className={styles.list}>
          {swaps.map((swap) => {
            const outName = nameMap.get(swap.outId) ?? '?';
            const inName = nameMap.get(swap.inId) ?? '?';
            const outCost = costMap.get(swap.outId) ?? 0;
            const inCost = costMap.get(swap.inId) ?? 0;
            return (
              <li key={swap.outId} className={styles.row}>
                <span className={styles.outName}>{outName}</span>
                <span className={styles.arrow} aria-hidden="true">→</span>
                <span className={styles.inName}>{inName}</span>
                <span className={styles.delta}>{formatDelta(outCost, inCost)}</span>
                <button
                  className={styles.undoBtn}
                  onClick={() => onUndo(swap.outId)}
                  aria-label={`${copy.transfersUndoSwap} ${outName} → ${inName}`}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

SwapsStrip.displayName = 'SwapsStrip';
```

- [ ] **Step 4: Create `web/src/screens/TransferScreen/SwapsStrip.module.css`**

```css
.strip {
  flex-shrink: 0;
  padding: var(--fpl-space-sm) var(--fpl-space-md);
  background: var(--fpl-bg-card);
  border-top: 1px solid var(--fpl-bg-hair);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--fpl-space-xs);
}

.title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--fpl-muted-soft);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.count {
  font-size: 0.6875rem;
  font-weight: 600;
}

.header_green .count  { color: var(--fpl-success); }
.header_amber .count  { color: var(--fpl-warning, #E8C347); }
.header_red .count    { color: var(--fpl-danger, #E8604C); }
.header_neutral .count { color: var(--fpl-muted-soft); }

.empty {
  font-size: 0.75rem;
  color: var(--fpl-muted-soft);
  font-style: italic;
  margin: 0;
  padding: var(--fpl-space-xs) 0;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.row {
  display: flex;
  align-items: center;
  gap: var(--fpl-space-xs);
  font-size: 0.8125rem;
}

.outName { color: var(--fpl-danger, #E8604C); font-weight: 500; }
.arrow   { color: var(--fpl-muted-soft); }
.inName  { color: var(--fpl-success); font-weight: 500; }

.delta {
  margin-left: auto;
  font-size: 0.6875rem;
  color: var(--fpl-muted-soft);
}

.undoBtn {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  border: none;
  color: var(--fpl-muted-soft);
  font-size: 0.625rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.undoBtn:hover {
  background: rgba(255,255,255,0.15);
  color: var(--fpl-text-primary);
}
```

- [ ] **Step 5: Run tests**

```bash
cd web && npx vitest run src/screens/TransferScreen/SwapsStrip.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add web/src/screens/TransferScreen/SwapsStrip.tsx web/src/screens/TransferScreen/SwapsStrip.module.css web/src/screens/TransferScreen/SwapsStrip.test.tsx
git commit -m "feat(web): add SwapsStrip component"
```

---

### Task 13: PlayerPickerRow and PlayerPickerSheet

**Files:**
- Create: `web/src/screens/TransferScreen/PlayerPickerRow.tsx`
- Create: `web/src/screens/TransferScreen/PlayerPickerRow.module.css`
- Create: `web/src/screens/TransferScreen/PlayerPickerSheet.tsx`
- Create: `web/src/screens/TransferScreen/PlayerPickerSheet.module.css`
- Create: `web/src/screens/TransferScreen/PlayerPickerSheet.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// web/src/screens/TransferScreen/PlayerPickerSheet.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlayerPickerSheet } from './PlayerPickerSheet';
import type { PoolPlayer } from '@/types';

const makePoolPlayer = (id: number, overrides?: Partial<PoolPlayer>): PoolPlayer => ({
  id, webName: `Player${id}`, firstName: 'A', lastName: 'B',
  team: 1, teamCode: 3, teamShortName: 'ARS', position: 'MID',
  nowCost: 80, totalPoints: 100, eventPoints: 10,
  status: 'a', chanceOfPlaying: null, news: '',
  selectedByPercent: '10.0', form: '5.0', nextFixtures: [],
  ...overrides,
});

describe('PlayerPickerSheet', () => {
  const defaultProps = {
    open: true,
    outPlayer: makePoolPlayer(1, { webName: 'Saka', position: 'MID', nowCost: 95 }),
    candidates: [makePoolPlayer(2, { webName: 'Salah', nowCost: 130 })],
    availableBudget: 150,
    squadTeamCounts: new Map<number, number>([[1, 1]]),
    squadPlayerIds: new Set([1]),
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders sheet title with player name', () => {
    render(<PlayerPickerSheet {...defaultProps} />);
    expect(screen.getByText(/Replace Saka/i)).toBeInTheDocument();
  });

  it('shows selling price in subtitle', () => {
    render(<PlayerPickerSheet {...defaultProps} />);
    expect(screen.getByText(/£9\.5m/)).toBeInTheDocument();
  });

  it('shows candidate player', () => {
    render(<PlayerPickerSheet {...defaultProps} />);
    expect(screen.getByText('Salah')).toBeInTheDocument();
  });

  it('calls onSelect when a candidate is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<PlayerPickerSheet {...defaultProps} onSelect={onSelect} />);
    await user.click(screen.getByText('Salah'));
    expect(onSelect).toHaveBeenCalledWith(defaultProps.candidates[0]);
  });

  it('filters candidates by search query', async () => {
    const user = userEvent.setup();
    const candidates = [
      makePoolPlayer(2, { webName: 'Salah' }),
      makePoolPlayer(3, { webName: 'Fernandes' }),
    ];
    render(<PlayerPickerSheet {...defaultProps} candidates={candidates} />);
    await user.type(screen.getByPlaceholderText(/search/i), 'sal');
    expect(screen.getByText('Salah')).toBeInTheDocument();
    expect(screen.queryByText('Fernandes')).not.toBeInTheDocument();
  });

  it('dims candidates over budget (opacity and non-interactive)', () => {
    render(
      <PlayerPickerSheet
        {...defaultProps}
        candidates={[makePoolPlayer(2, { webName: 'Expensive', nowCost: 200 })]}
        availableBudget={100}
      />
    );
    const row = screen.getByText('Expensive').closest('[data-over-budget]');
    expect(row?.getAttribute('data-over-budget')).toBe('true');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd web && npx vitest run src/screens/TransferScreen/PlayerPickerSheet.test.tsx
```
Expected: FAIL — module not found

- [ ] **Step 3: Create `web/src/screens/TransferScreen/PlayerPickerRow.tsx`**

```tsx
import React from 'react';
import { FdrChip } from '@/components/ui/FdrChip/FdrChip';
import type { PoolPlayer } from '@/types';
import styles from './PlayerPickerRow.module.css';

export interface PlayerPickerRowProps {
  player: PoolPlayer;
  overBudget: boolean;
  clubLimitReached: boolean;
  onSelect: (player: PoolPlayer) => void;
}

export const PlayerPickerRow: React.FC<PlayerPickerRowProps> = ({
  player,
  overBudget,
  clubLimitReached,
  onSelect,
}) => {
  const disabled = overBudget || clubLimitReached;

  return (
    <li
      className={`${styles.row} ${disabled ? styles.row_disabled : ''}`}
      data-over-budget={overBudget ? 'true' : undefined}
      data-club-limit={clubLimitReached ? 'true' : undefined}
      onClick={disabled ? undefined : () => onSelect(player)}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={disabled ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(player); } }}
    >
      <div className={styles.identity}>
        <span className={styles.name}>{player.webName}</span>
        <span className={styles.meta}>{player.teamShortName}</span>
        {clubLimitReached && (
          <span className={styles.clubTag}>3 already</span>
        )}
      </div>
      <div className={styles.fixtures}>
        {player.nextFixtures.slice(0, 3).map((f, i) => (
          <FdrChip key={i} opponent={f.opponent} home={f.home} difficulty={f.difficulty} />
        ))}
      </div>
      <div className={`${styles.cost} ${overBudget ? styles.cost_over : ''}`}>
        £{(player.nowCost / 10).toFixed(1)}m
      </div>
    </li>
  );
};

PlayerPickerRow.displayName = 'PlayerPickerRow';
```

- [ ] **Step 4: Create `web/src/screens/TransferScreen/PlayerPickerRow.module.css`**

```css
.row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--fpl-space-sm);
  padding: var(--fpl-space-sm) var(--fpl-space-md);
  border-bottom: 1px solid var(--fpl-bg-hair);
  cursor: pointer;
  transition: background 0.1s;
}

.row:hover:not(.row_disabled) {
  background: rgba(255, 255, 255, 0.05);
}

.row_disabled {
  opacity: 0.28;
  cursor: default;
  pointer-events: none;
}

.identity {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--fpl-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: 0.6875rem;
  color: var(--fpl-muted-soft);
}

.clubTag {
  font-size: 0.625rem;
  color: var(--fpl-warning, #E8C347);
}

.fixtures {
  display: flex;
  gap: 0.125rem;
}

.cost {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--fpl-text-primary);
  white-space: nowrap;
}

.cost_over {
  color: var(--fpl-danger, #E8604C);
}
```

- [ ] **Step 5: Create `web/src/screens/TransferScreen/PlayerPickerSheet.tsx`**

```tsx
import React, { useMemo, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { copy, interpolate } from '@/lib/copy';
import type { PoolPlayer } from '@/types';
import { wouldExceedClubLimit } from '@/lib/transfer-draft';
import { PlayerPickerRow } from './PlayerPickerRow';
import styles from './PlayerPickerSheet.module.css';

type SortKey = 'totalPoints' | 'nowCost' | 'form' | 'eventPoints' | 'selectedByPercent';

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'totalPoints',     label: copy.transfersSortPts },
  { key: 'nowCost',         label: copy.transfersSortPrice },
  { key: 'form',            label: copy.transfersSortForm },
  { key: 'eventPoints',     label: copy.transfersSortGwPts },
  { key: 'selectedByPercent', label: copy.transfersSortSel },
];

export interface PlayerPickerSheetProps {
  open: boolean;
  outPlayer: PoolPlayer;
  candidates: PoolPlayer[];
  availableBudget: number;
  squadTeamCounts: Map<number, number>;
  squadPlayerIds: Set<number>;
  onSelect: (player: PoolPlayer) => void;
  onClose: () => void;
}

export const PlayerPickerSheet: React.FC<PlayerPickerSheetProps> = ({
  open,
  outPlayer,
  candidates,
  availableBudget,
  squadTeamCounts,
  squadPlayerIds,
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('totalPoints');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return candidates
      .filter((p) => !squadPlayerIds.has(p.id))
      .filter((p) =>
        q === '' ||
        p.webName.toLowerCase().includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aVal = parseFloat(String(a[sortKey]));
        const bVal = parseFloat(String(b[sortKey]));
        return bVal - aVal;
      });
  }, [candidates, query, sortKey, squadPlayerIds]);

  const title = interpolate(copy.transfersPickerTitle, { name: outPlayer.webName });
  const subtitle = interpolate(copy.transfersPickerSubtitle, {
    position: outPlayer.position,
    cost: (outPlayer.nowCost / 10).toFixed(1),
  });

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className={styles.inner}>
        <div className={styles.subheader}>
          <span className={styles.subtitle}>{subtitle}</span>
        </div>

        <div className={styles.controls}>
          <input
            className={styles.search}
            type="search"
            placeholder={copy.transfersPickerSearch}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={styles.sortPills} role="group" aria-label="Sort by">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={`${styles.sortPill} ${sortKey === opt.key ? styles.sortPill_active : ''}`}
                onClick={() => setSortKey(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <ul className={styles.list}>
          {filtered.map((player) => {
            const currentSquad = Array.from(squadPlayerIds).map((id) => ({
              id,
              teamId: player.team,
            }));
            const clubLimit = wouldExceedClubLimit(
              currentSquad as any,
              player,
              outPlayer.id,
            );
            return (
              <PlayerPickerRow
                key={player.id}
                player={player}
                overBudget={player.nowCost > availableBudget}
                clubLimitReached={clubLimit}
                onSelect={onSelect}
              />
            );
          })}
        </ul>
      </div>
    </BottomSheet>
  );
};

PlayerPickerSheet.displayName = 'PlayerPickerSheet';
```

**Note:** The `clubLimitReached` check inside `PlayerPickerSheet` uses a simplified squad array. Pass the real `currentSquadPlayers: Array<{ id: number; teamId: number }>` prop if you want accurate club counting (update the test and component accordingly).

- [ ] **Step 6: Create `web/src/screens/TransferScreen/PlayerPickerSheet.module.css`**

```css
.inner {
  display: flex;
  flex-direction: column;
  height: 70dvh;
}

.subheader {
  padding: 0 var(--fpl-space-md) var(--fpl-space-xs);
}

.subtitle {
  font-size: 0.75rem;
  color: var(--fpl-muted-soft);
}

.controls {
  padding: var(--fpl-space-xs) var(--fpl-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--fpl-space-xs);
  border-bottom: 1px solid var(--fpl-bg-hair);
}

.search {
  width: 100%;
  padding: 0.5rem var(--fpl-space-sm);
  border-radius: var(--fpl-radius-sm);
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--fpl-bg-hair);
  color: var(--fpl-text-primary);
  font-size: 0.875rem;
}

.search::placeholder {
  color: var(--fpl-muted-soft);
}

.sortPills {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.sortPill {
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--fpl-bg-hair);
  color: var(--fpl-muted-soft);
  cursor: pointer;
}

.sortPill_active {
  background: var(--fpl-accent, #00FF87);
  color: #002210;
  border-color: transparent;
}

.list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0;
}
```

- [ ] **Step 7: Run tests**

```bash
cd web && npx vitest run src/screens/TransferScreen/PlayerPickerSheet.test.tsx
```
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add web/src/screens/TransferScreen/PlayerPickerRow.tsx web/src/screens/TransferScreen/PlayerPickerRow.module.css web/src/screens/TransferScreen/PlayerPickerSheet.tsx web/src/screens/TransferScreen/PlayerPickerSheet.module.css web/src/screens/TransferScreen/PlayerPickerSheet.test.tsx
git commit -m "feat(web): add PlayerPickerRow and PlayerPickerSheet components"
```

---

### Task 14: TransferHeader, TransferActionBar, TransferPitch

**Files:**
- Create: `web/src/screens/TransferScreen/TransferHeader.tsx` + `.module.css`
- Create: `web/src/screens/TransferScreen/TransferActionBar.tsx` + `.module.css`
- Create: `web/src/screens/TransferScreen/TransferPitch.tsx` + `.module.css`

No separate test files for these (integration-tested via TransferScreen in Task 15).

- [ ] **Step 1: Create `web/src/screens/TransferScreen/TransferHeader.tsx`**

```tsx
import React from 'react';
import { copy, interpolate } from '@/lib/copy';
import type { TransferChip } from '@/types';
import styles from './TransferHeader.module.css';

export interface TransferHeaderProps {
  bank: number;
  freeTransfers: number;
  cost: number;
  chip: TransferChip;
  nextGw: number | null;
  onChipToggle: (chip: 'wildcard' | 'freehit') => void;
  onFreeTransfersChange: (n: number) => void;
}

export const TransferHeader: React.FC<TransferHeaderProps> = ({
  bank,
  freeTransfers,
  cost,
  chip,
  nextGw,
  onChipToggle,
  onFreeTransfersChange,
}) => {
  const chipActive = chip !== 'none';

  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <span className={styles.title}>{copy.transfersTitle}</span>
        <div className={styles.chips}>
          <button
            className={`${styles.chipBtn} ${chip === 'wildcard' ? styles.chipBtn_active : ''}`}
            onClick={() => onChipToggle('wildcard')}
            aria-pressed={chip === 'wildcard'}
          >
            {copy.transfersWildcard}
          </button>
          <button
            className={`${styles.chipBtn} ${chip === 'freehit' ? styles.chipBtn_active : ''}`}
            onClick={() => onChipToggle('freehit')}
            aria-pressed={chip === 'freehit'}
          >
            {copy.transfersFreeHit}
          </button>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>£{(bank / 10).toFixed(1)}m</span>
          <span className={styles.statLabel}>{copy.transfersBank}</span>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.stat}>
          <button
            className={styles.freeBtn}
            onClick={() => {
              const next = freeTransfers >= 5 ? 1 : freeTransfers + 1;
              onFreeTransfersChange(next);
            }}
            title={copy.transfersFreeEditable}
            aria-label={copy.transfersFreeEditable}
          >
            {freeTransfers}
          </button>
          <span className={styles.statLabel}>{copy.transfersFree}</span>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.stat}>
          {chipActive ? (
            <span className={styles.chipActiveLabel}>
              {chip === 'wildcard'
                ? copy.transfersWildcardActive
                : interpolate(copy.transfersFreeHitActive, { n: nextGw ?? '?' })}
            </span>
          ) : (
            <>
              <span className={`${styles.statValue} ${cost > 0 ? (cost >= 8 ? styles.statValue_red : styles.statValue_amber) : ''}`}>
                -{cost} pts
              </span>
              <span className={styles.statLabel}>{copy.transfersCost}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

TransferHeader.displayName = 'TransferHeader';
```

- [ ] **Step 2: Create `web/src/screens/TransferScreen/TransferHeader.module.css`**

```css
.header {
  flex-shrink: 0;
  padding: var(--fpl-space-md) var(--fpl-space-md) var(--fpl-space-sm);
  background: var(--fpl-bg-deep);
  border-bottom: 1px solid var(--fpl-bg-hair);
}

.topRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--fpl-space-sm);
}

.title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--fpl-text-primary);
}

.chips {
  display: flex;
  gap: 0.375rem;
}

.chipBtn {
  padding: 0.25rem 0.625rem;
  border-radius: 1rem;
  font-size: 0.6875rem;
  font-weight: 700;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--fpl-bg-hair);
  color: var(--fpl-muted-soft);
  cursor: pointer;
  letter-spacing: 0.04em;
}

.chipBtn_active {
  background: var(--fpl-success, #00FF87);
  color: #002210;
  border-color: transparent;
}

.statsBar {
  display: flex;
  align-items: center;
  gap: var(--fpl-space-sm);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  flex: 1;
}

.statValue {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--fpl-text-primary);
}

.statValue_amber { color: var(--fpl-warning, #E8C347); }
.statValue_red   { color: var(--fpl-danger, #E8604C); }

.statLabel {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--fpl-muted-soft);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.freeBtn {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--fpl-text-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline dotted;
}

.divider {
  width: 1px;
  height: 1.75rem;
  background: var(--fpl-bg-hair);
  flex-shrink: 0;
}

.chipActiveLabel {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--fpl-success, #00FF87);
  text-align: center;
}
```

- [ ] **Step 3: Create `web/src/screens/TransferScreen/TransferActionBar.tsx`**

```tsx
import React from 'react';
import { copy } from '@/lib/copy';
import { Button } from '@/components/ui/Button/Button';
import styles from './TransferActionBar.module.css';

export interface TransferActionBarProps {
  onReset: () => void;
  onSave: () => void;
  hasSwaps: boolean;
}

export const TransferActionBar: React.FC<TransferActionBarProps> = ({
  onReset,
  onSave,
  hasSwaps,
}) => (
  <div className={styles.bar}>
    <Button variant="secondary" onClick={onReset} disabled={!hasSwaps}>
      {copy.transfersReset}
    </Button>
    <Button variant="primary" onClick={onSave} disabled={!hasSwaps}>
      {copy.transfersSavePlan}
    </Button>
  </div>
);

TransferActionBar.displayName = 'TransferActionBar';
```

- [ ] **Step 4: Create `web/src/screens/TransferScreen/TransferActionBar.module.css`**

```css
.bar {
  flex-shrink: 0;
  display: flex;
  gap: var(--fpl-space-sm);
  padding: var(--fpl-space-sm) var(--fpl-space-md);
  background: var(--fpl-bg-deep);
  border-top: 1px solid var(--fpl-bg-hair);
}

.bar > * {
  flex: 1;
}
```

- [ ] **Step 5: Create `web/src/screens/TransferScreen/TransferPitch.tsx`**

```tsx
import React from 'react';
import { Pitch } from '@/components/ui/Pitch/Pitch';
import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
import type { SquadPlayer, PlayerPosition } from '@/types';
import styles from './TransferPitch.module.css';

const POSITION_ORDER: PlayerPosition[] = ['FWD', 'MID', 'DEF', 'GK'];

export interface TransferPitchProps {
  starters: SquadPlayer[];
  bench: SquadPlayer[];
  outPlayerId: number | null;
  inPlayerIds: Set<number>;
  onPlayerClick: (id: number) => void;
}

function groupByPosition(players: SquadPlayer[]): Record<PlayerPosition, SquadPlayer[]> {
  const groups: Record<PlayerPosition, SquadPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) groups[p.position].push(p);
  return groups;
}

export const TransferPitch: React.FC<TransferPitchProps> = ({
  starters,
  bench,
  outPlayerId,
  inPlayerIds,
  onPlayerClick,
}) => {
  const positionGroups = groupByPosition(starters);

  return (
    <div className={styles.pitchBench}>
      <div className={styles.pitchWrap}>
        <Pitch className={styles.pitchFill}>
          <div className={styles.pitchRows}>
            {POSITION_ORDER.map((pos) => (
              <div key={pos} className={styles.playerRow}>
                {positionGroups[pos].map((player) => {
                  const isOut = player.id === outPlayerId;
                  const isIn  = inPlayerIds.has(player.id);
                  return (
                    <button
                      key={player.id}
                      className={`${styles.playerBtn} ${isOut ? styles.playerBtn_out : ''} ${isIn ? styles.playerBtn_in : ''}`}
                      onClick={() => onPlayerClick(player.id)}
                      aria-label={`${player.name}${isOut ? ' (OUT)' : isIn ? ' (IN)' : ''}`}
                    >
                      <PlayerCard player={player} size="large" />
                      {isOut && <span className={styles.variantBadge} data-variant="out">OUT</span>}
                      {isIn  && <span className={styles.variantBadge} data-variant="in">IN</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Pitch>
      </div>

      <div className={styles.bench}>
        {bench.map((player) => {
          const isOut = player.id === outPlayerId;
          const isIn  = inPlayerIds.has(player.id);
          return (
            <button
              key={player.id}
              className={`${styles.playerBtn} ${isOut ? styles.playerBtn_out : ''} ${isIn ? styles.playerBtn_in : ''}`}
              onClick={() => onPlayerClick(player.id)}
              aria-label={`${player.name}${isOut ? ' (OUT)' : isIn ? ' (IN)' : ''}`}
            >
              <PlayerCard player={player} size="medium" />
              {isOut && <span className={styles.variantBadge} data-variant="out">OUT</span>}
              {isIn  && <span className={styles.variantBadge} data-variant="in">IN</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

TransferPitch.displayName = 'TransferPitch';
```

- [ ] **Step 6: Create `web/src/screens/TransferScreen/TransferPitch.module.css`**

```css
.pitchBench {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.pitchWrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.pitchFill {
  width: 100%;
  height: 100%;
}

.pitchRows {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 0.5rem 0;
}

.playerRow {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

.bench {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  padding: var(--fpl-space-xs) var(--fpl-space-md);
  background: rgba(0,0,0,0.25);
  border-top: 1px dashed var(--fpl-bg-hair);
}

.playerBtn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: var(--fpl-radius-sm);
  outline-offset: 2px;
}

.playerBtn_out::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: var(--fpl-radius-sm);
  border: 2px solid #E8604C;
  pointer-events: none;
  animation: pulse-out 1.2s ease-in-out infinite;
}

.playerBtn_in::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: var(--fpl-radius-sm);
  border: 2px solid #00FF87;
  pointer-events: none;
}

.variantBadge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  font-size: 0.5rem;
  font-weight: 800;
  padding: 0.0625rem 0.1875rem;
  border-radius: 0.125rem;
  letter-spacing: 0.04em;
}

.variantBadge[data-variant='out'] {
  background: #E8604C;
  color: #fff;
}

.variantBadge[data-variant='in'] {
  background: #00FF87;
  color: #002210;
}

@keyframes pulse-out {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
```

- [ ] **Step 7: Run all web tests to confirm no breakage**

```bash
cd web && npx vitest run
```
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add web/src/screens/TransferScreen/TransferHeader.tsx web/src/screens/TransferScreen/TransferHeader.module.css web/src/screens/TransferScreen/TransferActionBar.tsx web/src/screens/TransferScreen/TransferActionBar.module.css web/src/screens/TransferScreen/TransferPitch.tsx web/src/screens/TransferScreen/TransferPitch.module.css
git commit -m "feat(web): add TransferHeader, TransferActionBar, TransferPitch components"
```

---

### Task 15: TransferScreen, routing, and nav link

**Files:**
- Create: `web/src/screens/TransferScreen/TransferScreen.tsx` + `.module.css` + `.test.tsx`
- Modify: `web/src/screens/index.ts`
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// web/src/screens/TransferScreen/TransferScreen.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransferScreen } from './TransferScreen';

vi.mock('@/api/queries', () => ({
  useGameweeks: () => ({ data: { current: 5, gameweeks: [{ id: 5, name: 'Gameweek 5', finished: true }] }, isLoading: false, isError: false }),
  useSquad: () => ({ data: null, isLoading: false, isError: false }),
  usePlayerPool: () => ({ data: null, isLoading: false, isError: false }),
}));

function renderScreen() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TransferScreen teamId={123} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('TransferScreen', () => {
  it('shows the Transfers heading', () => {
    renderScreen();
    expect(screen.getByText('Transfers')).toBeInTheDocument();
  });

  it('shows empty state when squad is not available', () => {
    renderScreen();
    expect(screen.getByText(/No squad found/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd web && npx vitest run src/screens/TransferScreen/TransferScreen.test.tsx
```
Expected: FAIL — module not found

- [ ] **Step 3: Create `web/src/screens/TransferScreen/TransferScreen.tsx`**

```tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useGameweeks, usePlayerPool, useSquad } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { copy, interpolate } from '@/lib/copy';
import {
  calcBank,
  calcTransferCost,
  clearDraft,
  loadDraft,
  poolPlayerToSquadPlayer,
  saveDraft,
  wouldExceedClubLimit,
} from '@/lib/transfer-draft';
import type { PoolPlayer, SquadPlayer, TransferChip, TransferDraft, TransferSwap } from '@/types';

import { PlayerPickerSheet } from './PlayerPickerSheet';
import { SwapsStrip } from './SwapsStrip';
import { TransferActionBar } from './TransferActionBar';
import { TransferHeader } from './TransferHeader';
import { TransferPitch } from './TransferPitch';
import styles from './TransferScreen.module.css';

export interface TransferScreenProps {
  teamId: number;
}

function makeDefaultDraft(teamId: number, targetGw: number): TransferDraft {
  return {
    teamId,
    targetGw,
    savedAt: new Date().toISOString(),
    freeTransfers: 1,
    chip: 'none',
    swaps: [],
  };
}

export const TransferScreen: React.FC<TransferScreenProps> = ({ teamId }) => {
  const [, setSearchParams] = useSearchParams();
  const { data: gameweeks } = useGameweeks();
  const currentGw = gameweeks?.current ?? null;
  const nextGw = currentGw !== null ? currentGw + 1 : null;

  const { data: squadData, isLoading: squadLoading, isError: squadError, refetch } =
    useSquad(teamId, currentGw);
  const { data: poolData, isLoading: poolLoading } = usePlayerPool();

  const [draft, setDraft] = useState<TransferDraft | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [staleToast, setStaleToast] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (nextGw === null) return;
    const saved = loadDraft(teamId, nextGw);
    if (saved) {
      setDraft(saved);
    } else {
      const prevRaw = localStorage.getItem(`fpl-transfer-draft-${teamId}`);
      if (prevRaw) {
        try {
          const prev = JSON.parse(prevRaw) as TransferDraft;
          setStaleToast(
            interpolate(copy.transfersStaleToast, { n: prev.targetGw })
          );
        } catch {/* ignore */}
      }
      setDraft(makeDefaultDraft(teamId, nextGw));
    }
  }, [teamId, nextGw]);

  const persistDraft = useCallback((d: TransferDraft) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDraft(d), 300);
  }, []);

  const updateDraft = useCallback((updater: (prev: TransferDraft) => TransferDraft) => {
    setDraft((prev) => {
      const next = updater(prev ?? makeDefaultDraft(teamId, nextGw ?? 0));
      persistDraft(next);
      return next;
    });
  }, [teamId, nextGw, persistDraft]);

  const originalSquad: SquadPlayer[] = useMemo(() => {
    if (!squadData) return [];
    return [...squadData.starters, ...squadData.bench];
  }, [squadData]);

  const allPoolPlayers: PoolPlayer[] = poolData?.players ?? [];

  const displaySquad = useMemo(() => {
    if (!draft) return originalSquad;
    const swapMap = new Map(
      draft.swaps.map((s) => {
        const inPlayer = allPoolPlayers.find((p) => p.id === s.inId);
        return [s.outId, inPlayer] as const;
      })
    );
    return originalSquad.map((p) => {
      const replacement = swapMap.get(p.id);
      if (replacement) return poolPlayerToSquadPlayer(replacement);
      return p;
    });
  }, [originalSquad, draft, allPoolPlayers]);

  const displayStarters = useMemo(
    () => displaySquad.filter((_, i) => i < (squadData?.starters.length ?? 11)),
    [displaySquad, squadData]
  );
  const displayBench = useMemo(
    () => displaySquad.slice(squadData?.starters.length ?? 11),
    [displaySquad, squadData]
  );

  const inPlayerIds = useMemo(
    () => new Set(draft?.swaps.map((s) => s.inId) ?? []),
    [draft]
  );

  const allPlayerCosts = useMemo(() => {
    const out = originalSquad.map((p) => ({ id: p.id, nowCost: p.nowCost }));
    const ins = allPoolPlayers.map((p) => ({ id: p.id, nowCost: p.nowCost }));
    return [...out, ...ins];
  }, [originalSquad, allPoolPlayers]);

  const initialBank = squadData?.summary.bank ?? 0;
  const currentBank = draft
    ? calcBank(initialBank, draft.swaps, allPlayerCosts)
    : initialBank;

  const transferCost = draft
    ? calcTransferCost(draft.swaps.length, draft.freeTransfers, draft.chip)
    : 0;

  const outPlayer = selectedPlayerId !== null
    ? allPoolPlayers.find((p) => {
        const sqp = originalSquad.find((s) => s.id === selectedPlayerId);
        return sqp && p.id === selectedPlayerId;
      }) ?? (() => {
        const sqp = originalSquad.find((s) => s.id === selectedPlayerId);
        if (!sqp) return undefined;
        return allPoolPlayers.find((p) => p.webName === sqp.name) ?? undefined;
      })()
    : undefined;

  const candidates = outPlayer
    ? allPoolPlayers.filter((p) => p.position === outPlayer.position)
    : [];

  const squadPlayerIds = new Set(displaySquad.map((p) => p.id));

  const squadTeamCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of displaySquad) {
      counts.set(p.teamId, (counts.get(p.teamId) ?? 0) + 1);
    }
    return counts;
  }, [displaySquad]);

  const availableBudget = outPlayer
    ? currentBank + (originalSquad.find((s) => s.id === outPlayer.id)?.nowCost ?? 0)
    : currentBank;

  const nameMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of originalSquad) m.set(p.id, p.name);
    for (const p of allPoolPlayers) m.set(p.id, p.webName);
    return m;
  }, [originalSquad, allPoolPlayers]);

  const costMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of allPlayerCosts) m.set(p.id, p.nowCost);
    return m;
  }, [allPlayerCosts]);

  const handlePlayerClick = (id: number) => {
    setSelectedPlayerId(id);
  };

  const handleSelectReplacement = (inPlayer: PoolPlayer) => {
    if (selectedPlayerId === null) return;
    const newSwap: TransferSwap = { outId: selectedPlayerId, inId: inPlayer.id };
    updateDraft((d) => ({ ...d, swaps: [...d.swaps.filter((s) => s.outId !== selectedPlayerId), newSwap] }));
    setSelectedPlayerId(null);
  };

  const handleUndo = (outId: number) => {
    updateDraft((d) => ({ ...d, swaps: d.swaps.filter((s) => s.outId !== outId) }));
  };

  const handleReset = () => {
    updateDraft((d) => ({ ...d, swaps: [] }));
  };

  const handleSave = () => {
    if (draft) saveDraft(draft);
  };

  const handleChipToggle = (chip: 'wildcard' | 'freehit') => {
    updateDraft((d) => ({ ...d, chip: d.chip === chip ? 'none' : chip as TransferChip }));
  };

  const handleFreeTransfersChange = (n: number) => {
    updateDraft((d) => ({ ...d, freeTransfers: n }));
  };

  const isLoading = squadLoading || poolLoading || !draft;
  const hasNoSquad = !squadLoading && !squadError && !squadData;

  return (
    <div className={styles.screen}>
      {draft && (
        <TransferHeader
          bank={currentBank}
          freeTransfers={draft.freeTransfers}
          cost={transferCost}
          chip={draft.chip}
          nextGw={nextGw}
          onChipToggle={handleChipToggle}
          onFreeTransfersChange={handleFreeTransfersChange}
        />
      )}

      {isLoading && (
        <div className={styles.stateCenter}>
          <p className={styles.stateText}>{copy.loadingPlaceholder}</p>
        </div>
      )}

      {squadError && (
        <div className={styles.stateCenter}>
          <p className={styles.stateText}>{copy.transfersLoadError}</p>
          <Button variant="secondary" onClick={() => refetch()}>
            {copy.transfersRetry}
          </Button>
        </div>
      )}

      {hasNoSquad && (
        <div className={styles.stateCenter}>
          <p className={styles.stateText}>{copy.transfersNoSquad}</p>
        </div>
      )}

      {!isLoading && !squadError && squadData && displaySquad.length > 0 && (
        <>
          <div className={`${styles.pitchArea} ${selectedPlayerId !== null ? styles.pitchArea_dimmed : ''}`}>
            <TransferPitch
              starters={displayStarters}
              bench={displayBench}
              outPlayerId={selectedPlayerId}
              inPlayerIds={inPlayerIds}
              onPlayerClick={handlePlayerClick}
            />
          </div>

          {draft && (
            <SwapsStrip
              swaps={draft.swaps}
              nameMap={nameMap}
              costMap={costMap}
              freeTransfers={draft.freeTransfers}
              onUndo={handleUndo}
            />
          )}

          <TransferActionBar
            onReset={handleReset}
            onSave={handleSave}
            hasSwaps={(draft?.swaps.length ?? 0) > 0}
          />
        </>
      )}

      {outPlayer && (
        <PlayerPickerSheet
          open={selectedPlayerId !== null}
          outPlayer={outPlayer}
          candidates={candidates}
          availableBudget={availableBudget}
          squadTeamCounts={squadTeamCounts}
          squadPlayerIds={squadPlayerIds}
          onSelect={handleSelectReplacement}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {staleToast && (
        <div className={styles.toast} role="status">
          {staleToast}
        </div>
      )}
    </div>
  );
};

TransferScreen.displayName = 'TransferScreen';
```

- [ ] **Step 4: Create `web/src/screens/TransferScreen/TransferScreen.module.css`**

```css
.screen {
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--fpl-bg-deep);
}

.pitchArea {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  transition: opacity 0.2s;
}

.pitchArea_dimmed {
  opacity: 0.5;
  pointer-events: none;
}

.stateCenter {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--fpl-space-md);
  padding: var(--fpl-space-xl3);
}

.stateText {
  font-size: 0.875rem;
  color: var(--fpl-muted-soft);
  text-align: center;
}

.toast {
  position: fixed;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--fpl-bg-card);
  border: 1px solid var(--fpl-bg-hair);
  border-radius: var(--fpl-radius-md);
  padding: var(--fpl-space-sm) var(--fpl-space-md);
  font-size: 0.8125rem;
  color: var(--fpl-text-primary);
  max-width: 80vw;
  text-align: center;
  z-index: 200;
}
```

- [ ] **Step 5: Run tests**

```bash
cd web && npx vitest run src/screens/TransferScreen/TransferScreen.test.tsx
```
Expected: PASS

- [ ] **Step 6: Update `web/src/screens/index.ts`**

Add:
```typescript
export type { TransferScreenProps } from './TransferScreen/TransferScreen';
export { TransferScreen } from './TransferScreen/TransferScreen';
```

- [ ] **Step 7: Update `web/src/App.tsx`**

Add `TransferScreen` to the import from `@/screens`:
```typescript
import { DreamTeamScreen, EntryScreen, GameweekHistoryScreen, LeaguesStatsScreen, SquadScreen, TopPlayersScreen, TransferScreen } from '@/screens';
```

Add a new route after existing routes (before the closing `</Routes>`):
```tsx
<Route
  path="/transfers"
  element={
    teamId ? (
      <TransferScreen teamId={teamId} />
    ) : (
      <EntryScreen onSubmit={(id) => setSearchParams({ teamId: String(id) })} />
    )
  }
/>
```

- [ ] **Step 8: Add Transfers nav link to `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`**

In the `navLinks` div, add after the existing `/top-players` link:
```tsx
<Link to={`/transfers?teamId=${teamId}`} className={styles.navLink}>
  {copy.transfersNavLink}
</Link>
```

Also add `transfersNavLink` to the copy import (it's already in copy.ts from Task 11).

- [ ] **Step 9: Run full web test suite**

```bash
cd web && npx vitest run
```
Expected: all pass

- [ ] **Step 10: Commit**

```bash
git add web/src/screens/TransferScreen/ web/src/screens/index.ts web/src/App.tsx web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx
git commit -m "feat(web): add TransferScreen and /transfers route with player picker, swaps strip, and localStorage draft"
```

---

## Post-implementation checklist

- [ ] Start the dev server and open `/transfers?teamId={your_id}` in the browser
- [ ] Verify the pitch loads with your current squad
- [ ] Tap a player — confirm the bottom sheet opens with candidates for that position
- [ ] Select a replacement — confirm the pitch updates with the IN badge
- [ ] Verify budget updates in the header
- [ ] Tap the ✕ undo button — confirm the swap is reversed
- [ ] Reload the page — confirm the draft is restored from localStorage
- [ ] Set freeTransfers to 1, make 2 swaps — confirm cost shows -4 pts in amber
- [ ] Activate Wildcard chip — confirm cost shows 0 / chip label replaces cost
- [ ] Test on a small viewport (mobile) — pitch and sheet should fit without horizontal scroll
