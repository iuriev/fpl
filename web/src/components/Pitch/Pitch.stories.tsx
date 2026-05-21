import type { Meta, StoryObj } from '@storybook/react';
import { Pitch } from './Pitch';

const meta = {
  title: 'Components/Pitch',
  component: Pitch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {},
};
