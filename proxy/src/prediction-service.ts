import { and, desc, eq } from 'drizzle-orm';

import { db } from './db/client';
import {
  predModelRun,
  predPlayerGw,
} from './db/schema';
import type { PredictionsResponse } from './prediction/types';

export async function getPredictionsForEvent(
  event: number,
): Promise<PredictionsResponse> {
  const [run] = await db
    .select()
    .from(predModelRun)
    .where(
      and(eq(predModelRun.kind, 'score'), eq(predModelRun.targetEvent, event)),
    )
    .orderBy(desc(predModelRun.createdAt))
    .limit(1);

  if (!run) {
    return { event, modelRunId: null, ready: false, players: [] };
  }

  const rows = await db
    .select()
    .from(predPlayerGw)
    .where(eq(predPlayerGw.modelRunId, run.id));

  return {
    event,
    modelRunId: run.id,
    ready: rows.length > 0,
    players: rows.map((r) => ({
      playerId: r.playerId,
      event: r.event,
      xPts: r.xPts,
      xGoals: r.xGoals,
      xAssists: r.xAssists,
      csProb: r.csProb,
      defconPts: r.defconPts,
      confidence: r.confidence as 'low' | 'medium' | 'high',
      epNextAnchor: r.epNextAnchor,
      modelXPts: r.modelXPts,
    })),
  };
}
