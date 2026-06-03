import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import * as authClientModule from '@/auth/auth-client';

import { ResetPasswordScreen } from './ResetPasswordScreen';

vi.mock('@/auth/auth-client');

function renderScreen(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/reset-password${search}`]}>
      <ResetPasswordScreen />
    </MemoryRouter>
  );
}

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows invalid token error when no token in URL', () => {
    renderScreen();
    expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request a new one/i })).toBeInTheDocument();
  });

  it('renders the password form when token is present', () => {
    renderScreen('?token=abc123');
    expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument();
    const inputs = document.querySelectorAll('input[type="password"]');
    expect(inputs).toHaveLength(2);
  });

  it('shows mismatch error when passwords do not match', async () => {
    renderScreen('?token=abc123');
    const [newPw, confirmPw] = document.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
    fireEvent.change(newPw, { target: { value: 'password1' } });
    fireEvent.change(confirmPw, { target: { value: 'password2' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    await waitFor(() =>
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument()
    );
  });

  it('calls resetPassword with token and new password when passwords match', async () => {
    const mockReset = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(authClientModule, 'authClient', 'get').mockReturnValue({
      ...authClientModule.authClient,
      resetPassword: mockReset,
    });

    renderScreen('?token=abc123');
    const [newPw, confirmPw] = document.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
    fireEvent.change(newPw, { target: { value: 'newpass1' } });
    fireEvent.change(confirmPw, { target: { value: 'newpass1' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() =>
      expect(mockReset).toHaveBeenCalledWith('abc123', 'newpass1')
    );
  });

  it('shows API error on reset failure', async () => {
    const mockReset = vi.fn().mockRejectedValue({ message: 'Token expired' });
    vi.spyOn(authClientModule, 'authClient', 'get').mockReturnValue({
      ...authClientModule.authClient,
      resetPassword: mockReset,
    });

    renderScreen('?token=abc123');
    const [newPw, confirmPw] = document.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
    fireEvent.change(newPw, { target: { value: 'newpass1' } });
    fireEvent.change(confirmPw, { target: { value: 'newpass1' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() =>
      expect(screen.getByText(/token expired/i)).toBeInTheDocument()
    );
  });
});
