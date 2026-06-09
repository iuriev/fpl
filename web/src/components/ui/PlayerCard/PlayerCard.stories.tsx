import type { Meta, StoryObj } from '@storybook/react-vite';

import type { SquadPlayer } from '@/types';

import { PlayerCard } from './PlayerCard';

const meta = {
  title: 'Components/PlayerCard',
  component: PlayerCard,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'pitch' },
  },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof PlayerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const base: SquadPlayer = {
  id: 1,
  fplCode: 1,
  name: 'Salah',
  position: 'MID',
  club: 'LIV',
  teamCode: 14,
  teamId: 14,
  nowCost: 135,
  points: 14,
  isCaptain: false,
  isViceCaptain: false,
  status: 'a',
  stats: {
    minutes: 90,
    goals_scored: 1,
    assists: 1,
    clean_sheets: 0,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 0,
    red_cards: 0,
    saves: 0,
    bonus: 3,
    total_points: 14,
  },
};

export const Default: Story = {
  args: { player: base },
};

export const Large: Story = {
  args: { player: base, size: 'large' },
};

export const Captain: Story = {
  args: { player: { ...base, isCaptain: true, isViceCaptain: false } },
};

export const ViceCaptain: Story = {
  args: { player: { ...base, isCaptain: false, isViceCaptain: true } },
};

export const Injured: Story = {
  args: {
    player: {
      ...base,
      name: 'Pedro Porro',
      teamCode: 6,
      status: 'i',
      news: 'Hamstring injury. Doubt for next match.',
    },
  },
};

export const Doubtful: Story = {
  args: {
    player: {
      ...base,
      name: 'Mykolenko',
      teamCode: 11,
      status: 'd',
      chanceOfPlaying: 75,
      news: '75% chance to play.',
    },
  },
};

export const Suspended: Story = {
  args: {
    player: {
      ...base,
      name: 'Vardy',
      teamCode: 13,
      status: 's',
      news: 'Suspended for 1 match.',
    },
  },
};

export const ZeroPoints: Story = {
  args: { player: { ...base, name: 'Mbete', teamCode: 17, points: 0 } },
};

export const WithInfo: Story = {
  args: {
    player: base,
    playerInfo: {
      ownership: '45.2',
      currentPrice: 125,
      expectedPoints: '5.4',
      nextFixtures: [
        { gw: 1, opponent: 'CHE', home: true, difficulty: 3 },
        { gw: 2, opponent: 'IPS', home: false, difficulty: 2 },
      ],
    },
  },
};

export const GoalkeeperLarge: Story = {
  args: {
    player: { ...base, name: 'Flekken', position: 'GK', teamCode: 94, points: 6 },
    size: 'large',
  },
};
