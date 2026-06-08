import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Drawer } from './Drawer';

function renderDrawer(
  open = true,
  onClose = vi.fn(),
  header?: React.ReactNode,
  headerActions?: React.ReactNode
) {
  return render(
    <Drawer
      open={open}
      onClose={onClose}
      header={header}
      headerActions={headerActions}
      ariaLabel="Team information"
    >
      <p>panel content</p>
    </Drawer>
  );
}

describe('Drawer', () => {
  it('renders children', () => {
    renderDrawer();
    expect(screen.getByText('panel content')).toBeInTheDocument();
  });

  it('has role dialog with aria-label when open', () => {
    renderDrawer(true);
    expect(screen.getByRole('dialog', { name: 'Team information' })).toBeInTheDocument();
  });

  it('does not have role dialog when closed', () => {
    renderDrawer(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders header content when provided', () => {
    renderDrawer(true, vi.fn(), <span>Header slot</span>);
    expect(screen.getByText('Header slot')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDrawer(true, onClose);
    await user.click(screen.getByTestId('drawer-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed while open', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDrawer(true, onClose);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when closed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDrawer(false, onClose);
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders header actions when provided', () => {
    renderDrawer(true, vi.fn(), undefined, <button type="button">Settings</button>);
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('calls onClose on close button click', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDrawer(true, onClose);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose after swipe left past threshold (> 80px)', () => {
    const onClose = vi.fn();
    renderDrawer(true, onClose);
    const panel = screen.getByRole('dialog');
    fireEvent.touchStart(panel, { touches: [{ clientX: 100 }] });
    fireEvent.touchMove(panel, { touches: [{ clientX: 0 }] });
    fireEvent.touchEnd(panel, { changedTouches: [{ clientX: 0 }] });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose after short swipe below threshold (< 80px)', () => {
    const onClose = vi.fn();
    renderDrawer(true, onClose);
    const panel = screen.getByRole('dialog');
    fireEvent.touchStart(panel, { touches: [{ clientX: 100 }] });
    fireEvent.touchMove(panel, { touches: [{ clientX: 70 }] });
    fireEvent.touchEnd(panel, { changedTouches: [{ clientX: 70 }] });
    expect(onClose).not.toHaveBeenCalled();
  });
});
