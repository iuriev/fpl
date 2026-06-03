import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import * as authClient from '@/auth/auth-client';
import { AuthContext, AuthContextValue } from '@/auth/AuthContext';
import { MyTeamContext, MyTeamContextValue } from '@/lib/my-team/MyTeamContext';

import { SignInScreen } from './SignInScreen';

vi.mock('@/auth/auth-client');

const mockAuthContext: AuthContextValue = {
  user: null,
  loading: false,
  refetch: vi.fn(),
};

const mockClearDemoMode = vi.fn();
const mockMyTeamContext: MyTeamContextValue = {
  myTeamId: null,
  isDemoMode: false,
  setMyTeamId: vi.fn(),
  setDemoTeamId: vi.fn(),
  clearDemoMode: mockClearDemoMode,
};

function renderSignIn() {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <MyTeamContext.Provider value={mockMyTeamContext}>
          <SignInScreen />
        </MyTeamContext.Provider>
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
    const signUpLink = screen.getByText("Sign up") as HTMLAnchorElement;
    expect(signUpLink.href).toContain('/sign-up');
  });

  it('renders Try Demo button', () => {
    renderSignIn();
    expect(screen.getByRole('button', { name: /try demo/i })).toBeInTheDocument();
  });

  it('calls clearDemoMode on successful sign in', async () => {
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

    await waitFor(() => expect(mockClearDemoMode).toHaveBeenCalled());
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
