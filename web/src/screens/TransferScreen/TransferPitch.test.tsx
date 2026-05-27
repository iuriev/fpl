import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { SquadPlayer } from '@/types';

import { TransferPitch } from './TransferPitch';

const ZERO_STATS: SquadPlayer['stats'] = {
  minutes: 0, goals_scored: 0, assists: 0, clean_sheets: 0,
  goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0,
  yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0, total_points: 0,
};

function makePlayer(id: number, name: string, position: SquadPlayer['position']): SquadPlayer {
  return {
    id, name, position, club: 'TST', teamCode: 1, teamId: 1,
    nowCost: 50, points: 0, isCaptain: false, isViceCaptain: false,
    status: 'a', chanceOfPlaying: null, news: '', stats: ZERO_STATS,
  };
}

const STARTERS: SquadPlayer[] = [
  makePlayer(1, 'Hart', 'GK'),
  makePlayer(2, 'Walker', 'DEF'), makePlayer(3, 'Stones', 'DEF'),
  makePlayer(4, 'Dias', 'DEF'), makePlayer(5, 'Cancelo', 'DEF'),
  makePlayer(6, 'Foden', 'MID'), makePlayer(7, 'De Bruyne', 'MID'),
  makePlayer(8, 'Silva', 'MID'), makePlayer(9, 'Salah', 'MID'),
  makePlayer(10, 'Haaland', 'FWD'), makePlayer(11, 'Jesus', 'FWD'),
];

const BENCH: SquadPlayer[] = [
  makePlayer(12, 'Ederson', 'GK'),
  makePlayer(13, 'Trent', 'DEF'),
  makePlayer(14, 'Mount', 'MID'),
  makePlayer(15, 'Firmino', 'FWD'),
];

function renderPitch(overrides: Partial<React.ComponentProps<typeof TransferPitch>> = {}) {
  return render(
    <TransferPitch
      starters={STARTERS}
      bench={BENCH}
      outPlayerId={null}
      inPlayerIds={new Set()}
      onPlayerClick={vi.fn()}
      {...overrides}
    />,
  );
}

describe('TransferPitch sub mode', () => {
  it('valid target cards receive playerBtn_subTarget class when selectedSubId is set', () => {
    renderPitch({
      selectedSubId: 6,
      validSubTargets: new Set([13, 14, 15]),
    });

    const mountBtn = screen.getByRole('button', { name: /Mount/ });
    expect(mountBtn.className).toContain('playerBtn_subTarget');

    const trentBtn = screen.getByRole('button', { name: /Trent/ });
    expect(trentBtn.className).toContain('playerBtn_subTarget');
  });

  it('non-target non-selected cards receive playerBtn_dimmed class when selectedSubId is set', () => {
    renderPitch({
      selectedSubId: 6,
      validSubTargets: new Set([14]),
    });

    // Ederson is a bench GK — not a valid target
    const edersonBtn = screen.getByRole('button', { name: /Ederson/ });
    expect(edersonBtn.className).toContain('playerBtn_dimmed');

    // Haaland is a starter — not a target when a starter is selected
    const haalandBtn = screen.getByRole('button', { name: /Haaland/ });
    expect(haalandBtn.className).toContain('playerBtn_dimmed');
  });

  it('selected player card receives playerBtn_out class', () => {
    renderPitch({
      selectedSubId: 6,
      validSubTargets: new Set([14]),
    });

    const fodenBtn = screen.getByRole('button', { name: /Foden.*SUB OUT/ });
    expect(fodenBtn.className).toContain('playerBtn_out');
  });

  it('no sub classes are applied when selectedSubId is null', () => {
    const { container } = renderPitch({ selectedSubId: null, validSubTargets: new Set() });

    expect(container.querySelector('.playerBtn_subTarget')).toBeNull();
    expect(container.querySelector('.playerBtn_dimmed')).toBeNull();
  });
});
