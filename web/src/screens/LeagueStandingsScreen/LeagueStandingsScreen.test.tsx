import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LeagueStandingsResponse, StandingEntry } from '@/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function makeStanding(entry: number, rank: number): StandingEntry {
  return {
    entry,
    entryName: `Team ${entry}`,
    playerName: `Player ${entry}`,
    rank,
    lastRank: rank + 1,
    total: 3000 + entry,
    eventTotal: 60 + entry,
  };
}

const PAGE_1: LeagueStandingsResponse = {
  leagueId: 42,
  leagueName: 'My Mini League',
  page: 1,
  hasNext: false,
  standings: [makeStanding(1, 1), makeStanding(2, 2)],
};

const PAGE_1_HAS_NEXT: LeagueStandingsResponse = {
  ...PAGE_1,
  hasNext: true,
};

let mockStandingsData: LeagueStandingsResponse | null = null;
let mockIsLoading = false;
let mockIsError = false;
const mockRefetch = vi.fn();
const mockFetchNextPage = vi.fn();

vi.mock('@/api/queries', () => ({
  useLeagueStandings: () => ({
    data: mockStandingsData ? { pages: [mockStandingsData] } : undefined,
    isLoading: mockIsLoading,
    isError: mockIsError,
    refetch: mockRefetch,
    fetchNextPage: mockFetchNextPage,
    isFetchingNextPage: false,
    hasNextPage: mockStandingsData?.hasNext ?? false,
  }),
}));

function renderScreen(path = '/leagues/42/standings') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LeagueStandingsScreenLazy />
    </MemoryRouter>,
  );
}

import { LeagueStandingsScreen as LeagueStandingsScreenLazy } from './LeagueStandingsScreen';

describe('LeagueStandingsScreen', () => {
  beforeEach(() => {
    mockStandingsData = null;
    mockIsLoading = false;
    mockIsError = false;
    mockRefetch.mockReset();
    mockNavigate.mockReset();
  });

  it('renders skeleton while loading', () => {
    mockIsLoading = true;
    renderScreen();
    expect(screen.getByRole('generic', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders standing rows on success', async () => {
    mockStandingsData = PAGE_1;
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument();
      expect(screen.getByText('Player 2')).toBeInTheDocument();
    });
  });

  it('shows error state and retry button', async () => {
    mockIsError = true;
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/could not load league standings/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('calls refetch when retry is clicked', async () => {
    mockIsError = true;
    renderScreen();
    await userEvent.click(await screen.findByRole('button', { name: /retry/i }));
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it('shows empty state when standings is empty', async () => {
    mockStandingsData = { ...PAGE_1, standings: [] };
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/no participants found/i)).toBeInTheDocument();
    });
  });

  it('navigates to squad screen when a row is clicked', async () => {
    mockStandingsData = PAGE_1;
    renderScreen('/leagues/42/standings?gw=5');
    const rows = await screen.findAllByText('Player 1');
    await userEvent.click(rows[0].closest('button')!);
    expect(mockNavigate).toHaveBeenCalledWith(
      '/?teamId=1',
      expect.objectContaining({
        state: expect.objectContaining({ returnTo: expect.any(String) }),
      }),
    );
  });

  it('shows Load more button when hasNext is true', async () => {
    mockStandingsData = PAGE_1_HAS_NEXT;
    renderScreen();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
    });
  });

  it('hides Load more button when hasNext is false', async () => {
    mockStandingsData = PAGE_1;
    renderScreen();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });
  });

  it('navigates back to /stats when back button is pressed', async () => {
    mockStandingsData = PAGE_1;
    renderScreen();
    const backBtn = await screen.findByRole('button', { name: /leagues/i });
    await userEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/stats');
  });
});
