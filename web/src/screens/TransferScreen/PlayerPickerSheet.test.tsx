import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { copy } from '@/lib/copy';
import type { PlayerPosition, PoolPlayer } from '@/types';

import { PlayerPickerSheet } from './PlayerPickerSheet';

const makePoolPlayer = (id: number, overrides?: Partial<PoolPlayer>): PoolPlayer => ({
  id,
  webName: `Player${id}`,
  firstName: 'A',
  lastName: 'B',
  team: 1,
  teamCode: 3,
  teamShortName: 'ARS',
  position: 'MID',
  nowCost: 80,
  totalPoints: 100,
  eventPoints: 10,
  status: 'a',
  chanceOfPlaying: null,
  news: '',
  selectedByPercent: '10.0',
  expectedPoints: '4.5',
  form: '5.0',
  nextFixtures: [],
  ...overrides,
});

describe('PlayerPickerSheet', () => {
  const defaultProps = {
    open: true,
    outPlayer: makePoolPlayer(1, { webName: 'Saka', position: 'MID', nowCost: 95 }),
    candidates: [makePoolPlayer(2, { webName: 'Salah', nowCost: 130 })],
    availableBudget: 150,
    squadTeamCounts: new Map<number, number>([[1, 1]]),
    squadPositionCounts: new Map<PlayerPosition, number>([
      ['GK', 2],
      ['DEF', 4],
      ['MID', 4],
      ['FWD', 3],
    ]),
    squadPlayerIds: new Set([1]),
    targetGw: 34,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders sheet title with player name', () => {
    render(<PlayerPickerSheet {...defaultProps} />);
    expect(screen.getByText(/Replace Saka/i)).toBeInTheDocument();
  });

  it('shows selling price in subtitle', () => {
    render(<PlayerPickerSheet {...defaultProps} />);
    expect(screen.getByText(/£9\.5m/)).toBeInTheDocument();
  });

  it('shows candidate player', () => {
    render(<PlayerPickerSheet {...defaultProps} />);
    expect(screen.getByText('Salah')).toBeInTheDocument();
  });

  it('calls onSelect when a candidate is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<PlayerPickerSheet {...defaultProps} onSelect={onSelect} />);
    await user.click(screen.getByText('Salah'));
    expect(onSelect).toHaveBeenCalledWith(defaultProps.candidates[0]);
  });

  it('filters candidates by search query', async () => {
    const user = userEvent.setup();
    const candidates = [
      makePoolPlayer(2, { webName: 'Salah' }),
      makePoolPlayer(3, { webName: 'Fernandes' }),
    ];
    render(<PlayerPickerSheet {...defaultProps} candidates={candidates} />);
    await user.type(screen.getByPlaceholderText(/search/i), 'sal');
    expect(screen.getByText('Salah')).toBeInTheDocument();
    expect(screen.queryByText('Fernandes')).not.toBeInTheDocument();
  });

  it('dims candidates over budget (opacity and non-interactive)', () => {
    render(
      <PlayerPickerSheet
        {...defaultProps}
        candidates={[makePoolPlayer(2, { webName: 'Expensive', nowCost: 200 })]}
        availableBudget={100}
      />
    );
    const row = screen.getByText('Expensive').closest('[data-over-budget]');
    expect(row?.getAttribute('data-over-budget')).toBe('true');
  });


  it('disables candidates whose position is already at the squad maximum', async () => {
    // outPlayer is MID, squad already has 5 DEFs — picking a DEF would exceed the limit
    const fullDefCounts = new Map<PlayerPosition, number>([
      ['GK', 2],
      ['DEF', 5],
      ['MID', 4],
      ['FWD', 3],
    ]);
    render(
      <PlayerPickerSheet
        {...defaultProps}
        squadPositionCounts={fullDefCounts}
        candidates={[makePoolPlayer(2, { webName: 'DefPlayer', position: 'DEF' })]}
      />
    );
    const row = screen.getByText('DefPlayer').closest('[data-position-limit]');
    expect(row?.getAttribute('data-position-limit')).toBe('true');
  });

  it('allows same-position replacement even when position count is at max', () => {
    // outPlayer is MID, squad has 5 MIDs (including outPlayer) — transferring MID→MID is valid
    const fullMidCounts = new Map<PlayerPosition, number>([
      ['GK', 2],
      ['DEF', 5],
      ['MID', 5],
      ['FWD', 3],
    ]);
    render(
      <PlayerPickerSheet
        {...defaultProps}
        squadPositionCounts={fullMidCounts}
        candidates={[makePoolPlayer(2, { webName: 'MidPlayer', position: 'MID' })]}
      />
    );
    const row = screen.getByText('MidPlayer').closest('li');
    expect(row?.getAttribute('data-position-limit')).toBeNull();
  });

  it('changes sort when a header is clicked', async () => {
    const user = userEvent.setup();
    const candidates = [
      makePoolPlayer(2, { webName: 'PointsPlayer', totalPoints: 200, selectedByPercent: '5.0' }),
      makePoolPlayer(3, {
        webName: 'OwnershipPlayer',
        totalPoints: 100,
        selectedByPercent: '50.0',
      }),
    ];
    render(<PlayerPickerSheet {...defaultProps} candidates={candidates} />);

    // Default sort is OWN% (OwnershipPlayer has 50.0, PointsPlayer has 5.0)
    let rows = screen.getAllByRole('button').filter((r) => r.className.includes('row'));
    expect(rows[0]).toHaveTextContent('OwnershipPlayer');

    // Click Pts header
    await user.click(screen.getByRole('columnheader', { name: new RegExp(`^${copy.transfersColPts}`) }));
    rows = screen.getAllByRole('button').filter((r) => r.className.includes('row'));
    expect(rows[0]).toHaveTextContent('PointsPlayer');
  });

  it('changes sort to webName when Player header is clicked', async () => {
    const user = userEvent.setup();
    const candidates = [
      makePoolPlayer(2, { webName: 'B-Player' }),
      makePoolPlayer(3, { webName: 'A-Player' }),
    ];
    render(<PlayerPickerSheet {...defaultProps} candidates={candidates} />);

    // Click Player header
    await user.click(screen.getByRole('columnheader', { name: new RegExp(`^${copy.transfersColPlayer}`) }));
    const rows = screen.getAllByRole('button').filter((r) => r.className.includes('row'));
    expect(rows[0]).toHaveTextContent('A-Player');
    expect(rows[1]).toHaveTextContent('B-Player');
  });

  it('toggles sort direction when the same header is clicked', async () => {
    const user = userEvent.setup();
    const candidates = [
      makePoolPlayer(2, { webName: 'LowPoints', totalPoints: 10 }),
      makePoolPlayer(3, { webName: 'HighPoints', totalPoints: 100 }),
    ];
    render(<PlayerPickerSheet {...defaultProps} candidates={candidates} />);

    // Click Pts header (first click: desc)
    await user.click(screen.getByRole('columnheader', { name: new RegExp(`^${copy.transfersColPts}`) }));
    let rows = screen.getAllByRole('button').filter((r) => r.className.includes('row'));
    expect(rows[0]).toHaveTextContent('HighPoints');
    expect(screen.getByRole('columnheader', { name: new RegExp(`^${copy.transfersColPts}`) }).className).toMatch(
      /label_(desc|asc)(_\w+)?$/
    );

    // Click Pts header again (second click: asc)
    await user.click(screen.getByRole('columnheader', { name: new RegExp(`^${copy.transfersColPts}`) }));
    rows = screen.getAllByRole('button').filter((r) => r.className.includes('row'));
    expect(rows[0]).toHaveTextContent('LowPoints');
    expect(screen.getByRole('columnheader', { name: new RegExp(`^${copy.transfersColPts}`) }).className).toMatch(
      /label_asc(_\w+)?$/
    );
  });

  it('displays GW range in fixture header', () => {
    render(<PlayerPickerSheet {...defaultProps} targetGw={36} />);
    expect(screen.getByText('GW36-38')).toBeInTheDocument();
  });
});
