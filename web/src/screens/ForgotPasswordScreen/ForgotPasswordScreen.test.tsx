import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import * as authClientModule from '@/auth/auth-client';

import { ForgotPasswordScreen } from './ForgotPasswordScreen';

vi.mock('@/auth/auth-client');

function renderScreen() {
  return render(
    <BrowserRouter>
      <ForgotPasswordScreen />
    </BrowserRouter>
  );
}

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders headline and email field', () => {
    renderScreen();
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders submit button and back link', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('calls requestPasswordReset on submit', async () => {
    const mockRequest = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(authClientModule, 'authClient', 'get').mockReturnValue({
      ...authClientModule.authClient,
      requestPasswordReset: mockRequest,
    });

    renderScreen();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() =>
      expect(mockRequest).toHaveBeenCalledWith('user@test.com')
    );
  });

  it('shows success message after submit without navigating away', async () => {
    const mockRequest = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(authClientModule, 'authClient', 'get').mockReturnValue({
      ...authClientModule.authClient,
      requestPasswordReset: mockRequest,
    });

    renderScreen();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument()
    );
    expect(screen.queryByRole('button', { name: /send reset link/i })).toBeNull();
  });

  it('shows error message on API failure', async () => {
    const mockRequest = vi.fn().mockRejectedValue({ message: 'Too many requests' });
    vi.spyOn(authClientModule, 'authClient', 'get').mockReturnValue({
      ...authClientModule.authClient,
      requestPasswordReset: mockRequest,
    });

    renderScreen();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByText(/too many requests/i)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });
});
