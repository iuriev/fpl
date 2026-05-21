import type { Meta, StoryObj } from '@storybook/react-vite';

import { Jersey } from './Jersey';

const meta = {
  title: 'Components/Jersey',
  component: Jersey,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs', 'ai-generated', 'needs-work'],
} satisfies Meta<typeof Jersey>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Large: Story = {
  args: {
    size: 'large',
  },
};

export const Medium: Story = {
  args: {
    size: 'medium',
  },
};
