import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixtureGameweeks, fixtureTopPlayersGw } from '@/fixtures';
import {
  LocalStoragePlayerWatchlistRepository,
  PlayerWatchlistRepositoryContext,
} from '@/lib/player-watchlist-repository';
import { ToastProvider } from '@/lib/toast';

const mockUsePlayersLive = vi.fn();
const mockUsePlayerPool = vi.fn();

vi.mock('@/api/queries', () => ({
  useGameweeks: () => ({ data: fixtureGameweeks }),
  usePlayersLive: (...args: unknown[]) => mockUsePlayersLive(...args),
  usePlayerPool: () => mockUsePlayerPool(),
}));

import { WatchedPlayerRow as WatchedPlayerRowLazy } from './WatchedPlayerRow';

function renderRow(
  fplCode: number,
  onRemove = vi.fn(),
  currentGw: number | null = 36
) {
  const repo = new LocalStoragePlayerWatchlistRepository();
  return render(
    <PlayerWatchlistRepositoryContext.Provider value={repo}>
      <ToastProvider>
        <MemoryRouter>
          <WatchedPlayerRowLazy
            rank={1}
            fplCode={fplCode}
            currentGw={currentGw}
            onRemove={onRemove}
          />
        </MemoryRouter>
      </ToastProvider>
    </PlayerWatchlistRepositoryContext.Provider>
  );
}

describe('WatchedPlayerRow', () => {
  beforeEach(() => {
    localStorage.removeItem('fpl-player-watchlist-v1');
    localStorage.removeItem('fpl-player-watchlist-v2');
    mockUsePlayersLive.mockReturnValue({
      data: { gw: 36, players: fixtureTopPlayersGw.players },
      isLoading: false,
      isFetched: true,
    });
    mockUsePlayerPool.mockReturnValue({ data: { players: [] }, isLoading: false });
  });

  it('renders player name when found in GW data', () => {
    const player = fixtureTopPlayersGw.players[0];
    renderRow(player.fplCode);
    expect(screen.getByText(player.webName)).toBeInTheDocument();
  });

  it('shows skeleton while gameweek is not ready', () => {
    const player = fixtureTopPlayersGw.players[0];
    mockUsePlayerPool.mockReturnValue({
      data: {
        players: [
          {
            id: player.id,
            code: player.fplCode,
            webName: 'Cached',
            position: 'FWD',
            teamCode: 13,
            teamShortName: 'MCI',
            eventPoints: 0,
            totalPoints: 100,
            selectedByPercent: '10',
          },
        ],
      },
      isLoading: false,
    });
    renderRow(player.fplCode, vi.fn(), null);
    expect(screen.getByLabelText(/loading/i)).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Cached')).not.toBeInTheDocument();
  });

  it('shows skeleton until live fetch completes even when pool is cached', () => {
    const player = fixtureTopPlayersGw.players[0];
    mockUsePlayersLive.mockReturnValue({ data: undefined, isLoading: true, isFetched: false });
    mockUsePlayerPool.mockReturnValue({
      data: {
        players: [
          {
            id: player.id,
            code: player.fplCode,
            webName: 'Cached',
            position: 'FWD',
            teamCode: 13,
            teamShortName: 'MCI',
            eventPoints: 0,
            totalPoints: 100,
            selectedByPercent: '10',
          },
        ],
      },
      isLoading: false,
    });
    renderRow(player.fplCode);
    expect(screen.getByLabelText(/loading/i)).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Cached')).not.toBeInTheDocument();
  });

  it('shows unknown state when player not in any data', () => {
    renderRow(99999);
    expect(screen.getByText(/player #99999/i)).toBeInTheDocument();
  });

  it('calls onRemove when ✕ is clicked', async () => {
    const onRemove = vi.fn();
    renderRow(99999, onRemove);
    await userEvent.click(screen.getByRole('button', { name: /unfollow player/i }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
