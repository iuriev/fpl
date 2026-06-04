import { createContext, useContext } from 'react';

import type { HealthResponse } from '@/types';

export interface StartupReadinessContextValue {
  ready: boolean;
  checking: boolean;
  health: HealthResponse | undefined;
}

export const StartupReadinessContext = createContext<StartupReadinessContextValue | null>(
  null
);

export function useStartupReadiness(): StartupReadinessContextValue {
  const value = useContext(StartupReadinessContext);
  if (!value) {
    throw new Error('useStartupReadiness must be used within StartupReadinessProvider');
  }
  return value;
}
