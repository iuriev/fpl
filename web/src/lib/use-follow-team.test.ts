import { act,renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useFollowTeam } from './use-follow-team';

const mockRepo = {
  has: vi.fn().mockResolvedValue(false),
  add: vi.fn(),
  remove: vi.fn(),
  list: vi.fn(),
  getLimit: vi.fn().mockReturnValue(2),
  invalidateCache: vi.fn(),
};

vi.mock('./watchlist-repository', () => ({
  useWatchlistRepository: () => mockRepo,
}));

describe('useFollowTeam', () => {
  it('calls onLimit when add returns limit', async () => {
    mockRepo.add.mockResolvedValueOnce('limit');
    const onLimit = vi.fn();

    const { result } = renderHook(() => useFollowTeam(123, true, onLimit));

    await act(async () => {
      await result.current.toggle();
    });

    expect(onLimit).toHaveBeenCalledOnce();
    expect(result.current.limitReached).toBe(true);
    expect(result.current.following).toBe(false);
  });
});
