import type { Meta, StoryObj } from '@storybook/react';
import { EntryScreen } from './EntryScreen';

const meta = {
  title: 'Screens/Entry',
  component: EntryScreen,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EntryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
