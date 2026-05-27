import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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
    squadPositionCounts: new Map<PlayerPosition, number>([['GK', 2], ['DEF', 4], ['MID', 4], ['FWD', 3]]),
    squadPlayerIds: new Set([1]),
    isOutfield: true,
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
      />,
    );
    const row = screen.getByText('Expensive').closest('[data-over-budget]');
    expect(row?.getAttribute('data-over-budget')).toBe('true');
  });

  it('shows position tabs when isOutfield is true', () => {
    render(<PlayerPickerSheet {...defaultProps} isOutfield={true} />);
    expect(screen.getByText('ALL')).toBeInTheDocument();
    expect(screen.getByText('DEF')).toBeInTheDocument();
    expect(screen.getByText('MID')).toBeInTheDocument();
    expect(screen.getByText('FWD')).toBeInTheDocument();
  });

  it('hides position tabs when isOutfield is false', () => {
    render(<PlayerPickerSheet {...defaultProps} isOutfield={false} />);
    expect(screen.queryByText('ALL')).not.toBeInTheDocument();
    expect(screen.queryByText('DEF')).not.toBeInTheDocument();
  });

  it('shows Sort button', () => {
    render(<PlayerPickerSheet {...defaultProps} />);
    expect(screen.getByText('Sort')).toBeInTheDocument();
  });

  it('filters outfield candidates by position tab', async () => {
    const user = userEvent.setup();
    const candidates = [
      makePoolPlayer(2, { webName: 'DefPlayer', position: 'DEF' }),
      makePoolPlayer(3, { webName: 'MidPlayer', position: 'MID' }),
    ];
    render(<PlayerPickerSheet {...defaultProps} candidates={candidates} isOutfield={true} />);
    await user.click(screen.getByText('DEF'));
    expect(screen.getByText('DefPlayer')).toBeInTheDocument();
    expect(screen.queryByText('MidPlayer')).not.toBeInTheDocument();
  });

  it('shows all candidates when ALL tab is active', async () => {
    const user = userEvent.setup();
    const candidates = [
      makePoolPlayer(2, { webName: 'DefPlayer', position: 'DEF' }),
      makePoolPlayer(3, { webName: 'MidPlayer', position: 'MID' }),
    ];
    render(<PlayerPickerSheet {...defaultProps} candidates={candidates} isOutfield={true} />);
    await user.click(screen.getByText('DEF'));
    await user.click(screen.getByText('ALL'));
    expect(screen.getByText('DefPlayer')).toBeInTheDocument();
    expect(screen.getByText('MidPlayer')).toBeInTheDocument();
  });

  it('disables candidates whose position is already at the squad maximum', async () => {
    const user = userEvent.setup();
    // outPlayer is MID, squad already has 5 DEFs — picking a DEF would exceed the limit
    const fullDefCounts = new Map<PlayerPosition, number>([['GK', 2], ['DEF', 5], ['MID', 4], ['FWD', 3]]);
    render(
      <PlayerPickerSheet
        {...defaultProps}
        squadPositionCounts={fullDefCounts}
        candidates={[makePoolPlayer(2, { webName: 'DefPlayer', position: 'DEF' })]}
      />,
    );
    await user.click(screen.getByText('ALL'));
    const row = screen.getByText('DefPlayer').closest('[data-position-limit]');
    expect(row?.getAttribute('data-position-limit')).toBe('true');
  });

  it('allows same-position replacement even when position count is at max', () => {
    // outPlayer is MID, squad has 5 MIDs (including outPlayer) — transferring MID→MID is valid
    const fullMidCounts = new Map<PlayerPosition, number>([['GK', 2], ['DEF', 5], ['MID', 5], ['FWD', 3]]);
    render(
      <PlayerPickerSheet
        {...defaultProps}
        squadPositionCounts={fullMidCounts}
        candidates={[makePoolPlayer(2, { webName: 'MidPlayer', position: 'MID' })]}
      />,
    );
    const row = screen.getByText('MidPlayer').closest('li');
    expect(row?.getAttribute('data-position-limit')).toBeNull();
  });
});
