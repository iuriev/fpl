import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';
import { copy } from '@/lib/copy';
import type { PlayerProfileResponse } from '@/types';

import { PlayerProfileSheet } from './PlayerProfileSheet';

vi.mock('@/api/queries', () => ({
  usePlayerProfile: vi.fn(),
}));

const mockUsePlayerProfile = vi.mocked(queries.usePlayerProfile);

const profileWithGw: PlayerProfileResponse = {
  player: {
    id: 100,
    webName: 'Saka',
    position: 'MID',
    teamCode: 3,
    teamShortName: 'ARS',
    nowCost: 95,
    selectedByPercent: '30',
    status: 'a',
    news: '',
  },
  gw: 37,
  gwPoints: 12,
  gwStats: [
    { identifier: 'goals_scored', value: 1 },
    { identifier: 'bonus', value: 2 },
  ],
  nextFixtures: [{ gw: 38, opponent: 'MCI', home: false, difficulty: 5 }],
};

const profileMinimal: PlayerProfileResponse = {
  ...profileWithGw,
  gw: null,
  gwPoints: null,
  gwStats: [],
  nextFixtures: [],
};

function renderSheet(
  props: Partial<React.ComponentProps<typeof PlayerProfileSheet>> = {}
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PlayerProfileSheet
        playerId={100}
        open
        onClose={vi.fn()}
        onFollow={vi.fn()}
        isFollowing={false}
        {...props}
      />
    </QueryClientProvider>
  );
}

describe('PlayerProfileSheet', () => {
  it('shows GW stats when profile has gameweek data', () => {
    mockUsePlayerProfile.mockReturnValue({
      data: profileWithGw,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof queries.usePlayerProfile>);

    renderSheet();
    expect(screen.getByText(/GW37/)).toBeInTheDocument();
    expect(screen.getByText(/12 pts/)).toBeInTheDocument();
    expect(screen.getByText(/1 goal/)).toBeInTheDocument();
    expect(screen.getByText(/Upcoming Fixtures/i)).toBeInTheDocument();
  });

  it('omits GW section when no history', () => {
    mockUsePlayerProfile.mockReturnValue({
      data: profileMinimal,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof queries.usePlayerProfile>);

    renderSheet();
    expect(screen.queryByText(/GW37/)).not.toBeInTheDocument();
    expect(screen.getByText(/Saka/)).toBeInTheDocument();
  });

  it('calls onFollow when follow button pressed', async () => {
    const onFollow = vi.fn();
    mockUsePlayerProfile.mockReturnValue({
      data: profileWithGw,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof queries.usePlayerProfile>);

    const user = userEvent.setup();
    renderSheet({ onFollow });
    await user.click(screen.getByRole('button', { name: /follow/i }));
    expect(onFollow).toHaveBeenCalledWith(100);
  });

  it('shows lineup injury warning when lineupAlerts provided', () => {
    mockUsePlayerProfile.mockReturnValue({
      data: { ...profileWithGw, player: { ...profileWithGw.player, status: 'd', news: '' } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof queries.usePlayerProfile>);

    renderSheet({ lineupAlerts: { injuryWarning: true, chanceOfPlaying: 50 } });
    expect(screen.getByText(/Injury doubt/i)).toBeInTheDocument();
    expect(screen.getByText(/50% chance of playing/i)).toBeInTheDocument();
  });

  it('shows active follow state', () => {
    mockUsePlayerProfile.mockReturnValue({
      data: profileWithGw,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof queries.usePlayerProfile>);

    renderSheet({ isFollowing: true });
    expect(screen.getByRole('button', { name: /unfollow/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('shows bench risk in summary variant before profile loads', () => {
    mockUsePlayerProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof queries.usePlayerProfile>);

    renderSheet({
      profileVariant: 'summary',
      lineupAlerts: { benchRisk: true },
    });
    expect(screen.getByText(copy.predictedLineupsBenchRisk)).toBeInTheDocument();
  });

  it('applies predictions context without past gameweek or prediction blurb', () => {
    mockUsePlayerProfile.mockReturnValue({
      data: profileWithGw,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof queries.usePlayerProfile>);

    renderSheet({
      predictionsContext: true,
      prediction: {
        fplCode: 1000,
        playerId: 100,
        event: 37,
        xPts: 8.5,
        xGoals: 0.4,
        xAssists: 0.2,
        csProb: null,
        defconPts: 0,
        confidence: 'low',
        epNextAnchor: 8.5,
        modelXPts: 8.2,
      },
    });
    expect(screen.queryByText(/12 pts/)).not.toBeInTheDocument();
    expect(screen.queryByText(/xPts expected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Upcoming Fixtures/i)).not.toBeInTheDocument();
  });

  it('hides past gameweek points and stat chips in summary variant', () => {
    mockUsePlayerProfile.mockReturnValue({
      data: profileWithGw,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof queries.usePlayerProfile>);

    renderSheet({ profileVariant: 'summary', hidePastGameweek: true });
    expect(screen.queryByText(/GW37/)).not.toBeInTheDocument();
    expect(screen.queryByText(/12 pts/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1 goal/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Upcoming Fixtures/i)).not.toBeInTheDocument();
    expect(screen.getByText(/£9\.5m/)).toBeInTheDocument();
  });
});
