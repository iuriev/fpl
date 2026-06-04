import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StartupReadinessContext } from '@/lib/startup-readiness/StartupReadinessContext';

import { StartupMaintenanceScreen } from './StartupMaintenanceScreen';

describe('StartupMaintenanceScreen', () => {
  it('shows maintenance copy', () => {
    render(
      <StartupReadinessContext.Provider
        value={{ ready: false, checking: false, health: undefined }}
      >
        <StartupMaintenanceScreen />
      </StartupReadinessContext.Provider>
    );

    expect(screen.getByRole('heading', { name: /we’re updating/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
