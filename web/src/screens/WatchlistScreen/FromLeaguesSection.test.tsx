import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
  LocalStorageWatchlistRepository,
  WatchlistRepositoryContext,
} from '@/lib/watchlist-repository';

const mockLeagues = {
  teamId: 72828,
  classic: [
    { id: 314, name: 'My Mini League', rank: 2, lastRank: 3 },
    { id: 999, name: 'Global', rank: 50000, lastRank: 52000 },
  ],
  h2h: [],
};

const mockStandings = {
  leagueId: 314,
  leagueName: 'My Mini League',
  page: 1,
  hasNext: false,
  standings: [
    { entry: 111, entryName: 'Top Squad', playerName: 'Alice Smith', rank: 1, lastRank: 2, total: 2200, eventTotal: 85 },
    { entry: 222, entryName: 'Dream XI', playerName: 'Bob Jones', rank: 2, lastRank: 1, total: 2150, eventTotal: 70 },
  ],
};

vi.mock('@/api/queries', () => ({
  useLeagues: vi.fn((teamId: number | null) => ({
    data: teamId ? mockLeagues : null,
    isLoading: false,
    isError: false,
  })),
  useLeagueStandings: vi.fn(() => ({
    data: mockStandings,
    isLoading: false,
    isError: false,
  })),
}));

import { FromLeaguesSection } from './FromLeaguesSection';

function renderSection(props: Omit<React.ComponentProps<typeof FromLeaguesSection>, 'onLimitReached'> & { onLimitReached?: () => void }) {
  const repo = new LocalStorageWatchlistRepository();
  return {
    repo,
    ...render(
      <WatchlistRepositoryContext.Provider value={repo}>
        <MemoryRouter>
          <FromLeaguesSection onLimitReached={vi.fn()} {...props} />
        </MemoryRouter>
      </WatchlistRepositoryContext.Provider>
    ),
  };
}

describe('FromLeaguesSection', () => {
  it('shows heading button', () => {
    renderSection({ userTeamId: null, watchedIds: new Set(), isFull: false, onFollow: vi.fn() });
    expect(screen.getByRole('button', { name: /from my leagues/i })).toBeInTheDocument();
  });

  it('shows "open your squad first" when no userTeamId', async () => {
    const user = userEvent.setup();
    renderSection({ userTeamId: null, watchedIds: new Set(), isFull: false, onFollow: vi.fn() });
    await user.click(screen.getByRole('button', { name: /from my leagues/i }));
    expect(screen.getByText(/open your squad first/i)).toBeInTheDocument();
  });

  it('shows leagues when userTeamId is provided', async () => {
    const user = userEvent.setup();
    renderSection({ userTeamId: 72828, watchedIds: new Set(), isFull: false, onFollow: vi.fn() });
    await user.click(screen.getByRole('button', { name: /from my leagues/i }));
    expect(screen.getByText('My Mini League')).toBeInTheDocument();
  });

  it('shows standings when league is expanded', async () => {
    const user = userEvent.setup();
    renderSection({ userTeamId: 72828, watchedIds: new Set(), isFull: false, onFollow: vi.fn() });
    await user.click(screen.getByRole('button', { name: /from my leagues/i }));
    await user.click(screen.getByRole('button', { name: /my mini league/i }));
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('Follow button calls onFollow with team entry id', async () => {
    const user = userEvent.setup();
    const onFollow = vi.fn();
    renderSection({ userTeamId: 72828, watchedIds: new Set(), isFull: false, onFollow });
    await user.click(screen.getByRole('button', { name: /from my leagues/i }));
    await user.click(screen.getByRole('button', { name: /my mini league/i }));
    const followBtns = screen.getAllByRole('button', { name: /^follow$/i });
    await user.click(followBtns[0]);
    expect(onFollow).toHaveBeenCalledWith(111);
  });

  it('shows Following for already-watched managers', async () => {
    const user = userEvent.setup();
    renderSection({ userTeamId: 72828, watchedIds: new Set([111]), isFull: false, onFollow: vi.fn() });
    await user.click(screen.getByRole('button', { name: /from my leagues/i }));
    await user.click(screen.getByRole('button', { name: /my mini league/i }));
    const followingBtns = screen.getAllByRole('button', { name: /following/i });
    expect(followingBtns.length).toBeGreaterThan(0);
  });

  it('calls onLimitReached when Follow is clicked and watchlist is full', async () => {
    const user = userEvent.setup();
    const onLimitReached = vi.fn();
    renderSection({ userTeamId: 72828, watchedIds: new Set(), isFull: true, onFollow: vi.fn(), onLimitReached });
    await user.click(screen.getByRole('button', { name: /from my leagues/i }));
    await user.click(screen.getByRole('button', { name: /my mini league/i }));
    const followBtns = screen.getAllByRole('button', { name: /^follow$/i });
    await user.click(followBtns[0]);
    expect(onLimitReached).toHaveBeenCalledOnce();
  });
});
