import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AppLayout } from './AppLayout';

function renderLayout() {
  return render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>,
  );
}

describe('AppLayout', () => {
  it('renders the bottom nav', () => {
    renderLayout();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('sets data-compact on body when scrolling down past threshold', () => {
    renderLayout();

    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 80, writable: true, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(document.body).toHaveAttribute('data-compact');
  });

  it('removes data-compact when scrolling back up', () => {
    renderLayout();

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 80, writable: true, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 40, writable: true, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(document.body).not.toHaveAttribute('data-compact');
  });

  it('does not set data-compact when scroll down is below threshold', () => {
    renderLayout();

    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 30, writable: true, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(document.body).not.toHaveAttribute('data-compact');
  });

  it('cleans up data-compact on unmount', () => {
    const { unmount } = renderLayout();

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 80, writable: true, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(document.body).toHaveAttribute('data-compact');
    unmount();
    expect(document.body).not.toHaveAttribute('data-compact');
  });
});
