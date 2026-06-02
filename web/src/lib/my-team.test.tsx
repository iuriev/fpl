import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { MyTeamProvider, useMyTeam } from './my-team';

function wrapper({ children }: { children: React.ReactNode }) {
  return <MyTeamProvider>{children}</MyTeamProvider>;
}

describe('useMyTeam', () => {
  it('starts null when localStorage is empty', () => {
    localStorage.clear();
    const { result } = renderHook(() => useMyTeam(), { wrapper });
    expect(result.current.myTeamId).toBeNull();
  });

  it('reads initial value from localStorage', () => {
    localStorage.setItem('fpl-my-team-id', '12345');
    const { result } = renderHook(() => useMyTeam(), { wrapper });
    expect(result.current.myTeamId).toBe(12345);
    localStorage.clear();
  });

  it('setMyTeamId persists to localStorage and updates state', () => {
    localStorage.clear();
    const { result } = renderHook(() => useMyTeam(), { wrapper });
    act(() => { result.current.setMyTeamId(999); });
    expect(result.current.myTeamId).toBe(999);
    expect(localStorage.getItem('fpl-my-team-id')).toBe('999');
    localStorage.clear();
  });

  it('setMyTeamId(null) clears localStorage and resets state', () => {
    localStorage.setItem('fpl-my-team-id', '999');
    const { result } = renderHook(() => useMyTeam(), { wrapper });
    act(() => { result.current.setMyTeamId(null); });
    expect(result.current.myTeamId).toBeNull();
    expect(localStorage.getItem('fpl-my-team-id')).toBeNull();
  });

  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useMyTeam())).toThrow('useMyTeam must be used within MyTeamProvider');
  });
});
