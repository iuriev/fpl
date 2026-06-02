import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import * as authClient from '@/auth/auth-client';
import { AuthContext, AuthContextValue } from '@/auth/AuthContext';

import { SignInScreen } from './SignInScreen';

vi.mock('@/auth/auth-client');

const mockAuthContext: AuthContextValue = {
  user: null,
  loading: false,
  refetch: vi.fn(),
};

function renderSignIn() {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <SignInScreen />
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe('SignInScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign in form', () => {
    renderSignIn();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(document.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
  });

  it('calls signIn on form submission', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      id: '1',
      email: 'user@test.com',
      name: 'Test User',
      fplTeamId: null,
    });
    vi.spyOn(authClient, 'authClient', 'get').mockReturnValue({
      ...authClient.authClient,
      signIn: mockSignIn,
    });

    renderSignIn();

    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    const submitButtons = screen.getAllByText(/sign in/i, { selector: 'button' });
    const submitButton = submitButtons[0];

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'password123'));
  });

  it('shows error message on failed sign in', async () => {
    const mockSignIn = vi.fn().mockRejectedValue({ message: 'Invalid credentials' });
    vi.spyOn(authClient, 'authClient', 'get').mockReturnValue({
      ...authClient.authClient,
      signIn: mockSignIn,
    });

    renderSignIn();

    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    const submitButtons = screen.getAllByText(/sign in/i, { selector: 'button' });
    const submitButton = submitButtons[0];

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());
  });

  it('has sign up link', () => {
    renderSignIn();
    const signUpLink = screen.getByText(/sign up/i) as HTMLAnchorElement;
    expect(signUpLink.href).toContain('/sign-up');
  });

  it('disables form while submitting', async () => {
    const mockSignIn = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    vi.spyOn(authClient, 'authClient', 'get').mockReturnValue({
      ...authClient.authClient,
      signIn: mockSignIn,
    });

    renderSignIn();

    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    const submitButtons = screen.getAllByText(/sign in/i, { selector: 'button' });
    const submitButton = submitButtons[0];

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(emailInput.disabled).toBe(true);
    expect(passwordInput.disabled).toBe(true);
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
