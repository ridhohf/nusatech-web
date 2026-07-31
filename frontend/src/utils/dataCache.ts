type CacheItem = {
  data: any;
  timestamp: number;
};

const cacheMap = new Map<string, CacheItem>();

export const dataCache = {
  /**
   * Get cached data if available and not expired (default TTL: 5 minutes)
   */
  get<T = any>(key: string, maxAgeMs = 5 * 60 * 1000): T | null {
    const item = cacheMap.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > maxAgeMs) {
      cacheMap.delete(key);
      return null;
    }
    return item.data as T;
  },

  /**
   * Store data in memory cache
   */
  set(key: string, data: any): void {
    cacheMap.set(key, {
      data,
      timestamp: Date.now(),
    });
  },

  /**
   * Invalidate specific cache key or all keys matching a prefix
   */
  invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      cacheMap.clear();
      return;
    }
    for (const key of cacheMap.keys()) {
      if (key.startsWith(keyPrefix)) {
        cacheMap.delete(key);
      }
    }
  },
};
