import { createContext, useContext } from 'react';

export interface MyTeamContextValue {
  myTeamId: number | null;
  isDemoMode: boolean;
  setMyTeamId: (id: number | null) => void;
  setDemoTeamId: (id: number | null) => void;
  clearDemoMode: () => void;
}

export const MyTeamContext = createContext<MyTeamContextValue | null>(null);

export function useMyTeam(): MyTeamContextValue {
  const ctx = useContext(MyTeamContext);
  if (!ctx) throw new Error('useMyTeam must be used within MyTeamProvider');
  return ctx;
}
