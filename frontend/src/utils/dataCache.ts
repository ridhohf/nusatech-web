type CacheItem = {
  data: any;
  timestamp: number;
};

// Fallback in-memory map for SSR
const memoryMap = new Map<string, CacheItem>();

export const dataCache = {
  /**
   * Get cached data from localStorage (or memory during SSR).
   * Survives browser refreshes and page switches permanently.
   */
  get<T = any>(key: string, maxAgeMs = 30 * 60 * 1000): T | null {
    if (typeof window === 'undefined') {
      const item = memoryMap.get(key);
      if (!item || Date.now() - item.timestamp > maxAgeMs) return null;
      return item.data as T;
    }

    try {
      const raw = localStorage.getItem(`nusa_cache_${key}`);
      if (!raw) return null;
      const item: CacheItem = JSON.parse(raw);
      if (Date.now() - item.timestamp > maxAgeMs) {
        localStorage.removeItem(`nusa_cache_${key}`);
        return null;
      }
      return item.data as T;
    } catch {
      return null;
    }
  },

  /**
   * Store data in localStorage cache
   */
  set(key: string, data: any): void {
    if (typeof window === 'undefined') {
      memoryMap.set(key, { data, timestamp: Date.now() });
      return;
    }

    try {
      localStorage.setItem(`nusa_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('localStorage cache quota exceeded', e);
    }
  },

  /**
   * Invalidate specific cache key or all keys matching a prefix
   */
  invalidate(keyPrefix?: string): void {
    if (typeof window === 'undefined') {
      memoryMap.clear();
      return;
    }

    try {
      if (!keyPrefix) {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('nusa_cache_')) localStorage.removeItem(k);
        });
        return;
      }

      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(`nusa_cache_${keyPrefix}`)) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {
      console.error(e);
    }
  },
};
