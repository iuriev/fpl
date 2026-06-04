import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';
import { copy } from '@/lib/copy';

vi.mock('@/api/queries', () => ({
  usePlayerPool: vi.fn(),
  useGameweeks: vi.fn(() => ({ data: { current: 30, next: 31, gameweeks: [] } })),
  usePredictions: vi.fn(() => ({
    data: { event: 31, modelRunId: null, ready: false, players: [] },
    isLoading: false,
    isError: false,
  })),
  usePlayerProfile: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
}));

vi.mock('@/lib/use-premium-status', () => ({
  usePremiumStatus: vi.fn(() => false),
}));

vi.mock('@/lib/premium-upsell/PremiumUpsellContext', () => ({
  useRequestPremiumUpsell: () => vi.fn(),
}));

vi.mock('@/lib/use-follow-player', () => ({
  useFollowPlayer: () => ({ following: false, toggle: vi.fn() }),
}));

const mockQueries = vi.mocked(queries);

import { usePremiumStatus } from '@/lib/use-premium-status';
const mockUsePremiumStatus = vi.mocked(usePremiumStatus);

function makePlayer(overrides: Partial<{
  id: number; code?: number; webName: string; position: string; expectedPoints: string;
  teamCode: number; teamShortName: string; nowCost: number;
}> = {}) {
  return {
    id: overrides.id ?? 1,
    code: overrides.code ?? (overrides.id ?? 1) * 1000,
    webName: overrides.webName ?? 'Player',
    firstName: 'First',
    lastName: 'Last',
    team: 1,
    teamCode: overrides.teamCode ?? 3,
    teamShortName: overrides.teamShortName ?? 'ARS',
    position: overrides.position ?? 'MID',
    nowCost: overrides.nowCost ?? 80,
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
  makePlayer({ id: 5, webName: 'Palmer', position: 'MID', expectedPoints: '6.0' }),
  makePlayer({ id: 6, webName: 'Son', position: 'MID', expectedPoints: '5.8' }),
  makePlayer({ id: 7, webName: 'Andreas', position: 'MID', expectedPoints: '5.5' }),
  makePlayer({ id: 8, webName: 'Mbeumo', position: 'MID', expectedPoints: '5.2' }),
  makePlayer({ id: 9, webName: 'Eze', position: 'MID', expectedPoints: '4.9' }),
  makePlayer({ id: 10, webName: 'Doku', position: 'MID', expectedPoints: '4.5' }),
  makePlayer({ id: 11, webName: 'Gordon', position: 'MID', expectedPoints: '4.2' }),
];
const fwdPlayers = [
  makePlayer({ id: 20, webName: 'Haaland', position: 'FWD', expectedPoints: '9.0' }),
  makePlayer({ id: 21, webName: 'Watkins', position: 'FWD', expectedPoints: '6.5' }),
];

function renderScreen(isPremium = false) {
  mockUsePremiumStatus.mockReturnValue(isPremium);
  mockQueries.usePlayerPool.mockReturnValue({
    data: { players: [...midPlayers, ...fwdPlayers] },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof queries.usePlayerPool>);

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PredictedPointsScreen />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

import { PredictedPointsScreen } from './PredictedPointsScreen';

describe('PredictedPointsScreen', () => {
  describe('free tier', () => {
    it('renders first 3 rows visible', () => {
      renderScreen(false);
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Saka')).toBeInTheDocument();
      expect(screen.getByText('De Bruyne')).toBeInTheDocument();
    });

    it('renders rows 4-10 in the locked section behind overlay', () => {
      renderScreen(false);
      const overlay = screen.getByText(/Unlock all predictions/i);
      expect(overlay).toBeInTheDocument();
      expect(screen.getByText('Fernandes')).toBeInTheDocument();
    });

    it('shows premium overlay CTA', () => {
      renderScreen(false);
      expect(screen.getByText(/Unlock all predictions/i)).toBeInTheDocument();
    });

    it('opens PremiumSheet when overlay CTA is clicked', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByText(/Unlock all predictions/i));
      expect(screen.getByText(/See all predicted points/i)).toBeInTheDocument();
    });
  });

  describe('premium tier', () => {
    it('renders all players without overlay', () => {
      renderScreen(true);
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Gordon')).toBeInTheDocument();
      expect(screen.queryByText(/Unlock all predictions/i)).not.toBeInTheDocument();
    });
  });

  describe('tab switching', () => {
    it('switches to FWD tab and shows forward players', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: 'FWD' }));
      expect(screen.getByText('Haaland')).toBeInTheDocument();
      expect(screen.queryByText('Salah')).not.toBeInTheDocument();
    });

    it('shows empty message when position has no players', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('tab', { name: 'GK' }));
      expect(screen.getByText(/No prediction data available/i)).toBeInTheDocument();
    });
  });

  describe('row tap', () => {
    it('opens PlayerProfileSheet when a visible row is tapped', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByRole('button', { name: /Salah/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('model predictions', () => {
    it('shows breakdown and disclaimer when model is ready', () => {
      mockQueries.usePredictions.mockReturnValue({
        data: {
          event: 31,
          modelRunId: 'run-1',
          ready: true,
          players: [
            {
              fplCode: 1000,
              playerId: 1,
              event: 31,
              xPts: 8.5,
              xGoals: 0.4,
              xAssists: 0.2,
              csProb: null,
              defconPts: 0.3,
              confidence: 'high' as const,
              epNextAnchor: 8.5,
              modelXPts: 8.2,
            },
          ],
        },
        isLoading: false,
        isError: false,
      } as unknown as ReturnType<typeof queries.usePredictions>);
      renderScreen(false);
      expect(screen.getByText(/xG/i)).toBeInTheDocument();
      expect(screen.getByText(copy.predictedPointsDisclaimer)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows skeleton while loading', () => {
      mockUsePremiumStatus.mockReturnValue(false);
      mockQueries.usePlayerPool.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof queries.usePlayerPool>);

      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <PredictedPointsScreen />
          </MemoryRouter>
        </QueryClientProvider>
      );
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    });
  });
});
