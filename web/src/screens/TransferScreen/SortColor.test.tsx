import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PoolPlayer } from '@/types';

import { PlayerPickerSheet } from './PlayerPickerSheet';
import styles from './PlayerPickerSheet.module.css';

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

describe('PlayerPickerSheet sorting colors', () => {
  const defaultProps = {
    open: true,
    outPlayer: makePoolPlayer(1, { webName: 'Saka', position: 'MID', nowCost: 95 }),
    candidates: [makePoolPlayer(2, { webName: 'Salah', nowCost: 130, totalPoints: 150 })],
    availableBudget: 150,
    squadTeamCounts: new Map(),
    squadPositionCounts: new Map([['GK', 2], ['DEF', 5], ['MID', 5], ['FWD', 3]]),
    squadPlayerIds: new Set([1]),
    targetGw: 34,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  it('toggles color from green (desc) to red (asc) when header is clicked', async () => {
    render(<PlayerPickerSheet {...defaultProps} />);
    
    // By default PTS is not sorted (OWN% is default sortKey)
    const ptsHeader = screen.getByRole('columnheader', { name: /^Pts/ });
    
    // 1st click: sort PTS desc (green)
    fireEvent.click(ptsHeader);
    expect(ptsHeader).toHaveClass(styles.label_desc);
    expect(ptsHeader).not.toHaveClass(styles.label_asc);
    
    // 2nd click: sort PTS asc (red)
    fireEvent.click(ptsHeader);
    expect(ptsHeader).toHaveClass(styles.label_asc);
    expect(ptsHeader).not.toHaveClass(styles.label_desc);
    
    // 3rd click: back to desc (green)
    fireEvent.click(ptsHeader);
    expect(ptsHeader).toHaveClass(styles.label_desc);
    expect(ptsHeader).not.toHaveClass(styles.label_asc);
  });
});
