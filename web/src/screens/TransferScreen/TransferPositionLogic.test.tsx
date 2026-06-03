import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PoolPlayer, SquadPlayer, SquadResponse } from '@/types';

import { TransferScreen } from './TransferScreen';

const ZERO_STATS: SquadPlayer['stats'] = {
  minutes: 0, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0,
  own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0,
  red_cards: 0, saves: 0, bonus: 0, total_points: 0,
};

function makePlayer(id: number, name: string, position: SquadPlayer['position']): SquadPlayer {
  return {
    id, name, position, club: 'TST', teamCode: 1, teamId: 1, nowCost: 50, points: 0,
    isCaptain: false, isViceCaptain: false, status: 'a', chanceOfPlaying: null, news: '',
    stats: ZERO_STATS,
  };
}

const SQUAD_DATA: SquadResponse = {
  gameweek: 5,
  activeChip: null,
  chipStatuses: {
    wildcard: { status: 'available' },
    freehit:  { status: 'available' },
    bboost:   { status: 'available' },
    '3xc':    { status: 'available' },
  },
  summary: { totalPoints: 60, transfers: 0, bank: 0, freeTransfers: 1 },
  starters: [
    makePlayer(1, 'Hart', 'GK'),
    makePlayer(2, 'Walker', 'DEF'),
    makePlayer(3, 'Saka', 'MID'),
  ],
  bench: [],
};

const POOL_PLAYERS: PoolPlayer[] = [
  { id: 1, webName: 'Hart', firstName: 'H', lastName: 'T', team: 1, teamCode: 1, teamShortName: 'TST', position: 'GK', nowCost: 50, totalPoints: 0, eventPoints: 0, status: 'a', chanceOfPlaying: null, news: '', selectedByPercent: '10', expectedPoints: '5.0', form: '5.0', nextFixtures: [] },
  { id: 2, webName: 'Walker', firstName: 'K', lastName: 'W', team: 1, teamCode: 1, teamShortName: 'TST', position: 'DEF', nowCost: 50, totalPoints: 0, eventPoints: 0, status: 'a', chanceOfPlaying: null, news: '', selectedByPercent: '10', expectedPoints: '5.0', form: '5.0', nextFixtures: [] },
  { id: 3, webName: 'Saka', firstName: 'B', lastName: 'S', team: 1, teamCode: 1, teamShortName: 'TST', position: 'MID', nowCost: 50, totalPoints: 0, eventPoints: 0, status: 'a', chanceOfPlaying: null, news: '', selectedByPercent: '10', expectedPoints: '5.0', form: '5.0', nextFixtures: [] },
  { id: 4, webName: 'Gabriel', firstName: 'G', lastName: 'M', team: 1, teamCode: 1, teamShortName: 'TST', position: 'DEF', nowCost: 50, totalPoints: 0, eventPoints: 0, status: 'a', chanceOfPlaying: null, news: '', selectedByPercent: '10', expectedPoints: '5.0', form: '5.0', nextFixtures: [] },
  { id: 5, webName: 'Salah', firstName: 'M', lastName: 'S', team: 1, teamCode: 1, teamShortName: 'TST', position: 'MID', nowCost: 50, totalPoints: 0, eventPoints: 0, status: 'a', chanceOfPlaying: null, news: '', selectedByPercent: '10', expectedPoints: '5.0', form: '5.0', nextFixtures: [] },
];

const mockState = {
  squad: SQUAD_DATA,
  pool: { players: POOL_PLAYERS },
};

vi.mock('@/lib/premium-upsell/PremiumUpsellContext', () => ({
  useRequestPremiumUpsell: () => vi.fn(),
}));

vi.mock('@/lib/my-team/MyTeamContext', () => ({
  useMyTeam: () => ({
    myTeamId: 123,
    isDemoMode: false,
    setMyTeamId: vi.fn(),
    setDemoTeamId: vi.fn(),
    clearDemoMode: vi.fn(),
  }),
}));

vi.mock('@/components/ui/TeamNavDrawer/TeamNavDrawer', () => ({
  TeamNavDrawer: () => null,
}));

vi.mock('@/api/queries', () => ({
  useGameweeks: () => ({
    data: { current: 5, next: 6, gameweeks: [{ id: 5, name: 'Gameweek 5', finished: true }] },
    isLoading: false, isError: false,
  }),
  useSquad: () => ({ data: mockState.squad, isLoading: false, isError: false }),
  usePlayerPool: () => ({ data: mockState.pool, isLoading: false, isError: false }),
  useEntry: () => ({
    data: { teamName: 'Test FC', managerName: 'Tester', regionIsoCode: 'GB' },
    isError: false,
  }),
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

const mockFetch = vi.fn();

describe('Transfer Position Logic', () => {
  beforeEach(() => {
    localStorage.setItem('fpl_tour_seen_transfer_v1', 'true');
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', mockFetch);
    HTMLDivElement.prototype.showPopover = vi.fn();
    HTMLDivElement.prototype.hidePopover = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does NOT show DEF candidates when replacing a MID (CORRECT)', async () => {
    const user = userEvent.setup();
    renderScreen();
    await waitFor(() => {
      expect(screen.getByLabelText(/^Saka/)).toBeInTheDocument();
    });

    const sakaBtn = screen.getByLabelText(/^Saka/);
    await user.click(sakaBtn);

    // Expect to see the picker
    expect(screen.getByText(/Replace Saka/i)).toBeInTheDocument();

    // Now it should NOT show Gabriel (DEF)
    expect(screen.queryByText('Gabriel')).not.toBeInTheDocument();
    expect(screen.getByText('Salah')).toBeInTheDocument();
  });

  it('does NOT show position tabs when replacing a MID (CORRECT)', async () => {
    const user = userEvent.setup();
    renderScreen();
    await waitFor(() => {
      expect(screen.getByLabelText(/^Saka/)).toBeInTheDocument();
    });

    const sakaBtn = screen.getByLabelText(/^Saka/);
    await user.click(sakaBtn);

    expect(screen.queryByText('ALL')).not.toBeInTheDocument();
    expect(screen.queryByText('DEF')).not.toBeInTheDocument();
    expect(screen.queryByText('MID')).not.toBeInTheDocument();
    expect(screen.queryByText('FWD')).not.toBeInTheDocument();
  });
});
