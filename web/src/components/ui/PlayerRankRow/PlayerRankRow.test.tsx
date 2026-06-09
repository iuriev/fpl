import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TopPlayersPlayer } from '@/types';

import { PlayerRankRow } from './PlayerRankRow';

const player: TopPlayersPlayer = {
  id: 1,
  fplCode: 1,
  webName: 'Haaland',
  position: 'FWD',
  teamCode: 43,
  teamShortName: 'MCI',
  points: 20,
  selectedByPercent: '66.7',
};

describe('PlayerRankRow', () => {
  it('renders the rank number', () => {
    render(<PlayerRankRow rank={1} player={player} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders the player name', () => {
    render(<PlayerRankRow rank={1} player={player} />);
    expect(screen.getByText('Haaland')).toBeInTheDocument();
  });

  it('renders the position badge', () => {
    render(<PlayerRankRow rank={1} player={player} />);
    expect(screen.getByText('FWD')).toBeInTheDocument();
  });

  it('renders the club short name', () => {
    render(<PlayerRankRow rank={1} player={player} />);
    expect(screen.getByText('MCI')).toBeInTheDocument();
  });

  it('renders the points', () => {
    render(<PlayerRankRow rank={1} player={player} />);
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('renders rank 7 correctly', () => {
    render(<PlayerRankRow rank={7} player={player} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders ownership percentage', () => {
    render(<PlayerRankRow rank={1} player={player} />);
    expect(screen.getByText('66.7% ownership')).toBeInTheDocument();
  });

  it('does not render ownership when selectedByPercent is empty string', () => {
    render(<PlayerRankRow rank={1} player={{ ...player, selectedByPercent: '' }} />);
    expect(screen.queryByText(/ownership/)).not.toBeInTheDocument();
  });

  it('renders stat chips when statBreakdown is provided', () => {
    const withBreakdown: TopPlayersPlayer = {
      ...player,
      statBreakdown: [
        { identifier: 'goals_scored', value: 2, points: 12 },
        { identifier: 'assists', value: 1, points: 3 },
        { identifier: 'bonus', value: 3, points: 3 },
      ],
    };
    render(<PlayerRankRow rank={1} player={withBreakdown} />);
    expect(screen.getByText('2 goals +12')).toBeInTheDocument();
    expect(screen.getByText('1 assist +3')).toBeInTheDocument();
    expect(screen.getByText('3 bonus')).toBeInTheDocument();
  });

  it('does not render stat chips when statBreakdown is absent', () => {
    render(<PlayerRankRow rank={1} player={player} />);
    expect(screen.queryByText(/goal|assist|bonus|clean sheet/i)).not.toBeInTheDocument();
  });

  it('excludes hidden stats (goals_conceded, bps) but shows minutes', () => {
    const withHidden: TopPlayersPlayer = {
      ...player,
      statBreakdown: [
        { identifier: 'minutes', value: 90, points: 2 },
        { identifier: 'goals_conceded', value: 1, points: -1 },
        { identifier: 'bps', value: 42, points: 0 },
        { identifier: 'goals_scored', value: 1, points: 6 },
      ],
    };
    render(<PlayerRankRow rank={1} player={withHidden} />);
    expect(screen.getByText('1 goal +6')).toBeInTheDocument();
    expect(screen.getByText('Played 90 mins +2')).toBeInTheDocument();
    expect(screen.queryByText(/goals conceded|bps/i)).not.toBeInTheDocument();
  });

  it('pluralises stat labels correctly', () => {
    const withPlural: TopPlayersPlayer = {
      ...player,
      statBreakdown: [
        { identifier: 'goals_scored', value: 1, points: 6 },
        { identifier: 'assists', value: 2, points: 6 },
        { identifier: 'own_goals', value: 2, points: -4 },
      ],
    };
    render(<PlayerRankRow rank={1} player={withPlural} />);
    expect(screen.getByText('1 goal +6')).toBeInTheDocument();
    expect(screen.getByText('2 assists +6')).toBeInTheDocument();
    expect(screen.getByText('2 own goals -4')).toBeInTheDocument();
  });

  it('renders negative stat chips for yellow card', () => {
    const withYellow: TopPlayersPlayer = {
      ...player,
      statBreakdown: [{ identifier: 'yellow_cards', value: 1, points: -1 }],
    };
    render(<PlayerRankRow rank={1} player={withYellow} />);
    expect(screen.getByText('Yellow card -1')).toBeInTheDocument();
  });

  it('renders Clean sheet chip', () => {
    const withCS: TopPlayersPlayer = {
      ...player,
      statBreakdown: [{ identifier: 'clean_sheets', value: 1, points: 4 }],
    };
    render(<PlayerRankRow rank={1} player={withCS} />);
    expect(screen.getByText('Clean sheet +4')).toBeInTheDocument();
  });
});
