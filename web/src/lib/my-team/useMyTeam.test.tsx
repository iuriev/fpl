import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthContext, AuthContextValue } from '@/auth/AuthContext';

import { useMyTeam } from './MyTeamContext';
import { MyTeamProvider } from './MyTeamProvider';

const mockRefetch = vi.fn().mockResolvedValue(undefined);

function makeAuthContext(fplTeamId: number | null = null): AuthContextValue {
  return {
    user: { id: '1', email: 'test@test.com', name: 'Test', fplTeamId, emailVerified: true },
    loading: false,
    refetch: mockRefetch,
  };
}

function noUserAuthContext(): AuthContextValue {
  return { user: null, loading: false, refetch: mockRefetch };
}

function wrapper(authCtx: AuthContextValue) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={authCtx}>
        <MyTeamProvider>{children}</MyTeamProvider>
      </AuthContext.Provider>
    );
  };
}

afterEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('useMyTeam — auth mode', () => {
  it('returns fplTeamId from user when not in demo mode', () => {
    const { result } = renderHook(() => useMyTeam(), { wrapper: wrapper(makeAuthContext(42)) });
    expect(result.current.myTeamId).toBe(42);
    expect(result.current.isDemoMode).toBe(false);
  });

  it('returns null when user has no fplTeamId', () => {
    const { result } = renderHook(() => useMyTeam(), { wrapper: wrapper(makeAuthContext(null)) });
    expect(result.current.myTeamId).toBeNull();
  });

  it('returns null when no user', () => {
    const { result } = renderHook(() => useMyTeam(), { wrapper: wrapper(noUserAuthContext()) });
    expect(result.current.myTeamId).toBeNull();
  });
});

describe('useMyTeam — demo mode', () => {
  it('starts with no demo state when sessionStorage is empty', () => {
    const { result } = renderHook(() => useMyTeam(), { wrapper: wrapper(noUserAuthContext()) });
    expect(result.current.isDemoMode).toBe(false);
    expect(result.current.myTeamId).toBeNull();
  });

  it('reads initial demo state from sessionStorage', () => {
    sessionStorage.setItem('fpl-demo-team-id', '99');
    sessionStorage.setItem('fpl-is-demo-mode', 'true');
    const { result } = renderHook(() => useMyTeam(), { wrapper: wrapper(noUserAuthContext()) });
    expect(result.current.isDemoMode).toBe(true);
    expect(result.current.myTeamId).toBe(99);
  });

  it('setDemoTeamId sets demo mode and persists to sessionStorage', () => {
    const { result } = renderHook(() => useMyTeam(), { wrapper: wrapper(noUserAuthContext()) });
    act(() => { result.current.setDemoTeamId(123); });
    expect(result.current.isDemoMode).toBe(true);
    expect(result.current.myTeamId).toBe(123);
    expect(sessionStorage.getItem('fpl-demo-team-id')).toBe('123');
    expect(sessionStorage.getItem('fpl-is-demo-mode')).toBe('true');
  });

  it('clearDemoMode resets demo state and removes sessionStorage keys', () => {
    sessionStorage.setItem('fpl-demo-team-id', '55');
    sessionStorage.setItem('fpl-is-demo-mode', 'true');
    const { result } = renderHook(() => useMyTeam(), { wrapper: wrapper(noUserAuthContext()) });
    act(() => { result.current.clearDemoMode(); });
    expect(result.current.isDemoMode).toBe(false);
    expect(result.current.myTeamId).toBeNull();
    expect(sessionStorage.getItem('fpl-demo-team-id')).toBeNull();
    expect(sessionStorage.getItem('fpl-is-demo-mode')).toBeNull();
  });

  it('demo mode myTeamId takes precedence over user.fplTeamId', () => {
    sessionStorage.setItem('fpl-demo-team-id', '77');
    sessionStorage.setItem('fpl-is-demo-mode', 'true');
    const { result } = renderHook(() => useMyTeam(), { wrapper: wrapper(makeAuthContext(100)) });
    expect(result.current.isDemoMode).toBe(true);
    expect(result.current.myTeamId).toBe(77);
  });
});

describe('useMyTeam — errors', () => {
  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useMyTeam())).toThrow('useMyTeam must be used within MyTeamProvider');
  });
});
