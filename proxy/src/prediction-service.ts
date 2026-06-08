import { and, desc, eq } from 'drizzle-orm';

import { db } from './db/client';
import { predModelRun, predPlayerGw } from './db/schema';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import {
  ASSIST_PREVIEW_POSITIONS,
  ELEMENT_TYPE_TO_POSITION,
  POINTS_PREVIEW_POSITIONS,
  PREVIEW_PLAYER_LIMIT,
} from './prediction/preview-limits';
import type {
  AssistsPreviewByPosition,
  PredictionsPreviewByPosition,
  PredictionsPreviewResponse,
  PredictionsResponse,
} from './prediction/types';
import type { PlayerPosition } from './types';

type MappedPlayer = NonNullable<
  Awaited<ReturnType<typeof loadPredictionsForEvent>>
>['players'][number];

async function loadPredictionsForEvent(event: number) {
  const [run] = await db
    .select()
    .from(predModelRun)
    .where(
      and(eq(predModelRun.kind, 'score'), eq(predModelRun.targetEvent, event)),
    )
    .orderBy(desc(predModelRun.createdAt))
    .limit(1);

  if (!run) {
    return { event, modelRunId: null as string | null, ready: false, players: [] as MappedPlayer[] };
  }

  const rows = await db
    .select()
    .from(predPlayerGw)
    .where(eq(predPlayerGw.modelRunId, run.id));

  if (rows.length === 0) {
    return { event, modelRunId: run.id, ready: false, players: [] as MappedPlayer[] };
  }

  const bootstrap = await getOrFetchBootstrap(db);
  const codeToElement = new Map(
    bootstrap.elements.map((el) => [
      el.code,
      { id: el.id, position: ELEMENT_TYPE_TO_POSITION[el.element_type] ?? 'GK' },
    ]),
  );

  const players = rows
    .map((r) => {
      const el = codeToElement.get(r.fplCode);
      if (!el) return null;
      return {
        fplCode: r.fplCode,
        playerId: el.id,
        position: el.position,
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

function emptyByXPts(): PredictionsPreviewByPosition {
  return { FWD: [], MID: [], DEF: [], GK: [] };
}

function emptyByXAssists(): AssistsPreviewByPosition {
  return { FWD: [], MID: [], DEF: [] };
}

function topByPosition(
  players: MappedPlayer[],
  positions: PlayerPosition[],
  metric: 'xPts' | 'xAssists',
): PredictionsPreviewByPosition | AssistsPreviewByPosition {
  const out: Record<string, MappedPlayer[]> = {};
  for (const pos of positions) {
    out[pos] = players
      .filter((p) => p.position === pos)
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, PREVIEW_PLAYER_LIMIT)
      .map(({ position: _position, ...player }) => player);
  }
  return out as PredictionsPreviewByPosition | AssistsPreviewByPosition;
}

export async function getPredictionsForEvent(
  event: number,
): Promise<PredictionsResponse> {
  const loaded = await loadPredictionsForEvent(event);
  return {
    event: loaded.event,
    modelRunId: loaded.modelRunId,
    ready: loaded.ready,
    players: loaded.players.map(({ position: _position, ...player }) => player),
  };
}

export async function getPredictionsPreviewForEvent(
  event: number,
): Promise<PredictionsPreviewResponse> {
  const loaded = await loadPredictionsForEvent(event);
  if (!loaded.ready) {
    return {
      event: loaded.event,
      modelRunId: loaded.modelRunId,
      ready: false,
      byXPts: emptyByXPts(),
      byXAssists: emptyByXAssists(),
    };
  }

  return {
    event: loaded.event,
    modelRunId: loaded.modelRunId,
    ready: true,
    byXPts: topByPosition(
      loaded.players,
      POINTS_PREVIEW_POSITIONS,
      'xPts',
    ) as PredictionsPreviewByPosition,
    byXAssists: topByPosition(
      loaded.players,
      ASSIST_PREVIEW_POSITIONS,
      'xAssists',
    ) as AssistsPreviewByPosition,
  };
}
