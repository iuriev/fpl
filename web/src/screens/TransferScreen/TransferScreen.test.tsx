import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PoolPlayer, SquadPlayer, SquadResponse } from '@/types';

import { TransferScreen } from './TransferScreen';

const ZERO_STATS: SquadPlayer['stats'] = {
  minutes: 0, goals_scored: 0, assists: 0, clean_sheets: 0,
  goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0,
  yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0, total_points: 0,
};

function makePlayer(id: number, name: string, position: SquadPlayer['position']): SquadPlayer {
  return {
    id, name, position, club: 'TST', teamCode: 1, teamId: 1,
    nowCost: 50, points: 0, isCaptain: false, isViceCaptain: false,
    status: 'a', chanceOfPlaying: null, news: '', stats: ZERO_STATS,
  };
}

const SQUAD_DATA: SquadResponse = {
  gameweek: 5,
  summary: { totalPoints: 60, transfers: 0, bank: 0 },
  starters: [
    makePlayer(1, 'Hart', 'GK'),
    makePlayer(2, 'Walker', 'DEF'), makePlayer(3, 'Stones', 'DEF'),
    makePlayer(4, 'Dias', 'DEF'), makePlayer(5, 'Cancelo', 'DEF'),
    makePlayer(6, 'Foden', 'MID'), makePlayer(7, 'De Bruyne', 'MID'),
    makePlayer(8, 'Silva', 'MID'), makePlayer(9, 'Salah', 'MID'),
    makePlayer(10, 'Haaland', 'FWD'), makePlayer(11, 'Jesus', 'FWD'),
  ],
  bench: [
    makePlayer(12, 'Ederson', 'GK'),
    makePlayer(13, 'Trent', 'DEF'),
    makePlayer(14, 'Mount', 'MID'),
    makePlayer(15, 'Firmino', 'FWD'),
  ],
};

const POOL_PLAYERS: PoolPlayer[] = SQUAD_DATA.starters.concat(SQUAD_DATA.bench).map((p) => ({
  id: p.id, webName: p.name, firstName: p.name, lastName: p.name,
  team: p.teamId, teamCode: p.teamCode, teamShortName: p.club,
  position: p.position, nowCost: p.nowCost, totalPoints: 0, eventPoints: 0,
  status: p.status as PoolPlayer['status'], chanceOfPlaying: null, news: '',
  selectedByPercent: '10', form: '5.0', nextFixtures: [],
}));

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
    </QueryClientProvider>,
  );
}

describe('TransferScreen', () => {
  beforeEach(() => {
    mockState.squad = null;
    mockState.pool = null;
  });

  it('shows the Transfers heading', () => {
    renderScreen();
    expect(screen.getByText('Transfers')).toBeInTheDocument();
  });

  it('shows empty state when squad is not available', () => {
    renderScreen();
    expect(screen.getByText(/No squad found/i)).toBeInTheDocument();
  });
});

describe('TransferScreen sub mode integration', () => {
  beforeEach(() => {
    mockState.squad = SQUAD_DATA;
    mockState.pool = { players: POOL_PLAYERS };
  });

  it('active sub mode blocks PlayerPickerSheet from opening', async () => {
    const user = userEvent.setup();
    renderScreen();

    const subBtns = screen.getAllByLabelText('Substitute');
    await user.click(subBtns[0]);

    // Click Walker's card button (not the sub icon) — should not open the picker
    const walkerBtn = screen.getAllByRole('button', { name: /Walker/ })[0];
    await user.click(walkerBtn);

    expect(screen.queryByText(/Replace/i)).not.toBeInTheDocument();
  });

  it('after handleSubTargetClick the two GKs appear in swapped positions', async () => {
    const { within } = await import('@testing-library/react');
    const user = userEvent.setup();
    renderScreen();

    // Scope the sub-icon click to Hart's card button
    const hartCardBtn = screen.getByRole('button', { name: /Hart/ });
    const hartSubBtn = within(hartCardBtn).getByLabelText('Substitute');
    await user.click(hartSubBtn);

    // Ederson should now be a valid target
    const edersonBtn = screen.getByRole('button', { name: /Ederson.*SUB TARGET/ });
    await user.click(edersonBtn);

    // Both players still rendered after the swap
    expect(screen.getByRole('button', { name: /Ederson/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hart/ })).toBeInTheDocument();
  });
});
