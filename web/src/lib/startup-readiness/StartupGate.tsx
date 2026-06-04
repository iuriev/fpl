import React from 'react';

import { StartupMaintenanceScreen } from '@/screens/StartupMaintenanceScreen/StartupMaintenanceScreen';

import { useStartupReadiness } from './StartupReadinessContext';

export function StartupGate({ children }: { children: React.ReactNode }) {
  const { ready, checking } = useStartupReadiness();

  if (checking) return null;
  if (!ready) return <StartupMaintenanceScreen />;
  return <>{children}</>;
}

StartupGate.displayName = 'StartupGate';
