import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';
import { fixtureGameweeks, fixtureLeaderboardGw, fixtureLeaderboardSeason } from '@/fixtures';

vi.mock('@/api/queries', () => ({
  useGameweeks: vi.fn(),
  useLeaderboardGw: vi.fn(),
  useLeaderboardSeason: vi.fn(),
}));

vi.mock('@/lib/use-follow-player', () => ({
  useFollowPlayer: vi.fn(() => ({ following: false, toggle: vi.fn() })),
}));

const mockQueries = vi.mocked(queries);

function setupDefaultMocks() {
  mockQueries.useGameweeks.mockReturnValue({ data: fixtureGameweeks } as ReturnType<typeof queries.useGameweeks>);
  mockQueries.useLeaderboardGw.mockReturnValue({
    data: fixtureLeaderboardGw,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.useLeaderboardGw>);
  mockQueries.useLeaderboardSeason.mockReturnValue({
    data: fixtureLeaderboardSeason,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.useLeaderboardSeason>);
}

import { LeaderboardScreen } from './LeaderboardScreen';

function renderScreen(path = '/leaderboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LeaderboardScreen />
    </MemoryRouter>
  );
}

describe('LeaderboardScreen', () => {
  beforeEach(setupDefaultMocks);

  it('renders the DEFCON column header', () => {
    renderScreen();
    expect(screen.getByText('DEFCON')).toBeInTheDocument();
  });

  it('renders the BPS column header', () => {
    renderScreen();
    expect(screen.getByText('BPS')).toBeInTheDocument();
  });

  it('renders DEFCON players from GW fixture', () => {
    renderScreen();
    expect(screen.getByText('Alexander-Arnold')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('renders BPS players from GW fixture', () => {
    renderScreen();
    expect(screen.getByText('Dorgu')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('shows GW tab active by default', () => {
    renderScreen();
    const gwTab = screen.getByRole('tab', { name: /GW/i });
    expect(gwTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to Season tab and loads season data', async () => {
    renderScreen();
    const seasonTab = screen.getByRole('tab', { name: /Season/i });
    await userEvent.click(seasonTab);
    expect(screen.getByText('Salah')).toBeInTheDocument();
    expect(screen.getByText('1100')).toBeInTheDocument();
  });

  it('shows GW picker button with current GW label', () => {
    renderScreen();
    expect(screen.getByText(/GW 36/)).toBeInTheDocument();
  });

  it('opens GW picker bottom sheet on button click', async () => {
    renderScreen();
    const pickerBtn = screen.getByRole('button', { name: /GW 36/ });
    await userEvent.click(pickerBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows skeleton rows when loading', () => {
    mockQueries.useLeaderboardGw.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useLeaderboardGw>);
    renderScreen();
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state and retry button', async () => {
    const refetch = vi.fn();
    mockQueries.useLeaderboardGw.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof queries.useLeaderboardGw>);
    renderScreen();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(retryBtn);
    expect(refetch).toHaveBeenCalled();
  });

  it('opens player info sheet when a player row is tapped', async () => {
    renderScreen();
    const playerRow = screen.getByRole('button', { name: /Alexander-Arnold/ });
    await userEvent.click(playerRow);
    expect(screen.getByText('Alexander-Arnold', { selector: 'p, h2, h3' })).toBeInTheDocument();
  });
});
