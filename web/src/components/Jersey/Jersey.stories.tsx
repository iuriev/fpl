import type { Meta, StoryObj } from '@storybook/react';
import { Jersey } from './Jersey';

const meta = {
  title: 'Components/Jersey',
  component: Jersey,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
