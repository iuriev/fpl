import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixtureTopPlayersGw, fixtureTopPlayersSeason } from '@/fixtures';
import {
  LocalStoragePlayerWatchlistRepository,
  PlayerWatchlistRepositoryContext,
} from '@/lib/player-watchlist-repository';
import { ToastProvider } from '@/lib/toast';
import type { PlayerPoolResponse } from '@/types';

const mockPool: PlayerPoolResponse = {
  players: [
    {
      id: 1,
      webName: 'Haaland',
      firstName: 'Erling',
      lastName: 'Haaland',
      team: 43,
      teamCode: 43,
      teamShortName: 'MCI',
      position: 'FWD',
      nowCost: 150,
      totalPoints: 250,
      eventPoints: 12,
      status: 'a',
      chanceOfPlaying: null,
      news: '',
      selectedByPercent: '62.5',
      expectedPoints: '8.5',
      form: '10.0',
      nextFixtures: [],
    },
    {
      id: 2,
      webName: 'Salah',
      firstName: 'Mohamed',
      lastName: 'Salah',
      team: 14,
      teamCode: 14,
      teamShortName: 'LIV',
      position: 'MID',
      nowCost: 130,
      totalPoints: 200,
      eventPoints: 8,
      status: 'a',
      chanceOfPlaying: null,
      news: '',
      selectedByPercent: '40.0',
      expectedPoints: '7.0',
      form: '8.0',
      nextFixtures: [],
    },
  ],
};

vi.mock('@/api/queries', () => ({
  usePlayerPool: () => ({ data: mockPool }),
  useTopPlayersGw: () => ({ data: fixtureTopPlayersGw, isLoading: false }),
  useTopPlayersSeason: () => ({ data: fixtureTopPlayersSeason, isLoading: false }),
}));

function renderSheet(open = true) {
  const repo = new LocalStoragePlayerWatchlistRepository();
  const onClose = vi.fn();
  return {
    onClose,
    repo,
    ...render(
      <PlayerWatchlistRepositoryContext.Provider value={repo}>
        <ToastProvider>
          <MemoryRouter>
            <AddPlayerSheetLazy open={open} onClose={onClose} currentGw={36} />
          </MemoryRouter>
        </ToastProvider>
      </PlayerWatchlistRepositoryContext.Provider>,
    ),
  };
}

import { AddPlayerSheet as AddPlayerSheetLazy } from './AddPlayerSheet';

describe('AddPlayerSheet', () => {
  beforeEach(() => localStorage.removeItem('fpl-player-watchlist-v1'));

  it('renders all players when no search query', () => {
    renderSheet();
    expect(screen.getByText('Haaland')).toBeInTheDocument();
    expect(screen.getByText('Salah')).toBeInTheDocument();
  });

  it('filters players by name', async () => {
    renderSheet();
    await userEvent.type(screen.getByRole('searchbox'), 'Sal');
    await waitFor(() => {
      expect(screen.queryByText('Haaland')).not.toBeInTheDocument();
      expect(screen.getByText('Salah')).toBeInTheDocument();
    });
  });

  it('shows "no players found" when search has no results', async () => {
    renderSheet();
    await userEvent.type(screen.getByRole('searchbox'), 'zzz');
    await waitFor(() => {
      expect(screen.getByText(/no players found/i)).toBeInTheDocument();
    });
  });

  it('follow button toggles follow state', async () => {
    const { repo } = renderSheet();
    const followBtns = screen.getAllByRole('button', { name: /follow/i });
    await userEvent.click(followBtns[0]);
    const ids = await repo.list();
    expect(ids).toContain(1);
  });
});
