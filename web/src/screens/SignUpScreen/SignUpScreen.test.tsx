import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import * as authClient from '@/auth/auth-client';
import { AuthContext, AuthContextValue } from '@/auth/AuthContext';
import { MyTeamContext, MyTeamContextValue } from '@/lib/my-team/MyTeamContext';

import { SignUpScreen } from './SignUpScreen';

vi.mock('@/auth/auth-client');

const mockAuthContext: AuthContextValue = {
  user: null,
  loading: false,
  refetch: vi.fn(),
};

const mockMyTeamContext: MyTeamContextValue = {
  myTeamId: null,
  isDemoMode: false,
  setMyTeamId: vi.fn(),
  setDemoTeamId: vi.fn(),
  clearDemoMode: vi.fn(),
};

function renderSignUp() {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <MyTeamContext.Provider value={mockMyTeamContext}>
          <SignUpScreen />
        </MyTeamContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe('SignUpScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign up form', () => {
    renderSignUp();
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(document.querySelector('input[name="name"]')).toBeInTheDocument();
    expect(document.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
  });

  it('calls signUp on form submission', async () => {
    const mockSignUp = vi.fn().mockResolvedValue({
      id: '1',
      email: 'newuser@test.com',
      name: 'New User',
      fplTeamId: null,
      subscriptionTier: 'free' as const,
    });
    vi.spyOn(authClient, 'authClient', 'get').mockReturnValue({
      ...authClient.authClient,
      signUp: mockSignUp,
    });

    renderSignUp();

    const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    const submitButtons = screen.getAllByText(/create account/i, { selector: 'button' });
    const submitButton = submitButtons[0];

    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith('newuser@test.com', 'password123', 'New User')
    );
  });

  it('shows error message on failed sign up', async () => {
    const mockSignUp = vi.fn().mockRejectedValue({ message: 'Email already exists' });
    vi.spyOn(authClient, 'authClient', 'get').mockReturnValue({
      ...authClient.authClient,
      signUp: mockSignUp,
    });

    renderSignUp();

    const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    const submitButtons = screen.getAllByText(/create account/i, { selector: 'button' });
    const submitButton = submitButtons[0];

    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.change(emailInput, { target: { value: 'existing@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => expect(screen.getByText('Email already exists')).toBeInTheDocument());
  });

  it('has sign in link', () => {
    renderSignUp();
    const signInLink = screen.getByText(/sign in/i) as HTMLAnchorElement;
    expect(signInLink.href).toContain('/sign-in');
  });

  it('disables form while submitting', async () => {
    const mockSignUp = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    vi.spyOn(authClient, 'authClient', 'get').mockReturnValue({
      ...authClient.authClient,
      signUp: mockSignUp,
    });

    renderSignUp();

    const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    const submitButtons = screen.getAllByText(/create account/i, { selector: 'button' });
    const submitButton = submitButtons[0];

    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(nameInput.disabled).toBe(true);
    expect(emailInput.disabled).toBe(true);
    expect(passwordInput.disabled).toBe(true);
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
