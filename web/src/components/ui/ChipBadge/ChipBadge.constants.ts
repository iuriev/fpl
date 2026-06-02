import { copy } from '@/lib/copy';
import type { ActiveChip } from '@/types';

export const CHIP_LABELS: Record<NonNullable<ActiveChip>, string> = {
  wildcard: copy.chipWildcard,
  '3xc':    copy.chipTripleCaptain,
  freehit:  copy.chipFreeHit,
  bboost:   copy.chipBenchBoost,
};
