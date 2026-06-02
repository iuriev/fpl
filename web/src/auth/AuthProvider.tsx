import React, { useCallback, useEffect, useRef, useState } from 'react';

import { authClient, AuthUser } from './auth-client';
import { AuthContext, AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await authClient.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      refetch();
    }
  }, [refetch]);

  const value: AuthContextValue = {
    user,
    loading,
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.displayName = 'AuthProvider';
