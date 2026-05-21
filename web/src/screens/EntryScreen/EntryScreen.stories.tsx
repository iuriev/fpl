import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { EntryScreen, type EntryScreenProps } from './EntryScreen';

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

export const Idle: Story = {
  args: {
    onSubmit: fn(),
  },
  render: (args: EntryScreenProps) => (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
      <EntryScreen {...args} />
    </div>
  ),
};
