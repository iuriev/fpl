import { useContext } from 'react';

import type { MyTeamContextValue } from './MyTeamContext';
import { MyTeamContext } from './MyTeamContext';

export function useMyTeam(): MyTeamContextValue {
  const ctx = useContext(MyTeamContext);
  if (!ctx) throw new Error('useMyTeam must be used within MyTeamProvider');
  return ctx;
}
