/**
 * Brain routing performance cache — bounded LRU with hit/miss stats.
 */

import type { SelectedCapability } from './general-question-types.js';

export interface CachedRoutingDecision {
  selectedCapabilities: SelectedCapability[];
  unavailableCapabilities: SelectedCapability[];
  primaryCapability: SelectedCapability | null;
  secondaryCapabilities: SelectedCapability[];
  routingReason: string;
}

export const MAX_CACHE_SIZE = 512;

export interface RoutingPerformanceCacheStats {
  capabilityLookupHits: number;
  capabilityLookupMisses: number;
  ownershipLookupHits: number;
  ownershipLookupMisses: number;
  routingDecisionHits: number;
  routingDecisionMisses: number;
  capabilityLookupSize: number;
  ownershipLookupSize: number;
  routingDecisionSize: number;
}

interface LruEntry<T> {
  key: string;
  value: T;
}

function clonePlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createLruCache<T>(maxSize: number) {
  const map = new Map<string, T>();
  let hits = 0;
  let misses = 0;

  function touch(key: string, value: T): void {
    if (map.has(key)) map.delete(key);
    map.set(key, value);
    while (map.size > maxSize) {
      const oldest = map.keys().next().value;
      if (oldest === undefined) break;
      map.delete(oldest);
    }
  }

  return {
    get(key: string): T | undefined {
      const hit = map.get(key);
      if (hit === undefined) {
        misses += 1;
        return undefined;
      }
      hits += 1;
      map.delete(key);
      map.set(key, hit);
      return hit;
    },
    set(key: string, value: T): void {
      touch(key, value);
    },
    clear(): void {
      map.clear();
    },
    size(): number {
      return map.size;
    },
    stats(): { hits: number; misses: number } {
      return { hits, misses };
    },
  };
}

const capabilityLookupCache = createLruCache<SelectedCapability[]>(MAX_CACHE_SIZE);
const ownershipLookupCache = createLruCache<unknown>(MAX_CACHE_SIZE);
const routingDecisionCache = createLruCache<CachedRoutingDecision>(MAX_CACHE_SIZE);

export function getCachedCapabilityLookup(key: string): SelectedCapability[] | undefined {
  const hit = capabilityLookupCache.get(key);
  return hit ? [...hit] : undefined;
}

export function setCachedCapabilityLookup(key: string, capabilities: SelectedCapability[]): void {
  capabilityLookupCache.set(key, [...capabilities]);
}

export function getCachedOwnershipLookup(key: string): unknown | undefined {
  const hit = ownershipLookupCache.get(key);
  return hit !== undefined ? clonePlainObject(hit) : undefined;
}

export function setCachedOwnershipLookup(key: string, record: unknown): void {
  ownershipLookupCache.set(key, clonePlainObject(record));
}

export function getCachedRoutingDecision(key: string): CachedRoutingDecision | undefined {
  const hit = routingDecisionCache.get(key);
  return hit ? clonePlainObject(hit) : undefined;
}

export function setCachedRoutingDecision(key: string, decision: CachedRoutingDecision): void {
  routingDecisionCache.set(key, clonePlainObject(decision));
}

export function clearRoutingPerformanceCache(): void {
  capabilityLookupCache.clear();
  ownershipLookupCache.clear();
  routingDecisionCache.clear();
}

export function getRoutingPerformanceCacheStats(): RoutingPerformanceCacheStats {
  const cap = capabilityLookupCache.stats();
  const own = ownershipLookupCache.stats();
  const route = routingDecisionCache.stats();
  return {
    capabilityLookupHits: cap.hits,
    capabilityLookupMisses: cap.misses,
    ownershipLookupHits: own.hits,
    ownershipLookupMisses: own.misses,
    routingDecisionHits: route.hits,
    routingDecisionMisses: route.misses,
    capabilityLookupSize: capabilityLookupCache.size(),
    ownershipLookupSize: ownershipLookupCache.size(),
    routingDecisionSize: routingDecisionCache.size(),
  };
}
