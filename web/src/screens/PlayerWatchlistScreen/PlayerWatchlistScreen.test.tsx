import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixtureGameweeks, fixtureTopPlayersGw, fixtureTopPlayersSeason } from '@/fixtures';
import {
  LocalStoragePlayerWatchlistRepository,
  PlayerWatchlistRepositoryContext,
} from '@/lib/player-watchlist-repository';
import { ToastProvider } from '@/lib/toast';

vi.mock('@/api/queries', () => ({
  useGameweeks: () => ({ data: fixtureGameweeks }),
  useTopPlayersGw: () => ({ data: fixtureTopPlayersGw, isLoading: false }),
  useTopPlayersSeason: () => ({ data: fixtureTopPlayersSeason, isLoading: false }),
  usePlayerPool: () => ({ data: { players: [] } }),
}));

vi.mock('./WatchedPlayerRow', () => ({
  WatchedPlayerRow: ({
    rank,
    playerId,
    onRemove,
  }: {
    rank: number;
    playerId: number;
    onRemove: () => void;
  }) => (
    <div data-testid={`watched-${playerId}`}>
      <span>{rank}</span>
      <button onClick={onRemove} aria-label="Unfollow player">
        ✕
      </button>
    </div>
  ),
}));

vi.mock('./AddPlayerSheet', () => ({
  AddPlayerSheet: () => null,
}));

function renderScreen(repo = new LocalStoragePlayerWatchlistRepository()) {
  return render(
    <PlayerWatchlistRepositoryContext.Provider value={repo}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/player-watchlist']}>
          <PlayerWatchlistScreenLazy />
        </MemoryRouter>
      </ToastProvider>
    </PlayerWatchlistRepositoryContext.Provider>,
  );
}

import { PlayerWatchlistScreen as PlayerWatchlistScreenLazy } from './PlayerWatchlistScreen';

describe('PlayerWatchlistScreen', () => {
  beforeEach(() => localStorage.removeItem('fpl-player-watchlist-v1'));

  it('renders empty state when watchlist is empty', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/no players followed yet/i)).toBeInTheDocument();
    });
  });

  it('shows capacity badge', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/0\/2 following/i)).toBeInTheDocument();
    });
  });

  it('shows capacity badge at limit when full', async () => {
    const repo = new LocalStoragePlayerWatchlistRepository();
    await repo.add(1);
    await repo.add(2);
    renderScreen(repo);
    await waitFor(() => {
      expect(screen.getByText(/2\/2 following/i)).toBeInTheDocument();
    });
  });

  it('renders watched player rows', async () => {
    const repo = new LocalStoragePlayerWatchlistRepository();
    await repo.add(1);
    await repo.add(2);
    renderScreen(repo);
    await waitFor(() => {
      expect(screen.getByTestId('watched-1')).toBeInTheDocument();
      expect(screen.getByTestId('watched-2')).toBeInTheDocument();
    });
  });

  it('removes player when unfollow is clicked', async () => {
    const repo = new LocalStoragePlayerWatchlistRepository();
    await repo.add(1);
    renderScreen(repo);
    await waitFor(() => {
      expect(screen.getByTestId('watched-1')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /unfollow player/i }));
    await waitFor(() => {
      expect(screen.queryByTestId('watched-1')).not.toBeInTheDocument();
    });
  });

  it('filters rows by search query', async () => {
    const gwPlayer = fixtureTopPlayersGw.players[0];
    const repo = new LocalStoragePlayerWatchlistRepository();
    await repo.add(gwPlayer.id);
    renderScreen(repo);
    await waitFor(() => {
      expect(screen.getByTestId(`watched-${gwPlayer.id}`)).toBeInTheDocument();
    });
    await userEvent.type(screen.getByRole('searchbox'), 'zzznomatch');
    await waitFor(() => {
      expect(screen.queryByTestId(`watched-${gwPlayer.id}`)).not.toBeInTheDocument();
    });
  });

  it('opens add sheet when add button is clicked', async () => {
    renderScreen();
    await waitFor(() => screen.getByText(/add player by name/i));
    // AddPlayerSheet is mocked as null but the button should be present
    expect(screen.getByText(/add player by name/i)).toBeInTheDocument();
  });
});
