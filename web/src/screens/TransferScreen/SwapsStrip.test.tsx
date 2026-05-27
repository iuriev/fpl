import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { TransferSwap } from '@/types';

import { SwapsStrip } from './SwapsStrip';

const makeSwap = (outId: number, inId: number): TransferSwap => ({ outId, inId });

const makeNameMap = (entries: [number, string][]): Map<number, string> => new Map(entries);

describe('SwapsStrip', () => {
  it('shows empty state when no swaps', () => {
    render(
      <SwapsStrip
        swaps={[]}
        nameMap={makeNameMap([])}
        costMap={new Map()}
        freeTransfers={1}
        onUndo={vi.fn()}
      />
    );
    expect(screen.getByText('Tap a player to start planning')).toBeInTheDocument();
  });

  it('renders a swap row with player names and cost delta', () => {
    render(
      <SwapsStrip
        swaps={[makeSwap(1, 2)]}
        nameMap={makeNameMap([
          [1, 'Saka'],
          [2, 'Salah'],
        ])}
        costMap={
          new Map([
            [1, 95],
            [2, 135],
          ])
        }
        freeTransfers={1}
        onUndo={vi.fn()}
      />
    );
    expect(screen.getByText('Saka')).toBeInTheDocument();
    expect(screen.getByText('Salah')).toBeInTheDocument();
    expect(screen.getByText('↓ £4.0m')).toBeInTheDocument();
  });

  it('calls onUndo with the swap outId when undo button clicked', async () => {
    const onUndo = vi.fn();
    const user = userEvent.setup();
    render(
      <SwapsStrip
        swaps={[makeSwap(1, 2)]}
        nameMap={makeNameMap([
          [1, 'Saka'],
          [2, 'Salah'],
        ])}
        costMap={
          new Map([
            [1, 95],
            [2, 135],
          ])
        }
        freeTransfers={1}
        onUndo={onUndo}
      />
    );
    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(onUndo).toHaveBeenCalledWith(1);
  });

  it('shows N of M free used label', () => {
    render(
      <SwapsStrip
        swaps={[makeSwap(1, 2), makeSwap(3, 4)]}
        nameMap={makeNameMap([
          [1, 'A'],
          [2, 'B'],
          [3, 'C'],
          [4, 'D'],
        ])}
        costMap={
          new Map([
            [1, 80],
            [2, 80],
            [3, 90],
            [4, 90],
          ])
        }
        freeTransfers={1}
        onUndo={vi.fn()}
      />
    );
    expect(screen.getByText(/2 of 1 free used/i)).toBeInTheDocument();
  });
});
