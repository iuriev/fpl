import { createContext, useContext } from 'react';

import { AuthUser } from './auth-client';

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useCurrentUser(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useCurrentUser must be used within AuthProvider');
  return ctx;
}
