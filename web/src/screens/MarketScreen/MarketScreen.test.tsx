import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';
import { copy } from '@/lib/copy';

import { MarketScreen } from './MarketScreen';

vi.mock('@/api/queries', () => ({
  useGameweeks: vi.fn(() => ({ data: { current: 30, next: 31, gameweeks: [] } })),
  useMarket: vi.fn(() => ({
    data: {
      event: 31,
      modelRunId: 'run-1',
      ready: true,
      teams: makeTeams(20),
    },
    isLoading: false,
  })),
}));

vi.mock('@/lib/use-premium-status', () => ({
  usePremiumStatus: vi.fn(() => false),
}));

vi.mock('@/lib/premium-upsell/PremiumUpsellContext', () => ({
  useRequestPremiumUpsell: () => vi.fn(),
}));

const mockQueries = vi.mocked(queries);

import { usePremiumStatus } from '@/lib/use-premium-status';
const mockUsePremiumStatus = vi.mocked(usePremiumStatus);

function makeTeam(id: number, csProb: number, xG: number) {
  const shorts = ['ARS', 'AVL', 'BOU', 'BRE', 'BHA', 'CHE', 'CRY', 'EVE', 'FUL', 'IPS',
    'LEI', 'LIV', 'MCI', 'MUN', 'NEW', 'NFO', 'SOU', 'TOT', 'WHU', 'WOL'];
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

function makeTeams(count: number) {
  return Array.from({ length: count }, (_, i) =>
    makeTeam(i + 1, (20 - i) * 0.04, (20 - i) * 0.1),
  );
}

function renderScreen(isPremium = false) {
  mockUsePremiumStatus.mockReturnValue(isPremium);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MarketScreen />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MarketScreen', () => {
  describe('CS% tab (default)', () => {
    it('renders sorted CS% rows for premium user', () => {
      renderScreen(true);
      const rows = screen.getAllByText(/\d+%/);
      expect(rows.length).toBeGreaterThan(0);
      const firstPct = parseInt(rows[0].textContent!);
      const secondPct = parseInt(rows[1].textContent!);
      expect(firstPct).toBeGreaterThanOrEqual(secondPct);
    });

    it('shows 5 rows and locked section for free user', () => {
      renderScreen(false);
      expect(screen.getByText(copy.marketUnlockLabel)).toBeInTheDocument();
    });

    it('opens PremiumSheet when unlock CTA is clicked', async () => {
      const user = userEvent.setup();
      renderScreen(false);
      await user.click(screen.getByText(copy.marketUnlockLabel));
      expect(screen.getByText(copy.marketPremiumTitle)).toBeInTheDocument();
    });

    it('hides locked section for premium user', () => {
      renderScreen(true);
      expect(screen.queryByText(copy.marketUnlockLabel)).not.toBeInTheDocument();
    });
  });

  describe('xG tab', () => {
    it('switches to xG tab and shows decimal values', async () => {
      const user = userEvent.setup();
      renderScreen(true);
      await user.click(screen.getByRole('tab', { name: copy.marketTabXG }));
      const values = screen.getAllByText(/^\d+\.\d{2}$/);
      expect(values.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('shows empty message when ready is false', () => {
      mockQueries.useMarket.mockReturnValueOnce({
        data: { event: 31, modelRunId: null, ready: false, teams: [] },
        isLoading: false,
      } as unknown as ReturnType<typeof queries.useMarket>);
      renderScreen(false);
      expect(screen.getByText(/not yet available/i)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows skeleton while loading', () => {
      mockQueries.useMarket.mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof queries.useMarket>);
      renderScreen(false);
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    });
  });
});
