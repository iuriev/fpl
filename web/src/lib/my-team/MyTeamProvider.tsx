import React, { useCallback, useState } from 'react';

import { MyTeamContext } from './MyTeamContext';

const KEY = 'fpl-my-team-id';

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
