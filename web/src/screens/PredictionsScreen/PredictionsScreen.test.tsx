import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';
import { copy, interpolate } from '@/lib/copy';
import { usePremiumStatus } from '@/lib/use-premium-status';
import type { PlayerProfileResponse, PredictedLineupsResponse, TeamMarketDto } from '@/types';

import { PredictionsScreen } from './PredictionsScreen';

vi.mock('@/api/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/queries')>();
  return {
    ...actual,
    useGameweeks: vi.fn(),
    usePlayerPool: vi.fn(),
    usePredictions: vi.fn(),
    usePredictionsPreview: vi.fn(),
    usePredictedLineups: vi.fn(),
    useMarket: vi.fn(),
    useMarketPreview: vi.fn(),
    usePlayerProfile: vi.fn(),
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

vi.mock('@/lib/startup-readiness/StartupReadinessContext', () => ({
  useStartupReadiness: vi.fn(() => ({
    ready: true,
    checking: false,
    health: {
      status: 'ok',
      ready: true,
      seed: { phase: 'skipped' },
      lineupsWarmup: { phase: 'done', ready: true, hotDone: 0, hotTotal: 0, coldDone: 0, coldTotal: 0, lastError: null, startedAt: null },
      predictionsWarmup: { phase: 'done', ready: true, targetEvent: 37, lastError: null, startedAt: null },
    },
  })),
}));

vi.mock('@/lib/startup-readiness/use-predictions-warmup-refetch', () => ({
  usePredictionsWarmupRefetch: vi.fn(),
}));

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
    teamCode: id * 10,
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
          id: 10, fplCode: 10, webName: 'Raya', position: 'GK', teamCode: 3,
          lane: 'C', pitchOrder: 0, injuryWarning: false, benchRisk: false, chanceOfPlaying: null,
          xMins: 90, xPts: 5.0, status: 'a' as const,
        },
        {
          id: 11, fplCode: 11, webName: 'White', position: 'DEF', teamCode: 3,
          lane: 'L', pitchOrder: 1, injuryWarning: false, benchRisk: false, chanceOfPlaying: null,
          xMins: 90, xPts: 4.0, status: 'a' as const,
        },
      ],
    },
  ],
};

const mockProfile: PlayerProfileResponse = {
  player: {
    id: 1,
    fplCode: 90001,
    webName: 'Salah',
    position: 'MID',
    teamCode: 3,
    teamShortName: 'LIV',
    nowCost: 130,
    selectedByPercent: '50',
    status: 'a',
    news: '',
  },
  gw: 37,
  gwPoints: 8,
  gwStats: [{ identifier: 'minutes', value: 90 }],
  nextFixtures: [{ gw: 38, opponent: 'MCI', home: false, difficulty: 5 }],
};

// ── Render helper ─────────────────────────────────────────

function renderScreen(
  isPremium = false,
  initialEntries = ['/predictions'],
  options?: { marketPreviewReady?: boolean },
) {
  mockUsePremiumStatus.mockReturnValue(isPremium);
  mockQueries.usePlayerProfile.mockReturnValue({
    data: mockProfile,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof queries.usePlayerProfile>);
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
  mockQueries.usePredictionsPreview.mockReturnValue({
    data: {
      event: 37,
      modelRunId: 'run-1',
      ready: true,
      byXPts: {
        FWD: [],
        MID: [
          {
            fplCode: 1000,
            playerId: 1,
            event: 37,
            xPts: 8.5,
            xGoals: 0.4,
            xAssists: 0.3,
            csProb: null,
            defconPts: 0,
            confidence: 'high',
            epNextAnchor: 8.5,
            modelXPts: 8.5,
          },
          {
            fplCode: 2000,
            playerId: 2,
            event: 37,
            xPts: 7.1,
            xGoals: 0.3,
            xAssists: 0.2,
            csProb: null,
            defconPts: 0,
            confidence: 'medium',
            epNextAnchor: 7.1,
            modelXPts: 7.1,
          },
        ],
        DEF: [],
        GK: [],
      },
      byXAssists: {
        FWD: [],
        MID: [
          {
            fplCode: 4000,
            playerId: 4,
            event: 37,
            xPts: 6.2,
            xGoals: 0.2,
            xAssists: 0.41,
            csProb: null,
            defconPts: 0,
            confidence: 'medium',
            epNextAnchor: 6.2,
            modelXPts: 6.2,
          },
          {
            fplCode: 1000,
            playerId: 1,
            event: 37,
            xPts: 8.5,
            xGoals: 0.4,
            xAssists: 0.3,
            csProb: null,
            defconPts: 0,
            confidence: 'high',
            epNextAnchor: 8.5,
            modelXPts: 8.5,
          },
        ],
        DEF: [],
      },
    },
    isLoading: false,
  } as unknown as ReturnType<typeof queries.usePredictionsPreview>);
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
  const marketPreviewReady = options?.marketPreviewReady ?? true;
  mockQueries.useMarketPreview.mockReturnValue({
    data: marketPreviewReady
      ? {
          event: 37,
          modelRunId: 'run-1',
          ready: true,
          topCs: [makeTeam(1, 0.8, 1.2), makeTeam(2, 0.76, 1.1)],
          topXg: [makeTeam(3, 0.2, 2.0), makeTeam(4, 0.18, 1.9)],
        }
      : { event: 37, modelRunId: null, ready: false, topCs: [], topXg: [] },
    isLoading: false,
  } as unknown as ReturnType<typeof queries.useMarketPreview>);

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
    it('renders all five tabs', () => {
      renderScreen();
      expect(screen.getByRole('tab', { name: copy.predictionsTabPoints })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: copy.predictionsTabLineups })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: copy.predictionsTabXA })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: copy.predictionsTabCS })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: copy.predictionsTabTeamXG })).toBeInTheDocument();
    });

    it('defaults to Lineups tab', () => {
      renderScreen();
      expect(screen.getByRole('tab', { name: copy.predictionsTabLineups })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Points tab', () => {
    it('shows position sub-tabs with FWD first and selected by default', async () => {
      const user = userEvent.setup();
      renderScreen();
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabPoints }));
      const posTabs = screen.getAllByRole('tab', { name: /^(FWD|MID|DEF|GK)$/ });
      expect(posTabs.map((t) => t.textContent)).toEqual(['FWD', 'MID', 'DEF', 'GK']);
      expect(screen.getByRole('tab', { name: 'FWD' })).toHaveAttribute('aria-selected', 'true');
    });

    it('shows top 2 players free and a lock overlay for free user', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabPoints }));
      await user.click(screen.getByRole('tab', { name: 'MID' }));
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Saka')).toBeInTheDocument();
      expect(screen.queryByText('De Bruyne')).not.toBeInTheDocument();
      expect(screen.getByText(copy.predictedPointsUnlockLabel)).toBeInTheDocument();
    });

    it('shows all players without lock for premium user', async () => {
      const user = userEvent.setup();
      renderScreen(true);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabPoints }));
      await user.click(screen.getByRole('tab', { name: 'MID' }));
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Fernandes')).toBeInTheDocument();
      expect(screen.queryByText(copy.predictedPointsUnlockLabel)).not.toBeInTheDocument();
    });

    it('opens PremiumSheet when Points unlock CTA is clicked', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabPoints }));
      await user.click(screen.getByRole('tab', { name: 'MID' }));
      await user.click(screen.getByText(copy.predictedPointsUnlockLabel));
      expect(screen.getByText(copy.predictedPointsPremiumTitle)).toBeInTheDocument();
    });

    it('uses predictions player profile on Points tab without past gameweek stats', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabPoints }));
      await user.click(screen.getByRole('tab', { name: 'MID' }));
      await user.click(screen.getByRole('button', { name: /Salah/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/£13\.0m/)).toBeInTheDocument();
      expect(screen.queryByText(/8 pts/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Upcoming Fixtures/i)).not.toBeInTheDocument();
    });
  });

  describe('Lineups tab', () => {
    it('shows premium lock overlay for free user', () => {
      renderScreen(false);
      expect(screen.getByText(copy.predictionsLineupsUnlockLabel)).toBeInTheDocument();
    });

    it('shows team chips and pitch for premium user', () => {
      renderScreen(true);
      expect(screen.getByRole('tab', { name: 'ARS' })).toBeInTheDocument();
    });

    it('opens PremiumSheet when Lineups unlock CTA is clicked', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByText(copy.predictionsLineupsUnlockLabel));
      expect(screen.getByText(copy.predictionsLineupsPremiumTitle)).toBeInTheDocument();
    });
  });

  describe('xA tab', () => {
    it('shows FWD MID DEF position tabs without GK', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabXA }));
      const posTabs = screen.getAllByRole('tab', { name: /^(FWD|MID|DEF)$/ });
      expect(posTabs.map((t) => t.textContent)).toEqual(['FWD', 'MID', 'DEF']);
      expect(screen.queryByRole('tab', { name: 'GK' })).not.toBeInTheDocument();
    });

    it('shows top 2 assist rows and lock overlay for free user', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabXA }));
      await user.click(screen.getByRole('tab', { name: 'MID' }));
      expect(screen.getByText('Fernandes')).toBeInTheDocument();
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText(copy.predictedPointsUnlockLabel)).toBeInTheDocument();
    });
  });

  describe('CS% tab', () => {
    it('shows top 2 teams and lock overlay for free user', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabCS }));
      expect(screen.getAllByText(/\d+%/).length).toBe(2);
      expect(screen.getByText(copy.predictedPointsUnlockLabel)).toBeInTheDocument();
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

    it('shows empty message when market preview is not ready', async () => {
      const user = userEvent.setup();
      renderScreen(false, ['/predictions'], { marketPreviewReady: false });
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabCS }));
      expect(
        screen.getByText(interpolate(copy.marketEmptyState, { n: 37 })),
      ).toBeInTheDocument();
    });
  });

  describe('Team xG tab', () => {
    it('shows top 2 teams and lock overlay for free user', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabTeamXG }));
      expect(screen.getAllByText(/^\d+\.\d{2}$/).length).toBe(2);
      expect(screen.getByText(copy.predictedPointsUnlockLabel)).toBeInTheDocument();
    });

    it('shows empty message when market preview is not ready', async () => {
      const user = userEvent.setup();
      renderScreen(false, ['/predictions'], { marketPreviewReady: false });
      await user.click(screen.getByRole('tab', { name: copy.predictionsTabTeamXG }));
      expect(
        screen.getByText(interpolate(copy.marketEmptyState, { n: 37 })),
      ).toBeInTheDocument();
    });
  });

  describe('GW badge', () => {
    it('shows next GW in header', () => {
      renderScreen();
      expect(screen.getByText('GW 37')).toBeInTheDocument();
    });
  });
});
