import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { expect, fn, within, type UserEventObject } from 'storybook/test';
import { EntryScreen } from './EntryScreen';

type BoundCanvas = ReturnType<typeof within>;

const meta = {
  title: 'Screens/Entry',
  component: EntryScreen,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof EntryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { onSubmit: fn() },
};

export const Invalid: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvas, userEvent }: { canvas: BoundCanvas; userEvent: UserEventObject }) => {
    await userEvent.type(canvas.getByRole('textbox'), 'abc');
    await userEvent.click(canvas.getByRole('button', { name: /view squad/i }));
    await expect(canvas.getByText('Team ID must be a positive number')).toBeVisible();
  },
};

export const NotFound: Story = {
  args: { onSubmit: fn() },
  parameters: {
    msw: {
      handlers: {
        entry: [
          http.get('/api/entry/:teamId', () =>
            HttpResponse.json({ message: 'Not found' }, { status: 404 })
          ),
        ],
      },
    },
  },
  play: async ({ canvas, userEvent }: { canvas: BoundCanvas; userEvent: UserEventObject }) => {
    await userEvent.type(canvas.getByRole('textbox'), '9999999');
    await userEvent.click(canvas.getByRole('button', { name: /view squad/i }));
    await expect(await canvas.findByText(/couldn't find a team/i)).toBeVisible();
  },
};

export const Unreachable: Story = {
  args: { onSubmit: fn() },
  parameters: {
    msw: {
      handlers: {
        entry: [http.get('/api/entry/:teamId', () => HttpResponse.error())],
      },
    },
  },
  play: async ({ canvas, userEvent }: { canvas: BoundCanvas; userEvent: UserEventObject }) => {
    await userEvent.type(canvas.getByRole('textbox'), '1234567');
    await userEvent.click(canvas.getByRole('button', { name: /view squad/i }));
    await expect(await canvas.findByText(/couldn't reach/i)).toBeVisible();
  },
};

export const Submitting: Story = {
  args: {
    onSubmit: fn(),
    _storyInputValue: '31231',
    _storyIsSubmitting: true,
  },
  play: async ({ canvas }: { canvas: BoundCanvas }) => {
    const button = canvas.getByRole('button', { name: /view squad/i });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-busy', 'true');
  },
};

export const Success: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvas }: { canvas: BoundCanvas }) => {
    await expect(canvas.queryByText(/must be/i)).not.toBeInTheDocument();
    await expect(canvas.queryByText(/couldn't find/i)).not.toBeInTheDocument();
    await expect(canvas.queryByText(/couldn't reach/i)).not.toBeInTheDocument();
  },
};
