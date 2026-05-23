import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ViewToggle } from './ViewToggle';

describe('ViewToggle', () => {
  it('renders both options', () => {
    render(<ViewToggle value="pitch" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /pitch/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
  });

  it('marks the active option aria-pressed=true', () => {
    render(<ViewToggle value="pitch" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /pitch/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /list/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('active class is applied to the selected option', () => {
    const { container } = render(<ViewToggle value="list" onChange={vi.fn()} />);
    const [pitchBtn, listBtn] = container.querySelectorAll('button');
    expect(pitchBtn.className).not.toContain('option_active');
    expect(listBtn.className).toContain('option_active');
  });

  it('calls onChange with "list" when the list option is clicked', () => {
    const onChange = vi.fn();
    render(<ViewToggle value="pitch" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /list/i }));
    expect(onChange).toHaveBeenCalledWith('list');
  });

  it('calls onChange with "pitch" when the pitch option is clicked', () => {
    const onChange = vi.fn();
    render(<ViewToggle value="list" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /pitch/i }));
    expect(onChange).toHaveBeenCalledWith('pitch');
  });
});
