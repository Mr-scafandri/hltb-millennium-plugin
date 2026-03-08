import { callable } from '@steambrew/client';
import type { HltbGameResult, CacheEntry } from '../types';
import { log, logError } from './logger';

const GetAllCachedResults = callable<[], string>('GetAllCachedResults');

// In-memory map populated from backend at startup
const cacheMap = new Map<number, CacheEntry>();

export async function initCache(): Promise<void> {
  try {
    const resultJson = await GetAllCachedResults();
    if (!resultJson) return;

    const result = JSON.parse(resultJson);
    if (!result.success || !result.data) return;

    let count = 0;
    for (const [key, entry] of Object.entries(result.data)) {
      const appId = Number(key);
      if (!isNaN(appId) && entry && typeof entry === 'object') {
        cacheMap.set(appId, entry as CacheEntry);
        count++;
      }
    }

    log('Cache initialized with', count, 'entries');
  } catch (e) {
    logError('Cache init error:', e);
  }
}

export function getCache(appId: number): CacheEntry | null {
  return cacheMap.get(appId) ?? null;
}

export function updateLocalCache(appId: number, data: HltbGameResult | null): void {
  cacheMap.set(appId, {
    data,
    timestamp: Date.now() / 1000, // seconds to match backend
    notFound: data === null,
  });
}

export function clearCache(): void {
  cacheMap.clear();
}

export function getCacheStats(): { count: number; oldestTimestamp: number | null } {
  if (cacheMap.size === 0) return { count: 0, oldestTimestamp: null };

  let oldest: number | null = null;
  for (const entry of cacheMap.values()) {
    if (oldest === null || entry.timestamp < oldest) {
      oldest = entry.timestamp;
    }
  }

  return { count: cacheMap.size, oldestTimestamp: oldest };
}
