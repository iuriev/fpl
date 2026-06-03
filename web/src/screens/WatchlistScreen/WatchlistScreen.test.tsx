import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext, AuthContextValue } from '@/auth/AuthContext';
import { fixtureEntry, fixtureGameweeks } from '@/fixtures';
import { MyTeamProvider } from '@/lib/my-team/MyTeamProvider';
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

const mockAuthContext: AuthContextValue = {
  user: null,
  loading: false,
  refetch: vi.fn(),
};

function withProviders(children: React.ReactNode, repo = new LocalStorageWatchlistRepository()) {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      <MyTeamProvider>
        <WatchlistRepositoryContext.Provider value={repo}>
          <MemoryRouter initialEntries={['/watchlist']}>
            <div>{children}</div>
          </MemoryRouter>
        </WatchlistRepositoryContext.Provider>
      </MyTeamProvider>
    </AuthContext.Provider>
  );
}

function renderScreen(repo = new LocalStorageWatchlistRepository()) {
  return render(withProviders(<WatchlistScreenLazy />, repo));
}

import React from 'react';

import { WatchlistScreen as WatchlistScreenLazy } from './WatchlistScreen';

describe('WatchlistScreen', () => {
  beforeEach(() => localStorage.removeItem('fpl-watchlist-v1'));
  afterEach(() => localStorage.removeItem('fpl-my-team-id'));

  it('renders empty state when watchlist is empty', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/no managers followed yet/i)).toBeInTheDocument();
    });
  });

  it('shows capacity badge', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/0\/2 following/i)).toBeInTheDocument();
    });
  });

  it('renders rows for followed managers', async () => {
    const repo = new LocalStorageWatchlistRepository();
    await repo.add(72828);

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MyTeamProvider>
          <WatchlistRepositoryContext.Provider value={repo}>
            <MemoryRouter>
              <WatchlistScreenLazy />
            </MemoryRouter>
          </WatchlistRepositoryContext.Provider>
        </MyTeamProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/1\/2 following/i)).toBeInTheDocument();
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
      <AuthContext.Provider value={mockAuthContext}>
        <MyTeamProvider>
          <WatchlistRepositoryContext.Provider value={repo}>
            <MemoryRouter>
              <WatchlistScreenLazy />
            </MemoryRouter>
          </WatchlistRepositoryContext.Provider>
        </MyTeamProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/1\/2 following/i)).toBeInTheDocument();
    });

    const removeBtn = screen.getByRole('button', { name: /unfollow 72828/i });
    await user.click(removeBtn);

    await waitFor(() => {
      expect(screen.getByText(/0\/2 following/i)).toBeInTheDocument();
    });
  });
});
