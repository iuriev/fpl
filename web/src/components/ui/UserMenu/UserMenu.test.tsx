import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import * as authClient from '@/auth/auth-client';
import { AuthContext, AuthContextValue } from '@/auth/AuthContext';

import { UserMenu } from './UserMenu';

vi.mock('@/auth/auth-client');

describe('UserMenu', () => {
  it('shows nothing when user is null', () => {
    const mockAuthContext: AuthContextValue = {
      user: null,
      loading: false,
      refetch: vi.fn(),
    };

    const { container } = render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <UserMenu />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(container.innerHTML).toBe('');
  });

  it('shows user name when logged in', () => {
    const mockUser = {
      id: '1',
      email: 'user@test.com',
      name: 'Test User',
      fplTeamId: null,
    };

    const mockAuthContext: AuthContextValue = {
      user: mockUser,
      loading: false,
      refetch: vi.fn(),
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <UserMenu />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows email when name is not available', () => {
    const mockUser = {
      id: '1',
      email: 'user@test.com',
      name: '',
      fplTeamId: null,
    };

    const mockAuthContext: AuthContextValue = {
      user: mockUser,
      loading: false,
      refetch: vi.fn(),
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <UserMenu />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText('user@test.com')).toBeInTheDocument();
  });

  it('calls signOut and refetch on sign out click', async () => {
    const mockUser = {
      id: '1',
      email: 'user@test.com',
      name: 'Test User',
      fplTeamId: null,
    };

    const mockRefetch = vi.fn().mockResolvedValue(undefined);
    const mockSignOut = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(authClient, 'authClient', 'get').mockReturnValue({
      ...authClient.authClient,
      signOut: mockSignOut,
    });

    const mockAuthContext: AuthContextValue = {
      user: mockUser,
      loading: false,
      refetch: mockRefetch,
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <UserMenu />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const signOutButton = screen.getByText('Sign out');
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('shows avatar with first letter of name', () => {
    const mockUser = {
      id: '1',
      email: 'user@test.com',
      name: 'John Doe',
      fplTeamId: null,
    };

    const mockAuthContext: AuthContextValue = {
      user: mockUser,
      loading: false,
      refetch: vi.fn(),
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <UserMenu />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText('J')).toBeInTheDocument();
  });
});
