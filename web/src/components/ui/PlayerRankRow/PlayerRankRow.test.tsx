import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TopPlayersPlayer } from '@/types';

import { PlayerRankRow } from './PlayerRankRow';

const player: TopPlayersPlayer = {
  id: 1,
  webName: 'Haaland',
  position: 'FWD',
  teamCode: 43,
  teamShortName: 'MCI',
  points: 20,
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
});
