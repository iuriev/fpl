import { and, desc, eq } from 'drizzle-orm';

import { db } from './db/client';
import { predModelRun, predPlayerGw } from './db/schema';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
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

  if (rows.length === 0) {
    return { event, modelRunId: run.id, ready: false, players: [] };
  }

  const bootstrap = await getOrFetchBootstrap(db);
  const codeToCurrentId = new Map(
    bootstrap.elements.map((el) => [el.code, el.id]),
  );

  const players = rows
    .map((r) => {
      const playerId = codeToCurrentId.get(r.fplCode);
      if (playerId === undefined) return null;
      return {
        fplCode: r.fplCode,
        playerId,
        event: r.event,
        xPts: r.xPts,
        xGoals: r.xGoals,
        xAssists: r.xAssists,
        csProb: r.csProb,
        defconPts: r.defconPts,
        confidence: r.confidence as 'low' | 'medium' | 'high',
        epNextAnchor: r.epNextAnchor,
        modelXPts: r.modelXPts,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return {
    event,
    modelRunId: run.id,
    ready: players.length > 0,
    players,
  };
}
