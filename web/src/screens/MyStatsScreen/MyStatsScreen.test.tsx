import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';

import { MyStatsScreen } from './MyStatsScreen';

vi.mock('@/components/ui/TeamNavDrawer/TeamNavDrawer', () => ({
  TeamNavDrawer: () => null,
}));

vi.mock('@/api/queries', () => ({
  useLeagues: vi.fn(),
  useHistory: vi.fn(),
}));

function setupMocks() {
  vi.mocked(queries.useLeagues).mockReturnValue({
    data: { teamId: 72828, classic: [{ id: 1, name: 'Overall', rank: 100, lastRank: null }], h2h: [] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.useLeagues>);

  vi.mocked(queries.useHistory).mockReturnValue({
    data: {
      teamId: 72828,
      gameweeks: [{ gw: 2, overallRank: 1000, overallPoints: 50, gwRank: 500, gwPoints: 10, pointsOnBench: 2, transfers: 1, transferCost: 0, teamValue: 1000 }],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.useHistory>);
}

function renderScreen(path = '/stats') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MyStatsScreen teamId={72828} />
    </MemoryRouter>
  );
}

describe('MyStatsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it('renders Leagues and My GW history tabs', () => {
    renderScreen();
    expect(screen.getByRole('tab', { name: 'Leagues' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'My GW history' })).toBeInTheDocument();
  });

  it('shows Leagues tab active by default', () => {
    renderScreen();
    expect(screen.getByRole('tab', { name: 'Leagues' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'My GW history' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('Overall')).toBeInTheDocument();
  });

  it('opens history tab from URL', () => {
    renderScreen('/stats?tab=history');
    expect(screen.getByRole('tab', { name: 'My GW history' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('This Season')).toBeInTheDocument();
    expect(screen.getByText('GW2')).toBeInTheDocument();
  });

  it('switches to history tab on click', async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(screen.getByRole('tab', { name: 'My GW history' }));
    expect(screen.getByRole('tab', { name: 'My GW history' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('GW2')).toBeInTheDocument();
  });
});
