import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Team ID',
    placeholder: 'Enter your team ID',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Team ID',
    placeholder: 'Enter your team ID',
    value: '72828',
    onChange: () => {},
  },
};

export const WithError: Story = {
  args: {
    label: 'Team ID',
    placeholder: 'Enter your team ID',
    error: 'Team ID must be a positive number',
    value: '-123',
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    label: 'Team ID',
    placeholder: 'Enter your team ID',
    disabled: true,
  },
};
