import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

@Injectable()
export class CacheService {
  private cache = new LRUCache<string, any>({
    max: 500,
    ttl: 1000 * 60 * 5, // 5 minutos — igual que TTLCache(maxsize=500, ttl=300)
  });

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, value: any) {
    this.cache.set(key, value);
  }

  invalidate(...keys: string[]) {
    keys.forEach((k) => this.cache.delete(k));
  }

  invalidatePrefix(prefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }
}
