import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { copy } from '@/lib/copy';

import { TransferHeader } from './TransferHeader';

const mockChipStatuses = {
  wildcard: { status: 'used' as const, usedInGw: 14 },
  freehit: { status: 'available' as const },
  bboost: { status: 'available' as const },
  '3xc': { status: 'available' as const },
};

describe('TransferHeader', () => {
  it('shows blocked message when clicking a used chip', async () => {
    vi.useFakeTimers();
    render(
      <TransferHeader
        bank={100}
        freeTransfers={1}
        cost={0}
        planChip="none"
        chipStatuses={mockChipStatuses}
        nextGw={15}
        onMenuOpen={() => {}}
        onChipToggle={() => {}}
        onHelp={() => {}}
      />
    );

    const wildcardBtn = screen.getByText(copy.transfersWildcard);
    fireEvent.click(wildcardBtn);

    // Should show the message
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Wildcard already played in GW14/)).toBeInTheDocument();

    // Should disappear after timeout
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
