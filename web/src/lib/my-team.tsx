import React, { createContext, useCallback, useContext, useState } from 'react';

const KEY = 'fpl-my-team-id';

interface MyTeamContextValue {
  myTeamId: number | null;
  setMyTeamId: (id: number | null) => void;
}

const MyTeamContext = createContext<MyTeamContextValue | null>(null);

export function MyTeamProvider({ children }: { children: React.ReactNode }) {
  const [myTeamId, setMyTeamIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem(KEY);
    return stored ? Number(stored) : null;
  });

  const setMyTeamId = useCallback((id: number | null) => {
    if (id === null) {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, String(id));
    }
    setMyTeamIdState(id);
  }, []);

  return (
    <MyTeamContext.Provider value={{ myTeamId, setMyTeamId }}>
      {children}
    </MyTeamContext.Provider>
  );
}

export function useMyTeam(): MyTeamContextValue {
  const ctx = useContext(MyTeamContext);
  if (!ctx) throw new Error('useMyTeam must be used within MyTeamProvider');
  return ctx;
}
