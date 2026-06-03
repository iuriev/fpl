import type { TransferDraft } from '@/types';

import { readLocalDraft, removeLocalDraft } from './transfer-draft';

export interface TransferDraftRepository {
  load(): Promise<TransferDraft | null>;
  save(draft: TransferDraft): Promise<void>;
  clear(): Promise<void>;
}

export class ApiTransferDraftRepository implements TransferDraftRepository {
  async load(): Promise<TransferDraft | null> {
    const res = await fetch('/api/me/transfer-draft', { credentials: 'include' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Transfer draft fetch failed: ${res.status}`);
    const data = (await res.json()) as TransferDraft;
    return { ...data, subs: data.subs ?? [] };
  }

  async save(draft: TransferDraft): Promise<void> {
    const res = await fetch('/api/me/transfer-draft', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (!res.ok) throw new Error(`Transfer draft save failed: ${res.status}`);
  }

  async clear(): Promise<void> {
    const res = await fetch('/api/me/transfer-draft', {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Transfer draft delete failed: ${res.status}`);
    }
  }
}

export async function migrateLocalDraftOnce(
  teamId: number,
  nextGw: number,
  repo: TransferDraftRepository,
): Promise<TransferDraft | null> {
  const local = readLocalDraft(teamId);
  removeLocalDraft(teamId);
  if (!local) return null;

  if (local.targetGw !== nextGw) return null;

  const server = await repo.load();
  if (!server) {
    await repo.save(local);
    return local;
  }

  const localTime = Date.parse(local.savedAt);
  const serverTime = Date.parse(server.savedAt);
  if (localTime > serverTime) {
    await repo.save(local);
    return local;
  }
  return server;
}

export async function resolveTransferDraft(
  teamId: number,
  nextGw: number,
  repo: TransferDraftRepository,
): Promise<{ draft: TransferDraft | null; staleGw: number | null; fromSaved: boolean }> {
  const loaded = await repo.load();

  if (loaded && loaded.targetGw !== nextGw) {
    await repo.clear();
    return { draft: null, staleGw: loaded.targetGw, fromSaved: false };
  }

  if (loaded) {
    return { draft: loaded, staleGw: null, fromSaved: true };
  }

  const localStale = readLocalDraft(teamId);
  if (localStale && localStale.targetGw !== nextGw) {
    removeLocalDraft(teamId);
    return { draft: null, staleGw: localStale.targetGw, fromSaved: false };
  }

  const imported = await migrateLocalDraftOnce(teamId, nextGw, repo);
  if (imported) {
    return { draft: imported, staleGw: null, fromSaved: true };
  }

  return { draft: null, staleGw: null, fromSaved: false };
}
