import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { FixtureInfo, SquadPlayer } from '@/types';

import type { PlayerInfo } from './PlayerCard';
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

describe('PlayerCard stats badges', () => {
  it('renders goal badge on large size when goals_scored > 0', () => {
    render(<PlayerCard player={makePlayer({ stats: { ...makePlayer().stats, goals_scored: 3 } })} size="large" />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('renders assist badge on large size when assists > 0', () => {
    render(<PlayerCard player={makePlayer({ stats: { ...makePlayer().stats, assists: 2 } })} size="large" />);
    expect(screen.getByText(/2 A/)).toBeInTheDocument();
  });

  it('does not render badges when counts are 0', () => {
    render(<PlayerCard player={makePlayer({ stats: { ...makePlayer().stats, goals_scored: 0, assists: 0 } })} size="large" />);
    expect(screen.queryByText(/⚽/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ A/)).not.toBeInTheDocument();
  });

  it('does not render badges on medium size', () => {
    render(<PlayerCard player={makePlayer({ stats: { ...makePlayer().stats, goals_scored: 3, assists: 2 } })} size="medium" />);
    expect(screen.queryByText(/⚽/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ A/)).not.toBeInTheDocument();
  });
});

const makePlayerInfo = (overrides?: Partial<PlayerInfo>): PlayerInfo => ({
  ownership: '44.5',
  currentPrice: 95,
  nextFixtures: [makeFixture({ gw: 37, opponent: 'MCI', home: false, difficulty: 5 })],
  ...overrides,
});

describe('PlayerCard info popup', () => {
  it('renders ⓘ button when playerInfo is provided', () => {
    render(<PlayerCard player={makePlayer()} playerInfo={makePlayerInfo()} />);
    expect(screen.getByRole('button', { name: /player info/i })).toBeInTheDocument();
  });

  it('does not render ⓘ button without playerInfo', () => {
    render(<PlayerCard player={makePlayer()} />);
    expect(screen.queryByRole('button', { name: /player info/i })).not.toBeInTheDocument();
  });

  it('opens popup on ⓘ click', async () => {
    const user = userEvent.setup();
    render(<PlayerCard player={makePlayer()} playerInfo={makePlayerInfo()} />);
    await user.click(screen.getByRole('button', { name: /player info/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Upcoming Fixtures/i)).toBeInTheDocument();
  });

  it('shows fixture rows in popup', async () => {
    const user = userEvent.setup();
    render(<PlayerCard player={makePlayer()} playerInfo={makePlayerInfo()} />);
    await user.click(screen.getByRole('button', { name: /player info/i }));
    expect(screen.getByText(/GW37/)).toBeInTheDocument();
    expect(screen.getAllByText(/MCI/).length).toBeGreaterThan(0);
  });

  it('closes popup on close button click', async () => {
    const user = userEvent.setup();
    render(<PlayerCard player={makePlayer()} playerInfo={makePlayerInfo()} />);
    await user.click(screen.getByRole('button', { name: /player info/i }));
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes popup on Escape key', async () => {
    const user = userEvent.setup();
    render(<PlayerCard player={makePlayer()} playerInfo={makePlayerInfo()} />);
    await user.click(screen.getByRole('button', { name: /player info/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
