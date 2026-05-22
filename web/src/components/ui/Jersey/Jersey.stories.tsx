import type { Meta, StoryObj } from '@storybook/react-vite';

import { Jersey } from './Jersey';

const meta = {
  title: 'Components/Jersey',
  component: Jersey,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof Jersey>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Large: Story = {
  args: {
    size: 'large',
    teamCode: 14,
    position: 'MID',
  },
};

export const Medium: Story = {
  args: {
    size: 'medium',
    teamCode: 14,
    position: 'MID',
  },
};

export const Goalkeeper: Story = {
  args: {
    size: 'large',
    teamCode: 14,
    position: 'GK',
  },
};

export const Placeholder: Story = {
  args: {
    size: 'large',
  },
};
