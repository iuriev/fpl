import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixtureEntry, fixtureGameweeks } from '@/fixtures';
import {
  LocalStorageWatchlistRepository,
  WatchlistRepositoryContext,
} from '@/lib/watchlist-repository';

vi.mock('@/api/queries', () => ({
  useGameweeks: () => ({ data: fixtureGameweeks }),
  useEntry: () => ({ data: fixtureEntry, isError: false }),
  useSquad: () => ({ data: null, isLoading: false }),
  useHistory: () => ({ data: null, isLoading: false }),
  useTransfers: () => ({ data: null, isLoading: false }),
  useLeagues: () => ({ data: null, isLoading: false, isError: false }),
  useLeagueStandings: () => ({ data: null, isLoading: false, isError: false }),
}));

vi.mock('@/api/client', () => ({
  api: {
    getEntry: vi.fn().mockResolvedValue(fixtureEntry),
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, public statusCode: string, message: string) {
      super(message);
    }
  },
}));

function renderScreen(userTeamId?: number, repo = new LocalStorageWatchlistRepository()) {
  return render(
    <WatchlistRepositoryContext.Provider value={repo}>
      <MemoryRouter initialEntries={['/watchlist']}>
        <div>
          {/* lazy import avoids circular deps in test */}
          <WatchlistScreenLazy userTeamId={userTeamId} />
        </div>
      </MemoryRouter>
    </WatchlistRepositoryContext.Provider>
  );
}

import { WatchlistScreen as WatchlistScreenLazy } from './WatchlistScreen';

describe('WatchlistScreen', () => {
  beforeEach(() => localStorage.removeItem('fpl-watchlist-v1'));

  it('renders empty state when watchlist is empty', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/no managers followed yet/i)).toBeInTheDocument();
    });
  });

  it('shows capacity badge', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/0\/5 following/i)).toBeInTheDocument();
    });
  });

  it('renders rows for followed managers', async () => {
    const repo = new LocalStorageWatchlistRepository();
    await repo.add(72828);

    render(
      <WatchlistRepositoryContext.Provider value={repo}>
        <MemoryRouter>
          <WatchlistScreenLazy userTeamId={72828} />
        </MemoryRouter>
      </WatchlistRepositoryContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/1\/5 following/i)).toBeInTheDocument();
    });
  });

  it('shows add input and Follow button', async () => {
    renderScreen();
    expect(screen.getByPlaceholderText(/enter team id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
  });

  it('shows From My Leagues section', async () => {
    renderScreen();
    expect(screen.getByText(/from my leagues/i)).toBeInTheDocument();
  });

  it('can remove a manager from the list', async () => {
    const repo = new LocalStorageWatchlistRepository();
    await repo.add(72828);
    const user = userEvent.setup();

    render(
      <WatchlistRepositoryContext.Provider value={repo}>
        <MemoryRouter>
          <WatchlistScreenLazy userTeamId={72828} />
        </MemoryRouter>
      </WatchlistRepositoryContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/1\/5 following/i)).toBeInTheDocument();
    });

    const removeBtn = screen.getByRole('button', { name: /unfollow/i });
    await user.click(removeBtn);

    await waitFor(() => {
      expect(screen.getByText(/0\/5 following/i)).toBeInTheDocument();
    });
  });
});
