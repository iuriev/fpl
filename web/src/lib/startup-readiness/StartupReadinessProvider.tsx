import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { api } from '@/api/client';

import {
  StartupReadinessContext,
  StartupReadinessContextValue,
} from './StartupReadinessContext';
import { shouldPollStartupHealth } from './warmup-status';

const POLL_MS = 30_000;

function isGateSkipped(): boolean {
  return import.meta.env.VITE_SKIP_STARTUP_GATE === 'true';
}

export function StartupReadinessProvider({ children }: { children: React.ReactNode }) {
  const skipGate = isGateSkipped();

  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
    enabled: !skipGate,
    refetchInterval: (query) =>
      shouldPollStartupHealth(query.state.data) ? POLL_MS : false,
    retry: true,
  });

  const value: StartupReadinessContextValue = skipGate
    ? { ready: true, checking: false, health: undefined }
    : {
        ready: isError ? false : (data?.ready ?? false),
        checking: isPending && data === undefined,
        health: data,
      };

  return (
    <StartupReadinessContext.Provider value={value}>{children}</StartupReadinessContext.Provider>
  );
}

StartupReadinessProvider.displayName = 'StartupReadinessProvider';
