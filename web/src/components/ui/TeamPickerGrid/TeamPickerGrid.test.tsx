import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TeamPickerGrid } from './TeamPickerGrid';

const teams = [
  { teamId: 1, teamCode: 3, shortName: 'ARS' },
  { teamId: 2, teamCode: 7, shortName: 'AVL' },
];

describe('TeamPickerGrid', () => {
  it('renders team tabs with accessible labels', () => {
    render(
      <TeamPickerGrid
        teams={teams}
        selectedTeamId={1}
        onSelectTeam={vi.fn()}
        ariaLabel="Teams"
      />
    );
    expect(screen.getByRole('tab', { name: 'ARS' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'AVL' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onSelectTeam when a chip is clicked', async () => {
    const user = userEvent.setup();
    const onSelectTeam = vi.fn();
    render(
      <TeamPickerGrid
        teams={teams}
        selectedTeamId={1}
        onSelectTeam={onSelectTeam}
        ariaLabel="Teams"
      />
    );
    await user.click(screen.getByRole('tab', { name: 'AVL' }));
    expect(onSelectTeam).toHaveBeenCalledWith(2);
  });
});
