import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';

vi.mock('@/api/queries', () => ({
  useGameweeks: vi.fn(() => ({ data: { current: 30, next: 31, gameweeks: [] } })),
  usePriceChanges: vi.fn(),
  usePricePredictions: vi.fn(),
  usePlayerProfile: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
}));

vi.mock('@/lib/use-subscription-tier', () => ({
  useSubscriptionTier: () => 'free',
}));

vi.mock('@/lib/use-follow-player', () => ({
  useFollowPlayer: () => ({
    follow: vi.fn(),
    unfollow: vi.fn(),
    isFollowing: () => false,
  }),
}));

const mockQueries = vi.mocked(queries);

const emptyChanges = { period: 'gw' as const, direction: 'rise' as const, players: [] };
const emptyPredictions = { direction: 'rise' as const, players: [] };

import { PriceChangesScreen } from './PriceChangesScreen';

function renderPriceScreen() {
  mockQueries.usePriceChanges.mockReturnValue({
    data: emptyChanges,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.usePriceChanges>);
  mockQueries.usePricePredictions.mockReturnValue({
    data: emptyPredictions,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.usePricePredictions>);

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PriceChangesScreen />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PriceChangesScreen', () => {
  it('renders actual tab and empty gw message', () => {
    renderPriceScreen();
    expect(screen.getByRole('tab', { name: /Actual/i })).toBeInTheDocument();
    expect(screen.getByText(/No price changes yet/i)).toBeInTheDocument();
  });

  it('shows premium overlay on my squad for free users', async () => {
    const user = userEvent.setup();
    renderPriceScreen();
    await user.click(screen.getByRole('button', { name: /My squad/i }));
    expect(screen.getByText(/Unlock my squad view/i)).toBeInTheDocument();
  });

  it('defaults period to Season when current gameweek is 38', async () => {
    mockQueries.useGameweeks.mockReturnValue({
      data: { current: 38, next: 38, gameweeks: [] },
    } as unknown as ReturnType<typeof queries.useGameweeks>);
    renderPriceScreen();
    await waitFor(() => {
      expect(mockQueries.usePriceChanges).toHaveBeenLastCalledWith(
        'season',
        expect.any(String),
        expect.any(String),
        expect.any(Boolean),
        expect.any(Boolean)
      );
    });
  });

  it('keeps This GW as default when current gameweek is below 38', () => {
    mockQueries.useGameweeks.mockReturnValue({
      data: { current: 37, next: 38, gameweeks: [] },
    } as unknown as ReturnType<typeof queries.useGameweeks>);
    renderPriceScreen();
    expect(mockQueries.usePriceChanges).toHaveBeenLastCalledWith(
      'gw',
      expect.any(String),
      expect.any(String),
      expect.any(Boolean),
      expect.any(Boolean)
    );
  });

  it('switches to tonight tab', async () => {
    const user = userEvent.setup();
    renderPriceScreen();
    await user.click(screen.getByRole('tab', { name: /Tonight/i }));
    expect(screen.getByText(/No predictions for this filter/i)).toBeInTheDocument();
  });
});
