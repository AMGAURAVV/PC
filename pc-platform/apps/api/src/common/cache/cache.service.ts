import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry<any>>();

  /**
   * Get an item from cache, or return null if not found or expired.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set an item in the cache with a TTL (seconds) and optional invalidation tags.
   */
  set<T>(key: string, value: T, ttlSeconds: number = 60, tags: string[] = []): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, {
      value,
      expiresAt,
      tags,
    });
  }

  /**
   * Delete a specific cache key.
   */
  del(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidate all cache keys containing a specific prefix.
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Invalidate all cache keys tagged with a given tag.
   */
  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Flush the entire cache.
   */
  flush(): void {
    this.store.clear();
  }

  /**
   * Helper to get or set cache value atomically.
   */
  async wrap<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 60,
    tags: string[] = [],
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await factory();
    this.set(key, fresh, ttlSeconds, tags);
    return fresh;
  }
}
