import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransferScreen } from './TransferScreen';

vi.mock('@/api/queries', () => ({
  useGameweeks: () => ({
    data: { current: 5, gameweeks: [{ id: 5, name: 'Gameweek 5', finished: true }] },
    isLoading: false,
    isError: false,
  }),
  useSquad: () => ({ data: null, isLoading: false, isError: false }),
  usePlayerPool: () => ({ data: null, isLoading: false, isError: false }),
}));

function renderScreen() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TransferScreen teamId={123} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TransferScreen', () => {
  it('shows the Transfers heading', () => {
    renderScreen();
    expect(screen.getByText('Transfers')).toBeInTheDocument();
  });

  it('shows empty state when squad is not available', () => {
    renderScreen();
    expect(screen.getByText(/No squad found/i)).toBeInTheDocument();
  });
});
