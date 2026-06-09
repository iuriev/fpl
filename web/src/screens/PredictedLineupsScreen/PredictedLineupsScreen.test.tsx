import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameweeks, usePredictedLineups } from '@/api/queries';
import { usePremiumStatus } from '@/lib/use-premium-status';
import type { PredictedLineupsResponse } from '@/types';

import { PredictedLineupsScreen } from './PredictedLineupsScreen';

vi.mock('@/api/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/queries')>();
  return {
    ...actual,
    useGameweeks: vi.fn(),
    usePredictedLineups: vi.fn(),
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

const mockLineups: PredictedLineupsResponse = {
  gameweek: 10,
  teams: [
    {
      teamId: 1,
      teamCode: 3,
      shortName: 'ARS',
      formation: { counts: { def: 4, mid: 3, fwd: 3 }, label: '4-3-3', source: 'default' },
      nextFixture: { opponentShortName: 'BOU', isHome: true, kickoffTime: null },
      players: [
        {
          id: 1,
          fplCode: 1,
          webName: 'Raya',
          position: 'GK',
          teamCode: 3,
          lane: 'C',
          pitchOrder: 0,
          xMins: 90,
          xPts: 4.5,
          benchRisk: false,
          injuryWarning: false,
          chanceOfPlaying: 100,
          status: 'a',
        },
        {
          id: 2,
          fplCode: 2,
          webName: 'White',
          position: 'DEF',
          teamCode: 3,
          lane: 'R',
          pitchOrder: 3,
          xMins: 85,
          xPts: 5.1,
          benchRisk: false,
          injuryWarning: false,
          chanceOfPlaying: 100,
          status: 'a',
        },
        {
          id: 3,
          fplCode: 3,
          webName: 'Saliba',
          position: 'DEF',
          teamCode: 3,
          lane: 'C',
          pitchOrder: 1,
          xMins: 88,
          xPts: 5.0,
          benchRisk: false,
          injuryWarning: false,
          chanceOfPlaying: 100,
          status: 'a',
        },
        {
          id: 4,
          fplCode: 4,
          webName: 'Gabriel',
          position: 'DEF',
          teamCode: 3,
          lane: 'C',
          pitchOrder: 2,
          xMins: 87,
          xPts: 4.8,
          benchRisk: false,
          injuryWarning: false,
          chanceOfPlaying: 100,
          status: 'a',
        },
        {
          id: 5,
          fplCode: 5,
          webName: 'Timber',
          position: 'DEF',
          teamCode: 3,
          lane: 'L',
          pitchOrder: 0,
          xMins: 80,
          xPts: 4.2,
          benchRisk: false,
          injuryWarning: false,
          chanceOfPlaying: 100,
          status: 'a',
        },
        {
          id: 6,
          fplCode: 6,
          webName: 'Ødegaard',
          position: 'MID',
          teamCode: 3,
          lane: 'C',
          pitchOrder: 1,
          xMins: 82,
          xPts: 6.0,
          benchRisk: false,
          injuryWarning: false,
          chanceOfPlaying: 100,
          status: 'a',
        },
        {
          id: 7,
          fplCode: 7,
          webName: 'Rice',
          position: 'MID',
          teamCode: 3,
          lane: 'C',
          pitchOrder: 0,
          xMins: 90,
          xPts: 5.5,
          benchRisk: false,
          injuryWarning: false,
          chanceOfPlaying: 100,
          status: 'a',
        },
        {
          id: 8,
          fplCode: 8,
          webName: 'Saka',
          position: 'MID',
          teamCode: 3,
          lane: 'R',
          pitchOrder: 2,
          xMins: 88,
          xPts: 7.0,
          benchRisk: false,
          injuryWarning: false,
          chanceOfPlaying: 100,
          status: 'a',
        },
        {
          id: 9,
          fplCode: 9,
          webName: 'Havertz',
          position: 'FWD',
          teamCode: 3,
          lane: 'C',
          pitchOrder: 0,
          xMins: 75,
          xPts: 5.2,
          benchRisk: true,
          injuryWarning: true,
          chanceOfPlaying: 50,
          status: 'd',
        },
        {
          id: 10,
          fplCode: 10,
          webName: 'Martinelli',
          position: 'FWD',
          teamCode: 3,
          lane: 'L',
          pitchOrder: 0,
          xMins: 70,
          xPts: 4.9,
          benchRisk: false,
          injuryWarning: false,
          chanceOfPlaying: 100,
          status: 'a',
        },
        {
          id: 11,
          fplCode: 11,
          webName: 'Jesus',
          position: 'FWD',
          teamCode: 3,
          lane: 'R',
          pitchOrder: 1,
          xMins: 60,
          xPts: 4.0,
          benchRisk: true,
          injuryWarning: false,
          chanceOfPlaying: 75,
          status: 'a',
        },
      ],
    },
  ],
};

function renderScreen(isPremium: boolean) {
  vi.mocked(usePremiumStatus).mockReturnValue(isPremium);
  vi.mocked(useGameweeks).mockReturnValue({
    data: {
      current: 9,
      next: 10,
      gameweeks: [
        { id: 9, name: 'Gameweek 9', finished: false },
        { id: 10, name: 'Gameweek 10', finished: false },
      ],
    },
    isLoading: false,
    isError: false,
  } as never);
  vi.mocked(usePredictedLineups).mockReturnValue({
    data: isPremium ? mockLineups : undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as never);

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PredictedLineupsScreen />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PredictedLineupsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows premium overlay for free users', () => {
    renderScreen(false);
    expect(screen.getByText(/Unlock projected lineups/i)).toBeInTheDocument();
    expect(usePredictedLineups).toHaveBeenCalledWith(10, false);
  });

  it('shows formation and lineup for premium users', () => {
    renderScreen(true);
    expect(screen.getByText(/Formation: 4-3-3/)).toBeInTheDocument();
    expect(screen.getByText('Saka')).toBeInTheDocument();
  });

  it('places right-lane defender last in pitch row order', () => {
    renderScreen(true);
    const white = screen.getByText('White');
    const row = white.closest('[class*="playerRow"]');
    expect(row).toBeTruthy();
    const cards = [...row!.querySelectorAll('[class*="pitchCardBtn"]')];
    const timberIdx = cards.findIndex((el) => el.textContent?.includes('Timber'));
    const whiteIdx = cards.findIndex((el) => el.textContent?.includes('White'));
    expect(timberIdx).toBeGreaterThanOrEqual(0);
    expect(whiteIdx).toBeGreaterThanOrEqual(0);
    expect(timberIdx).toBeLessThan(whiteIdx);
  });

  it('highlights bench risk in table view', async () => {
    const user = userEvent.setup();
    renderScreen(true);
    await user.click(screen.getByRole('tab', { name: 'Table' }));
    expect(screen.getAllByText(/Rotation risk/i).length).toBeGreaterThan(0);
  });

  it('opens gameweek picker bottom sheet from header', async () => {
    const user = userEvent.setup();
    renderScreen(true);
    await user.click(screen.getByRole('button', { name: /GW 10/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GW 9' })).toBeInTheDocument();
  });

  it('refetches lineups when a different gameweek is selected', async () => {
    const user = userEvent.setup();
    renderScreen(true);
    await user.click(screen.getByRole('button', { name: /GW 10/ }));
    await user.click(screen.getByRole('button', { name: 'GW 9' }));
    expect(usePredictedLineups).toHaveBeenLastCalledWith(9, true);
  });
});
