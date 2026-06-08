import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';
import { copy } from '@/lib/copy';

vi.mock('@/api/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/queries')>();
  return {
    ...actual,
    useGameweeks: vi.fn(),
    usePlayerPool: vi.fn(),
    usePredictions: vi.fn(),
    usePredictedLineups: vi.fn(),
    useMarket: vi.fn(),
  };
});

vi.mock('@/lib/use-premium-status', () => ({
  usePremiumStatus: vi.fn(),
}));

vi.mock('@/lib/premium-upsell/PremiumUpsellContext', () => ({
  useRequestPremiumUpsell: vi.fn(() => vi.fn()),
}));

vi.mock('@/lib/use-follow-player', () => ({
  useFollowPlayer: vi.fn(() => ({ following: false, toggle: vi.fn() })),
}));

import { usePremiumStatus } from '@/lib/use-premium-status';
import type { PredictedLineupsResponse, TeamMarketDto } from '@/types';

import { PredictionsScreen } from './PredictionsScreen';

const mockUsePremiumStatus = vi.mocked(usePremiumStatus);
const mockQueries = vi.mocked(queries);

// ── Fixtures ──────────────────────────────────────────────

function makePlayer(overrides: { id?: number; webName?: string; position?: string; expectedPoints?: string } = {}) {
  return {
    id: overrides.id ?? 1,
    code: (overrides.id ?? 1) * 1000,
    webName: overrides.webName ?? 'Player',
    firstName: 'First',
    lastName: 'Last',
    team: 1,
    teamCode: 3,
    teamShortName: 'ARS',
    position: overrides.position ?? 'MID',
    nowCost: 80,
    totalPoints: 100,
    eventPoints: 6,
    status: 'a' as const,
    chanceOfPlaying: null,
    news: '',
    selectedByPercent: '10.0',
    expectedPoints: overrides.expectedPoints ?? '5.0',
    form: '5.0',
    nextFixtures: [],
  };
}

const midPlayers = [
  makePlayer({ id: 1, webName: 'Salah', position: 'MID', expectedPoints: '8.5' }),
  makePlayer({ id: 2, webName: 'Saka', position: 'MID', expectedPoints: '7.1' }),
  makePlayer({ id: 3, webName: 'De Bruyne', position: 'MID', expectedPoints: '6.8' }),
  makePlayer({ id: 4, webName: 'Fernandes', position: 'MID', expectedPoints: '6.2' }),
];

function makeTeam(id: number, csProb: number, xG: number): TeamMarketDto {
  const shorts = ['ARS', 'AVL', 'CHE', 'LIV', 'MCI', 'TOT', 'MUN', 'NEW', 'BOU', 'BRE',
    'BHA', 'CRY', 'EVE', 'FUL', 'IPS', 'LEI', 'NFO', 'SOU', 'WHU', 'WOL'];
  return {
    teamId: id,
    teamName: `Team ${id}`,
    teamShortName: shorts[(id - 1) % 20],
    fixtures: [{ opponentTeamId: 99, opponentShortName: 'OPP', isHome: id % 2 === 0 }],
    csProb,
    xG,
    xGA: 1.0,
  };
}

const mockLineups: PredictedLineupsResponse = {
  gameweek: 37,
  teams: [
    {
      teamId: 1,
      teamCode: 3,
      shortName: 'ARS',
      formation: { counts: { def: 4, mid: 3, fwd: 3 }, label: '4-3-3', source: 'default' },
      nextFixture: { opponentShortName: 'CHE', isHome: true, kickoffTime: null },
      players: [
        {
          id: 10, webName: 'Raya', position: 'GK', teamCode: 3,
          lane: 'C', pitchOrder: 0, injuryWarning: false, benchRisk: false, chanceOfPlaying: null,
          xMins: 90, xPts: 5.0, status: 'a' as const,
        },
        {
          id: 11, webName: 'White', position: 'DEF', teamCode: 3,
          lane: 'L', pitchOrder: 1, injuryWarning: false, benchRisk: false, chanceOfPlaying: null,
          xMins: 90, xPts: 4.0, status: 'a' as const,
        },
      ],
    },
  ],
};

// ── Render helper ─────────────────────────────────────────

function renderScreen(isPremium = false, initialEntries = ['/predictions']) {
  mockUsePremiumStatus.mockReturnValue(isPremium);
  mockQueries.useGameweeks.mockReturnValue({
    data: { current: 36, next: 37, gameweeks: [] },
  } as unknown as ReturnType<typeof queries.useGameweeks>);
  mockQueries.usePlayerPool.mockReturnValue({
    data: { players: midPlayers },
    isLoading: false,
  } as unknown as ReturnType<typeof queries.usePlayerPool>);
  mockQueries.usePredictions.mockReturnValue({
    data: { event: 37, modelRunId: null, ready: false, players: [] },
    isLoading: false,
  } as unknown as ReturnType<typeof queries.usePredictions>);
  mockQueries.usePredictedLineups.mockReturnValue({
    data: mockLineups,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.usePredictedLineups>);
  mockQueries.useMarket.mockReturnValue({
    data: {
      event: 37,
      modelRunId: 'run-1',
      ready: true,
      teams: Array.from({ length: 20 }, (_, i) => makeTeam(i + 1, (20 - i) * 0.04, (20 - i) * 0.1)),
    },
    isLoading: false,
  } as unknown as ReturnType<typeof queries.useMarket>);

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        <PredictionsScreen />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────

describe('PredictionsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tab bar', () => {
    it('renders all four tabs', () => {
      renderScreen();
      expect(screen.getByRole('tab', { name: copy.predictionsTabPoints })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: copy.predictionsTabLineups })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: copy.predictionsTabCS })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: copy.predictionsTabXG })).toBeInTheDocument();
    });

    it('defaults to Points tab', () => {
      renderScreen();
      expect(screen.getByRole('tab', { name: copy.predictionsTabPoints })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Points tab', () => {
    it('shows position sub-tabs', () => {
      renderScreen();
      expect(screen.getByRole('tab', { name: 'MID' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'GK' })).toBeInTheDocument();
    });

    it('shows top 3 players free and a lock overlay for free user', () => {
      renderScreen(false);
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Saka')).toBeInTheDocument();
      expect(screen.getByText('De Bruyne')).toBeInTheDocument();
      expect(screen.getByText(copy.predictedPointsUnlockLabel)).toBeInTheDocument();
    });

    it('shows all players without lock for premium user', () => {
      renderScreen(true);
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Fernandes')).toBeInTheDocument();
      expect(screen.queryByText(copy.predictedPointsUnlockLabel)).not.toBeInTheDocument();
    });

    it('opens PremiumSheet when Points unlock CTA is clicked', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByText(copy.predictedPointsUnlockLabel));
      expect(screen.getByText(copy.predictedPointsPremiumTitle)).toBeInTheDocument();
    });
  });

  describe('Lineups tab', () => {
    it('shows premium lock overlay for free user', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabLineups }));
      expect(screen.getByText(copy.predictionsLineupsUnlockLabel)).toBeInTheDocument();
    });

    it('shows team chips and pitch for premium user', async () => {
      const user = userEvent.setup();
      renderScreen(true);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabLineups }));
      expect(screen.getByRole('tab', { name: 'ARS' })).toBeInTheDocument();
    });

    it('opens PremiumSheet when Lineups unlock CTA is clicked', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabLineups }));
      await user.click(screen.getByText(copy.predictionsLineupsUnlockLabel));
      expect(screen.getByText(copy.predictionsLineupsPremiumTitle)).toBeInTheDocument();
    });
  });

  describe('CS% tab', () => {
    it('shows all teams without any lock for free user', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabCS }));
      const rows = screen.getAllByText(/\d+%/);
      expect(rows.length).toBe(20);
      expect(screen.queryByText(/unlock/i)).not.toBeInTheDocument();
    });

    it('shows sorted CS% values descending', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabCS }));
      const rows = screen.getAllByText(/\d+%/);
      const first = parseInt(rows[0].textContent!);
      const second = parseInt(rows[1].textContent!);
      expect(first).toBeGreaterThanOrEqual(second);
    });
  });

  describe('xG tab', () => {
    it('shows all teams without any lock for free user', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabXG }));
      const rows = screen.getAllByText(/^\d+\.\d{2}$/);
      expect(rows.length).toBe(20);
      expect(screen.queryByText(/unlock/i)).not.toBeInTheDocument();
    });
  });

  describe('GW badge', () => {
    it('shows next GW in header', () => {
      renderScreen();
      expect(screen.getByText('GW 37')).toBeInTheDocument();
    });
  });
});
