import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';
import {
  fixtureDreamTeam,
  fixtureGameweeks,
  fixtureLeaderboardGw,
  fixtureLeaderboardSeason,
  fixtureTeamPlayers,
  fixtureTeams,
  fixtureTopPlayersGw,
  fixtureTopPlayersSeason,
} from '@/fixtures';

vi.mock('@/api/queries', () => ({
  useGameweeks: vi.fn(),
  useLeaderboardGw: vi.fn(),
  useLeaderboardSeason: vi.fn(),
  useTeamOfTheWeek: vi.fn(),
  useTeamPlayers: vi.fn(),
  useTeams: vi.fn(),
  useTopPlayersGw: vi.fn(),
  useTopPlayersSeason: vi.fn(),
}));

const mockQueries = vi.mocked(queries);

function setupDefaultMocks() {
  mockQueries.useGameweeks.mockReturnValue({ data: fixtureGameweeks } as ReturnType<
    typeof queries.useGameweeks
  >);
  mockQueries.useTopPlayersGw.mockReturnValue({
    data: fixtureTopPlayersGw,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.useTopPlayersGw>);
  mockQueries.useTopPlayersSeason.mockReturnValue({
    data: fixtureTopPlayersSeason,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.useTopPlayersSeason>);
  mockQueries.useTeams.mockReturnValue({ data: fixtureTeams } as unknown as ReturnType<
    typeof queries.useTeams
  >);
  mockQueries.useTeamPlayers.mockReturnValue({
    data: fixtureTeamPlayers,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.useTeamPlayers>);
  mockQueries.useTeamOfTheWeek.mockReturnValue({
    data: fixtureDreamTeam,
    isPending: false,
    isFetching: false,
    isPlaceholderData: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.useTeamOfTheWeek>);
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

import { TopPlayersScreen } from './TopPlayersScreen';

function renderScreen(path = '/top-players') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TopPlayersScreen />
    </MemoryRouter>
  );
}

describe('TopPlayersScreen', () => {
  beforeEach(() => setupDefaultMocks());

  it('renders the heading', () => {
    renderScreen();
    expect(screen.getByText('Top Players')).toBeInTheDocument();
  });

  it('renders all 5 tabs', () => {
    renderScreen();
    expect(screen.getByRole('tab', { name: 'Points' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'DEFCON' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'BPS' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'By Team' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Season' })).toBeInTheDocument();
  });

  it('shows Points tab active by default', () => {
    renderScreen();
    expect(screen.getByRole('tab', { name: 'Points' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Season' })).toHaveAttribute('aria-selected', 'false');
  });

  it('renders top players from the GW fixture on Points tab', () => {
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

  it('renders prev/next gameweek nav buttons on Points tab', () => {
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

  it('renders a menu button', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /open team info/i })).toBeInTheDocument();
  });
});

describe('TopPlayersScreen — Points tab view toggle', () => {
  beforeEach(() => setupDefaultMocks());

  it('renders List/Pitch view toggle on Points tab', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pitch/i })).toBeInTheDocument();
  });

  it('List view is active by default', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /list/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('view toggle is not shown on DEFCON tab', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'DEFCON' }));
    expect(screen.queryByRole('button', { name: /list/i })).not.toBeInTheDocument();
  });
});

describe('TopPlayersScreen — DEFCON tab', () => {
  beforeEach(() => setupDefaultMocks());

  it('shows DEFCON tab content when DEFCON tab is active', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'DEFCON' }));
    expect(screen.getByText('Alexander-Arnold')).toBeInTheDocument();
    expect(screen.getByText('Trippier')).toBeInTheDocument();
  });

  it('renders GW nav on DEFCON tab', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'DEFCON' }));
    expect(screen.getByRole('button', { name: /previous gameweek/i })).toBeInTheDocument();
  });

  it('renders BPS badge labels in DEFCON list', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'DEFCON' }));
    const badges = screen.getAllByText('BPS');
    expect(badges.length).toBeGreaterThan(0);
  });
});

describe('TopPlayersScreen — BPS tab', () => {
  beforeEach(() => setupDefaultMocks());

  it('shows BPS tab content when BPS tab is active', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'BPS' }));
    expect(screen.getByText('Dorgu')).toBeInTheDocument();
    expect(screen.getByText('Salah')).toBeInTheDocument();
  });

  it('renders GW nav on BPS tab', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'BPS' }));
    expect(screen.getByRole('button', { name: /previous gameweek/i })).toBeInTheDocument();
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
    const buttons = Array.from(dialog.querySelectorAll('button')).filter((b) =>
      b.textContent?.trim()
    );
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

describe('TopPlayersScreen — Season tab', () => {
  beforeEach(() => setupDefaultMocks());

  it('switches to Season tab on click', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Season' }));
    expect(screen.getByRole('tab', { name: 'Season' })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows Points sub-view by default on Season tab', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Season' }));
    expect(screen.getByRole('button', { name: 'Points' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders season players on Points sub-view', async () => {
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

  it('switches to DEFCON season view', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Season' }));
    await user.click(screen.getByRole('button', { name: 'DEFCON' }));
    expect(screen.getByRole('button', { name: 'DEFCON' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Alexander-Arnold')).toBeInTheDocument();
  });

  it('switches to BPS season view', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Season' }));
    await user.click(screen.getByRole('button', { name: 'BPS' }));
    expect(screen.getByRole('button', { name: 'BPS' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Haaland')).toBeInTheDocument();
  });
});

describe('TopPlayersScreen — loading state', () => {
  it('shows loading skeleton when GW data is loading', () => {
    mockQueries.useGameweeks.mockReturnValue({ data: fixtureGameweeks } as ReturnType<
      typeof queries.useGameweeks
    >);
    mockQueries.useTopPlayersGw.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useTopPlayersGw>);
    mockQueries.useTopPlayersSeason.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useTopPlayersSeason>);
    mockQueries.useLeaderboardGw.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useLeaderboardGw>);
    mockQueries.useLeaderboardSeason.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useLeaderboardSeason>);
    renderScreen();
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });
});

describe('TopPlayersScreen — error state', () => {
  it('shows error message and retry button when GW fetch fails', () => {
    mockQueries.useGameweeks.mockReturnValue({ data: fixtureGameweeks } as ReturnType<
      typeof queries.useGameweeks
    >);
    mockQueries.useTopPlayersGw.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useTopPlayersGw>);
    mockQueries.useTopPlayersSeason.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useTopPlayersSeason>);
    mockQueries.useLeaderboardGw.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useLeaderboardGw>);
    mockQueries.useLeaderboardSeason.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useLeaderboardSeason>);
    renderScreen();
    expect(screen.getByText(/couldn't load top players/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
