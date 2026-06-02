import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { fixtureEntry, fixtureSquad } from '@/fixtures';
import {
  LocalStorageWatchlistRepository,
  WatchlistRepositoryContext,
} from '@/lib/watchlist-repository';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/queries', () => ({
  useEntry: vi.fn(() => ({ data: fixtureEntry, isLoading: false, isError: false })),
  useSquad: vi.fn(() => ({ data: fixtureSquad, isLoading: false })),
  useHistory: vi.fn(() => ({
    data: { teamId: 72828, gameweeks: [{ gw: 37, overallRank: 142000, overallPoints: 2156, gwRank: 200000, gwPoints: 67, pointsOnBench: 6, transfers: 1, transferCost: 0, teamValue: 102.3 }, { gw: 36, overallRank: 148000, overallPoints: 2089, gwRank: 300000, gwPoints: 55, pointsOnBench: 2, transfers: 0, transferCost: 0, teamValue: 101.8 }] },
    isLoading: false,
  })),
  useTransfers: vi.fn(() => ({
    data: { teamId: 72828, transfers: [{ event: 37, elementIn: 301, elementInName: 'Salah', elementOut: 302, elementOutName: 'Haaland', elementInCost: 130, elementOutCost: 135, time: '2025-04-28T10:00:00Z' }] },
    isLoading: false,
  })),
}));

import { ManagerRow } from './ManagerRow';

function renderRow(overrides?: Partial<React.ComponentProps<typeof ManagerRow>>) {
  const repo = new LocalStorageWatchlistRepository();
  return render(
    <WatchlistRepositoryContext.Provider value={repo}>
      <MemoryRouter>
        <table>
          <tbody>
            <ManagerRow teamId={72828} currentGw={37} onRemove={vi.fn()} {...overrides} />
          </tbody>
        </table>
      </MemoryRouter>
    </WatchlistRepositoryContext.Provider>
  );
}

describe('ManagerRow', () => {
  it('renders manager name when loaded', () => {
    renderRow();
    expect(screen.getByText('Ivan Iuriev')).toBeInTheDocument();
  });

  it('renders team name when loaded', () => {
    renderRow();
    expect(screen.getByText('Amorim_out')).toBeInTheDocument();
  });

  it('renders rank delta upward indicator', () => {
    renderRow();
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it('renders latest transfer in player name', () => {
    renderRow();
    const matches = screen.getAllByText(/Salah/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders remove button', () => {
    renderRow();
    expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument();
  });

  it('clicking remove calls onRemove', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    renderRow({ onRemove });
    await user.click(screen.getByRole('button', { name: /unfollow/i }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('clicking row navigates to squad view with returnTo state', async () => {
    const user = userEvent.setup();
    renderRow();
    const row = screen.getByRole('row');
    await user.click(row);
    expect(mockNavigate).toHaveBeenCalledWith(
      '/?teamId=72828',
      { state: { returnTo: expect.any(String) } },
    );
    expect(sessionStorage.getItem('fpl-guest-return-to')).toBeTruthy();
  });
});
