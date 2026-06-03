import { describe, expect, it } from 'vitest';

import { parseTransferDraftBody, rowToTransferDraft } from './transfer-draft';

describe('parseTransferDraftBody', () => {
  const valid = {
    teamId: 72828,
    targetGw: 10,
    savedAt: '2026-06-01T12:00:00.000Z',
    freeTransfers: 1,
    chip: 'none',
    swaps: [{ outId: 1, inId: 2 }],
    subs: [{ fieldId: 3, benchId: 4 }],
  };

  it('accepts a valid draft', () => {
    expect(parseTransferDraftBody(valid)).toEqual(valid);
  });

  it('rejects invalid chip', () => {
    expect(parseTransferDraftBody({ ...valid, chip: 'bboost' })).toBeNull();
  });

  it('rejects invalid swap', () => {
    expect(parseTransferDraftBody({ ...valid, swaps: [{ outId: 0, inId: 1 }] })).toBeNull();
  });
});

describe('rowToTransferDraft', () => {
  it('serializes savedAt as ISO string', () => {
    const draft = rowToTransferDraft({
      teamId: 1,
      targetGw: 2,
      savedAt: new Date('2026-01-01T00:00:00.000Z'),
      freeTransfers: 2,
      chip: 'wildcard',
      swaps: [],
      subs: [],
    });
    expect(draft.savedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});
