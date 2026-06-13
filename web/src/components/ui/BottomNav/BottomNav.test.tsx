import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { BottomNav } from './BottomNav';

function renderNav(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav />
    </MemoryRouter>,
  );
}

describe('BottomNav', () => {
  it('renders all 5 nav items', () => {
    renderNav();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /transfers/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /predict/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /review/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument();
  });

  it('marks Home as active on /', () => {
    renderNav('/');
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark Home as active on /transfers', () => {
    renderNav('/transfers');
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('marks Transfers as active on /transfers', () => {
    renderNav('/transfers');
    const transfersLink = screen.getByRole('link', { name: /transfers/i });
    expect(transfersLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks Predict as active on /predictions', () => {
    renderNav('/predictions');
    const predictLink = screen.getByRole('link', { name: /predict/i });
    expect(predictLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks Review as active on /review', () => {
    renderNav('/review');
    const reviewLink = screen.getByRole('link', { name: /review/i });
    expect(reviewLink).toHaveAttribute('aria-current', 'page');
  });

  it('More button has no active state and no aria-current', () => {
    renderNav('/');
    const moreBtn = screen.getByRole('button', { name: /more/i });
    expect(moreBtn).not.toHaveAttribute('aria-current');
  });

  it('More button targets the nav-more-sheet popover', () => {
    renderNav('/');
    const moreBtn = screen.getByRole('button', { name: /more/i });
    expect(moreBtn).toHaveAttribute('popovertarget', 'nav-more-sheet');
  });
});
