import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';
import { fixtureSquad } from '@/fixtures';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/queries', () => ({
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

const defaultEntryData = {
  teamId: 72828,
  managerName: 'Ivan Iuriev',
  teamName: 'Amorim_out',
  overallPoints: 2156,
  overallRank: 142000,
  eventPoints: 67,
  eventRank: 200000,
  totalPlayers: 10000000,
};

function renderRow(overrides?: Partial<React.ComponentProps<typeof ManagerRow>>) {
  return render(
    <MemoryRouter>
      <ManagerRow teamId={72828} entryData={defaultEntryData} currentGw={37} onRemove={vi.fn()} {...overrides} />
    </MemoryRouter>
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


  it('shows in-card loader while squad data is loading', () => {
    vi.mocked(queries.useSquad).mockImplementationOnce(() => ({ data: undefined, isLoading: true }) as never);
    vi.mocked(queries.useHistory).mockImplementationOnce(() => ({ data: undefined, isLoading: true }) as never);
    vi.mocked(queries.useTransfers).mockImplementationOnce(() => ({ data: undefined, isLoading: true }) as never);

    const { container } = renderRow();
    expect(container.querySelector('[aria-busy="true"][aria-label="Loading..."]')).toBeTruthy();
    expect(container.querySelector('[class*="spinner"]')).toBeTruthy();
  });

  it('unfollow button is disabled while loading', () => {
    vi.mocked(queries.useSquad).mockImplementationOnce(() => ({ data: undefined, isLoading: true }) as never);
    vi.mocked(queries.useHistory).mockImplementationOnce(() => ({ data: undefined, isLoading: true }) as never);
    vi.mocked(queries.useTransfers).mockImplementationOnce(() => ({ data: undefined, isLoading: true }) as never);

    const { container } = renderRow();
    const unfollowBtn = container.querySelector('button.unfollowBtn') as HTMLButtonElement
      ?? container.querySelector('[class*="unfollowBtn"]') as HTMLButtonElement;
    expect(unfollowBtn.disabled).toBe(true);
  });

  it('clicking row navigates to squad view with returnTo state', async () => {
    const user = userEvent.setup();
    renderRow();
    const row = screen.getByRole('button', { name: /view squad/i });
    await user.click(row);
    expect(mockNavigate).toHaveBeenCalledWith(
      '/?teamId=72828',
      { state: { returnTo: expect.any(String) } },
    );
  });
});
