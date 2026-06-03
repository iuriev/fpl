export type TransferChip = 'none' | 'wildcard' | 'freehit';

export interface TransferSwap {
  outId: number;
  inId: number;
}

export interface SubSwap {
  fieldId: number;
  benchId: number;
}

export interface TransferDraft {
  teamId: number;
  targetGw: number;
  savedAt: string;
  freeTransfers: number;
  chip: TransferChip;
  swaps: TransferSwap[];
  subs: SubSwap[];
}

const CHIPS: TransferChip[] = ['none', 'wildcard', 'freehit'];

export function parseTransferDraftBody(body: unknown): TransferDraft | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const teamId = Number(o.teamId);
  const targetGw = Number(o.targetGw);
  const freeTransfers = Number(o.freeTransfers);
  if (!Number.isInteger(teamId) || teamId <= 0) return null;
  if (!Number.isInteger(targetGw) || targetGw <= 0) return null;
  if (!Number.isInteger(freeTransfers) || freeTransfers < 0) return null;
  if (typeof o.savedAt !== 'string' || !o.savedAt) return null;
  if (typeof o.chip !== 'string' || !CHIPS.includes(o.chip as TransferChip)) return null;
  if (!Array.isArray(o.swaps) || !Array.isArray(o.subs)) return null;
  const swaps: TransferSwap[] = [];
  for (const item of o.swaps) {
    if (!item || typeof item !== 'object') return null;
    const s = item as Record<string, unknown>;
    const outId = Number(s.outId);
    const inId = Number(s.inId);
    if (!Number.isInteger(outId) || outId <= 0 || !Number.isInteger(inId) || inId <= 0) return null;
    swaps.push({ outId, inId });
  }
  const subs: SubSwap[] = [];
  for (const item of o.subs) {
    if (!item || typeof item !== 'object') return null;
    const s = item as Record<string, unknown>;
    const fieldId = Number(s.fieldId);
    const benchId = Number(s.benchId);
    if (!Number.isInteger(fieldId) || fieldId <= 0 || !Number.isInteger(benchId) || benchId <= 0) {
      return null;
    }
    subs.push({ fieldId, benchId });
  }
  return {
    teamId,
    targetGw,
    savedAt: o.savedAt,
    freeTransfers,
    chip: o.chip as TransferChip,
    swaps,
    subs,
  };
}

export function rowToTransferDraft(row: {
  teamId: number;
  targetGw: number;
  savedAt: Date;
  freeTransfers: number;
  chip: string;
  swaps: unknown;
  subs: unknown;
}): TransferDraft {
  return {
    teamId: row.teamId,
    targetGw: row.targetGw,
    savedAt: row.savedAt.toISOString(),
    freeTransfers: row.freeTransfers,
    chip: row.chip as TransferChip,
    swaps: row.swaps as TransferSwap[],
    subs: row.subs as SubSwap[],
  };
}

export function draftToRow(userId: string, draft: TransferDraft) {
  return {
    userId,
    teamId: draft.teamId,
    targetGw: draft.targetGw,
    savedAt: new Date(draft.savedAt),
    freeTransfers: draft.freeTransfers,
    chip: draft.chip,
    swaps: draft.swaps,
    subs: draft.subs,
    updatedAt: new Date(),
  };
}
