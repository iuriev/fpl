import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SortPickerSheet } from './SortPickerSheet';

describe('SortPickerSheet', () => {
  it('shows all sort options when open', () => {
    render(
      <SortPickerSheet open sortKey="totalPoints" onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText('Pts')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Form')).toBeInTheDocument();
    expect(screen.getByText('GW pts')).toBeInTheDocument();
    expect(screen.getByText('Sel%')).toBeInTheDocument();
  });

  it('calls onSelect with the chosen key when an option is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <SortPickerSheet open sortKey="totalPoints" onSelect={onSelect} onClose={vi.fn()} />,
    );
    await user.click(screen.getByText('Price'));
    expect(onSelect).toHaveBeenCalledWith('nowCost');
  });

  it('calls onSelect with eventPoints when GW pts is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <SortPickerSheet open sortKey="totalPoints" onSelect={onSelect} onClose={vi.fn()} />,
    );
    await user.click(screen.getByText('GW pts'));
    expect(onSelect).toHaveBeenCalledWith('eventPoints');
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <SortPickerSheet open sortKey="totalPoints" onSelect={vi.fn()} onClose={onClose} />,
    );
    const backdrop = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
