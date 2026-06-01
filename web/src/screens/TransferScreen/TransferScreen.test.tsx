import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PoolPlayer, SquadPlayer, SquadResponse } from '@/types';

import { TransferScreen } from './TransferScreen';

const ZERO_STATS: SquadPlayer['stats'] = {
  minutes: 0,
  goals_scored: 0,
  assists: 0,
  clean_sheets: 0,
  goals_conceded: 0,
  own_goals: 0,
  penalties_saved: 0,
  penalties_missed: 0,
  yellow_cards: 0,
  red_cards: 0,
  saves: 0,
  bonus: 0,
  total_points: 0,
};

function makePlayer(id: number, name: string, position: SquadPlayer['position']): SquadPlayer {
  return {
    id,
    name,
    position,
    club: 'TST',
    teamCode: 1,
    teamId: 1,
    nowCost: 50,
    points: 0,
    isCaptain: false,
    isViceCaptain: false,
    status: 'a',
    chanceOfPlaying: null,
    news: '',
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
    makePlayer(3, 'Stones', 'DEF'),
    makePlayer(4, 'Dias', 'DEF'),
    makePlayer(5, 'Cancelo', 'DEF'),
    makePlayer(6, 'Foden', 'MID'),
    makePlayer(7, 'De Bruyne', 'MID'),
    makePlayer(8, 'Silva', 'MID'),
    makePlayer(9, 'Salah', 'MID'),
    makePlayer(10, 'Haaland', 'FWD'),
    makePlayer(11, 'Jesus', 'FWD'),
  ],
  bench: [
    makePlayer(12, 'Ederson', 'GK'),
    makePlayer(13, 'Trent', 'DEF'),
    makePlayer(14, 'Mount', 'MID'),
    makePlayer(15, 'Firmino', 'FWD'),
  ],
};

const POOL_PLAYERS: PoolPlayer[] = SQUAD_DATA.starters.concat(SQUAD_DATA.bench).map((p) => ({
  id: p.id,
  webName: p.name,
  firstName: p.name,
  lastName: p.name,
  team: p.teamId,
  teamCode: p.teamCode,
  teamShortName: p.club,
  position: p.position,
  nowCost: p.nowCost,
  totalPoints: 0,
  eventPoints: 0,
  status: p.status as PoolPlayer['status'],
  chanceOfPlaying: null,
  news: '',
  selectedByPercent: '10',
  expectedPoints: '5.0',
  form: '5.0',
  nextFixtures: [],
}));

const EXTRA_PLAYER: PoolPlayer = {
  id: 99,
  webName: 'Extra',
  firstName: 'Extra',
  lastName: 'Player',
  team: 2,
  teamCode: 2,
  teamShortName: 'EXT',
  position: 'GK',
  nowCost: 40,
  totalPoints: 0,
  eventPoints: 0,
  status: 'a',
  chanceOfPlaying: null,
  news: '',
  selectedByPercent: '5',
  expectedPoints: '3.0',
  form: '3.0',
  nextFixtures: [],
};

// Mutable refs so individual describes can swap mock responses.
const mockState = {
  squad: null as SquadResponse | null,
  pool: null as { players: PoolPlayer[] } | null,
};

vi.mock('@/api/queries', () => ({
  useGameweeks: () => ({
    data: { current: 5, gameweeks: [{ id: 5, name: 'Gameweek 5', finished: true }] },
    isLoading: false,
    isError: false,
  }),
  useSquad: () => ({ data: mockState.squad, isLoading: false, isError: false }),
  usePlayerPool: () => ({ data: mockState.pool, isLoading: false, isError: false }),
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
  beforeEach(() => {
    mockState.squad = null;
    mockState.pool = null;
    localStorage.setItem('fpl_tour_seen_transfer_v1', 'true');
  });

  it('shows the Transfers heading', () => {
    renderScreen();
    expect(screen.getByText('Transfers')).toBeInTheDocument();
  });

  it('shows empty state when squad is not available', () => {
    renderScreen();
    expect(screen.getByText(/No squad found/i)).toBeInTheDocument();
  });

  it('opens the transfers bottom sheet when the Transfers button is clicked', async () => {
    const user = userEvent.setup();
    mockState.squad = SQUAD_DATA;
    mockState.pool = { players: [...POOL_PLAYERS, EXTRA_PLAYER] };
    renderScreen();

    // Make a swap first to enable the button
    const playerCard = screen.getByRole('button', { name: /Hart/i });
    await user.click(playerCard);
    
    // Select replacement (Extra)
    const replacementBtn = screen.getAllByRole('button', { name: /Extra/i })[0];
    await user.click(replacementBtn);

    const transfersBtn = screen.getByRole('button', { name: 'Transfers' });
    expect(transfersBtn).not.toBeDisabled();
    await user.click(transfersBtn);

    // Should find the swap row in the bottom sheet
    // We use getAllByText because "Extra" is now both on the pitch and in the swaps list
    expect(screen.getAllByText(/Hart/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Extra/).length).toBeGreaterThan(0);
  });

  it('disables the footer buttons when no transfers are planned', () => {
    mockState.squad = SQUAD_DATA;
    mockState.pool = { players: POOL_PLAYERS };
    renderScreen();

    expect(screen.getByRole('button', { name: 'Transfers' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save Plan' })).toBeDisabled();
  });
});

describe('TransferScreen chip statuses', () => {
  beforeEach(() => {
    localStorage.setItem('fpl_tour_seen_transfer_v1', 'true');
  });

  it('pre-selects wildcard when chipStatuses.wildcard === active', async () => {
    mockState.squad = {
      ...SQUAD_DATA,
      activeChip: 'wildcard',
      chipStatuses: {
        wildcard: { status: 'active' },
        freehit:  { status: 'available' },
        bboost:   { status: 'available' },
        '3xc':    { status: 'available' },
      },
    };
    mockState.pool = { players: POOL_PLAYERS };
    renderScreen();
    const wcBtn = await screen.findByRole('button', { name: 'WC' });
    expect(wcBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows toast when a used chip button is tapped', async () => {
    const user = userEvent.setup();
    mockState.squad = {
      ...SQUAD_DATA,
      chipStatuses: {
        wildcard: { status: 'available' },
        freehit:  { status: 'used', usedInGw: 7 },
        bboost:   { status: 'available' },
        '3xc':    { status: 'available' },
      },
    };
    mockState.pool = { players: POOL_PLAYERS };
    renderScreen();
    const fhBtn = screen.getByRole('button', { name: 'FH' });
    expect(fhBtn).not.toBeDisabled();
    await user.click(fhBtn);
    expect(await screen.findByRole('status')).toHaveTextContent('Free Hit already played in GW7');
  });
});

describe('TransferScreen help tour', () => {
  beforeEach(() => {
    mockState.squad = SQUAD_DATA;
    mockState.pool = { players: POOL_PLAYERS };
    localStorage.clear();
  });

  it('does not start the tour automatically even if not seen', async () => {
    renderScreen();
    // Should NOT find Chip Badges automatically anymore
    expect(screen.queryByText('Chip Badges')).not.toBeInTheDocument();
  });

  it('does not start the tour if already seen', async () => {
    localStorage.setItem('fpl_tour_seen_transfer_v1', 'true');
    renderScreen();
    expect(screen.queryByText('Chip Badges')).not.toBeInTheDocument();
  });

  it('starts the tour when help button is clicked', async () => {
    const user = userEvent.setup();
    localStorage.setItem('fpl_tour_seen_transfer_v1', 'true');
    renderScreen();

    const helpBtn = screen.getByLabelText('Open tour');
    await user.click(helpBtn);

    expect(await screen.findByText('Chip Badges')).toBeInTheDocument();
  });

  it('navigates through the tour steps', async () => {
    const user = userEvent.setup();
    renderScreen();

    // Start manually
    const helpBtn = screen.getByLabelText('Open tour');
    await user.click(helpBtn);

    await screen.findByText('Chip Badges');
    const nextBtn = screen.getByText('Next');
    await user.click(nextBtn);

    expect(await screen.findByText('Bank & Cost')).toBeInTheDocument();

    const backBtn = screen.getByText('Back');
    await user.click(backBtn);

    expect(await screen.findByText('Chip Badges')).toBeInTheDocument();
  });
});
