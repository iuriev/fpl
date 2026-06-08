import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import * as authClientModule from '@/auth/auth-client';
import { AuthContext } from '@/auth/AuthContext';
import { MyTeamContext } from '@/lib/my-team/MyTeamContext';

import { SettingsScreen } from './SettingsScreen';

const mockUser = {
  id: '1',
  email: 'ivan.iuriev@gmail.com',
  name: 'Ivan Iuriev',
  emailVerified: true,
  fplTeamId: 72828,
};

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderSettings(user: typeof mockUser | null = mockUser, isDemoMode = false) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user, loading: false, refetch: vi.fn() }}>
        <MyTeamContext.Provider
          value={{
            myTeamId: 72828,
            isDemoMode,
            setDemoTeamId: vi.fn(),
            clearDemoMode: vi.fn(),
          }}
        >
          <SettingsScreen />
        </MyTeamContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders about and contact sections', () => {
    renderSettings();
    expect(screen.getByRole('heading', { name: /about us/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contact/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /squadpath@gmail.com/i })).toHaveAttribute(
      'href',
      'mailto:squadpath@gmail.com'
    );
  });

  it('shows account profile, team id, and sign out for authenticated users', () => {
    renderSettings();
    expect(screen.getByText('Ivan Iuriev')).toBeInTheDocument();
    expect(screen.getByText('ivan.iuriev@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('72828')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change your team id/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('navigates to entry when change team is clicked', () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /change your team id/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/entry');
  });

  it('hides account profile in demo mode', () => {
    renderSettings(mockUser, true);
    expect(screen.queryByText('Ivan Iuriev')).toBeNull();
    expect(screen.queryByRole('button', { name: /change your team id/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /sign out/i })).toBeNull();
  });

  it('calls signOut and navigates home on sign out click', async () => {
    const mockSignOut = vi.fn().mockResolvedValue(undefined);
    const mockRefetch = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(authClientModule, 'authClient', 'get').mockReturnValue({
      ...authClientModule.authClient,
      signOut: mockSignOut,
    });

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: {
          id: '1',
          email: 'ivan.iuriev@gmail.com',
          name: 'Ivan Iuriev',
          emailVerified: true,
          fplTeamId: 72828,
        }, loading: false, refetch: mockRefetch }}>
          <MyTeamContext.Provider
            value={{
              myTeamId: 72828,
              isDemoMode: false,
              setDemoTeamId: vi.fn(),
              clearDemoMode: vi.fn(),
            }}
          >
            <SettingsScreen />
          </MyTeamContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }));
  });
});
