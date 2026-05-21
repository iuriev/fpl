import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'View squad',
  },
};

export const PrimaryDisabled: Story = {
  args: {
    children: 'View squad',
    disabled: true,
  },
};

export const PrimaryLoading: Story = {
  args: {
    children: 'View squad',
    loading: true,
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Cancel',
  },
};

export const SecondaryDisabled: Story = {
  args: {
    variant: 'secondary',
    children: 'Cancel',
    disabled: true,
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Change team',
  },
};

export const Pill: Story = {
  args: {
    variant: 'pill',
    children: '→',
  },
};

export const PillDisabled: Story = {
  args: {
    variant: 'pill',
    children: '→',
    disabled: true,
  },
};
