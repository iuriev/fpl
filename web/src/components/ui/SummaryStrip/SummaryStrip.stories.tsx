import type { Meta, StoryObj } from '@storybook/react-vite';

import { SummaryStrip } from './SummaryStrip';

const meta = {
  title: 'Components/SummaryStrip',
  component: SummaryStrip,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof SummaryStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    summary: {
      totalPoints: 67,
      averagePoints: 48,
      highestPoints: 112,
      rank: 1234567,
      transfers: 1,
      freeTransfers: 1,
    },
  },
};

export const HighScore: Story = {
  args: {
    summary: {
      totalPoints: 112,
      averagePoints: 61,
      highestPoints: 112,
      rank: 1,
      transfers: 0,
      freeTransfers: 1,
    },
  },
};

export const PartialData: Story = {
  args: {
    summary: {
      totalPoints: 32,
      transfers: 2,
      freeTransfers: 1,
    },
  },
};

export const ZeroPoints: Story = {
  args: {
    summary: {
      totalPoints: 0,
      averagePoints: 48,
      highestPoints: 112,
      rank: 7000000,
      transfers: 0,
      freeTransfers: 1,
    },
  },
};
