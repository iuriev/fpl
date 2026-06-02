import React, { useCallback, useMemo, useState } from 'react';

import { authClient } from '@/auth/auth-client';
import { useCurrentUser } from '@/auth/AuthContext';

import { MyTeamContext } from './MyTeamContext';

const DEMO_TEAM_KEY = 'fpl-demo-team-id';
const DEMO_MODE_KEY = 'fpl-is-demo-mode';

export function MyTeamProvider({ children }: { children: React.ReactNode }) {
  const { user, refetch } = useCurrentUser();

  const [demoTeamId, setDemoTeamIdState] = useState<number | null>(() => {
    const stored = sessionStorage.getItem(DEMO_TEAM_KEY);
    return stored ? Number(stored) : null;
  });

  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    return sessionStorage.getItem(DEMO_MODE_KEY) === 'true';
  });

  const myTeamId = useMemo(
    () => (isDemoMode ? demoTeamId : (user?.fplTeamId ?? null)),
    [isDemoMode, demoTeamId, user?.fplTeamId]
  );

  const setDemoTeamId = useCallback((id: number | null) => {
    if (id !== null) {
      sessionStorage.setItem(DEMO_TEAM_KEY, String(id));
      sessionStorage.setItem(DEMO_MODE_KEY, 'true');
      setDemoTeamIdState(id);
      setIsDemoModeState(true);
    } else {
      sessionStorage.removeItem(DEMO_TEAM_KEY);
      setDemoTeamIdState(null);
    }
  }, []);

  const clearDemoMode = useCallback(() => {
    sessionStorage.removeItem(DEMO_TEAM_KEY);
    sessionStorage.removeItem(DEMO_MODE_KEY);
    setDemoTeamIdState(null);
    setIsDemoModeState(false);
  }, []);

  const setMyTeamId = useCallback(
    (id: number | null) => {
      if (id !== null) {
        authClient.saveTeam(id).then(() => refetch()).catch(() => {});
      }
    },
    [refetch]
  );

  return (
    <MyTeamContext.Provider value={{ myTeamId, isDemoMode, setMyTeamId, setDemoTeamId, clearDemoMode }}>
      {children}
    </MyTeamContext.Provider>
  );
}
