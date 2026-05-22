import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Button } from './Button';

type BoundCanvas = ReturnType<typeof within>;

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'View squad',
  },
  play: async ({ canvas }: { canvas: BoundCanvas }) => {
    const button = canvas.getByRole('button', { name: /view squad/i });
    await expect(button).toHaveAttribute('aria-busy', 'false');
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

// Asserts the design token resolves: --fpl-accent (#00FF87 = rgb(0, 255, 135))
export const CssCheck: Story = {
  args: { children: 'Submit' },
  play: async ({ canvas }: { canvas: BoundCanvas }) => {
    const button = canvas.getByRole('button', { name: /submit/i });
    await expect(getComputedStyle(button).backgroundColor).toBe('rgb(0, 255, 135)');
  },
};
