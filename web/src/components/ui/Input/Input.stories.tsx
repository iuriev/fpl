import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Input } from './Input';

type BoundCanvas = ReturnType<typeof within>;

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs', 'ai-generated'],
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
    id: 'team-id',
    label: 'Team ID',
    placeholder: 'Enter your team ID',
    error: 'Team ID must be a positive number',
    value: '-123',
    onChange: () => {},
  },
  play: async ({ canvas }: { canvas: BoundCanvas }) => {
    const input = canvas.getByRole('textbox');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByText('Team ID must be a positive number')).toBeVisible();
  },
};

export const Disabled: Story = {
  args: {
    label: 'Team ID',
    placeholder: 'Enter your team ID',
    disabled: true,
  },
};
