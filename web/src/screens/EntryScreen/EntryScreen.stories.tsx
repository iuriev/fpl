import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { fn } from 'storybook/test';
import { EntryScreen } from './EntryScreen';

const meta = {
  title: 'Screens/Entry',
  component: EntryScreen,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof EntryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state: empty form, ready for input.
 * User sees the entry screen without errors.
 */
export const Idle: Story = {
  args: {
    onSubmit: fn(),
  },
};

/**
 * Invalid input state: user entered non-numeric or empty value.
 * Error message is displayed with visual feedback (red border, error icon).
 * Corresponds to spec scenario: "Non-numeric input"
 */
export const Invalid: Story = {
  args: {
    onSubmit: fn(),
    _storyInputValue: '12abc34',
    _storyError: 'Team ID must be a positive number',
  },
};

/**
 * Submitting state: request in flight, button disabled and in loading state.
 * Corresponds to spec scenario during network request validation.
 */
export const Submitting: Story = {
  args: {
    onSubmit: fn(),
    _storyInputValue: '72828',
    _storyIsSubmitting: true,
  },
};

/**
 * Team not found (404): the entered team ID does not correspond to any FPL team.
 * Error message: "We couldn't find a team with that ID. Please check and try again."
 * Corresponds to spec scenario: "Unknown team ID"
 */
export const NotFound: Story = {
  args: {
    onSubmit: fn(),
    _storyInputValue: '9999999',
    _storyError: "We couldn't find a team with that ID. Please check and try again.",
  },
};

/**
 * Error state: FPL API unreachable (network error or 5xx).
 * Error message: "Couldn't reach the FPL servers. Please try again."
 * Corresponds to spec scenario: "Data source unavailable"
 */
export const Error: Story = {
  args: {
    onSubmit: fn(),
    _storyInputValue: '72828',
    _storyError: "Couldn't reach the FPL servers. Please try again.",
  },
};

/**
 * Success state: valid team ID entered, ready to navigate to squad view.
 * Button is enabled and shows success state.
 */
export const Success: Story = {
  args: {
    onSubmit: fn(),
    _storyInputValue: '72828',
  },
};
