import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as apiClient from '@/api/client';
import { AuthContext, AuthContextValue } from '@/auth/AuthContext';
import { MyTeamContext, MyTeamContextValue } from '@/lib/my-team/MyTeamContext';

import { EntryScreen } from './EntryScreen';

vi.mock('@/api/client');

const mockAuthContext: AuthContextValue = {
  user: null,
  loading: false,
  refetch: vi.fn(),
};

const mockSetDemoTeamId = vi.fn();
const mockMyTeamContext: MyTeamContextValue = {
  myTeamId: null,
  isDemoMode: false,
  setMyTeamId: vi.fn(),
  setDemoTeamId: mockSetDemoTeamId,
  clearDemoMode: vi.fn(),
};

function renderEntry(
  locationState: Record<string, unknown> = {},
  authCtx = mockAuthContext,
  myTeamCtx = mockMyTeamContext
) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/entry', state: locationState }]}>
      <AuthContext.Provider value={authCtx}>
        <MyTeamContext.Provider value={myTeamCtx}>
          <EntryScreen />
        </MyTeamContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('EntryScreen — demo mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls setDemoTeamId on submit in demo mode', async () => {
    vi.spyOn(apiClient, 'api', 'get').mockReturnValue({
      ...apiClient.api,
      getEntry: vi.fn().mockResolvedValue({ teamId: 123 }),
    });

    renderEntry({ demo: true });

    fireEvent.change(document.querySelector('input') as HTMLInputElement, { target: { value: '123' } });
    fireEvent.submit(screen.getByRole('button', { name: /view squad/i }).closest('form')!);

    await waitFor(() => expect(mockSetDemoTeamId).toHaveBeenCalledWith(123));
  });

  it('does not show sign-in footer link in demo mode', () => {
    renderEntry({ demo: true });
    expect(screen.queryByText(/sign in/i)).toBeNull();
  });
});

describe('EntryScreen — authenticated mode', () => {
  const authUser: AuthContextValue = {
    user: {
      id: '1',
      email: 'u@test.com',
      name: 'U',
      fplTeamId: null,
      emailVerified: true,
      subscriptionTier: 'free' as const,
    },
    loading: false,
    refetch: vi.fn(),
  };

  it('does not call setDemoTeamId when authenticated', async () => {
    vi.spyOn(apiClient, 'api', 'get').mockReturnValue({
      ...apiClient.api,
      getEntry: vi.fn().mockResolvedValue({ teamId: 99 }),
    });

    renderEntry({}, authUser);

    fireEvent.change(document.querySelector('input') as HTMLInputElement, { target: { value: '99' } });
    fireEvent.submit(screen.getByRole('button', { name: /view squad/i }).closest('form')!);

    await waitFor(() => expect(mockSetDemoTeamId).not.toHaveBeenCalled());
  });
});
