import { createContext, useContext } from 'react';

export interface MyTeamContextValue {
  myTeamId: number | null;
  setMyTeamId: (id: number | null) => void;
}

export const MyTeamContext = createContext<MyTeamContextValue | null>(null);

export function useMyTeam(): MyTeamContextValue {
  const ctx = useContext(MyTeamContext);
  if (!ctx) throw new Error('useMyTeam must be used within MyTeamProvider');
  return ctx;
}
