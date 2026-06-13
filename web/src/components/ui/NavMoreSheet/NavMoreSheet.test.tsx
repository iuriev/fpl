import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { NAV_MORE_SHEET_ID, NavMoreSheet } from './NavMoreSheet';

function renderSheet() {
  return render(
    <MemoryRouter>
      <NavMoreSheet />
    </MemoryRouter>,
  );
}

describe('NavMoreSheet', () => {
  it('renders with popover attribute and correct id', () => {
    renderSheet();
    const sheet = document.getElementById(NAV_MORE_SHEET_ID);
    expect(sheet).toBeInTheDocument();
    expect(sheet).toHaveAttribute('popover', 'auto');
  });

  it('renders all 7 sheet items', () => {
    renderSheet();
    const hidden = { hidden: true };
    expect(screen.getByRole('button', { name: /stats/i, ...hidden })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /managers wl/i, ...hidden })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /players wl/i, ...hidden })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /top players/i, ...hidden })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /prices/i, ...hidden })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chips/i, ...hidden })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fixtures/i, ...hidden })).toBeInTheDocument();
  });

  it('calls hidePopover after item click', () => {
    renderSheet();
    const sheet = document.getElementById(NAV_MORE_SHEET_ID)!;
    const hidePopover = vi.spyOn(sheet, 'hidePopover');

    fireEvent.click(screen.getByRole('button', { name: /stats/i, hidden: true }));
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it('calls hidePopover after swipe down past threshold', () => {
    renderSheet();
    const sheet = document.getElementById(NAV_MORE_SHEET_ID)!;
    const hidePopover = vi.spyOn(sheet, 'hidePopover');

    const panel = screen.getByRole('dialog', { hidden: true });
    fireEvent.touchStart(panel, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(panel, { touches: [{ clientY: 200 }] });
    fireEvent.touchEnd(panel, { changedTouches: [{ clientY: 200 }] });
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it('does not call hidePopover after short swipe below threshold', () => {
    renderSheet();
    const sheet = document.getElementById(NAV_MORE_SHEET_ID)!;
    const hidePopover = vi.spyOn(sheet, 'hidePopover');

    const panel = screen.getByRole('dialog', { hidden: true });
    fireEvent.touchStart(panel, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(panel, { touches: [{ clientY: 150 }] });
    fireEvent.touchEnd(panel, { changedTouches: [{ clientY: 150 }] });
    expect(hidePopover).not.toHaveBeenCalled();
  });
});
