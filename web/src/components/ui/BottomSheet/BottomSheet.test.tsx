import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BottomSheet } from './BottomSheet';

function renderSheet(open = true, onClose = vi.fn()) {
  return render(
    <BottomSheet open={open} onClose={onClose} title="Select team">
      <button>Arsenal</button>
    </BottomSheet>
  );
}

describe('BottomSheet', () => {
  it('renders children', () => {
    renderSheet();
    expect(screen.getByText('Arsenal')).toBeInTheDocument();
  });

  it('has role dialog with aria-label when open', () => {
    renderSheet(true);
    expect(screen.getByRole('dialog', { name: 'Select team' })).toBeInTheDocument();
  });

  it('does not have role dialog when closed', () => {
    renderSheet(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderSheet(true, onClose);
    await user.click(screen.getByTestId('bottom-sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed while open', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderSheet(true, onClose);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when closed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderSheet(false, onClose);
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose after swipe down past threshold', () => {
    const onClose = vi.fn();
    renderSheet(true, onClose);
    const panel = screen.getByRole('dialog');
    fireEvent.touchStart(panel, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(panel, { touches: [{ clientY: 200 }] });
    fireEvent.touchEnd(panel, { changedTouches: [{ clientY: 200 }] });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose after short swipe below threshold', () => {
    const onClose = vi.fn();
    renderSheet(true, onClose);
    const panel = screen.getByRole('dialog');
    fireEvent.touchStart(panel, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(panel, { touches: [{ clientY: 130 }] });
    fireEvent.touchEnd(panel, { changedTouches: [{ clientY: 130 }] });
    expect(onClose).not.toHaveBeenCalled();
  });
});
