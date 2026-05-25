import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';
import { fixtureGameweeks, fixtureTeamPlayers, fixtureTeams, fixtureTopPlayersGw, fixtureTopPlayersSeason } from '@/fixtures';

vi.mock('@/api/queries', () => ({
  useGameweeks: vi.fn(),
  useTopPlayersGw: vi.fn(),
  useTopPlayersSeason: vi.fn(),
  useTeams: vi.fn(),
  useTeamPlayers: vi.fn(),
}));

const mockQueries = vi.mocked(queries);

function setupDefaultMocks() {
  mockQueries.useGameweeks.mockReturnValue({ data: fixtureGameweeks } as ReturnType<typeof queries.useGameweeks>);
  mockQueries.useTopPlayersGw.mockReturnValue({ data: fixtureTopPlayersGw, isLoading: false, isError: false, refetch: vi.fn() } as unknown as ReturnType<typeof queries.useTopPlayersGw>);
  mockQueries.useTopPlayersSeason.mockReturnValue({ data: fixtureTopPlayersSeason, isLoading: false, isError: false, refetch: vi.fn() } as unknown as ReturnType<typeof queries.useTopPlayersSeason>);
  mockQueries.useTeams.mockReturnValue({ data: fixtureTeams } as unknown as ReturnType<typeof queries.useTeams>);
  mockQueries.useTeamPlayers.mockReturnValue({ data: fixtureTeamPlayers, isLoading: false, isError: false, refetch: vi.fn() } as unknown as ReturnType<typeof queries.useTeamPlayers>);
}

import { TopPlayersScreen } from './TopPlayersScreen';

function renderScreen(path = '/top-players') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TopPlayersScreen />
    </MemoryRouter>,
  );
}

describe('TopPlayersScreen', () => {
  beforeEach(() => setupDefaultMocks());
  it('renders the heading', () => {
    renderScreen();
    expect(screen.getByText('Top Players')).toBeInTheDocument();
  });

  it('renders GW tab and Season tab', () => {
    renderScreen();
    expect(screen.getByRole('tab', { name: 'This GW' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Season' })).toBeInTheDocument();
  });

  it('shows This GW tab active by default', () => {
    renderScreen();
    expect(screen.getByRole('tab', { name: 'This GW' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Season' })).toHaveAttribute('aria-selected', 'false');
  });

  it('renders top players from the GW fixture', () => {
    renderScreen();
    expect(screen.getByText('Haaland')).toBeInTheDocument();
    expect(screen.getByText('Salah')).toBeInTheDocument();
  });

  it('renders rank numbers for GW list', () => {
    renderScreen();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not render all 100 players initially (progressive loading)', () => {
    renderScreen();
    expect(screen.queryByText('Player100')).not.toBeInTheDocument();
  });

  it('renders prev/next gameweek nav buttons on GW tab', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /previous gameweek/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next gameweek/i })).toBeInTheDocument();
  });

  it('shows the selected GW label', () => {
    renderScreen('/top-players?gw=36');
    expect(screen.getByText('GW 36')).toBeInTheDocument();
  });

  it('next button is disabled when on the latest finished GW', () => {
    renderScreen('/top-players?gw=36');
    expect(screen.getByRole('button', { name: /next gameweek/i })).toBeDisabled();
  });

  it('prev button is disabled when on GW 1', () => {
    renderScreen('/top-players?gw=1');
    expect(screen.getByRole('button', { name: /previous gameweek/i })).toBeDisabled();
  });

  it('switches to Season tab on click', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Season' }));
    expect(screen.getByRole('tab', { name: 'Season' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders season players after switching tab', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Season' }));
    expect(screen.getByText('Salah')).toBeInTheDocument();
    expect(screen.getByText('Haaland')).toBeInTheDocument();
  });

  it('hides GW nav on Season tab', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Season' }));
    expect(screen.queryByRole('button', { name: /previous gameweek/i })).not.toBeInTheDocument();
  });

  it('renders a back button', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /squad/i })).toBeInTheDocument();
  });
});

describe('TopPlayersScreen — By Team tab', () => {
  beforeEach(() => setupDefaultMocks());

  it('renders By Team tab', () => {
    renderScreen();
    expect(screen.getByRole('tab', { name: 'By Team' })).toBeInTheDocument();
  });

  it('shows team picker trigger on By Team tab', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'By Team' }));
    expect(screen.getByRole('button', { name: /select team/i })).toBeInTheDocument();
  });

  it('lists teams alphabetically in the picker', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'By Team' }));
    await user.click(screen.getByRole('button', { name: /select team/i }));
    const dialog = screen.getByRole('dialog', { name: /select team/i });
    const buttons = Array.from(dialog.querySelectorAll('button'));
    expect(buttons[0]).toHaveTextContent('Arsenal');
    expect(buttons[1]).toHaveTextContent('Chelsea');
    expect(buttons[2]).toHaveTextContent('Man City');
  });

  it('renders players for the selected team', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'By Team' }));
    expect(screen.getByText('Saka')).toBeInTheDocument();
    expect(screen.getByText('Saliba')).toBeInTheDocument();
  });

  it('renders within-team rank starting from 1', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'By Team' }));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('hides GW navigator on By Team tab', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'By Team' }));
    expect(screen.queryByRole('button', { name: /previous gameweek/i })).not.toBeInTheDocument();
  });
});

describe('TopPlayersScreen — loading state', () => {
  it('shows loading skeleton when GW data is loading', () => {
    mockQueries.useGameweeks.mockReturnValue({ data: fixtureGameweeks } as ReturnType<typeof queries.useGameweeks>);
    mockQueries.useTopPlayersGw.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() } as unknown as ReturnType<typeof queries.useTopPlayersGw>);
    mockQueries.useTopPlayersSeason.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() } as unknown as ReturnType<typeof queries.useTopPlayersSeason>);
    renderScreen();
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });
});

describe('TopPlayersScreen — error state', () => {
  it('shows error message and retry button when GW fetch fails', () => {
    mockQueries.useGameweeks.mockReturnValue({ data: fixtureGameweeks } as ReturnType<typeof queries.useGameweeks>);
    mockQueries.useTopPlayersGw.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() } as unknown as ReturnType<typeof queries.useTopPlayersGw>);
    mockQueries.useTopPlayersSeason.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() } as unknown as ReturnType<typeof queries.useTopPlayersSeason>);
    renderScreen();
    expect(screen.getByText(/couldn't load top players/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
