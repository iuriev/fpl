import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useStartupReadiness } from '@/lib/startup-readiness/StartupReadinessContext';
import { isPredictionsWarmupActive } from '@/lib/startup-readiness/warmup-status';

const POLL_MS = 15_000;

function invalidatePredictionQueries(queryClient: ReturnType<typeof useQueryClient>, event: number) {
  void queryClient.invalidateQueries({ queryKey: ['market-preview', event] });
  void queryClient.invalidateQueries({ queryKey: ['market', event] });
  void queryClient.invalidateQueries({ queryKey: ['predictions-preview', event] });
  void queryClient.invalidateQueries({ queryKey: ['predictions', event] });
}

export function usePredictionsWarmupRefetch(event: number | null): void {
  const queryClient = useQueryClient();
  const { health } = useStartupReadiness();
  const warmupActive = isPredictionsWarmupActive(health);
  const phase = health?.predictionsWarmup.phase;
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    if (!warmupActive || event === null) return;
    const id = setInterval(() => invalidatePredictionQueries(queryClient, event), POLL_MS);
    return () => clearInterval(id);
  }, [warmupActive, event, queryClient]);

  useEffect(() => {
    if (event === null) return;
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (prev !== 'done' && phase === 'done') {
      invalidatePredictionQueries(queryClient, event);
    }
  }, [phase, event, queryClient]);
}
