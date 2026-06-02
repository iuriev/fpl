import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import * as authClient from './auth-client';
import { useCurrentUser } from './AuthContext';
import { AuthProvider } from './AuthProvider';

vi.mock('./auth-client');

describe('AuthProvider', () => {
  it('loads user from getMe on mount', async () => {
    const mockUser = { id: '1', email: 'user@test.com', name: 'Test User', fplTeamId: null };
    vi.spyOn(authClient, 'authClient', 'get').mockReturnValue({
      ...authClient.authClient,
      getMe: vi.fn().mockResolvedValue(mockUser),
    });

    function wrapper({ children }: { children: React.ReactNode }) {
      return <AuthProvider>{children}</AuthProvider>;
    }

    const { result } = renderHook(() => useCurrentUser(), { wrapper });
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(mockUser);
  });

  it('sets user to null on 401', async () => {
    vi.spyOn(authClient, 'authClient', 'get').mockReturnValue({
      ...authClient.authClient,
      getMe: vi.fn().mockRejectedValue({ message: 'Unauthorized', statusCode: 401 }),
    });

    function wrapper({ children }: { children: React.ReactNode }) {
      return <AuthProvider>{children}</AuthProvider>;
    }

    const { result } = renderHook(() => useCurrentUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('throws when useCurrentUser is used outside provider', () => {
    expect(() => renderHook(() => useCurrentUser())).toThrow(
      'useCurrentUser must be used within AuthProvider'
    );
  });
});
