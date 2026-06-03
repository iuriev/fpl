import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';

vi.mock('@/api/queries', () => ({
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
  } as ReturnType<typeof queries.usePriceChanges>);
  mockQueries.usePricePredictions.mockReturnValue({
    data: emptyPredictions,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof queries.usePricePredictions>);

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
    expect(screen.getByText(/No price changes this gameweek/i)).toBeInTheDocument();
  });

  it('shows premium overlay on my squad for free users', async () => {
    const user = userEvent.setup();
    renderPriceScreen();
    await user.click(screen.getByRole('button', { name: /My squad/i }));
    expect(screen.getByText(/Unlock my squad view/i)).toBeInTheDocument();
  });

  it('switches to tonight tab', async () => {
    const user = userEvent.setup();
    renderPriceScreen();
    await user.click(screen.getByRole('tab', { name: /Tonight/i }));
    expect(screen.getByText(/No players currently projected/i)).toBeInTheDocument();
  });
});
