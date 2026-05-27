import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { FixtureInfo, SquadPlayer } from '@/types';

import { PlayerCard } from './PlayerCard';

const makePlayer = (overrides?: Partial<SquadPlayer>): SquadPlayer => ({
  id: 1,
  name: 'Saka',
  position: 'MID',
  club: 'ARS',
  teamCode: 3,
  teamId: 1,
  nowCost: 95,
  points: 10,
  isCaptain: false,
  isViceCaptain: false,
  status: 'a',
  chanceOfPlaying: null,
  news: '',
  stats: {
    minutes: 90,
    goals_scored: 0,
    assists: 1,
    clean_sheets: 0,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 0,
    red_cards: 0,
    saves: 0,
    bonus: 0,
    total_points: 6,
  },
  ...overrides,
});

const makeFixture = (overrides?: Partial<FixtureInfo>): FixtureInfo => ({
  gw: 38,
  opponent: 'LIV',
  home: true,
  difficulty: 4,
  ...overrides,
});

describe('PlayerCard', () => {
  it('renders team abbreviation and opponent when nextFixture is provided', () => {
    render(<PlayerCard player={makePlayer()} nextFixture={makeFixture()} />);
    expect(screen.getByText('ARS')).toBeInTheDocument();
    expect(screen.getByText(/LIV/)).toBeInTheDocument();
  });

  it('does not render fixture row when nextFixture is absent', () => {
    render(<PlayerCard player={makePlayer()} />);
    expect(screen.queryByText('ARS')).not.toBeInTheDocument();
  });

  it('renders a different club abbreviation when club differs', () => {
    render(
      <PlayerCard
        player={makePlayer({ club: 'MCI' })}
        nextFixture={makeFixture({ opponent: 'CHE' })}
      />
    );
    expect(screen.getByText('MCI')).toBeInTheDocument();
    expect(screen.getByText(/CHE/)).toBeInTheDocument();
  });
});

describe('PlayerCard with hideClub', () => {
  it('does not render club abbreviation when hideClub is true', () => {
    render(<PlayerCard player={makePlayer()} nextFixture={makeFixture()} hideClub />);
    expect(screen.queryByText('ARS')).not.toBeInTheDocument();
    expect(screen.getByText(/LIV/)).toBeInTheDocument();
  });
});
