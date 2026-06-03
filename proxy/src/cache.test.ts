import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cache from './cache';

describe('Cache', () => {
  beforeEach(() => {
    cache.set('key1', 'value1', 100);
  });

  describe('get and set', () => {
    it('stores and retrieves values', () => {
      cache.set('test-key', 'test-value', 100);
      const result = cache.get('test-key');
      expect(result).toBe('test-value');
    });

    it('returns null for missing key', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('handles complex objects', () => {
      const obj = { id: 1, name: 'Test', items: [1, 2, 3] };
      cache.set('obj-key', obj, 100);
      const result = cache.get('obj-key');
      expect(result).toEqual(obj);
    });

    it('expires entries after TTL', () => {
      vi.useFakeTimers();
      cache.set('expiring-key', 'value', 1);
      expect(cache.get('expiring-key')).toBe('value');

      vi.advanceTimersByTime(1100);
      expect(cache.get('expiring-key')).toBeNull();

      vi.useRealTimers();
    });

    it('returns null consistently for expired keys', () => {
      vi.useFakeTimers();
      cache.set('expiring-key', 'value', 1);

      vi.advanceTimersByTime(1100);
      expect(cache.get('expiring-key')).toBeNull();
      expect(cache.get('expiring-key')).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('TTL constants', () => {
    it('defines correct TTL values', () => {
      expect(cache.ttl.ENTRY).toBe(86400);
      expect(cache.ttl.FIXTURES).toBe(3600);
      expect(cache.ttl.PLAYER_POOL).toBe(3600);
    });
  });
});
