import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TransferDraft } from '@/types';

import {
  ApiTransferDraftRepository,
  migrateLocalDraftOnce,
  resolveTransferDraft,
} from './transfer-draft-repository';

const draft: TransferDraft = {
  teamId: 123,
  targetGw: 6,
  savedAt: '2026-06-02T10:00:00.000Z',
  freeTransfers: 1,
  chip: 'none',
  swaps: [],
  subs: [],
};

describe('ApiTransferDraftRepository', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('load returns null on 404', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }));
    const repo = new ApiTransferDraftRepository();
    await expect(repo.load()).resolves.toBeNull();
  });

  it('save sends PUT with draft body', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(draft), { status: 200 }));
    const repo = new ApiTransferDraftRepository();
    await repo.save(draft);
    expect(fetch).toHaveBeenCalledWith(
      '/api/me/transfer-draft',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(draft) }),
    );
  });

  it('clear sends DELETE', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    const repo = new ApiTransferDraftRepository();
    await repo.clear();
    expect(fetch).toHaveBeenCalledWith(
      '/api/me/transfer-draft',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('migrateLocalDraftOnce', () => {
  beforeEach(() => localStorage.removeItem('fpl-transfer-draft-123'));
  afterEach(() => localStorage.removeItem('fpl-transfer-draft-123'));

  it('uploads local draft when server has none', async () => {
    localStorage.setItem('fpl-transfer-draft-123', JSON.stringify(draft));
    const repo = {
      load: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn(),
    };
    const result = await migrateLocalDraftOnce(123, 6, repo);
    expect(result).toEqual(draft);
    expect(repo.save).toHaveBeenCalledWith(draft);
    expect(localStorage.getItem('fpl-transfer-draft-123')).toBeNull();
  });
});

describe('resolveTransferDraft', () => {
  it('clears stale server draft and returns staleGw', async () => {
    const repo = {
      load: vi.fn().mockResolvedValue({ ...draft, targetGw: 5 }),
      save: vi.fn(),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const result = await resolveTransferDraft(123, 6, repo);
    expect(repo.clear).toHaveBeenCalled();
    expect(result).toEqual({ draft: null, staleGw: 5, fromSaved: false });
  });
});
